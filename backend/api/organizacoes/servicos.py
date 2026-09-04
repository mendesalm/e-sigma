"""
Camada de Serviços (Service Layer) para o Módulo de Organizações.
Contém a lógica de negócio separada das rotas (controllers).
Isto facilita a testabilidade e o reuso de código, mantendo as rotas limpas.
"""

from sqlalchemy.orm import Session
from models import Organizacao
from api.organizacoes.schemas import OrganizacaoCreate
from uuid import UUID
from fastapi import HTTPException, status

def format_title_case(text: str) -> str:
    if not text:
        return text
    prepositions = {"de", "da", "do", "das", "dos", "e", "com", "na", "no", "nas", "nos"}
    words = text.split()
    formatted = []
    for i, word in enumerate(words):
        if word.lower() in prepositions and i != 0:
            formatted.append(word.lower())
        else:
            formatted.append(word.capitalize())
    return " ".join(formatted)

def listar_organizacoes(db: Session, limite: int = 100):
    """Retorna uma lista das organizações cadastradas."""
    return db.query(Organizacao).limit(limite).all()

def obter_organizacao_por_id(db: Session, org_id: UUID):
    """Busca uma organização específica pelo seu UUID."""
    return db.query(Organizacao).filter(Organizacao.id == org_id).first()

def criar_organizacao(db: Session, dados_org: OrganizacaoCreate):
    """
    Instancia e salva uma nova organização no banco de dados.
    Aplica validações de negócio, como a exclusividade do CNPJ.
    """
    
    # Padronização de formatação
    if dados_org.nome:
        dados_org.nome = format_title_case(dados_org.nome)
        
    # Prevenção de duplicidade (Case-Insensitive) pelo Nome
    if dados_org.nome:
        existe_nome = db.query(Organizacao).filter(
            Organizacao.nome.ilike(dados_org.nome),
            Organizacao.tipo == dados_org.tipo
        ).first()
        if existe_nome:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Já existe uma organização do tipo {dados_org.tipo} cadastrada com o nome '{existe_nome.nome}'."
            )

    # Validação de Negócio: Impedir CNPJ duplicado se ele for informado
    if dados_org.cnpj:
        existe = db.query(Organizacao).filter(Organizacao.cnpj == dados_org.cnpj).first()
        if existe:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="O CNPJ informado já está cadastrado em outra organização."
            )
            
    import os

    # Criação da instância usando desempacotamento de dicionário do Pydantic
    nova_organizacao = Organizacao(**dados_org.model_dump())
    
    db.add(nova_organizacao)
    db.commit()
    db.refresh(nova_organizacao) # Recarrega o objeto com o ID gerado pelo banco
    
    return nova_organizacao

from api.organizacoes.schemas import OrganizacaoUpdate

def atualizar_organizacao(db: Session, org_id: UUID, dados: OrganizacaoUpdate):
    """
    Atualiza parcialmente os dados de uma organização existente.
    """
    org = obter_organizacao_por_id(db, org_id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Organização não encontrada para atualização."
        )
    
    # Padronização de formatação
    if dados.nome:
        dados.nome = format_title_case(dados.nome)

    # Prevenção de duplicidade (Case-Insensitive) pelo Nome
    if dados.nome and dados.nome.lower() != org.nome.lower():
        existe_nome = db.query(Organizacao).filter(
            Organizacao.nome.ilike(dados.nome),
            Organizacao.tipo == org.tipo
        ).first()
        if existe_nome:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Já existe uma organização do tipo {org.tipo} cadastrada com o nome '{existe_nome.nome}'."
            )

    # Validação de Negócio: Impedir CNPJ duplicado
    if dados.cnpj and dados.cnpj != org.cnpj:
        existe = db.query(Organizacao).filter(Organizacao.cnpj == dados.cnpj).first()
        if existe:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="O CNPJ informado já está cadastrado em outra organização."
            )
            
    # Aplica as modificações enviadas ignorando valores nulos
    update_data = dados.model_dump(exclude_unset=True)
    
    # Lógica especial para mesclar o JSONB dados_especificos
    if "dados_especificos" in update_data and update_data["dados_especificos"] is not None:
        dados_antigos = org.dados_especificos or {}
        # Merge de dicts
        org.dados_especificos = {**dados_antigos, **update_data["dados_especificos"]}
        del update_data["dados_especificos"]
        
    for key, value in update_data.items():
        setattr(org, key, value)
        
    db.commit()
    db.refresh(org)
    
    return org
