# TRD — Technical Reference Document — SRG ControlCore

> Documento único, replicado tal e qual nos dois repositórios
> (`ControleCore_BackEnd/Docs/TRD.md` e `ControleCore_FrontEnd/Docs/TRD.md`).
> Descreve **tudo o que está a ser usado** para construir o sistema — linguagens,
> frameworks, bibliotecas, serviços de terceiros, pagos ou não — a uma data
> concreta. Não descreve o histórico de entregas nem o que falta fazer: isso está
> em [`plano_implementacao.md`](./plano_implementacao.md).
>
> Levantado a partir de `package.json`, `.env.example`, `fly.toml`, `vercel.json`
> e `prisma/schema.prisma` dos dois repositórios em 2026-09-21. Uma dependência
> nova — sobretudo um serviço de terceiros novo, pago ou não — actualiza este
> documento no mesmo commit que a introduz.

---

## 1. Visão geral

SaaS ERP/POS multi-empresa para Moçambique: catálogo, stock, POS, compras, CRM,
RH, financeiro, auditoria, portal B2B de fornecedor, loja online B2C ("Compra
Fácil") e a assistente de IA "Mayra".

| Camada | Stack | Alojamento | Repositório |
|---|---|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind v4 + TanStack Query + Zustand + react-hook-form + Zod | Vercel | `ControleCore_FrontEnd` |
| Backend | NestJS 11 + Prisma 6 + TypeScript | Fly.io, região `fra` (Frankfurt) — app `srg-controlcore-api` | `ControleCore_BackEnd` |
| Base de dados | PostgreSQL (Neon serverless, `eu-central-1`) + Redis | Neon (gerido) | — |
| Armazenamento de ficheiros | Neon Object Storage (S3-compatible) | Neon | — |

Dois repositórios git separados, dois deploys independentes, backend sempre
primeiro (contrato de API muda no backend antes do frontend passar a chamá-lo).

---

## 2. Frontend — `ControleCore_FrontEnd`

| Categoria | Tecnologia | Versão (package.json) | Notas |
|---|---|---|---|
| Framework UI | React | ^19.2.7 | com `react-dom` |
| Build tool | Vite | ^8.1.1 | `@vitejs/plugin-react`, `@vitejs/plugin-basic-ssl` (HTTPS local p/ câmara do leitor de código de barras) |
| Linguagem | TypeScript | ~6.0.2 | `tsc -b` faz parte do `npm run build` |
| Routing | react-router-dom | ^7.18.1 | |
| Estado do servidor | @tanstack/react-query | ^5.101.2 | cache/mutations; fonte de verdade para dados vindos da API |
| Tabelas | @tanstack/react-table | ^8.21.3 | |
| Estado de cliente | zustand | ^5.0.14 | só para estado genuinamente local (ex. carrinho do POS) |
| Formulários | react-hook-form + @hookform/resolvers + zod | ^7.81.0 / ^5.4.0 / ^4.4.3 | validação Zod |
| Estilo | tailwindcss + @tailwindcss/vite + @tailwindcss/typography | ^4.3.2 | Tailwind v4 |
| Animação | framer-motion | ^12.42.2 | |
| Ícones | lucide-react | ^1.23.0 | |
| Notificações | react-hot-toast | ^2.6.0 | mensagens de erro passam por `mensagemDeErro()` |
| HTTP client | axios | ^1.18.1 | endereço da API deduzido do anfitrião em dev |
| WebSocket client | socket.io-client | ^4.8.3 | eventos em tempo real + voz da Mayra |
| Gráficos | recharts | ^3.9.2 | |
| PDF | jspdf + jspdf-autotable | ^4.2.1 / ^5.0.8 | geração de documentos no browser |
| Leitura de código de barras | @zxing/browser + @zxing/library | ^0.2.1 / 0.23.0 | usa a câmara do telemóvel (exige contexto seguro: `localhost` ou HTTPS) |
| Markdown | react-markdown + remark-gfm | ^10.1.0 / ^4.0.1 | respostas da Mayra |
| Login social | @react-oauth/google | ^0.13.5 | "Continuar com Google" no Compra Fácil (Google Identity Services) |
| Datas | date-fns | ^4.4.0 | |
| Utilitários CSS | clsx + tailwind-merge + class-variance-authority | — | |
| Lint | oxlint | ^1.71.0 | `npm run lint` |
| Testes | vitest | ^4.1.10 | `npm test` |
| E2E (dependência presente) | playwright-core | ^1.62.0 | driver headless; confirmar se há suite e2e activa antes de assumir cobertura |

**Porta de desenvolvimento:** `5273` (fixa, `strictPort`; libertada por
`scripts/libertar-porto.mjs` antes de arrancar).

---

## 3. Backend — `ControleCore_BackEnd`

| Categoria | Tecnologia | Versão (package.json) | Notas |
|---|---|---|---|
| Framework | @nestjs/* (common, core, config, event-emitter, jwt, mapped-types, passport, platform-express, platform-socket.io, schedule, swagger, throttler, websockets) | ^11.x | Nest 11 |
| Linguagem | TypeScript | ^5.7.3 | `tsc` é gate de CI |
| ORM | @prisma/client + prisma | ^6.19.3 | migrações versionadas em `prisma/migrations/` |
| Validação | class-validator + class-transformer | ^0.15.1 / ^0.5.1 | `ValidationPipe` global: `whitelist`, `forbidNonWhitelisted`, `transform` |
| Auth | passport + passport-jwt + bcrypt | — | JWT em cookies HttpOnly (`accessToken`/`refreshToken`), nunca `localStorage` |
| Multi-tenancy | nestjs-cls | ^6.2.1 | `AsyncLocalStorage` para `empresaId` por pedido |
| Segurança HTTP | helmet + @nestjs/throttler | — | cabeçalhos de segurança + rate limiting |
| Agendamento | @nestjs/schedule | ^6.1.3 | crons (ex. limpeza de reservas expiradas) |
| Tempo real | socket.io + @nestjs/websockets + @nestjs/platform-socket.io + ws | ^4.8.3 / ^11.x / ^8.21.1 | eventos e voz da Mayra |
| Cache/filas | ioredis | ^5.11.1 | Redis |
| E-mail | nodemailer | ^9.0.1 | `MailerService`, SMTP (ver §6) |
| SMS/WhatsApp/E-mail de campanha | @zavudev/sdk | ^0.56.0 | ver §6 |
| IA | @google/genai | ^2.12.0 | Gemini (texto) + Gemini Live (voz) — ver §5 |
| OAuth Google | google-auth-library | ^11.1.0 | verificação do ID token do "Continuar com Google" |
| Object storage | @aws-sdk/client-s3 + @aws-sdk/s3-request-presigner | ^3.1136.0 | aponta ao Neon Object Storage (S3-compatible), não à AWS |
| Processamento de imagem | sharp | ^0.35.4 | compressão/normalização de imagens de produto |
| Leitura de documentos | mammoth | ^1.12.2 | extracção de `.docx` |
| Folhas de cálculo | exceljs | ^4.4.0 | exportações |
| Documentação de API | @nestjs/swagger + swagger-ui-express | — | `/api/docs` |
| Datas | date-fns | ^4.4.0 | |
| Identificadores | uuid | ^14.0.1 | |
| Testes | jest + ts-jest + jest-mock-extended + supertest | ^30.x | `*.spec.ts`, `npm test` / `test:e2e` |
| Lint | eslint + typescript-eslint + prettier | ^9.x | `npm run lint` |
| Análise estática de código (dev) | ts-morph | ^28.0.0 | scripts internos, não faz parte do runtime |

**Porta de desenvolvimento:** `3100` (fixa; `scripts/libertar-porto.mjs`).
**Prefixo global da API:** `/api/v1`. **Node:** `>=20 <23`.

---

## 4. Base de dados

- **Motor:** PostgreSQL, servido pelo **Neon** (serverless, região `eu-central-1`,
  Frankfurt). `pgbouncer=true`, `connect_timeout=15s` de propósito — o compute do
  Neon suspende ao fim de ~5 min sem consultas.
- **Cache/estruturas efémeras:** Redis via `ioredis`.
- **Schema:** `prisma/schema.prisma`, **109 modelos**, tabelas em `snake_case` via
  `@@map`, campos em `camelCase`. Domínios principais:
  - **Identidade/Plataforma** — `User`, `Empresa`, `Modulo`, `Assinatura`,
    `AssinaturaModulo`, `Pagamento`, `Perfil`, `Permissao`, `AuditLog`.
  - **Catálogo/Stock** — `Produto`, `Categoria`, `Lote`, `Stock`,
    `StockMovement`, `Armazem`, `Localizacao`, `StockLocalizacao`,
    `InventoryCycle`, `InventoryCount`, `ToleranciaInventario`,
    `InventoryException`.
  - **Compras** — `PedidoCompra` (+ `Item`/`Versao`), `ConfirmacaoFornecedor`,
    `Rececao`, `AvisoExpedicao`, `FacturaFornecedor`, `ConferenciaFactura`,
    `PoliticaTolerancia`, `CasoExcepcao`, `SessaoConferenciaRececao`.
  - **B2B (portal do fornecedor)** — `FornecedorOrganizacao`,
    `FornecedorContaBancaria`, `ArtigoFornecedor`, `PrecoArtigo`,
    `SourcingRun`/`SourcingCandidato`, `RequisicaoCompra`, `PedidoAdesao`,
    `UtilizadorFornecedor`.
  - **CRM** — `Cliente`, `ClienteIdentidade`, `ClienteConsentimento`,
    `ClienteEvento`, `Segment`, `Audience`, `Campaign`/`CampaignDelivery`,
    `MovimentoPontos`, `CrmConfiguracao`.
  - **POS/Financeiro** — `Venda`, `VendaItem`, `PagamentoVenda`, `Caixa`,
    `SessaoCaixa`, `MovimentoCaixa`, `RegistroFinanceiro`.
  - **RH** — `Contrato`, `Turno`, `EscalaTurno`, `RegistoPonto`,
    `ReciboVencimento`, `DepartmentNode`.
  - **Necessidades de Compra (DT01)** — `NecessidadeCompra`,
    `NecessidadeHistorico`, `TransferenciaLoja`.
  - **Compra Fácil (Commerce)** — `ContaCliente`, `Pedido`, `PedidoItem`,
    `PedidoItemSubstituicao`, `ReservaStock`, `ProdutoImagem`,
    `FavoritoCliente`, `ComercioConfiguracao`.
  - **IA/Copiloto** — `CopilotSession`, `CopilotMessage`.
- **Migrações:** versionadas em `prisma/migrations/<timestamp>_<nome>/`, aplicadas
  no arranque do contentor (`prisma migrate deploy`, via `Dockerfile`). Nunca à
  mão em produção.

---

## 5. IA — Assistente "Mayra"

- **SDK:** `@google/genai`, módulo `ai-copilot`.
- **Modelo de texto:** `GEMINI_MODEL` (configurável por variável de ambiente, ex.
  `gemini-3.1-flash-lite`), com *function calling* sobre tools internas (ex.
  `get_warehouse_stock`, `get_my_daily_sales`, `list_supplier_products`,
  `receive_goods`) — todas com escopo por `empresaId`.
- **Voz em tempo real:** `GEMINI_LIVE_MODEL` (Live API, `bidiGenerateContent`),
  entregue ao frontend via WebSocket (`socket.io`).
- **Persistência de sessão:** `CopilotSession` / `CopilotMessage` no Postgres.
- **Custo:** Google AI Studio / Gemini API — tem lote gratuito, cobrança por uso
  acima disso. Chave em `GEMINI_API_KEY`.

---

## 6. Integrações e serviços de terceiros

| Serviço | Uso | Pago / gratuito | Configuração |
|---|---|---|---|
| **Neon** | PostgreSQL serverless + Object Storage (S3-compatible) | Pago (tem tier gratuito limitado; produção assume plano pago) | `DATABASE_URL`, `AWS_ENDPOINT_URL_S3`/`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_S3_BUCKET` |
| **Fly.io** | Hosting do backend (`fra`, `shared-cpu-1x`, 1 GB) | Pago | `fly.toml`, `FLY_API_TOKEN`/`FLY_CONTROLCORE_ACESS_TOKE` nos GitHub Secrets |
| **Vercel** | Hosting do frontend (build estático + rewrites) | Gratuito ou pago, consoante o plano da conta | `vercel.json` |
| **Redis** | Cache de leituras estáveis | Depende de onde está alojado (self-hosted ou gerido, não documentado aqui) | `REDIS_URL` |
| **Google AI Studio (Gemini API)** | Motor da Mayra (texto + voz) | Tier gratuito com limites; pago acima disso | `GEMINI_API_KEY` |
| **Google Identity Services (OAuth)** | "Continuar com Google" no Compra Fácil | Gratuito | `GOOGLE_CLIENT_ID` (backend) / `VITE_GOOGLE_CLIENT_ID` (frontend) — sem client secret, só verificação de ID token |
| **Zavu** (`@zavudev/sdk`) | SMS, WhatsApp e (antigo) e-mail de campanhas do CRM | Pago | `ZAVU_API_KEY`, `ZAVU_SENDER_ID`. Se faltar, o backend arranca e os envios ficam registados como não enviados — não bloqueia o POS |
| **SMTP** (ex. Gmail) | E-mail transaccional e, desde a Fase 11 do CRM, e-mail de campanhas (via `MailerService`) | Gratuito com Gmail pessoal (limites de envio); pago se SMTP dedicado | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |
| **GitHub Actions** | CI/CD do backend | Gratuito nos limites do plano da organização | `.github/workflows/deploy.yml` |

> Nenhuma chave paga fica no repositório — todas em `fly secrets` (runtime) ou
> GitHub Secrets (CI). Um valor exposto revoga-se e substitui-se, nunca se
> reaproveita.

---

## 7. Infra, deploy e ambiente

- **Backend:** push para `main` → `.github/workflows/deploy.yml` (`npm ci`,
  `prisma generate`, build, testes como gate) → `flyctl deploy --remote-only` →
  confirmação de `GET /api/v1/health`. Migrações correm no arranque do
  contentor, não no workflow.
- **Frontend:** Vercel, `npm run build` → `dist`, `vercel.json` faz *rewrite* de
  `/api/*` para `https://srg-controlcore-api.fly.dev/api/*` (cookies first-party,
  essencial para Safari/iOS) e SPA fallback para `index.html`.
- **Região do backend:** Fly.io `fra` (Frankfurt), **não** Joanesburgo, apesar de
  Joanesburgo estar geograficamente mais perto de Maputo — decisão justificada
  por a base de dados (Neon) estar em `eu-central-1`: a latência ao browser
  paga-se uma vez por pedido, a latência à base de dados paga-se a cada consulta.
  Comentado em `fly.toml`.
- **WebSockets:** exigem endereço absoluto (`VITE_SOCKET_URL`) — os *rewrites* do
  Vercel não encaminham WebSockets. Deliberadamente diferente do REST, que sai
  por caminho relativo.
- **Variáveis `VITE_*`:** substituídas no build, não lidas em runtime — alterá-las
  exige novo deploy.
- **Portas fixas:** `3100` (backend) e `5273` (frontend), por causa da lista
  explícita de CORS (`CORS_ORIGINS`).

---

## 8. Segurança e multi-tenancy

- Toda a consulta a dados de negócio filtra por `empresaId`, vindo do
  `AsyncLocalStorage` (`nestjs-cls`), nunca de um parâmetro do cliente.
- Autenticação por **cookies HttpOnly** (`accessToken`/`refreshToken`). Sem
  tokens em `localStorage`.
- **Três segredos JWT distintos, deliberadamente não intercambiáveis:**
  - `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — utilizadores internos
    (back-office).
  - `JWT_FORNECEDOR_SECRET` (8h) — portal do fornecedor (B2B).
  - `JWT_CLIENTE_SECRET` (7 dias) — conta de cliente final (Compra Fácil).
  Se um destes segredos faltar, a autenticação correspondente **falha** — não há
  fallback para outro segredo.
- Guards por rota: `JwtAuthGuard`, `PermissoesGuard` (`@Permissao(...)`),
  `ModuloAccessGuard` (`@ModuloNecessario(...)`), `RolesGuard`. Rota pública exige
  `@Public()` explícito.
- Erros de base de dados traduzidos pelo `PrismaExcecaoFilter` global — base
  inalcançável dá **503 + `Retry-After`**, não 500 (o Neon acorda em alguns
  segundos).
- Segregação de funções (`src/shared/segregacao-funcoes.ts`) e auditoria
  (`AuditLog`) nos fluxos de dinheiro e stock.

---

## 9. Ferramentas de desenvolvimento

| Ferramenta | Uso |
|---|---|
| graphify (`graphifyy[sql]`, CLI local) | Grafo de conhecimento do código (AST via tree-sitter) e do SQL de migrações — ponto de partida para "o que já existe" antes de planear |
| ESLint + Prettier (backend) / oxlint (frontend) | Lint e formatação |
| Jest + ts-jest (backend) / Vitest (frontend) | Testes unitários e de integração |
| Playwright-core (frontend, dependência presente) | Testes de browser — confirmar existência de suite activa |
| `scripts/libertar-porto.mjs` (ambos) | Liberta a porta fixa do projecto antes de arrancar; só mata processos do próprio projecto |
