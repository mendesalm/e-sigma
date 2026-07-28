"""
Schemas Pydantic para o Módulo de Organizações.
Definem as regras de entrada (Request) e saída (Response) da API.

Documentação Rica: Cada campo possui descrições claras que são 
renderizadas automaticamente no Swagger UI.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict
from uuid import UUID
from datetime import datetime

class OrganizacaoBase(BaseModel):
    """Atributos base comuns para criação e leitura de uma Organização."""
    
    nome: str = Field(
        ..., 
        description="Nome oficial da organização maçônica.", 
        example="Grande Oriente do Brasil"
    )
    
    tipo: str = Field(
        ..., 
        description="Tipo da organização: 'OBEDIENCIA', 'SUBOBEDIENCIA' ou 'LOJA'.", 
        example="OBEDIENCIA"
    )
    
    cnpj: Optional[str] = Field(
        None, 
        description="CNPJ da organização (14 posições). Preparado para o novo formato Alfanumérico da RFB (IN 2.119/2022).", 
        example="12ABC34501DE35"
    )
    
    organizacao_superior_id: Optional[UUID] = Field(
        None, 
        description="UUID da organização mãe. Uma Loja pode apontar para uma Subobediência ou Obediência."
    )
    
    dados_especificos: Optional[Dict] = Field(
        default_factory=dict, 
        description="Envelope JSON contendo dados flexíveis, como 'rito' para Lojas e 'esfera' para Obediências."
    )


class OrganizacaoCreate(OrganizacaoBase):
    """Schema utilizado no corpo da requisição (POST) para criar uma Organização."""
    pass


class OrganizacaoResponse(OrganizacaoBase):
    """Schema utilizado para serializar a resposta (GET) contendo dados do banco."""
    
    id: UUID = Field(..., description="O identificador único universal (UUID) gerado pelo banco.")
    criado_em: datetime = Field(..., description="Data e hora em que o registro foi gerado no sistema.")

    class Config:
        from_attributes = True # Permite que o Pydantic leia diretamente dos modelos do SQLAlchemy
