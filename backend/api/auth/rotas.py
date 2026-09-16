from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from google.oauth2 import id_token
from google.auth.transport import requests
import os
import re
import jwt
import bcrypt
from datetime import datetime, timedelta, timezone

from dependencias import obter_banco_de_dados
from models import Pessoa, MembroOrganizacao, AssinaturaSaaS
from api.auth.dependencias import obter_usuario_logado
from api.auth.senha_policy import validar_forca_senha

router = APIRouter(prefix="/auth", tags=["Autenticação"])

# Configurações do JWT
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "minha_chave_super_secreta_sigma_2")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Módulos que não exigem assinatura ativa para funcionar (uso livre), mesmo
# que a organização não tenha nenhum plano SaaS pago. Definido em 2026-09-11
# como parte da padronização de comunicação entre módulos via API: qualquer
# módulo satélite (CoReVM, Lojas, Harmonia, Tesouraria, Biblioteca...) chama
# GET /api/v1/auth/validate para saber quais módulos estão liberados para o
# usuário/organização do token, em vez de acessar o banco do e-Sigma direto.
MODULOS_DE_USO_LIVRE = ["corevm"]

# REMOVIDO (2026-09-16, mesmo dia em que foi criado): o fluxo de "Ativação
# de Cadastro" (POST /auth/ativacao-cadastro/solicitar-codigo e /confirmar)
# permitia que qualquer Pessoa sem senha se auto-ativasse só provando
# controle do próprio e-mail — combinado com o fato de POST /pessoas/ ser
# uma rota aberta (também corrigido nesta sessão, ver
# api/pessoas/rotas.py), isso recriava a Via 2 (cadastro de candidato novo)
# sem NENHUMA validação humana, contrariando a concepção original do
# e-Sigma. Substituído pela Solicitação de Cadastro (ver
# api/solicitacoes_cadastro/) — formulário público que cai numa fila,
# aprovado por um humano, e só então uma Pessoa é criada com senha
# provisória enviada por e-mail. Ver seção 12 de
# claude/decisao-controle-acesso-cadastro.md para o histórico completo.

# Pydantic schemas
class GoogleAuthRequest(BaseModel):
    credential: str
    modulo_origem: Optional[str] = None

class LoginRequest(BaseModel):
    # ALTERAÇÃO (2026-09-14): campo `username` continua com este nome por
    # compatibilidade (é o que todo frontend do ecossistema já envia — e-Sigma,
    # CoReVM, Lojas e demais módulos satélites), mas agora aceita e-mail, CIM
    # ou CPF — ver `_resolver_pessoa_por_identificador` abaixo. Concepção
    # aplicada aqui na origem (e-Sigma é o único IdP real do ecossistema — os
    # módulos satélites nunca autenticam localmente, só validam o token via
    # GET /auth/validate), então cobre automaticamente todo login feito por
    # qualquer módulo satélite, sem precisar duplicar essa lógica em cada um.
    username: str
    password: str
    modulo_origem: Optional[str] = None


class TrocarSenhaObrigatoriaRequest(BaseModel):
    """Criado em 2026-09-16 junto com a Solicitação de Cadastro (Via 2) —
    quando uma Pessoa é criada a partir de uma solicitação aprovada, ela
    recebe uma senha provisória gerada pelo sistema por e-mail
    (`Pessoa.deve_trocar_senha = True`). Este endpoint exige a senha atual
    (a provisória, no primeiro uso) e define a nova."""
    senha_atual: str
    nova_senha: str


class UsuarioValidadoResponse(BaseModel):
    email: Optional[str] = None
    user_id: Optional[str] = None
    role: Optional[str] = None
    organizacao_id: Optional[str] = None
    # Adicionados em 2026-09-11: módulos satélites como o CoReVM identificam
    # seus próprios registros de negócio por CIM/CPF (não por UUID/e-mail do
    # e-Sigma), então o endpoint de validação também retorna esses dados de
    # identidade maçônica quando disponíveis, evitando que cada módulo
    # satélite precise consultar o banco `esigma` diretamente só para
    # descobrir o CIM/CPF de quem está autenticado.
    cim: Optional[str] = None
    cpf: Optional[str] = None

