"""
Schemas Pydantic para o Módulo da Biblioteca.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from uuid import UUID
from datetime import datetime

class AcervoBibliotecaBase(BaseModel):
    organizacao_id: UUID
    titulo: str
    autor: Optional[str] = None
    isbn: Optional[str] = Field(None, description="ISBN validado globalmente")
    tipo_item: str = Field(..., description="LIVRO, REVISTA, RITUAL")
    status_item: str = Field(default="DISPONIVEL", description="DISPONIVEL, EMPRESTADO, EXTRAVIADO")
    
    historico_emprestimos: Optional[List[Dict]] = Field(
        default=[], description="Matriz de empréstimos e devoluções [{pessoa_id, data_retirada, data_devolucao}]"
    )
    fila_reservas: Optional[List[Dict]] = Field(
        default=[], description="Fila de espera para quando o item estiver emprestado"
    )

class AcervoBibliotecaCreate(AcervoBibliotecaBase): pass
class AcervoBibliotecaResponse(AcervoBibliotecaBase):
    id: UUID
    criado_em: datetime
    class Config:
        from_attributes = True
