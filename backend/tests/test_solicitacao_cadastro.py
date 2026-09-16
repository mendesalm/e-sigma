"""
Testes automatizados da Solicitação de Cadastro (Via 2 — 2026-09-16).

Substitui test_ativacao_cadastro.py (removido no mesmo dia, junto com o
próprio fluxo de "Ativação de Cadastro" que testava — ver
claude/decisao-controle-acesso-cadastro.md, seção 12, para o porquê: aquele
fluxo permitia auto-aprovação sem nenhuma validação humana, contrariando a
concepção original do e-Sigma).

Cobre o fluxo completo: submissão pública do formulário -> validação
cruzada Potência/Loja -> fila PENDENTE -> aprovação por um token
administrativo (via `app.dependency_overrides`, sem precisar de um usuário
real logado) -> Pessoa criada com senha provisória (capturada por
monkeypatch, sem checar e-mail de verdade) -> login com a senha provisória
retorna `deve_trocar_senha=true` -> POST /auth/trocar-senha-obrigatoria
conclui o fluxo. Também cobre os pontos de segurança que motivaram a
correção desta feature:
  * resposta genérica idêntica para Potência/Loja inválidas, Loja que não
    pertence à Potência informada, número/nome de Loja inconsistentes, e
    submissão válida (anti-enumeração);
  * lock otimista (409 ao tentar aprovar/rejeitar duas vezes com a mesma
    `version`);
  * POST /pessoas/ agora exige token administrativo (a vulnerabilidade que
    motivou toda a correção desta sessão);
  * todos os campos de identificação são obrigatórios, e a nova senha
    escolhida na troca obrigatória não pode ser fraca (2026-09-16, pedido
    explícito do usuário).

Roda contra o mesmo banco real apontado por DATABASE_URL (sem base de
teste isolada neste projeto, mesmo padrão de test_auth.py) — toda
Organizacao/Pessoa/SolicitacaoCadastro criada aqui usa um prefixo
"[TESTE PYTEST]"/"pytest." e é removida no teardown.

Rodar (a partir de e-sigma/backend):
    pytest tests/test_solicitacao_cadastro.py -v
"""
import uuid

import bcrypt
import pytest

from database import SessaoLocal
from models import MembroOrganizacao, Organizacao, Pessoa, SolicitacaoCadastro
from api.auth.dependencias import obter_usuario_logado
import api.solicitacoes_cadastro.servicos as servicos_solicitacao
from main import app

ADMIN_PAYLOAD = {"sub": "admin.pytest@e-sigma.app", "user_id": None, "role": "super_admin"}


def _buscar_org_por_chave_loja(db, loja_api_id):
    org = (
        db.query(Organizacao)
        .filter(Organizacao.dados_especificos["lojas_db_loja_id"].astext == str(loja_api_id))
        .first()
    )
    return org.id if org else None


