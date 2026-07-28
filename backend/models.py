"""
Módulo de definição dos modelos (entidades) do banco de dados para o Sigma 2.0.
Aplica os conceitos de Orientação a Objetos (OO) mapeados de forma elegante e performática para o 
PostgreSQL utilizando a estratégia de Herança de Tabela Única (Single Table Inheritance) e 
colunas NoSQL nativas (JSONB) para os dados satélites e específicos.

Diretriz de Ouro: Padrão estrito de nomenclatura em PT-BR e comentários ricos.
"""

from sqlalchemy import Column, Integer, String, DateTime, Date, func, ForeignKey, Boolean, Numeric
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship, validates
import uuid

from database import Base


class Endereco(Base):
    """
    Entidade Endereço.
    Utilizada por Composição e Relação Polimórfica para atender Pessoas e Organizações.
    """
    __tablename__ = 'enderecos'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entidade_tipo = Column(String(50), nullable=False) # 'PESSOA' ou 'ORGANIZACAO'
    entidade_id = Column(UUID(as_uuid=True), nullable=False, index=True) 
    tipo_endereco = Column(String(50), nullable=True) 
    cep = Column(String(10), nullable=True)
    logradouro = Column(String(255), nullable=True)
    numero = Column(String(50), nullable=True)
    complemento = Column(String(255), nullable=True)
    bairro = Column(String(100), nullable=True)
    cidade = Column(String(100), nullable=True)
    estado = Column(String(2), nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())


class Organizacao(Base):
    """
    Entidade Base para todas as instituições (Obediências, Subobediências, Lojas, Corpos Filosóficos).
    Apresenta estrutura hierárquica em árvore (autorreferência).
    """
    __tablename__ = 'organizacoes'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tipo = Column(String(50), nullable=False) 
    
    # Autorreferência para criar a hierarquia (ex: Loja aponta para Subobediência, que aponta para Obediência)
    organizacao_superior_id = Column(UUID(as_uuid=True), ForeignKey('organizacoes.id'), nullable=True)
    organizacao_superior = relationship('Organizacao', remote_side=[id], backref='organizacoes_subordinadas')
    
    nome = Column(String(255), nullable=False)
    cnpj = Column(String(18), unique=True, nullable=True)
    dados_especificos = Column(JSONB, default=dict)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    
    @property
    def rito(self):
        if self.tipo != 'LOJA':
            return None
        return self.dados_especificos.get('rito')

    @rito.setter
    def rito(self, valor):
        if self.tipo != 'LOJA':
            raise ValueError("O parâmetro 'rito' é exclusivo para Lojas maçônicas.")
        self.dados_especificos['rito'] = valor

    @property
    def esfera(self):
        return self.dados_especificos.get('esfera')

    @esfera.setter
    def esfera(self, valor):
        self.dados_especificos['esfera'] = valor


