# TRD — Technical Reference Document — CoreBusiness (antes SRG ControlCore)

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

**Nome do produto: CoreBusiness** (até 2026-10-23, «SRG ControlCore»). O nome
mudou só onde o utilizador o vê: interface (pt/en/zh, `MARCA.NOME` em `site.json`),
e-mails, Mayra e Swagger. Os identificadores técnicos continuam com «controlcore»
de propósito — a app Fly `srg-controlcore-api`, os cabeçalhos `X-ControlCore-*`
dos webhooks (§8), as audiências JWT `controlcore-*`, as chaves `controlcore.*`
do `localStorage` e o `userAgent` da auditoria. Mudá-los partiria, respectivamente,
o encaminhamento do Vercel e o CORS, a validação nos receptores de webhooks, as
sessões activas e as preferências guardadas; um rename só com plano de migração.

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
| PWA | vite-plugin-pwa | ^2.0.0 | **só a aplicação do estafeta** (`/estafeta`, desde a Fase 4B, 10/10/2026): *service worker* de âmbito `/estafeta/` sem *precache* e **sem guardar a API**; manifest em `public/estafeta.webmanifest`, ligado só nessas rotas (`features/estafeta-app/pwa.ts`) |
| PDF | jspdf + jspdf-autotable | ^4.2.1 / ^5.0.8 | geração de documentos no browser |
| Leitura de código de barras | @zxing/browser + @zxing/library | ^0.2.1 / 0.23.0 | usa a câmara do telemóvel (exige contexto seguro: `localhost` ou HTTPS) |
| Markdown | react-markdown + remark-gfm | ^10.1.0 / ^4.0.1 | respostas da Mayra |
| Login social | @react-oauth/google | ^0.13.5 | "Continuar com Google" no Compra Fácil (Google Identity Services) |
| Mapas | leaflet + react-leaflet + @types/leaflet | ^1.9.4 / ^5.0.0 | escolha de morada e localização da loja; só em `src/shared/ui/mapa/MapaEntrega.tsx`, carregado com `React.lazy` (chunk à parte, ~159 kB). Tiles do OpenStreetMap. **GPS** (`shared/utils/geolocalizacao.ts`, `obterMelhorPosicao`): ouve `watchPosition` até ~15 s e guarda a posição de menor erro (a primeira costuma vir do Wi-Fi/IP, com centenas de metros de erro); só existe em contexto seguro (HTTPS/`localhost`), fora dele o botão esconde-se. O mapa remede-se com `ResizeObserver` (`invalidateSize`) — dentro de modais os tiles ficavam deslocados. O enquadramento do círculo de precisão usa `limitesDoCirculo` (`shared/utils/geo.ts`), **não** `L.circle().getBounds()` (precisa do círculo num mapa e rebentava). `BarreiraDoMapa` contém uma falha do mapa sem derrubar a página. `NomeDoLocal` mostra o nome do sítio (Nominatim) e avisa se cair fora de Moçambique. `avaliarPrecisao` (`geolocalizacao.ts`): ≤ 100 m boa, ≤ 1 km fraca (usa-se com aviso), **> 1 km inutilizável (não se usa)**. `PesquisaDeLocal` procura por nome, só quando a pessoa pede (1 pedido/s) |
| Datas | date-fns | ^4.4.0 | |
| Tradução (i18n) | i18next + react-i18next + i18next-browser-languagedetector | ^26.4.2 / ^17.0.15 / ^8.2.1 | português, inglês e mandarim (`zh`); ver «Multilínguas» abaixo |
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
falha se uma chave faltar numa das línguas, se uma `{{variável}}` não coincidir com a do
português, ou se o mandarim tiver formas de plural que não usa (só `_other`; `_zero` vale).

**Mandarim (`zh`, Fase 62, 20/10/2026).** Chinês simplificado; um `zh-TW` do browser lê-se
em simplificado. O catálogo (`src/locales/zh/`) **não está no bundle inicial**: `src/i18n/zh.ts`
junta-o num chunk próprio (~241 KB, 87 KB comprimido) que `carregarIdioma('zh')` descarrega
uma só vez e `mudarIdioma()` espera antes de mudar a língua — por aí passam o selector e
`aplicarIdiomaGuardado`; `carregarIdiomaActivo()` faz o mesmo para o browser já em chinês,
antes do primeiro render (`main.tsx`). O português, sempre carregado, é o recurso final.
Locale `zh-CN` (`1,234.50`; datas `2026/04/03`), moeda `MT 1,234.50` (tabela
`FORMATO_DA_MOEDA` em `formatMoeda.ts`, que obriga a decidir em cada língua nova),
`<html lang="zh-CN">`, e tipos de letra do sistema (`PingFang SC`, `Microsoft YaHei`,
`Noto Sans SC`) no fim de `--font-sans` — não se descarrega nenhum tipo de letra chinês. A
voz da Mayra no browser (`features/ai-copilot/utils/idioma.ts`): `detectarIdioma` devolve
`zh-CN` por caracteres Han, `expandirParaFala` escreve as siglas (`MZN`) por extenso em cada
língua, e o reconhecimento do primeiro turno parte da língua da interface. A Google recebe
`zh-CN` no botão de entrar (`LojaPublicaLayout`).

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

### 2.x Compatibilidade entre browsers (Fase 48, 12/10/2026)

- **Alvo.** Safari iOS ≥ 16.4 sem ressalvas; iOS mais antigo abre a aplicação, mas a Mayra não formata respostas. Chrome/Android actual.
- **Regra de ouro:** nenhuma dependência pode pôr no *bundle* principal sintaxe que o Safari antigo não leia (o caso real: regex com *lookbehind* do `react-markdown`). O `MessageBubble` é `React.lazy`. Verificar depois de actualizar dependências: `grep -lF '(?<=' dist/assets/index-*.js` não deve devolver nada.
- **CSS só-iOS** em `src/app/index.css` sob `@supports (-webkit-touch-callout: none)` (campos a 16 px para evitar o zoom); `100dvh` sobre `min-h-screen`/`h-screen`.
- **PWA do estafeta** (`features/estafeta-app/pwa.ts`): `viewport-fit=cover` e `overscroll-behavior-y` só nas rotas `/estafeta`; instalação por `beforeinstallprompt` (Android) ou instruções (iOS, que não tem o evento).
- **Segundo plano.** O iOS suspende a página: `useCanalDeEntregas` religa o socket e `useEmitirPosicao` reinicia o `watchPosition` ao `visibilitychange`. Sem aplicação nativa, a posição pára com o ecrã bloqueado.
- **Fontes:** firt.dev (iOS PWA Compatibility), webkit.org (ITP: armazenamento limitado a 7 dias fora da PWA instalada), caniuse.com.

### 2.y Layout do POS e do menu (Fase 51, 13/10/2026)

