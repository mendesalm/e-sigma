-- Migração: tabela de credenciais WebAuthn (passkeys) -- 2026-09-18
-- Ver claude/decisao-modernizacao-login.md, seção 4, no Project "Core".

CREATE TABLE IF NOT EXISTS credenciais_passkey (
    id UUID PRIMARY KEY,
    pessoa_id UUID NOT NULL REFERENCES pessoas(id),
    credential_id VARCHAR(512) NOT NULL,
    public_key VARCHAR(1024) NOT NULL,
    sign_count INTEGER NOT NULL DEFAULT 0,
    transports JSONB,
    apelido VARCHAR(100),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    ultimo_uso_em TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_credenciais_passkey_credential_id ON credenciais_passkey (credential_id);
CREATE INDEX IF NOT EXISTS ix_credenciais_passkey_pessoa_id ON credenciais_passkey (pessoa_id);
