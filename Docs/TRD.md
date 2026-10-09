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
| Mapas | leaflet + react-leaflet + @types/leaflet | ^1.9.4 / ^5.0.0 | escolha de morada e localização da loja; só em `src/shared/ui/mapa/MapaEntrega.tsx`, carregado com `React.lazy` (chunk à parte, ~159 kB). Tiles do OpenStreetMap. **GPS** (`shared/utils/geolocalizacao.ts`, `obterMelhorPosicao`): ouve `watchPosition` até ~15 s e guarda a posição de menor erro (a primeira costuma vir do Wi-Fi/IP, com centenas de metros de erro); só existe em contexto seguro (HTTPS/`localhost`), fora dele o botão esconde-se. O mapa remede-se com `ResizeObserver` (`invalidateSize`) — dentro de modais os tiles ficavam deslocados. O enquadramento do círculo de precisão usa `limitesDoCirculo` (`shared/utils/geo.ts`), **não** `L.circle().getBounds()` (precisa do círculo num mapa e rebentava). `BarreiraDoMapa` contém uma falha do mapa sem derrubar a página. `NomeDoLocal` mostra o nome do sítio (Nominatim) e avisa se cair fora de Moçambique. `avaliarPrecisao` (`geolocalizacao.ts`): ≤ 100 m boa, ≤ 1 km fraca (usa-se com aviso), **> 1 km inutilizável (não se usa)**. `PesquisaDeLocal` procura por nome, só quando a pessoa pede (1 pedido/s) |
| Datas | date-fns | ^4.4.0 | |
| Tradução (i18n) | i18next + react-i18next + i18next-browser-languagedetector | ^26.4.2 / ^17.0.15 / ^8.2.1 | português e inglês; ver «Multilínguas» abaixo |
| Utilitários CSS | clsx + tailwind-merge + class-variance-authority | — | |
| Lint | oxlint | ^1.71.0 | `npm run lint` |
| Testes | vitest | ^4.1.10 | `npm test` |
| E2E (dependência presente) | playwright-core | ^1.62.0 | driver headless; confirmar se há suite e2e activa antes de assumir cobertura |

**Porta de desenvolvimento:** `5273` (fixa, `strictPort`; libertada por
`scripts/libertar-porto.mjs` antes de arrancar).

**Multilínguas (frontend):** configuração em `src/i18n/index.ts`; textos em
`src/locales/<língua>/<namespace>.json` (um namespace por feature; `comum` vai no
bundle inicial, os outros carregam-se por `import()` quando um ecrã os pede). Chaves
tipadas contra o catálogo português (`src/i18n/tipos.d.ts`). Língua activa: a da sessão
(vem no login — a escolha da pessoa ou a da empresa) → a guardada no browser
(`localStorage.idioma`) → a do browser → português. Se a conta nunca gravou uma língua,
`adoptarIdiomaSeNuncaEscolhido()` grava-lhe no login a do browser (`useAuthStore`,
`useContaClienteStore`, `usePortalStore`) — sem isto, escolher inglês como visitante não
sobrevivia a outro aparelho ou sessão. Todas as instâncias do axios enviam
`Accept-Language` com a língua activa (`enviarLinguaActiva`). `formatMoeda`/`formatData`
seguem a língua (`pt-MZ` / `en-GB`; moeda sempre MZN). Selector: `SelectorIdioma`
(`src/shared/ui/`) no ERP, na loja (também na página inicial, que tem topo próprio), no
portal, no login e nas páginas públicas. Teste de paridade (`src/i18n/paridade.test.ts`)
falha se uma chave faltar numa das línguas.

Namespaces existentes (30): `comum`, `loja` (Compra Fácil), `auth` (login, recuperação e
redefinição de senha), `portal` e `mercado` (B2B), `site` (landing/login — substitui
`copywriting.ts`; lido com `useCopy()`, `src/shared/hooks/useCopy.ts`), `precos`
(`PrecosPage`/`TabelaDeCapacidades`; `precos.dados.ts` ficou só com números, booleanos e
códigos), `adesao` (pedido público e fila de gestão), e as 24 áreas do ERP/POS: `pos`,
`stock`, `armazens`, `transferencias`, `compras`, `conferencia`, `catalogo`, `crm`, `rh`,
`financeiro`, `fornecedores`, `b2b`, `produtos`, `lojas`, `empresas`, `utilizadores`,
`modulos`, `painel`, `historico`, `pesquisa`, `lojaGestao` (gestão do Compra Fácil no
ERP), `entrega` (zonas e configuração da entrega), `copiloto` (UI da Mayra) e `shell` (layout, guards, componentes genéricos de
`shared/ui/`). **Todos vão no bundle inicial**, juntos por `import.meta.glob`:
carregá-los sob pedido deixava o ecrã com as chaves cruas enquanto o ficheiro descarregava
(não há `Suspense`) — se o ERP (crescimento futuro) fizer o bundle crescer muito, revê-se
esta decisão. Os schemas do Zod constroem-se dentro do componente, com
`useMemo(() => criarSchema(t), [t])`. O botão «Continuar com a Google» recebe o `locale`
no `GoogleOAuthProvider` e aplica-o à carga da página (o script lê-o uma só vez).
`formatInteiro`/`formatMoedaInteira` (`formatMoeda.ts`) servem valores sem casas decimais
(preçário, contadores) sem recorrer a concatenação manual de "MT". O aviso do NUIT no
browser (`shared/utils/nuit.ts`, `diagnosticoDoNuit`/`diagnosticoDoNuitAoEscrever`)
devolve código + parâmetros, traduzidos pelo namespace `comum` (`nuit.*`) — as mesmas
chaves que o backend usa em `erros.b2b.nuit.*`, por isso o aviso é idêntico ao escrever e
ao submeter.

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
| Tradução (i18n) | nestjs-i18n | ^10.8.5 | mensagens do servidor em português e inglês; ver «Multilínguas» abaixo |
| Identificadores | uuid | ^14.0.1 | |
| Testes | jest + ts-jest + jest-mock-extended + supertest | ^30.x | `*.spec.ts`, `npm test` / `test:e2e` |
| Lint | eslint + typescript-eslint + prettier | ^9.x | `npm run lint` |
| Análise estática de código (dev) | ts-morph | ^28.0.0 | scripts internos, não faz parte do runtime |

**Porta de desenvolvimento:** `3100` (fixa; `scripts/libertar-porto.mjs`).
**Prefixo global da API:** `/api/v1`. **Node:** `>=20 <23`.

**Multilínguas (backend):** catálogo em `src/i18n/<língua>/*.json` (copiado para
`dist/src/i18n` pelo `nest-cli.json`), configuração em `src/shared/configuracao-i18n.ts`.
A língua de um pedido vem **só** do `Accept-Language` — o `nestjs-i18n` resolve-a num
middleware, antes do `JwtAuthGuard`. Sem pedido (e-mails, crons), `resolverIdioma`
(`src/shared/idiomas.ts`) sobre `User.idioma` / `ContaCliente.idioma` /
`UtilizadorFornecedor.idioma` (NULL = não escolheu) e `Empresa.idiomaPadrao`.
Mensagens do `ValidationPipe` traduzidas pela regra (`src/shared/traduzir-validacao.ts`;
as escritas à mão num DTO ficam). Erros com chave estável:
`throw new XException({ codigo, message, parametros })`, traduzido por
`TraduzirExcecaoFilter` (`erros.<codigo>`; sem `codigo`, o tratamento de sempre).
`traduzir(chave, textoPt)` para mensagens fora de excepções. Mensagens escritas à mão num
DTO traduzem-se com `mensagemTraduzida(chave, textoPt)` em `message` (o `class-validator`
chama a função ao validar, já dentro do pedido). Um teste (`codigos-de-erro.spec.ts`)
confirma que cada `codigo` e cada `mensagemTraduzida` usados no código existem nos dois
catálogos, e que todos os ficheiros de `src/i18n/` têm as mesmas chaves em `pt` e `en`.
**Notificações ao cliente** (`NotificarClientePedidoService`): recebem tipo + parâmetros
(`notificacoes.pedido.<tipo>`) e escrevem na língua do cliente — `ContaCliente.idioma`, depois
`Empresa.idiomaPadrao`, depois português —, porque quem as dispara é um funcionário. Rotas da preferência:
`PATCH /auth/eu/idioma`, `PATCH /commerce/conta/eu/idioma`, `idioma` no
`PATCH /portal-fornecedor/perfil`, `idiomaPadrao` no `PATCH /empresas/:id`; a língua
vem na resposta do login dos três tipos de conta. `PedidoAdesao.idioma` grava a língua do
browser no momento do pedido público (sem conta nem empresa, não há outra fonte); decide a
língua da confirmação, da recusa e das boas-vindas da empresa aprovada, mesmo que a
aprovação aconteça dias depois e por outra pessoa.

**`codigo` + catálogo cobre todos os módulos do backend** (não só `commerce`/`b2b`/`auth`
das fases iniciais): `compra`, `inventory`/`stock`, `armazem`, `crm`, `necessidade`
(incl. transferências entre lojas), `fornecedor`, `vendas`, `caixa`, `financeiro`,
`produto`, `users`, `hr`, `ponto`, `turno`, `perfil`, `modulo`, `empresa`, `contrato`,
`salario`, `categoria`, `cliente`, `loja`, e os guards/decorators partilhados (`jwt-auth`,
`permissoes`, `roles`, `modulo-access`, segregação de funções). `diagnosticoDoNuit()`
(`src/modules/fornecedor/domain/nuit.ts`) devolve `{ codigo, parametros }` em vez de uma
frase fixa, reaproveitado pelo registo do fornecedor e pelo pedido de adesão.

**Mayra multilíngue:** `idiomaDoUtilizadorPorId()` (`src/shared/idiomas.ts`) resolve a
língua de um utilizador autenticado pela mesma ordem de `resolverIdioma` — preferência →
empresa → língua do pedido em curso → português —, e é partilhada por quatro pontos:
o chat de texto e a voz da Mayra (`ai-copilot-prompt.service.ts`, que a acrescenta ao
prompt do sistema só quando é inglês, sem alterar o prompt em português), a recomendação
do painel de necessidades (`AnalisarNecessidadesMayraUseCase` — a língua entra na chave de
cache em memória, para duas pessoas da mesma loja em línguas diferentes não partilharem a
mesma análise) e a classificação de excepções de inventário
(`AnalisarExcecaoMayraUseCase`). A voz chega por WebSocket, sem `Accept-Language` da
aplicação — por isso lê sempre a preferência gravada na base de dados, nunca o cabeçalho.

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
    `PedidoItemSubstituicao`, `ReservaStock`, `ProdutoImagem` (galeria, até 6 por
    produto — `GerirImagensProdutoUseCase`), `FavoritoCliente`,
    `ComercioConfiguracao`, `Promocao` (desconto por produto/categoria com
    período — módulo `promocao`, `PrecoPromocionalService` aplica o desconto
    tanto no catálogo público como no checkout).
  - **Conta única e registo da procura online** (Fase 0 do plano §4.4, desde 09/10/2026; **ainda não lida pelo
    código** — a Fase 1 liga-a) — `ContaClienteEmpresa` (liga a conta de uma pessoa ao seu `Cliente` em cada
    empresa), `EnderecoCliente.contaClienteId` (a morada é da conta), `ProcuraOnlineEvento`
    (`procura_online_eventos`, enum `TipoProcuraOnline`): os factos da procura de toda a plataforma — pedido
    (`PEDIDO_CRIADO`) e produtos do pedido (`PEDIDO_ITEM`), mais os de navegação que a Fase 3 emite. É da
    plataforma e não do CRM de uma empresa (por isso não é `ClienteEvento`); **sem chaves estrangeiras** (é
    histórico); só guarda a célula de ~1 km (`latitude:longitude` a 2 casas) e bairro/cidade/província, nunca
    coordenadas exactas; `(chaveOrigem, tipo)` único para o *backfill* e a emissão serem idempotentes.
  - **Entrega ao domicílio** (modelo desde a Fase 22; **a Fase 23 passou a escrever em
    `EnderecoCliente`, `ZonaEntregaLoja`, `Pedido.tipoEntrega/enderecoId/taxaEntrega` e
    `ComercioConfiguracao`** — as restantes tabelas esperam as Fases 2 a 6) — `EnderecoCliente`, `ZonaEntregaLoja` (faixas de distância à
    loja, por haversine), `Estafeta` (identidade própria, não é um `User`; liga-se a várias
    lojas), `EntregaPedido` (guarda o destino **copiado** da morada), `EventoEntrega`,
    `AcertoEstafeta`, `WebhookSubscricao` (também a identidade do operador externo),
    `WebhookEnvio` (*outbox*), `WebhookEventoRecebido` (idempotência por
    `(operadorId, eventoExternoId)`); `Pedido.tipoEntrega/enderecoId/taxaEntrega`,
    `Venda.taxaEntrega`, `Loja.latitude/longitude`, `ComercioConfiguracao.entregaActiva` e
    afins. O enum chama-se `EstadoEntregaPedido` — `EstadoEntrega` é o das mensagens do CRM.
  - **Entrega ao domicílio — Fase 1 (cliente escolhe entrega).** Módulo `src/modules/entrega/`:
    `domain/` puro (`distancia-haversine.ts`, `calcular-taxa.ts`, `validar-faixas.ts`),
    zonas `GET/POST/PATCH /entregas/zonas` e configuração `GET/PATCH /entregas/configuracao`
    (ambos `GERIR_ZONAS_ENTREGA` + `ModuloAccessGuard('commerce')`; zonas não se apagam, desactivam-se),
    `CotarEntregaUseCase` e `DisponibilidadeEntregaService` (exportados). No `CommerceModule`:
    `GET/POST/PATCH/DELETE /commerce/enderecos` e `POST /commerce/entrega/cotacao`
    (`@ContaCliente()`). A taxa é por **distância em linha recta** em faixas `[min,max)` por loja;
    `CriarPedidoUseCase` recota no servidor antes da transacção e recusa com
    `commerce.pedido.entrega_indisponivel`; `Pedido.totalFinal = subtotal + taxaEntrega`.
    `ConfirmarLevantamentoUseCase` recusa pedidos de entrega; `ConferirPedidoUseCase` preserva a taxa.
    `TransitarEstadoPedidoUseCase` (confirmar / iniciar preparação) avança o estado com `updateMany`
    condicional ao estado esperado e verifica `count`: com dois operadores em simultâneo só um
    vence, o outro recebe `commerce.pedido.estado_inesperado` e não notifica o cliente.
    `GET /commerce/lojas` devolve `entregaDisponivel`; `CreateLojaDto/UpdateLojaDto` aceitam
    `latitude`/`longitude` (juntas). Erros novos em `erros.json` (`entrega.*`, `commerce.endereco.*`).
  - **Entrega ao domicílio — Fase 2A (despachar).** `EstadoPedido` ganha `EXPEDIDO`, `EM_ROTA` e
    `FALHADA` (migração `20261007100000`, só acrescenta). `ExpedirPedidoUseCase`
    (`POST /commerce/gestao/pedidos/:id/expedir`, `GERIR_PEDIDOS_COMMERCE`, exige caixa aberto na
    loja do pedido): `updateMany` condicional `PRONTO → EXPEDIDO`, reservas → `CONSUMIDA`,
    `EntregaPedido` (`AGUARDA_RECOLHA`, destino copiado da morada) + `EventoEntrega`, venda
    (`ProcessarVendaUseCase`, canal `ECOMMERCE`) e `RegistroFinanceiro` `RECEITA`/`PENDING` sem
    cliente; se a venda falhar, o despacho é revertido e o pedido volta a `PRONTO`. Método de
    pagamento `A_COBRAR_NA_ENTREGA` (texto em `PagamentoVenda.metodo`; só `ECOMMERCE`, isolado, sem
    troco; **fora do saldo do caixa e do fecho**, que só somam `NUMERARIO` —
    `numerarioLiquidoDaGaveta`) e `Venda.taxaEntrega` (a taxa soma-se ao total, fora do COGS e da
    margem; `opcoes.taxaEntrega` só se passa por dentro, nunca no DTO do POS).
    `pedido-estado.ts`: `lojaPodeCancelar`, `ESTADOS_EM_ENTREGA`/`estaEmEntrega`, `FALHADA` em
    `ESTADOS_PENDENTES`. Com a mercadoria na rua, `CancelarPedidoGestaoUseCase` recusa (400) e
    `AnularVendaUseCase` recusa (409, `venda.anular.pedido_em_entrega`). `fecho-pedido.ts`
    (`calcularItensFinais`, `recusarLojaDiferenteDaDoCaixa`) é partilhado com o levantamento.
    Notificação `pedido.expedido` (pt/en). Frontend: botão «Despachar» na gaveta do pedido, estados
    novos na fila e no detalhe do cliente («A caminho»). **Preço (Fase 31):** o cliente paga **preço + IVA**, como no POS, com a promoção
    aplicada antes do IVA. O pedido guarda o preço acordado (`PedidoItem.precoUnitario`, sem IVA e com
    promoção) e o total com IVA (`Pedido.totalFinal`; `Pedido.subtotal` é a base sem IVA). `totaisDoPedido`
    (`commerce/domain/totais-pedido.ts`) calcula-o com a mesma aritmética da venda — a venda do Compra Fácil
    usa o **preço acordado** (`ProcessarVendaUseCase`, `opcoes.precosAcordados`, só canal `ECOMMERCE`) e
    tolera meio cêntimo de ruído no valor pago. A conferência refaz o total com o IVA do produto que sai.
    O catálogo e os favoritos devolvem `precoComIva` / `precoOriginalComIva`; o carrinho soma-os.
  - **Entrega ao domicílio — Fase 2B (operar).** Estafetas: `GET/POST/PATCH /entregas/estafetas` e
    `POST /entregas/estafetas/:id/repor-senha` (`GERIR_ESTAFETAS`). O servidor gera o código `E####`
    (`gerarCodigo('E')`, único, com tratamento de colisões) e a senha inicial (`gerarSenhaInicial`);
    guarda só o hash `bcrypt` (`BCRYPT_ROUNDS`) e **envia o código e a senha por e-mail ao estafeta**
    (`MailerService.sendWelcomeEstafetaEmail` + `EmailTemplates.getWelcomeEstafetaTemplate`, pt/en pela língua
    da empresa; o SMTP é o que já envia os restantes e-mails, sem variáveis novas) — a senha **nunca** vai na
    resposta da API: esta traz `emailEnviado` (`false` se o SMTP falhar; o estafeta fica criado e «repor senha»
    reenvia). `email` é obrigatório no DTO; repor senha sem e-mail registado dá 400
    `entrega.estafeta.sem_email`. Nunca se devolve o hash (`select` explícito). Telefone único por empresa; desactivar com entregas em curso dá 409. Operação:
    `OperarEntregaService` (`atribuir`, `recolher`, `iniciarRota`, `entregar`, `falhar`) —
    `PATCH /entregas/:id/{atribuir,recolher,iniciar-rota,entregar,falhar}` (`GERIR_ENTREGAS`); cada uma é
    uma transacção com `updateMany` condicional ao estado da entrega **e** do pedido, `count` verificado
    e um `EventoEntrega` imutável (autor `FUNCIONARIO`/`ESTAFETA`); as transições estão em
    `entrega/domain/entrega-estado.ts` (`falhar` vale de qualquer estado antes de `ENTREGUE`; `EM_ROTA`
    pode ser saltado). `entregar` grava método (`NUMERARIO`/`MPESA`/`EMOLA`), referência (obrigatória fora
    do numerário) e `cobradoEm`; não mexe no caixa (acerto na Fase 3). Painel: `GET /entregas` (filtros por
    estado, loja, estafeta e data; por omissão só o que está por fazer) e `GET /entregas/:id` (com os
    eventos), `VER_ENTREGAS`. `POST /entregas/:id/devolver` (`DevolverEntregaUseCase`): anula a venda por
    `AnularVendaUseCase` e, numa transacção, `FALHADA → DEVOLVIDA` + conta a receber `CANCELLED`;
    repetível. `AnularVendaUseCase` aceita sessão de caixa fechada só para venda de entrega **sem
    numerário**; `anularVendaTransacional` reverte o pedido também em `FALHADA`. Notificação
    `pedido.entrega_falhada` (pt/en). Frontend: páginas `/entregas` (painel por colunas, consulta de 30 s) e
    `/entregas/estafetas`.
  - **Entrega ao domicílio — Fase 3 (as contas batem).** `EntregaPedido.valorCobrado` (anulável;
    `NULL` = o previsto, `valorACobrar`). `entregar` aceita `valorCobrado` (≥ 0), regista a
    diferença no evento e **não bloqueia**; com M-Pesa/e-Mola a conta a receber da venda passa a
    `PAID` na mesma transacção. Acerto: `GET /entregas/acertos/pendentes` (por estafeta, maior valor
    primeiro), `GET /entregas/acertos` (histórico, 50) e `POST /entregas/acertos`
    (`GERIR_ACERTOS_ESTAFETA`) → `AcertarContasEstafetaUseCase`: numa transacção cria o
    `AcertoEstafeta`, **reclama** as entregas (`updateMany … acertoId: null`, `count` conferido — dois
    acertos em simultâneo dão 409), cria o `MovimentoCaixa(REFORCO)` com o valor **entregue** na sessão
    aberta de quem recebe (`caixa/domain/movimento-caixa.ts`: `deltaDoMovimento`, partilhado com o
    caixa) e passa as contas a receber a `PAID`. Só entram entregas `ENTREGUE`, `NUMERARIO` e sem
    acerto (`entrega/domain/acerto.ts`). Sem sessão aberta: 409. A diferença regista-se
    (`COM_DIFERENCA`) e não bloqueia. Segregação `ENTREGA_MARCAR_ACERTAR` (`EXCEPCAO_AUTORIZADA`):
    marca no evento de auditoria. Frontend: `/entregas/acertos`.
    **Audit Log:** `AuditoriaEntregaService` regista no Histórico, depois de a transacção confirmar,
    cada transição da entrega (`EntregaPedido`, com antes/depois), o despacho (`Pedido`), a devolução
    e as alterações à configuração (`ComercioConfiguracao`) — porque `updateMany` e `upsert` não passam
    pela auditoria automática do `PrismaService`. `EventoEntrega` está nos modelos ignorados dessa
    auditoria automática.
  - **IA/Copiloto** — `CopilotSession`, `CopilotMessage`.
