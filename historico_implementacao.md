# Histórico de Implementação do Sigma 2.0 (Changelog Global)

Este documento atua como a **Regra de Ouro** de documentação histórica do Sigma 2.0. Ele é um compilado centralizado de todas as decisões, correções arquiteturais, e funcionalidades implantadas desde a concepção do projeto. Novas entradas serão adicionadas no topo (cronologia inversa), garantindo que a evolução do sistema seja rastreável e documentada de ponta a ponta.

---

## [10 de Agosto de 2026] - Prevenção de Colisão, Padronização e Importação em Massa (SaaS)
**Módulo:** `SaaS` / `Organizações`

### Regras Estritas e Segurança de Dados
- **Title Casing Inteligente (`servicos.py`)**: Implementado um algoritmo que intercepta o nome de todas as novas organizações (e atualizações). O texto é forçado para o padrão "Primeira Letra Maiúscula", mantendo as preposições (de, da, do, dos, e) em minúsculo. Ex: "GRANDE ORIENTE do brasil" vira "Grande Oriente do Brasil".
- **Bloqueio de Duplicidade (Case-Insensitive)**: Inserida trava matemática no banco de dados. Tentar criar uma organização com um nome que já existe (independente da capitalização) retorna erro `400 Bad Request`, eliminando a criação de entidades como "Gob" e "GOB" simultaneamente.

### Arquitetura de Importação
- **Geração Dinâmica de Webmaster**: O serviço `TenantStorageService` foi ampliado. Ao ativar o SaaS, gera e injeta o e-mail oficial (ex: `gob.loja2181@e-sigma.app` ou `gob@e-sigma.app`) direto na coluna `dados_especificos` do PostgreSQL.
- **Rota Analítica de Upload (`importador.py`)**: Criado serviço para leitura de tabelas CSV (.csv nativo para evitar lentidão e custos com dependências de Excel). Ele cruza os dados do arquivo com o banco de dados em memória e detecta colisões sem salvar.
- **Frontend Interativo (Decisão do SuperAdmin)**: Desenvolvido o componente `ModalImportacaoMassa.tsx`. Ele fornece o preview listando visualmente em verde (inéditos), amarelo (duplicatas) e vermelho (erros), permitindo que o usuário tenha a decisão final antes da inserção em lote. O processo de importação *não* ativa a assinatura automaticamente.

---

## [07 de Agosto de 2026] - Infraestrutura SaaS e File System Multi-Tenant
**Módulo:** `SaaS` / `Organizações`

### Backend (FastAPI)
- **Criação da Rota de Ativação**: Adicionada a rota `POST /api/v1/organizacoes/{org_id}/ativar` no `rotas.py`. Esta rota modifica a flag `cliente_ativo_sigma = True` no banco de dados, ativando a organização no modelo SaaS.
- **Isolamento Multi-Tenant (`TenantStorageService`)**: Criado o serviço utilitário para provisionamento físico de arquivos. Ao ativar uma organização, o sistema dinamicamente gera a pasta usando a estrutura `armazenamento/instancias/public/{slug}` e `armazenamento/instancias/private/{slug}`.
- **Cálculo Dinâmico de Slug**: O sistema lê a árvore hierárquica usando Adjacency List para batizar a pasta. Exemplo: Se uma Loja pertence ao GOB-GO, o algoritmo localiza o avô (GOB) e gera o slug `GOB_Loja2181`, garantindo unicidade matemática e organização visual.
- **Security by Design (`StaticFiles`)**: O `main.py` foi configurado para expor a rota `/storage` apontando estritamente para `armazenamento/instancias/public`. Documentos guardados em `/private/` ficam blindados de acesso HTTP direto.
- **API Swagger**: A documentação viva (Regra de Ouro) foi preservada. A rota de ativação contém descrições, sumários e respostas mapeadas que podem ser lidas em `/docs`.

### Frontend (React/Vite)
- **Botão de Ativação**: Inserido um botão "🚀 Ativar Assinatura SaaS" no `ModalEdicaoOrganizacao.tsx` para entidades ainda não ativas. O botão conecta-se diretamente à API e processa a lógica de criação do File System.

---

## [06 de Agosto de 2026] - Refatoração Hierárquica e UX Global
**Módulo:** `Painel Global` / `Organizações`

### Regras de Negócio e Banco de Dados
- **Implementação do Top-Down (Adjacency List)**: Validação estrutural rigorosa baseada na hierarquia. A coluna `organizacao_superior_id` governa a rastreabilidade. 
- **Obrigatoriedade de Federações**: Lojas pertencentes a uma "Federação" (Ex: GOB) são obrigadas, via código, a preencher o campo de "Subobediência (Jurisdição)".
- **Isenção de Confederações**: Lojas atreladas a "Confederações" (Ex: GLEG) ignoram a subobediência (ligação direta à mãe). O formulário oculta o campo dinamicamente.

### Frontend
- **Correções do Filtro**: O arquivo `GestaoLojas.tsx` teve sua função de filtro otimizada (`O(N)`) para rastrear o "avô" da entidade. Ao buscar por "GOB", todas as lojas do GOB-GO são automaticamente inclusas no resultado.
- **Estética da Tabela**: A coluna que exibe a subordinação foi adaptada para o modelo `{Federação} / {Jurisdição}` (Ex: `GOB / GOB-GO`), melhorando a legibilidade dos dados.
- **Ajustes Visuais (MUI v6)**: Adequação completa da sintaxe do Material UI (substituição de `Grid item xs` por `Grid size={{xs}}`).
- **Paleta de Cores**: Mudança oficial do tom dourado para o **Deep Blue / Cyan Brilhante (#00E5FF)** em toda a plataforma.
- **Prevenção de Bugs**: Adição da prop `shrink: true` nos InputLabels do formulário para evitar que os placeholders se sobreponham aos dados pré-carregados durante operações assíncronas.

### DevOps
- **Resolução de Conflitos de Porta**: Correção de processos zumbis que travavam o backend (porta 8000), normalizando os acessos ao login de SuperAdmin (`sistema@e-sigma.app`).

---

> *Este documento crescerá organicamente junto com as inovações arquiteturais do Sigma 2.0.*
