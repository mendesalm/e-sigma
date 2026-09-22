# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Restauração pós-teste do fluxo "Esqueci minha senha" (roteiro manual,
Bloco A.1 -- ver `claude/roteiro-testes-manuais.md` no Project).

Devolve o CIM 9900023 ao estado padrão usado pelos scripts automatizados
e pelo restante do roteiro:
  - e-mail de volta para o padrão sintético `teste.cim9900023@e-sigma.app`
  - senha de volta para `senha123` (o padrão de todos os usuários de teste)
  - `deve_trocar_senha` de volta para False

Rode isto DEPOIS de terminar o teste manual do Bloco A.1 (depois de já ter
recebido o e-mail e confirmado o redirecionamento para
`/trocar-senha-obrigatoria`) -- não precisa ter guardado a senha
provisória recebida, este script ignora ela e define a senha padrão
direto.

Uso (a partir de e-sigma/backend/, com o mesmo venv/python que roda o
backend normalmente):
    python restaurar_teste_esqueci_senha_9900023.py
"""
import bcrypt
from database import SessaoLocal
from models import Pessoa

CIM = "9900023"
EMAIL_ORIGINAL = f"teste.cim{CIM}@e-sigma.app"
SENHA_PADRAO = "senha123"


def main():
    db = SessaoLocal()
    try:
        pessoa = db.query(Pessoa).filter(
            Pessoa.dados_especificos["cim"].astext == CIM
        ).first()
        if not pessoa:
            print(f"[ERRO] Nenhuma Pessoa encontrada com CIM {CIM}. Nada foi alterado.")
            return

        print(f"[INFO] Pessoa encontrada: {pessoa.nome_completo} (email atual: {pessoa.email})")

        pessoa.email = EMAIL_ORIGINAL
        pessoa.senha_hash = bcrypt.hashpw(SENHA_PADRAO.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        pessoa.deve_trocar_senha = False
        db.commit()

        print(f"[OK] CIM {CIM} restaurado:")
        print(f"     email -> {EMAIL_ORIGINAL}")
        print(f"     senha -> {SENHA_PADRAO}")
        print("     deve_trocar_senha -> False")
    except Exception as erro:
        db.rollback()
        print(f"[ERRO] Falha ao restaurar: {erro}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
