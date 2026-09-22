# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Provisiona (cria, se ainda não existir) a `Pessoa` de teste correspondente
ao Obreiro "Mestre Instalado" criado por
`Lojas/backend/provisionar_mestre_instalado_teste_bloco_b.py` -- mesmo CIM
nos dois lados, para permitir login real (e-mail + senha) e completar o
Bloco B do roteiro de testes manuais (claude/roteiro-testes-manuais.md no
Project "Core").

Mesmo padrão de credenciais já usado em provisionar_membros_teste_ceres.py:
    e-mail: teste.cim9911003@e-sigma.app
    senha:  senha123

Idempotente: se já existir uma Pessoa com o mesmo CIM ou o mesmo e-mail,
não faz nada.

Roda a partir de e-sigma/backend:
    cd C:\\Users\\engan\\Desktop\\e-sigma\\backend
    python provisionar_mestre_instalado_teste_bloco_b_esigma.py
"""
import uuid
import bcrypt
from database import SessaoLocal
from models import Pessoa

CIM_TESTE = "9911003"
NOME_TESTE = "Heráclito Fontenele (Mestre Instalado — teste Bloco B)"
EMAIL_TESTE = "teste.cim9911003@e-sigma.app"
SENHA_TESTE = "senha123"
SENHA_HASH = bcrypt.hashpw(SENHA_TESTE.encode("utf-8"), bcrypt.gensalt(12)).decode("utf-8")


def main():
    db = SessaoLocal()
    try:
        ja_existe = db.query(Pessoa).filter(Pessoa.dados_especificos["cim"].astext == CIM_TESTE).first()
        if ja_existe:
            print(f"[PULADO] CIM {CIM_TESTE} já existe como Pessoa (email atual: {ja_existe.email}).")
            return

        ja_existe_email = db.query(Pessoa).filter(Pessoa.email == EMAIL_TESTE).first()
        if ja_existe_email:
            print(f"[PULADO] E-mail {EMAIL_TESTE} já está em uso por outra Pessoa (id={ja_existe_email.id}).")
            return

        pessoa = Pessoa(
            id=uuid.uuid4(),
            tipo="Macom",
            nome_completo=NOME_TESTE,
            email=EMAIL_TESTE,
            senha_hash=SENHA_HASH,
            status_acesso="ATIVO",
            dados_civis={},
            dados_especificos={"cim": CIM_TESTE, "loja_teste": "904", "cargo_teste": "Mestre Instalado (teste Bloco B)"},
        )
        db.add(pessoa)
        db.commit()
        print(f"[OK] CIM {CIM_TESTE} ({NOME_TESTE}) -> {EMAIL_TESTE}")
        print(f"Senha de teste: {SENHA_TESTE}")
        print()
        print("Agora, logado como VM da Loja 904 (ou SuperAdmin), abra 'Designar Suplente' e confirme")
        print("que este Mestre Instalado aparece na lista de elegíveis -- ver item B.1 do roteiro de testes.")
    except Exception as e:
        db.rollback()
        print(f"ERRO: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
