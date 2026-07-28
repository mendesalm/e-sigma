"""
Schemas Pydantic para o Módulo Financeiro.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal

# --- Categorias Financeiras ---
class CategoriaFinanceiraBase(BaseModel):
    organizacao_id: UUID
    nome: str = Field(..., description="Nome do plano de contas (ex: Mensalidade, Tronco de Solidariedade)")
    tipo_movimento: str = Field(..., description="'RECEITA' ou 'DESPESA'")
    ativa: bool = True

class CategoriaFinanceiraCreate(CategoriaFinanceiraBase): pass

class CategoriaFinanceiraResponse(CategoriaFinanceiraBase):
    id: UUID
    criado_em: datetime
    class Config:
        from_attributes = True

# --- Transações ---
class TransacaoBase(BaseModel):
    organizacao_id: UUID
    pessoa_id: Optional[UUID] = Field(None, description="Obreiro associado à despesa/receita (se houver)")
    categoria_id: UUID
    descricao: str
    tipo_movimento: str
    status_pagamento: str = Field(default="PENDENTE", description="PENDENTE, PAGO, ATRASADO")
    data_vencimento: date
    data_pagamento: Optional[date] = None
    
    # Valores Monetários precisos
    valor_original: Decimal
    valor_juros: Optional[Decimal] = Decimal('0.00')
    valor_multa: Optional[Decimal] = Decimal('0.00')
    valor_desconto: Optional[Decimal] = Decimal('0.00')
    valor_final: Optional[Decimal] = Decimal('0.00')
    
    dados_gateway: Optional[Dict] = Field(
        default_factory=dict, 
        description="IDs de faturas de cartão/PIX, links de boleto Asaas/Iugu"
    )

class TransacaoCreate(TransacaoBase): pass

class TransacaoResponse(TransacaoBase):
    id: UUID
    criado_em: datetime
    class Config:
        from_attributes = True
