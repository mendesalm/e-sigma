# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Teste automatizado -- POST /auth/esqueci-senha (feature nova, 2026-09-16).

Nao consegue verificar o valor da senha nova (so vai por e-mail, nunca na
resposta da API -- de proposito), mas verifica tudo o que dá pra confirmar
sem ler a caixa de entrada:
  1. Resposta generica identica para identificador real e identificador
     inexistente (anti-enumeracao).
  2. Depois de chamar /esqueci-senha para um usuario real de teste, a
     senha ANTIGA para de funcionar no login (prova que o hash mudou de
     fato no banco).
  3. `deve_trocar_senha` fica True apos o reset (mesmo fluxo de troca
     obrigatoria do primeiro acesso).
  4. Rate limit dispara depois de varias tentativas com o mesmo
     identificador.

Cria e remove um usuario descartavel proprio (prefixo [TESTE PYTEST]) --
nao toca nos 35 membros do ambiente Ceres.

Uso (com o backend do e-Sigma no ar, porta 8000):
    python testar_esqueci_senha.py
"""
import sys
import uuid

import bcrypt
import requests

from database import SessaoLocal
from models import Pessoa

ESIGMA_URL = "http://localhost:8000/api/v1"
SENHA_ANTIGA = "SenhaAntiga@123"

FALHAS = []


def checar(descricao: str, condicao: bool, detalhe: str = ""):
    if condicao:
        print(f"  [OK] {descricao}")
    else:
        print(f"  [FALHOU] {descricao} -- {detalhe}")
        FALHAS.append(descricao)


def criar_pessoa_descartavel(db):
    email = f"teste.pytest.esqueci.senha.{uuid.uuid4().hex[:8]}@e-sigma.app"
    hash_antigo = bcrypt.hashpw(SENHA_ANTIGA.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    pessoa = Pessoa(
        tipo="Macom",
        nome_completo="[TESTE PYTEST] Esqueci Minha Senha",
        email=email,
        senha_hash=hash_antigo,
        status_acesso="ATIVO",
        deve_trocar_senha=False,
        dados_civis={},
        dados_especificos={},
    )
    db.add(pessoa)
    db.commit()
    db.refresh(pessoa)
    return pessoa, email


def login(identificador: str, senha: str):
    return requests.post(
        f"{ESIGMA_URL}/auth/login",
        json={"username": identificador, "password": senha},
        timeout=10,
    )


def esqueci_senha(identificador: str):
    return requests.post(
        f"{ESIGMA_URL}/auth/esqueci-senha",
        json={"identificador": identificador},
        timeout=10,
    )


def main():
    db = SessaoLocal()
    pessoa = None
    try:
        pessoa, email = criar_pessoa_descartavel(db)
        print(f"1) Usuario descartavel criado: {email}")

        print("\n2) Login com a senha antiga (deve funcionar antes do reset)")
        resp = login(email, SENHA_ANTIGA)
        checar("login com senha antiga funciona ANTES do reset", resp.status_code == 200, f"status={resp.status_code} body={resp.text}")

        print("\n3) Anti-enumeracao: resposta identica para identificador real e inexistente")
        resp_real = esqueci_senha(email)
        resp_falso = esqueci_senha("nao.existe.pytest@e-sigma.app")
        checar("POST /esqueci-senha (real) responde 200", resp_real.status_code == 200, f"status={resp_real.status_code} body={resp_real.text}")
        checar("POST /esqueci-senha (inexistente) responde 200", resp_falso.status_code == 200, f"status={resp_falso.status_code} body={resp_falso.text}")
        if resp_real.status_code == 200 and resp_falso.status_code == 200:
            checar("mensagens sao identicas (anti-enumeracao)", resp_real.json() == resp_falso.json(), f"real={resp_real.json()!r} falso={resp_falso.json()!r}")

        print("\n4) Login com a senha antiga (deve FALHAR depois do reset)")
        resp = login(email, SENHA_ANTIGA)
        checar("login com senha antiga falha DEPOIS do reset", resp.status_code == 401, f"status={resp.status_code} body={resp.text}")

        print("\n5) deve_trocar_senha ficou True")
        db.refresh(pessoa)
        checar("deve_trocar_senha == True", pessoa.deve_trocar_senha is True, f"deve_trocar_senha={pessoa.deve_trocar_senha!r}")

        print("\n6) Rate limit por identificador (limite configurado: 3 por 15 min)")
        ultimo_status = None
        for i in range(4):
            ultimo_status = esqueci_senha(email).status_code
        checar("4a chamada consecutiva (mesmo identificador) e bloqueada com 429", ultimo_status == 429, f"status={ultimo_status}")

    finally:
        if pessoa is not None:
            db.delete(pessoa)
            db.commit()
            print("\n[limpeza] usuario descartavel removido.")
        db.close()

    print("\n" + "=" * 60)
    if FALHAS:
        print(f"RESULTADO: {len(FALHAS)} falha(s):")
        for f in FALHAS:
            print(f"  - {f}")
        sys.exit(1)
    else:
        print("RESULTADO: TODOS OS ITENS DE /auth/esqueci-senha PASSARAM.")


if __name__ == "__main__":
    main()
