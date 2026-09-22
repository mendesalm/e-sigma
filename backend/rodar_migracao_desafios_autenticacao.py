# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Executa a migração `migracao_desafios_autenticacao.sql` contra o banco do
e-Sigma — cria a tabela `desafios_autenticacao`, usada pelo magic link
(POST /auth/magic-link/solicitar e /confirmar) e reservada para OTP por
e-mail no futuro (mesma tabela, coluna `tipo` nova). Ver
`claude/decisao-modernizacao-login.md` no Project "Core". Mesmo padrão
psycopg2 já usado nos demais scripts de migração do ecossistema.

Como rodar (dentro de `e-sigma/backend`, no mesmo venv do projeto):
    python rodar_migracao_desafios_autenticacao.py

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
    os.path.dirname(os.path.abspath(__file__)), "migracao_desafios_autenticacao.sql"
)

if not DATABASE_URL:
    print("ERRO: variável de ambiente DATABASE_URL não encontrada no .env.")
    sys.exit(1)

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
    print("- Tabela 'desafios_autenticacao' criada (ou já existia).")
except Exception as e:
    conexao.rollback()
    print(f"ERRO ao aplicar a migração (nada foi alterado, rollback feito): {e}")
    sys.exit(1)
finally:
    conexao.close()