class ValidacaoTokenResponse(BaseModel):
    valido: bool
    usuario: UsuarioValidadoResponse
    modulos_ativos: List[str]


def _obter_modulos_ativos(db: Session, organizacao_id: Optional[str]) -> List[str]:
    """Calcula a lista de módulos liberados para uma organização, combinando
    os módulos de uso livre (sempre liberados) com os módulos contratados na
    assinatura SaaS ativa da organização (se houver).

    Centralizar esse cálculo aqui (em vez de repeti-lo em cada módulo
    satélite) é o objetivo da padronização de API: os módulos satélites não
    devem mais consultar o banco `esigma`/`AssinaturaSaaS` diretamente para
    decidir se uma funcionalidade está liberada.
    """
    modulos_ativos = set(MODULOS_DE_USO_LIVRE)
    if organizacao_id:
        assinatura = (
            db.query(AssinaturaSaaS)
            .filter(
                AssinaturaSaaS.organizacao_id == organizacao_id,
                AssinaturaSaaS.status == "ATIVA",
            )
            .first()
        )
        if assinatura and assinatura.plano:
            modulos_ativos.update(assinatura.plano.modulos_inclusos or [])
    return sorted(modulos_ativos)


# ALTERAÇÃO (2026-09-14): login por e-mail, CIM ou CPF (pedido do usuário —
# "o Core só aceita e-mail... vamos alterar para que aceite e-mail, CIM ou
# CPF"). Como o e-Sigma é o único ponto real de autenticação do ecossistema
# (módulos satélites como CoReVM e Lojas nunca validam senha localmente,
# só repassam o Bearer token para GET /auth/validate), corrigir aqui resolve
# para todos os módulos de uma vez — nenhum satélite precisa de mudança
# própria de backend, só de UI (rótulo/placeholder do campo de login).
def _resolver_pessoa_por_identificador(db: Session, identificador: str) -> Optional[Pessoa]:
    """
    Resolve a `Pessoa` que está tentando logar a partir de um identificador
    livre, tentando em ordem: e-mail (se contiver "@"), CPF (11 dígitos após
    remover máscara) e por último CIM (comparação exata contra o valor
    guardado em `dados_especificos->>'cim'`, ver `Pessoa.cim` — é uma
    propriedade sobre JSONB, não uma coluna SQL simples, então a consulta
    precisa usar o operador JSONB `.astext` em vez de um filtro comum).
    """
    identificador = (identificador or "").strip()
    if not identificador:
        return None

    if "@" in identificador:
        return db.query(Pessoa).filter(Pessoa.email == identificador.lower()).first()

    apenas_digitos = re.sub(r"\D", "", identificador)

    if len(apenas_digitos) == 11:
        pessoa = db.query(Pessoa).filter(Pessoa.cpf == apenas_digitos).first()
        if pessoa:
            return pessoa

    # CIM: normalmente numérico, mas comparado como string exata (é assim
    # que é gravado em dados_especificos). Tenta com o valor original E com a
    # versão só-dígitos, para não depender de o usuário digitar zeros à
    # esquerda ou não.
    pessoa = db.query(Pessoa).filter(
        Pessoa.dados_especificos['cim'].astext == identificador
    ).first()
    if pessoa:
        return pessoa
    if apenas_digitos and apenas_digitos != identificador:
        pessoa = db.query(Pessoa).filter(
            Pessoa.dados_especificos['cim'].astext == apenas_digitos
        ).first()
        if pessoa:
            return pessoa

    # Fallback final: CPF com tamanho fora do padrão (ex.: digitado com menos
    # de 11 dígitos por engano) — melhor tentar do que recusar de cara.
    if apenas_digitos:
        return db.query(Pessoa).filter(Pessoa.cpf == apenas_digitos).first()

    return None


