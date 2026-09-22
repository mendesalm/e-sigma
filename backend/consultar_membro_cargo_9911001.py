# EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
"""
Consulta SOMENTE LEITURA (não altera nada no banco) para responder:
- Qual foi o `cargo_atual` enviado na Solicitação de Cadastro do candidato
  de teste CIM 9911001?
- Quantos `MembroOrganizacao` ATIVOS existem hoje na mesma Loja, e com
  quais cargos -- para ver se o novo candidato duplicou um cargo já
  ocupado (ex.: "Secretário") em vez de substituir o titular anterior.

Motivo: o código de `aprovar_solicitacao` (em
e-sigma/backend/api/solicitacoes_cadastro/servicos.py) insere um novo
`MembroOrganizacao` com `cargo=solicitacao.cargo_atual` SEM checar se já
existe alguém ativo no mesmo cargo -- ou seja, por leitura de código, o
comportamento esperado é que os DOIS fiquem cadastrados como titulares
do mesmo cargo (duplicidade), não substituição. Este script confirma o
estado real do banco.

Uso (a partir de e-sigma/backend/, com o mesmo venv/python que roda o
backend normalmente):
    python consultar_membro_cargo_9911001.py
"""
from database import SessaoLocal
from models import SolicitacaoCadastro, MembroOrganizacao, Pessoa

CIM = "9911001"


def main():
    db = SessaoLocal()
    try:
        sol = db.query(SolicitacaoCadastro).filter(SolicitacaoCadastro.cim == CIM).first()
        if not sol:
            print(f"[ERRO] Nenhuma Solicitacao de Cadastro encontrada com CIM {CIM}.")
            return

        print(f"[INFO] Solicitacao id={sol.id}")
        print(f"       nome_completo   = {sol.nome_completo}")
        print(f"       cargo_atual     = {sol.cargo_atual!r}")
        print(f"       status          = {sol.status}")
        print(f"       loja_resolvida_id = {sol.loja_resolvida_id}")

        if not sol.loja_resolvida_id:
            print("[INFO] Sem loja_resolvida_id -- nenhum MembroOrganizacao teria sido criado.")
            return

        membros = (
            db.query(MembroOrganizacao)
            .filter(MembroOrganizacao.organizacao_id == sol.loja_resolvida_id)
            .order_by(MembroOrganizacao.criado_em)
            .all()
        )
        print(f"\n--- MembroOrganizacao da mesma Loja ({len(membros)} registro(s)) ---")
        for m in membros:
            p = db.query(Pessoa).filter(Pessoa.id == m.pessoa_id).first()
            nome = p.nome_completo if p else "?"
            cim_pessoa = None
            if p and isinstance(p.dados_especificos, dict):
                cim_pessoa = p.dados_especificos.get("cim")
            print(
                f"  id={m.id} pessoa={nome!r} cim={cim_pessoa} "
                f"cargo={m.cargo!r} status={m.status} criado_em={m.criado_em}"
            )

        # Destaque: quantos ATIVOS existem para o MESMO cargo do candidato novo
        if sol.cargo_atual:
            mesmo_cargo_ativos = [
                m for m in membros
                if m.status == "ATIVO" and (m.cargo or "").strip().lower() == sol.cargo_atual.strip().lower()
            ]
            print(f"\n[RESUMO] Titulares ATIVOS com o mesmo cargo ({sol.cargo_atual!r}): {len(mesmo_cargo_ativos)}")
            if len(mesmo_cargo_ativos) > 1:
                print("  >>> DUPLICIDADE CONFIRMADA: mais de um titular ATIVO no mesmo cargo, na mesma Loja.")
            elif len(mesmo_cargo_ativos) == 1:
                print("  >>> Só um titular ATIVO -- ou não havia ninguém antes nesse cargo, ou o candidato novo é o único.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
