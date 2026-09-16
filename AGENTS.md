# AGENTS.md — Regras inegociáveis do e-Sigma

> Leia antes de tocar em código deste repositório, humano ou agente de IA.
> e-Sigma é o hub central do ecossistema (autenticação, assinaturas,
> identidade) — um bug aqui afeta todos os módulos satélites (CoReVM,
> Harmonia, Lojas, e outros que vierem a existir).

## 1. Segurança — nunca, em nenhuma circunstância

- **Nunca hardcode senha, token, chave de API ou segredo de JWT no código.** Existe hoje um fallback hardcoded conhecido em `api/auth/dependencias.py` (`SECRET_KEY = os.getenv("JWT_SECRET_KEY", "minha_chave_super_secreta_sigma_2")`) — é uma dívida de segurança real e pendente, não um exemplo a seguir. Ao tocar nesse arquivo, aproveite para remover o fallback (falhar explicitamente se a env var não existir), em vez de conviver com ele.
- **Nunca cole senha ou token em texto puro numa conversa, PR, issue ou commit.** Se isso já aconteceu, a credencial está comprometida e precisa ser rotacionada — não é "só remover a mensagem depois".
- Todo módulo satélite (CoReVM, Harmonia etc.) autentica **repassando o mesmo JWT do usuário final** para `GET /api/v1/auth/validate` — o e-Sigma nunca deve exigir que um satélite decodifique o JWT localmente (evita distribuir `JWT_SECRET_KEY`) nem aceitar identidade sem essa validação.
- `armazenamento/instancias/private/` nunca é servido diretamente por HTTP — só `public/` passa pelo `StaticFiles`. Qualquer novo tipo de arquivo sensível segue esse mesmo padrão de isolamento por padrão (privado até decisão explícita de expor).

## 2. Fronteira entre módulos

- O e-Sigma expõe API para autenticação, assinatura/módulos ativos e identidade (`Pessoa`, `Mandatos`). Módulos satélites devem consumir essa API — o e-Sigma não deve, por comodidade, criar uma conexão direta ao banco de um módulo satélite (e vice-versa).
- Ao adicionar um campo novo em `Pessoa`/`Organizacao` que um módulo satélite precisa, exponha via `/auth/validate` (ou uma rota nova dedicada) em vez de esperar que o satélite acesse o banco `esigma` diretamente.

## 3. Antes de considerar uma feature pronta

- [ ] Nenhuma credencial nova hardcoded.
- [ ] Idioma 100% PT-BR (variáveis, tabelas, colunas, comentários).
- [ ] `handoff.md`/`historico_implementacao.md` atualizado se a mudança for estrutural.
- [ ] Se a mudança afeta `/auth/validate` ou o payload do JWT: confirmar que módulos satélites que já consomem isso (hoje: CoReVM) continuam compatíveis — é um contrato entre serviços, não um detalhe interno.
