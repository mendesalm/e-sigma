"""
Serviços para o Módulo Financeiro.
"""
from sqlalchemy.orm import Session
from models import CategoriaFinanceira, Transacao
from api.financeiro import schemas
from uuid import UUID

# --- Categorias ---
def listar_categorias(db: Session, limite: int = 100):
    return db.query(CategoriaFinanceira).limit(limite).all()

def criar_categoria(db: Session, dados: schemas.CategoriaFinanceiraCreate):
    nova = CategoriaFinanceira(**dados.model_dump())
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return nova

# --- Transações ---
def listar_transacoes(db: Session, limite: int = 100):
    return db.query(Transacao).limit(limite).all()

def criar_transacao(db: Session, dados: schemas.TransacaoCreate):
    # Calcula valor_final se não foi fornecido
    if not dados.valor_final or dados.valor_final == 0:
        juros = dados.valor_juros or 0
        multa = dados.valor_multa or 0
        desc = dados.valor_desconto or 0
        calc = (dados.valor_original + juros + multa) - desc
        dados.valor_final = calc

    nova = Transacao(**dados.model_dump())
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return nova
