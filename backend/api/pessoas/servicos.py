"""
Serviços para o Módulo de Pessoas.
Centraliza a criptografia de senhas e lógicas exclusivas de cadastro de membros.
"""

from sqlalchemy.orm import Session
from models import Pessoa
from api.pessoas.schemas import PessoaCreate
from uuid import UUID
from fastapi import HTTPException, status
import bcrypt

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

    # CORREÇÃO (2026-09-16): o hash aqui era simulado (string literal
    # "hash_ficticio_de_<senha>"), incompatível com bcrypt.checkpw usado em
    # /auth/login — qualquer Pessoa criada por esta rota COM senha nunca
    # conseguia logar de verdade (dava 401 "Hash de senha em formato
    # inválido"). Corrigido para usar bcrypt real, igual ao resto do sistema.
    if dados_pessoa.senha:
        dados_banco["senha_hash"] = bcrypt.hashpw(
            dados_pessoa.senha.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")
        dados_banco["status_acesso"] = "ATIVO"
    else:
        # Sem senha na criação: cadastro nasce pendente de Ativação de
        # Cadastro (ver api/auth/rotas.py) em vez do "ATIVO" padrão do
        # modelo — antes
        # dessa mudança, uma Pessoa sem senha ficava "ATIVO" mas incapaz de
        # logar (senha_hash NULL), sem nenhum caminho para resolver isso.
        dados_banco["status_acesso"] = "PENDENTE"

    nova_pessoa = Pessoa(**dados_banco)

    db.add(nova_pessoa)
    db.commit()
    db.refresh(nova_pessoa)

    return nova_pessoa
