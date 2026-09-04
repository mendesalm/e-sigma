"""
Rotas RESTful para o Módulo de SaaS.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from dependencias import obter_banco_de_dados
from api.saas import servicos, schemas

router = APIRouter(
    prefix="/saas",
    tags=["SaaS e Tratados"],
)

@router.get("/planos", response_model=List[schemas.PlanoSaaSResponse])
def listar_planos(db: Session = Depends(obter_banco_de_dados)):
    return servicos.listar_planos(db=db)

@router.post("/planos", response_model=schemas.PlanoSaaSResponse, status_code=status.HTTP_201_CREATED)
def criar_plano(dados: schemas.PlanoSaaSCreate, db: Session = Depends(obter_banco_de_dados)):
    return servicos.criar_plano(db=db, dados_plano=dados)

@router.post("/assinaturas/ativar", response_model=schemas.AssinaturaSaaSResponse, status_code=status.HTTP_201_CREATED)
def ativar_assinatura(dados: schemas.AssinaturaSaaSCreate, db: Session = Depends(obter_banco_de_dados)):
    """
    Ativa uma assinatura SaaS para uma Organização.
    Isso provisiona as pastas automaticamente (Lazy Creation) e marca a organização como ativa.
    """
    return servicos.ativar_assinatura(db=db, dados_assinatura=dados)

@router.get("/tratados", response_model=List[schemas.TratadoAmizadeResponse])
def listar_tratados(db: Session = Depends(obter_banco_de_dados)):
    return servicos.listar_tratados(db=db)

@router.post("/tratados", response_model=schemas.TratadoAmizadeResponse, status_code=status.HTTP_201_CREATED)
def criar_tratado(dados: schemas.TratadoAmizadeCreate, db: Session = Depends(obter_banco_de_dados)):
    return servicos.criar_tratado(db=db, dados_tratado=dados)

from fastapi import Request

@router.post("/checkout/{org_id}")
def criar_checkout_session(org_id: str, db: Session = Depends(obter_banco_de_dados)):
    """
    Gera a URL de Checkout do Stripe para ativar a assinatura de uma organização.
    """
    return servicos.criar_checkout_saas(db=db, org_id=org_id)

@router.post("/asaas-webhook")
async def asaas_webhook(request: Request, db: Session = Depends(obter_banco_de_dados)):
    """
    Recebe os webhooks do Asaas assíncronamente.
    """
    payload = await request.json()
    token = request.headers.get("asaas-access-token", "")
    
    return servicos.processar_webhook_asaas(db=db, payload=payload, token=token)
