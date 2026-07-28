"""
Schemas Pydantic para o Módulo de Sessões e Presenças.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict
from uuid import UUID
from datetime import datetime

# --- Sessões ---
class SessaoBase(BaseModel):
    organizacao_id: UUID
    titulo: str = Field(..., description="Ex: Sessão Magna de Elevação")
    data_sessao: datetime
    grau_trabalho: Optional[int] = Field(None, description="Grau que a Loja operou")
    tipo_sessao: Optional[str] = Field(None, description="ORDINARIA, MAGNA")
    
    dados_ata: Optional[Dict] = Field(default_factory=dict, description="Corpo do Balaústre (HTML)")
    config_checkin: Optional[Dict] = Field(default_factory=dict, description="Configs do QR Code dinâmico")

class SessaoCreate(SessaoBase): pass
class SessaoResponse(SessaoBase):
    id: UUID
    criado_em: datetime
    class Config:
        from_attributes = True

# --- Presenças ---
class PresencaBase(BaseModel):
    sessao_id: UUID
    pessoa_id: UUID
    status: str = Field(default="PRESENTE")
    visitante: bool = Field(default=False, description="True se a pessoa for de outra Loja")
    dados_checkin: Optional[Dict] = Field(default_factory=dict)

class PresencaCreate(PresencaBase): pass
class PresencaResponse(PresencaBase):
    id: UUID
    criado_em: datetime
    class Config:
        from_attributes = True
