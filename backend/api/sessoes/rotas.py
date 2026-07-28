"""
Rotas RESTful para Sessões (Reuniões) e Frequência (Check-in).
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from dependencias import obter_banco_de_dados
from api.sessoes import servicos, schemas

router = APIRouter(
    prefix="/sessoes",
    tags=["Sessões e Frequência"],
    responses={404: {"description": "Recurso não encontrado"}}
)

@router.post("/", response_model=schemas.SessaoResponse, status_code=status.HTTP_201_CREATED)
def agendar_sessao(dados: schemas.SessaoCreate, db: Session = Depends(obter_banco_de_dados)):
    """Cria uma nova reunião maçônica e define as configurações de Balaústre e QR Code."""
    return servicos.criar_sessao(db=db, dados=dados)

@router.get("/", response_model=List[schemas.SessaoResponse])
def listar_sessoes(limite: int = 100, db: Session = Depends(obter_banco_de_dados)):
    """Lista as reuniões da instituição."""
    return servicos.listar_sessoes(db=db, limite=limite)

@router.post("/checkin", response_model=schemas.PresencaResponse, status_code=status.HTTP_201_CREATED)
def fazer_checkin(dados: schemas.PresencaCreate, db: Session = Depends(obter_banco_de_dados)):
    """Registra a presença (ou falta) de um membro em uma Sessão. Use visitante=True para irmãos de fora."""
    return servicos.lancar_presenca(db=db, dados=dados)
