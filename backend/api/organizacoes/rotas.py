"""
Rotas (Controllers) RESTful para o Módulo de Organizações.
Fazem o direcionamento da requisição HTTP, acionam a camada de serviços
e envelopam as respostas baseadas nos Schemas.

O foco aqui é na Regra de Ouro: Documentação Rica via decorators do Swagger!
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from dependencias import obter_banco_de_dados
from api.organizacoes import servicos, schemas

router = APIRouter(
    prefix="/organizacoes",
    tags=["Organizações e Lojas"],
    responses={404: {"description": "Recurso não encontrado"}}
)

@router.post(
    "/", 
    response_model=schemas.OrganizacaoResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Cadastrar nova Organização",
    description="""
    Cria um registro hierárquico na árvore maçônica.
    
    Pode ser usado para registrar o topo da pirâmide (uma **Obediência** estadual ou nacional), 
    ou um nó descendente (uma **Subobediência** ou **Loja**).
    
    * Para criar uma Loja, certifique-se de passar o `organizacao_superior_id` apontando para sua Potência.
    * Use o `dados_especificos` para gravar o 'rito' da Loja!
    """,
    response_description="A organização criada com seu UUID."
)
def criar_organizacao(
    dados: schemas.OrganizacaoCreate, 
    db: Session = Depends(obter_banco_de_dados)
):
    return servicos.criar_organizacao(db=db, dados_org=dados)


@router.get(
    "/", 
    response_model=List[schemas.OrganizacaoResponse],
    summary="Listar Organizações",
    description="Retorna o catálogo de todas as instituições maçônicas registradas no sistema, limitadas a 100 resultados por padrão para performance.",
    response_description="Uma lista de objetos Organizacao."
)
def listar_organizacoes(
    limite: int = 100, 
    db: Session = Depends(obter_banco_de_dados)
):
    return servicos.listar_organizacoes(db=db, limite=limite)


@router.get(
    "/{org_id}", 
    response_model=schemas.OrganizacaoResponse,
    summary="Buscar Organização Específica",
    description="Localiza uma Obediência, Subobediência ou Loja a partir de seu Identificador Único (UUID).",
    response_description="O objeto completo da Organização encontrada."
)
def obter_organizacao(
    org_id: UUID, 
    db: Session = Depends(obter_banco_de_dados)
):
    organizacao = servicos.obter_organizacao_por_id(db=db, org_id=org_id)
    if not organizacao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="A organização solicitada não existe."
        )
    return organizacao