class Pessoa(Base):
    """
    Entidade Base (Superclasse) para todas as identidades civis do sistema.
    Serve como fundação para Maçons, Familiares, Funcionários.
    """
    __tablename__ = 'pessoas'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tipo = Column(String(50), nullable=False) 
    
    nome_completo = Column(String(255), nullable=False)
    cpf = Column(String(14), unique=True, nullable=True, index=True)
    rg = Column(String(50), nullable=True)
    data_nascimento = Column(DateTime(timezone=True), nullable=True)
    email = Column(String(255), unique=True, nullable=True, index=True)
    telefone = Column(String(20), nullable=True)
    
    dados_civis = Column(JSONB, default=dict)
    
    # Envelope de Especialização. Para Maçons, armazenará inclusive o Histórico de Mandatos/Cargos
    # ex: {"cim": "999", "historico_cargos": [{"cargo": "Venerável", "inicio": "2024-01-01"}]}
    dados_especificos = Column(JSONB, default=dict)
    
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    
    # --- Controle de Acesso (Auth & Roles) ---
    # Colunas vitais para que a Pessoa consiga logar no sistema SaaS
    senha_hash = Column(String(255), nullable=True) # Pode ser null se a pessoa for apenas um registro sem acesso
    ultimo_login = Column(DateTime(timezone=True), nullable=True)
    status_acesso = Column(String(50), default="ATIVO") # ATIVO, SUSPENSO, BLOQUEADO
    
    # ---------------------------------------------------------
    # PROPRIEDADES DE CONVENIÊNCIA OO (Abstração das Colunas JSON)
    # ---------------------------------------------------------
    
    # --- Gestão de Permissões de Tela (SaaS Roles) ---
    @property
    def permissoes_sistema(self):
        """
        Retorna a lista de strings com os escopos de acesso do usuário.
        Ex: ['admin_loja', 'financeiro', 'webmaster']
        Ficam guardados de forma altamente performática no envelope dados_civis.
        """
        return self.dados_civis.get('permissoes_sistema', [])

    @permissoes_sistema.setter
    def permissoes_sistema(self, lista_permissoes):
        self.dados_civis['permissoes_sistema'] = lista_permissoes

    # --- Dados Civis ---
    @property
    def profissao(self):
        return self.dados_civis.get('profissao')
        
    @profissao.setter
    def profissao(self, valor):
        self.dados_civis['profissao'] = valor

    @property
    def estado_civil(self):
        return self.dados_civis.get('estado_civil')

    @estado_civil.setter
    def estado_civil(self, valor):
        self.dados_civis['estado_civil'] = valor

    # --- Dados Específicos (Maçom) ---
    @property
    def cim(self):
        return self.dados_especificos.get('cim')

    @cim.setter
    def cim(self, valor):
        self.dados_especificos['cim'] = valor

    @property
    def grau_simbolico(self):
        return self.dados_especificos.get('grau_simbolico')

    @grau_simbolico.setter
    def grau_simbolico(self, valor):
        if valor and not (1 <= int(valor) <= 3):
            raise ValueError("O Grau Simbólico deve estar entre 1 e 3.")
        self.dados_especificos['grau_simbolico'] = valor

    @property
    def grau_filosofico(self):
        return self.dados_especificos.get('grau_filosofico')

    @grau_filosofico.setter
    def grau_filosofico(self, valor):
        if valor and not (4 <= int(valor) <= 33):
            raise ValueError("O Grau Filosófico deve estar entre 4 e 33.")
        self.dados_especificos['grau_filosofico'] = valor

    @property
    def historico_cargos(self):
        """
        Retorna a lista de dicionários representando o histórico de mandatos (Opção B).
        Ex: [{"cargo": "Venerável Mestre", "data_inicio": "2024", "organizacao_id": "uuid"}]
        """
        return self.dados_especificos.get('historico_cargos', [])

    @historico_cargos.setter
    def historico_cargos(self, lista_mandatos):
        self.dados_especificos['historico_cargos'] = lista_mandatos

    def adicionar_cargo(self, cargo: str, data_inicio: str, organizacao_id: str, data_fim: str = None):
        """Método utilitário para anexar um novo cargo ao histórico."""
        historico = self.historico_cargos
        historico.append({
            "cargo": cargo,
            "data_inicio": data_inicio,
            "data_fim": data_fim,
            "organizacao_id": str(organizacao_id)
        })
        # Força a atualização do JSONB
        self.dados_especificos['historico_cargos'] = historico


# =============================================================================
# MÓDULO FINANCEIRO
# =============================================================================

class CategoriaFinanceira(Base):
    """
    Plano de Contas das Organizações (ex: Mensalidades, Aluguel, Eventos).
    """
    __tablename__ = 'categorias_financeiras'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Toda categoria pertence a uma Loja ou Obediência
    organizacao_id = Column(UUID(as_uuid=True), ForeignKey('organizacoes.id'), nullable=False, index=True)
    
    nome = Column(String(100), nullable=False)
    tipo_movimento = Column(String(50), nullable=False) # 'RECEITA' ou 'DESPESA'
    ativa = Column(Boolean, default=True)
    
    # Relação de conveniência
    organizacao = relationship("Organizacao")
    
    criado_em = Column(DateTime(timezone=True), server_default=func.now())


