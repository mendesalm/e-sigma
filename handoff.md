# Contexto Atual
A sessão focou no fechamento das regras hierárquicas e na concepção inicial da Arquitetura Multi-Tenant para o SaaS.
- **Regras Hierárquicas:** Implantada a lógica "top-down" na interface de `GestaoLojas.tsx` e `ModalEdicaoOrganizacao.tsx`. Lojas pertencentes a uma "Federação" agora exigem obrigatoriamente a seleção de uma Subobediência, evitando lojas órfãs no banco de dados. Lojas pertencentes a "Confederações" têm a subobediência ignorada/ocultada.
- **Filtros e Visualização:** O filtro de Lojas foi adaptado (`O(N)`) para rastrear o "avô" da loja, e a tabela agora exibe corretamente a formatação "Federação / Jurisdição" (Ex: GOB / GOB-GO).
- **Ativação SaaS (Backend):** Criada a rota `POST /api/v1/organizacoes/{org_id}/ativar` no FastAPI.
- **Arquitetura Multi-Tenant (`TenantStorageService`):** Ao ativar uma organização, um script em Python lê a árvore hierárquica e gera automaticamente a estrutura de pastas segura baseada em um slug único (Ex: `GOB_Loja2181`), dividida em `public/` (logos/imagens - acessível via `StaticFiles` no FastAPI) e `private/` (documentos sensíveis - restrito).
- **Frontend SaaS:** O botão `🚀 Ativar Assinatura SaaS` foi implementado no modal de edição, realizando a ativação com um clique e executando as lógicas de backend acima.
- **Histórico:** Foi criado um novo documento mestre, `historico_implementacao.md`, para servir como changelog global de tudo o que foi e será feito no Sigma 2.0.

# Problemas Pendentes / O que fazer na próxima sessão
1. **Integração de Pagamento SaaS (Stripe)**:
   - Conectar o fluxo atual (botão "Ativar Assinatura SaaS") à criação do `stripe_customer_id` e redirecionamento para o Stripe Checkout.
   - Construir o recebimento de Webhooks do Stripe para ativar/desativar o `cliente_ativo_sigma` de acordo com os pagamentos, removendo a ativação puramente "manual".
2. **Sistemas de Permissão e Documentos**:
   - Implementar endpoints seguros para leitura e envio de arquivos restritos da pasta `/armazenamento/instancias/private`.
3. **Autenticação Biométrica**:
   - WebAuthn/Passkeys para login.

# Observações
- O endpoint estático `/storage` no FastAPI aponta **exclusivamente** para as pastas `public` das instâncias para garantir segurança (Security by Design).
- Toda vez que houver novos recursos no backend, o arquivo `historico_implementacao.md` deverá ser incrementado (Regra de Ouro da Documentação Histórica) para rastreabilidade.
