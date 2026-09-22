from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from google.oauth2 import id_token
from google.auth.transport import requests
import hashlib
import os
import re
import secrets
import jwt
import bcrypt
import json
from datetime import datetime, timedelta, timezone

import webauthn
from webauthn.helpers import bytes_to_base64url, base64url_to_bytes
from webauthn.helpers.structs import (
    PublicKeyCredentialDescriptor,
    UserVerificationRequirement,
    AuthenticatorSelectionCriteria,
    ResidentKeyRequirement,
)
from webauthn.helpers.exceptions import InvalidRegistrationResponse, InvalidAuthenticationResponse

from dependencias import obter_banco_de_dados
from models import DesafioAutenticacao, Pessoa, MembroOrganizacao, AssinaturaSaaS, CredencialPasskey
from api.auth.dependencias import obter_usuario_logado
from api.auth.senha_policy import validar_forca_senha, gerar_senha_provisoria
from api.auth.email_service import enviar_email
from api.auth.rate_limiter import aplicar_rate_limit

router = APIRouter(prefix="/auth", tags=["Autenticação"])

# URL do frontend do CoReVM ("Core") onde o magic link deve aterrissar
# (rota pública /magic-link, ver PaginaConfirmarMagicLink.tsx). Default de
# desenvolvimento; em produção configurar CORE_FRONTEND_URL=
# https://core.e-sigma.app no .env do e-Sigma. Ver
# claude/decisao-modernizacao-login.md no Project "Core", seção sobre
# magic link.
CORE_FRONTEND_URL = os.getenv("CORE_FRONTEND_URL", "http://localhost:5174").rstrip("/")
MAGIC_LINK_VALIDADE_MINUTOS = 15

# ============================================================================
# Passkeys / WebAuthn (2026-09-18) -- ver claude/decisao-modernizacao-login.md,
# seção 4, para o desenho completo e a confirmação do usuário sobre o RP ID.
# ============================================================================
#
# RP ID: domínio registrável compartilhado por TODOS os subdomínios do
# ecossistema -- uma passkey cadastrada em core.e-sigma.app também vale em
# lojas.e-sigma.app etc. IMPORTANTE: o WebAuthn só aceita rp.id = "localhost"
# OU um domínio registrável do qual a origem seja subdomínio -- ou seja,
# testar em http://localhost:5174 (padrão de dev) NÃO funciona com
# rp_id="e-sigma.app". Para testar de verdade, é preciso usar um dos
# subdomínios reais (ambiente de produção/staging) ou apontar um subdomínio
# real para o ambiente local via hosts file + HTTPS local -- não há como
# contornar isso, é regra do próprio navegador/especificação.
PASSKEY_RP_ID = os.getenv("PASSKEY_RP_ID", "e-sigma.app")
PASSKEY_RP_NAME = "Sigma 2.0"
PASSKEY_VALIDADE_CHALLENGE_MINUTOS = 5

# Origens (scheme+host+porta) autorizadas a completar uma cerimônia de
# passkey -- verificado contra o header Origin da requisição, porque a lib
# `webauthn` exige o valor exato esperado em `expected_origin` (não basta o
# RP ID). Configurável via .env para ambientes extras sem precisar editar
# código; lista separada por vírgula.
ORIGENS_PASSKEY_PERMITIDAS = [
    o.strip() for o in os.getenv(
        "ORIGENS_PASSKEY_PERMITIDAS",
        "https://core.e-sigma.app,https://lojas.e-sigma.app,https://e-sigma.app,"
        "https://financeiro.e-sigma.app,https://biblioteca.e-sigma.app,"
        "https://harmonia.e-sigma.app,http://localhost:5174,http://localhost:5175",
    ).split(",") if o.strip()
]


def _origem_passkey_autorizada(http_request: Request) -> str:
    """Valida o header Origin contra a allowlist e devolve o valor exato
    (a lib `webauthn` compara byte a byte contra o que o navegador enviou
    em clientDataJSON.origin -- não dá pra normalizar/adivinhar)."""
    origem = http_request.headers.get("origin")
    if not origem or origem not in ORIGENS_PASSKEY_PERMITIDAS:
        raise HTTPException(
            status_code=400,
            detail="Origem não autorizada para operações de passkey. Configure ORIGENS_PASSKEY_PERMITIDAS se este ambiente for legítimo.",
        )
    return origem

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
class EsqueciSenhaRequest(BaseModel):
    # Mesmo identificador aceito no login (e-mail, CIM ou CPF) — ver
    # _resolver_pessoa_por_identificador abaixo.
    identificador: str


