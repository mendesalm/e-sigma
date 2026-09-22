# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Preparação temporária para testar manualmente o fluxo "Esqueci minha
senha" ponta a ponta (roteiro manual, Bloco A.1 — ver
`claude/roteiro-testes-manuais.md` no Project).

O e-mail cadastrado de fábrica para os usuários de teste (padrão
`teste.cim<CIM>@e-sigma.app`, ver `provisionar_membros_teste_ceres.py`) NÃO
é uma caixa real -- confirmado por bounce (550 5.1.1 "User doesn't exist")
ao tentar o teste com o CIM 9900023. Este script troca temporariamente o
e-mail cadastrado desse CIM para um e-mail real, só para este teste
pontual.

ATENÇÃO: depois de terminar o teste (receber o e-mail, logar com a senha
provisória, trocar a senha), rode `restaurar_teste_esqueci_senha_9900023.py`
para devolver o CIM 9900023 ao estado padrão dos scripts automatizados
(e-mail sintético original + senha `senha123` conhecida) -- outros scripts
de teste não assumem esse CIM com e-mail/senha diferentes.

Uso (a partir de e-sigma/backend/, com o mesmo venv/python que roda o
backend normalmente):
    python preparar_teste_esqueci_senha_9900023.py
"""
from database import SessaoLocal
from models import Pessoa

CIM = "9900023"
EMAIL_TEMPORARIO = "mendesalm@gmail.com"


def main():
    db = SessaoLocal()
    try:
        pessoa = db.query(Pessoa).filter(
            Pessoa.dados_especificos["cim"].astext == CIM
        ).first()
        if not pessoa:
            print(f"[ERRO] Nenhuma Pessoa encontrada com CIM {CIM}. Nada foi alterado.")
            return

        email_original = pessoa.email
        print(f"[INFO] Pessoa encontrada: {pessoa.nome_completo} (email atual: {email_original})")

        pessoa.email = EMAIL_TEMPORARIO
        db.commit()
        print(f"[OK] E-mail do CIM {CIM} trocado temporariamente para {EMAIL_TEMPORARIO}.")
        print(f"[LEMBRETE] E-mail original era: {email_original}")
        print("Agora rode o fluxo 'Esqueci minha senha' pela tela (ou via API) informando o CIM "
              f"{CIM} -- o e-mail deve chegar em {EMAIL_TEMPORARIO}.")
        print("Depois de concluir o teste, rode restaurar_teste_esqueci_senha_9900023.py.")
    except Exception as erro:
        db.rollback()
        print(f"[ERRO] Falha ao trocar o e-mail: {erro}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
