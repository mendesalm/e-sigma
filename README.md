# e-Sigma Core 🏛️

O **e-Sigma Core** é o "Cérebro" e portal de entrada de todo o ecossistema tecnológico para Lojas Maçônicas. Ele atua como **Provedor de Identidade (IdP)** e **Gerenciador de Assinaturas SaaS**.

## 🚀 Arquitetura e Papéis

O e-Sigma é construído com **Microserviços Independentes**. Ele centraliza os pagamentos, cadastros de Lojas (Tenants) e autenticação de usuários, mas **delega** o funcionamento de módulos específicos para aplicativos especialistas (como o *Harmonia*).

* **Frontend:** React + Vite, Tailwind CSS, Lucide Icons, Zustand.
* **Backend:** Python + FastAPI.
* **Banco de Dados:** PostgreSQL (SQLAlchemy + Alembic).
* **Gateway de Pagamento:** Asaas (Cobrança via PIX/Boleto, Webhooks de ativação automática).

## 🔐 Single Sign-On (SSO) & JWT

Todos os aplicativos da família (Harmonia, etc.) autenticam seus usuários contra o **e-Sigma**.

O fluxo funciona da seguinte maneira:
1. O aplicativo cliente (ex: Harmonia Mobile) envia um POST para `https://e-sigma.app/api/auth/login`.
2. O e-Sigma verifica o e-mail, senha e o *Status de Pagamento (Asaas)* da Loja do usuário.
3. Se tudo estiver regular, o e-Sigma emite um **JWT (JSON Web Token)** assinado com a `JWT_SECRET_KEY` central.
4. O Token carrega permissões vitais (ex: `"harmonia_ativo": True`), que são decodificadas diretamente pelo backend dos módulos.

## 📦 Estrutura do Projeto

* `/backend` - API FastAPI, modelos SQLAlchemy, rotas de Autenticação e Webhooks Asaas.
* `/frontend` - Portal do cliente (Veneráveis, Mestres e Tesoureiros), painel de assinaturas e Launchpad (diretório de módulos).
* `.github/workflows` - Scripts de Automação CI/CD.

## 🌐 Deploy (Produção VPS)

O e-Sigma está em produção numa VPS Ubuntu (`69.62.89.211`).
* **Frontend:** Servido via Nginx estático (`/var/www/esigma/frontend/dist`) no domínio `e-sigma.app`.
* **Backend:** Rodando via Uvicorn na porta `8001` (`esigma.service` no Systemd).
* **CI/CD:** Qualquer push aciona o Github Actions que compila o Frontend e reinicia o serviço Systemd automaticamente na VPS.

---
*Ecossistema Sigma - Tecnologia à serviço da Ordem.*
