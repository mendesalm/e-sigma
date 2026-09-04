import os
import shutil
import re
from pathlib import Path
from models import Organizacao
from sqlalchemy.orm import Session

class TenantStorageService:
    BASE_DIR = Path("armazenamento")
    TEMPLATES_DIR = BASE_DIR / "templates_v2"
    INSTANCIAS_DIR = BASE_DIR / "instancias"
    
    # Static mounts will map to /storage -> armazenamento/instancias/public

    @classmethod
    def _generate_slug(cls, db: Session, org: Organizacao) -> str:
        """
        Gera um slug único:
        - Loja: {ObedienciaRaizSigla}_Loja{Numero} (Ex: GOB_Loja2181)
        - Obediência/Subobediência: {Sigla} (Ex: GOB, GOB-GO)
        """
        if org.tipo == 'LOJA':
            numero = org.dados_especificos.get('numero', 'SN')
            raiz_sigla = "INDEP"
            
            if org.organizacao_superior_id:
                parent = db.query(Organizacao).filter(Organizacao.id == org.organizacao_superior_id).first()
                if parent:
                    if parent.tipo == 'SUBOBEDIENCIA' and parent.organizacao_superior_id:
                        grandparent = db.query(Organizacao).filter(Organizacao.id == parent.organizacao_superior_id).first()
                        raiz_sigla = grandparent.sigla if grandparent and grandparent.sigla else "DESCONHECIDA"
                    else:
                        raiz_sigla = parent.sigla if parent.sigla else "DESCONHECIDA"
                        
            raiz_sigla = re.sub(r'[^a-zA-Z0-9-]', '', raiz_sigla)
            numero = re.sub(r'[^a-zA-Z0-9]', '', str(numero))
            
            return f"{raiz_sigla}_Loja{numero}"
            
        else:
            sigla = org.sigla if org.sigla else org.nome
            slug = re.sub(r'[^a-zA-Z0-9-]', '', sigla)
            return slug

    @classmethod
    def activate_tenant_storage(cls, db: Session, org: Organizacao) -> str:
        """
        Cria a estrutura de pastas públicas e privadas para o tenant.
        Retorna o slug.
        """
        slug = cls._generate_slug(db, org)
        
        template_type = org.tipo.lower()
        if template_type not in ['loja', 'obediencia', 'subobediencia']:
            template_type = 'loja'
            
        pub_template = cls.TEMPLATES_DIR / "public" / template_type
        priv_template = cls.TEMPLATES_DIR / "private" / template_type
        
        pub_instancia = cls.INSTANCIAS_DIR / "public" / slug
        priv_instancia = cls.INSTANCIAS_DIR / "private" / slug
        
        os.makedirs(pub_instancia, exist_ok=True)
        os.makedirs(priv_instancia, exist_ok=True)
        
        if pub_template.exists():
            shutil.copytree(pub_template, pub_instancia, dirs_exist_ok=True)
        if priv_template.exists():
            shutil.copytree(priv_template, priv_instancia, dirs_exist_ok=True)
            
        if 'storage_slug' not in org.dados_especificos or 'webmaster' not in org.dados_especificos:
            novos_dados = {**org.dados_especificos, 'storage_slug': slug}
            
            # Geração de Webmaster
            if 'webmaster' not in novos_dados:
                if org.tipo == 'LOJA':
                    # gob.loja2181@e-sigma.app
                    email = f"{slug.replace('_', '.').lower()}@e-sigma.app"
                else:
                    # gob@e-sigma.app
                    email = f"{slug.lower()}@e-sigma.app"
                novos_dados['webmaster'] = email
                
            org.dados_especificos = novos_dados
            db.commit()
            
        return slug
