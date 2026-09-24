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
    tipo = Column(String(50), nullable=False) # 'LOJA', 'OBEDIENCIA', 'SUBOBEDIENCIA', 'SIGMA_CORE'
    
    # Autorreferência para criar a hierarquia (ex: Loja aponta para Subobediência, que aponta para Obediência)
    organizacao_superior_id = Column(UUID(as_uuid=True), ForeignKey('organizacoes.id'), nullable=True)
    organizacao_superior = relationship('Organizacao', remote_side=[id], backref='organizacoes_subordinadas')
    
    nome = Column(String(255), nullable=False)
    sigla = Column(String(50), nullable=True) # Ex: GOB, GLEG, GOB-GO
    cnpj = Column(String(18), unique=True, nullable=True)
    cliente_ativo_sigma = Column(Boolean, default=False) # True = Assinante; False = Loja Espelho (apenas referência)
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
    def termo_relacionamento_superior(self):
        return self.dados_especificos.get('termo_relacionamento_superior') # Ex: "Federada a", "Confederada a"

    @termo_relacionamento_superior.setter
    def termo_relacionamento_superior(self, valor):
        self.dados_especificos['termo_relacionamento_superior'] = valor

    @property
    def termo_relacionamento_regional(self):
        return self.dados_especificos.get('termo_relacionamento_regional') # Ex: "Jurisdicionada a"

    @termo_relacionamento_regional.setter
    def termo_relacionamento_regional(self, valor):
        self.dados_especificos['termo_relacionamento_regional'] = valor


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
    # ATIVO, SUSPENSO, BLOQUEADO (2026-09-16: o valor "PENDENTE" e o fluxo de
    # "Ativação de Cadastro" que o usava foram REMOVIDOS na mesma sessão em
    # que foram criados — permitiam que qualquer um se auto-aprovasse como
    # membro sem nenhuma validação humana, o que contrariava a concepção do
    # e-Sigma. Ver seção 11 x 12 de claude/decisao-controle-acesso-cadastro.md.
    # A única forma de uma Pessoa nova ganhar acesso agora é via Solicitação
    # de Cadastro (seção 2/12) aprovada por um humano — ver
    # api/solicitacoes_cadastro/.
    status_acesso = Column(String(50), default="ATIVO")

    # --- Solicitação de Cadastro (2026-09-16, substitui a "Ativação de
    # Cadastro" removida) ---
    # Quando uma Pessoa nasce a partir de uma SolicitacaoCadastro aprovada, o
    # sistema gera e envia por e-mail uma senha de uso único — nunca definida
    # pelo próprio candidato. Esta flag força a troca no primeiro login (ver
    # POST /auth/trocar-senha-obrigatoria em api/auth/rotas.py); o login
    # continua funcionando normalmente com a senha provisória, só o cliente
    # deve redirecionar para a troca obrigatória ao ver este campo "true" na
    # resposta de /auth/login.
    deve_trocar_senha = Column(Boolean, nullable=False, default=False)
    
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


class MembroOrganizacao(Base):
    """
    Tabela associativa entre Pessoa (Membro) e Organização (Loja/Obediência).
    """
    __tablename__ = 'membros_organizacoes'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pessoa_id = Column(UUID(as_uuid=True), ForeignKey('pessoas.id'), nullable=False, index=True)
    organizacao_id = Column(UUID(as_uuid=True), ForeignKey('organizacoes.id'), nullable=False, index=True)
    
    cargo = Column(String(100), nullable=True) # Venerável, Secretário, Mestre de Harmonia
    status = Column(String(50), default="ATIVO") # ATIVO, AFASTADO, DESLIGADO, DESTITUIDO (novo em 2026-09-17: usado quando a aprovação de uma Solicitação de Cadastro resolve um conflito de cargo destituindo o titular anterior -- ver api/solicitacoes_cadastro/servicos.py::aprovar_solicitacao)
    data_filiacao = Column(Date, nullable=True)
    
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    pessoa = relationship("Pessoa", backref="vinculos_organizacoes")
    organizacao = relationship("Organizacao", backref="membros")

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

# =============================================================================
# MÓDULO DE TRATADOS DE AMIZADE E SAAS (CORE)
# =============================================================================

class TratadoAmizade(Base):
    """
    Tabela que gerencia os Tratados de Amizade e Mútuo Reconhecimento entre Obediências.
    Essencial para permitir a intervisitação de membros entre lojas de obediências diferentes.
    """
    __tablename__ = 'tratados_amizade'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    obediencia_1_id = Column(UUID(as_uuid=True), ForeignKey('organizacoes.id'), nullable=False, index=True)
    obediencia_2_id = Column(UUID(as_uuid=True), ForeignKey('organizacoes.id'), nullable=False, index=True)
    
    ativo = Column(Boolean, default=True)
    data_assinatura = Column(Date, nullable=True)
    
    # Relações
    obediencia_1 = relationship("Organizacao", foreign_keys=[obediencia_1_id])
    obediencia_2 = relationship("Organizacao", foreign_keys=[obediencia_2_id])
    
    criado_em = Column(DateTime(timezone=True), server_default=func.now())


class PlanoSaaS(Base):
    """
    Catálogo de Planos de Assinatura do Sigma.
    """
    __tablename__ = 'planos_saas'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome = Column(String(100), nullable=False)
    descricao = Column(String(255), nullable=True)
    valor_mensal = Column(Numeric(10, 2), nullable=False)
    limite_membros = Column(Integer, nullable=True) # None = Ilimitado
    modulos_inclusos = Column(JSONB, default=list) # Ex: ["harmonia", "tesouraria", "secretaria"]
    
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())


class AssinaturaSaaS(Base):
    """
    Contrato ativo de assinatura de uma Loja (Organização) com o Sigma.
    Controla o acesso aos recursos e a geração da estrutura de pastas.
    """
    __tablename__ = 'assinaturas_saas'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organizacao_id = Column(UUID(as_uuid=True), ForeignKey('organizacoes.id'), nullable=False, index=True, unique=True)
    plano_id = Column(UUID(as_uuid=True), ForeignKey('planos_saas.id'), nullable=False)
    
    status = Column(String(50), default='ATIVA') # ATIVA, INADIMPLENTE, CANCELADA, TRIAL
    data_inicio = Column(Date, nullable=False, default=func.current_date())
    data_vencimento = Column(Date, nullable=False)
    
    # Controla o Lazy Creation: se as pastas físicas já foram provisionadas no servidor
    pastas_provisionadas = Column(Boolean, default=False) 
    
    organizacao = relationship("Organizacao")
    plano = relationship("PlanoSaaS")

    criado_em = Column(DateTime(timezone=True), server_default=func.now())


# =============================================================================
# MÓDULO DE SOLICITAÇÃO DE CADASTRO (Via 2 — 2026-09-16)
# =============================================================================

class SolicitacaoCadastro(Base):
    """
    Fila de solicitações de cadastro de um candidato NOVO (que ainda não é
    Pessoa no sistema) — a "Via 2" de entrada descrita em
    claude/decisao-controle-acesso-cadastro.md, seção 2.

    Concepção (reafirmada em 2026-09-16 depois de uma primeira tentativa —
    "Ativação de Cadastro" — ter sido corretamente rejeitada pelo usuário
    por permitir auto-aprovação): candidato preenche este formulário
    (Potência, Loja, identificação pessoal) → fica PENDENTE → um humano
    (SuperAdmin, ou o VM da própria Loja referenciada — ver
    api/solicitacoes_cadastro/servicos.py) aprova ou rejeita → só na
    aprovação o sistema cria a `Pessoa` de verdade, gera uma senha
    provisória e envia por e-mail (nunca o próprio candidato escolhe a
    senha nesta etapa — `Pessoa.deve_trocar_senha` força a troca no
    primeiro login).

    Por decisão do usuário (2026-09-16), esta fila mora no e-Sigma (não no
    módulo Lojas, que ainda não tem frontend próprio) — decisão revisitável
    quando o Lojas tiver sua própria tela de aprovação.

    ATUALIZAÇÃO (2026-09-16, mesmo dia): por pedido explícito do usuário,
    o formulário passou a exigir TODOS os campos de identificação (nada é
    mais opcional) e a Loja passou a ser identificada por DOIS campos
    obrigatórios — número e nome — que precisam resolver para a mesma
    Organizacao (ver `_resolver_loja` em servicos.py); antes era um único
    campo de texto livre. "Potência" continua sem nenhuma sugestão/
    autocomplete no frontend, de propósito (mesmo filtro anti-curioso da
    seção 2.3).
    """
    __tablename__ = 'solicitacoes_cadastro'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # --- Dados exatamente como o candidato digitou (nunca "corrigidos"
    # automaticamente — a comparação normalizada acontece em memória na
    # hora da validação, ver servicos.py). Todos obrigatórios (2026-09-16). ---
    potencia_informada = Column(String(255), nullable=False)
    numero_loja_informado = Column(String(50), nullable=False)
    nome_loja_informado = Column(String(255), nullable=False)
    nome_completo = Column(String(255), nullable=False)
    # 1=Aprendiz, 2=Companheiro, 3=Mestre — mesma convenção de
    # Pessoa.grau_simbolico (models.py).
    grau_maconico = Column(Integer, nullable=False)
    cim = Column(String(50), nullable=False)
    cpf = Column(String(14), nullable=False)
    email = Column(String(255), nullable=False)
    telefone = Column(String(20), nullable=False)
    cargo_atual = Column(String(100), nullable=False)
    data_inicio_mandato = Column(Date, nullable=True)

    # PENDENTE | APROVADO | REJEITADO | REJEITADO_AUTOMATICO (ver seção 2.3
    # da decisão — Loja existe mas não pertence à Potência informada, OU
    # número e nome da Loja resolvem para Lojas diferentes: fica
    # registrado para análise agregada de fraude, mas o candidato recebe a
    # mesma resposta genérica de sucesso, nunca o motivo específico).
    status = Column(String(30), nullable=False, default="PENDENTE")

    # Resolução automática da hierarquia (preenchida na submissão, para a
    # tela de aprovação não precisar refazer a busca) — nulo se a Potência
    # ou a Loja não foram reconhecidas (caso em que a submissão é rejeitada
    # sem nem criar este registro, ver servicos.py).
    loja_resolvida_id = Column(UUID(as_uuid=True), ForeignKey('organizacoes.id'), nullable=True)
    potencia_resolvida_id = Column(UUID(as_uuid=True), ForeignKey('organizacoes.id'), nullable=True)

    # Só preenchido no caminho REJEITADO_AUTOMATICO — nunca exposto ao
    # candidato, só ao SuperAdmin (seção 2.3).
    motivo_interno = Column(String(500), nullable=True)

    # Motivo de uma rejeição HUMANA (diferente de REJEITADO_AUTOMATICO) —
    # este sim é enviado ao candidato por e-mail (concepção original da
    # seção 2: "se reprovado, e-mail com o motivo").
    motivo_rejeicao = Column(String(500), nullable=True)

    # --- Controle de aprovação (lock otimista, seção 2.4 — "primeiro que
    # agir vale": um UPDATE condicionado a `version` igual à lida evita
    # dois aprovadores colidindo na mesma solicitação) ---
    version = Column(Integer, nullable=False, default=0)
    aprovado_ou_rejeitado_por_id = Column(UUID(as_uuid=True), ForeignKey('pessoas.id'), nullable=True)
    aprovado_ou_rejeitado_por_nome = Column(String(255), nullable=True)
    resolvido_em = Column(DateTime(timezone=True), nullable=True)

    # Pessoa criada quando este pedido é aprovado (nulo até a aprovação).
    pessoa_criada_id = Column(UUID(as_uuid=True), ForeignKey('pessoas.id'), nullable=True)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())


# =============================================================================
# MÓDULO DE AUTENTICAÇÃO MODERNA (magic link / OTP — 2026-09-17)
# =============================================================================

class DesafioAutenticacao(Base):
    """
    Desafio de autenticação sem senha, de uso único (magic link e passkeys
    hoje; OTP por e-mail é o próximo candidato a usar a mesma tabela, com
    `tipo="OTP_EMAIL"` -- ver claude/decisao-modernizacao-login.md no
    Project "Core" para o desenho completo dos três métodos avaliados
    (magic link, OTP, passkeys)).

    IMPORTANTE (2026-09-18, adição de passkeys): o campo `token_hash`
    guarda coisas DIFERENTES dependendo do `tipo`, apesar do nome:
    - `MAGIC_LINK`: sha256 hexdigest do token (o token em si é um segredo
      portador -- quem tiver o valor original consegue logar, por isso só
      o hash fica em repouso).
    - `PASSKEY_REGISTRO` / `PASSKEY_LOGIN`: o challenge do WebAuthn em si
      (base64url), gravado em CLARO, não um hash. Um challenge do WebAuthn
      NÃO é um segredo portador -- ele só serve para o navegador assinar
      com a chave privada que nunca saiu do autenticador; conhecer o
      challenge sozinho não permite autenticar. Precisa estar em claro
      porque as funções `verify_registration_response`/
      `verify_authentication_response` da lib `webauthn` exigem o valor
      original de volta (`expected_challenge`), não um hash dele.

    Mesma filosofia anti-enumeração do resto do módulo de auth: a
    existência de um desafio pendente para um identificador nunca é
    revelada por uma resposta diferente da genérica.
    """
    __tablename__ = 'desafios_autenticacao'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pessoa_id = Column(UUID(as_uuid=True), ForeignKey('pessoas.id'), nullable=False, index=True)

    # "MAGIC_LINK", "PASSKEY_REGISTRO", "PASSKEY_LOGIN" hoje; "OTP_EMAIL"/
    # "OTP_SMS" ficam reservados para quando esse método for implementado
    # (mesma tabela, sem migração nova -- só passam a popular `tipo` com um
    # valor novo).
    tipo = Column(String(30), nullable=False, default="MAGIC_LINK")

    token_hash = Column(String(255), nullable=False, index=True)  # ver docstring da classe -- nem sempre é um hash
    expira_em = Column(DateTime(timezone=True), nullable=False)
    usado_em = Column(DateTime(timezone=True), nullable=True)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())


class CredencialPasskey(Base):
    """
    Uma credencial WebAuthn (passkey) registrada por uma `Pessoa` -- ver
    claude/decisao-modernizacao-login.md, seção 4, para o desenho completo.
    Uma `Pessoa` pode ter várias (um por dispositivo/autenticador:
    notebook, celular, chave de segurança física, etc.).

    RP ID compartilhado entre todos os subdomínios do ecossistema
    (`e-sigma.app`), confirmado pelo usuário em 2026-09-17 -- uma passkey
    registrada em `core.e-sigma.app` também funciona em
    `lojas.e-sigma.app` e nos demais subdomínios.

    `credential_id` e `public_key` são guardados como base64url (o
    formato que a lib `webauthn`/`@simplewebauthn` já usa para trafegar
    esses valores) -- nunca a chave privada, que nunca saiu do
    autenticador do usuário. `sign_count` é o contador anti-clonagem do
    autenticador: a cada login, o novo valor precisa ser maior que o
    guardado, senão é indício de uma cópia clonada da credencial sendo
    reapresentada (a lib `webauthn` já faz essa checagem em
    `verify_authentication_response`).
    """
    __tablename__ = 'credenciais_passkey'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pessoa_id = Column(UUID(as_uuid=True), ForeignKey('pessoas.id'), nullable=False, index=True)

    credential_id = Column(String(512), nullable=False, unique=True, index=True)  # base64url
    public_key = Column(String(1024), nullable=False)  # base64url da chave pública COSE
    sign_count = Column(Integer, nullable=False, default=0)

    # Lista de transportes reportada pelo navegador na criação (ex.:
    # ["internal"], ["hybrid", "usb"]) -- informativo, não usado na
    # verificação; ajuda a montar allowCredentials no login.
    transports = Column(JSONB, nullable=True)

    # Apelido que o próprio usuário escolhe ao cadastrar, para reconhecer
    # o dispositivo depois na tela de gestão (ex.: "Notebook do trabalho").
    apelido = Column(String(100), nullable=True)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    ultimo_uso_em = Column(DateTime(timezone=True), nullable=True)