- **Migrações:** versionadas em `prisma/migrations/<timestamp>_<nome>/`, aplicadas
  no arranque do contentor (`prisma migrate deploy`, via `Dockerfile`). Nunca à
  mão em produção. **O histórico não se reaplica do zero** (a
  `20260730125000_plano02_empresa_id_obrigatorio` falha numa base vazia): não há
  *shadow database* que sirva, `prisma migrate dev` e `migrate diff --from-migrations`
  não funcionam. O SQL de uma migração nova gera-se com `prisma migrate diff
  --from-schema-datamodel <schema do main> --to-schema-datamodel prisma/schema.prisma
  --script` (sem base de dados), e acrescentam-se à mão o que o Prisma não declara
  (índices únicos parciais, permissões). Ensaia-se num branch do Neon reposto a
  partir do principal.

---

## 5. IA — Assistente "Mayra"

- **SDK:** `@google/genai`, módulo `ai-copilot`.
- **Modelo de texto:** `GEMINI_MODEL` (configurável por variável de ambiente; em
  produção `gemini-3.8-flash` desde 28/09/2026, antes `gemini-3.1-flash-lite`), com
  *function calling* sobre tools internas (ex. `get_warehouse_stock`,
  `get_my_daily_sales`, `list_supplier_products`, `receive_goods`) — todas com
  escopo por `empresaId`. Centralizado em `src/shared/gemini-model.ts`
  (`modeloGeminiPadrao`); sem a variável, a aplicação **recusa-se a arrancar**
  (`validarModeloGeminiNoArranque()`, chamado em `main.ts` antes de `app.listen`) —
  troca um 404 tardio e sem relação óbvia com a causa por um erro claro no deploy.
  Já não recai sobre `gemini-2.0-flash` (retirado da API) em nenhum dos 8 pontos de
  chamada.
