from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests
import os
import jwt
import bcrypt
from datetime import datetime, timedelta

from dependencias import obter_banco_de_dados
from models import Pessoa, MembroOrganizacao, AssinaturaSaaS

router = APIRouter(prefix="/auth", tags=["Autenticação"])

# Configurações do JWT
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "minha_chave_super_secreta_sigma_2")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Pydantic schemas
class GoogleAuthRequest(BaseModel):
    credential: str

class LoginRequest(BaseModel):
    username: str
    password: str

def create_access_token(data: dict):
    to_encode = data.copy()
    # Tratando deprecation warning utcnow() para now(UTC)
    from datetime import timezone
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire.timestamp()})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/google")
async def login_with_google(request: GoogleAuthRequest, db: Session = Depends(obter_banco_de_dados)):
    CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "COLOQUE_SEU_CLIENT_ID_AQUI")
    try:
        # Verificar o token com o Google
        idinfo = id_token.verify_oauth2_token(
            request.credential, 
            requests.Request(), 
            CLIENT_ID,
            clock_skew_in_seconds=10
        )
        
        email = idinfo.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Token do Google não contém e-mail.")

        # Buscar o usuário pelo e-mail no Banco de Dados
        user = db.query(Pessoa).filter(Pessoa.email == email).first()
        if not user:
            raise HTTPException(status_code=401, detail="Usuário não cadastrado no Sigma.")

        # Tratamento das roles lidas do JSONB
        permissoes = user.permissoes_sistema or []
        role_primaria = "member"
        if "super_admin" in permissoes:
            role_primaria = "super_admin"
        elif "webmaster" in permissoes:
            role_primaria = "webmaster"

        # Buscar a loja primária do usuário
        vinculo = db.query(MembroOrganizacao).filter(MembroOrganizacao.pessoa_id == user.id, MembroOrganizacao.status == "ATIVO").first()
        loja_id = str(vinculo.organizacao_id) if vinculo else None
        
        harmonia_ativo = False
        if loja_id:
            assinatura = db.query(AssinaturaSaaS).filter(AssinaturaSaaS.organizacao_id == loja_id, AssinaturaSaaS.status == "ATIVA").first()
            if assinatura and assinatura.plano:
                modulos = assinatura.plano.modulos_inclusos or []
                harmonia_ativo = "harmonia" in modulos

        # Gerar o JWT do Sigma 2.0
        token_payload = {
            "sub": user.email,
            "user_id": str(user.id),
            "loja_id": loja_id,
            "harmonia_ativo": harmonia_ativo,
            "role": role_primaria,
            "requires_selection": False # Mock por enquanto até termos seleção multi-lojas completa
        }

        access_token = create_access_token(token_payload)
        return {"access_token": access_token, "token_type": "bearer"}

    except ValueError as e:
        # Invalid token
        raise HTTPException(status_code=401, detail=f"Token do Google inválido: {str(e)}")

@router.post("/login")
async def login_tradicional(request: LoginRequest, db: Session = Depends(obter_banco_de_dados)):
    user = db.query(Pessoa).filter(Pessoa.email == request.username).first()
    
    if not user or not user.senha_hash:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
        
    senha_valida = False
    try:
        senha_valida = bcrypt.checkpw(request.password.encode('utf-8'), user.senha_hash.encode('utf-8'))
    except ValueError:
        raise HTTPException(status_code=401, detail="Hash de senha em formato inválido no banco de dados.")

    if not senha_valida:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    permissoes = user.permissoes_sistema or []
    role_primaria = "member"
    if "super_admin" in permissoes:
        role_primaria = "super_admin"
    elif "webmaster" in permissoes:
        role_primaria = "webmaster"

    # Buscar a loja primária do usuário (assumindo a primeira ativa que ele tiver)
    vinculo = db.query(MembroOrganizacao).filter(MembroOrganizacao.pessoa_id == user.id, MembroOrganizacao.status == "ATIVO").first()
    loja_id = str(vinculo.organizacao_id) if vinculo else None
    
    harmonia_ativo = False
    if loja_id:
        # Verifica se a loja possui assinatura ativa
        assinatura = db.query(AssinaturaSaaS).filter(AssinaturaSaaS.organizacao_id == loja_id, AssinaturaSaaS.status == "ATIVA").first()
        if assinatura and assinatura.plano:
            modulos = assinatura.plano.modulos_inclusos or []
            harmonia_ativo = "harmonia" in modulos

    token_payload = {
        "sub": user.email,
        "user_id": str(user.id),
        "loja_id": loja_id,
        "harmonia_ativo": harmonia_ativo,
        "role": role_primaria,
        "requires_selection": False
    }
    
    access_token = create_access_token(token_payload)
    return {"access_token": access_token, "token_type": "bearer"}
