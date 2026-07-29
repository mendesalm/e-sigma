import uuid
from sqlalchemy import create_engine, text
import logging
from datetime import datetime

# Configuração de Logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Importar modelos locais
from database import SessaoLocal
from models import Organizacao

# Configuração do Banco Legado
LEGACY_DB_URL = "postgresql://Sistema:Vdfskln49DSFkod@69.62.89.211:5432/sigma_db"
try:
    legacy_engine = create_engine(LEGACY_DB_URL)
except Exception as e:
    logger.error(f"Erro ao conectar no banco legado: {e}")
    exit(1)

def helper_to_str(val):
    if val is None:
        return ""
    if isinstance(val, datetime):
        return val.isoformat()
    return str(val)

def importar_dados():
    db = SessaoLocal()
    try:
        # 1. Importar Obediências e Subobediências
        logger.info("Importando Obediências e Subobediências do banco legado...")
        obediencias_map = {} # Mapeia UUID do legado para UUID do novo sistema
        
        with legacy_engine.connect() as conn:
            # Primeiro buscar Obediencias base
            res_obediencias = conn.execute(text("SELECT * FROM obediences ORDER BY parent_obedience_id NULLS FIRST"))
            colunas_ob = res_obediencias.keys()
            
            for row in res_obediencias:
                linha = dict(zip(colunas_ob, row))
                
                # Mapeamento do tipo
                tipo_org = 'OBEDIENCIA'
                if linha.get('parent_obedience_id') or linha.get('type') == 'SUBOBEDIENCIA':
                    tipo_org = 'SUBOBEDIENCIA'

                nome = helper_to_str(linha.get('name')).strip()
                sigla = helper_to_str(linha.get('acronym')).strip()
                cnpj = helper_to_str(linha.get('cnpj')).strip()
                if not cnpj:
                    cnpj = None
                
                # Tratar caso o legado não tivesse sigla separada e ela estivesse no nome
                if not sigla and " - " in nome:
                    partes = nome.split(" - ")
                    sigla = partes[0].strip()
                    nome = partes[1].strip()

                id_legado = linha.get('id')
                
                # Montar dados_especificos
                dados_especificos = {
                    "logradouro": helper_to_str(linha.get('street_address')),
                    "endereco_numero": helper_to_str(linha.get('street_number')),
                    "complemento": helper_to_str(linha.get('address_complement')),
                    "bairro": helper_to_str(linha.get('neighborhood')),
                    "cep": helper_to_str(linha.get('zip_code')),
                    "cidade": helper_to_str(linha.get('city')),
                    "estado": helper_to_str(linha.get('state')),
                    "telefone": helper_to_str(linha.get('phone')),
                    "email": helper_to_str(linha.get('email')),
                    "site_oficial": helper_to_str(linha.get('website')),
                    "contato_tecnico_nome": helper_to_str(linha.get('technical_contact_name')),
                    "contato_tecnico_email": helper_to_str(linha.get('technical_contact_email')),
                    "data_criacao_legado": helper_to_str(linha.get('created_at')),
                    "data_upgrade_legado": helper_to_str(linha.get('updated_at'))
                }

                org_sup_id = None
                if linha.get('parent_obedience_id') and linha.get('parent_obedience_id') in obediencias_map:
                    org_sup_id = obediencias_map[linha.get('parent_obedience_id')]

                # Verifica se já existe por CNPJ ou NOME (já que ID legado da obediência é INT e não UUID)
                existe = None
                if cnpj:
                    existe = db.query(Organizacao).filter(Organizacao.cnpj == cnpj).first()
                if not existe:
                    existe = db.query(Organizacao).filter(Organizacao.nome == nome).first()

                if existe:
                    existe.nome = nome
                    existe.sigla = sigla if sigla else existe.sigla
                    existe.cnpj = cnpj if cnpj else existe.cnpj
                    existe.tipo = tipo_org
                    existe.organizacao_superior_id = org_sup_id
                    
                    dados_antigos = existe.dados_especificos or {}
                    existe.dados_especificos = {**dados_antigos, **dados_especificos}
                    obediencias_map[id_legado] = existe.id
                else:
                    novo_id = uuid.uuid4()
                    nova_org = Organizacao(
                        id=novo_id,
                        tipo=tipo_org,
                        nome=nome,
                        sigla=sigla,
                        cnpj=cnpj,
                        organizacao_superior_id=org_sup_id,
                        cliente_ativo_sigma=False,
                        dados_especificos=dados_especificos
                    )
                    db.add(nova_org)
                    obediencias_map[id_legado] = novo_id

            db.commit()
            logger.info("Obediências e Subobediências importadas/atualizadas com sucesso!")

            # 2. Importar Lojas
            logger.info("Importando Lojas do banco legado...")
            query_lojas = """
                SELECT id, lodge_name, lodge_code, lodge_number, foundation_date, rite, 
                obedience_id, email, phone, website, street_address, street_number, 
                address_complement, neighborhood, city, state, zip_code, latitude, longitude, 
                qr_code_id, custom_domain, plan, user_limit, is_active, status, session_day, 
                periodicity, session_time, technical_contact_name, technical_contact_email, 
                created_at, updated_at, cnpj, geofence_radius, lodge_title, document_settings, 
                subobedience_id 
                FROM lodges
            """
            res_lojas = conn.execute(text(query_lojas))
            colunas_lj = res_lojas.keys()

            for row in res_lojas:
                linha = dict(zip(colunas_lj, row))
                
                nome_cru = helper_to_str(linha.get('lodge_name')).strip()
                # Remover possiveis títulos do início do nome que vieram no banco
                titulos_remover = ["A.R.L.S. ", "A.R.B.L.S. ", "ARLS ", "ARBLS ", "A. R. L. S. ", "A:. R:. L:. S:. "]
                for t in titulos_remover:
                    if nome_cru.upper().startswith(t.upper()):
                        nome_cru = nome_cru[len(t):].strip()
                nome = nome_cru

                numero_loja = helper_to_str(linha.get('lodge_number'))
                sigla_loja = numero_loja
                
                cnpj = helper_to_str(linha.get('cnpj')).strip()
                if not cnpj:
                    cnpj = None
                id_legado = linha.get('id')

                # Determinar org_superior (prioridade para subobediencia)
                org_sup_id = None
                subob_id = linha.get('subobedience_id')
                ob_id = linha.get('obedience_id')
                
                if subob_id and subob_id in obediencias_map:
                    org_sup_id = obediencias_map[subob_id]
                elif ob_id and ob_id in obediencias_map:
                    org_sup_id = obediencias_map[ob_id]

                dados_especificos = {
                    "titulo": helper_to_str(linha.get('lodge_title')),
                    "numero": helper_to_str(linha.get('lodge_number')),
                    "rito": helper_to_str(linha.get('rite')),
                    "data_fundacao": helper_to_str(linha.get('foundation_date')),
                    "dia_horario_sessoes": f"{helper_to_str(linha.get('session_day'))} às {helper_to_str(linha.get('session_time'))}",
                    "periodicidade": helper_to_str(linha.get('periodicity')),
                    "latitude": helper_to_str(linha.get('latitude')),
                    "longitude": helper_to_str(linha.get('longitude')),
                    "logradouro": helper_to_str(linha.get('street_address')),
                    "endereco_numero": helper_to_str(linha.get('street_number')),
                    "complemento": helper_to_str(linha.get('address_complement')),
                    "bairro": helper_to_str(linha.get('neighborhood')),
                    "cep": helper_to_str(linha.get('zip_code')),
                    "cidade": helper_to_str(linha.get('city')),
                    "estado": helper_to_str(linha.get('state')),
                    "telefone": helper_to_str(linha.get('phone')),
                    "email": helper_to_str(linha.get('email')),
                    "site_oficial": helper_to_str(linha.get('website')),
                    "contato_tecnico_nome": helper_to_str(linha.get('technical_contact_name')),
                    "contato_tecnico_email": helper_to_str(linha.get('technical_contact_email')),
                    "data_criacao_legado": helper_to_str(linha.get('created_at')),
                    "data_upgrade_legado": helper_to_str(linha.get('updated_at'))
                }

                nome_antigo = f"A.R.L.S. {nome} Nº {helper_to_str(linha.get('lodge_number'))}"
                existe = db.query(Organizacao).filter(Organizacao.nome == nome_antigo).first()
                if not existe:
                    existe = db.query(Organizacao).filter(Organizacao.nome == nome).first()
                
                if existe:
                    existe.nome = nome
                    existe.sigla = sigla_loja
                    existe.cnpj = cnpj if cnpj else existe.cnpj
                    existe.tipo = 'LOJA'
                    existe.organizacao_superior_id = org_sup_id
                    
                    dados_antigos = existe.dados_especificos or {}
                    existe.dados_especificos = {**dados_antigos, **dados_especificos}
                else:
                    novo_id = uuid.uuid4()
                    nova_loja = Organizacao(
                        id=novo_id,
                        tipo='LOJA',
                        nome=nome,
                        sigla=sigla_loja,
                        cnpj=cnpj,
                        organizacao_superior_id=org_sup_id,
                        cliente_ativo_sigma=False,
                        dados_especificos=dados_especificos
                    )
                    db.add(nova_loja)

        db.commit()
        logger.info("Lojas importadas/atualizadas com sucesso via banco legado!")

    except Exception as e:
        logger.error(f"Erro durante a importação: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    importar_dados()