- **POS:** em ≥ `lg` o carrinho é `fixed` de altura total à direita (420 px); `POSPage` regista-o em `useUIStore.carrinhoLateralActivo` e o `Header` (também `fixed`) encurta-se com `lg:right-[420px]`. O carrinho, sendo `fixed`, não herda a margem do conteúdo: aplica-se-lhe `classeMargemDaMayra` só quando `useBreakpoint('lg')`.
- **Comparação de fornecedores (Fase 55):** `features/compras/components/ComparacaoFornecedores.tsx` dentro do `CriarPedidoModal`; os cursores de pesos recalculam (com *debounce*) sem gravar e `useQuery` usa a chave das linhas + pesos. O seletor do modal lista todos os fornecedores (desactiva os que `podeComprarAoEstado` recusa).
- **Sino do cabeçalho (Fase 53):** um só `SinoDeNotificacoes`; os alertas de reposição entram pela prop `secaoExtra` e somam-se ao número. **Tabelas:** o `data` e as `columns` passados ao `useReactTable` têm de ter referência estável (nunca `data ?? []` nem dependências que mudem a cada render), senão o TanStack Table entra em ciclo de re-renders.
- **Menu lateral:** `app/layout/caminhoActivo.ts` escolhe o prefixo mais comprido, por segmentos, para acender uma só entrada.

### 2.z Vídeo no painel do login (Fase 59, 15/10/2026)

- **Asset:** `src/assets/videos/controlcore-lancamento.webm` — WebM/VP9, 1280×720, 15 s, sem áudio, 1,15 MB. Gerado do MP4 original com `ffmpeg -vf scale=1280:-2 -c:v libvpx-vp9 -b:v 0 -crf 32 -row-mt 1 -an`. Importado em `LoginPage.tsx` como URL pelo Vite (asset com *hash*; nenhuma dependência nova).
- **Comportamento:** `PainelDaMarca` renderiza `<video autoPlay loop muted playsInline>` com `object-fit: contain` (o vídeo é 16:9, o painel quase quadrado — `cover` cortava-o). Só é montado com `(min-width: 961px)`, o mesmo limite a partir do qual `site.css` mostra o painel, para não descarregar o ficheiro onde o painel está escondido; com `prefers-reduced-motion: reduce` não arranca sozinho.
- **Browsers:** WebM/VP9 corre em Chrome, Firefox, Edge e Safari 14.1+ (macOS) / iOS 17.4+. Em Safari/iOS mais antigos o `<video>` fica vazio sobre o gradiente do painel (degrada sem erro); não há *fallback* MP4.

## 3. Backend — `ControleCore_BackEnd`

