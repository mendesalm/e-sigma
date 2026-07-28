"""
Schemas Pydantic para o Módulo de Comunicação (Murais).
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict
from uuid import UUID
from datetime import datetime

class ComunicadoBase(BaseModel):
    organizacao_id: UUID
    autor_id: UUID
    tipo: str = Field(..., description="MURAL, EVENTO_SOCIAL, CLASSIFICADOS")
    titulo: str
    conteudo: Optional[Dict] = Field(default_factory=dict, description="HTML, Imagens, Metadados do Evento")

class ComunicadoCreate(ComunicadoBase): pass
class ComunicadoResponse(ComunicadoBase):
    id: UUID
    criado_em: datetime
    class Config:
        from_attributes = True
