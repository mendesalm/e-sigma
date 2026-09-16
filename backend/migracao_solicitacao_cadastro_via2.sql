-- Migração: Solicitação de Cadastro (Via 2) — 2026-09-16
-- Substitui a "Ativação de Cadastro" (removida no mesmo dia por permitir
-- auto-aprovação sem validação humana, ver
-- claude/decisao-controle-acesso-cadastro.md seção 12). Reverte as colunas
-- daquele fluxo e cria a fila de solicitações + a flag de troca de senha
-- obrigatória. Idempotente (mesmo padrão dos demais scripts do ecossistema).
--
-- ATUALIZAÇÃO (2026-09-16, mesmo dia): formulário revisado a pedido do
-- usuário — todos os campos de identificação passam a ser obrigatórios, e
-- a Loja agora é informada por DOIS campos (número e nome) em vez de um
-- único campo de texto livre. Esta migração ainda não tinha sido
-- executada quando essa revisão chegou, então o schema abaixo já nasce
-- com o desenho final (colunas `numero_loja_informado`/`nome_loja_informado`
-- em vez de `loja_informada`, e `cim`/`cpf`/`telefone`/`cargo_atual`/
-- `grau_maconico` NOT NULL).

-- Reversão do fluxo de "Ativação de Cadastro" removido:
ALTER TABLE pessoas DROP COLUMN IF EXISTS codigo_ativacao_hash;
ALTER TABLE pessoas DROP COLUMN IF EXISTS codigo_ativacao_expira_em;

-- Nova flag: força a troca da senha provisória enviada por e-mail no
-- primeiro login (ver POST /auth/trocar-senha-obrigatoria).
ALTER TABLE pessoas ADD COLUMN IF NOT EXISTS deve_trocar_senha BOOLEAN NOT NULL DEFAULT FALSE;

-- Fila de solicitações de cadastro (Via 2).
CREATE TABLE IF NOT EXISTS solicitacoes_cadastro (
    id UUID PRIMARY KEY,
    potencia_informada VARCHAR(255) NOT NULL,
    numero_loja_informado VARCHAR(50) NOT NULL,
    nome_loja_informado VARCHAR(255) NOT NULL,
    nome_completo VARCHAR(255) NOT NULL,
    grau_maconico INTEGER NOT NULL,
    cim VARCHAR(50) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    cargo_atual VARCHAR(100) NOT NULL,
    data_inicio_mandato DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
    loja_resolvida_id UUID REFERENCES organizacoes(id),
    potencia_resolvida_id UUID REFERENCES organizacoes(id),
    motivo_interno VARCHAR(500),
    motivo_rejeicao VARCHAR(500),
    version INTEGER NOT NULL DEFAULT 0,
    aprovado_ou_rejeitado_por_id UUID REFERENCES pessoas(id),
    aprovado_ou_rejeitado_por_nome VARCHAR(255),
    resolvido_em TIMESTAMPTZ,
    pessoa_criada_id UUID REFERENCES pessoas(id),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Defensivo: caso uma versão anterior desta migração (rascunho com
-- `loja_informada` único e campos opcionais) já tenha rodado em algum
-- ambiente antes desta revisão chegar, ajusta o schema para o formato
-- final em vez de falhar.
ALTER TABLE solicitacoes_cadastro ADD COLUMN IF NOT EXISTS numero_loja_informado VARCHAR(50);
ALTER TABLE solicitacoes_cadastro ADD COLUMN IF NOT EXISTS nome_loja_informado VARCHAR(255);
ALTER TABLE solicitacoes_cadastro ADD COLUMN IF NOT EXISTS grau_maconico INTEGER;
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'solicitacoes_cadastro' AND column_name = 'loja_informada'
    ) THEN
        UPDATE solicitacoes_cadastro
        SET numero_loja_informado = COALESCE(numero_loja_informado, loja_informada),
            nome_loja_informado = COALESCE(nome_loja_informado, loja_informada)
        WHERE numero_loja_informado IS NULL OR nome_loja_informado IS NULL;
        ALTER TABLE solicitacoes_cadastro DROP COLUMN loja_informada;
    END IF;
END $$;
UPDATE solicitacoes_cadastro SET grau_maconico = 1 WHERE grau_maconico IS NULL;
UPDATE solicitacoes_cadastro SET cim = '' WHERE cim IS NULL;
UPDATE solicitacoes_cadastro SET cpf = '' WHERE cpf IS NULL;
UPDATE solicitacoes_cadastro SET telefone = '' WHERE telefone IS NULL;
UPDATE solicitacoes_cadastro SET cargo_atual = '' WHERE cargo_atual IS NULL;
ALTER TABLE solicitacoes_cadastro ALTER COLUMN numero_loja_informado SET NOT NULL;
ALTER TABLE solicitacoes_cadastro ALTER COLUMN nome_loja_informado SET NOT NULL;
ALTER TABLE solicitacoes_cadastro ALTER COLUMN grau_maconico SET NOT NULL;
ALTER TABLE solicitacoes_cadastro ALTER COLUMN cim SET NOT NULL;
ALTER TABLE solicitacoes_cadastro ALTER COLUMN cpf SET NOT NULL;
ALTER TABLE solicitacoes_cadastro ALTER COLUMN telefone SET NOT NULL;
ALTER TABLE solicitacoes_cadastro ALTER COLUMN cargo_atual SET NOT NULL;

ALTER TABLE solicitacoes_cadastro
    DROP CONSTRAINT IF EXISTS solicitacoes_cadastro_status_check;
ALTER TABLE solicitacoes_cadastro
    ADD CONSTRAINT solicitacoes_cadastro_status_check
    CHECK (status IN ('PENDENTE', 'APROVADO', 'REJEITADO', 'REJEITADO_AUTOMATICO'));

ALTER TABLE solicitacoes_cadastro
    DROP CONSTRAINT IF EXISTS solicitacoes_cadastro_grau_maconico_check;
ALTER TABLE solicitacoes_cadastro
    ADD CONSTRAINT solicitacoes_cadastro_grau_maconico_check
    CHECK (grau_maconico IN (1, 2, 3));

CREATE INDEX IF NOT EXISTS idx_solicitacoes_cadastro_status ON solicitacoes_cadastro (status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_cadastro_email ON solicitacoes_cadastro (email);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_cadastro_loja_resolvida ON solicitacoes_cadastro (loja_resolvida_id);
