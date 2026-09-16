import os
from database import SessaoLocal
from models import Organizacao, Pessoa, MembroOrganizacao, AssinaturaSaaS, PlanoSaaS
from dotenv import load_dotenv
import bcrypt

load_dotenv()

db = SessaoLocal()
try:
    loja = Organizacao(
        tipo='LOJA',
        nome='Loja Assinante 2181',
        cliente_ativo_sigma=True
    )
    db.add(loja)
    db.flush()

    mestre = Pessoa(
        tipo='MACON',
        nome_completo='Mestre de Harmonia (Loja 2181)',
        email='loja2181@harmonia.sigma.app',
        senha_hash=bcrypt.hashpw(b'harmonia@2026', bcrypt.gensalt()).decode('utf-8'),
        dados_civis={'permissoes_sistema': ['member']}
    )
    db.add(mestre)
    db.flush()

    vinculo = MembroOrganizacao(
        pessoa_id=mestre.id,
        organizacao_id=loja.id,
        cargo='Mestre de Harmonia',
        status='ATIVO'
    )
    db.add(vinculo)
    
    plano_harmonia = PlanoSaaS(
        nome='Plano Harmonia',
        valor_mensal=50.0,
        modulos_inclusos=['harmonia']
    )
    db.add(plano_harmonia)
    db.flush()

    assinatura = AssinaturaSaaS(
        organizacao_id=loja.id,
        plano_id=plano_harmonia.id,
        status='ATIVA',
        data_inicio='2026-01-01',
        data_vencimento='2027-01-01'
    )
    db.add(assinatura)

    db.commit()
    print('Loja Mockada criada com sucesso!')
except Exception as e:
    print(f'Erro: {e}')
finally:
    db.close()
