"""
Módulo de Dependências da API.
Contém funções que são injetadas (Dependency Injection) nas rotas do FastAPI.
Principalmente, fornece e gerencia o ciclo de vida da sessão com o Banco de Dados.
"""

from typing import Generator
from database import SessaoLocal

def obter_banco_de_dados() -> Generator:
    """
    Fornece uma sessão de banco de dados para cada requisição HTTP.
    Garante que a conexão seja fechada no final da requisição,
    mesmo que ocorra algum erro (usando o bloco finally).
    
    Esta função deve ser injetada nas rotas via `Depends(obter_banco_de_dados)`.
    """
    banco_de_dados = SessaoLocal()
    try:
        yield banco_de_dados
    finally:
        banco_de_dados.close()
