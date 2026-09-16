"""
Rotas RESTful para o Módulo de Pessoas (Obreiros).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from dependencias import obter_banco_de_dados
from api.auth.dependencias import exigir_papel_administrativo
from api.pessoas import servicos, schemas

router = APIRouter(
    prefix="/pessoas",
    tags=["Obreiros e Familiares (Pessoas)"],
    responses={404: {"description": "Pessoa não encontrada"}}
)

@router.post(
    "/",
    response_model=schemas.PessoaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cadastrar um Membro, Visitante ou Funcionário (uso administrativo)",
    description="""
    Injeta uma nova pessoa no ecossistema da Loja.

    **ALTERAÇÃO (2026-09-16): esta rota agora exige um token administrativo**
    (`super_admin` ou `webmaster`). Antes disso, era uma rota aberta sem
    nenhuma autenticação — combinada com o fluxo (já removido) de
    "Ativação de Cadastro", isso permitia que qualquer um se auto-cadastrasse
    e se auto-ativasse sem nenhuma validação humana, contrariando a
    concepção do e-Sigma (ver decisao-controle-acesso-cadastro.md, seções
    2 e 12). **Um candidato novo (fora do sistema) deve usar
    `POST /solicitacoes-cadastro` em vez desta rota** — aquele fluxo passa
    por aprovação humana antes de qualquer `Pessoa` ser criada.

    * Utilize o array `historico_cargos` (JSON) para enviar todo o currículo maçônico retroativo deste irmão, sem precisar de tabelas de banco adicionais!
    """,
    response_description="O perfil da pessoa criada."
)
def criar_pessoa(
    dados: schemas.PessoaCreate,
    db: Session = Depends(obter_banco_de_dados),
    _admin: dict = Depends(exigir_papel_administrativo),
):
    return servicos.criar_pessoa(db=db, dados_pessoa=dados)


@router.get(
    "/", 
    response_model=List[schemas.PessoaResponse],
    summary="Listar Pessoas",
    description="Retorna o quadro de Obreiros e familiares."
)
def listar_pessoas(
    limite: int = 100, 
    db: Session = Depends(obter_banco_de_dados)
):
    return servicos.listar_pessoas(db=db, limite=limite)


@router.get(
    "/{pessoa_id}", 
    response_model=schemas.PessoaResponse,
    summary="Buscar Perfil Completo"
)
def obter_pessoa(
    pessoa_id: UUID, 
    db: Session = Depends(obter_banco_de_dados)
):
    pessoa = servicos.obter_pessoa_por_id(db=db, pessoa_id=pessoa_id)
    if not pessoa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Pessoa não existe na base."
        )
    return pessoa
