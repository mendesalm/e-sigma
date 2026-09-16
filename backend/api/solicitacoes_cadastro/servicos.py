"""
Serviços da Solicitação de Cadastro (Via 2 — 2026-09-16).

Concepção (claude/decisao-controle-acesso-cadastro.md, seções 2 e 12):
candidato novo preenche um formulário (Potência, Loja, identificação
pessoal) → cai numa fila → um humano aprova ou rejeita → só na aprovação
o sistema cria a `Pessoa`, gera uma senha provisória e envia por e-mail
(nunca o candidato escolhe a própria senha nesta etapa).

Esta fila mora no e-Sigma (decisão do usuário em 2026-09-16, revisitável
quando o módulo Lojas tiver frontend próprio de aprovação).

LIMITAÇÃO CONHECIDA (documentar, não escondida): a decisão original (seção
2.4) previa três aprovadores possíveis — SuperAdmin, Diretoria do Conselho
jurisdicionado, ou VM da Loja referenciada. O e-Sigma não tem, hoje, o
conceito de "Conselho Regional"/"Região" (isso vive só no core_db do
CoReVM) — então só SuperAdmin/webmaster e o VM da própria Loja (resolvido
aqui via `MembroOrganizacao.cargo`) são elegíveis para aprovar. Aprovação
por "Diretoria do Conselho" exigiria o e-Sigma aprender sobre a hierarquia
de Regiões do CoReVM (chamada cruzada, ou replicação) — não implementado
nesta rodada.

ATUALIZAÇÃO (2026-09-16, achado ao testar pela UI real): a validação
cruzada Potência/Loja passou a consultar a API de Hierarquia do módulo
Lojas (`cliente_lojas.py`) EM VEZ de comparar contra a cópia local de
`organizacoes`, que estava desconectada da realidade (só tinha duas linhas
de teste, nenhuma Potência/Loja real importada desde 04/09). Ver
claude/decisao-controle-acesso-cadastro.md, seção 13, para a análise
completa. O e-Sigma continua guardando uma linha local em `organizacoes`
para cada Potência/Loja resolvida (upsert, casado por uma chave externa
estável em `dados_especificos`) — é nela que ficam ancoradas as FKs deste
módulo (`SolicitacaoCadastro`, depois `MembroOrganizacao`) e qualquer dado
de SaaS (`cliente_ativo_sigma`, assinatura) que já exista na linha; a
sincronização NUNCA sobrescreve esses campos, só nome/sigla/hierarquia.
"""
import re
import secrets
import unicodedata
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

import bcrypt
from fastapi import HTTPException, Request, status
from sqlalchemy.orm import Session

from models import MembroOrganizacao, Organizacao, Pessoa, SolicitacaoCadastro
from api.auth.email_service import (
    enviar_rejeicao_solicitacao_cadastro,
    enviar_senha_provisoria,
)
from api.auth.rate_limiter import aplicar_rate_limit as _aplicar_rate_limit
from api.solicitacoes_cadastro import schemas
from api.solicitacoes_cadastro.cliente_lojas import buscar_loja_por_numero

# Cargos elegíveis a aprovar solicitações da PRÓPRIA Loja (o próprio VM, e
# o Suplente-regente já assumido — mesmo espírito de "quem representa a
# Loja hoje" usado em decisao-transmissao-cargo-vm.md). Comparado contra
# `MembroOrganizacao.cargo`, que é texto livre nesta base — normalizado
# antes de comparar, mesma cautela de 2.3.
CARGOS_APROVADORES_DA_LOJA = {"venerável mestre", "suplente", "suplente-regente", "suplente regente"}

RESPOSTA_GENERICA = {
    "mensagem": (
        "Recebemos sua solicitação de cadastro. Ela será analisada pela "
        "Diretoria/SuperAdmin, e você será notificado por e-mail sobre o "
        "resultado."
    )
}


def _normalizar(texto: Optional[str]) -> str:
    """Minúsculo, sem acento, sem espaço nas pontas — mesma sanitização já
    usada nas Golden Rules de nome do ecossistema (ver seção 2.3 da
    decisão)."""
    if not texto:
        return ""
    sem_acento = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", sem_acento).strip().lower()


def _apenas_digitos(texto: Optional[str]) -> str:
    return re.sub(r"\D", "", texto or "")


