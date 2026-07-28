"""
Rotas RESTful para a Gestão da Biblioteca.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from dependencias import obter_banco_de_dados
from api.biblioteca import servicos, schemas

router = APIRouter(
    prefix="/biblioteca",
    tags=["Biblioteca e Acervo"],
    responses={404: {"description": "Recurso não encontrado"}}
)

@router.post("/", response_model=schemas.AcervoBibliotecaResponse, status_code=status.HTTP_201_CREATED)
def cadastrar_livro(dados: schemas.AcervoBibliotecaCreate, db: Session = Depends(obter_banco_de_dados)):
    """Cadastra um novo livro, ritual ou revista no acervo."""
    return servicos.criar_item_acervo(db=db, dados=dados)

@router.get("/", response_model=List[schemas.AcervoBibliotecaResponse])
def listar_biblioteca(limite: int = 100, db: Session = Depends(obter_banco_de_dados)):
    """Lista todos os livros da Loja."""
    return servicos.listar_acervo(db=db, limite=limite)
