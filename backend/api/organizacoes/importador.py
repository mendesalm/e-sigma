import csv
import io
from sqlalchemy.orm import Session
from models import Organizacao
from api.organizacoes.servicos import format_title_case

class ServicoImportacaoCSV:
    @staticmethod
    def processar_preview(db: Session, file_content: bytes):
        """
        Lê um CSV em memória, formata os dados e cruza com o banco
        para gerar um preview de colisões antes de salvar.
        Espera colunas: nome, sigla, tipo, cnpj, rito, mae_sigla
        """
        content_str = file_content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(content_str))
        
        resultados = []
        
        for row_num, row in enumerate(reader, start=2):
            try:
                # Sanitiza e Formata
                nome_bruto = row.get('nome', '').strip()
                nome_formatado = format_title_case(nome_bruto)
                sigla = row.get('sigla', '').strip().upper()
                tipo = row.get('tipo', '').strip().upper()
                cnpj = row.get('cnpj', '').strip()
                rito = row.get('rito', '').strip()
                mae_sigla = row.get('mae_sigla', '').strip().upper()
                
                if not nome_formatado or not tipo:
                    resultados.append({
                        "linha": row_num,
                        "dados": row,
                        "status": "ERRO",
                        "mensagem": "Campos 'nome' e 'tipo' são obrigatórios."
                    })
                    continue
                    
                # Descobre o UUID da mãe pela Sigla
                mae_id = None
                if mae_sigla:
                    mae = db.query(Organizacao).filter(Organizacao.sigla.ilike(mae_sigla)).first()
                    if mae:
                        mae_id = str(mae.id)
                    else:
                        resultados.append({
                            "linha": row_num,
                            "dados": row,
                            "status": "AVISO",
                            "mensagem": f"Mãe '{mae_sigla}' não encontrada. A organização ficará órfã se prosseguir."
                        })
                
                # Checa Colisões
                colisao_nome = db.query(Organizacao).filter(
                    Organizacao.nome.ilike(nome_formatado),
                    Organizacao.tipo == tipo
                ).first()
                
                colisao_cnpj = None
                if cnpj:
                    colisao_cnpj = db.query(Organizacao).filter(Organizacao.cnpj == cnpj).first()
                    
                if colisao_nome:
                    resultados.append({
                        "linha": row_num,
                        "dados": {"nome": nome_formatado, "sigla": sigla, "tipo": tipo, "mae_sigla": mae_sigla},
                        "status": "COLISAO",
                        "mensagem": f"Já existe uma organização ({tipo}) com o nome '{colisao_nome.nome}'."
                    })
                elif colisao_cnpj:
                    resultados.append({
                        "linha": row_num,
                        "dados": {"nome": nome_formatado, "sigla": sigla, "tipo": tipo, "mae_sigla": mae_sigla},
                        "status": "COLISAO",
                        "mensagem": f"Já existe uma organização com o CNPJ '{cnpj}'."
                    })
                else:
                    resultados.append({
                        "linha": row_num,
                        "dados": {
                            "nome": nome_formatado, 
                            "sigla": sigla, 
                            "tipo": tipo, 
                            "cnpj": cnpj,
                            "organizacao_superior_id": mae_id,
                            "dados_especificos": {"rito": rito} if rito else {}
                        },
                        "status": "PRONTO",
                        "mensagem": "Registro válido e inédito."
                    })
            except Exception as e:
                resultados.append({
                    "linha": row_num,
                    "dados": row,
                    "status": "ERRO",
                    "mensagem": f"Falha ao processar linha: {str(e)}"
                })
                
        return resultados

    @staticmethod
    def salvar_lote(db: Session, lista_dados: list):
        """Salva a lista de dados processados e confirmados pelo usuário."""
        novas = []
        for item in lista_dados:
            if item.get('status') == 'PRONTO':
                org = Organizacao(**item['dados'])
                db.add(org)
                novas.append(org)
        
        db.commit()
        for nova in novas:
            db.refresh(nova)
            
        return len(novas)
