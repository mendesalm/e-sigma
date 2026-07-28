"""
Rotas RESTful para o Módulo Financeiro (Caixa, Mensalidades e Tronco).
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from dependencias import obter_banco_de_dados
from api.financeiro import servicos, schemas

router = APIRouter(
    prefix="/financeiro",
    tags=["Gestão Financeira"],
    responses={404: {"description": "Recurso não encontrado"}}
)

@router.post("/categorias", response_model=schemas.CategoriaFinanceiraResponse, status_code=status.HTTP_201_CREATED)
def criar_categoria(dados: schemas.CategoriaFinanceiraCreate, db: Session = Depends(obter_banco_de_dados)):
    """Cria um novo plano de contas (Categoria)."""
    return servicos.criar_categoria(db=db, dados=dados)

@router.get("/categorias", response_model=List[schemas.CategoriaFinanceiraResponse])
def listar_categorias(limite: int = 100, db: Session = Depends(obter_banco_de_dados)):
    """Lista o plano de contas da instituição."""
    return servicos.listar_categorias(db=db, limite=limite)

@router.post("/transacoes", response_model=schemas.TransacaoResponse, status_code=status.HTTP_201_CREATED)
def criar_transacao(dados: schemas.TransacaoCreate, db: Session = Depends(obter_banco_de_dados)):
    """Cria uma nova movimentação financeira de caixa (Receita ou Despesa). O valor_final é calculado automaticamente se omitido."""
    return servicos.criar_transacao(db=db, dados=dados)

@router.get("/transacoes", response_model=List[schemas.TransacaoResponse])
def listar_transacoes(limite: int = 100, db: Session = Depends(obter_banco_de_dados)):
    """Exibe o fluxo de caixa."""
    return servicos.listar_transacoes(db=db, limite=limite)