def _upsert_organizacao_potencia(db: Session, potencia_api: dict) -> Organizacao:
    """Upsert casado por uma chave externa estável (o id da Obediência em
    `lojas_db`, guardado em `dados_especificos`) -- atualiza só identidade
    (nome/sigla); NUNCA toca `cliente_ativo_sigma` nem qualquer dado de
    assinatura já existente na linha (ver seção 13.2 da decisão: a
    identidade vem sempre do módulo Lojas, o SaaS é sempre local ao
    e-Sigma)."""
    chave_externa = str(potencia_api["id"])
    org = (
        db.query(Organizacao)
        .filter(
            Organizacao.tipo == "OBEDIENCIA",
            Organizacao.dados_especificos["lojas_db_obediencia_id"].astext == chave_externa,
        )
        .first()
    )
    if org is None:
        org = Organizacao(
            tipo="OBEDIENCIA",
            nome=potencia_api["nome"],
            sigla=potencia_api.get("sigla"),
            cliente_ativo_sigma=False,
            dados_especificos={"lojas_db_obediencia_id": chave_externa},
        )
        db.add(org)
        db.flush()
    else:
        org.nome = potencia_api["nome"]
        org.sigla = potencia_api.get("sigla") or org.sigla
    return org


def _upsert_organizacao_obediencia(
    db: Session, obediencia_api: dict, potencia_org: Organizacao
) -> Organizacao:
    """Mesmo upsert acima, para o nível intermediário (Obediência
    subordinada à Potência) quando o módulo Lojas o informar. Tipo
    `SUBOBEDIENCIA` -- mesma convenção já usada em `importar_legado.py`."""
    chave_externa = str(obediencia_api["id"])
    org = (
        db.query(Organizacao)
        .filter(
            Organizacao.tipo == "SUBOBEDIENCIA",
            Organizacao.dados_especificos["lojas_db_obediencia_id"].astext == chave_externa,
        )
        .first()
    )
    if org is None:
        org = Organizacao(
            tipo="SUBOBEDIENCIA",
            nome=obediencia_api["nome"],
            sigla=obediencia_api.get("sigla"),
            organizacao_superior_id=potencia_org.id,
            cliente_ativo_sigma=False,
            dados_especificos={"lojas_db_obediencia_id": chave_externa},
        )
        db.add(org)
        db.flush()
    else:
        org.nome = obediencia_api["nome"]
        org.sigla = obediencia_api.get("sigla") or org.sigla
        org.organizacao_superior_id = potencia_org.id
    return org


def _upsert_organizacao_loja(
    db: Session, loja_api: dict, organizacao_superior: Organizacao
) -> Organizacao:
    """Mesmo upsert, para a própria Loja -- preserva qualquer outra chave
    que já exista em `dados_especificos` (ex.: dados de SaaS futuros),
    atualizando só as chaves de identidade."""
    chave_externa = str(loja_api["id"])
    org = (
        db.query(Organizacao)
        .filter(
            Organizacao.tipo == "LOJA",
            Organizacao.dados_especificos["lojas_db_loja_id"].astext == chave_externa,
        )
        .first()
    )
    dados_identidade = {"lojas_db_loja_id": chave_externa, "numero_loja": loja_api["numero_loja"]}
    if org is None:
        org = Organizacao(
            tipo="LOJA",
            nome=loja_api["nome_loja"],
            sigla=loja_api.get("codigo_loja"),
            organizacao_superior_id=organizacao_superior.id,
            cliente_ativo_sigma=False,
            dados_especificos=dados_identidade,
        )
        db.add(org)
        db.flush()
    else:
        org.nome = loja_api["nome_loja"]
        org.organizacao_superior_id = organizacao_superior.id
        dados_atuais = dict(org.dados_especificos or {})
        dados_atuais.update(dados_identidade)
        org.dados_especificos = dados_atuais
    return org


