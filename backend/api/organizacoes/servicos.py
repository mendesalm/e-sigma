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
    
    # Criar arquitetura de arquivos isolada para o Tenant (Multi-Tenant File System)
    # Apenas se for uma Loja (ou Obediência), mas como a regra pedia loja, criamos para todas as organizações.
    nome_pasta = f"loja_{nova_organizacao.id}" if nova_organizacao.tipo == "LOJA" else f"org_{nova_organizacao.id}"
    base_path = os.path.join("armazenamento", "instancias", nome_pasta)
    
    pastas_padrao = ["logo", "documentos", "imagens", "artigos", "fotos"]
    for pasta in pastas_padrao:
        os.makedirs(os.path.join(base_path, pasta), exist_ok=True)
        
    return nova_organizacao
