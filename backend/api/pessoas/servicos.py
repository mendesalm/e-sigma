"""
Serviços para o Módulo de Pessoas.
Centraliza a criptografia de senhas e lógicas exclusivas de cadastro de membros.
"""

from sqlalchemy.orm import Session
from models import Pessoa
from api.pessoas.schemas import PessoaCreate
from uuid import UUID
from fastapi import HTTPException, status

def listar_pessoas(db: Session, limite: int = 100):
    return db.query(Pessoa).limit(limite).all()

def obter_pessoa_por_id(db: Session, pessoa_id: UUID):
    return db.query(Pessoa).filter(Pessoa.id == pessoa_id).first()

def criar_pessoa(db: Session, dados_pessoa: PessoaCreate):
    # Dicionário cru sem o campo 'senha' plano
    dados_banco = dados_pessoa.model_dump(exclude={"senha"})
    
    # Validação de Negócio: Se email for informado, deve ser único
    if dados_pessoa.email:
        existe = db.query(Pessoa).filter(Pessoa.email == dados_pessoa.email).first()
        if existe:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="O email informado já está em uso no sistema."
            )
            
    # Hash de Senha Simulado (Numa etapa futura implementaremos Passlib/Bcrypt)
    if dados_pessoa.senha:
        dados_banco["senha_hash"] = f"hash_ficticio_de_{dados_pessoa.senha}"
        
    nova_pessoa = Pessoa(**dados_banco)
    
    db.add(nova_pessoa)
    db.commit()
    db.refresh(nova_pessoa)
    
    return nova_pessoa