def _resolver_potencia_e_loja_via_lojas_api(
    db: Session, numero_informado: str, nome_informado: str, potencia_informada: str
) -> tuple[Optional[Organizacao], Optional[Organizacao], list[str]]:
    """Substitui as antigas `_resolver_potencia`/`_resolver_loja`/
    `_loja_pertence_a_potencia`, que comparavam contra a cópia local de
    `organizacoes` -- desconectada da hierarquia real (achado ao testar
    pela UI real, ver seção 13 da decisão). Agora a Loja é buscada AO VIVO
    na API de Hierarquia do módulo Lojas (fonte de verdade), e a Potência
    já vem embutida na mesma resposta -- não existe mais uma busca global
    de Potência por nome (isso também fecha uma superfície de enumeração
    que uma rota "listar Potências" abriria).

    Devolve `(None, None, [])` quando o NÚMERO não resolve para nenhuma
    Loja real (rejeição automática DURA, sem o que analisar -- mesmo
    comportamento de antes). Quando resolve, devolve as duas Organizacao
    locais (upsert) e a lista de motivos internos (nome da Loja não bate
    e/ou Potência informada não bate com a real) -- vazia quando tudo
    confere."""
    dados = buscar_loja_por_numero(numero_informado)
    if dados is None:
        return None, None, []

    loja_api = dados["loja"]
    potencia_api = dados["potencia"]
    obediencia_api = dados.get("obediencia")

    potencia_org = _upsert_organizacao_potencia(db, potencia_api)
    organizacao_superior_da_loja = potencia_org
    if obediencia_api:
        organizacao_superior_da_loja = _upsert_organizacao_obediencia(db, obediencia_api, potencia_org)
    loja_org = _upsert_organizacao_loja(db, loja_api, organizacao_superior_da_loja)
    db.flush()

    motivos_internos: list[str] = []

    alvo_nome = _normalizar(nome_informado)
    if alvo_nome != _normalizar(loja_api["nome_loja"]):
        motivos_internos.append(
            f"Número da Loja resolveu para '{loja_api['nome_loja']}', mas o nome informado "
            f"('{nome_informado}') não corresponde."
        )

    alvo_potencia = _normalizar(potencia_informada)
    potencia_bate = alvo_potencia == _normalizar(potencia_api["nome"]) or alvo_potencia == _normalizar(
        potencia_api.get("sigla")
    )
    if not potencia_bate:
        motivos_internos.append(
            f"Loja '{loja_api['nome_loja']}' pertence à Potência '{potencia_api['nome']}', mas o "
            f"candidato informou '{potencia_informada}'."
        )

    return potencia_org, loja_org, motivos_internos


def _ja_existe_pessoa_ou_solicitacao_pendente(
    db: Session, email: str, cpf: Optional[str], cim: Optional[str]
) -> bool:
    """Detecção de duplicidade no momento da submissão (seção 2.1) — evita
    acumular a mesma pessoa várias vezes na fila, ou uma solicitação para
    quem já é Pessoa."""
    email_norm = (email or "").strip().lower()
    if db.query(Pessoa).filter(Pessoa.email == email_norm).first():
        return True
    if cpf and db.query(Pessoa).filter(Pessoa.cpf == cpf).first():
        return True
    if cim:
        existente = db.query(Pessoa).filter(Pessoa.dados_especificos["cim"].astext == cim).first()
        if existente:
            return True

    pendente = db.query(SolicitacaoCadastro).filter(
        SolicitacaoCadastro.status == "PENDENTE",
        SolicitacaoCadastro.email == email_norm,
    ).first()
    return pendente is not None


def criar_solicitacao(
    db: Session, dados: schemas.SolicitacaoCadastroCreate, http_request: Request
) -> dict:
    """Sempre devolve RESPOSTA_GENERICA — a decisão sobre criar ou não um
    registro de fila (e com qual status) é só interna, nunca revelada ao
    candidato (anti-enumeração, seção 2.1/2.3)."""
    ip = http_request.client.host if http_request.client else "desconhecido"
    _aplicar_rate_limit(f"solicitacao-cadastro:{ip}", max_tentativas=10, janela_segundos=600)
    _aplicar_rate_limit(
        f"solicitacao-cadastro-email:{dados.email.strip().lower()}",
        max_tentativas=3,
        janela_segundos=600,
    )

    if _ja_existe_pessoa_ou_solicitacao_pendente(db, dados.email, dados.cpf, dados.cim):
        return RESPOSTA_GENERICA

    potencia, loja, motivos_internos = _resolver_potencia_e_loja_via_lojas_api(
        db, dados.numero_loja_informado, dados.nome_loja_informado, dados.potencia_informada
    )

    if potencia is None or loja is None:
        # Rejeição automática DURA (2.3): número de Loja não resolveu a
        # nenhuma Loja real na API de Hierarquia do módulo Lojas (inclui
        # falha de conectividade/config — tratada exatamente igual, ver
        # `cliente_lojas.py`) — não há o que um humano analise, então nem
        # cria registro de fila. Resposta ao candidato é a mesma de sempre.
        return RESPOSTA_GENERICA

    solicitacao = SolicitacaoCadastro(
        potencia_informada=dados.potencia_informada,
        numero_loja_informado=dados.numero_loja_informado,
        nome_loja_informado=dados.nome_loja_informado,
        nome_completo=dados.nome_completo,
        grau_maconico=dados.grau_maconico,
        cim=dados.cim,
        cpf=dados.cpf,
        email=dados.email.strip().lower(),
        telefone=dados.telefone,
        cargo_atual=dados.cargo_atual,
        data_inicio_mandato=dados.data_inicio_mandato,
        loja_resolvida_id=loja.id,
        potencia_resolvida_id=potencia.id,
    )

    # `motivos_internos` já vem calculado por `_resolver_potencia_e_loja_via_
    # lojas_api` (nome informado não bate com o real, e/ou Potência
    # informada não bate com a real) — mesma categoria de risco de antes
    # (sinal de fraude/inconsistência para análise agregada, não revelado
    # ao candidato) — nunca um hard-reject, já que o número da Loja já foi
    # confirmado como real pela API de Hierarquia.
    if motivos_internos:
        solicitacao.status = "REJEITADO_AUTOMATICO"
        solicitacao.motivo_interno = " | ".join(motivos_internos)
    else:
        solicitacao.status = "PENDENTE"

    db.add(solicitacao)
    db.commit()
    return RESPOSTA_GENERICA


def _resolver_papel_aprovador(db: Session, payload: dict) -> str:
    """'super_admin'/'webmaster' aprovam qualquer solicitação. Caso
    contrário, elegível só se tiver vínculo ATIVO, com cargo elegível
    (VM/Suplente), na MESMA Loja da solicitação — checado por chamada,
    não aqui (esta função só identifica o papel geral do token)."""
    role = payload.get("role")
    if role in ("super_admin", "webmaster"):
        return "ADMIN"
    return "LOJA"


def _pessoa_e_aprovadora_da_loja(db: Session, pessoa_id: Optional[str], loja_id: UUID) -> bool:
    if not pessoa_id:
        return False
    vinculo = (
        db.query(MembroOrganizacao)
        .filter(
            MembroOrganizacao.pessoa_id == pessoa_id,
            MembroOrganizacao.organizacao_id == loja_id,
            MembroOrganizacao.status == "ATIVO",
        )
        .first()
    )
    if not vinculo:
        return False
    return _normalizar(vinculo.cargo) in CARGOS_APROVADORES_DA_LOJA


def exigir_aprovador_elegivel(db: Session, payload: dict, solicitacao: SolicitacaoCadastro) -> None:
    """Levanta 403 se quem está chamando não pode aprovar/rejeitar/ver esta
    solicitação específica. Ver limitação de "Diretoria do Conselho" no
    docstring do módulo."""
    if _resolver_papel_aprovador(db, payload) == "ADMIN":
        return
    if solicitacao.loja_resolvida_id and _pessoa_e_aprovadora_da_loja(
        db, payload.get("user_id"), solicitacao.loja_resolvida_id
    ):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=(
            "Você não tem permissão para gerenciar esta solicitação. Só o "
            "SuperAdmin/webmaster ou o VM/Suplente da própria Loja podem "
            "aprovar ou rejeitar."
        ),
    )


def listar_solicitacoes(db: Session, payload: dict, status_filtro: Optional[str] = None):
    """SuperAdmin/webmaster veem todas; qualquer outro token só vê as
    solicitações das Lojas onde é VM/Suplente ativo (evita expor dados
    pessoais de candidatos de Lojas de terceiros)."""
    query = db.query(SolicitacaoCadastro)
    if status_filtro:
        query = query.filter(SolicitacaoCadastro.status == status_filtro)

    if _resolver_papel_aprovador(db, payload) == "ADMIN":
        return query.order_by(SolicitacaoCadastro.criado_em.desc()).all()

    lojas_elegiveis = (
        db.query(MembroOrganizacao.organizacao_id)
        .filter(MembroOrganizacao.pessoa_id == payload.get("user_id"), MembroOrganizacao.status == "ATIVO")
        .all()
    )
    ids_loja = [
        loja_id
        for (loja_id,) in lojas_elegiveis
        if _pessoa_e_aprovadora_da_loja(db, payload.get("user_id"), loja_id)
    ]
    if not ids_loja:
        return []
    return (
        query.filter(SolicitacaoCadastro.loja_resolvida_id.in_(ids_loja))
        .order_by(SolicitacaoCadastro.criado_em.desc())
        .all()
    )


