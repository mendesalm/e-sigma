"""
Rotas RESTful para Processos Administrativos e Documentos.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from dependencias import obter_banco_de_dados
from api.documentos import servicos, schemas

router = APIRouter(
    prefix="/documentos",
    tags=["Burocracia e Processos Administrativos"],
    responses={404: {"description": "Recurso não encontrado"}}
)

@router.post("/", response_model=schemas.ProcessoAdministrativoResponse, status_code=status.HTTP_201_CREATED)
def iniciar_processo(dados: schemas.ProcessoAdministrativoCreate, db: Session = Depends(obter_banco_de_dados)):
    """Inicia um trâmite burocrático (ex: Pedido de Iniciação, Elevação)."""
    return servicos.criar_processo(db=db, dados=dados)

@router.get("/", response_model=List[schemas.ProcessoAdministrativoResponse])
def listar_processos(limite: int = 100, db: Session = Depends(obter_banco_de_dados)):
    """Lista todos os processos abertos na Loja."""
    return servicos.listar_processos(db=db, limite=limite)
