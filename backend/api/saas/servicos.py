"""
Camada de Serviços (Service Layer) para o Módulo de SaaS.
"""
import os
from sqlalchemy.orm import Session
from models import AssinaturaSaaS, PlanoSaaS, TratadoAmizade, Organizacao
from api.saas import schemas
from uuid import UUID
from fastapi import HTTPException, status
from datetime import date

def listar_planos(db: Session):
    return db.query(PlanoSaaS).all()

def criar_plano(db: Session, dados_plano: schemas.PlanoSaaSCreate):
    plano = PlanoSaaS(**dados_plano.model_dump())
    db.add(plano)
    db.commit()
    db.refresh(plano)
    return plano

def ativar_assinatura(db: Session, dados_assinatura: schemas.AssinaturaSaaSCreate):
    # Verifica se a organizacao existe
    org = db.query(Organizacao).filter(Organizacao.id == dados_assinatura.organizacao_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organização não encontrada")
        
    # Verifica se o plano existe
    plano = db.query(PlanoSaaS).filter(PlanoSaaS.id == dados_assinatura.plano_id).first()
    if not plano:
        raise HTTPException(status_code=404, detail="Plano não encontrado")

    # Verifica se já possui assinatura
    assinatura = db.query(AssinaturaSaaS).filter(AssinaturaSaaS.organizacao_id == dados_assinatura.organizacao_id).first()
    if assinatura:
        raise HTTPException(status_code=400, detail="Organização já possui assinatura")

    nova_assinatura = AssinaturaSaaS(
        **dados_assinatura.model_dump(),
        data_inicio=date.today(),
        pastas_provisionadas=True
    )
    db.add(nova_assinatura)
    
    # Atualiza a organização para cliente ativa
    org.cliente_ativo_sigma = True
    
    # Provisiona pastas (Lazy Creation)
    nome_pasta = f"loja_{org.id}" if org.tipo == "LOJA" else f"org_{org.id}"
    base_path = os.path.join("armazenamento", "instancias", nome_pasta)
    pastas_padrao = ["logo", "documentos", "imagens", "artigos", "fotos"]
    for pasta in pastas_padrao:
        os.makedirs(os.path.join(base_path, pasta), exist_ok=True)

    db.commit()
    db.refresh(nova_assinatura)
    return nova_assinatura

def listar_tratados(db: Session):
    return db.query(TratadoAmizade).all()

def criar_tratado(db: Session, dados_tratado: schemas.TratadoAmizadeCreate):
    tratado = TratadoAmizade(**dados_tratado.model_dump())
    db.add(tratado)
    db.commit()
    db.refresh(tratado)
    return tratado