- **Resiliência:** as chamadas de texto passam por `comRetryGemini`
  (`src/shared/gemini-retry.ts`) — até duas repetições (500 ms, 2 s) quando o
  Gemini devolve 503 por sobrecarga. Outros erros (chave inválida, modelo
  inexistente) não se repetem.
- **Ciclo de ferramentas (chat de texto):** `AiCopilotService.chat` executa **todas**
  as ferramentas que o modelo pede numa resposta (o Gemini pede várias de uma vez
  em perguntas amplas) e volta a chamá-lo com os resultados, até ele responder em
  texto — no máximo 4 voltas (`MAXIMO_VOLTAS_FERRAMENTAS`); a última vai sem
  ferramentas, para obrigar a resposta. Cada resposta leva o `id` do pedido a que
  corresponde. Um erro de uma ferramenta vai ao modelo como `{ erro }`, sem cortar
  as outras; uma acção de escrita (HITL) pára o ciclo e pede confirmação ao
  utilizador. Uma resposta sem texto fica registada nos logs com o
  `finishReason` e mostra `PROMPTS.NO_DATA`. Perguntas amplas demoram 8–12 s.
  Desde 28/09/2026; antes só a primeira ferramenta era executada.
- **Voz em tempo real:** `GEMINI_LIVE_MODEL` (Live API, `bidiGenerateContent`),
  entregue ao frontend via WebSocket (`socket.io`). O browser envia o microfone em
  PCM 16 kHz de forma contínua (evento `audio_input`) e recebe a voz em PCM 24 kHz
  (`audio_chunk`), tocada pelo `PCMPlayer` (`src/shared/utils/pcm-player.ts`) num
  `AudioContext` próprio. A Mayra conta como "a falar" desde o primeiro bloco até o
  Gemini terminar o turno **e** o player esvaziar a fila; nesse intervalo, som
  contínuo no microfone (`escuta.ts`: RMS > 0,08 em 2 blocos seguidos) interrompe-a.
  Se o Chrome não deixar arrancar o `AudioContext` (som do site bloqueado), o áudio é
  descartado sem erro — o player deixa um aviso na consola. Cada turno de voz reenvia
  as instruções da Mayra: ~24 mil tokens por turno, ~21 mil deles de texto.
- **Persistência de sessão:** `CopilotSession` / `CopilotMessage` no Postgres.
  `CopilotMessage.toolCall` (JSON) guarda a **lista** das ferramentas chamadas numa
  resposta (`name`, `args`, `response`), usada para reconstruir o histórico enviado
  ao Gemini nos turnos seguintes; as mensagens anteriores a 28/09/2026 têm um só
  objecto e continuam a ser lidas.
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
| **OpenStreetMap (tiles)** | Mapa das moradas e da localização da loja (Leaflet) | Gratuito, com política de uso (uso moderado, atribuição «© OpenStreetMap contributors» visível); tráfego sério pede servidor de tiles próprio ou pago | Sem chave. URL num só sítio: `URL_TILES` em `MapaEntrega.tsx`. Se falhar, o mapa fica cinzento e a morada não se consegue marcar |
| **OpenStreetMap — Nominatim (geocodificação inversa e pesquisa)** | O nome do local a partir das coordenadas (rua, bairro, cidade) e a pesquisa de um local por nome (`/search`, só `countrycodes=mz`), para conferir e escolher a localização da loja e das moradas | Gratuito, com política de uso: **no máximo 1 pedido por segundo**, uso moderado; tráfego sério pede servidor próprio ou pago | Sem chave. URL em `shared/utils/nomeDoLocal.ts`. As coordenadas marcadas são enviadas ao servidor do OSM. Debounce de 800 ms e cache por ponto; se falhar, o ecrã diz que não obteve o nome e não bloqueia nada |
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
- **Fuso horário:** `TZ = "Africa/Maputo"` no `[env]` do `fly.toml` (desde
  29/09/2026; antes a máquina corria em UTC). O código que usa a hora local do
  processo — o ponto monta o início do turno com `setHours` — e os `@Cron` diários
  seguem este fuso: inadimplência 00:00, segmentos do CRM 01:00, documentos B2B
  03:00, hora de Maputo. Os testes do backend correm no mesmo fuso
  (`test/definir-fuso-horario.js`, `globalSetup` do Jest), porque o GitHub Actions
  corre em UTC. As datas `@db.Date` continuam guardadas à meia-noite UTC do dia
  local (`Date.UTC(ano, mês, dia)`). Um fuso por empresa ainda não existe.

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
  - `JWT_CLIENTE_SECRET` (7 dias) — conta de cliente final (Compra Fácil). A conta pertence a **uma** empresa: comprar numa loja
    de outra empresa (o catálogo público lista todas) dá 403 `commerce.conta_de_outra_empresa` no
    `POST /commerce/pedidos` e na cotação de entrega — não 404 nem 401 (o 401 faz o frontend largar a sessão).
  - `JWT_ESTAFETA_SECRET` — estafeta (entrega ao domicílio). Declarado no
    `.env.example` desde a Fase 22, mas **nada o lê ainda**: o `estafeta-token.ts` chega na
    Fase 4. Pôr nos `fly secrets` antes do deploy que o passe a ler.
  Se um destes segredos faltar, a autenticação correspondente **falha** — não há
  fallback para outro segredo.
