import os

path = 'C:/Users/engan/OneDrive/Área de Trabalho/sigma/sigma2.0/backend/api/organizacoes/rotas.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

new_route = '''
from api.organizacoes.tenant_service import TenantStorageService

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
        
    # Ativa e cria a estrutura física
    slug = TenantStorageService.activate_tenant_storage(db, org)
    
    # Atualiza a flag
    org.cliente_ativo_sigma = True
    db.commit()
    db.refresh(org)
    
    return org
'''

if 'ativar_organizacao_saas' not in content:
    with open(path, 'a', encoding='utf-8') as f:
        f.write(new_route)

print("Rota adicionada")