| Categoria | Tecnologia | Versão (package.json) | Notas |
|---|---|---|---|
| Framework | @nestjs/* (common, core, config, event-emitter, jwt, mapped-types, passport, platform-express, platform-socket.io, schedule, swagger, throttler, websockets) | ^11.x | Nest 11 |
| Linguagem | TypeScript | ^5.7.3 | `tsc` é gate de CI |
| ORM | @prisma/client + prisma | ^6.19.3 | migrações versionadas em `prisma/migrations/` |
| Validação | class-validator + class-transformer | ^0.15.1 / ^0.5.1 | `ValidationPipe` global: `whitelist`, `forbidNonWhitelisted`, `transform` |
| Auth | passport + passport-jwt + bcrypt | — | JWT em cookies HttpOnly (`accessToken`/`refreshToken`), nunca `localStorage` |
| Multi-tenancy | nestjs-cls | ^6.2.1 | `AsyncLocalStorage` para `empresaId` por pedido |
| Segurança HTTP | helmet + @nestjs/throttler | — | cabeçalhos de segurança + limite de pedidos (`LimiteDePedidosGuard`, `APP_GUARD` desde a Fase 69, ver §8) |
| MFA | otplib + qrcode | ^12.0.1 / ^1.5.4 | TOTP do segundo passo e o QR para a aplicação de autenticação — ver §8.3 |
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
| Tradução (i18n) | nestjs-i18n | ^10.8.5 | mensagens do servidor em português, inglês e mandarim (`zh`); ver «Multilínguas» abaixo |
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
prompt do sistema quando a língua não é o português — `PREFERENCIA_DE_IDIOMA` é um `Record<Idioma, …>` —, sem alterar o prompt em português), a recomendação
do painel de necessidades (`AnalisarNecessidadesMayraUseCase` — a língua entra na chave de
cache em memória, para duas pessoas da mesma loja em línguas diferentes não partilharem a
mesma análise) e a classificação de excepções de inventário
(`AnalisarExcecaoMayraUseCase`). A voz chega por WebSocket, sem `Accept-Language` da
aplicação — por isso lê sempre a preferência gravada na base de dados, nunca o cabeçalho.

### 3.1 Saúde do stock — diagnóstico partilhado (Fase 46, 11/10/2026)

`GET /stock/saude` e `/stock/saude/produtos` calculam o diagnóstico da empresa inteira em memória (catálogo com stocks, `GROUP BY` de todas as vendas e recepções, lotes). `GetSaudeStockUseCase` guarda esse diagnóstico
**60 s** por empresa e por conjunto de limiares, e pedidos simultâneos partilham a mesma promessa (um só voo); uma falha não se guarda; teto de 50 entradas. A cache é **em memória do processo**: exacta com uma máquina Fly
(hoje), e por máquina se houver mais. Os dados podem ter até 60 s de atraso. Limite conhecido: `venda_itens` só tem índice por `empresaId`; com histórico muito grande, considerar agregados ou um índice por `vendaId`.

### 3.2f Transferências entre armazéns — pedido em massa (Fase 57, 13/10/2026)

- **Modelo.** `TransferenciaLoja` continua a ser **uma por produto**; um pedido em massa cria N com o mesmo `grupoId` (nulo nas de um só produto). `StockMovement.transferenciaId` (nulo; FK `SET NULL`) liga a saída (expedição) e a entrada (recepção) à transferência. A referência `TRF-XXXXXXXX` deriva-se do `grupoId ?? id` (`referenciaDaTransferencia`): não há contador.
- **API** (`/transferencias-loja`): `POST em-massa` (`TRANSFERIR_STOCK`, 1–100 linhas, **tudo ou nada**; um 400 `linhas_invalidas` traz `erros` no topo do corpo), `GET armazens/:armazemId/disponivel` (`VER_STOCK`; físico, reservado, **disponível** = físico − reservado, **cedível** = `quantidadeCedivel`, stock e trânsito no destino; paginado, `?pesquisa=`), `GET grupos/:grupoId`, `POST grupos/:grupoId/decidir|expedir|receber|cancelar` (linha a linha; só as linhas no estado certo; as falhadas vêm no resultado; um erro que não é recusa de negócio sobe). `GET /transferencias-loja` ganha `armazemId`, `produtoId`, `grupoId`, `desde`, `ate` (inclusive) e `pesquisa` por referência; o detalhe traz os movimentos.
- **Regras.** A origem e o destino são **armazéns activos da empresa**, diferentes (podem ser da mesma loja). A aprovação respeita o armazém de origem escolhido (revalida o cedível, DT01 §12) e reserva; a expedição usa o destino escolhido (senão o «principal» da loja). `RegisterMovementUseCase.execute(…, tx, { transferenciaId })`: a ligação vem do servidor, nunca do DTO público.
- **Frontend.** `NovaTransferenciaEmMassa` (cesto `domain/cesto.ts`), `DetalheDoPedidoEmMassa`, `TransferenciasPage` com filtros (`?pesquisa=` abre filtrada); o separador Movimentos do stock mostra «Transferência TRF-… → destino / ← origem».

### 3.2g Clientes online e pedidos (Fase 58, 13/10/2026)

- **Cópia no pedido.** `Pedido` guarda `clienteNome/Telefone/Email/Nuit`, `enderecoSnapshot` (JSON, `MoradaCopiada`) e `snapshotAproximado` (verdadeiro nos anteriores à cópia, preenchidos pelo *backfill* da migração a partir do cliente de hoje). `CriarPedidoUseCase` copia o que o `Cliente` tem **depois** de `obterOuCriar` (o que a pessoa não aceitou partilhar fica nulo); a morada procura-se por `{ id, empresaId }`.
- **CRM.** `GET /clientes?origem=ONLINE|BALCAO|AMBOS` (`ONLINE` inclui quem também compra ao balcão): *online* = conta, ligação por conta ou algum pedido; *balcão* = vendas sem pedido (`Venda.pedido` nulo). Cada cliente traz `origem` (`classificarOrigem`), `conta` (`emailVerificado`, `viaGoogle`, `ultimoAcessoEm`, `activa` — **nunca** o `googleId` nem o hash) e `comprasOnline` (pedidos não cancelados, total, último). `GET /clientes/:id/compras-online`: conta, resumo, até 50 pedidos e as moradas activas. Consultas agrupadas por página (sem N+1), sempre por `empresaId`.
- **Pedidos.** `GET /commerce/gestao/pedidos` devolve o cliente actual (e-mail, NUIT, conta, compras online) e a cópia do pedido; o ecrã mostra os dados actuais e destaca o que ficou registado quando difere (`diferencasDaCopia`).

### 3.2e Utilizadores técnicos (Fase 56, 13/10/2026)

`Role.SYSTEM_COMMERCE` é uma conta técnica (uma por empresa) que assina os movimentos de stock do Compra Fácil quando não há funcionário. Não é uma pessoa: `shared/utilizadores-tecnicos.ts` define `ROLES_TECNICOS` e o filtro `SO_PESSOAS` (`role: { notIn: ROLES_TECNICOS }`), aplicado à lista do RH e ao número de activos do *turnover* (`HrService`), à lista de utilizadores (`PrismaUserRepository.findAll`, Super Admin incluído) e à lista de colaboradores que a Mayra lê. **Regra:** qualquer consulta que liste ou conte *pessoas* deve usar `SO_PESSOAS`.

### 3.2d Compras — comparação de fornecedores (Fase 55, 13/10/2026)

- **Cálculo** (`compra/domain/comparar-fornecedores.ts`, puro): cinco critérios — preço total do pedido, pontualidade, prazo real, cumprimento, dias de crédito — normalizados 0–100 **entre os candidatos** e combinados por média ponderada (pesos por omissão 40/20/15/15/10). Só se **classificam** os fornecedores que se podem comprar (`permiteComprar`: `ACTIVO`/`PREFERENCIAL`), cobrem **todas** as linhas e cotam em **MZN**; os outros aparecem com a razão, sem posição. Critério sem dado **não vale zero**: sai da média do fornecedor e os pesos reponderam-se (marca `DADOS_INSUFICIENTES`). O preço compara-se por **unidade base** (`custoCompra` por unidade do fornecedor ÷ `factorConversao`), com a quantidade ajustada ao MOQ/múltiplo (`ajustarQuantidade`). Crédito nulo = zero dias. Empate: preferencial, depois o mais barato.
- **Dados lidos:** `Fornecedor` (estado, `diasCredito`), `ProdutoFornecedor` com `estadoMapeamento = APROVADO` (preço vigente de `PrecoFornecedor`, senão a projecção `custoCompra`; MOQ, múltiplo) e o desempenho de `GetFornecedorAnaliseUseCase` (só para quem conta). Tudo escopado por `empresaId`; um produto de outra empresa dá 400.
- **API** (`GERIR_COMPRAS`): `POST /compras/comparacao-fornecedores` (`{ linhas, pesos? }`, 1–50 linhas), `GET/PUT /compras/comparacao-fornecedores/criterios` (padrão da empresa na tabela `compras_criterios_comparacao`; sem registo valem os por omissão). Só leitura, excepto o `PUT`. Códigos `compra.comparacao.*`.
- **Sem IA e sem serviço externo.** Sem variáveis novas. Limitação: sem câmbio, preços noutra moeda não se comparam.

### 3.2c Stock — reservas (Fase 53, 13/10/2026)

`GET /stock/reservas` (`VER_STOCK`): lista as `ReservaStock` da empresa (reservas dos pedidos do Compra Fácil), mais recentes primeiro, **tecto de 200**, com filtro `?estado=ACTIVA|CONSUMIDA|LIBERTADA|EXPIRADA` (400 `stock.reserva.estado_invalido` se outro). Só leitura. `LIBERTADA` é o nome do ecrã para `CANCELADA` no esquema (`domain/reservas-listagem.ts`). A rota está declarada **antes** de `@Get(':id')`, senão o Nest resolve-a como um id. Criar, libertar, caducar à mão, quarentena e bloqueio ainda não existem no servidor.

### 3.2b Lojas — criação (Fase 52, 13/10/2026)

`POST /lojas`: o gestor (`gestorId`, opcional) liga-se pela relação `gestor: { connect: { id, empresaId } }` e não pelo campo solto — o Prisma não aceita, no mesmo `create`, `empresa: { connect }` e uma chave estrangeira escalar. O `empresaId` no `connect` garante que só se liga um utilizador da própria empresa.

### 3.2a Caixas — criação (Fase 51, 13/10/2026)

`POST /caixas/gestao/:lojaId` recebe só `{ nome }`: a loja vem do caminho (validada como UUID e escopada por empresa no caso de uso). O `CreateCaixaDto` já não tem `lojaId`; como o `ValidationPipe` global usa `forbidNonWhitelisted`, um cliente que o envie no corpo passa a receber 400.

### 3.2 Estafetas da plataforma — onboarding e atribuição por proximidade (Fase 50, 12/10/2026)

- **Modelo.** `Estafeta.empresaId` é opcional: nulo = estafeta **da plataforma**; preenchido = frota própria (`ComercioConfiguracao.frotaEntrega` = `PROPRIA`|`PLATAFORMA`). Documentos em `EstafetaDocumento` (BI, carta, documento e foto do veículo, rosto) com as imagens em `EstafetaDocumentoImagem` (`onDelete: Restrict`; uma imagem substituída fica com `substituidaEm` — **nada se apaga**). Ofertas em `OfertaEntrega`. Índices únicos parciais (SQL na migração `20261012180000`) garantem uma oferta pendente por entrega e por estafeta e uma imagem vigente por documento/lado.
- **Multi-tenancy.** Excepção deliberada: o estafeta da plataforma não tem `empresaId`; a posse é o `estafetaId` e a empresa de cada entrega lê-se da própria entrega. Os documentos de um estafeta da plataforma só o Super Admin os vê (`/plataforma/estafetas`); a empresa vê os da sua frota.
- **Registo e onboarding.** `POST /estafeta/registo` (público, `@Throttle` 5/h, convite opcional → frota própria), `/estafeta/onboarding/*` (estado, imagens, ler, confirmar, concluir, contacto de emergência). `@Estafeta()` = porta aberta (conta, notificações, `socket-token`); `@EstafetaOperacional()` = só com onboarding completo (403 `entrega.estafeta.onboarding_incompleto`). Estafetas anteriores têm o onboarding dado como completo.
- **Imagens.** Carregadas uma vez (`multipart`, ≤ 8 MB), `sharp` → WebP com orientação EXIF (mín. 600 px nos documentos), chave `estafetas/<estafetaId>/<tipo>/<uuid>.webp` no armazenamento S3 existente. O frontend comprime antes (canvas, 1600 px, JPEG 0,8). Leitura de gestão por URL assinado de **5 min**; cada visualização é auditada **sem o conteúdo**; os documentos ficam fora do registo automático de auditoria.
- **IA.** `ExtrairDocumentoEstafetaService` lê a imagem **guardada** com o Gemini (modelo centralizado, `comRetryGemini`), uma chamada por face, juntando os resultados; **a IA só sugere** — o estafeta confirma e a validação (`validarConfirmacao`, todos os campos obrigatórios, documento não expirado) é do servidor. Limite de **10 leituras/hora** por estafeta (contador atómico em janela). Falha da IA nunca bloqueia: preenche-se à mão.
- **Procura.** `ProcurarEstafetaService.avancar` corre numa tarefa `@Interval(7000)` (`ProcuraDeEstafetaTask`, **só se `FROTA_PLATAFORMA_ACTIVA=true`**) e ao expedir (`ExpedirPedidoUseCase`) para empresas em `PLATAFORMA`. Raio `min(25 km, 2 km + 1 km × ⌊t/7 s⌋)`; candidato = online, activo, sem entrega, com posição; ordena por distância (Haversine) à **loja**, depois menos recusas recentes, depois id. Oferta de **30 s**, uma de cada vez; aceitar é atómico dentro de `OperarEntregaService.atribuirPorProcura` (autor `SISTEMA`). A procura não desiste; aos **10 min** a gestão recebe `entrega.sem_estafeta` uma vez. Eventos `oferta.nova`/`oferta.encerrada` no canal `/entregas`, sala `estafeta_<id>`.
- **Online.** `POST /estafeta/online|offline`; o estafeta da plataforma partilha a posição para ser escolhido (consentimento próprio), apagada ao sair se não estiver em rota. A posição mostrada ao cliente continua a ser só durante a rota.
- **Permissão.** `commerce.documento_estafeta.ler` (`documentos_estafeta`/`read`): só o ADMIN a tem por omissão (bypass). `/plataforma/estafetas` usa `@Roles(SUPER_ADMIN)`.
- **Variável de ambiente.** `FROTA_PLATAFORMA_ACTIVA` (`.env.example`; por omissão falso): abre a frota da plataforma às empresas e liga a tarefa. Sem ela, escolher `PLATAFORMA` dá 400 e a tarefa não corre. **Só deve ligar-se quando o pagamento online (plano §4.10) existir** — o B13 (taxa retida e carteira do estafeta) está adiado por não haver chave de API de um operador.
- **Sem serviço novo de terceiros:** usa Gemini (§5) e o armazenamento S3 já existentes. Limitação: as ofertas só chegam com a aplicação aberta (*push*, plano §4.8, por fazer).
- **Frontend.** `features/estafeta-app`: `RegistoEstafetaPage` (público, `/estafeta/registo`), `OnboardingPage` (assistente por passos, `/estafeta/onboarding`), `InterruptorOnline`, `OfertaDeEntrega`; um só *socket* para posição e ofertas (`useEmitirPosicao`/`useOfertas`). Gestão em `features/entrega-gestao` (`ConviteEstafetas`, `DocumentosDoEstafeta`, `SeletorDeFrota`, `EstafetasDaPlataformaPage` — separador só do Super Admin em `/e-commerce`).

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
  - **Conta única e registo da procura online** (plano §4.4; o esquema desde 09/10/2026 — a conta única é lida desde a Fase 1 e o registo da
    procura desde a Fase 3, 10/10/2026) — `ContaClienteEmpresa` (liga a conta de uma pessoa ao seu `Cliente` em cada
    empresa), `EnderecoCliente.contaClienteId` (a morada é da conta), `ProcuraOnlineEvento`
    (`procura_online_eventos`, enum `TipoProcuraOnline`): os factos da procura de toda a plataforma — pedido
    (`PEDIDO_CRIADO`) e produtos do pedido (`PEDIDO_ITEM`), mais os de navegação que a Fase 3 emite. É da
    plataforma e não do CRM de uma empresa (por isso não é `ClienteEvento`); **sem chaves estrangeiras** (é
    histórico); só guarda a célula de ~1 km (`latitude:longitude` a 2 casas) e bairro/cidade/província, nunca
    coordenadas exactas; `(chaveOrigem, tipo)` único para o *backfill* e a emissão serem idempotentes.
    **Módulo `procura`** (`src/modules/procura/`, desde a Fase 3): `RegistarProcuraService` ouve `procura.pedido_criado` (emitido por
    `CriarPedidoUseCase` depois da transacção) e grava `PEDIDO_CRIADO` + `PEDIDO_ITEM` com o destino copiado — não bloqueia nem desfaz o pedido;
    `SincronizarProcuraTask` (`@Cron` de 10 em 10 minutos, SQL idempotente sobre os últimos 7 dias) deriva do estado dos pedidos o
    desfecho (`PEDIDO_CONCLUIDO`/`PEDIDO_CANCELADO`) e regista o que o ouvinte não apanhou. `POST /commerce/telemetria` (`@Public()`, 204, 60/min
    por IP, lote ≤ 20, tipos de navegação em lista fechada) grava a navegação **anónima** (`sessaoId`, sem conta nem geografia), com a
    empresa e a categoria deduzidas da loja e do produto na base de dados. `ProcuraOnlineEvento` está em `ignoredModels` da auditoria.
    **Painéis (Fase 4, 10/10/2026):** `GET /procura-online` (`VER_PROCURA_ONLINE` + módulo `commerce`, **sempre** por `empresaId` do token) e
    `GET /relatorios/procura-online/sistema` (`SUPER_ADMIN_ONLY`, entre empresas, com quebra por empresa) — `ConsultarProcuraUseCase` agrega com
    `GROUP BY` parametrizado sobre `procura_online_eventos` (horas e dias na hora de Maputo); mostram bairro/cidade e contagens, nunca coordenadas.
    No frontend, `features/procura-online` (separadores `procura` e `procura_sistema` do ecrã `/e-commerce`; as rotas `/procura` e `/procura/sistema` redireccionam; gráficos `recharts`, namespace i18n `procura`).
    **Variáveis:** `TELEMETRIA_PROCURA_ACTIVA` (backend) e `VITE_TELEMETRIA_PROCURA` (frontend, no build) — só o valor `true` liga; **ambas desligadas por
    omissão** até haver validação legal da recolha; os pedidos são sempre registados.
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
    `pedido.entrega_falhada` (pt/en). Frontend: separadores `entregas` (painel por colunas, consulta de 30 s) e
    `estafetas` do ecrã `/e-commerce` (as rotas `/entregas` e `/entregas/estafetas` redireccionam; Fase 49).
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
    marca no evento de auditoria. Frontend: separador `acertos` do `/e-commerce`.
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
  `finishReason` e mostra `PROMPTS.NO_DATA`. Desde 28/09/2026; antes só a primeira
  ferramenta era executada. **Desde 17/10/2026** as ferramentas pedidas na mesma volta
  correm em paralelo (`Promise.all`), o título da conversa nova é gerado em paralelo
  com a resposta (e não antes dela), idioma e histórico lêem-se em paralelo, e
  `MAYRA_THINKING_LEVEL` (`MINIMAL|LOW|MEDIUM|HIGH`, opcional) limita o raciocínio do
  modelo — `nivelDePensamentoGemini` em `gemini-model.ts`.
- **Progresso e resposta em stream (texto):** `POST /copilot/chat/stream` devolve
  Server-Sent Events — `progresso` `{fase, area?}`, `texto` `{pedaco}`,
  `texto_reiniciar` (o texto já enviado afinal precedia um pedido de ferramenta) e `fim`
  `{reply, sessionId}` (o mesmo corpo que `/copilot/chat`, incluindo o cartão HITL).
  `AiCopilotService.chat` recebe `OpcoesChat` (`onProgresso`, `onTexto`,
  `onTextoDescartado`); com `onTexto` usa `generateContentStream`. O servidor envia só
  **códigos** — fase e área (`domain/progresso.ts`: `areaDaFerramenta`, 60 ferramentas →
  `stock`, `vendas`, `financas`, `clientes`, `equipa`, `compras`, `mercado`, `auditoria`,
  `empresa`) — nunca o nome da ferramenta, os argumentos ou os dados; as frases estão em
  `locales/*/copiloto.json` (`progresso.*`). O cliente vai **directo ao Fly**
  (`VITE_SOCKET_URL`) porque os *rewrites* da Vercel guardam a resposta toda: pede um
  token a `/copilot/voice-token` e envia-o em `Authorization: Bearer`, que o
  `JwtStrategy` aceita depois do cookie. Se o stream falhar antes de chegar um evento, o
  frontend recorre a `/copilot/chat`.
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
  **A fala é só o áudio.** Com `responseModalities: ['AUDIO']` as partes de texto que o
  Gemini envia são o seu raciocínio interno (citam personas e ferramentas): o cliente
  `GeminiLiveClientService` ignora-as, o gateway não emite `text_chunk` no modo nativo e o
  frontend só aceita `text_chunk` no modo de recurso (ElevenLabs / Web Speech). O prompt
  de voz não leva as tags `[PERSONA: X]` (`prepareVoiceContext` troca-as por «Conhecimento
  de domínio — X») e a persona de voz proíbe nomear personas, áreas internas e
  ferramentas. O gateway emite `progresso` `{fase, area}` (o mesmo vocabulário do chat)
  em vez de `tool_executing`/`tool_executed`; o ecrã de voz mostra-os com
  `MayraPensando` em formato de cartão.
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
| **OpenStreetMap — Nominatim (geocodificação inversa e pesquisa)** | O nome do local a partir das coordenadas (rua, bairro, cidade) e a pesquisa de um local por nome (`/search`, só `countrycodes=mz`), para conferir e escolher a localização da loja e das moradas | Gratuito, com política de uso: **no máximo 1 pedido por segundo**, uso moderado; tráfego sério pede servidor próprio ou pago | Sem chave. URL em `shared/utils/nomeDoLocal.ts`. As coordenadas marcadas são enviadas ao servidor do OSM. Debounce de 800 ms e cache por ponto; se falhar, o ecrã diz que não obteve o nome e não bloqueia nada. Na cidade de Maputo o serviço não devolve `state`: a província deduz-se do código `ISO3166-2-lvl4` (tabela em `nomeDoLocal.ts`). Comparado com Google Geocoding e OpenRouteService em 10 pontos de Maputo (11/10/2026): melhor cobertura de rua/bairro |
| **OpenRouteService** (Fase 43, 5C) | Rota por estrada e tempo estimado da entrega em rota, só para o cliente (`POST /v2/directions/driving-car/geojson`, chamado **só pelo backend**, com tempo-limite de 4 s). O resultado fica em Redis um minuto, por entrega e por célula de ~110 m. As coordenadas do estafeta e da morada são enviadas ao serviço | Plano gratuito com chave; **cota e termos por confirmar antes de produção** | `ORS_API_KEY` (**opcional**: sem ela não há tempo estimado, o rastreio funciona na mesma), `ORS_BASE_URL` (opcional, servidor próprio). Interface `ServicoRotas` — trocável |
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
- **Canal `/entregas` (rastreio ao vivo, Fase 42, 11/10/2026):** namespace socket.io próprio (`EntregasGateway`; a raiz `EventsGateway` fica intacta). A ligação usa um token de socket de
  15 min pedido por REST (`GET /entregas/socket-token`, `GET /commerce/conta/socket-token`, `GET /estafeta/socket-token`), assinado com um segredo **derivado** de
  `JWT_ACCESS_SECRET` / `JWT_CLIENTE_SECRET` / `JWT_ESTAFETA_SECRET` (`HMAC(segredo, 'entregas-socket:<tipo>')`) e audience `controlcore-entregas-socket`; o cookie não é lido. Salas:
  `empresa_<id>` (funcionário), `estafeta_<id>`, `pedido_<id>` (cliente, só após `seguir` com verificação de posse). Eventos: `posicao` (estafeta→servidor), `seguir`
  (cliente), `entrega.posicao` e `entrega.estado` (servidor→salas; o cliente nunca recebe o id do estafeta). A posição só é aceite com uma entrega `EM_ROTA` e é validada no servidor
  (dentro de Moçambique, precisão ≤ 100 m, ≥ 2 s entre pontos, ≤ 150 km/h); guarda-se **só a última** (`Estafeta.ultima*`), apagada quando o estafeta deixa de ter entregas em rota.
  `GET /commerce/pedidos/:id/entrega` dá ao cliente o estado, a linha do tempo e, com menos de 2 min, a posição. **Limite:** as salas estão em memória — com mais de uma máquina Fly seria
  preciso o adaptador Redis do socket.io. Sem variável de ambiente nova na 5A.
  **Ecrãs (Fase 43):** `useCanalDeEntregas` (`shared/hooks`) liga a `<VITE_SOCKET_URL>/entregas` com o token pedido por REST **a cada reconexão** (o token vale 15 min); sem canal os ecrãs
  caem para a consulta da entrega de 2,5 em 2,5 s (o cliente) e dizem-no. O estafeta partilha a posição com `navigator.geolocation.watchPosition` (só com uma entrega `EM_ROTA` e depois de consentir; envio a cada ≥ 2,5 s **e** ≥ 5 m, ou
  10 s parado) e *Wake Lock*; **limitação de uma PWA:** com o ecrã bloqueado ou a aplicação em segundo plano o navegador pára o GPS. A geolocalização exige HTTPS ou `localhost`. O rasto do cliente vive
  só em memória (≤ 300 pontos). Regras puras em `shared/utils/rastreio.ts`.
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
  - `JWT_CLIENTE_SECRET` (7 dias) — conta de cliente final (Compra Fácil). A conta é **da pessoa e vale em qualquer loja** (desde 09/10/2026,
    plano §4.4): o token leva só `sub` (a `ContaCliente`) e o e-mail — a empresa de cada pedido deduz-se da **loja**, nunca do
    token (os tokens antigos, com `empresaId`, continuam válidos e o campo é ignorado). O `Cliente` de CRM de cada empresa nasce na
    **primeira compra** nela, depois de a pessoa aceitar a partilha de nome, telefone e e-mail (`aceitaPartilhaDados` em
    `POST /commerce/pedidos`; 409 `commerce.partilha_dados_necessaria`; `GET /commerce/conta/partilha/:lojaId` diz se é preciso) —
    `ClienteDaEmpresaService`. Entrar procura o e-mail/telefone em **todas** as empresas (contas repetidas: vale a usada mais
    recentemente); registar recusa um e-mail com conta em qualquer empresa. Moradas, «os meus pedidos» e cancelar filtram pela
    **conta**; favoritos ficam no `Cliente` de origem e `GET /commerce/favoritos?lojaId=` filtra pela empresa da loja (a página de favoritos de uma loja mostra o que se compra nela). `ContaCliente.empresaId/clienteId` são a empresa e o `Cliente` **de origem**.
  - `JWT_ESTAFETA_SECRET` — estafeta (entrega ao domicílio, **lido desde a Fase 4A, 10/10/2026**): `estafeta-token.ts`, audience
    `controlcore-estafeta`, cookie `tokenEstafeta`, **12 h** (`JWT_ESTAFETA_EXPIRES_IN`, sem renovação). O `EstafetaGuard` confirma na base de dados, a cada pedido,
    que o estafeta existe e está activo; a empresa vem da BD. Entra-se no ecrã único (`POST /auth/entrar`, 3.º ramo) com o código `E####`. Sem o segredo (ou com
    menos de 16 caracteres) **entrar como estafeta falha** — o resto do sistema não. Pôr nos `fly secrets` antes do deploy.
  Se um destes segredos faltar, a autenticação correspondente **falha** — não há
  fallback para outro segredo.
- Guards por rota: `JwtAuthGuard`, `PermissoesGuard` (`@Permissao(...)`),
  `ModuloAccessGuard` (`@ModuloNecessario(...)`), `RolesGuard` (obrigatório nas rotas da plataforma, ver §8.3). Rota pública exige
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
- **Limite de pedidos (Fase 69).** `LimiteDePedidosGuard` (o `ThrottlerGuard`) como `APP_GUARD`, contado pelo IP real do cliente (`src/shared/ip-do-cliente.ts`): o primeiro endereço do `X-Forwarded-For` — o REST chega pela Vercel, que o escreve —, senão `Fly-Client-IP`, senão `req.ip`. Por omissão 300 pedidos/min por cliente; `@Throttle` próprio no `/auth/login` e `/auth/entrar` (20/min), `/auth/mfa/*` (10/min), `/auth/forgot-password` (5/15 min), `/auth/reset-password` (10/15 min) e nas rotas públicas (adesão e registos 5/h, catálogo 60/min…); `@SkipThrottle` no `/health`. Contagem em memória, por máquina. O `X-Forwarded-For` é falsificável por quem fala directamente com o Fly — por isso o login tem também **bloqueio por conta**: 10 falhas seguidas (senha ou código do MFA, o mesmo contador `tentativasLoginFalhadas`) → `bloqueadoAte` +15 min, 429 `auth.conta_bloqueada`; volta a zero só quando a sessão sai (`emitirSessao`). O IP da auditoria (`cls ipAddress`) é o mesmo `ipDoCliente`.
- Erros de base de dados traduzidos pelo `PrismaExcecaoFilter` global — base
  inalcançável dá **503 + `Retry-After`**, não 500 (o Neon acorda em alguns
  segundos).
- Segregação de funções (`src/shared/segregacao-funcoes.ts`) e auditoria
  (`AuditLog`) nos fluxos de dinheiro e stock.

### 8.1 Webhooks da entrega (Fase 45, 11/10/2026)

- **Saída (*outbox*).** `EmitirWebhookService.registar(tx, …)` grava uma linha de `webhook_envios` por subscrição **activa** da empresa que escute o evento, **na transacção** de quem muda o estado
  (`OperarEntregaService`, `DevolverEntregaUseCase`, `CriarPedidoUseCase`, `ExpedirPedidoUseCase`). Eventos: `pedido.criado`, `pedido.expedido`, `entrega.atribuida`, `.recolhida`, `.em_rota`, `.entregue`,
  `.falhada`, `.devolvida`. Corpo: `{ id, evento, versao: 1, criadoEm, empresaId, dados }`, sem dados pessoais.
- **Envio.** `EnviarWebhooksTask` (`@Cron` a cada minuto) reserva cada linha por `updateMany` condicional (reserva de 2 min) e faz `POST` com `X-ControlCore-Evento`, `X-ControlCore-Id` (idempotência do receptor) e
  `X-ControlCore-Assinatura: t=<segundos>,v1=HMAC-SHA256(segredo, "<t>.<corpo cru>")`. Tempo-limite 10 s; **sem redirecções**; resposta guardada só até 500 caracteres. Recuo 1 min · 5 · 15 · 60 · 6 h · 24 h;
  à 7.ª falha `DESISTIDO`. Limpeza às 4 h: enviados > 30 dias, desistidos > 90.
