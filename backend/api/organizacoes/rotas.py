"""
Rotas (Controllers) RESTful para o Módulo de Organizações.
Fazem o direcionamento da requisição HTTP, acionam a camada de serviços
e envelopam as respostas baseadas nos Schemas.

O foco aqui é na Regra de Ouro: Documentação Rica via decorators do Swagger!
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Any
from uuid import UUID
from pydantic import BaseModel

from dependencias import obter_banco_de_dados
from api.organizacoes import servicos, schemas
from api.organizacoes.tenant_service import TenantStorageService
from api.organizacoes.importador import ServicoImportacaoCSV

router = APIRouter(
    prefix="/organizacoes",
    tags=["Organizações e Lojas"],
    responses={404: {"description": "Recurso não encontrado"}}
)

@router.post(
    "/", 
    response_model=schemas.OrganizacaoResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Cadastrar nova Organização",
    description="""
    Cria um registro hierárquico na árvore maçônica.
    
    Pode ser usado para registrar o topo da pirâmide (uma **Obediência** estadual ou nacional), 
    ou um nó descendente (uma **Subobediência** ou **Loja**).
    
    * Para criar uma Loja, certifique-se de passar o `organizacao_superior_id` apontando para sua Potência.
    * Use o `dados_especificos` para gravar o 'rito' da Loja!
    """,
    response_description="A organização criada com seu UUID."
)
def criar_organizacao(
    dados: schemas.OrganizacaoCreate, 
    db: Session = Depends(obter_banco_de_dados)
):
    return servicos.criar_organizacao(db=db, dados_org=dados)


@router.get(
    "/", 
    response_model=List[schemas.OrganizacaoResponse],
    summary="Listar Organizações",
    description="Retorna o catálogo de todas as instituições maçônicas registradas no sistema, limitadas a 100 resultados por padrão para performance.",
    response_description="Uma lista de objetos Organizacao."
)
def listar_organizacoes(
    limite: int = 100, 
    db: Session = Depends(obter_banco_de_dados)
):
    return servicos.listar_organizacoes(db=db, limite=limite)


@router.get(
    "/{org_id}", 
    response_model=schemas.OrganizacaoResponse,
    summary="Buscar Organização Específica",
    description="Localiza uma Obediência, Subobediência ou Loja a partir de seu Identificador Único (UUID).",
    response_description="O objeto completo da Organização encontrada."
)
def obter_organizacao(
    org_id: UUID, 
    db: Session = Depends(obter_banco_de_dados)
):
    organizacao = servicos.obter_organizacao_por_id(db=db, org_id=org_id)
    if not organizacao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="A organização solicitada não existe."
        )
    return organizacao

@router.patch(
    "/{org_id}", 
    response_model=schemas.OrganizacaoResponse,
    summary="Atualizar Organização Parcialmente",
    description="Atualiza dados da organização e faz o merge inteligente no JSON de dados específicos.",
    response_description="O objeto atualizado."
)
def atualizar_organizacao(
    org_id: UUID,
    dados: schemas.OrganizacaoUpdate,
    db: Session = Depends(obter_banco_de_dados)
):
    return servicos.atualizar_organizacao(db=db, org_id=org_id, dados=dados)

@router.post(
    "/{org_id}/ativar",
    response_model=schemas.OrganizacaoResponse,
    summary="Ativar Organização no SaaS",
    description="Ativa a organização (cliente_ativo_sigma = True) e cria a estrutura isolada de arquivos do Tenant.",
    response_description="O objeto atualizado."
)
def ativar_organizacao_saas(
    org_id: UUID,
    db: Session = Depends(obter_banco_de_dados)
):
    org = servicos.obter_organizacao_por_id(db=db, org_id=org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organização não encontrada.")
        
    # Ativa e cria a estrutura física e gera o webmaster
    slug = TenantStorageService.activate_tenant_storage(db, org)
    
    # Atualiza a flag
    org.cliente_ativo_sigma = True
    db.commit()
    db.refresh(org)
    
    return org

@router.post(
    "/importar/preview",
    summary="Fazer Preview de Importação em Massa (CSV)",
    description="Lê o arquivo CSV e retorna o status de cada linha (Pronto, Colisão, Erro). Não salva no banco.",
)
def importar_csv_preview(
    arquivo: UploadFile = File(...),
    db: Session = Depends(obter_banco_de_dados)
):
    if not arquivo.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Apenas arquivos .csv são suportados.")
        
    conteudo = arquivo.file.read()
    resultados = ServicoImportacaoCSV.processar_preview(db, conteudo)
    return {"resultados": resultados}

class ConfirmaImportacaoSchema(BaseModel):
    itens: list[Any]

@router.post(
    "/importar/confirmar",
    summary="Efetivar Importação em Massa",
    description="Recebe a lista de itens validados do preview e os insere no banco de dados."
)
def confirmar_importacao(
    payload: ConfirmaImportacaoSchema,
    db: Session = Depends(obter_banco_de_dados)
):
    qtd = ServicoImportacaoCSV.salvar_lote(db, payload.itens)
    return {"mensagem": f"{qtd} organizações importadas com sucesso!"}
