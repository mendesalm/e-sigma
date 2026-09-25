# Contexto Atual
A sessão consolidou as interfaces públicas e de usuário do módulo e-Sigma, além de regularizar a credencial mestre do SuperAdmin:
- **Senha do SuperAdmin Oficializada (`sistema@e-sigma.app`)**: O hash no banco `esigma` foi atualizado para a senha definitiva `Cd@ESig#01`. Testado e validado com sucesso via backend FastAPI e retorno HTTP 200 com JWT contendo `role: 'super_admin'`.
- **Painel Sistêmico Global (SuperAdmin)**: O `DashboardGlobal.tsx` é a área exclusiva do SuperAdmin para gestão de Lojas, Obediências, Ativação de Assinaturas SaaS, Tratados de Amizade, Custos Sistêmicos e Gestão de Administradores, agora com botão de alternância para o Hub do Cliente e logout unificado.
- **Landing Page Pública Oficial (`PaginaAterrissagem.tsx`)**: Clone estrito do frontend legado Sigma com animação de partículas Canvas, logo animada em SVG, carrossel de módulos com drag-and-drop, seção de planos e assinaturas com modal de contato e selo flutuante de qualidade.
- **Suporte a Dark/Light Mode Global (`ThemeContext.tsx`)**: Contexto de tema dinâmico com persistência em `localStorage` e chaveamento instantâneo no `Cabecalho.tsx`.
- **Hub do Cliente & Lançador de Módulos (`DashboardCliente.tsx`)**: Painel de controle para os clientes e assinantes contendo:
  - Grid de Widgets com lançadores diretos via Single Sign-On para CoReVM (`:5174`), Lojas (`:5175`) e Harmonia (`:5178`).
  - Resumo de faturamento, dados de cobrança e saúde de infraestrutura na nuvem.
  - Central de Suporte com abas de Reporte de Bugs (com severidade e módulo afetado), Envio de Sugestões de Melhoria e Acompanhamento de Chamados.

# Problemas Pendentes / O que fazer na próxima sessão
1. **Módulo Lojas**: Implementar o Dashboard clone do sistema legado no frontend do Lojas.
2. **Integração de Pagamento SaaS (Stripe)**:
   - Conectar o fluxo atual (botão "Ativar Assinatura SaaS") à criação do `stripe_customer_id` e redirecionamento para o Stripe Checkout.
   - Construir o recebimento de Webhooks do Stripe para ativar/desativar o `cliente_ativo_sigma` de acordo com os pagamentos.
3. **Sistemas de Permissão e Documentos**:
   - Implementar endpoints seguros para leitura e envio de arquivos restritos da pasta `/armazenamento/instancias/private`.

# Observações
- Satélites validam tokens repassando o Bearer token para `GET /api/v1/auth/validate`.
- Módulos satélites preservam o isolamento de seus bancos, consultando o e-Sigma estritamente via API.
- SuperAdmin loga com `sistema@e-sigma.app` e senha `Cd@ESig#01`.