def create_access_token(data: dict):
    to_encode = data.copy()
    # Tratando deprecation warning utcnow() para now(UTC)
    from datetime import timezone
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire.timestamp()})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/google")
async def login_with_google(request: GoogleAuthRequest, db: Session = Depends(obter_banco_de_dados)):
    CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "COLOQUE_SEU_CLIENT_ID_AQUI")
    try:
        # Verificar o token com o Google
        idinfo = id_token.verify_oauth2_token(
            request.credential,
            requests.Request(),
            CLIENT_ID,
            clock_skew_in_seconds=10
        )

        email = idinfo.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Token do Google não contém e-mail.")

        # Buscar o usuário pelo e-mail no Banco de Dados
        user = db.query(Pessoa).filter(Pessoa.email == email).first()
        if not user:
            raise HTTPException(status_code=401, detail="Usuário não cadastrado no Sigma.")

        # Tratamento das roles lidas do JSONB
        permissoes = user.permissoes_sistema or []
        role_primaria = "member"
        if "super_admin" in permissoes:
            role_primaria = "super_admin"
        elif "webmaster" in permissoes:
            role_primaria = "webmaster"

        # Buscar a loja primária do usuário
        vinculo = db.query(MembroOrganizacao).filter(MembroOrganizacao.pessoa_id == user.id, MembroOrganizacao.status == "ATIVO").first()
        loja_id = str(vinculo.organizacao_id) if vinculo else None

        modulos_ativos = _obter_modulos_ativos(db, loja_id)
        # Mantido por compatibilidade: apps antigos (ex.: Harmonia) ainda leem
        # esta claim específica em vez da lista genérica `modulos_ativos`.
        harmonia_ativo = "harmonia" in modulos_ativos

        # Gerar o JWT do Sigma 2.0
        token_payload = {
            "sub": user.email,
            "user_id": str(user.id),
            "loja_id": loja_id,
            "harmonia_ativo": harmonia_ativo,
            "modulos_ativos": modulos_ativos,
            "role": role_primaria,
            "requires_selection": False,
            "modulo_origem": request.modulo_origem
        }

        access_token = create_access_token(token_payload)
        return {
            "access_token": access_token,
            "token_type": "bearer",
            # 2026-09-16: ver comentário equivalente em login_tradicional.
            "deve_trocar_senha": bool(user.deve_trocar_senha),
        }

    except ValueError as e:
        # Invalid token
        raise HTTPException(status_code=401, detail=f"Token do Google inválido: {str(e)}")

@router.post("/login")
async def login_tradicional(request: LoginRequest, db: Session = Depends(obter_banco_de_dados)):
    # ALTERAÇÃO (2026-09-14): aceita e-mail, CIM ou CPF no mesmo campo
    # `username` — ver `_resolver_pessoa_por_identificador`.
    user = _resolver_pessoa_por_identificador(db, request.username)

    if not user or not user.senha_hash:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    senha_valida = False
    try:
        senha_valida = bcrypt.checkpw(request.password.encode('utf-8'), user.senha_hash.encode('utf-8'))
    except ValueError:
        raise HTTPException(status_code=401, detail="Hash de senha em formato inválido no banco de dados.")

    if not senha_valida:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    permissoes = user.permissoes_sistema or []
    role_primaria = "member"
    if "super_admin" in permissoes:
        role_primaria = "super_admin"
    elif "webmaster" in permissoes:
        role_primaria = "webmaster"

    # Buscar a loja primária do usuário (assumindo a primeira ativa que ele tiver)
    vinculo = db.query(MembroOrganizacao).filter(MembroOrganizacao.pessoa_id == user.id, MembroOrganizacao.status == "ATIVO").first()
    loja_id = str(vinculo.organizacao_id) if vinculo else None

    modulos_ativos = _obter_modulos_ativos(db, loja_id)
    # Mantido por compatibilidade: apps antigos (ex.: Harmonia) ainda leem
    # esta claim específica em vez da lista genérica `modulos_ativos`.
    harmonia_ativo = "harmonia" in modulos_ativos

    token_payload = {
        "sub": user.email,
        "user_id": str(user.id),
        "loja_id": loja_id,
        "harmonia_ativo": harmonia_ativo,
        "modulos_ativos": modulos_ativos,
        "role": role_primaria,
        "requires_selection": False,
        "modulo_origem": request.modulo_origem
    }

    access_token = create_access_token(token_payload)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        # 2026-09-16: True quando esta Pessoa nasceu de uma Solicitação de
        # Cadastro aprovada e ainda está usando a senha provisória enviada
        # por e-mail (ver api/solicitacoes_cadastro/servicos.py) — o
        # frontend deve redirecionar para a troca obrigatória
        # (POST /auth/trocar-senha-obrigatoria) em vez do painel normal.
        "deve_trocar_senha": bool(user.deve_trocar_senha),
    }


