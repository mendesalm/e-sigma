"""
Script utilitário para inicialização do Banco de Dados da V2.
Sua responsabilidade é tentar criar o banco de dados 'sigma' remotamente e, em seguida,
ordenar ao SQLAlchemy que construa todas as tabelas e esquemas (com suporte ao JSONB) 
definidos nos nossos modelos.

Diretriz de Ouro: Comentários e retornos no terminal estritamente em PT-BR.
"""

import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Importamos a engine do banco e a Base (que registra as tabelas a serem criadas).
from database import motor_banco_dados, Base
# Importamos os modelos para que o SQLAlchemy saiba quais tabelas devem ser construídas.
from models import (
    Organizacao, Pessoa, Endereco,
    CategoriaFinanceira, Transacao,
    Sessao, Presenca,
    Comunicado, ProcessoAdministrativo, AcervoBiblioteca
)

def criar_banco_de_dados():
    """
    Tenta se conectar ao PostgreSQL usando credenciais administrativas genéricas 
    para criar o novo banco de dados (database) chamado 'sigma'.
    """
    try:
        # Conexão direta ao banco default ('postgres') puramente para emitir o CREATE DATABASE
        conexao = psycopg2.connect(
            dbname='postgres', 
            user='Sistema',
            password='Vdfskln49DSFkod',
            host='69.62.89.211',
            port='5432'
        )
        
        # Define o nível de isolamento para AUTOCOMMIT.
        # O PostgreSQL não permite criar bancos de dados dentro de um bloco de transação.
        conexao.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conexao.cursor()
        
        # Verifica na tabela de catálogo do Postgres se o banco 'sigma' já existe.
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'sigma'")
        existe = cursor.fetchone()
        
        if not existe:
            print("Criando o banco de dados 'sigma'...")
            cursor.execute('CREATE DATABASE sigma')
            print("Banco criado com sucesso!")
        else:
            print("O banco de dados 'sigma' ja existe. Pulando etapa de criacao.")
            
        cursor.close()
        conexao.close()
        
    except Exception as erro:
        print(f"Erro ao tentar criar o banco de dados via script (pode ser restricao de permissao do provedor): {erro}")
        print("Recomendado: Crie o banco 'sigma' manualmente no painel da sua hospedagem e rode este script novamente para gerar as tabelas.")


def criar_tabelas():
    """
    Comunica-se com a engine do SQLAlchemy instruindo-o a gerar todas as tabelas
    (CREATE TABLE) no banco recém-criado, incluindo as colunas avançadas do tipo JSONB.
    """
    print("Instruindo o SQLAlchemy a criar as tabelas no modelo OO/JSONB...")
    try:
        # A instrução metadata.create_all traduz as nossas classes Python para SQL e executa no banco de dados alvo.
        Base.metadata.create_all(bind=motor_banco_dados)
        print("Tabelas geradas e mapeadas com sucesso!")
    except Exception as erro:
        print(f"Falha critica ao tentar criar as tabelas: {erro}")


if __name__ == "__main__":
    print("="*40)
    print("   INICIALIZAÇÃO DO SIGMA 2.0 (BD)    ")
    print("="*40)
    criar_banco_de_dados()
    print("-" * 40)
    criar_tabelas()
    print("="*40)
    print("Processo de inicialização concluído.")