def _gerar_senha_provisoria() -> str:
    """12 caracteres alfanuméricos, gerados com `secrets` (não `random`) —
    entregues por e-mail, nunca escolhidos pelo candidato ou pelo
    aprovador."""
    alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
    return "".join(secrets.choice(alfabeto) for _ in range(12))


def aprovar_solicitacao(
    db: Session, solicitacao_id: UUID, version_esperada: int, payload: dict
) -> SolicitacaoCadastro:
    solicitacao = db.query(SolicitacaoCadastro).filter(SolicitacaoCadastro.id == solicitacao_id).first()
    if not solicitacao:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada.")

    exigir_aprovador_elegivel(db, payload, solicitacao)

    if solicitacao.status != "PENDENTE":
        raise HTTPException(status_code=400, detail=f"Solicitação já está com status {solicitacao.status}.")

    # Lock otimista (2.4, "primeiro que agir vale"): o UPDATE só é
    # considerado válido se `version` ainda for a que o aprovador leu.
    linhas_afetadas = (
        db.query(SolicitacaoCadastro)
        .filter(SolicitacaoCadastro.id == solicitacao_id, SolicitacaoCadastro.version == version_esperada)
        .update({SolicitacaoCadastro.version: version_esperada + 1})
    )
    if linhas_afetadas == 0:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Esta solicitação já foi processada (ou está sendo processada) por outro aprovador.",
        )

    senha_provisoria = _gerar_senha_provisoria()
    pessoa = Pessoa(
        tipo="Macom",
        nome_completo=solicitacao.nome_completo,
        cpf=solicitacao.cpf,
        email=solicitacao.email,
        telefone=solicitacao.telefone,
        senha_hash=bcrypt.hashpw(senha_provisoria.encode("utf-8"), bcrypt.gensalt()).decode("utf-8"),
        status_acesso="ATIVO",
        deve_trocar_senha=True,
        dados_civis={},
        dados_especificos={"cim": solicitacao.cim, "grau_simbolico": solicitacao.grau_maconico},
    )
    db.add(pessoa)
    db.flush()  # garante pessoa.id antes de vincular

    if solicitacao.loja_resolvida_id:
        db.add(
            MembroOrganizacao(
                pessoa_id=pessoa.id,
                organizacao_id=solicitacao.loja_resolvida_id,
                cargo=solicitacao.cargo_atual,
                status="ATIVO",
            )
        )

    solicitacao.status = "APROVADO"
    solicitacao.pessoa_criada_id = pessoa.id
    solicitacao.aprovado_ou_rejeitado_por_id = payload.get("user_id")
    solicitacao.aprovado_ou_rejeitado_por_nome = payload.get("sub")
    solicitacao.resolvido_em = datetime.now(timezone.utc)
    db.commit()

    enviar_senha_provisoria(pessoa.email, pessoa.nome_completo, senha_provisoria)
    return solicitacao


def rejeitar_solicitacao(
    db: Session, solicitacao_id: UUID, version_esperada: int, motivo: str, payload: dict
) -> SolicitacaoCadastro:
    solicitacao = db.query(SolicitacaoCadastro).filter(SolicitacaoCadastro.id == solicitacao_id).first()
    if not solicitacao:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada.")

    exigir_aprovador_elegivel(db, payload, solicitacao)

    if solicitacao.status != "PENDENTE":
        raise HTTPException(status_code=400, detail=f"Solicitação já está com status {solicitacao.status}.")

    linhas_afetadas = (
        db.query(SolicitacaoCadastro)
        .filter(SolicitacaoCadastro.id == solicitacao_id, SolicitacaoCadastro.version == version_esperada)
        .update({SolicitacaoCadastro.version: version_esperada + 1})
    )
    if linhas_afetadas == 0:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Esta solicitação já foi processada (ou está sendo processada) por outro aprovador.",
        )

    solicitacao.status = "REJEITADO"
    solicitacao.motivo_rejeicao = motivo
    solicitacao.aprovado_ou_rejeitado_por_id = payload.get("user_id")
    solicitacao.aprovado_ou_rejeitado_por_nome = payload.get("sub")
    solicitacao.resolvido_em = datetime.now(timezone.utc)
    db.commit()

    enviar_rejeicao_solicitacao_cadastro(solicitacao.email, solicitacao.nome_completo, motivo)
    return solicitacao
