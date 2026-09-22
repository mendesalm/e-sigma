-- Migração: Desafios de Autenticação (magic link — 2026-09-17)
-- Primeiro dos três métodos de login moderno decididos em
-- claude/decisao-modernizacao-login.md (Project "Core"): magic link, OTP
-- e passkeys. Esta migração cobre só o magic link, mas a tabela nasce
-- genérica (coluna `tipo`) para OTP por e-mail reaproveitar sem migração
-- nova. Idempotente (mesmo padrão dos demais scripts do ecossistema).

CREATE TABLE IF NOT EXISTS desafios_autenticacao (
    id UUID PRIMARY KEY,
    pessoa_id UUID NOT NULL REFERENCES pessoas(id),
    tipo VARCHAR(30) NOT NULL DEFAULT 'MAGIC_LINK',
    token_hash VARCHAR(64) NOT NULL,
    expira_em TIMESTAMPTZ NOT NULL,
    usado_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_desafios_autenticacao_pessoa_id ON desafios_autenticacao (pessoa_id);
CREATE INDEX IF NOT EXISTS ix_desafios_autenticacao_token_hash ON desafios_autenticacao (token_hash);
