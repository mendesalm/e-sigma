"""
Schemas Pydantic para o Módulo de SaaS.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime

class PlanoSaaSBase(BaseModel):
    nome: str = Field(..., description="Nome do plano", example="Ouro")
    descricao: Optional[str] = None
    valor_mensal: float
    limite_membros: Optional[int] = None
    ativo: bool = True

class PlanoSaaSCreate(PlanoSaaSBase):
    pass

class PlanoSaaSResponse(PlanoSaaSBase):
    id: UUID
    criado_em: datetime
    class Config:
        from_attributes = True

class AssinaturaSaaSBase(BaseModel):
    organizacao_id: UUID
    plano_id: UUID
    status: str = Field(default='ATIVA', description="Status da assinatura")
    data_vencimento: date
    
class AssinaturaSaaSCreate(AssinaturaSaaSBase):
    pass

class AssinaturaSaaSResponse(AssinaturaSaaSBase):
    id: UUID
    data_inicio: date
    pastas_provisionadas: bool
    criado_em: datetime
    class Config:
        from_attributes = True

class TratadoAmizadeBase(BaseModel):
    obediencia_1_id: UUID
    obediencia_2_id: UUID
    ativo: bool = True
    data_assinatura: Optional[date] = None

class TratadoAmizadeCreate(TratadoAmizadeBase):
    pass

class TratadoAmizadeResponse(TratadoAmizadeBase):
    id: UUID
    criado_em: datetime
    class Config:
        from_attributes = True
