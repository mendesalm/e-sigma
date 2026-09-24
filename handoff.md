# Contexto Atual
A sessão consolidou a infraestrutura de Identidade Centralizada & Single Sign-On (SSO) Multi-Domínio do ecossistema e-Sigma:
- **SSO Centralizado via Cookie HttpOnly (`sigma_sso_token`)**: Ao efetuar login (credenciais ou passkey) no e-Sigma IdP (`:8000`), a resposta injeta um cookie `sigma_sso_token` configurado com `HttpOnly`, `SameSite=Lax`, e `Domain=.e-sigma.app` em produção (ou `localhost` em desenvolvimento).
- **Validação de Sessão Global (`GET /api/v1/auth/sso/session`)**: Endpoint seguro que permite a qualquer aplicação satélite (CoReVM, Lojas, Harmonia) recuperar a sessão autenticada ativa sem necessidade de reautenticação manual.
- **Logout Global Unificado (`POST /api/v1/auth/logout`)**: Endpoint que invalida a sessão e expira/limpa o cookie HttpOnly `sigma_sso_token`.
- **CORS Multi-Domínio**: Configurado no `main.py` suporte nativo para requisições com credenciais (`allow_credentials=True`) e origens com wildcard regex para `https://.*\.e-sigma\.app` e portas de desenvolvimento locais (`:5173`, `:5174`, `:5175`).

# Problemas Pendentes / O que fazer na próxima sessão
1. **Integração de Pagamento SaaS (Stripe)**:
   - Conectar o fluxo atual (botão "Ativar Assinatura SaaS") à criação do `stripe_customer_id` e redirecionamento para o Stripe Checkout.
   - Construir o recebimento de Webhooks do Stripe para ativar/desativar o `cliente_ativo_sigma` de acordo com os pagamentos.
2. **Sistemas de Permissão e Documentos**:
   - Implementar endpoints seguros para leitura e envio de arquivos restritos da pasta `/armazenamento/instancias/private`.
3. **Passkeys em Produção**:
   - Ajustar origin e RP ID para o domínio oficial de produção (`e-sigma.app`) quando realizado o deploy.

# Observações
- Satélites validam tokens repassando o Bearer token para `GET /api/v1/auth/validate`.
- Módulos satélites preservam o isolamento de seus bancos, consultando o e-Sigma estritamente via API.
