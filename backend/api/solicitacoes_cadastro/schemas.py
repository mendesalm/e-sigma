"""
Schemas da Solicitação de Cadastro (Via 2 — 2026-09-16).
Ver models.py (SolicitacaoCadastro) e claude/decisao-controle-acesso-cadastro.md,
seções 2 e 12, para o desenho completo.
"""
from datetime import date, datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

# 1=Aprendiz, 2=Companheiro, 3=Mestre — mesma convenção de
# Pessoa.grau_simbolico (models.py).
GRAUS_MACONICOS_VALIDOS = {1: "Aprendiz", 2: "Companheiro", 3: "Mestre"}


class SolicitacaoCadastroCreate(BaseModel):
    """Corpo do formulário público de solicitação de cadastro. Nenhum
    campo aqui cria uma Pessoa diretamente — a submissão só entra numa
    fila de análise (ver servicos.criar_solicitacao).

    ATUALIZAÇÃO (2026-09-16, mesmo dia): por pedido explícito do usuário,
    TODOS os campos de identificação passaram a ser obrigatórios (antes
    cim/cpf/telefone/cargo_atual eram opcionais), e a Loja agora exige DOIS
    campos separados (número e nome) em vez de um único campo de texto
    livre — ambos precisam resolver para a mesma Organizacao (ver
    `servicos._resolver_loja`). "Potência" continua sem nenhuma sugestão/
    autocomplete no frontend, de propósito (filtro anti-curioso, seção
    2.3 da decisão)."""
    potencia_informada: str = Field(..., min_length=1, max_length=255)
    numero_loja_informado: str = Field(..., min_length=1, max_length=50)
    nome_loja_informado: str = Field(..., min_length=1, max_length=255)
    nome_completo: str = Field(..., min_length=1, max_length=255)
    grau_maconico: int = Field(
        ..., description="1=Aprendiz, 2=Companheiro, 3=Mestre"
    )
    cim: str = Field(..., min_length=1, max_length=50)
    cpf: str = Field(..., min_length=11, max_length=14)
    email: EmailStr
    telefone: str = Field(..., min_length=8, max_length=20)
    cargo_atual: str = Field(..., min_length=1, max_length=100)
    data_inicio_mandato: Optional[date] = None

    @field_validator("grau_maconico")
    @classmethod
    def _validar_grau_maconico(cls, valor: int) -> int:
        if valor not in GRAUS_MACONICOS_VALIDOS:
            raise ValueError("grau_maconico precisa ser 1 (Aprendiz), 2 (Companheiro) ou 3 (Mestre).")
        return valor


class SolicitacaoCadastroResponse(BaseModel):
    """Visão administrativa de uma solicitação — só exposta a quem já
    passou por `exigir_aprovador_elegivel` (ver servicos.py)."""
    id: UUID
    potencia_informada: str
    numero_loja_informado: str
    nome_loja_informado: str
    nome_completo: str
    grau_maconico: int
    cim: str
    cpf: str
    email: str
    telefone: str
    cargo_atual: str
    data_inicio_mandato: Optional[date]
    status: str
    motivo_interno: Optional[str] = None
    motivo_rejeicao: Optional[str] = None
    loja_resolvida_id: Optional[UUID]
    potencia_resolvida_id: Optional[UUID]
    version: int
    criado_em: datetime

    class Config:
        from_attributes = True


class RejeitarSolicitacaoRequest(BaseModel):
    motivo: str = Field(..., min_length=3, max_length=500)
    version: int = Field(..., description="Versão lida pelo aprovador — usada para o lock otimista.")


class AprovarSolicitacaoRequest(BaseModel):
    """
    ATUALIZAÇÃO (2026-09-17, decisão do usuário): campos novos para
    resolver um conflito de cargo (cargo já ocupado por outro membro
    ATIVO na mesma Loja) -- ver servicos.aprovar_solicitacao para a lógica
    completa. Quando há conflito e nenhum dos dois campos é enviado, a
    API responde 409 com `detail.tipo == "conflito_cargo"` e os dados do
    titular atual, para a tela decidir. Só quem já é elegível para
    aprovar esta solicitação (SuperAdmin/webmaster, ou VM/Suplente da
    própria Loja -- `exigir_aprovador_elegivel`) pode enviar esta
    resolução; não existe papel novo para isso.
    """
    version: int = Field(..., description="Versão lida pelo aprovador — usada para o lock otimista.")
    resolucao_conflito_cargo: Optional[Literal["destituir_anterior", "novo_cargo"]] = Field(
        None,
        description=(
            "Só necessário quando uma tentativa anterior devolveu 409 "
            "com detail.tipo='conflito_cargo'. 'destituir_anterior' "
            "desativa o titular atual do cargo antes de aprovar; "
            "'novo_cargo' usa o cargo enviado em `novo_cargo` em vez do "
            "informado na solicitação."
        ),
    )
    novo_cargo: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
        description="Obrigatório quando resolucao_conflito_cargo='novo_cargo'.",
    )