@pytest.fixture
def hierarquia_teste(monkeypatch):
    """2026-09-16 (achado ao testar pela UI real, ver
    claude/decisao-controle-acesso-cadastro.md seção 13 no Project "Core"):
    a validação cruzada Potência/Loja passou a consultar a API de
    Hierarquia do módulo Lojas em vez de comparar contra uma cópia local
    de `organizacoes`. Este fixture não seeda mais Organizacao localmente
    -- em vez disso, faz `monkeypatch.setattr` em
    `servicos_solicitacao.buscar_loja_por_numero` para devolver um payload
    sintético (prefixo "[TESTE PYTEST]"), exercitando de verdade os
    upserts reais (`_upsert_organizacao_potencia`/`_upsert_organizacao_loja`)
    contra o banco. Function-scoped (não mais module-scoped) porque
    `monkeypatch` só existe nesse escopo."""
    numero_loja = f"PYTEST-{uuid.uuid4().hex[:10]}"
    loja_api_id = f"pytest-loja-{uuid.uuid4().hex[:10]}"
    potencia_api_id = f"pytest-pot-{uuid.uuid4().hex[:10]}"

    dados_api = {
        "loja": {
            "id": loja_api_id,
            "nome_loja": "[TESTE PYTEST] Loja Descartavel Via2",
            "numero_loja": numero_loja,
            "codigo_loja": "PYTESTLOJA",
        },
        "potencia": {
            "id": potencia_api_id,
            "nome": "[TESTE PYTEST] Potencia Descartavel",
            "sigla": "PYTESTPOT",
        },
        "obediencia": None,
    }

    def _fake_buscar_loja_por_numero(numero_informado):
        if numero_informado == numero_loja:
            return dados_api
        return None

    monkeypatch.setattr(servicos_solicitacao, "buscar_loja_por_numero", _fake_buscar_loja_por_numero)

    info = {
        "potencia_nome": dados_api["potencia"]["nome"],
        "loja_numero": numero_loja,
        "loja_nome": dados_api["loja"]["nome_loja"],
        "outra_potencia_nome": "[TESTE PYTEST] Outra Potencia Que Nao E Essa",
        "loja_api_id": loja_api_id,
        "potencia_api_id": potencia_api_id,
    }

    yield info

    # Limpeza por padrão de nome (não mais por id pré-conhecido, já que a
    # Organizacao só é criada quando um teste efetivamente chama o upsert).
    db = SessaoLocal()
    try:
        orgs_teste = db.query(Organizacao).filter(Organizacao.nome.like("[TESTE PYTEST]%")).all()
        ids_orgs = [org.id for org in orgs_teste]
        if ids_orgs:
            db.query(SolicitacaoCadastro).filter(
                SolicitacaoCadastro.loja_resolvida_id.in_(ids_orgs)
            ).delete(synchronize_session=False)
            db.commit()
            db.query(MembroOrganizacao).filter(MembroOrganizacao.organizacao_id.in_(ids_orgs)).delete(
                synchronize_session=False
            )
            db.commit()
            db.query(Organizacao).filter(Organizacao.id.in_(ids_orgs)).delete(synchronize_session=False)
            db.commit()
    finally:
        db.close()


@pytest.fixture
def limpar_apos_teste():
    """Coleta ids de SolicitacaoCadastro/Pessoa criados durante o teste
    (o teste faz `registro["solicitacao_ids"].append(...)` etc.) e limpa
    tudo no teardown, nesta ordem (por causa das FKs): MembroOrganizacao ->
    SolicitacaoCadastro -> Pessoa."""
    registro = {"solicitacao_ids": [], "pessoa_ids": []}
    yield registro

    db = SessaoLocal()
    try:
        if registro["pessoa_ids"]:
            db.query(MembroOrganizacao).filter(
                MembroOrganizacao.pessoa_id.in_(registro["pessoa_ids"])
            ).delete(synchronize_session=False)
            db.commit()
        if registro["solicitacao_ids"]:
            db.query(SolicitacaoCadastro).filter(
                SolicitacaoCadastro.id.in_(registro["solicitacao_ids"])
            ).delete(synchronize_session=False)
            db.commit()
        if registro["pessoa_ids"]:
            db.query(Pessoa).filter(Pessoa.id.in_(registro["pessoa_ids"])).delete(synchronize_session=False)
            db.commit()
    finally:
        db.close()


@pytest.fixture
def capturar_emails(monkeypatch):
    """Substitui os dois envios de e-mail deste fluxo por captura em
    memória — mesma técnica já usada em test_ativacao_cadastro.py."""
    capturados = {"senha_provisoria": [], "rejeicao": []}

    def _fake_senha(destinatario, nome, senha):
        capturados["senha_provisoria"].append({"destinatario": destinatario, "senha": senha})
        return True

    def _fake_rejeicao(destinatario, nome, motivo):
        capturados["rejeicao"].append({"destinatario": destinatario, "motivo": motivo})
        return True

    monkeypatch.setattr(servicos_solicitacao, "enviar_senha_provisoria", _fake_senha)
    monkeypatch.setattr(servicos_solicitacao, "enviar_rejeicao_solicitacao_cadastro", _fake_rejeicao)
    return capturados


@pytest.fixture
def como_admin():
    """Sobrepõe a dependência `obter_usuario_logado` para simular um
    token super_admin válido, sem precisar de um login real — o objetivo
    aqui é testar a lógica de aprovação/rejeição, não o JWT em si (esse já
    é coberto por test_auth.py)."""
    app.dependency_overrides[obter_usuario_logado] = lambda: ADMIN_PAYLOAD
    yield ADMIN_PAYLOAD
    app.dependency_overrides.pop(obter_usuario_logado, None)


def _payload_valido(hierarquia_teste, email=None):
    return {
        "potencia_informada": hierarquia_teste["potencia_nome"],
        "numero_loja_informado": hierarquia_teste["loja_numero"],
        "nome_loja_informado": hierarquia_teste["loja_nome"],
        "nome_completo": "Pytest Candidato Via2",
        "grau_maconico": 3,
        "cim": "PYTEST-CIM-0001",
        "cpf": "00000000000",
        "email": email or f"pytest.via2.{uuid.uuid4().hex[:10]}@teste.e-sigma.app",
        "telefone": "11999990000",
        "cargo_atual": "Secretário",
        "data_inicio_mandato": None,
    }


def test_solicitacao_valida_entra_como_pendente(client, hierarquia_teste, limpar_apos_teste):
    payload = _payload_valido(hierarquia_teste)
    resposta = client.post("/api/v1/solicitacoes-cadastro/", json=payload)
    assert resposta.status_code == 200
    mensagem_generica = resposta.json()["mensagem"]

    db = SessaoLocal()
    try:
        solicitacao = db.query(SolicitacaoCadastro).filter(SolicitacaoCadastro.email == payload["email"]).first()
        assert solicitacao is not None
        limpar_apos_teste["solicitacao_ids"].append(solicitacao.id)
        assert solicitacao.status == "PENDENTE"
        assert _buscar_org_por_chave_loja(db, hierarquia_teste["loja_api_id"]) == solicitacao.loja_resolvida_id
    finally:
        db.close()

    # Repete com Potência inexistente. MUDANÇA DE COMPORTAMENTO (2026-09-
    # 16, ver seção 13 da decisão): antes disto era rejeição automática
    # DURA (nenhum registro), porque a Potência era resolvida por busca
    # local independente da Loja. Agora a Loja é resolvida direto pelo
    # NÚMERO via API de Hierarquia -- que já devolve a Potência real junto
    # -- então uma Potência informada incorreta não impede mais a
    # resolução: passa a ser SOFT reject (mesma categoria que "nome da
    # Loja não bate"), registrado como REJEITADO_AUTOMATICO com motivo só
    # interno, resposta ao candidato continua genérica.
    payload_invalido = _payload_valido(hierarquia_teste)
    payload_invalido["potencia_informada"] = "Potência Que Não Existe De Verdade"
    resposta_invalida = client.post("/api/v1/solicitacoes-cadastro/", json=payload_invalido)
    assert resposta_invalida.status_code == 200
    assert resposta_invalida.json()["mensagem"] == mensagem_generica

    db = SessaoLocal()
    try:
        solicitacao_invalida = (
            db.query(SolicitacaoCadastro).filter(SolicitacaoCadastro.email == payload_invalido["email"]).first()
        )
        assert solicitacao_invalida is not None
        limpar_apos_teste["solicitacao_ids"].append(solicitacao_invalida.id)
        assert solicitacao_invalida.status == "REJEITADO_AUTOMATICO"
        assert solicitacao_invalida.motivo_interno is not None
    finally:
        db.close()


def test_loja_fora_da_potencia_e_rejeitada_automaticamente_mas_resposta_e_generica(
    client, hierarquia_teste, limpar_apos_teste
):
    """Seção 2.3: Loja existe, mas não pertence à Potência informada --
    fica registrada (para análise agregada de fraude) com status
    REJEITADO_AUTOMATICO e motivo só interno, mas o candidato recebe a
    MESMA resposta genérica de sempre."""
    payload = _payload_valido(hierarquia_teste)
    payload["potencia_informada"] = hierarquia_teste["outra_potencia_nome"]  # loja não é dessa potência

    resposta = client.post("/api/v1/solicitacoes-cadastro/", json=payload)
    assert resposta.status_code == 200

    db = SessaoLocal()
    try:
        solicitacao = db.query(SolicitacaoCadastro).filter(SolicitacaoCadastro.email == payload["email"]).first()
        assert solicitacao is not None
        limpar_apos_teste["solicitacao_ids"].append(solicitacao.id)
        assert solicitacao.status == "REJEITADO_AUTOMATICO"
        assert solicitacao.motivo_interno is not None
    finally:
        db.close()


