"""
Rotas da Solicitação de Cadastro (Via 2 — 2026-09-16).
Ver servicos.py para a lógica e claude/decisao-controle-acesso-cadastro.md
(seções 2 e 12) para a concepção completa.
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from dependencias import obter_banco_de_dados
from api.auth.dependencias import obter_usuario_logado
from api.solicitacoes_cadastro import schemas, servicos

router = APIRouter(prefix="/solicitacoes-cadastro", tags=["Solicitação de Cadastro (Via 2)"])


@router.post(
    "/",
    summary="Solicitar cadastro no e-Sigma (candidato novo)",
    description=(
        "Rota PÚBLICA (sem autenticação, por natureza — o candidato ainda "
        "não existe no sistema). Recebe Potência, Loja e identificação "
        "pessoal, valida a combinação Potência/Loja automaticamente e "
        "coloca a solicitação numa fila de aprovação humana (SuperAdmin "
        "ou VM/Suplente da própria Loja). **Nenhuma Pessoa é criada aqui** "
        "— só na aprovação (ver POST .../{id}/aprovar). Resposta sempre "
        "genérica, para não revelar detalhes de validação (anti-"
        "enumeração)."
    ),
)
def solicitar_cadastro(
    dados: schemas.SolicitacaoCadastroCreate,
    http_request: Request,
    db: Session = Depends(obter_banco_de_dados),
):
    return servicos.criar_solicitacao(db, dados, http_request)


@router.get(
    "/",
    response_model=List[schemas.SolicitacaoCadastroResponse],
    summary="Listar solicitações de cadastro",
    description=(
        "Autenticado. SuperAdmin/webmaster veem todas; qualquer outro "
        "token só vê solicitações das Lojas onde é VM/Suplente ativo."
    ),
)
def listar_solicitacoes(
    status_filtro: Optional[str] = None,
    payload: dict = Depends(obter_usuario_logado),
    db: Session = Depends(obter_banco_de_dados),
):
    return servicos.listar_solicitacoes(db, payload, status_filtro)


@router.post(
    "/{solicitacao_id}/aprovar",
    response_model=schemas.SolicitacaoCadastroResponse,
    summary="Aprovar uma solicitação pendente",
    description=(
        "Cria a `Pessoa`, gera uma senha provisória e envia por e-mail — "
        "o próprio candidato nunca escolhe a senha nesta etapa. Usa lock "
        "otimista por `version` (o corpo deve enviar a versão lida na "
        "listagem); se outra pessoa já processou a solicitação, retorna "
        "409."
    ),
)
def aprovar_solicitacao(
    solicitacao_id: UUID,
    corpo: schemas.AprovarSolicitacaoRequest,
    payload: dict = Depends(obter_usuario_logado),
    db: Session = Depends(obter_banco_de_dados),
):
    return servicos.aprovar_solicitacao(db, solicitacao_id, corpo.version, payload)


@router.post(
    "/{solicitacao_id}/rejeitar",
    response_model=schemas.SolicitacaoCadastroResponse,
    summary="Rejeitar uma solicitação pendente",
    description="Envia o motivo por e-mail ao candidato. Mesmo lock otimista da aprovação.",
)
def rejeitar_solicitacao(
    solicitacao_id: UUID,
    corpo: schemas.RejeitarSolicitacaoRequest,
    payload: dict = Depends(obter_usuario_logado),
    db: Session = Depends(obter_banco_de_dados),
):
    return servicos.rejeitar_solicitacao(db, solicitacao_id, corpo.version, corpo.motivo, payload)
