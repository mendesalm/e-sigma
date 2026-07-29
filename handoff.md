# Contexto Atual
A sessão foi focada na reestruturação e migração de dados das organizações (Lojas, Obediências e Subobediências).
- Refatoramos a interface do Painel Global (`GestaoLojas.tsx`, `GestaoObediencias.tsx`).
- Separamos a listagem de Lojas das Obediências.
- Incluímos paginação nas tabelas (TablePagination).
- Na edição de uma Loja (`ModalEdicaoOrganizacao.tsx`), adicionamos suporte a selecionar dinamicamente a Obediência Mãe (Federação/Confederação) e a Subobediência (Jurisdição).
- Corrigimos o script de migração do banco legado (`importar_legado.py`) e repovoamos o banco, limpando os "A.R.L.S." dos nomes e transformando o antigo "número" em "sigla".

# Problemas Pendentes / O que fazer na próxima sessão
1. **Gestão de Assinaturas (SaaS)**:
   - Precisamos planejar e implementar o módulo de SaaS no Painel Global (aba já foi isolada).
   - O plano B prevê: criação de `stripe_customer_id`, uso do Stripe Checkout e Webhooks para ativação dos clientes_ativos.
2. **Autenticação Biométrica**:
   - WebAuthn/Passkeys para login seguro (também pendente).

# Observações
- A API de `organizacoes` possui um parâmetro de `limite` (`/?limite=5000`) essencial no frontend para carregar a massa completa de lojas antes da filtragem. Manter esse limite para não perder dados nas listagens.
