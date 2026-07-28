"""
Schemas Pydantic para o Módulo de Documentos e Processos.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict
from uuid import UUID
from datetime import datetime

class ProcessoAdministrativoBase(BaseModel):
    organizacao_id: UUID
    requerente_id: UUID
    tipo_processo: str = Field(..., description="SINDICANCIA, ELEVACAO, QUITACAO")
    status: str = Field(default="EM_ANDAMENTO", description="EM_ANDAMENTO, APROVADO, RECUSADO")
    dados_processo: Optional[Dict] = Field(default_factory=dict, description="Forms, Votos e PDFs")

class ProcessoAdministrativoCreate(ProcessoAdministrativoBase): pass
class ProcessoAdministrativoResponse(ProcessoAdministrativoBase):
    id: UUID
    criado_em: datetime
    class Config:
        from_attributes = True
