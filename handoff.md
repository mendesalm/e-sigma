# Documento de Handoff - Sigma 2.0 (Arquitetura SaaS)

**Última Atualização:** Migração da Landing Page V1, Estrutura de Pastas e Roteamento dos Dashboards.

## 🎯 Contexto Atual
O escopo do Sigma revelou-se um verdadeiro **Sistema ERP Multi-Tenant**. Construímos a infraestrutura base para suportar Lojas (Tenant Local), Obediências (Tenant Global) e a gestão comercial das assinaturas (Sistêmico/SaaS). Além disso, a Landing Page inteira da versão legada (V1) foi perfeitamente transposta e traduzida para a V2.

## 🛠️ O Que Foi Feito
- [x] **File System Isolado (Backend):** O `main.py` agora expõe a rota estática `/armazenamento`. No `servicos.py` (Organizações), ativamos o script que gera a pasta isolada do tenant (`loja_{uuid}/[logo, documentos, fotos...]`) usando `os.makedirs` no momento do cadastro.
- [x] **Roteador Principal (Frontend):** Desenhamos os esqueletos dos Dashboards e configuramos o `Roteador.tsx` com as rotas `/sistemico`, `/global` e `/local`.
- [x] **Clonagem e Refatoração (Landing Page):** Copiamos as imagens, layouts e os componentes (`SigmaAnimatedLogo`, `HeroBackground`) da V1. Através de um script de engenharia reversa, nós renomeamos as dezenas de referências para a **Regra de Ouro em PT-BR** (`LogoAnimadaSigma`, `FundoHero`, `Rodape`) reconstruindo a `PaginaAterrissagem.tsx`.
- [x] **Acesso Híbrido:** Conforme definido, todos os membros acessarão o Dashboard da Loja, mas a UI será montada condicionalmente baseada no token JWT.

## 🚧 Onde Paramos / Próximos Passos
As rotas de base e o comercial do sistema já estão respirando sob as engrenagens da V2. A Landing Page está online, 100% responsiva (sem bugs de scroll) e com seu Cabeçalho e Rodapé restaurados. Além disso, as nomenclaturas arquiteturais foram oficializadas e migradas (Global, Central, Local). O projeto foi movido para um repositório Git independente (`e-sigma`).

**O que deve ser feito na retomada (Próxima Sessão):**
1. **Sistema de Login (Transposição):** Instalar bibliotecas de animação/UI (`framer-motion`, `notistack`), portar a `LoginPage.tsx` da V1 para a V2 e injetar o token JWT no roteamento.
2. **Dashboard Local:** Iniciar a construção visual (React/MUI) do Painel da Loja, garantindo o filtro de funcionalidades via RBAC para Veneráveis vs Obreiros comuns.
3. Ligar os servidores novamente (`npm run dev` e `uvicorn`) para prosseguir.

## ⚠️ Regras de Ouro Ativas
1. **Nomenclatura PT-BR:** Tudo na UI da V2 está adotando o idioma português.
2. **Dashboard Híbrido:** As funcionalidades devem ter verificadores lógicos de credencial (ex: `if (usuario.nivel == 'VENERAVEL') { <MenuTesouraria /> }`).
