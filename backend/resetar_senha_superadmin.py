"""
Reset manual da senha do superadmin (sistema@e-sigma.app).

Motivo: a senha real foi trocada em 2026-09-11 direto no servidor (hash
gerado manualmente), e o valor nunca foi anotado em nenhum documento do
projeto -- ficou "perdida". Este script gera um novo hash bcrypt e
atualiza a coluna senha_hash de Pessoa diretamente, sem depender do
endpoint de login (que exige a senha antiga, que ninguem tem).

ATENCAO: sistema@e-sigma.app e a conta de SUPERADMIN DE PRODUCAO real
(https://e-sigma.app/login), nao uma conta so de teste -- rodar este
script muda a senha de acesso ao ambiente ao vivo. So execute se voce
realmente quer trocar essa senha agora.

Uso (a partir de e-sigma/backend/, com o mesmo venv/python que roda o
backend normalmente):
    python resetar_senha_superadmin.py
"""
import bcrypt
from database import SessaoLocal
from models import Pessoa

EMAIL_ADMIN = "sistema@e-sigma.app"
NOVA_SENHA = "Cd@ESig#01"  # Senha oficial do SuperAdmin

def main():
    db = SessaoLocal()
    try:
        pessoa = db.query(Pessoa).filter(Pessoa.email == EMAIL_ADMIN).first()
        if not pessoa:
            print(f"[ERRO] Nenhuma Pessoa encontrada com email {EMAIL_ADMIN}. Nada foi alterado.")
            return
        novo_hash = bcrypt.hashpw(NOVA_SENHA.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        pessoa.senha_hash = novo_hash
        db.commit()
        print(f"[OK] Senha de {EMAIL_ADMIN} redefinida com sucesso.")
        print(f"Nova senha: {NOVA_SENHA}")
    except Exception as erro:
        db.rollback()
        print(f"[ERRO] Falha ao redefinir a senha: {erro}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
