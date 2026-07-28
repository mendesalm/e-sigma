"""
Serviços para o Módulo de Comunicação.
"""
from sqlalchemy.orm import Session
from models import Comunicado
from api.comunicacao import schemas

def listar_comunicados(db: Session, limite: int = 100):
    return db.query(Comunicado).order_by(Comunicado.criado_em.desc()).limit(limite).all()

def criar_comunicado(db: Session, dados: schemas.ComunicadoCreate):
    novo = Comunicado(**dados.model_dump())
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo
