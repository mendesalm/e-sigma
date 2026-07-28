-- Tabela de Cargos
-- Armazena os diferentes tipos de cargos que um maçom pode ocupar.
CREATE TABLE IF NOT EXISTS Cargos (
    Id SERIAL PRIMARY KEY,
    NomeCargo TEXT NOT NULL UNIQUE
);

-- Inserindo os cargos padrão e os novos
-- Usamos ON CONFLICT DO NOTHING para ignorar inserções de cargos que já existem.
INSERT INTO Cargos (NomeCargo) VALUES
    ('Venerável Mestre'),
    ('Primeiro Vigilante'),
    ('Segundo Vigilante'),
    ('Orador'),
    ('Secretário'),
    ('Chanceler'),
    ('Tesoureiro'),
    ('Mestre de Cerimônias'),
    ('Hospitaleiro'),
    ('Cobridor Interno'), 
    ('Primeiro Diácono'),
    ('Segundo Diácono'),
    ('Mestre de Harmonia'),
    ('Porta Bandeira'),
    ('Porta Estandarte'),
    ('Deputado Federal'),
    ('Deputado Estadual'),
    ('Arquiteto'),
    ('Bibliotecário'),
    ('Primeiro Experto'),
    ('Segundo Experto'),
    ('Cobridor Externo'),
    ('Mestre de Banquetes')
ON CONFLICT (NomeCargo) DO NOTHING;

-- Tabela Maçom
-- Armazena as informações principais de cada maçom.
CREATE TABLE IF NOT EXISTS Macom (
    Id SERIAL PRIMARY KEY,
    NomeCompleto TEXT NOT NULL,
    CIM TEXT UNIQUE NOT NULL,               -- Cadastro de Identificação Maçônica
    CPF TEXT UNIQUE NULL,                   -- Cadastro de Pessoa Física
    Identidade TEXT NULL,                   -- Documento de Identidade
    Email TEXT UNIQUE NULL,                 -- Endereço de e-mail
    FotoPessoal_Caminho TEXT NULL,          -- Caminho para o arquivo da foto pessoal
    DataNascimento DATE,
    DataCasamento DATE NULL,
    Endereco_Rua TEXT,
    Endereco_Numero TEXT,
    Endereco_Bairro TEXT,
    Endereco_Cidade TEXT,
    Endereco_CEP TEXT,
    Telefone TEXT,
    Naturalidade TEXT NULL,                 -- Cidade/Estado de nascimento
    Nacionalidade TEXT NULL,
    Religiao TEXT NULL,
    NomePai TEXT NULL,
    NomeMae TEXT NULL,
    FormacaoAcademica TEXT NULL,
    Ocupacao TEXT NULL,
    LocalTrabalho TEXT NULL,
    Situacao TEXT NOT NULL DEFAULT 'Ativo' CHECK(Situacao IN ('Ativo', 'Regular', 'Inativo', 'Irregular', 'Remido', 'Falecido')),
    DataIniciacao DATE,
    DataElevacao DATE NULL,
    DataExaltacao DATE NULL,
    DataFiliacao DATE NULL,
    DataRegularizacao DATE NULL
);

-- Tabela Condecorações do Maçom
-- Armazena as condecorações recebidas por um maçom.
CREATE TABLE IF NOT EXISTS MacomCondecoracoes (
    Id SERIAL PRIMARY KEY,
    MacomId INTEGER NOT NULL,
    NomeCondecoracao TEXT NOT NULL,
    DataCondecoracao DATE NOT NULL,
    FOREIGN KEY (MacomId) REFERENCES Macom(Id) ON DELETE CASCADE 
);

-- Tabela Familiares
-- Armazena os familiares associados a um maçom.
CREATE TABLE IF NOT EXISTS Familiares (
    Id SERIAL PRIMARY KEY,
    MacomId INTEGER NOT NULL,
    Nome TEXT NOT NULL,
    Parentesco TEXT,
    DataNascimento DATE,
    FOREIGN KEY (MacomId) REFERENCES Macom(Id) ON DELETE CASCADE
);

-- Tabela MacomCargos (Tabela de Junção)
-- Relaciona os maçons com os cargos que ocuparam e o período.
CREATE TABLE IF NOT EXISTS MacomCargos (
    Id SERIAL PRIMARY KEY,
    MacomId INTEGER NOT NULL,
    CargoId INTEGER NOT NULL,
    DataInicio DATE NOT NULL,
    DataTermino DATE NULL,
    FOREIGN KEY (MacomId) REFERENCES Macom(Id) ON DELETE CASCADE,
    FOREIGN KEY (CargoId) REFERENCES Cargos(Id) ON DELETE RESTRICT -- Mantém RESTRICT para integridade
);

-- Tabela Registro de Visitação
-- Armazena o histórico de visitas de um maçom a outras Lojas.
CREATE TABLE IF NOT EXISTS RegistroVisitacao (
    Id SERIAL PRIMARY KEY,
    MacomId INTEGER NOT NULL,
    DataVisita DATE NOT NULL,
    NomeLojaVisitada TEXT NOT NULL,
    PotenciaLojaVisitada TEXT NULL,
    TipoSessao TEXT NOT NULL CHECK(TipoSessao IN (
        'Ordinária no Grau de Aprendiz',
        'Ordinária no Grau de Companheiro',
        'Ordinária no Grau de Mestre',
        'Magna de Iniciação',
        'Magna de Elevação',
        'Magna de Exaltação',
        'Magna Pública',        
        'Magna Grau 1',         
        'Magna Grau 2',         
        'Magna Grau 3'
    )),
    OrienteLojaVisitada TEXT NULL,
    FOREIGN KEY (MacomId) REFERENCES Macom(Id) ON DELETE CASCADE 
);

-- Tabela Presença nas Sessões da Loja
-- Registra a presença de um maçom em uma sessão específica da sua própria Loja.
CREATE TABLE IF NOT EXISTS PresencaLoja (
    Id SERIAL PRIMARY KEY,
    MacomId INTEGER NOT NULL,
    DataSessao DATE NOT NULL,
    TipoSessao TEXT NOT NULL CHECK(TipoSessao IN (
        'Ordinária no Grau de Aprendiz',
        'Ordinária no Grau de Companheiro',
        'Ordinária no Grau de Mestre',
        'Magna de Iniciação',
        'Magna de Elevação',
        'Magna de Exaltação',
        'Magna Pública',
        'Magna Grau 1',
        'Magna Grau 2',
        'Magna Grau 3'
    )),
    Observacao TEXT NULL,
    FOREIGN KEY (MacomId) REFERENCES Macom(Id) ON DELETE CASCADE,
    UNIQUE (MacomId, DataSessao, TipoSessao)
);


-- Índices para otimizar consultas
-- A criação de índices é idempotente no PostgreSQL se usar IF NOT EXISTS
CREATE INDEX IF NOT EXISTS idx_macom_cim ON Macom(CIM);
CREATE INDEX IF NOT EXISTS idx_macom_cpf ON Macom(CPF); 
CREATE INDEX IF NOT EXISTS idx_macom_email ON Macom(Email); 
CREATE INDEX IF NOT EXISTS idx_macomcondecoracoes_macomid ON MacomCondecoracoes(MacomId); 
CREATE INDEX IF NOT EXISTS idx_familiares_macomid ON Familiares(MacomId);
CREATE INDEX IF NOT EXISTS idx_macomcargos_macomid ON MacomCargos(MacomId);
CREATE INDEX IF NOT EXISTS idx_macomcargos_cargoid ON MacomCargos(CargoId);
CREATE INDEX IF NOT EXISTS idx_registrovisitacao_macomid ON RegistroVisitacao(MacomId); 
CREATE INDEX IF NOT EXISTS idx_registrovisitacao_datavisita ON RegistroVisitacao(DataVisita); 
CREATE INDEX IF NOT EXISTS idx_presencaloja_macomid ON PresencaLoja(MacomId); 
CREATE INDEX IF NOT EXISTS idx_presencaloja_datasessao ON PresencaLoja(DataSessao); 


-- Exemplo de como inserir um Maçom com o campo da foto (mantido como comentário)
-- INSERT INTO Macom (
--     NomeCompleto, CIM, CPF, Identidade, Email, FotoPessoal_Caminho, DataNascimento, DataCasamento,
--     Endereco_Rua, Endereco_Numero, Endereco_Bairro, Endereco_Cidade, Endereco_CEP, Telefone,
--     Naturalidade, Nacionalidade, Religiao, NomePai, NomeMae,
--     FormacaoAcademica, Ocupacao, LocalTrabalho, Situacao,
--     DataIniciacao, DataElevacao, DataExaltacao, DataFiliacao, DataRegularizacao
-- ) VALUES (
--     'João Pedro Junqueira', '12345', '111.222.333-44', 'MG-12.345.678', 'joao.junqueira@email.com', 'caminho/para/fotos/joao_junqueira.jpg', '1980-05-15', '2005-10-10',
--     'Rua da Acácia', '777', 'Jardim dos Obreiros', 'Anápolis', '75000-000', '(62) 99999-8888',
--     'Anápolis/GO', 'Brasileira', 'Cristão', 'Pedro Junqueira Pai', 'Maria Junqueira Mãe',
--     'Engenharia Civil', 'Engenheiro', 'Construtora XYZ', 'Ativo',
--     '2010-03-20', '2011-06-15', '2012-09-25', NULL, NULL
-- );