- **SSRF.** URL https, sem credenciais, nome que não resolva para loopback/rede privada/*link-local*/CGNAT/multicast (incluindo `169.254.169.254` e IPv6 mapeado); verificado ao gravar, antes de enviar e **no `lookup` do
  socket** (contra *DNS rebinding*); IP literal privado recusado antes de ligar. `WEBHOOKS_PERMITIR_REDE_PRIVADA=true` (**só desenvolvimento**) levanta estas restrições.
- **Entrada.** `POST /webhooks/entrega/:operadorId` (`@Public()`, `@Throttle` 120/min): exige `rawBody` (ligado em `main.ts`), assinatura com `timingSafeEqual`, janela de ±5 min, idempotência por
  `WebhookEventoRecebido(operadorId, eventoExternoId)` único; `202` antes de aplicar. Eventos aceites: `entrega.recolhida`, `.em_rota`, `.entregue`, `.falhada`, aplicados por `OperarEntregaService` com autor
  `OPERADOR` (só entregas com `operadorId` igual ao dele). A empresa vem da subscrição. Desconhecido/desactivado/assinatura errada → o mesmo 401.
- **Gestão.** `/webhooks/subscricoes` e `/webhooks/envios` (`GERIR_WEBHOOKS`, só ADMIN); segredo (`whsec_` + 32 bytes) em claro na BD porque é preciso para assinar, devolvido **uma só vez**; máximo 20 por
  empresa. `PATCH /entregas/:id/delegar` e `GET /entregas/operadores` (`GERIR_ENTREGAS`).
