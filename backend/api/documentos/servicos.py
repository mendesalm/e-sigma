"""
Serviços para o Módulo de Documentos e Processos Administrativos.
"""
from sqlalchemy.orm import Session
from models import ProcessoAdministrativo
from api.documentos import schemas

def listar_processos(db: Session, limite: int = 100):
    return db.query(ProcessoAdministrativo).limit(limite).all()

def criar_processo(db: Session, dados: schemas.ProcessoAdministrativoCreate):
    novo = ProcessoAdministrativo(**dados.model_dump())
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo
