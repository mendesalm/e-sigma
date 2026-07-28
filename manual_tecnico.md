# Manual Técnico: Arquitetura Sigma 2.0

Bem-vindo ao **Manual Técnico do Sigma 2.0**.
Este documento centraliza as decisões arquiteturais, modelos de banco de dados e regras de negócio essenciais desta versão. Ele atua como um documento vivo, devendo ser gradativamente expandido à medida que novos domínios e funcionalidades forem implantados.

## 1. Regras Fundamentais (Diretrizes de Ouro)

1. **Idioma Estrito (PT-BR)**: Todos os identificadores no código (variáveis, funções, classes, constantes), assim como tabelas e colunas no banco de dados, devem ser declarados em **Português do Brasil**.
2. **Documentação Viva (Handoff)**: Todo fim de ciclo de desenvolvimento exige a atualização de um arquivo `handoff.md` descrevendo o estado atual, facilitando o onboarding ou retomada.
3. **Código Autoexplicativo**: Todo arquivo gerado pelo backend ou frontend deverá conter comentários e *docstrings* substanciais detalhando a intenção arquitetural de cada bloco lógico.

## 2. Paradigma de Dados: OO com PostgreSQL JSONB

Adotamos a estratégia **Single Table Inheritance** (Tabela Única por superclasse) enriquecida com a flexibilidade NoSQL fornecida pelo tipo de dado `JSONB` do PostgreSQL.

### 2.1 O Ecossistema de Organizações

#### Superclasse `Organizacao`
Gerencia a complexa árvore estrutural (Obediências, Subobediências, Lojas e Corpos Filosóficos).
*   **Hierarquia via Autorreferência**: A coluna lógica `organizacao_superior_id` garante a relação hierárquica.
    *   *Regra*: Uma LOJA pode ser subordinada direta a uma SUBOBEDIENCIA ou a uma OBEDIENCIA. Uma SUBOBEDIENCIA subordina-se sempre a uma OBEDIENCIA (topo da pirâmide).
*   **Restrições de Domínio**:
    *   O atributo `esfera` (Federal/Estadual) aplica-se primordialmente a Obediências e Subobediências.
    *   O atributo `rito` é exclusivo para Lojas maçônicas. A classe efetua essa restrição através de getters/setters em tempo de execução.

### 2.2 O Ecossistema Pessoal

#### Superclasse `Pessoa`
Tabela âncora para toda identidade biológica do sistema.
*   **Controle de Acesso (SaaS)**: A classe gerencia autonomamente suas credenciais. Colunas `senha_hash`, `ultimo_login` e `status_acesso` permitem que qualquer registro (que tenha email válido) atue como usuário autenticável.
*   **Permissões de Tela (Roles)**: Para definir o que o usuário pode ver, utilizamos a propriedade OO `permissoes_sistema` (que grava um Array diretamente no JSONB `dados_civis`). Ex: `["webmaster", "tesouraria"]`. Zero tabelas pivô necessárias.
*   **Discriminador (`tipo`)**: Define a identidade civil/maçônica (MACOM, FAMILIAR, FUNCIONARIO). *Nota: Visitantes são classificados estruturalmente como Maçons pertencentes a organizações externas.*
*   **Envelope `dados_civis` (JSONB)**: Agrupa propriedades orgânicas flexíveis (ex: profissão, estado civil).
*   **Envelope `dados_especificos` (JSONB)**: Onde a mágica do polimorfismo acontece.
    *   *Exemplo para Maçom*: Possuirá validações exclusivas para `cim`, `grau_simbolico` (restringido de 1 a 3) e `grau_filosofico` (restringido de 4 a 33 conforme o rito atrelado).

### 2.3 O Ecossistema Histórico e Geográfico

#### Tabela de Relacionamento `Mandatos`
Modela a realidade de que os cargos maçônicos (ex: Venerável Mestre, Secretário) são funções temporárias conferidas por eleição, possuindo data de início e fim. Ela faz o pivô entre `Pessoa` e `Organizacao` acompanhado do `titulo_cargo`.

#### Entidade Composta `Endereco`
Foi isolada (Tabela `enderecos`) para permitir relação polimórfica. Tanto Pessoas quanto Organizações se conectam a ela usando as colunas `entidade_tipo` e `entidade_id`.

### 2.4 O Ecossistema Financeiro

#### Tabela `CategoriaFinanceira`
Define o plano de contas da instituição (Mensalidades, Eventos, Doações). Pertence obrigatoriamente a uma Organização.

#### Tabela `Transacao`
O coração do fluxo de caixa.
*   **Matemática Relacional**: Colunas como `valor_original`, `valor_juros`, `valor_multa` e `valor_final` usam o tipo `Numeric` para garantir a integridade dos cálculos.
*   **Integração Flexível (JSONB)**: O envelope `dados_gateway` guarda todas as respostas e chaves dos gateways de pagamento (Asaas, Iugu, PIX, etc) de forma limpa, sem exigir colunas nativas no banco para cada serviço.

### 2.5 O Ecossistema de Sessões e Frequência

#### Tabela `Sessao`
Responsável por agendar e registrar as reuniões (ordinárias, magnas).
*   **Balaústres**: As atas da reunião, por serem textos longos (muitas vezes em HTML), ficam abrigadas no envelope `dados_ata` (JSONB) para evitar tabelas extras e lentidão.
*   **Check-in Inteligente**: Dados criptográficos e regras de tempo para gerar QR Codes dinâmicos de presença ficam no envelope `config_checkin`.

#### Tabela Pivô `Presenca`
Tabela relacional minúscula e veloz para cruzar `Sessao` e `Pessoa`.
*   Sinaliza imediatamente se o membro faltou, justificou, ou se é um **visitante** (que deve obrigatoriamente possuir um registro no ecossistema `Pessoa` do Sigma).
*   Metadados do check-in (IP do celular, se foi leitura de QR code ou manual) vão para o `dados_checkin` (JSONB).

## 3. Topologia do Código

O projeto está dividido em micro-ecossistemas frontais e traseiros:
*   `/backend/`: Aplicação Python utilizando o ORM SQLAlchemy e FastAPI.
*   `/frontend/`: SPA (Single Page Application) baseada em ReactJS construída sobre a ferramenta Vite (TypeScript).

## 4. Arquitetura da API (FastAPI)

Foi adotado o padrão de **Monolito Modular** (Fatias Verticais). A lógica não é separada por camadas "técnicas" espalhadas globalmente, mas agrupada por Domínios de Negócio (ex: `/api/organizacoes`, `/api/pessoas`).

1. **Schemas (Pydantic)**: São a barreira de validação estática. Tudo que entra e sai da rede passa pelo Pydantic para tipagem forte.
2. **Rotas (Controllers)**: Recebem a requisição HTTP, extraem a sessão do banco (via Injeção de Dependências) e acionam a camada de Serviços.
3. **Serviços (Service Layer)**: Concentram a regra de negócio e os comandos pesados de ORM. Desacoplados do HTTP para facilitar testes isolados.

### 4.1 Documentação Viva (Regra de Ouro)
O Swagger foi configurado no `main.py` para extrair todas as `docstrings`, `summaries` e `descriptions` dos Schemas e Rotas, gerando automaticamente a documentação RESTful interativa (acessível via `/docs`). Todo novo código da API é obrigado a se autodocumentar no ato da sua criação.

## 5. Arquitetura Frontend (React + Vite)
Mantendo a filosofia da V1, o sistema visual é impulsionado pelo **Material UI (MUI)**. 
A arquitetura reflete o *Monolito Modular*, mas com uma forte exigência pelo idioma PT-BR nas regras de negócio.

*   **Tema Ciano/Navy**: Configurado centralmente em `/compartilhado/tema/tema_mui.ts`.
*   **Axios**: Cliente HTTP configurado em `/compartilhado/api/cliente_http.ts` com Interceptors prontos para o JWT.
*   **Roteamento (SPA)**: Centralizado em `Roteador.tsx`, que aponta para as Fatias Verticais dentro de `/modulos/` (ex: `PaginaOrganizacoes.tsx`).
*   **Custom Hooks**: Devido às convenções estritas do React, os Hooks de chamadas de API (que serão feitos no futuro) manterão a semântica híbrida, usando a sintaxe clássica em inglês mas com sufixos compreensíveis (ex: `useOrganizacoes`).

---
> *Este manual está em sua versão 1.3 e deve ser continuamente enriquecido nas próximas etapas de implantação.*