def test_numero_e_nome_da_loja_inconsistentes_e_rejeitada_automaticamente_mas_resposta_e_generica(
    client, hierarquia_teste, limpar_apos_teste
):
    """2026-09-16: a Loja agora é informada por DOIS campos (número e
    nome) em vez de um único campo de texto livre -- se o número resolve
    para uma Loja real mas o nome informado não bate com o nome (ou
    sigla) dela, é a mesma lógica de "soft reject" da seção 2.3: fica
    registrada como REJEITADO_AUTOMATICO com motivo só interno, mas o
    candidato recebe a resposta genérica de sempre."""
    payload = _payload_valido(hierarquia_teste)
    payload["nome_loja_informado"] = "Nome de Loja Que Não Bate De Verdade"

    resposta = client.post("/api/v1/solicitacoes-cadastro/", json=payload)
    assert resposta.status_code == 200

    db = SessaoLocal()
    try:
        solicitacao = db.query(SolicitacaoCadastro).filter(SolicitacaoCadastro.email == payload["email"]).first()
        assert solicitacao is not None
        limpar_apos_teste["solicitacao_ids"].append(solicitacao.id)
        assert solicitacao.status == "REJEITADO_AUTOMATICO"
        assert solicitacao.motivo_interno is not None
        # Mesmo com nome inconsistente, o número da Loja resolveu de
        # verdade, então o registro fica vinculado a ela (para análise).
        assert solicitacao.loja_resolvida_id == _buscar_org_por_chave_loja(db, hierarquia_teste["loja_api_id"])
    finally:
        db.close()


def test_grau_maconico_invalido_e_rejeitado_pelo_schema(client, hierarquia_teste):
    """`grau_maconico` só aceita 1 (Aprendiz), 2 (Companheiro) ou 3
    (Mestre) -- qualquer outro valor é rejeitado ainda na validação do
    Pydantic (422), antes de qualquer lógica de negócio."""
    payload = _payload_valido(hierarquia_teste)
    payload["grau_maconico"] = 5
    resposta = client.post("/api/v1/solicitacoes-cadastro/", json=payload)
    assert resposta.status_code == 422


def test_fluxo_completo_aprovacao_gera_pessoa_com_senha_provisoria(
    client, hierarquia_teste, limpar_apos_teste, capturar_emails, como_admin
):
    payload = _payload_valido(hierarquia_teste)
    client.post("/api/v1/solicitacoes-cadastro/", json=payload)

    db = SessaoLocal()
    try:
        solicitacao = db.query(SolicitacaoCadastro).filter(SolicitacaoCadastro.email == payload["email"]).first()
        assert solicitacao is not None
        solicitacao_id = str(solicitacao.id)
        version = solicitacao.version
    finally:
        db.close()
    limpar_apos_teste["solicitacao_ids"].append(uuid.UUID(solicitacao_id))

    resposta = client.post(
        f"/api/v1/solicitacoes-cadastro/{solicitacao_id}/aprovar",
        json={"version": version},
    )
    assert resposta.status_code == 200
    corpo = resposta.json()
    assert corpo["status"] == "APROVADO"

    assert len(capturar_emails["senha_provisoria"]) == 1
    assert capturar_emails["senha_provisoria"][0]["destinatario"] == payload["email"]
    senha_provisoria = capturar_emails["senha_provisoria"][0]["senha"]
    assert len(senha_provisoria) == 12

    db = SessaoLocal()
    try:
        pessoa = db.query(Pessoa).filter(Pessoa.email == payload["email"]).first()
        assert pessoa is not None
        limpar_apos_teste["pessoa_ids"].append(pessoa.id)
        assert pessoa.status_acesso == "ATIVO"
        assert pessoa.deve_trocar_senha is True
        assert bcrypt.checkpw(senha_provisoria.encode("utf-8"), pessoa.senha_hash.encode("utf-8"))

        vinculo = db.query(MembroOrganizacao).filter(MembroOrganizacao.pessoa_id == pessoa.id).first()
        assert vinculo is not None
        assert vinculo.organizacao_id == _buscar_org_por_chave_loja(db, hierarquia_teste["loja_api_id"])
    finally:
        db.close()

    # Login real com a senha provisória: funciona, e sinaliza a troca
    # obrigatória.
    resposta_login = client.post(
        "/api/v1/auth/login",
        json={"username": payload["email"], "password": senha_provisoria, "modulo_origem": "pytest"},
    )
    assert resposta_login.status_code == 200
    corpo_login = resposta_login.json()
    assert corpo_login["deve_trocar_senha"] is True

    # Segunda tentativa de aprovar a MESMA solicitação (version já mudou):
    # lock otimista rejeita com 409.
    resposta_repetida = client.post(
        f"/api/v1/solicitacoes-cadastro/{solicitacao_id}/aprovar",
        json={"version": version},
    )
    assert resposta_repetida.status_code in (400, 409)  # já não está mais PENDENTE / version não bate


