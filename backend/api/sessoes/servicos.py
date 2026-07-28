"""
Serviços para o Módulo de Sessões.
"""
from sqlalchemy.orm import Session
from models import Sessao, Presenca
from api.sessoes import schemas

# --- Sessões ---
def listar_sessoes(db: Session, limite: int = 100):
    return db.query(Sessao).limit(limite).all()

def criar_sessao(db: Session, dados: schemas.SessaoCreate):
    nova = Sessao(**dados.model_dump())
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return nova

# --- Presenças ---
def lancar_presenca(db: Session, dados: schemas.PresencaCreate):
    nova = Presenca(**dados.model_dump())
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return nova