class MagicLinkSolicitarRequest(BaseModel):
    """Ver POST /auth/magic-link/solicitar — mesmo identificador do login
    (e-mail, CIM ou CPF)."""
    identificador: str
    modulo_origem: Optional[str] = None


class MagicLinkConfirmarRequest(BaseModel):
    """Ver POST /auth/magic-link/confirmar — token de uso único recebido
    por e-mail (query string do link, nunca digitado pelo usuário)."""
    token: str
    modulo_origem: Optional[str] = None


class GoogleAuthRequest(BaseModel):
    credential: str
    modulo_origem: Optional[str] = None


class PasskeyRegistroConcluirRequest(BaseModel):
    """Ver POST /auth/passkey/registro/concluir. `credential` é o objeto
    que `@simplewebauthn/browser` (`startRegistration()`) devolve no
    frontend, já serializado em JSON -- repassado como está para
    `webauthn.verify_registration_response`."""
    credential: Dict[str, Any]
    apelido: Optional[str] = None


class PasskeyLoginIniciarRequest(BaseModel):
    """Ver POST /auth/passkey/login/iniciar — mesmo identificador do
    login (e-mail, CIM ou CPF)."""
    identificador: str


class PasskeyLoginConcluirRequest(BaseModel):
    """Ver POST /auth/passkey/login/concluir. `credential` é o objeto que
    `@simplewebauthn/browser` (`startAuthentication()`) devolve."""
    credential: Dict[str, Any]
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


def _gerar_resposta_login(db: Session, pessoa: Pessoa, modulo_origem: Optional[str]) -> dict:
    """Monta o JWT e a resposta de login a partir de uma `Pessoa` já
    autenticada por QUALQUER via (senha, Google, ou magic link) — mesmo
    cálculo de role/loja/módulos ativos já usado em `login_tradicional` e
    `login_with_google`, extraído aqui só para o magic link (2026-09-17,
    ver claude/decisao-modernizacao-login.md) não precisar duplicar pela
    terceira vez. `login_tradicional`/`login_with_google` NÃO foram
    tocados para não arriscar esses dois caminhos já testados."""
    permissoes = pessoa.permissoes_sistema or []
    role_primaria = "member"
    if "super_admin" in permissoes:
        role_primaria = "super_admin"
    elif "webmaster" in permissoes:
        role_primaria = "webmaster"

    vinculo = db.query(MembroOrganizacao).filter(
        MembroOrganizacao.pessoa_id == pessoa.id, MembroOrganizacao.status == "ATIVO"
    ).first()
    loja_id = str(vinculo.organizacao_id) if vinculo else None

    modulos_ativos = _obter_modulos_ativos(db, loja_id)
    harmonia_ativo = "harmonia" in modulos_ativos

    token_payload = {
        "sub": pessoa.email,
        "user_id": str(pessoa.id),
        "loja_id": loja_id,
        "harmonia_ativo": harmonia_ativo,
        "modulos_ativos": modulos_ativos,
        "role": role_primaria,
        "requires_selection": False,
        "modulo_origem": modulo_origem,
    }
    access_token = create_access_token(token_payload)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "deve_trocar_senha": bool(pessoa.deve_trocar_senha),
    }


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
    "/esqueci-senha",
    summary="Recupera acesso de um cadastro existente: gera senha provisoria nova e envia por e-mail",
    description=(
        "Para quem JA TEM cadastro no e-Sigma mas esqueceu a senha (diferente "
        "de POST /trocar-senha-obrigatoria, que exige a senha atual). Aceita "
        "o mesmo identificador do login (e-mail, CIM ou CPF). Se corresponder "
        "a um cadastro ATIVO, gera uma nova senha aleatoria, marca "
        "deve_trocar_senha=True (mesmo fluxo de primeiro acesso ja existente) "
        "e envia a nova senha para o e-mail JA CADASTRADO na Pessoa -- nunca "
        "para um e-mail informado na requisicao, exatamente para nao repetir "
        "o problema de seguranca da extinta 'Ativacao de Cadastro' (ver nota "
        "no topo deste arquivo): aqui nao ha auto-cadastro nem auto-aprovacao, "
        "so a recuperacao de acesso de quem ja passou pela aprovacao humana. "
        "Resposta sempre generica, para nao revelar por esta via se um "
        "identificador corresponde a um cadastro real."
    ),
)
async def esqueci_senha(
    request: EsqueciSenhaRequest,
    http_request: Request,
    db: Session = Depends(obter_banco_de_dados),
):
    ip_cliente = http_request.client.host if http_request.client else "desconhecido"
    # Duplo limite (IP e identificador), mesmo padrao ja usado na
    # Solicitacao de Cadastro (api/solicitacoes_cadastro/servicos.py) --
    # evita tanto spam de e-mail quanto forca bruta de identificador.
    aplicar_rate_limit(f"esqueci-senha:ip:{ip_cliente}", max_tentativas=5, janela_segundos=900)
    aplicar_rate_limit(f"esqueci-senha:id:{request.identificador}", max_tentativas=3, janela_segundos=900)

    resposta_generica = {
        "mensagem": (
            "Se o identificador informado corresponder a um cadastro ativo, "
            "uma nova senha foi enviada para o e-mail cadastrado."
        )
    }

    pessoa = _resolver_pessoa_por_identificador(db, request.identificador)
    if not pessoa or not pessoa.email or pessoa.status_acesso != "ATIVO" or not pessoa.senha_hash:
        # Sem cadastro, sem e-mail para enviar, cadastro inativo, ou Pessoa
        # sem senha (registro sem acesso) -- mesma resposta generica, sem
        # revelar qual foi o motivo.
        return resposta_generica

    nova_senha = gerar_senha_provisoria()
    pessoa.senha_hash = bcrypt.hashpw(nova_senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    pessoa.deve_trocar_senha = True
    db.commit()

    enviar_email(
        destinatario=pessoa.email,
        assunto="Sigma 2.0 - Nova senha de acesso",
        corpo_texto=(
            f"Ola, {pessoa.nome_completo or pessoa.email}.\n\n"
            "Recebemos um pedido de recuperacao de senha para o seu cadastro "
            "no Sigma 2.0. Sua nova senha provisoria e:\n\n"
            f"    {nova_senha}\n\n"
            "Use essa senha para fazer login -- o sistema vai pedir para voce "
            "trocar por uma senha de sua escolha no primeiro acesso.\n\n"
            "Se voce nao pediu essa recuperacao, ignore este e-mail; sua senha "
            "anterior ja nao e mais valida e ninguem alem de voce recebeu esta "
            "mensagem."
        ),
    )

    return resposta_generica


@router.post(
    "/magic-link/solicitar",
    summary="Solicita um link de acesso único por e-mail (login sem senha)",
    description=(
        "Primeiro dos métodos de autenticação moderna decididos em "
        "claude/decisao-modernizacao-login.md (magic link, OTP, passkeys — "
        "só magic link implementado nesta rodada). Aceita o mesmo "
        "identificador do login (e-mail, CIM ou CPF). Se corresponder a um "
        "cadastro ATIVO com e-mail, gera um token de uso único (válido por "
        f"{MAGIC_LINK_VALIDADE_MINUTOS} minutos) e envia um link para o "
        "e-mail JÁ CADASTRADO na Pessoa — nunca para um e-mail informado na "
        "requisição, mesmo princípio anti-sequestro de conta de "
        "/auth/esqueci-senha. Resposta sempre genérica (anti-enumeração)."
    ),
)
async def magic_link_solicitar(
    request: MagicLinkSolicitarRequest,
    http_request: Request,
    db: Session = Depends(obter_banco_de_dados),
):
    ip_cliente = http_request.client.host if http_request.client else "desconhecido"
    aplicar_rate_limit(f"magic-link-solicitar:ip:{ip_cliente}", max_tentativas=5, janela_segundos=900)
    aplicar_rate_limit(f"magic-link-solicitar:id:{request.identificador}", max_tentativas=3, janela_segundos=900)

    resposta_generica = {
        "mensagem": (
            "Se o identificador informado corresponder a um cadastro ativo, "
            "enviamos um link de acesso para o e-mail cadastrado."
        )
    }

    pessoa = _resolver_pessoa_por_identificador(db, request.identificador)
    if not pessoa or not pessoa.email or pessoa.status_acesso != "ATIVO":
        # Mesma cautela de /auth/esqueci-senha: sem cadastro, sem e-mail, ou
        # cadastro inativo -- mesma resposta genérica, sem revelar o motivo.
        return resposta_generica

    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    expira_em = datetime.now(timezone.utc) + timedelta(minutes=MAGIC_LINK_VALIDADE_MINUTOS)

    db.add(
        DesafioAutenticacao(
            pessoa_id=pessoa.id,
            tipo="MAGIC_LINK",
            token_hash=token_hash,
            expira_em=expira_em,
        )
    )
    db.commit()

    link = f"{CORE_FRONTEND_URL}/magic-link?token={token}"
    enviar_email(
        destinatario=pessoa.email,
        assunto="Sigma 2.0 - Seu link de acesso",
        corpo_texto=(
            f"Ola, {pessoa.nome_completo or pessoa.email}.\n\n"
            "Recebemos um pedido de acesso sem senha para o seu cadastro no "
            "Sigma 2.0. Use o link abaixo para entrar -- ele funciona uma "
            f"unica vez e expira em {MAGIC_LINK_VALIDADE_MINUTOS} minutos:\n\n"
            f"    {link}\n\n"
            "Se voce nao pediu este acesso, ignore este e-mail; o link "
            "expira sozinho e ninguem alem de voce recebeu esta mensagem."
        ),
    )

    return resposta_generica


@router.post(
    "/magic-link/confirmar",
    summary="Troca um token de magic link por uma sessão real",
    description=(
        "Chamado pela tela que recebe o token na query string do link "
        "enviado por /auth/magic-link/solicitar. Token de uso único: "
        "expira e é invalidado no primeiro uso bem-sucedido. Resposta no "
        "mesmo formato de /auth/login e /auth/google (access_token, "
        "deve_trocar_senha)."
    ),
)
async def magic_link_confirmar(
    request: MagicLinkConfirmarRequest,
    http_request: Request,
    db: Session = Depends(obter_banco_de_dados),
):
    # Defesa em profundidade -- o token já tem entropia alta (256 bits,
    # secrets.token_urlsafe(32)), mas um limite por IP não custa nada e
    # segue o mesmo padrão do resto do módulo.
    ip_cliente = http_request.client.host if http_request.client else "desconhecido"
    aplicar_rate_limit(f"magic-link-confirmar:ip:{ip_cliente}", max_tentativas=10, janela_segundos=900)

    token_hash = hashlib.sha256(request.token.encode("utf-8")).hexdigest()
    agora = datetime.now(timezone.utc)

    desafio = (
        db.query(DesafioAutenticacao)
        .filter(
            DesafioAutenticacao.token_hash == token_hash,
            DesafioAutenticacao.tipo == "MAGIC_LINK",
            DesafioAutenticacao.usado_em.is_(None),
            DesafioAutenticacao.expira_em > agora,
        )
        .first()
    )
    if not desafio:
        raise HTTPException(status_code=401, detail="Link inválido, já usado ou expirado.")

    pessoa = db.query(Pessoa).filter(Pessoa.id == desafio.pessoa_id).first()
    if not pessoa or pessoa.status_acesso != "ATIVO":
        raise HTTPException(status_code=401, detail="Link inválido, já usado ou expirado.")

    # Marca o desafio como usado ANTES de emitir o token -- se algo falhar
    # depois disso, o link já não pode ser reaproveitado (fail-closed).
    desafio.usado_em = agora
    db.commit()

    return _gerar_resposta_login(db, pessoa, request.modulo_origem)


# ============================================================================
# Passkeys / WebAuthn (2026-09-18) -- terceiro e último método de login
# moderno da lista original (magic link → OTP → passkeys, ver
# claude/decisao-modernizacao-login.md). Ao contrário do magic link, tem
# DOIS fluxos: registro (cadastrar uma passkey nova, exige já estar
# autenticado por outro método) e login (usar uma passkey já cadastrada).
# ============================================================================

@router.post(
    "/passkey/registro/iniciar",
    summary="Inicia o cadastro de uma nova passkey para o usuário logado",
    description=(
        "Exige estar autenticado (por senha, Google ou magic link) -- "
        "cadastrar uma passkey é uma ação de adicionar um segundo fator "
        "de acesso a uma conta já existente, nunca uma via de criação de "
        "conta nova. Devolve as opções de criação de credencial no "
        "formato que a lib @simplewebauthn/browser espera "
        "(startRegistration())."
    ),
)
async def passkey_registro_iniciar(
    payload: dict = Depends(obter_usuario_logado),
    db: Session = Depends(obter_banco_de_dados),
):
    pessoa = db.query(Pessoa).filter(Pessoa.id == payload.get("user_id")).first()
    if not pessoa:
        raise HTTPException(status_code=401, detail="Usuário não encontrado.")

    credenciais_existentes = db.query(CredencialPasskey).filter(
        CredencialPasskey.pessoa_id == pessoa.id
    ).all()

    opcoes = webauthn.generate_registration_options(
        rp_id=PASSKEY_RP_ID,
        rp_name=PASSKEY_RP_NAME,
        user_id=str(pessoa.id).encode("utf-8"),
        user_name=pessoa.email or str(pessoa.id),
        user_display_name=pessoa.nome_completo or pessoa.email or "Usuário Sigma",
        exclude_credentials=[
            PublicKeyCredentialDescriptor(id=base64url_to_bytes(c.credential_id))
            for c in credenciais_existentes
        ],
        authenticator_selection=AuthenticatorSelectionCriteria(
            resident_key=ResidentKeyRequirement.PREFERRED,
            user_verification=UserVerificationRequirement.PREFERRED,
        ),
    )

    # Guarda o challenge em claro (ver docstring de DesafioAutenticacao em
    # models.py) para poder devolvê-lo à lib na conclusão do cadastro.
    # Qualquer desafio PASSKEY_REGISTRO anterior ainda pendente para esta
    # pessoa fica órfão e simplesmente expira sozinho -- não há problema
    # em ter mais de um em paralelo (ex.: usuário abriu a tela em duas
    # abas), quem completar primeiro consome o seu.
    db.add(
        DesafioAutenticacao(
            pessoa_id=pessoa.id,
            tipo="PASSKEY_REGISTRO",
            token_hash=bytes_to_base64url(opcoes.challenge),
            expira_em=datetime.now(timezone.utc) + timedelta(minutes=PASSKEY_VALIDADE_CHALLENGE_MINUTOS),
        )
    )
    db.commit()

    return json.loads(webauthn.options_to_json(opcoes))


@router.post(
    "/passkey/registro/concluir",
    summary="Confirma o cadastro de uma passkey nova",
    description=(
        "Recebe a credencial criada pelo navegador (startRegistration()) "
        "e verifica a assinatura de atestação contra o challenge emitido "
        "por /auth/passkey/registro/iniciar. Exige estar autenticado -- "
        "mesma sessão que iniciou o cadastro."
    ),
)
async def passkey_registro_concluir(
    request: PasskeyRegistroConcluirRequest,
    http_request: Request,
    payload: dict = Depends(obter_usuario_logado),
    db: Session = Depends(obter_banco_de_dados),
):
    pessoa = db.query(Pessoa).filter(Pessoa.id == payload.get("user_id")).first()
    if not pessoa:
        raise HTTPException(status_code=401, detail="Usuário não encontrado.")

    origem = _origem_passkey_autorizada(http_request)
    agora = datetime.now(timezone.utc)

    desafio = (
        db.query(DesafioAutenticacao)
        .filter(
            DesafioAutenticacao.pessoa_id == pessoa.id,
            DesafioAutenticacao.tipo == "PASSKEY_REGISTRO",
            DesafioAutenticacao.usado_em.is_(None),
            DesafioAutenticacao.expira_em > agora,
        )
        .order_by(DesafioAutenticacao.criado_em.desc())
        .first()
    )
    if not desafio:
        raise HTTPException(
            status_code=400,
            detail="Nenhum cadastro de passkey pendente ou o tempo expirou. Reinicie o processo.",
        )

    try:
        verificacao = webauthn.verify_registration_response(
            credential=json.dumps(request.credential),
            expected_challenge=base64url_to_bytes(desafio.token_hash),
            expected_origin=origem,
            expected_rp_id=PASSKEY_RP_ID,
        )
    except InvalidRegistrationResponse as e:
        raise HTTPException(status_code=400, detail=f"Não foi possível validar a passkey: {str(e)}")

    # Fail-closed: consome o desafio antes de gravar a credencial nova.
    desafio.usado_em = agora

    nova_credencial = CredencialPasskey(
        pessoa_id=pessoa.id,
        credential_id=bytes_to_base64url(verificacao.credential_id),
        public_key=bytes_to_base64url(verificacao.credential_public_key),
        sign_count=verificacao.sign_count,
        transports=request.credential.get("response", {}).get("transports"),
        apelido=(request.apelido or "").strip() or None,
    )
    db.add(nova_credencial)
    db.commit()

    return {
        "mensagem": "Passkey cadastrada com sucesso.",
        "credencial_id": str(nova_credencial.id),
        "apelido": nova_credencial.apelido,
    }


@router.get(
    "/passkey/minhas",
    summary="Lista as passkeys cadastradas pelo usuário logado",
)
async def passkey_listar_minhas(
    payload: dict = Depends(obter_usuario_logado),
    db: Session = Depends(obter_banco_de_dados),
):
    credenciais = (
        db.query(CredencialPasskey)
        .filter(CredencialPasskey.pessoa_id == payload.get("user_id"))
        .order_by(CredencialPasskey.criado_em.asc())
        .all()
    )
    return [
        {
            "id": str(c.id),
            "apelido": c.apelido,
            "criado_em": c.criado_em.isoformat() if c.criado_em else None,
            "ultimo_uso_em": c.ultimo_uso_em.isoformat() if c.ultimo_uso_em else None,
        }
        for c in credenciais
    ]


@router.delete(
    "/passkey/{credencial_id}",
    summary="Remove uma passkey cadastrada pelo próprio usuário",
)
async def passkey_remover(
    credencial_id: str,
    payload: dict = Depends(obter_usuario_logado),
    db: Session = Depends(obter_banco_de_dados),
):
    credencial = (
        db.query(CredencialPasskey)
        .filter(
            CredencialPasskey.id == credencial_id,
            CredencialPasskey.pessoa_id == payload.get("user_id"),
        )
        .first()
    )
    if not credencial:
        raise HTTPException(status_code=404, detail="Passkey não encontrada.")
    db.delete(credencial)
    db.commit()
    return {"mensagem": "Passkey removida."}


@router.post(
    "/passkey/login/iniciar",
    summary="Inicia o login com passkey (sem senha)",
    description=(
        "Aceita o mesmo identificador do login (e-mail, CIM ou CPF). "
        "Resposta sempre no formato de opções do WebAuthn, mesmo se o "
        "identificador não corresponder a ninguém ou a pessoa não tiver "
        "nenhuma passkey cadastrada (allowCredentials vazio) -- mesma "
        "cautela anti-enumeração do resto do módulo: o navegador do lado "
        "de quem não tem cadastro simplesmente não vai achar nenhuma "
        "credencial para usar, sem o backend precisar dizer isso "
        "explicitamente."
    ),
)
async def passkey_login_iniciar(
    request: PasskeyLoginIniciarRequest,
    http_request: Request,
    db: Session = Depends(obter_banco_de_dados),
):
    ip_cliente = http_request.client.host if http_request.client else "desconhecido"
    aplicar_rate_limit(f"passkey-login-iniciar:ip:{ip_cliente}", max_tentativas=10, janela_segundos=900)
    aplicar_rate_limit(f"passkey-login-iniciar:id:{request.identificador}", max_tentativas=5, janela_segundos=900)

    pessoa = _resolver_pessoa_por_identificador(db, request.identificador)

    credenciais: List[CredencialPasskey] = []
    if pessoa and pessoa.status_acesso == "ATIVO":
        credenciais = db.query(CredencialPasskey).filter(CredencialPasskey.pessoa_id == pessoa.id).all()

    opcoes = webauthn.generate_authentication_options(
        rp_id=PASSKEY_RP_ID,
        allow_credentials=[
            PublicKeyCredentialDescriptor(id=base64url_to_bytes(c.credential_id))
            for c in credenciais
        ],
        user_verification=UserVerificationRequirement.PREFERRED,
    )

    # Só persiste o desafio se a pessoa existir de fato (pessoa_id é FK
    # obrigatória em DesafioAutenticacao) -- se não existir, a chamada de
    # /passkey/login/concluir que seguir vai falhar naturalmente por não
    # achar nenhuma CredencialPasskey com o credential_id apresentado,
    # sem precisar de nenhum tratamento especial aqui (mesmo resultado
    # final, sem vazar se o identificador existe ou não).
    if pessoa and pessoa.status_acesso == "ATIVO":
        db.add(
            DesafioAutenticacao(
                pessoa_id=pessoa.id,
                tipo="PASSKEY_LOGIN",
                token_hash=bytes_to_base64url(opcoes.challenge),
                expira_em=datetime.now(timezone.utc) + timedelta(minutes=PASSKEY_VALIDADE_CHALLENGE_MINUTOS),
            )
        )
        db.commit()

    return json.loads(webauthn.options_to_json(opcoes))


@router.post(
    "/passkey/login/concluir",
    summary="Confirma o login com passkey e emite uma sessão real",
    description=(
        "Recebe a asserção assinada pelo navegador (startAuthentication()) "
        "e verifica contra o challenge emitido por /auth/passkey/login/"
        "iniciar. Resposta no mesmo formato de /auth/login, /auth/google "
        "e /auth/magic-link/confirmar (access_token, deve_trocar_senha)."
    ),
)
async def passkey_login_concluir(
    request: PasskeyLoginConcluirRequest,
    http_request: Request,
    db: Session = Depends(obter_banco_de_dados),
):
    ip_cliente = http_request.client.host if http_request.client else "desconhecido"
    aplicar_rate_limit(f"passkey-login-concluir:ip:{ip_cliente}", max_tentativas=15, janela_segundos=900)

    erro_generico = HTTPException(status_code=401, detail="Não foi possível autenticar com esta passkey.")

    credential_id_recebido = request.credential.get("rawId") or request.credential.get("id")
    if not credential_id_recebido:
        raise erro_generico

    credencial = db.query(CredencialPasskey).filter(
        CredencialPasskey.credential_id == credential_id_recebido
    ).first()
    if not credencial:
        raise erro_generico

    pessoa = db.query(Pessoa).filter(Pessoa.id == credencial.pessoa_id).first()
    if not pessoa or pessoa.status_acesso != "ATIVO":
        raise erro_generico

    agora = datetime.now(timezone.utc)
    desafio = (
        db.query(DesafioAutenticacao)
        .filter(
            DesafioAutenticacao.pessoa_id == pessoa.id,
            DesafioAutenticacao.tipo == "PASSKEY_LOGIN",
            DesafioAutenticacao.usado_em.is_(None),
            DesafioAutenticacao.expira_em > agora,
        )
        .order_by(DesafioAutenticacao.criado_em.desc())
        .first()
    )
    if not desafio:
        raise erro_generico

    origem = _origem_passkey_autorizada(http_request)

    try:
        verificacao = webauthn.verify_authentication_response(
            credential=json.dumps(request.credential),
            expected_challenge=base64url_to_bytes(desafio.token_hash),
            expected_rp_id=PASSKEY_RP_ID,
            expected_origin=origem,
            credential_public_key=base64url_to_bytes(credencial.public_key),
            credential_current_sign_count=credencial.sign_count,
            require_user_verification=False,
        )
    except InvalidAuthenticationResponse:
        raise erro_generico

    # Fail-closed: consome o desafio e atualiza o contador anti-clonagem
    # ANTES de emitir o token.
    desafio.usado_em = agora
    credencial.sign_count = verificacao.new_sign_count
    credencial.ultimo_uso_em = agora
    db.commit()

    return _gerar_resposta_login(db, pessoa, request.modulo_origem)


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