class Transacao(Base):
    """
    Motor do fluxo de caixa e integração bancária.
    Híbrido de colunas relacionais fortes (para soma matemática) e 
    JSONB (para metadados de Gateways como Asaas/Pix).
    """
    __tablename__ = 'transacoes'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Relações Estruturais
    organizacao_id = Column(UUID(as_uuid=True), ForeignKey('organizacoes.id'), nullable=False, index=True)
    pessoa_id = Column(UUID(as_uuid=True), ForeignKey('pessoas.id'), nullable=True, index=True) # Opcional: vincula a um maçom/fornecedor
    categoria_id = Column(UUID(as_uuid=True), ForeignKey('categorias_financeiras.id'), nullable=False)
    
    # Dados Base da Transação
    descricao = Column(String(255), nullable=False)
    tipo_movimento = Column(String(50), nullable=False) # 'RECEITA' ou 'DESPESA'
    status_pagamento = Column(String(50), default="PENDENTE") # 'PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO'
    
    # Tempos
    data_vencimento = Column(Date, nullable=False)
    data_pagamento = Column(Date, nullable=True)
    
    # Matemática Financeira Relacional (Numeric é melhor que Float para dinheiro no Postgres)
    valor_original = Column(Numeric(10, 2), nullable=False)
    valor_juros = Column(Numeric(10, 2), default=0.0)
    valor_multa = Column(Numeric(10, 2), default=0.0)
    valor_desconto = Column(Numeric(10, 2), default=0.0)
    valor_final = Column(Numeric(10, 2), nullable=True) # Valor efetivamente pago
    
    # Envelope de Integração (O Segredo da V2!)
    # Agrupa Asaas ID, Linha Digitável, QRCodes PIX, e Webhook payloads sem poluir a tabela.
    dados_gateway = Column(JSONB, default=dict)
    
    # Relações de navegação
    organizacao = relationship("Organizacao")
    pessoa = relationship("Pessoa")
    categoria = relationship("CategoriaFinanceira")
    
    criado_em = Column(DateTime(timezone=True), server_default=func.now())


# =============================================================================
# MÓDULO DE SESSÕES E FREQUÊNCIA
# =============================================================================

class Sessao(Base):
    """
    Agenda e execução das Sessões (Reuniões) Maçônicas.
    Guarda o Balaústre (Ata) via JSONB para evitar normalização excessiva de textos ricos.
    """
    __tablename__ = 'sessoes'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Toda sessão é organizada por uma Loja (ou Obediência)
    organizacao_id = Column(UUID(as_uuid=True), ForeignKey('organizacoes.id'), nullable=False, index=True)
    
    titulo = Column(String(255), nullable=False) # Ex: "Sessão Magna de Elevação"
    data_sessao = Column(DateTime(timezone=True), nullable=False)
    grau_trabalho = Column(Integer, nullable=True) # Grau em que a loja foi aberta (1 a 33)
    tipo_sessao = Column(String(50), nullable=True) # ORDINARIA, MAGNA, ADMINISTRATIVA
    
    # Envelope JSONB para a Ata da reunião (HTML do editor Tiptap, Resumo do Orador, etc)
    dados_ata = Column(JSONB, default=dict)
    
    # Envelope JSONB para configs de Check-in (Tokens QR Code, raio de geolocalização, etc)
    config_checkin = Column(JSONB, default=dict)
    
    organizacao = relationship("Organizacao")
    
    criado_em = Column(DateTime(timezone=True), server_default=func.now())


