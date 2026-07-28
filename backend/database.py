"""
Módulo responsável por gerenciar a conexão com o banco de dados do Sigma 2.0.
Esta configuração utiliza o SQLAlchemy para fornecer o ORM (Object-Relational Mapping).

Diretriz de Ouro: Este arquivo segue o padrão de nomenclatura e comentários em PT-BR.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Lê a string de conexão (DATABASE_URL) das variáveis de ambiente.
# Caso não esteja definida (como no ambiente de desenvolvimento inicial), utiliza um valor padrão (fallback).
# O banco de dados alvo para a V2 é exclusivamente o banco nomeado "sigma".
DATABASE_URL = os.environ.get(
    "DATABASE_URL", 
    "postgresql+psycopg2://Sistema:Vdfskln49DSFkod@69.62.89.211:5432/sigma"
)

# Cria o "motor" (engine) do banco de dados, que é a interface central entre o SQLAlchemy e o PostgreSQL.
# O parâmetro echo=True é útil em desenvolvimento para imprimir no console todas as queries SQL geradas.
motor_banco_dados = create_engine(DATABASE_URL, echo=True)

# Cria uma fábrica de sessões locais (SessionLocal).
# Cada instância gerada por esta fábrica representará uma transação ativa com o banco de dados.
SessaoLocal = sessionmaker(
    autocommit=False, # Não consolida alterações automaticamente, exigindo db.commit() explícito (mais seguro).
    autoflush=False,  # Não envia alterações pendentes ao banco de dados antes de cada query.
    bind=motor_banco_dados # Associa a sessão ao motor recém-criado.
)

# Base declarativa que será herdada por todos os modelos (classes de banco de dados).
# É a partir dela que o SQLAlchemy mapeia as classes Python para tabelas do PostgreSQL.
Base = declarative_base()

def obter_sessao_banco():
    """
    Função geradora para prover uma sessão do banco de dados e garantir seu fechamento.
    Ideal para uso com FastAPI (Injeção de Dependências - Depends).
    
    Rendimento (Yields):
        db (Session): Uma sessão ativa do SQLAlchemy conectada ao banco de dados Sigma.
    """
    db = SessaoLocal()
    try:
        yield db
    finally:
        db.close() # Garante que a conexão retorne ao pool independentemente de sucesso ou erro.