- Guards por rota: `JwtAuthGuard`, `PermissoesGuard` (`@Permissao(...)`),
  `ModuloAccessGuard` (`@ModuloNecessario(...)`), `RolesGuard`. Rota pública exige
  `@Public()` explícito.
- **Permissões por perfil.** Tabela `permissoes` (`action` + `resource`, ex.
  `read`/`pedidos_commerce`) ligada a `perfis` por `perfil_permissoes`. O
  `PermissoesGuard` traduz o `@Permissao('VER_X')` do controller para
  `read`/`manage` sobre o recurso (comparação pela raiz de 5 letras); ADMIN e
  SUPER_ADMIN têm bypass. Os perfis de sistema (`Administrador`, `Gestor`,
  `Funcionário / Caixa`, `Armazenista`) são criados pelo `prisma/seed.ts`, que não
  corre em produção — uma permissão nova para eles liga-se **numa migração**, por
  nome, e também nas listas do seed (que apaga e recria as ligações dos perfis de
  sistema). Desde 29/09/2026, `Gestor` e `Funcionário / Caixa` têm `read` e
  `manage` sobre `pedidos_commerce` (fila de pedidos do Compra Fácil). Desde a
  Fase 22 há seis permissões da entrega (`commerce.entrega.ler/gerir`, `estafeta.gerir`,
  `acerto.gerir`, `zona_entrega.gerir`, `webhook.gerir`; e `commerce.procura.ler` — `VER_PROCURA_ONLINE`, `read` sobre
  `procura_online`, ligada ao `Gestor` pela migração `20261009100000`): `Gestor` tem `entregas`
  (ler e gerir), `estafetas` e `acertos_estafeta`; `Funcionário / Caixa` só `entregas` em
  leitura; `zonas_entrega` e `webhooks` só ADMIN. Desde a Fase 21, `promocao.ver/gerir`
  só para `Gestor`.
- **O perfil de cada utilizador:** o `perfilId` dele; sem perfil próprio, o perfil de
  sistema do **cargo** (`src/shared/perfil-por-cargo.ts`: `CASHIER` → «Funcionário /
  Caixa», `MANAGER` → «Gestor», `STOCK_KEEPER` → «Armazenista»; `USER` não tem). O
  ecrã de utilizadores só grava o cargo — não há ainda forma de atribuir um perfil
  próprio. As permissões carregam-se em `src/middlewares/permissoes-do-utilizador.ts`,
  usado pelo guard (autorizar) e pelo login (`user.permissions`, que o frontend usa
  para esconder o que o utilizador não pode fazer).
- **Perfis de sistema são comuns às empresas:** só o SUPER_ADMIN os altera
  (`AssignPermissionsUseCase`); o ADMIN de uma empresa recebe 403.
- **Cache de permissões:** Redis, 24 h por utilizador, chave
  `permissions:v<N>:<userId>` (`src/utils/redis.service.ts`). A versão sobe quando
  uma migração muda permissões de perfis em uso — sem isso, quem já tinha sessão só
  veria a mudança um dia depois. Editar um perfil no ERP invalida a cache dos seus
  utilizadores.
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
