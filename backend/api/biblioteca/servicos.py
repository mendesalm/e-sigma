"""
Serviços para o Módulo da Biblioteca.
"""
from sqlalchemy.orm import Session
from models import AcervoBiblioteca
from api.biblioteca import schemas

def listar_acervo(db: Session, limite: int = 100):
    return db.query(AcervoBiblioteca).limit(limite).all()

def criar_item_acervo(db: Session, dados: schemas.AcervoBibliotecaCreate):
    novo = AcervoBiblioteca(**dados.model_dump())
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo
