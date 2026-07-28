"""
Ponto de entrada (Entrypoint) principal da API do Sigma 2.0.
Configura a documentação automática interativa (Swagger UI) conforme
exigido pelas diretrizes do projeto e registra os roteadores modulares.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.organizacoes.rotas import router as router_organizacoes
from api.pessoas.rotas import router as router_pessoas
from api.financeiro.rotas import router as router_financeiro
from api.sessoes.rotas import router as router_sessoes
from api.comunicacao.rotas import router as router_comunicacao
from api.documentos.rotas import router as router_documentos
from api.biblioteca.rotas import router as router_biblioteca
from fastapi.staticfiles import StaticFiles
import os

# Garante que a pasta base de armazenamento estático exista
os.makedirs("armazenamento/instancias", exist_ok=True)

# Instanciação da aplicação FastAPI com configurações ricas para o Swagger (Regra de Ouro)
app = FastAPI(
    title="Sigma 2.0 - API Core",
    description="""
    ## Bem-vindo à API Restful do Sigma 2.0! 🏛️
    
    Este ambiente fornece a ponte entre o Frontend React e o poderoso banco de dados
    modelado em Orientação a Objetos e JSONB do Sigma.
    
    ### Padrões de Projeto Ativos:
    * **Autenticação**: (Em construção - Bearer Tokens previstos)
    * **Módulos Verticais**: Cada funcionalidade está encapsulada em seu próprio domínio de negócio.
    * **Respostas Dinâmicas**: Vários endpoints utilizam a inteligência do JSONB para aceitar configurações flexíveis.
    """,
    version="2.0.0",
    contact={
        "name": "Arquiteto Sigma",
        "email": "contato@sigmacore.com.br",
    }
)

# Configuração de CORS para permitir requisições do Frontend React (Vite) na porta 5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Atenção: em produção deve ser restrito ao IP/Domínio do frontend!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# REGISTRO DE ROTAS (MONOLITO MODULAR E ARQUIVOS)
# ==========================================

# Monta o sistema de arquivos para acesso público no frontend
app.mount("/armazenamento", StaticFiles(directory="armazenamento"), name="armazenamento")

app.include_router(router_organizacoes, prefix="/api/v1")
app.include_router(router_pessoas, prefix="/api/v1")
app.include_router(router_financeiro, prefix="/api/v1")
app.include_router(router_sessoes, prefix="/api/v1")
app.include_router(router_comunicacao, prefix="/api/v1")
app.include_router(router_documentos, prefix="/api/v1")
app.include_router(router_biblioteca, prefix="/api/v1")

@app.get("/", tags=["Health"])
def root():
    """Rota de diagnóstico para atestar que o servidor está online."""
    return {"status": "Sigma 2.0 Operacional", "documentacao": "/docs"}
