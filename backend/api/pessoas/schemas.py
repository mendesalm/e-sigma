"""
Schemas para o Módulo de Pessoas (Obreiros, Familiares e Funcionários).
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict
from uuid import UUID
from datetime import date, datetime

class PessoaBase(BaseModel):
    organizacao_id: UUID = Field(..., description="A Loja Primária à qual este maçom pertence.")
    nome_completo: str = Field(..., description="Nome civil completo do membro.")
    tipo_pessoa: str = Field(..., description="MACOM, FAMILIAR, ou FUNCIONARIO.")
    
    # Autenticação e SaaS
    email: Optional[EmailStr] = Field(None, description="Email utilizado para login na plataforma Sigma.")
    permissoes_sistema: Optional[List[str]] = Field(default=[], description="Matriz de acesso RBAC (ex: ['FINANCEIRO_WRITE']).")
    
    # Dados Maçônicos (Apenas se tipo_pessoa == MACOM)
    cim: Optional[str] = Field(None, description="Cadastro de Identificação Maçônica (Geralmente GOB/GL/COMAB).")
    grau_simbolico: Optional[int] = Field(None, description="1=Aprendiz, 2=Companheiro, 3=Mestre.")
    grau_filosofico: Optional[int] = Field(None, description="Grau superior de 4 a 33.")
    
    # Matriz JSONB Dinâmica (O pulo do gato do Sigma 2.0)
    historico_cargos: Optional[List[Dict]] = Field(
        default=[],
        description="Array de objetos com histórico de Veneralatos e Cargos assumidos pelo membro."
    )


class PessoaCreate(PessoaBase):
    senha: Optional[str] = Field(None, description="Senha em texto plano que será hasheada pela camada de Serviço antes de ir ao banco.")


class PessoaResponse(PessoaBase):
    id: UUID = Field(..., description="UUID gerado pelo banco de dados.")
    ativo: bool = Field(..., description="Se a pessoa possui acesso e está regular na Loja.")
    criado_em: datetime = Field(...)

    class Config:
        from_attributes = True
