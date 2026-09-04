"""
Rotas RESTful para Processos Administrativos e Documentos.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from dependencias import obter_banco_de_dados
from api.documentos import servicos, schemas

router = APIRouter(
    prefix="/documentos",
    tags=["Burocracia e Processos Administrativos"],
    responses={404: {"description": "Recurso não encontrado"}}
)

@router.post("/", response_model=schemas.ProcessoAdministrativoResponse, status_code=status.HTTP_201_CREATED)
def iniciar_processo(dados: schemas.ProcessoAdministrativoCreate, db: Session = Depends(obter_banco_de_dados)):
    """Inicia um trâmite burocrático (ex: Pedido de Iniciação, Elevação)."""
    return servicos.criar_processo(db=db, dados=dados)

@router.get("/", response_model=List[schemas.ProcessoAdministrativoResponse])
def listar_processos(limite: int = 100, db: Session = Depends(obter_banco_de_dados)):
    """Lista todos os processos abertos na Loja."""
    return servicos.listar_processos(db=db, limite=limite)

from fastapi.responses import FileResponse
from api.auth.dependencias import obter_usuario_logado
import os

@router.get("/private/{org_slug}/{filepath:path}")
def baixar_documento_privado(
    org_slug: str,
    filepath: str,
    usuario: dict = Depends(obter_usuario_logado)
):
    """
    Entrega arquivos restritos da Loja apenas se o usuário tiver token válido.
    Pode ser expandido para validar se o usuário pertence à 'org_slug'.
    """
    # Proteção 1: Checagem básica de permissão no futuro (role == super_admin ou pertence a org)
    
    # Previne path traversal attack
    caminho_base = os.path.abspath(os.path.join("armazenamento", "instancias", "private"))
    caminho_arquivo = os.path.abspath(os.path.join(caminho_base, org_slug, filepath))
    
    if not caminho_arquivo.startswith(caminho_base):
        raise HTTPException(status_code=403, detail="Acesso negado: Tentativa de manipulação de diretório.")
        
    if not os.path.exists(caminho_arquivo):
        raise HTTPException(status_code=404, detail="Documento não encontrado na base restrita.")
        
    return FileResponse(caminho_arquivo)

from fastapi import UploadFile, File

@router.post("/private/{org_slug}/upload")
async def upload_documento_privado(
    org_slug: str,
    pasta: str = "documentos",
    file: UploadFile = File(...),
    usuario: dict = Depends(obter_usuario_logado)
):
    """
    Faz upload de um arquivo para a pasta restrita da organização.
    """
    caminho_base = os.path.abspath(os.path.join("armazenamento", "instancias", "private", org_slug, pasta))
    
    if not os.path.abspath(caminho_base).startswith(os.path.abspath(os.path.join("armazenamento", "instancias", "private"))):
        raise HTTPException(status_code=403, detail="Caminho inválido")
        
    os.makedirs(caminho_base, exist_ok=True)
    caminho_arquivo = os.path.join(caminho_base, file.filename)
    
    with open(caminho_arquivo, "wb") as buffer:
        buffer.write(await file.read())
        
    return {"status": "sucesso", "filename": file.filename, "path": f"/private/{org_slug}/{pasta}/{file.filename}"}
