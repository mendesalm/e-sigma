# Histórico de Implementação do Sigma 2.0 (Changelog Global)

Este documento atua como a **Regra de Ouro** de documentação histórica do Sigma 2.0. Ele é um compilado centralizado de todas as decisões, correções arquiteturais, e funcionalidades implantadas desde a concepção do projeto. Novas entradas serão adicionadas no topo (cronologia inversa), garantindo que a evolução do sistema seja rastreável e documentada de ponta a ponta.

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