- **Frontend.** O ecrã `/entregas/webhooks` e o «Delegar» do painel foram **retirados** (Fase 47): o servidor dos webhooks está **adormecido** — sem subscrições não grava nem envia nada, e as rotas `/webhooks/*` continuam protegidas (`GERIR_WEBHOOKS`, só ADMIN; a de entrada, por assinatura). Reactivá-lo é voltar a pôr um ecrã.
- **Limites conhecidos.** O limitador e a reserva são por máquina/BD (a reserva é atómica na BD, por isso duas máquinas são seguras); um receptor lento ocupa até 10 s de um dos 5 envios em simultâneo de um ciclo.

### 8.2 Notificações dentro da aplicação (Fase 47, 12/10/2026)

- **Dados.** Tabela `notificacoes` (`destinatarioTipo` `FUNCIONARIO`|`ESTAFETA`|`CLIENTE`, `destinatarioId`, `tipo`, `parametros` JSON, `pedidoId?`, `entregaId?`, `lojaId?`, `lidaEm?`); índice por `(destinatarioTipo, destinatarioId, lidaEm, createdAt)`; `entregas_pedido.chegouEm`. O destinatário **cliente** é a `ContaCliente` (a conta vale em qualquer empresa). Guarda o **tipo e os parâmetros, nunca a frase**: o frontend traduz (`locales/<língua>/notificacoes.json`, por destinatário).
- **Quem lê.** `GET /notificacoes` (funcionário), `GET /commerce/conta/notificacoes` (cliente), `GET /estafeta/notificacoes` (estafeta), cada um com `/contagem`, `PATCH /lidas` e `PATCH /:id/lida`. O destinatário sai **sempre** do token e está na condição de cada consulta (`updateMany` com destinatário): ninguém lê nem marca as de outro. Sem `@Permissao` no funcionário: cada pessoa lê as suas.
- **Quem cria.** `AvisosDaAplicacaoService` (a tabela «quem é avisado de quê»): o `NotificarClientePedidoService` (cliente, o mesmo caminho do e-mail, mais «em preparação»), um ouvinte do evento interno `entrega.estado_mudou` (passos da rota, gestão, estafeta), `entrega.chegou` e `procura.pedido_criado`. A gestão escolhe-se **por permissão** com `satisfazPermissao` + `carregarPermissoesDoUtilizador`. Melhor esforço: uma falha regista-se e **nunca** desfaz a transição.
- **Tempo real.** `NotificacaoService` anuncia `notificacao.criada`; o `EntregasGateway` empurra `notificacao.nova` para a sala pessoal do destinatário — `conta_<id>`, `utilizador_<id>`, `estafeta_<id>` — **deduzida do token**. O token de socket do funcionário tem a marca `entregas` só quando vem de `GET /entregas/socket-token` (`VER_ENTREGAS`); o pessoal (`GET /notificacoes/socket-token`) não a tem e só liga à sala pessoal.
- **«Cheguei».** `PATCH /estafeta/entregas/:id/cheguei` → `OperarEntregaService.chegar`: condicional (`EM_ROTA`, `chegouEm IS NULL`, posse do estafeta), idempotente, sem mudar o estado.
- **Retenção.** `LimparNotificacoesTask` às 5 h: lidas > 30 dias, não lidas > 90.
- **Limites.** Só com a aplicação aberta (PWA fechada não recebe): *push* do navegador fica para uma fase própria. A `Notificacao` está fora da auditoria automática (ruído).

### 8.3 Super Admins e autoridade da plataforma (Fases 64 a 68, 26–27/10/2026)

