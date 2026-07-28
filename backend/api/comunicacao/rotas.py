"""
Rotas RESTful para o feed de Comunicação.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from dependencias import obter_banco_de_dados
from api.comunicacao import servicos, schemas

router = APIRouter(
    prefix="/comunicacao",
    tags=["Murais e Avisos"],
    responses={404: {"description": "Recurso não encontrado"}}
)

@router.post("/", response_model=schemas.ComunicadoResponse, status_code=status.HTTP_201_CREATED)
def publicar_comunicado(dados: schemas.ComunicadoCreate, db: Session = Depends(obter_banco_de_dados)):
    """Publica um novo aviso, classificado ou evento no mural da Loja."""
    return servicos.criar_comunicado(db=db, dados=dados)

@router.get("/", response_model=List[schemas.ComunicadoResponse])
def listar_murais(limite: int = 100, db: Session = Depends(obter_banco_de_dados)):
    """Lista o feed de murais ordenados por data."""
    return servicos.listar_comunicados(db=db, limite=limite)