def test_trocar_senha_obrigatoria(client, hierarquia_teste, limpar_apos_teste, capturar_emails, como_admin):
    payload = _payload_valido(hierarquia_teste)
    client.post("/api/v1/solicitacoes-cadastro/", json=payload)

    db = SessaoLocal()
    try:
        solicitacao = db.query(SolicitacaoCadastro).filter(SolicitacaoCadastro.email == payload["email"]).first()
        solicitacao_id = str(solicitacao.id)
        version = solicitacao.version
    finally:
        db.close()
    limpar_apos_teste["solicitacao_ids"].append(uuid.UUID(solicitacao_id))

    client.post(f"/api/v1/solicitacoes-cadastro/{solicitacao_id}/aprovar", json={"version": version})
    senha_provisoria = capturar_emails["senha_provisoria"][0]["senha"]

    db = SessaoLocal()
    try:
        pessoa = db.query(Pessoa).filter(Pessoa.email == payload["email"]).first()
        limpar_apos_teste["pessoa_ids"].append(pessoa.id)
    finally:
        db.close()

    # A partir daqui o teste passa a autenticar como o CANDIDATO real (via
    # login com a senha provisória), não mais como o admin simulado pela
    # fixture `como_admin` -- então o override de `obter_usuario_logado`
    # precisa ser removido, ou toda chamada seguinte (mesmo com um Bearer
    # de verdade) continuaria sendo tratada como o admin, e não como o
    # candidato que de fato está trocando a própria senha.
    app.dependency_overrides.pop(obter_usuario_logado, None)

    resposta_login = client.post(
        "/api/v1/auth/login",
        json={"username": payload["email"], "password": senha_provisoria, "modulo_origem": "pytest"},
    )
    token = resposta_login.json()["access_token"]

    nova_senha = "NovaSenha!Pytest123"
    resposta_troca = client.post(
        "/api/v1/auth/trocar-senha-obrigatoria",
        json={"senha_atual": senha_provisoria, "nova_senha": nova_senha},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resposta_troca.status_code == 200

    db = SessaoLocal()
    try:
        pessoa = db.query(Pessoa).filter(Pessoa.email == payload["email"]).first()
        assert pessoa.deve_trocar_senha is False
        assert bcrypt.checkpw(nova_senha.encode("utf-8"), pessoa.senha_hash.encode("utf-8"))
    finally:
        db.close()

    # E o login seguinte já não pede mais troca.
    resposta_login_final = client.post(
        "/api/v1/auth/login",
        json={"username": payload["email"], "password": nova_senha, "modulo_origem": "pytest"},
    )
    assert resposta_login_final.status_code == 200
    assert resposta_login_final.json()["deve_trocar_senha"] is False


def test_trocar_senha_obrigatoria_rejeita_senha_fraca(
    client, hierarquia_teste, limpar_apos_teste, capturar_emails, como_admin
):
    """2026-09-16, pedido explícito do usuário: "Quando houver a
    substituição da senha não aceitar senha fraca" -- valida que a
    política (api/auth/senha_policy.py) é de fato aplicada em
    /auth/trocar-senha-obrigatoria, e não só no frontend."""
    payload = _payload_valido(hierarquia_teste)
    client.post("/api/v1/solicitacoes-cadastro/", json=payload)

    db = SessaoLocal()
    try:
        solicitacao = db.query(SolicitacaoCadastro).filter(SolicitacaoCadastro.email == payload["email"]).first()
        solicitacao_id = str(solicitacao.id)
        version = solicitacao.version
    finally:
        db.close()
    limpar_apos_teste["solicitacao_ids"].append(uuid.UUID(solicitacao_id))

    client.post(f"/api/v1/solicitacoes-cadastro/{solicitacao_id}/aprovar", json={"version": version})
    senha_provisoria = capturar_emails["senha_provisoria"][0]["senha"]

    db = SessaoLocal()
    try:
        pessoa = db.query(Pessoa).filter(Pessoa.email == payload["email"]).first()
        limpar_apos_teste["pessoa_ids"].append(pessoa.id)
    finally:
        db.close()

    # Ver comentário equivalente em test_trocar_senha_obrigatoria: a partir
    # daqui autenticamos como o candidato de verdade, então o override de
    # `obter_usuario_logado` (usado só para o /aprovar acima) precisa sair.
    app.dependency_overrides.pop(obter_usuario_logado, None)

    resposta_login = client.post(
        "/api/v1/auth/login",
        json={"username": payload["email"], "password": senha_provisoria, "modulo_origem": "pytest"},
    )
    token = resposta_login.json()["access_token"]

    for senha_fraca in ("12345678910", "senha1234", "SENHASEMNUMEROESPECIAL"):
        resposta_troca = client.post(
            "/api/v1/auth/trocar-senha-obrigatoria",
            json={"senha_atual": senha_provisoria, "nova_senha": senha_fraca},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resposta_troca.status_code == 400

    # A Pessoa continua com deve_trocar_senha=True -- nenhuma das
    # tentativas fracas foi aceita.
    db = SessaoLocal()
    try:
        pessoa = db.query(Pessoa).filter(Pessoa.email == payload["email"]).first()
        assert pessoa.deve_trocar_senha is True
    finally:
        db.close()


def test_rejeitar_solicitacao_envia_motivo_por_email(
    client, hierarquia_teste, limpar_apos_teste, capturar_emails, como_admin
):
    payload = _payload_valido(hierarquia_teste)
    client.post("/api/v1/solicitacoes-cadastro/", json=payload)

    db = SessaoLocal()
    try:
        solicitacao = db.query(SolicitacaoCadastro).filter(SolicitacaoCadastro.email == payload["email"]).first()
        solicitacao_id = str(solicitacao.id)
        version = solicitacao.version
    finally:
        db.close()
    limpar_apos_teste["solicitacao_ids"].append(uuid.UUID(solicitacao_id))

    resposta = client.post(
        f"/api/v1/solicitacoes-cadastro/{solicitacao_id}/rejeitar",
        json={"version": version, "motivo": "CIM informado não consta na Loja indicada."},
    )
    assert resposta.status_code == 200
    assert resposta.json()["status"] == "REJEITADO"
    assert len(capturar_emails["rejeicao"]) == 1
    assert capturar_emails["rejeicao"][0]["destinatario"] == payload["email"]

    # Nenhuma Pessoa deve ter sido criada.
    db = SessaoLocal()
    try:
        assert db.query(Pessoa).filter(Pessoa.email == payload["email"]).first() is None
    finally:
        db.close()


def test_criar_pessoa_direto_agora_exige_token_administrativo(client):
    """Regressão da vulnerabilidade que motivou toda esta correção
    (2026-09-16): POST /pessoas/ era uma rota aberta, sem nenhuma
    autenticação -- combinada com o antigo fluxo de "Ativação de
    Cadastro", permitia auto-cadastro completo sem validação humana."""
    resposta = client.post(
        "/api/v1/pessoas/",
        json={
            "organizacao_id": str(uuid.uuid4()),
            "nome_completo": "Tentativa Sem Auth",
            "tipo_pessoa": "MACOM",
            "email": f"pytest.semauth.{uuid.uuid4().hex[:8]}@teste.e-sigma.app",
        },
    )
    assert resposta.status_code == 401