- **Autoridade da plataforma (Fase 65).** Toda a rota cuja autoridade é da plataforma usa `RolesGuard` + `@Roles(SUPER_ADMIN)` — o `PermissoesGuard` dá bypass ao ADMIN e nunca é guarda suficiente para estas. Hoje: `/adesoes` (decisão), `/super-admins`, `/plataforma/estafetas`, `GET /empresas`, `GET /empresas/:id`, `PATCH /empresas/:id/status`, `DELETE /empresas/:id`, `POST /empresas/onboarding`, a escrita de `/modulos`, `/relatorios/dashboard/sistema` e `/relatorios/procura-online/sistema`. `src/middlewares/autoridade-da-plataforma.spec.ts` falha se uma delas perder o `@Roles` ou o `RolesGuard`.
- **Rotas de empresa partilhadas.** `PATCH /empresas/:id` e `/:id/branding`: Super Admin em qualquer empresa, ADMIN só na sua (`garantirAcessoAEmpresa`, `src/shared/acesso-empresa.ts`); `isActive` só pelo Super Admin.
- **Roles reservados.** `SUPER_ADMIN` e os roles técnicos só são atribuídos por um Super Admin, e só ele muda o `empresaId` de um utilizador (`garantirAlteracaoDeUtilizadorPermitida`, `src/shared/roles-reservados.ts`, em `CreateUserUseCase` e `UpdateUserUseCase`).
- **Rotas.** `GET /super-admins` (lista: `id`, `code`, `name`, `email`, `isActive`, `createdAt`) e `POST /super-admins` (`{ name, email }`). `SuperAdminsController` no módulo `users`, com `RolesGuard` + `@Roles(SUPER_ADMIN)`: o `PermissoesGuard` sozinho deixaria passar o ADMIN de qualquer empresa (bypass). `@Permissao('GERIR_SUPER_ADMINS')` fica declarada para um futuro role de operador.
- **Criação.** `CriarSuperAdminUseCase`: e-mail normalizado (minúsculas) e único; código `SA###` a continuar a série a partir de **todos** os códigos começados por `SA` (o `code` é único na tabela inteira); senha de 12 caracteres `base64url` (72 bits); `role: SUPER_ADMIN`, sem `empresaId`. Funções puras em `src/shared/super-admin.ts` (`proximoCodigoSuperAdmin`, `gerarSenhaSuperAdmin`). Duas criações simultâneas com o mesmo código: a segunda bate no `@unique` e dá 409.
- **Entrega das credenciais.** E-mail de boas-vindas (`sendWelcomeEmail`, empresa «CoreBusiness»). A resposta traz `senhaInicial` **uma vez** e `emailEnviado`; uma falha de SMTP regista-se e não desfaz a conta. O frontend (`features/dashboard`: `SuperAdminsCard`, `NovoSuperAdminDialog`) mostra-as num diálogo que só fecha por acção de quem criou.
- **MFA (Fase 66).** Obrigatório para o Super Admin; para os outros, só com `mfaActivo`. Interruptor geral `MFA_ACTIVO` (`false`/`0` desliga para todos; em falta, ligado). `MFA_CHAVE_CIFRA` (32 bytes base64) dá por HKDF a chave AES-256-GCM do segredo TOTP (`users.mfaSegredoEncriptado`, formato `v1:iv:tag:texto`) e a chave que assina o desafio. Fluxo: senha certa → `{ mfa: { etapa: CONFIGURAR | PEDIR_CODIGO, desafio } }` sem cookies (`/auth/login` e `/auth/entrar`) → `POST /auth/mfa/configurar` (QR + segredo; reaproveita um pendente) → `POST /auth/mfa/verificar` (emite a sessão; liga o MFA na primeira vez; o LOGIN só se audita aqui). O desafio (5 min, audiência `corebusiness-desafio-mfa`) não é aceite pelo `JwtStrategy` porque não conhece a chave. Janela TOTP ±30 s. 5 códigos errados → `bloqueadoAte` = +15 min (429). Ligado e sem chave → 503 `auth.mfa.indisponivel`. Trocar a chave invalida todos os segredos: repor com `npm run super-admin:repor-mfa -- --codigo SA### --aplicar`.
- **Gestão das contas (Fase 66).** `PATCH /super-admins/:id/estado` (`{ activo, motivo }`, no `UserStatusLog`), `POST /super-admins/:id/repor-senha` (senha nova por e-mail e uma vez na resposta) e `POST /super-admins/:id/repor-mfa`. Nunca sobre a própria conta (403); nunca deixa a plataforma sem Super Admin activo (409), com `SELECT … FOR UPDATE` sobre as linhas dos activos. `PATCH /users/:id/status` filtra pela empresa de quem pede e recusa Super Admins.
- **Assinaturas (Fase 67).** Módulo `assinatura`, `@Roles(SUPER_ADMIN)`. A assinatura «actual» de uma empresa é a mais recente não cancelada (ou, não havendo, a mais recente). `GET /plataforma/empresas/:id/assinatura` → `{ empresa, assinatura, fimDoAcesso, situacao }`; `PATCH` (motivo obrigatório; `modulos` substitui a lista; sem `valorTotal`, a soma dos `precoAcordado`; `SUSPENSA` grava `suspensaEm`/`motivoSuspensao`); `POST …/pagamentos` (`Pagamento` `PAGO` com `dataVencimento` = fim anterior; estende `dataFim` um ciclo a partir de `max(fim, hoje)` — `TRIAL` conta de `trialAte ?? dataFim` —, repõe `ATIVA` de `TRIAL`/`EM_ATRASO`/`EXPIRADA`/`EM_RENOVACAO`; cancelada → 409; data futura → 400). `GET /plataforma/assinaturas/relatorio-expiracao`: por empresa, a assinatura `ATIVA`/`TRIAL` que acaba mais tarde; `fimDoAcesso` = `TRIAL` → `trialAte ?? dataFim`, `ATIVA` → `dataFim` + `diasToleranciaPagamento`. O `ModuloAccessGuard` decide pelo estado (`ESTADOS_COM_ACESSO`); as datas mudam o estado pela expiração automática (Fase 68). Alterações e pagamentos com `SELECT … FOR UPDATE` e auditados por `audit.plataforma.event`, com o `empresaId` da empresa.
- **Expiração automática (Fase 68).** Interruptor `EXPIRACAO_ASSINATURAS_ACTIVA` — **desligado por omissão** (só `true`/`1`): desligado, a tarefa não transita nem avisa, o pedido não consulta assinaturas e os gateways não recusam ninguém. Estados com acesso (`src/shared/acesso-assinatura.ts`): `TRIAL`, `ATIVA`, `EM_ATRASO`, `EM_RENOVACAO`; uma empresa fica **bloqueada** quando nenhuma assinatura dá acesso e alguma está `EXPIRADA`, `SUSPENSA` ou `CANCELADA` (sem assinatura nenhuma, não). `ExpirarAssinaturasTask` (`@Cron` 02:30, `TZ` de Maputo): `TRIAL` com `trialAte ?? dataFim` + `diasToleranciaPagamento` passados → `EXPIRADA`; `ATIVA`/`EM_RENOVACAO` com `dataFim` passada → `EM_ATRASO`, e com a tolerância também passada → `SUSPENSA` (`motivoSuspensao` automático); `EM_ATRASO` → `SUSPENSA`. Cada transição é um `updateMany` condicionado ao estado lido — várias máquinas correm o mesmo cron sem repetir. Aviso por e-mail aos ADMIN activos 7 dias antes do fim do período, uma vez por fim (`assinaturas.avisoExpiracaoPara`, marcado antes do envio). **Bloqueio total:** o `JwtStrategy` põe `assinaturaBloqueada` no utilizador e o `JwtAuthGuard` responde 403 `auth.guard.assinatura_bloqueada` em todas as rotas autenticadas (POS incluído), salvo `@PermitidoComAssinaturaBloqueada()` — `GET /auth/eu`, `PATCH /auth/eu/idioma`, `POST /auth/logout`, `GET /assinatura/minha`. Os gateways `EventsGateway`, `EntregasGateway` (funcionários) e `AiCopilotVoiceGateway` recusam a ligação de uma empresa bloqueada e cortam as abertas no evento `assinatura.bloqueio_mudou`, emitido por `NotificarBloqueioService` só nas transições (que também envia «acesso suspenso» ou «acesso reactivado»). `GET /assinatura/minha` (qualquer funcionário): `aviso` `NENHUM`/`FIM_PROXIMO`/`TOLERANCIA`/`BLOQUEADA`, `dias`, `fimDoPeriodo` — o frontend mostra a faixa (`features/assinatura`) e, bloqueada, o ecrã «Acesso suspenso». Prazo de graça: `npm run assinaturas:periodo-graca -- --dias 30 [--aplicar]` (`trialAte` ou `dataFim` = hoje + dias para as vencidas, auditado, e-mail aos ADMIN). O relatório de expiração devolve `expiracaoActiva`.
- **Sem painel.** `npm run super-admin:criar -- --email <e-mail> --nome "<nome>" [--aplicar]` (`scripts/criar-super-admin.ts`) cria contra o `DATABASE_URL` e imprime as credenciais no terminal; simula sem `--aplicar` e recusa um e-mail que já exista (promover uma conta de empresa decide-se à mão).
---

## 9. Ferramentas de desenvolvimento

| Ferramenta | Uso |
|---|---|
| graphify (`graphifyy[sql]`, CLI local) | Grafo de conhecimento do código (AST via tree-sitter) e do SQL de migrações — ponto de partida para "o que já existe" antes de planear |
| ESLint + Prettier (backend) / oxlint (frontend) | Lint e formatação |
| Jest + ts-jest (backend) / Vitest (frontend) | Testes unitários e de integração |
| Playwright-core (frontend, dependência presente) | Testes de browser — confirmar existência de suite activa |
| `scripts/libertar-porto.mjs` (ambos) | Liberta a porta fixa do projecto antes de arrancar; só mata processos do próprio projecto |