class Presenca(Base):
    """
    Tabela pivô de altíssima performance para ligar Irmãos às Sessões (Check-in).
    """
    __tablename__ = 'presencas'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    sessao_id = Column(UUID(as_uuid=True), ForeignKey('sessoes.id'), nullable=False, index=True)
    pessoa_id = Column(UUID(as_uuid=True), ForeignKey('pessoas.id'), nullable=False, index=True)
    
    status = Column(String(50), nullable=False, default="PRESENTE") # PRESENTE, FALTA, JUSTIFICADA
    visitante = Column(Boolean, default=False) # True se for maçom de outra loja no dia da sessão
    
    # Metadados do checkin (Ex: IP do celular, horário exato que bateu o QR Code, se foi manual)
    dados_checkin = Column(JSONB, default=dict)
    
    sessao = relationship("Sessao", backref="lista_presencas")
    pessoa = relationship("Pessoa")
    
    criado_em = Column(DateTime(timezone=True), server_default=func.now())


# =============================================================================
# MÓDULO DE COMUNICAÇÃO E EVENTOS
# =============================================================================

class Comunicado(Base):
    """
    Substitui as antigas tabelas de Notices, Events e Marketplace.
    Centraliza o feed de publicações da Loja.
    """
    __tablename__ = 'comunicados'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organizacao_id = Column(UUID(as_uuid=True), ForeignKey('organizacoes.id'), nullable=False, index=True)
    autor_id = Column(UUID(as_uuid=True), ForeignKey('pessoas.id'), nullable=False)
    
    tipo = Column(String(50), nullable=False) # MURAL, EVENTO_SOCIAL, CLASSIFICADOS
    titulo = Column(String(255), nullable=False)
    
    # HTML do corpo da mensagem, links de imagens e metadados específicos de eventos (data, local)
    conteudo = Column(JSONB, default=dict)
    
    organizacao = relationship("Organizacao")
    autor = relationship("Pessoa")
    
    criado_em = Column(DateTime(timezone=True), server_default=func.now())


# =============================================================================
# MÓDULO DE DOCUMENTOS E BIBLIOTECA
# =============================================================================

class ProcessoAdministrativo(Base):
    """
    Motor burocrático (Sindicâncias, Elevação, Exaltação, Desligamento).
    """
    __tablename__ = 'processos_administrativos'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organizacao_id = Column(UUID(as_uuid=True), ForeignKey('organizacoes.id'), nullable=False, index=True)
    requerente_id = Column(UUID(as_uuid=True), ForeignKey('pessoas.id'), nullable=False, index=True)
    
    tipo_processo = Column(String(50), nullable=False) # SINDICANCIA, ELEVACAO, QUITACAO
    status = Column(String(50), default="EM_ANDAMENTO") # EM_ANDAMENTO, APROVADO, RECUSADO
    
    # Formulários preenchidos dinamicamente, votos da comissão e metadados de PDFs gerados
    dados_processo = Column(JSONB, default=dict)
    
    organizacao = relationship("Organizacao")
    requerente = relationship("Pessoa")
    
    criado_em = Column(DateTime(timezone=True), server_default=func.now())


class AcervoBiblioteca(Base):
    """
    Gestão física e digital do acervo da Loja (Livros, Rituais).
    """
    __tablename__ = 'acervo_biblioteca'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organizacao_id = Column(UUID(as_uuid=True), ForeignKey('organizacoes.id'), nullable=False, index=True)
    
    titulo = Column(String(255), nullable=False)
    autor = Column(String(255), nullable=True)
    isbn = Column(String(50), nullable=True) # Código universal de livros
    tipo_item = Column(String(50), nullable=False) # LIVRO, REVISTA, RITUAL
    status_item = Column(String(50), default="DISPONIVEL") # DISPONIVEL, EMPRESTADO, EXTRAVIADO
    
    # Substitui uma tabela inteira de empréstimos/reservas!
    # Array armazenando quem pegou, quando pegou e se devolveu: 
    # [{"pessoa_id": "uuid", "data_retirada": "2024", "data_devolucao": null}]
    historico_emprestimos = Column(JSONB, default=list)
    
    # Fila de espera (Reservas)
    # Array com as pessoas aguardando o livro ficar disponível:
    # [{"pessoa_id": "uuid", "data_reserva": "2024"}]
    fila_reservas = Column(JSONB, default=list)
    
    organizacao = relationship("Organizacao")
    
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
