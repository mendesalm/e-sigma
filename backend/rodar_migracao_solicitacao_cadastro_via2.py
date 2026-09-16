# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Executa a migração `migracao_solicitacao_cadastro_via2.sql` contra o banco
do e-Sigma — cria a fila `solicitacoes_cadastro` (Via 2), a coluna
`pessoas.deve_trocar_senha`, e reverte as colunas do fluxo de "Ativação de
Cadastro" removido no mesmo dia. Ver
`claude/decisao-controle-acesso-cadastro.md` no Project "Core", seção 12.
Mesmo padrão psycopg2 já usado nos demais scripts de migração do
ecossistema.

Como rodar (dentro de `e-sigma/backend`, no mesmo venv do projeto):
    python rodar_migracao_solicitacao_cadastro_via2.py

Pré-requisito: `DATABASE_URL` acessível via variável de ambiente ou no
.env raiz do e-sigma.
"""
import os
import sys

from dotenv import load_dotenv
import psycopg2

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
ARQUIVO_SQL = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "migracao_solicitacao_cadastro_via2.sql"
)

if not DATABASE_URL:
    print("ERRO: variável de ambiente DATABASE_URL não encontrada no .env.")
    sys.exit(1)

# Ver comentário equivalente nos demais runners: psycopg2.connect() puro
# não entende o sufixo "+psycopg2" da URL de engine do SQLAlchemy.
if DATABASE_URL.startswith("postgresql+psycopg2://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql+psycopg2://", "postgresql://", 1)

if not os.path.exists(ARQUIVO_SQL):
    print(f"ERRO: arquivo de migração não encontrado em {ARQUIVO_SQL}")
    sys.exit(1)

with open(ARQUIVO_SQL, "r", encoding="utf-8") as f:
    sql_completo = f.read()

print(f"Conectando ao banco do e-Sigma e executando {ARQUIVO_SQL} ...")

conexao = psycopg2.connect(DATABASE_URL)
try:
    with conexao.cursor() as cursor:
        cursor.execute(sql_completo)
    conexao.commit()
    print("Migração aplicada com sucesso!")
    print("- Colunas 'codigo_ativacao_hash'/'codigo_ativacao_expira_em' removidas de 'pessoas' (ou já não existiam).")
    print("- Coluna 'deve_trocar_senha' criada em 'pessoas' (ou já existia).")
    print("- Tabela 'solicitacoes_cadastro' criada/ajustada (número+nome de Loja, campos obrigatórios, grau maçônico).")
except Exception as e:
    conexao.rollback()
    print(f"ERRO ao aplicar a migração (nada foi alterado, rollback feito): {e}")
    sys.exit(1)
finally:
    conexao.close()