@router.post(
    "/trocar-senha-obrigatoria",
    summary="Define uma nova senha (troca obrigatória da senha provisória)",
    description=(
        "Usado depois do login com a senha provisória enviada por e-mail "
        "na aprovação de uma Solicitação de Cadastro (ver "
        "api/solicitacoes_cadastro/). Exige a senha atual (a provisória, "
        "no primeiro uso) — não é um endpoint de recuperação de senha "
        "esquecida, é a troca obrigatória do primeiro acesso. Limpa "
        "`deve_trocar_senha` ao final."
    ),
)
async def trocar_senha_obrigatoria(
    request: TrocarSenhaObrigatoriaRequest,
    payload: dict = Depends(obter_usuario_logado),
    db: Session = Depends(obter_banco_de_dados),
):
    user_id = payload.get("user_id")
    pessoa = db.query(Pessoa).filter(Pessoa.id == user_id).first() if user_id else None
    if not pessoa or not pessoa.senha_hash:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    try:
        senha_atual_valida = bcrypt.checkpw(
            request.senha_atual.encode("utf-8"), pessoa.senha_hash.encode("utf-8")
        )
    except ValueError:
        senha_atual_valida = False

    if not senha_atual_valida:
        raise HTTPException(status_code=401, detail="Senha atual incorreta.")

    # ALTERAÇÃO (2026-09-16, pedido explícito do usuário): "quando houver
    # a substituição da senha não aceitar senha fraca" — ver
    # api/auth/senha_policy.py.
    erro_senha = validar_forca_senha(request.nova_senha)
    if erro_senha:
        raise HTTPException(status_code=400, detail=erro_senha)

    pessoa.senha_hash = bcrypt.hashpw(request.nova_senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    pessoa.deve_trocar_senha = False
    db.commit()

    return {"mensagem": "Senha atualizada com sucesso."}


@router.get(
    "/validate",
    response_model=ValidacaoTokenResponse,
    summary="Valida um token do e-Sigma para módulos satélites",
    description=(
        "Endpoint de introspecção de token, criado em 2026-09-11 como parte da "
        "padronização de comunicação entre módulos via API. Qualquer módulo "
        "satélite (CoReVM, Lojas, Harmonia, Tesouraria, Biblioteca etc.) deve "
        "chamar este endpoint repassando o mesmo JWT Bearer que recebeu do "
        "usuário final, em vez de decodificar o token localmente com a chave "
        "secreta compartilhada ou de consultar o banco de dados `esigma` "
        "diretamente. A resposta traz a identidade do usuário (incluindo CIM/"
        "CPF, usados pelos módulos satélites para casar com seus próprios "
        "registros de negócio) e a lista viva de módulos liberados para a "
        "organização dele (recalculada a cada chamada, refletindo "
        "cancelamentos/inadimplência imediatamente, sem esperar um novo login)."
    ),
    responses={
        401: {"description": "Token ausente, expirado ou inválido."},
    },
)
def validar_token(
    payload: dict = Depends(obter_usuario_logado),
    db: Session = Depends(obter_banco_de_dados),
):
    loja_id = payload.get("loja_id")
    modulos_ativos = _obter_modulos_ativos(db, loja_id)

    pessoa = None
    user_id = payload.get("user_id")
    if user_id:
        pessoa = db.query(Pessoa).filter(Pessoa.id == user_id).first()

    return ValidacaoTokenResponse(
        valido=True,
        usuario=UsuarioValidadoResponse(
            email=payload.get("sub"),
            user_id=user_id,
            role=payload.get("role"),
            organizacao_id=loja_id,
            cim=pessoa.cim if pessoa else None,
            cpf=pessoa.cpf if pessoa else None,
        ),
        modulos_ativos=modulos_ativos,
    )
