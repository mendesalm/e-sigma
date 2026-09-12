"""
Provisiona (cria, se ainda não existir) as 35 Pessoas de teste do ambiente
"Ceres [TESTE]" no banco do e-Sigma, com login real (e-mail + senha), para
que qualquer um dos 7 cargos de cada uma das 5 Lojas de teste possa ser
designado livremente como Suplente do Conselho e testado de ponta a ponta
(login real -> acesso ao CoReVM).

Idempotente: se já existir uma Pessoa com o mesmo CIM (dados_especificos->cim)
ou o mesmo e-mail, ela é PULADA (não sobrescreve nada existente).

Roda a partir de e-sigma/backend (reaproveita o database.py e o bcrypt já
instalados lá):

    cd C:\\Users\\engan\\Desktop\\e-sigma\\backend
    python provisionar_membros_teste_ceres.py

Padrão de credenciais (definido com o usuário em 2026-09-12):
    e-mail: teste.cim<CIM>@e-sigma.app
    senha:  senha123 (mesma para todos os 35 — ambiente de teste apenas)
"""
import uuid
import bcrypt
from database import SessaoLocal
from models import Pessoa

SENHA_TESTE = "senha123"
SENHA_HASH = bcrypt.hashpw(SENHA_TESTE.encode("utf-8"), bcrypt.gensalt(12)).decode("utf-8")

# (CIM, Nome completo, CPF, Loja, Cargo) — extraído do documento de handoff
# do ambiente de teste "Ceres/GO" (5 Lojas x 7 cargos = 35 membros).
MEMBROS_TESTE = [
    ("9900001", "Bernardo Silveira", "991.000.001-67", "901", "Venerável Mestre"),
    ("9900002", "Carlos Drummond", "991.000.002-48", "901", "1º Vigilante"),
    ("9900003", "Daniel Guimarães", "991.000.003-29", "901", "2º Vigilante"),
    ("9900004", "Eduardo Prado", "991.000.004-00", "901", "Orador"),
    ("9900005", "Fernando Dias", "991.000.005-90", "901", "Secretário"),
    ("9900006", "Gabriel Arcanjo", "991.000.006-71", "901", "Tesoureiro"),
    ("9900007", "Heitor Villa", "991.000.007-52", "901", "Chanceler"),

    ("9900008", "Ícaro Beltrão", "991.000.008-33", "902", "Venerável Mestre"),
    ("9900009", "Jorge Amado", "991.000.009-14", "902", "1º Vigilante"),
    ("9900010", "Kléber Toledo", "991.000.010-58", "902", "2º Vigilante"),
    ("9900011", "Leandro Karnal", "991.000.011-39", "902", "Orador"),
    ("9900012", "Murilo Mendes", "991.000.012-10", "902", "Secretário"),
    ("9900013", "Newton Paiva", "991.000.013-09", "902", "Tesoureiro"),
    ("9900014", "Olavo Bilac", "991.000.014-81", "902", "Chanceler"),

    ("9900015", "Lucas Medeiros", "991.000.015-62", "903", "Venerável Mestre"),
    ("9900016", "Paulo Freire", "991.000.016-43", "903", "1º Vigilante"),
    ("9900017", "Quintino Bocaiúva", "991.000.017-24", "903", "2º Vigilante"),
    ("9900018", "Renato Russo", "991.000.018-05", "903", "Orador"),
    ("9900019", "Sérgio Buarque", "991.000.019-96", "903", "Secretário"),
    ("9900020", "Tom Jobim", "991.000.020-20", "903", "Tesoureiro"),
    ("9900021", "Ulysses Guimarães", "991.000.021-00", "903", "Chanceler"),

    ("9900022", "Marcelo Queiroz", "991.000.022-91", "904", "Venerável Mestre"),
    ("9900023", "Vicente Celestino", "991.000.023-72", "904", "1º Vigilante"),
    ("9900024", "Wagner Tiso", "991.000.024-53", "904", "2º Vigilante"),
    ("9900025", "Xisto Bahia", "991.000.025-34", "904", "Orador"),
    ("9900026", "Yuri Gagarin", "991.000.026-15", "904", "Secretário"),
    ("9900027", "Ziraldo Alves", "991.000.027-04", "904", "Tesoureiro"),
    ("9900028", "Ariano Suassuna", "991.000.028-87", "904", "Chanceler"),

    ("9900029", "Otávio Bueno", "991.000.029-68", "905", "Venerável Mestre"),
    ("9900030", "Bento Gonçalves", "991.000.030-00", "905", "1º Vigilante"),
    ("9900031", "Castro Alves", "991.000.031-82", "905", "2º Vigilante"),
    ("9900032", "Dario Vellozo", "991.000.032-63", "905", "Orador"),
    ("9900033", "Euclides da Cunha", "991.000.033-44", "905", "Secretário"),
    ("9900034", "Fagundes Varella", "991.000.034-25", "905", "Tesoureiro"),
    ("9900035", "Gonçalves Dias", "991.000.035-06", "905", "Chanceler"),
]


def main():
    db = SessaoLocal()
    criados, pulados, erros = 0, 0, 0
    try:
        for cim, nome, cpf, loja, cargo in MEMBROS_TESTE:
            email = f"teste.cim{cim}@e-sigma.app"

            ja_existe = (
                db.query(Pessoa)
                .filter(Pessoa.dados_especificos["cim"].astext == cim)
                .first()
            )
            if ja_existe:
                print(f"[PULADO] CIM {cim} ({nome}) já existe como Pessoa (email atual: {ja_existe.email}).")
                pulados += 1
                continue

            ja_existe_email = db.query(Pessoa).filter(Pessoa.email == email).first()
            if ja_existe_email:
                print(f"[PULADO] E-mail {email} já está em uso por outra Pessoa (id={ja_existe_email.id}).")
                pulados += 1
                continue

            try:
                pessoa = Pessoa(
                    id=uuid.uuid4(),
                    tipo="Macom",
                    nome_completo=nome,
                    cpf=cpf,
                    email=email,
                    senha_hash=SENHA_HASH,
                    status_acesso="ATIVO",
                    dados_civis={},
                    dados_especificos={"cim": cim, "loja_teste": loja, "cargo_teste": cargo},
                )
                db.add(pessoa)
                db.commit()
                print(f"[OK] CIM {cim} ({nome}, {cargo} da Loja {loja}) -> {email}")
                criados += 1
            except Exception as e:
                db.rollback()
                print(f"[ERRO] CIM {cim} ({nome}): {e}")
                erros += 1
    finally:
        db.close()

    print()
    print(f"Concluído: {criados} criado(s), {pulados} pulado(s), {erros} erro(s).")
    print(f"Senha de teste para TODOS os criados: {SENHA_TESTE}")


if __name__ == "__main__":
    main()
