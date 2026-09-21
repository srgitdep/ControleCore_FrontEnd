---
name: feature-planner
description: Analyze a complex new feature description (usually written in Portuguese, often long, messy, or written by a non-technical person) and turn it into a concrete, project-grounded implementation plan for the ControlCore fullstack system (NestJS + Prisma + PostgreSQL backend, React + Vite frontend) - covering data model, backend, frontend, cross-cutting concerns, risks and open questions - then write that plan out as a markdown planning document under Docs/ that the user can review, share and use as a reference while building. Use this skill whenever the user pastes or describes a new feature, requirement, user story, or PRD-like text and wants to know what it takes to build it in this system, even if they never say "skill" or "plan" explicitly. Trigger especially on Portuguese phrasings such as "nova funcionalidade", "plano de implementação", "documentar uma feature nova", "analisa este requisito", "como implementar isto no sistema", "preciso de um plano técnico para isto", or when they hand over a feature description and ask what modules/endpoints/telas isso vai tocar before any code gets written.
---

# Planeamento técnico de nova funcionalidade (ControlCore)

## Para que serve

Esta skill existe para o momento em que chega uma funcionalidade nova descrita em texto — às vezes bem escrita, às vezes um parágrafo confuso vindo de alguém não técnico — e é preciso transformar isso num plano de implementação real, específico deste sistema, antes de escrever uma linha de código.

O ControlCore é um sistema fullstack (ERP/POS): backend NestJS + Prisma + PostgreSQL, frontend React 19 + Vite + React Router + TanStack Query + Zustand + react-hook-form + Zod + Tailwind, em dois repositórios separados (`ControleCore_FrontEnd` e `ControleCore_BackEnd`). Um bom plano para este sistema não pode ser genérico: tem de nascer da leitura do schema Prisma real, dos módulos NestJS existentes, das features React já implementadas. Um plano que inventa endpoints ou tabelas que não existem é pior do que nenhum plano — dá falsa confiança e alguém só descobre o erro a meio da implementação.

O resultado final não é apenas uma resposta no chat: é um **documento markdown gravado em `Docs/`** que fica como referência para quem for implementar (o utilizador, outra pessoa, ou o próprio Claude numa sessão futura).

## Os dois repositórios

Esta skill é fullstack e assume acesso aos dois lados. Nesta máquina ficam em:

- `C:\Documentos\SRG\ControlCore\ControleCore_BackEnd`
- `C:\Documentos\SRG\ControlCore\ControleCore_FrontEnd`

São repositórios git separados, sem monorepo acima deles. **Confirma logo no início que consegues ler os dois** — se a sessão só tiver um deles como directório de trabalho, pede ao utilizador para adicionar o outro com `/add-dir <caminho>` antes de continuares. Planear só metade de uma funcionalidade fullstack, ou pior, adivinhar o que está do outro lado, é exactamente o que esta skill existe para evitar.

A única excepção é quando o requisito é genuinamente de um só lado (ex: um ajuste visual sem qualquer alteração de dados ou API) — aí segue com o repositório que tens, e di-lo no plano.

## Fluxo de trabalho

Segue as fases pela ordem. Não saltes a fase 0 — planear em cima de suposições erradas sobre a stack ou o schema é o erro mais caro e mais fácil de evitar.

### Fase 0 — Contexto real do projecto

Antes de interpretar o requisito, olha para o sistema como ele é:

- **Backend** (`ControleCore_BackEnd`): lê `prisma/schema.prisma` para os modelos e relações relevantes, os módulos em `src/modules/` próximos do domínio da nova funcionalidade (estrutura de controller/service/DTO, como são feitas validação, autenticação e autorização), e `src/shared/` para utilitários já existentes.
- **Frontend** (`ControleCore_FrontEnd`): lê `src/features/` (a feature mais parecida, como referência de estilo), `src/router/` para como as rotas são organizadas, e como o projecto já faz data fetching (TanStack Query), formulários (react-hook-form + Zod) e estado global (Zustand).
- **Documentação existente**: `ControleCore_BackEnd/Docs/` já tem vários planos anteriores (`plano_desenvolvimento.md`, `fase*.md`, `plano_correccao_*.md`, `base_de_dados.md`, `logica_de_negocio.md`) — vale a pena verificar se a nova funcionalidade tem relação com algo já documentado ali, para não contradizer decisões tomadas.
- **Encontra pelo menos uma feature já implementada e semelhante** à pedida, dos dois lados (back e front), e usa-a como referência de estrutura e nomenclatura. O plano deve propor código que pareça escrito pela mesma equipa, não colado de fora.

Se o pedido tocar só um dos dois repositórios (ex: uma alteração puramente de backend), não finjas que há trabalho de frontend — reflecte isso no plano.

Para buscas amplas no código (ex: "onde é tratada a autorização por perfil", "como é que outras features fazem paginação"), usa o agente `Explore` em vez de adivinhar.

**Nunca inventes** endpoints, tabelas, componentes, hooks ou bibliotecas que não confirmaste que existem.

### Fase 1 — Ler o requisito com rigor

Da descrição da funcionalidade (o texto que o utilizador colou ou escreveu ao invocar esta skill), extrai:

- **Objectivo de negócio** — o *porquê*, não só o *quê*.
- **Actores e permissões** envolvidos (que perfis/roles usam isto, o que cada um pode ou não fazer).
- **Regras de negócio** explícitas e as implícitas (as que o texto assume mas não diz).
- **Dados de entrada, saída e estados intermédios**.
- **Casos limite, erros e cenários de falha**.
- **O que fica fora de âmbito** — tão importante quanto o que entra.

Se a descrição for ambígua ou incompleta nalgum ponto que não impede avançar, não pares — regista a assunção na fase seguinte e continua.

### Fase 2 — Análise técnica (produz sempre esta secção)

Curta e densa, sem encher linguiça:

- **Interpretação do requisito** — 3 a 6 linhas sobre o que percebeste que tem de ser construído. Se a tua leitura diverge do literal do texto, di-lo.
- **Impacto no sistema** — que módulos NestJS, tabelas/modelos Prisma, endpoints, ecrãs e permissões são tocados. Distingue *criar* de *alterar*.
- **Decisões de arquitectura** — quando há mais do que um caminho razoável, escolhe um e justifica em uma linha. Não cataloga alternativas só por catalogar.
- **Riscos e pontos sensíveis** — migrações destrutivas, quebra de contrato de API, performance, concorrência, segurança, dados existentes, retrocompatibilidade.
- **Ambiguidades**, separadas em:
  - *Bloqueantes*: sem resposta o plano pode sair errado → pergunta ao utilizador antes de continuar.
  - *Não bloqueantes*: assume o comportamento mais sensato, **declara a assunção explicitamente**, e continua.

### Fase 3 — Plano de implementação executável (produz sempre)

Por camadas, na ordem em que a implementação deve acontecer:

1. **Dados** — alterações de schema Prisma, migrações, índices, seeds, estratégia para dados já existentes.
2. **Backend** — modelos/entidades, serviços e regras de negócio, endpoints (método, rota, DTO de entrada e saída, códigos de erro), validação, autenticação e autorização, eventos/jobs/integrações.
3. **Frontend** — rotas e ecrãs, componentes (novos vs. reutilizados), camada de acesso à API e tipos, estado e cache (TanStack Query/Zustand), formulários e validação (react-hook-form/Zod), estados de loading/erro/vazio, feedback ao utilizador, permissões na UI.
4. **Transversal** — testes, logging, tratamento de erros, i18n, configuração e variáveis de ambiente.
5. **Ficheiros afectados** — lista concreta de ficheiros a criar e a alterar, nos dois repositórios conforme aplicável.

Para cada item, indica o que é obrigatório para a funcionalidade funcionar e o que é opcional/melhoria. Consulta `references/template-plano-implementacao.md` para a estrutura exacta de secções a preencher — usa-a como esqueleto do documento da Fase 4, não como prosa solta no chat.

### Fase 4 — Gerar o documento do plano (o entregável desta skill)

Este é o passo que diferencia esta skill de "só responder no chat": a análise da Fase 2 e o plano da Fase 3 têm de ficar escritos num ficheiro, não só ditos.

- **Onde salvar**: `ControleCore_BackEnd/Docs/plano_feature_<slug-curto-da-funcionalidade>.md`, seguindo a convenção já usada nesse directório (`plano_desenvolvimento.md`, `plano_correccao_*.md`, `fase*.md` — nomes em snake_case, em português). Usa esse repositório mesmo quando a funcionalidade é maioritariamente frontend: é onde o projecto já concentra o histórico de planeamento, e um único documento fullstack evita duplicar e desalinhar duas cópias em repositórios git separados.
- Se o utilizador pedir explicitamente para o documento ficar no frontend, ou a funcionalidade for exclusivamente frontend sem qualquer impacto de dados/backend, usa `ControleCore_FrontEnd/Docs/` em vez disso.
- **Formato do documento**: segue `references/template-plano-implementacao.md`. Preenche todas as secções com o conteúdo real das Fases 2 e 3 — nada de placeholders por preencher no ficheiro final.
- Depois de gravar o ficheiro, diz ao utilizador o caminho exacto e resume em poucas linhas as decisões e ambiguidades bloqueantes mais importantes — não repitas o documento inteiro no chat.

### Fase 5 — Implementação (opcional, só se pedido)

O foco principal desta skill é análise + plano + documentação, não escrever o código. Se o utilizador pedir para avançar com a implementação a seguir ao plano aprovado, segue `references/guia-implementacao-e-entrega.md`.

## Regras permanentes

- Sê directo e técnico. Sem elogios, sem preâmbulos, sem repetir o requisito de volta.
- Uma recomendação clara vale mais do que um levantamento de opções.
- Se discordares tecnicamente do requisito, di-lo em duas linhas — e continua o plano com o que foi pedido.
- Responde sempre em português.
- Não avances para a Fase 4 (gravar o documento) sem antes teres resolvido ou assinalado claramente as ambiguidades bloqueantes da Fase 2.
