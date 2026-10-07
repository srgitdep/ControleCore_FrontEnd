# Plano de Implementação — SRG ControlCore (Front-End + Back-End, unificado)

> Documento único, replicado tal e qual nos dois repositórios
> (`ControleCore_BackEnd/Docs/plano_implementacao.md` e
> `ControleCore_FrontEnd/Docs/plano_implementacao.md`). Não é uma cópia resumida —
> é o mesmo ficheiro nos dois sítios. Ao actualizar, actualizar as duas cópias no
> mesmo commit/PR de cada lado.

## Como usar este documento

- **A Secção 2 é histórico.** Descreve o que já está implementado e em produção,
  reconstruído a partir dos *merges* de cada repositório (não de cada commit
  individual — um merge é a unidade de entrega). Não se edita o histórico depois de
  escrito, salvo para corrigir um erro factual.
- **A Secção 3 é o backlog.** Lista o que falta fazer, em checklist. Cada item novo
  entra com `- [ ]`. Quando implementado, muda para `- [x]` **e** ganha uma entrada
  correspondente na Secção 2 (data, repositório, autor, branch, o que foi feito),
  no mesmo commit que fecha a funcionalidade — a mesma disciplina que a Secção 8 do
  `CLAUDE.md` pede para os planos de feature.
- **A Secção 4 são os planos das funcionalidades por fazer**, completos, uma
  subsecção por funcionalidade. Não há ficheiros de plano separados — um plano novo
  entra aqui, e o seu resumo em checklist na Secção 3.
- **Cada fase tem um plano próprio enquanto dura** — na secção «Fase em curso», logo
  abaixo. Ao começar uma fase, escreve-se lá o plano detalhado dela (tarefas,
  ficheiros, como verificar). Cada tarefa concluída passa a `- [x]`. Ao terminar a
  fase, no mesmo commit: o item da fase na Secção 3 passa a `- [x]`, entra a entrada
  na Secção 2, e **o plano da fase é apagado** da «Fase em curso». O que foi feito
  fica na Secção 2 e no git; o plano da fase só servia para a executar.
- Fonte de verdade para "o que já existe": `git log --merges` dos dois
  repositórios. Este documento é a leitura human-friendly desse histórico; se
  divergirem, o `git log` é que manda — corrigir aqui.
- Para a stack técnica, APIs e serviços de terceiros (pagos ou não), ver
  [`TRD.md`](./TRD.md). Este documento não repete essa informação.

---

## Fase em curso

> Plano detalhado da fase que está a ser implementada. Só existe enquanto a fase
> dura: ao terminar, apaga-se daqui no mesmo commit que regista a entrega na
> Secção 2 e marca o item na Secção 3.

Nenhuma fase em curso.

---

## 1. Arquitectura em duas linhas

SaaS ERP/POS multi-empresa para Moçambique. Frontend React 19 + Vite na Vercel,
backend NestJS 11 + Prisma 6 no Fly.io (Frankfurt), base de dados PostgreSQL Neon
serverless (`eu-central-1`) + Redis. Dois repositórios git separados
(`ControleCore_FrontEnd`, `ControleCore_BackEnd`), deploy independente, backend
sempre primeiro. Detalhe completo em [`TRD.md`](./TRD.md).

---

## 2. Histórico de entregas

Cada entrada é um *merge* para `main` (ou para a branch de integração `dev`, quando
aplicável). `[BE]` = `ControleCore_BackEnd`, `[FE]` = `ControleCore_FrontEnd`. A
data e o autor são os do commit de merge; os pontos por baixo são os commits que
esse merge trouxe.

### Fase 0 — Fundação (1–2 Jul 2026)

- **2026-07-01 · [BE] · Tony M** — `Merge branch 'main' of .../SRGControleCore`
  - refactor(config): altera a estrutura de pastas do projecto
- **2026-07-02 · [BE] · srgitdep** — PR #3, `ModuloLojasArmazens`
  - feat(lojas): implementar módulo de lojas e armazéns

### Fase 1 — Estabilização de Stock/POS/Compras e RH (7–13 Ago 2026)

- **2026-08-07 · [BE] · Antonio Mambo** — `correcções gerais — recuperação de senha
  e reconciliação schema/BD`
  - fix(prisma): reconciliar schema com a base de dados multi-tenant
  - feat(auth): recuperação de senha com verificações e envio de credenciais
- **2026-08-07 · [BE] · Antonio Mambo** — `correcções Stock/POS — 6 fases de
  análise e correcção`
  - feat(pos): anulação de venda, auditoria de stock e tools MCP por loja
  - feat(pos): recálculo de saldos históricos e série de facturação por loja
  - fix(stock): resolver `/stock/movements` capturado pela rota `:id`
  - feat(pos): expor stock por armazém na listagem de produtos
  - fix(pos): reverificar stock na transacção e explicitar armazém de venda
  - fix(pos): corrigir fecho de caixa, descontos e numeração de facturas
- **2026-08-07 · [BE] · Antonio Mambo** — `correcções Compras/Armazém — 3 fases de
  análise e correcção`
  - fix(compras): impedir duplicação de stock em recepções concorrentes
  - fix(armazem): gravar tipo do armazém, garantir ponto de venda único e auditar
  - fix(compras): corrigir custo médio ponderado e validações de recepção
- **2026-08-07 · [FE] · Antonio Mambo** — `correcções Stock/POS no frontend`
  - test(pos): instalar Vitest e cobrir a lógica do carrinho
  - feat(pos): carrinho consciente de stock e invalidação de cache entre módulos
  - fix(pos): enviar descontos ao backend e usar o store como fonte do total
- **2026-08-11 · [BE] · Antonio Mambo** — `correcções de RH — Ponto e Salário`
  - fix(rh): relógio de ponto estava inoperacional por guard e por fuso horário
  - feat(rh): cálculo salarial com divisores reais e ausências justificadas
  - fix(rh): processar salário deixa de falhar e recibos ficam isolados por empresa
- **2026-08-11 · [BE] · Antonio Mambo** — `correcções de Catálogo e Auditoria`
  - fix(catalogo): validar categoria e preço; endurecer tools de catálogo
  - fix(catalogo): proteger categoria com produtos e validar registo de auditoria
  - fix(catalogo): impedir que apagar um produto destrua stock e histórico
- **2026-08-11 · [BE] · Antonio Mambo** — `Financeiro/CRM e P2 de Compras/Armazém`
  - fix(mayra): validar empresa e parâmetros nas tools de finanças e CRM
  - feat(compras): prazo de pagamento ao fornecedor indicado na recepção
  - fix(financeiro): reverter conta a pagar na anulação de recepção e validar
    lançamentos
  - feat(financeiro): venda a crédito gera conta a receber; excluir anuladas do
    caixa
  - fix(permissoes): reconciliar nomenclaturas no guard de permissões
  - fix(mayra): pesquisa por nome tolerante a hífenes, maiúsculas e acentos
  - feat(compras): anulação de recepção, tool MCP `receive_goods` e gestão de
    armazéns
  - docs: guia de testes manuais e script de reposição do ambiente
- **2026-08-11 · [FE] · Antonio Mambo** — `páginas de Fornecedores e Armazéns, e
  selector de tipo de armazém`
  - feat(ui): página de Fornecedores própria e secção de Armazéns no menu
  - fix(lojas): permitir escolher o tipo de armazém e corrigir a desactivação
- **2026-08-13 · [BE] · Antonio Mambo** — `reduzir latência — menos idas à base de
  dados e cache de leituras`
  - perf: reduzir idas à base de dados e cachear leituras estáveis
- **2026-08-13 · [FE] · Antonio Mambo** — `interface para anular vendas e
  recepções, e processar salários`

### Fase 2 — Primeiro deploy em produção: Render → Fly.io, Vercel (13 Ago 2026)

- **2026-08-13 · [BE] · Antonio Mambo** — `preparar deploy em Render e Vercel`
  - fix(deploy): corrigir três bloqueadores do deploy em Render e Vercel
- **2026-08-13 · [BE] · Antonio Mambo** — `corrigir build do Render`
  - fix(deploy): instalar `devDependencies` no build do Render
  - docs: explicar porque o build do Render precisa de `--include=dev`
- **2026-08-13 · [BE] · Antonio Mambo** — `normalizar origens de CORS`
  - fix(cors): normalizar origens e registar recusas
- **2026-08-13 · [BE] · Antonio Mambo** — `corrigir recuperação de senha que
  deixava a conta sem acesso`
  - fix(auth): não trocar a senha antes de o e-mail sair
- **2026-08-13 · [BE] · Antonio Mambo** — `reorganizar navegação, sugestão de
  compras e tools da Mayra`
  - fix(mayra): fechar falha de isolamento na criação de pedidos e corrigir tools
    de compras
  - feat(backend): stock por armazém, stock inicial, sugestão de compras e
    desempenho de fornecedor
- **2026-08-13 · [FE] · Antonio Mambo** — `vercel.json para deploy no Vercel`
  - feat(deploy): `vercel.json` com SPA routing e política de cache
- **2026-08-13 · [FE] · Antonio Mambo** — `refazer a landing page e o ecrã de
  entrada`
  - feat(sitio): refazer a landing page e o ecrã de entrada
- **2026-08-13 · [FE] · Antonio Mambo** — `reorganizar as secções e tornar
  funcional a sugestão de compras`

  > Nota de arquitectura registada no repositório: o backend acabou por ficar no
  > **Fly.io** (`fra`), não no Render — ver a justificação de latência ao Neon em
  > [`TRD.md` §7](./TRD.md). O deploy em Fly.io fica formalizado na Fase 4.

### Fase 3 — Responsividade mobile-first e POS no telemóvel (24 Ago 2026)

- **2026-08-24 · [FE] · Antonio Mambo** — `@ merge: responsividade mobile-first
  para produção`
  - feat(mayra): esfera fluida no modo de voz, sobreposta e sem ícones
  - feat(produto): captar dados do produto por fotografia, no formulário
  - feat(stock): transferir por selector de armazém, e leitor sempre visível
  - style(financeiro): paleta sóbria e caracteres corrompidos
  - fix(pos): distinguir "esgotado" de "está no armazém"
  - feat(mayra): painel encostado que encolhe o conteúdo, e ecrã inteiro no
    telemóvel
  - fix: não assumir que `VITE_API_URL` existe
  - docs: separar o uso em produção do andaime de desenvolvimento
  - feat(pos): POS utilizável no telemóvel, com acesso pela rede
  - feat(pos): ler códigos de barras com a câmara do telemóvel
  - fix(produtos): tornar visível a falha ao carregar os mínimos por armazém
  - fix(stock): coluna de armazém, filtro de zeros e stock mínimo obrigatório
  - feat(mayra): voz multilingue — síntese e reconhecimento seguem o idioma da
    conversa
  - fix(landing): responsividade da página pública e do ecrã de entrada
  - feat(ui): responsividade mobile-first com carrossel de KPIs e cartão unificado
- **2026-08-24 · [BE] · Antonio Mambo** — `trazer para a main o trabalho que
  faltava em produção`
  - feat(deploy): alojar o backend no Fly.io em Joanesburgo *(mudou depois para
    Frankfurt — ver nota de arquitectura no `TRD.md` §7)*
  - fix(mayra): deixar de negar dados que existem na base de dados
  - feat(produto): ler dados do produto a partir de fotografias da embalagem
  - feat(pos): permitir vender pelo telemóvel na rede local
  - fix(stock): esconder posições a zero e limpar produtos de teste
  - feat(mayra): responder no idioma de quem fala, com português por omissão
  - fix(mayra): responder sempre em português, qualquer que seja o idioma do
    pedido

### Fase 4 — Saúde do Stock, Validades e Lotes (27 Ago 2026)

- **2026-08-27 · [BE] · Antonio Mambo** — `merge(dev): saúde do stock, validades e
  lotes`
  - feat(mayra): tools e voz para a saúde do stock e as validades
  - feat(catalogo): configurar controlo de validade e lote no produto
  - feat(compras): registar lote e validade na entrada de mercadoria
  - feat(stock): centro de saúde do stock, validades e FEFO
  - refactor(bd): fixar produtos como master e remover a família artigos
  - docs(stock): análise de conformidade dos Documentos Técnicos 01 e 02

### Fase 5 — Portal B2B do Fornecedor e Documento Técnico 02 (8–9 Set 2026)

- **2026-09-08 · [BE] · srgitdep** — PR #5, `feat/b2b-fornecedor-organizacao`
  - fix(erros): dizer quando a base está atrás do código, em vez de «Internal
    server error»
  - fix(compras): o passo de enviar ao fornecedor, e a validação de tolerância que
    deixava passar
  - feat(b2b): conferência tripla, tolerâncias e Centro de Excepções
  - feat(b2b): aviso de expedição, e a ligação à recepção do Documento 01
  - feat(b2b): catálogo do fornecedor com mapeamento, preços vigentes e
    importação reversível
  - feat(compras): a ordem de compra passa a ter aprovação, versão e resposta do
    fornecedor
  - feat(b2b): a identidade do fornecedor separa-se da relação comercial
  - *(repete a Fase 4 — saúde do stock, validades e lotes — trazida por rebase)*
- **2026-09-08 · [FE] · Antonio Mambo** — `ecrãs B2B do Documento 02, e saúde do
  stock`
  - feat(compras): botão de enviar ao fornecedor
  - feat(catalogo): importar catálogo de fornecedor com revisão linha a linha
  - feat(compras): avisos de expedição e prova de entrega
  - feat(fornecedores): contas bancárias com dupla aprovação e aviso de
    duplicados
  - feat(conferencia): facturas, conferência tripla e Centro de Excepções
  - feat(compras): aprovar, submeter e registar a resposta do fornecedor
  - feat(stock): atribuir mercadoria a prateleiras, e ver onde ela está
  - feat(armazens): gerir as posições físicas de um armazém
  - feat(stock): libertar da quarentena, desbloquear, e FEFO no ecrã
  - feat(stock): ecrã das reservas, quarentena e bloqueio
  - feat(stock): mostrar o disponível, e onde está o que não pode sair
  - feat(compras): campos de lote e validade na recepção e no produto
  - feat(stock): ecrãs de saúde do stock e de validades
  - refactor(ui): tirar o nome da página de dentro da página
- **2026-09-08 · [FE] · Antonio Mambo** — `fix/compras-lista-produtos`
  - fix(compras): o campo de produtos mostra o catálogo, em vez de o esconder
- **2026-09-09 · [BE] · Antonio Mambo** — `feat/b2b-fornecedor-organizacao into
  main`
  - feat(b2b): portal fornecedor, vitrine, sourcing, adesão e registo público

### Fase 6 — CRM Omnicanal (12 Set 2026)

- **2026-09-12 · [BE] · Antonio Mambo** — `CRM omnicanal — identidade,
  segmentação, campanhas e fidelização`
  - feat(crm): pontos de fidelização com resgate e histórico
  - feat(crm): acompanhar o que acontece às mensagens depois de saírem
  - chore(crm): script de dados de demonstração para experimentar o CRM
  - feat(crm): definições de CRM por empresa, em vez de valores fixos no código
  - refactor(crm): cada consulta passa a filtrar pela empresa por si própria
  - perf(crm): segmentação de 34 s para 6 s, ficha do cliente de 4,3 s para 2 s
  - fix(crm): fechar fuga de dados entre empresas nas campanhas
  - feat(crm): a MAYRA diz o que fazer com cada cliente, e por onde começar na
    base
  - feat(crm): a MAYRA avisa quando o histórico não chega para escrever
  - feat(crm): MAYRA recomenda quem contactar e escreve as mensagens da campanha
  - feat(crm): campanhas com supressão, tecto de frequência e atribuição de
    conversão
  - fix(crm): SMS era recusado por o número ir sem indicativo
  - feat(crm): registo de cliente com identidades e consentimentos numa
    transacção
  - feat(crm): envio por SMS, WhatsApp e e-mail via Zavu, com supressão antes de
    cada mensagem
  - feat(crm): segmentação de clientes com limiares relativos ao hábito de cada
    um
  - perf: arranque de 48 s para 4 s, deixando de duplicar o `PrismaService`
  - feat(crm): visão 360 do cliente a partir dos dados já existentes
  - feat(crm): timeline do cliente a partir dos eventos já emitidos
  - feat(crm): identidade canónica do cliente, consentimentos e fusão auditável
  - refactor(cliente): remover módulo `customers` duplicado
  - feat(ai-copilot): tool `list_supplier_products` para consultar catálogo do
    fornecedor
- **2026-09-12 · [FE] · Antonio Mambo** — `CRM omnicanal — identidade,
  segmentação, campanhas e fidelização`
  - feat(crm): resgate de pontos no POS, histórico na ficha, regras no painel
  - feat(crm): distinguir no ecrã o que saiu do que chegou
  - feat(crm): painel de definições do CRM
  - feat(crm): recomendação da MAYRA na ficha do cliente e aba de análise
  - feat(crm): explicar quando e porque a MAYRA não consegue ajudar
  - feat(crm): MAYRA no ecrã de campanhas
  - feat(crm): ecrã de campanhas na secção CRM
  - feat(pos): perguntar o consentimento ao registar o cliente no balcão
  - refactor(crm): tirar os ícones dos cartões de medida na ficha do cliente
  - fix(crm): reticências apareciam corrompidas ("a€\|") no ecrã de clientes
  - feat(pos): identificar o cliente da venda, e registar um novo sem sair do
    balcão
  - feat(crm): vista de segmentos na secção CRM
  - feat(crm): ficha do cliente passa a mostrar a visão 360

### Fase 7 — DT01: Necessidades de Compra e Transferências entre Lojas (16 Set 2026)

- **2026-09-16 · [BE] · srgitdep** — PR #6, `feature/dt01-necessidades-compra`
  - feat: completa as peças restantes do DT01 (§7.1, §15.3, §15.4, §17, §23)
  - fix(necessidade): corrige claim JWT errada em 8 endpoints (`id` → `sub`)
  - feat(necessidade): Fase 4 — análise MAYRA real sobre a fila (DT01 §14)
  - feat(necessidade): endpoint de listagem de transferências entre lojas
  - feat(necessidade): Fase 3 — stock em trânsito e transferência entre lojas
  - feat(necessidade): Fase 2 — recálculo automático por evento (DT01 §23)
  - feat(necessidade): painel de Necessidades de Compra — Fase 1 (DT01)
- **2026-09-16 · [FE] · srgitdep** — PR #2, `feature/dt01-necessidades-compra`
  - fix: elimina os 3 erros de TypeScript pré-existentes no repositório
  - fix(frontend): fecha os hooks sem consumo (regra do `CLAUDE.md`)
  - fix(pesquisa): debounce de 300 ms na pesquisa global
  - feat(necessidades): UI das peças restantes do DT01 (§7.1, §15.3, §15.4, §17)
  - feat(necessidades): UI da Fase 4 — recomendação real da MAYRA (DT01 §14)
  - feat(transferencias): UI da Fase 3 — transferências entre lojas (DT01)
  - feat(necessidades): painel de Necessidades de Compra — Fase 1 (DT01)
- **2026-09-16 · [BE] · srgitdep** — PR #7,
  `fix/ai-copilot-daily-sales-tenant-scope`
  - fix(ai-copilot): `get_my_daily_sales` passa a filtrar por `empresaId`

### Fase 8 — Estabilização da voz da Mayra (Gemini Live API) (16–17 Set 2026)

- **2026-09-16 · [BE] · srgitdep** — PR #8, `fix/mayra-voz-latencia-e-identidade-ia`
  - fix(ai-copilot): corrige identidade de IA e latência na voz da Mayra
- **2026-09-16 · [BE] · srgitdep** — PR #9,
  `fix/gemini-live-realtime-input-deprecated`
  - fix(ai-copilot): corrige formato de áudio depreciado na Gemini Live API
- **2026-09-16 · [BE] · srgitdep** — PR #10,
  `diag/gemini-live-observabilidade-mensagens`
  - diag(ai-copilot): loga mensagens não tratadas da Gemini Live API
- **2026-09-17 · [BE] · srgitdep** — PR #11,
  `diag/gemini-live-confirmar-turnos-de-sucesso`
  - diag(ai-copilot): confirma turnos de sucesso da Gemini Live nos logs
- **2026-09-17 · [BE] · srgitdep** — PR #13,
  `fix/mayra-voz-texto-nao-chega-a-gemini-live`
  - fix(ai-copilot): encaminha `text_input` para a sessão Gemini Live nativa
- **2026-09-17 · [FE] · Antonio Mambo** — PR #3,
  `fix/mayra-voz-texto-nao-chega-a-gemini-live`
  - fix(ai-copilot): `sendTextMessage` enviava áudio vazio em vez do texto
- **2026-09-17 · [BE] · Antonio Mambo** — `fix/mayra-erro-stock-armazem-reserva`
  - fix(ai-copilot): `get_warehouse_stock` não filtrava por produto e escondia a
    causa real dos erros

### Fase 9 — Conferência de Recepção, Preços e ajustes de POS/Compras (17 Set 2026)

- **2026-09-17 · [BE] · Antonio Mambo** — `feat/sessao-conferencia-rececao`
  - feat(compra): endpoints de sessão de conferência de recepção por contagem
  - feat(compra): adiciona `SessaoConferenciaRececao` para contagem incremental
    de recepção
- **2026-09-17 · [FE] · Antonio Mambo** — `feat/sessao-conferencia-rececao`
  - feat(conferencia): contagem incremental de recepção por factura
- **2026-09-17 · [FE] · Antonio Mambo** — `fix/aprovacao-modal-nao-mostra-itens`
  - fix(compras): `AprovacaoModal` mostrava Linhas/Valor "—" mesmo com produtos
- **2026-09-17 · [FE] · Antonio Mambo** — `feat/pos-quantidade-editavel`
  - feat(pos): quantidade do carrinho passa a ser editável directamente
- **2026-09-17 · [FE] · Antonio Mambo** — `feat/pagina-precos`
  - feat(landing): adiciona secção de Preços e página `/precos` dedicada

### Fase 10 — Compra Fácil: loja online B2C (Fases 11–12) (21 Set 2026)

- **2026-09-21 · [BE] · Antonio Mambo** — `feat/compra-facil-fase11`
  - feat(commerce): implementa o Compra Fácil (Fases 11 e 12) e armazenamento
    real de imagens de produto
  - fix(prisma): recupera a DDL do Inventário v1.1 que faltava no histórico
- **2026-09-21 · [FE] · Antonio Mambo** — `feat/compra-facil-fase11`
  - feat(compra-facil): implementa o frontend do Compra Fácil (Fases 11 e 12) e
    upload real de imagens de produto

  > Merge de dependência explícita: o frontend regista no corpo do commit que
  > "requer o backend correspondente, já em produção" — o backend entrou primeiro,
  > como manda a Secção 7 do `CLAUDE.md`.

- **2026-09-21 · [FE] · Antonio Mambo** — `fix/loja-cabecalho-duplicado`
  - fix(compra-facil): remove o cabeçalho de marketing duplicado nas rotas
    `/loja`
- **2026-09-21 · [FE] · Antonio Mambo** — `feat/loja-online-pontos-entrada`
  - feat(compra-facil): adiciona pontos de entrada para a loja online
- **2026-09-21 · [FE] · Antonio Mambo** — `fix/loja-links-de-volta`
  - fix(compra-facil): adiciona ligações de volta que faltavam na loja
- **2026-09-21 · [FE] · Antonio Mambo** — `fix/loja-links-de-volta-restantes`
  - fix(compra-facil): adiciona "voltar" ao carrinho, checkout e meus pedidos

### Fase 11 — E-mail do CRM via SMTP próprio (21 Set 2026)

- **2026-09-21 · [BE] · Antonio Mambo** — `feat/crm-email-mailer`
  - feat(crm): move o e-mail do CRM do Zavu para o `MailerService` (SMTP), e
    reorganiza os templates numa classe única e moderna
- **2026-09-21 · [BE] · Antonio Mambo** — `docs/changelog-crm-email-mailer`
  - docs(compra-facil): regista no changelog o routing de e-mail do CRM e o
    redesign dos templates

### Fase 12 — Entrar/criar conta com Google no Compra Fácil (21 Set 2026)

- **2026-09-21 · [BE] · Antonio Mambo** — `feat/login-google-compra-facil`
  - feat(commerce): implementa entrar/criar conta com Google no Compra Fácil
  - fix(prisma): remove reformatação não intencional do schema
- **2026-09-21 · [FE] · Antonio Mambo** — `feat/login-google-compra-facil`
  - feat(compra-facil): adiciona "Continuar com Google" ao entrar/criar conta

### Fase 13 — Mercado entre lojas, pesquisa sem acentos e UI moderna do Compra Fácil (21 Set 2026)

- **2026-09-21 · [BE] · Antonio Mambo** — `feat/mercado-compra-facil`
  - feat(commerce): adiciona catálogo de mercado entre lojas ao Compra Fácil
    (`GET /commerce/produtos`, `GET /commerce/categorias`,
    `GET /commerce/conta/lojas-compradas`)
- **2026-09-21 · [FE] · Antonio Mambo** — `feat/mercado-compra-facil`
  - feat(compra-facil): página inicial (`/loja`) vira um mercado entre lojas —
    `LojaHomePage` substitui `EscolherLojaPage`; produtos de todas as lojas à
    vista de imediato, com pesquisa, filtro de categoria e barra lateral de
    lojas, em vez de obrigar a escolher uma loja primeiro
- **2026-09-21 · [FE] · Antonio Mambo** — `feat/mercado-visual-premium`
  - style(compra-facil): dá cor e profundidade à página inicial do mercado
    (hero em gradiente, categorias como chips de cor, cartões de produto com
    elevação)
  - feat(compra-facil): repõe o ícone de carrinho e "Entrar"/"Criar conta" no
    cabeçalho do mercado (tinham desaparecido com a troca do `LojaTopo` pelo
    cabeçalho novo), e adiciona sugestões de pesquisa ao digitar
- **2026-09-21 · [BE] · Antonio Mambo** — `fix/busca-produtos-sem-acento`
  - fix(commerce): pesquisa de produtos deixa de depender de acentuação
    ("agua" passa a encontrar "Água") — filtra do lado da aplicação em vez de
    `ILIKE`, tanto no catálogo de uma loja como no mercado
- **2026-09-21 · [FE] · Antonio Mambo** — `style/carrinho-moderno`
  - style(compra-facil): redesenha o carrinho ao padrão moderno de
    e-commerce — duas colunas (itens + resumo do pedido fixo), stepper de
    quantidade em pílula, CTA em destaque
- **2026-09-21 · [FE] · Antonio Mambo** — `style/checkout-moderno`
  - style(compra-facil): redesenha o checkout ao mesmo padrão do carrinho —
    mesmo cartão de "Resumo do pedido", método de pagamento como cartões
    seleccionáveis com ícone (Numerário/M-Pesa/E-Mola)

  > Decisões de arquitectura do mercado: um cartão por produto, nunca por
  > (produto × loja) — evita mostrar o mesmo artigo duplicado pelas várias
  > lojas da mesma empresa; escolhe-se a loja com maior disponibilidade.
  > "Lojas onde já comprei" fica limitado à empresa da conta autenticada
  > actual — `ContaCliente` é isolado por empresa neste sistema, sem
  > identidade de cliente entre empresas diferentes (ver Backlog).

### Fase 14 — Visibilidade dos pedidos do Compra Fácil no ERP (22 Set 2026)

- **2026-09-22 · [BE] · Antonio Mambo** — `feat/visibilidade-pedidos-ecommerce`
  - feat(dashboard): acrescenta aos KPIs o contador de pedidos do Compra Fácil
    por atender (`ESTADOS_PENDENTES`, sem filtro de data)
  - feat(crm): a venda vinda do Compra Fácil passa a registar-se na timeline como
    `COMPRA_ECOMMERCE`/canal `ECOMMERCE`, em vez de `COMPRA_POS`/`POS`
- **2026-09-22 · [FE] · Antonio Mambo** — `feat/kpi-pedidos-pendentes`
  - feat(dashboard): cartão "Pedidos Compra Fácil por atender", clicável para
    `/commerce/pedidos` quando há pedidos em espera
  - feat(compra-facil-gestao): selector de loja na fila de pedidos — a
    canalização do filtro já existia toda (controlador, use-case, tipo e camada
    de API); faltava só o controlo no ecrã
  - feat(compra-facil-gestao): cancelar um pedido a partir do drawer, com motivo
    obrigatório e confirmação em dois passos

  > **Correcções encontradas na auditoria de integração** (mesma entrega, a
  > seguir aos dois pontos acima):
  >
  > - `fix(commerce)`: **o levantamento passa a recusar um pedido de outra loja.**
  >   A reserva sai do armazém da loja do pedido, mas `ProcessarVendaUseCase`
  >   abate do armazém da loja do caixa de quem confirma — e nada ligava os dois.
  >   Com lojas diferentes, a reserva libertava-se numa loja sem lhe descontar o
  >   stock e a venda saía da outra: duas posições erradas e a venda na loja que
  >   não a fez. Não exigia má intenção — a fila mostra os pedidos de toda a
  >   empresa, porque o token do funcionário não tem `lojaId`.
  > - `fix(commerce)`: **a reserva deixa de expirar com o pedido já em
  >   preparação.** `expiraEm` é escrito uma vez, na criação, e nunca renovado; a
  >   tarefa libertava a reserva ao fim dos 30 minutos iniciais fosse qual fosse o
  >   estado do pedido. Uma encomenda confirmada e separada perdia a protecção de
  >   stock, o POS voltava a poder vender o artigo, e o levantamento falhava com o
  >   cliente ao balcão. Num *click & collect* isso é o caso normal, não o raro.
  > - `feat(commerce)`: **a loja passa a poder cancelar um pedido em preparação.**
  >   O cliente só cancela até `CONFIRMADO` e a expiração só apanha `CRIADO`; um
  >   pedido em `EM_PREPARACAO`/`PRONTO` não tinha saída nenhuma e segurava a
  >   reserva para sempre. Não é opcional depois da correcção anterior — é o que
  >   lhe dá saída. `PATCH /commerce/gestao/pedidos/:id/cancelar`.

- **2026-09-22 · [BE] · Antonio Mambo** — `fix/anulacao-venda-reverte-pedido`
  - fix(vendas): anular a venda reverte o pedido do Compra Fácil para
    `CANCELADO`, dentro da transacção de anulação, e a devolução passa a
    registar-se no CRM com o canal da compra que desfaz
  - **Migração**: `20260922230000_devolucao_ecommerce` — acrescenta
    `DEVOLUCAO_ECOMMERCE` a `TipoEventoCliente`. Aditiva, com
    `ADD VALUE IF NOT EXISTS`; nenhuma linha existente é tocada e as devoluções
    já gravadas continuam `DEVOLUCAO_POS`, porque reclassificá-las exigiria
    adivinhar a origem de cada venda antiga.

  > As duas incoerências tinham a mesma raiz: a `Venda` não guarda por onde
  > entrou, e `AnularVendaUseCase` não conhecia a tabela `Pedido`. Uma só
  > consulta resolve ambas — `Pedido.vendaId` é único e só é preenchido ao
  > confirmar o levantamento, pelo que a existência de um pedido é a prova do
  > canal. Não foi preciso campo novo na `Venda`.
  >
  > Sem alterações no frontend: a página de detalhe do pedido do cliente já
  > mostrava `motivoCancelamento`, pelo que ele passa a ver a explicação (número
  > da factura e motivo) sem uma linha nova.
  >
  > `calcular-medidas.ts` passou a contar os dois tipos de devolução. Sem isso, a
  > taxa de devolução da visão 360 ignorava as devoluções online — a correcção da
  > classificação teria aberto um buraco nas métricas.

  > **Porquê**: um pedido online só produz factos no ERP quando o levantamento é
  > confirmado (`ConfirmarLevantamentoUseCase` — exige estado `PRONTO` e sessão
  > de caixa aberta). Até lá vive só em `Pedido`/`PedidoItem`/`ReservaStock` e
  > não aparece na facturação, no caixa nem no financeiro. Isto é deliberado — o
  > modelo é *click & collect*, sem gateway, e o dinheiro entra fisicamente no
  > levantamento —, mas o pedido pendente não tinha indicador nenhum: quem não
  > abrisse a fila por iniciativa própria não sabia que havia encomendas.
  >
  > **Achado durante a análise**: o POS **já respeitava** as reservas do Compra
  > Fácil desde a Fase 11 — `findProdutosComStock` subtrai `reservas_stock`
  > activas ao saldo vendível (`prisma-venda.repository.ts`). Uma primeira
  > análise concluiu o contrário por procurar o nome do modelo Prisma
  > (`reservaStock`) numa query que é SQL cru e usa o nome da tabela. Não houve
  > correcção a fazer aqui.
  >
  > `CanalVenda` fica fora do `ProcessarVendaDto` de propósito: se viajasse no
  > corpo do pedido HTTP, um cliente do POS podia declarar-se `ECOMMERCE` e
  > enviesar a segmentação do CRM.

### Fase 15 — Retry para 503 transitório do Gemini na Mayra (28 Set 2026)

- **2026-09-28 · [BE] · Antonio Mambo** — `fix/mayra-retry-gemini-503`
  - fix(ai-copilot): repete a chamada ao Gemini até duas vezes (500ms, 2s) quando
    a resposta é 503 "UNAVAILABLE" — cobre o chat, a geração do título da sessão
    e a análise da fila de necessidades
- **2026-09-28 · [BE] · Antonio Mambo** — `fix/gemini-retry-sem-instanceof`
  - fix(shared): detecta o 503 do Gemini pelo `status`, sem `instanceof` — com o
    `@google/genai` simulado nos testes, o `instanceof ApiError` lançava um
    `TypeError` que escondia o erro original; acrescenta `gemini-retry.spec.ts`

  > **Porquê**: os logs de produção de 28/09/2026 mostraram seis picos de
  > `ApiError 503 "This model is currently experiencing high demand"` ao longo
  > do dia (12:03–17:53), cada um resolvido horas depois sem qualquer alteração
  > de código — sinal de sobrecarga transitória do lado do Google, não de
  > configuração errada. Nenhuma das três chamadas ao Gemini
  > (`AiCopilotSessionService.getOrCreateSession`, `AiCopilotService.chat`,
  > `AnalisarNecessidadesMayraUseCase`) tinha retry; um 503 ia direto ao
  > utilizador como erro. `generateContent` não tem efeito colateral do lado do
  > servidor além de consumir quota, por isso repetir é sempre seguro aqui — ao
  > contrário de uma escrita na base de dados, onde só é seguro repetir leituras
  > (`ligacao-intermitente.ts`).
  >
  > Novo `src/shared/gemini-retry.ts` (`comRetryGemini`) — mesma progressão de
  > esperas (500ms, 2s) já usada para a intermitência do Neon, para não tratar
  > um 503 do Gemini com mais paciência do que uma ligação de base de dados a
  > acordar.
  >
  > **Achado, fora de âmbito, não corrigido**: a geração do título da sessão já
  > apanhava o próprio erro e caía em "Nova Conversa" — não bloqueava o chat,
  > ao contrário do que uma primeira leitura dos logs sugeria (as duas falhas
  > apareciam juntas por serem duas chamadas Gemini na mesma pedida, não uma a
  > bloquear a outra).

- **2026-09-28 · [BE] · Antonio Mambo** — `docs/gemini-3.8-flash-e-chave`
  - docs: regista a troca de modelo para `gemini-3.8-flash` e a chave do Gemini
    corrigida em produção (`.env.example`, `TRD.md`)

  > **A causa real não era o modelo — era a chave.** O retry (v58) e a troca para
  > `gemini-3.8-flash` (v59) não resolveram: a Mayra continuou a falhar. Um teste
  > feito dentro da máquina do Fly mostrou que o segredo `GEMINI_API_KEY` tinha
  > **7 caracteres** — não era uma chave — e a Google recusava-o com
  > `400 "API key not valid"` em qualquer modelo. Com a chave correcta (v60/v61) a
  > Mayra voltou a responder, confirmado por pedido real.
  >
  > **Por explicar:** com a chave inválida, a aplicação registava `503 "high
  > demand"` e não `400`. Não se chegou a ver a chave que o processo tinha em
  > memória (leitura de produção não autorizada). Se o 503 voltar com a chave
  > actual, há uma segunda causa e deve investigar-se.
  >
  > Sem alterações de configuração no Fly além dos segredos `GEMINI_MODEL` e
  > `GEMINI_API_KEY`, ambos alterados à mão pelo utilizador. O
  > `gemini-2.5-flash`, a primeira alternativa considerada, aparece na lista de
  > modelos mas devolve `404` — não usar.

- **2026-09-28 · [BE] · Antonio Mambo** — `fix/mayra-varias-ferramentas`
  - fix(ai-copilot): executa todas as ferramentas que o Gemini pede numa resposta e
    repete até ele responder (máximo 4 voltas; na última, sem ferramentas)

  > **Porquê**: depois de corrigida a chave, a Mayra respondia "Não encontrei dados
  > suficientes" a qualquer pergunta ampla ("como aumentar as vendas", "auditoria
  > anti-fraude") e acertava nas simples ("vendas do mês"). Reproduzido com as
  > instruções e ferramentas reais: numa pergunta ampla o Gemini pede **3 a 5
  > ferramentas na mesma resposta**, e `AiCopilotService.chat` só executava a
  > primeira (`parts.find`). O modelo voltava a pedir as outras, o serviço não fazia
  > mais nenhuma volta, a resposta chegava sem texto e caía em `PROMPTS.NO_DATA`.
  > Não tinha relação com o modelo nem com a chave.
  >
  > Mudanças de comportamento:
  >
  > - Um erro de uma ferramenta (ex.: sem permissão) deixa de cortar a conversa:
  >   vai ao modelo como resultado `{ erro }` e as restantes ferramentas contam.
  > - `CopilotMessage.toolCall` passa a guardar uma **lista** de chamadas;
  >   `getGeminiHistory` continua a ler as mensagens antigas, com um só objecto.
  >   Sem migração — a coluna é JSON. O frontend não lê este campo.
  > - Uma resposta sem texto passa a ficar registada nos logs com o
  >   `finishReason` — antes não deixava rasto nenhum.
  > - Perguntas amplas demoram mais (8–12 s medidos), porque passam de facto a
  >   recolher todos os dados.
  >
  > Testes novos: `ai-copilot.service.spec.ts` (várias ferramentas na mesma
  > resposta, voltas encadeadas, limite de voltas, erro de uma ferramenta, HITL) e
  > `ai-copilot-session.service.spec.ts` (histórico nos dois formatos).

- **2026-09-29 · [FE] · Antonio Mambo** — `fix/voz-mayra-a-falar`
  - fix(ai-copilot): a voz nativa marca a Mayra como "a falar" em cada bloco de
    áudio — falar por cima dela volta a interrompê-la; o fim do turno passa a
    esperar que o áudio em fila acabe de tocar; aviso na consola quando o browser
    não deixa tocar o áudio

  > **Porquê**: um utilizador em Chrome, no computador, relatou que a Mayra "não
  > falou nada". Nos logs do Fly o Gemini gerou o áudio e o servidor reenviou-o ao
  > browser — o caminho servidor → browser estava bem, e nada no código cortava o
  > som. A causa mais provável é o **som do site bloqueado no Chrome**, que descarta
  > o áudio sem erro nenhum; ainda por confirmar pelo utilizador. Como não deixava
  > rasto, o `PCMPlayer` passa a avisar na consola quando o `AudioContext` não
  > arranca.
  >
  > Na mesma análise, dois defeitos em `useGeminiVoice.ts`:
  >
  > - **O barge-in nunca funcionava na voz nativa.** `audio_chunk` punha o ecrã em
  >   `SPEAKING` mas não marcava `mayraAFalarRef` — só o MP3 de recurso o marcava —,
  >   e o `onaudioprocess` só interrompe com essa marca.
  > - **O ecrã passava a "a ouvir" com ela ainda a falar.** O `turn_complete` lia um
  >   `state` fechado no render em que o socket foi criado, e a condição era sempre
  >   verdadeira. Passa a decidir por `ref`s, e só dá a Mayra como calada quando o
  >   turno terminou **e** o `PCMPlayer` esvaziou a fila (`aoFicarEmSilencio`) — o
  >   `turn_complete` chega com segundos de áudio ainda por tocar. O modo de recurso
  >   mantém o seu comportamento: lá quem sabe que ela se calou é o `onended` do MP3,
  >   e mexer em `mayraAFalarRef` no `turn_complete` reabria o microfone a meio da
  >   frase dela.
  >
  > Teste novo: `src/shared/utils/pcm-player.test.ts`.

### Fase 16 — Fila de pedidos do Compra Fácil para Gestor e Caixa (29 Set 2026)

- **2026-09-29 · [BE] · Antonio Mambo** — `fix/permissoes-commerce-perfis`
  - fix(commerce): liga `commerce.pedido.ler` e `commerce.pedido.gerir` aos perfis
    de sistema `Gestor` e `Funcionário / Caixa`
  - **Migração**: `20260929090000_commerce_permissoes_perfis_sistema` — só
    acrescenta linhas a `perfil_permissoes`, por nome de perfil de sistema,
    idempotente (`ON CONFLICT DO NOTHING`); se os perfis não existirem não faz
    nada, em vez de falhar e impedir o contentor de arrancar.

  > **Porquê**: a migração `20260920070000` criou as duas permissões sem as ligar a
  > perfil nenhum. Quem não é ADMIN via "Pedidos Compra Fácil" no menu (que filtra
  > por role) e recebia 403 ao abrir — a fila só funcionava para ADMIN e
  > SUPER_ADMIN, que têm bypass no `PermissoesGuard`.
  >
  > - `prisma/seed.ts`: `pedidos_commerce` nas listas do Gestor e do Caixa. O seed
  >   apaga e recria as ligações dos perfis de sistema; sem isto, corrê-lo em
  >   desenvolvimento desfazia a migração.
  > - `src/utils/redis.service.ts`: a chave da cache de permissões passa a
  >   `permissions:v2:<userId>`. A cache dura 24 h e não sabe que a base de dados
  >   mudou; subir a versão torna as permissões novas válidas logo após o deploy.
  > - `Armazenista` fica de fora (assunção 10 da §4.1). O menu continua a mostrar a
  >   fila a STOCK_KEEPER, que recebe 403 — a corrigir se o picking passar a ser
  >   deles.
  > - Perfis **próprios** de cada empresa não são tocados: recebem a permissão no
  >   editor de perfis, que já a mostra ("Pedidos Compra Fácil").
  >
  > Testes: 3 casos novos em `permissoes.guard.spec.ts` (ver e gerir com as
  > permissões da migração; ver não dá gerir).

- **2026-09-29 · [BE+FE] · Antonio Mambo** — `fix/perfil-por-cargo`
  - fix(permissoes): o cargo escolhe o perfil de sistema quando o utilizador não tem
    perfil próprio; o login devolve as permissões; só o SUPER_ADMIN altera perfis de
    sistema

  > **Porquê**: com a migração acima aplicada, um Caixa continuava a receber «O
  > utilizador não tem nenhum perfil atribuído». Em produção (3 empresas) existiam os
  > 4 perfis de sistema — `Administrador` com os 4 administradores, e `Gestor`,
  > `Funcionário / Caixa` e `Armazenista` com **zero** utilizadores —, e os 2 Caixas
  > sem perfil. O ecrã de utilizadores chama «Perfil de Acesso» ao **cargo** e não liga
  > ninguém a um perfil; o backend não tem endpoint para isso. O RBAC por perfil nunca
  > chegou a ninguém que não fosse ADMIN.
  >
  > - `src/shared/perfil-por-cargo.ts`: Caixa → «Funcionário / Caixa», Gerente →
  >   «Gestor», Armazenista → «Armazenista»; «Funcionário Geral» (`USER`) fica sem, por
  >   não haver perfil com permissões decididas para ele. Um `perfilId` explícito tem
  >   prioridade. A excepção do POS para Caixas mantém-se.
  > - `jwt.strategy.ts`: o `perfilId` passa a chegar ao pedido. Antes o guard lia
  >   `user.perfilId`, que nunca existia — o ramo do perfil era código morto.
  > - `src/middlewares/permissoes-do-utilizador.ts`: uma só função carrega as
  >   permissões (com a cache) para o guard **e** para o `LoginUseCase`, que passa a
  >   devolver `user.permissions`. O frontend escondia os botões de acção (`<Can>`,
  >   `usePermissions`) a quem não era ADMIN porque o login nunca enviava a lista.
  > - `AssignPermissionsUseCase`: um perfil de sistema só o SUPER_ADMIN o altera. Com o
  >   cargo a usá-los, o ADMIN de uma empresa passaria a mudar as permissões dos
  >   funcionários das outras. `PermissionsPage` mostra o motivo (`mensagemDeErro`).
  > - `PrismaPerfilRepository.assignPermissions`: editar um perfil de sistema invalida
  >   também a cache de quem o usa pelo cargo.
  >
  > Quem já tinha sessão tem de sair e voltar a entrar para o ecrã receber as
  > permissões. **Verificado em produção** (v65, 2026-09-29) pelo utilizador: um
  > Caixa abre a fila de pedidos do Compra Fácil.
  >
  > Testes novos: 4 em `permissoes.guard.spec.ts` (perfil do cargo, prioridade do
  > perfil próprio, perfil inexistente) e `assign-permissions.use-case.spec.ts` (4).

### Fase 17 — Fuso horário de Maputo no servidor (29 Set 2026)

- **2026-09-29 · [BE] · Antonio Mambo** — `fix/fuso-horario-maputo`
  - fix(infra): `TZ = "Africa/Maputo"` no `fly.toml`; testes no mesmo fuso; teste
    do ponto com relógio fixo; acentos nas mensagens do ponto

  > **Porquê**: ao investigar o teste instável do ponto, viu-se que a máquina do Fly
  > corria em **UTC** (`TZ` vazio). `BaterPontoUseCase` monta o início do turno com
  > `setHours` — hora local do processo —, e os comentários assumiam Maputo. Um turno
  > das 08:00 era lido como 08:00 UTC, 10:00 em Maputo: uma entrada às 09:30 contava
  > como PRESENTE em vez de 90 min de atraso, e entre as 00:00 e as 02:00 o dia era o
  > anterior. Sem impacto real: não havia nenhum registo de ponto em produção.
  >
  > - O teste instável tinha a mesma raiz: turnos «daqui a uma hora» e «há duas
  >   horas» pelo relógio real mudavam de dia perto da meia-noite, e o CI (UTC)
  >   falhava entre as 01:00 e as 02:00 de Maputo. Passa a relógio fixo, com casos
  >   novos (09:30 → 90 min; 00:30 → dia novo).
  > - `test/definir-fuso-horario.js` (`globalSetup` do Jest) põe todos os testes em
  >   `Africa/Maputo`. Verificado com `TZ=UTC` forçado: passam; sem o `globalSetup`,
  >   o teste que confirma o fuso falha.
  > - Crons diários passam a correr 2 h mais cedo em relação a antes, todos de noite
  >   e agora à hora de Maputo: inadimplência 00:00, segmentos 01:00, documentos B2B
  >   03:00.
  > - As 5 mensagens de `bater-ponto.use-case.ts` tinham os acentos apagados
  >   («O funcionrio no est associado…») e chegavam assim ao funcionário.
  >
  > **Verificado em produção** (v67, 2026-09-29): `TZ=Africa/Maputo` na máquina,
  > hora local GMT+0200, e os logs passaram a sair na hora de Maputo.


### Fase 18 — Multilínguas, Fase 1: infraestrutura de tradução (29 Set 2026)

- **2026-09-29 · [BE] · Antonio Mambo** — `feat/multilinguas-infraestrutura`
  - feat(i18n): infraestrutura de tradução no backend
  - **Migração**: `20260929150000_idioma_utilizadores` — não destrutiva: `idioma`
    (texto, NULL = não escolheu) em `users`, `contas_cliente` e
    `utilizadores_fornecedor`; `idiomaPadrao` (`'pt'`) em `empresas`. Toda a gente
    fica em português no dia do deploy.
- **2026-09-29 · [FE] · Antonio Mambo** — `feat/multilinguas-infraestrutura`
  - feat(i18n): infraestrutura de tradução no frontend

  > **O que muda à vista nesta fase:** o selector de língua (ERP, loja, portal,
  > páginas públicas), os erros de validação dos formulários — que saíam em **inglês**
  > para toda a gente («lojaId should not be empty») e passam a sair em português, ou
  > em inglês para quem o escolhe —, os formatadores partilhados de moeda e data, e o
  > `lang` da página (era `en`). **Os ecrãs continuam em português:** traduzi-los é a
  > Fase 2 (§4.2).
  >
  > - Backend: `nestjs-i18n`, língua pelo `Accept-Language`
  >   (`src/shared/configuracao-i18n.ts`); `mensagensDeValidacao` traduz as mensagens
  >   por omissão do `class-validator` pela regra e deixa as escritas à mão;
  >   `TraduzirExcecaoFilter` traduz os erros com `codigo` e deixa os outros como
  >   sempre; `resolverIdioma` para onde não há pedido; a língua vem no login dos três
  >   tipos de conta; `PATCH /auth/eu/idioma` e `PATCH /commerce/conta/eu/idioma`.
  > - Frontend: `i18next` com chaves tipadas; `Accept-Language` nas **6** instâncias
  >   do axios (5 eram independentes e teriam ficado de fora); `SelectorIdioma`;
  >   `formatMoeda`/`formatData` pela língua (em português, o mesmo resultado de antes —
  >   há teste); teste de paridade de chaves.
  > - Achado: o nome da regra do `class-validator` não é o do decorador (`@IsUUID` gera
  >   `isUuid`). Um teste passou a confirmar que cada chave do catálogo é uma regra real.
  > - Testes: backend 1828 (novos: `idiomas`, `traduzir-validacao`,
  >   `traduzir-excecao.filter` e `multilinguas.integracao`, este com pedidos HTTP
  >   reais em `pt`, `en-GB` e `fr-FR`); frontend 116 (formatadores e paridade).
  >
  > **Verificado em produção** (backend v68, frontend no Vercel, 2026-09-29): catálogos
  > em `dist/src/i18n`, migrações aplicadas; `POST /auth/entrar` com um campo a mais
  > responde «o campo intruso não é aceite» sem língua e «the field intruso is not
  > accepted» com `Accept-Language: en-GB`; o site publicado serve `lang="pt"`. A troca
  > de língua no browser (selector, preferência noutro browser) fica por confirmar pelo
  > utilizador — não há forma de a exercitar daqui.


### Fase 19 — Multilínguas, Fase 2A: Compra Fácil e login em inglês (1 Out 2026)

- **2026-10-01 · [BE] · Antonio Mambo** — `feat/multilinguas-fase-2a`
  - feat(i18n): erros do cliente e notificações de pedido traduzidos
- **2026-10-01 · [FE] · Antonio Mambo** — `feat/multilinguas-fase-2a`
  - feat(i18n): loja online e login em inglês

  > **A Fase 2 da §4.2 divide-se em três blocos** (o inventário deu ~1.300 textos, mais do
  > que a §4.2 estimava), cada um com merge e deploy próprios: **A** — Compra Fácil, login
  > e notificações de pedido (esta entrada); **B** — portal do fornecedor e mercado; **C** —
  > landing, preços e adesão.
  >
  > **O que passa a existir em inglês:** a loja online do princípio ao fim (catálogo,
  > produto, carrinho, checkout, conta, pedidos), o login, a recuperação e a redefinição
  > de senha, os erros do servidor dessas áreas, e os e-mails de confirmação, preparação,
  > entrega e cancelamento do pedido — que saem na língua **do cliente** (a da conta, ou a
  > da empresa, ou português). O selector aparece também no login e na página inicial da
  > loja, que tem um topo próprio.
  >
  > - Frontend: namespaces `loja` (98 textos) e `auth` (53), 9 páginas e 5 componentes da
  >   loja, 3 páginas de autenticação, schemas Zod por língua, `COPY.AUTH` removido do
  >   `copywriting.ts`. As etiquetas `ETIQUETA_ESTADO_PEDIDO` e
  >   `ETIQUETA_METODO_PAGAMENTO` da loja passaram a chaves (as do ERP ficam para a Fase 3).
  > - Backend: 35 chaves em `erros.json` (Compra Fácil, autenticação e DTOs de auth) e
  >   `notificacoes.json`; `mensagemTraduzida()`; `NotificarClientePedidoService` recebe
  >   tipo + parâmetros em vez do texto.
  > - Testes: backend 1878 (novos: consistência dos catálogos — cada `codigo` usado no
  >   código existe nas duas línguas —, o serviço de notificação com o `I18nService` e os
  >   catálogos reais, e dois casos no teste HTTP); frontend 118.
  > - **Tradução do inglês escrita por Claude, ainda sem revisão por uma pessoa fluente**
  >   (§4.4) — decisão do utilizador: publica-se e revê-se depois. Corrigir um texto não
  >   mexe em código: está em `src/locales/en/` e `src/i18n/en/`.
  > - Fica por fazer nesta área: os erros do lado de **gestão** do Compra Fácil (conferir,
  >   confirmar levantamento, transitar — 19 excepções) pertencem ao ERP, Fase 4.
  >
  > **Verificado em produção** (backend v69, frontend no Vercel, 2026-10-01):
  > `POST /auth/login` com um código inexistente responde «Código Inválido. Usuário não
  > existe.» sem língua e «Invalid code. User does not exist.» com `Accept-Language: en-GB`;
  > a validação escrita à mão num DTO («The access code is required») e o erro da conta de
  > cliente («Session not found. Please sign in again.») saem em inglês; o catálogo
  > `notificacoes.json` está no `dist`; o bundle publicado contém os textos ingleses da
  > loja. **Por confirmar pelo utilizador**, que não consigo exercitar daqui: percorrer a
  > loja em inglês no browser (catálogo, carrinho, checkout, conta, pedidos) e receber o
  > e-mail de um pedido na língua escolhida.


### Fase 20 — Multilínguas, Fases 2B a 4: ERP, POS e servidor completos em inglês (3 Out 2026)

- **2026-10-03 · [BE] · Antonio Mambo** — `feat/multilinguas-fase-2b`
  - feat(i18n): erros do portal do fornecedor e e-mail de boas-vindas em inglês (Fase 2B)
  - feat(i18n): pedido de adesão e e-mails de boas-vindas em inglês (Fase 2C)
  - feat(i18n): código traduzível em todas as excepções do servidor (Fase 4)
  - fix(i18n): a Mayra responde na língua do utilizador também nas análises assíncronas
- **2026-10-03 · [FE] · Antonio Mambo** — `feat/multilinguas-fase-2b`
  - feat(i18n): portal do fornecedor e mercado em inglês (Fase 2B)
  - feat(i18n): site público, preços e adesão em inglês (Fase 2C)
  - feat(i18n): ERP e POS completos em inglês (Fase 3)

  > **Fecha de uma vez as Fases 2B, 2C, 3 e 4 da §4.2** — implementadas em paralelo por
  > vários agentes, sobre a mesma branch, e verificadas e mescladas juntas.
  >
  > **Backend**
  > - `codigo` + `parametros` generalizados a **todas** as excepções HTTP que faltavam:
  >   `compra`, `inventory`/`stock`, `armazem`, `crm`, `commerce` (gestão do Compra
  >   Fácil), `b2b` (requisições, sourcing, adjudicação, qualificação, fusão de
  >   organizações, importação de catálogo), `necessidade` (incl. transferências entre
  >   lojas), `fornecedor` (conta bancária), `vendas`, `caixa`, `financeiro`, `produto`,
  >   `users`, `hr`, `ponto`, `turno`, `perfil`, `modulo`, `empresa`, `contrato`,
  >   `salario`, `categoria`, `cliente`, `loja`, e os guards/decorators partilhados
  >   (`jwt-auth`, `permissoes`, `roles`, `modulo-access`, segregação de funções). ~480
  >   chaves novas em `erros.json`, confirmadas pelo teste de paridade
  >   `codigos-de-erro.spec.ts` contra as duas línguas.
  > - Mensagens de validação escritas à mão nos DTOs passam a `mensagemTraduzida()`.
  > - A Mayra responde por omissão na língua preferida do utilizador
  >   (`idiomaDoUtilizadorPorId`, em `src/shared/idiomas.ts`, partilhada pelo chat de
  >   texto, pela voz — Gemini Live — e pelas duas análises assíncronas): a recomendação
  >   do painel de necessidades (cache agora separada por língua, R3 do plano) e a
  >   classificação de excepções de inventário.
  > - `pedidos_adesao.idioma` (migração não destrutiva) e `utilizadores_fornecedor`
  >   passam a gravar a língua de quem se regista; os e-mails de boas-vindas e de
  >   confirmação/recusa saem nessa língua.
  > - `diagnosticoDoNuit()` passa a devolver código + parâmetros em vez de uma frase
  >   fixa, para o aviso do NUIT se poder traduzir também no registo público.
  >
  > **Frontend**
  > - Namespaces novos: `portal`, `mercado`, `site` (substitui `copywriting.ts` —
  >   `useCopy()` lê o catálogo activo), `precos`, `adesao`, `pos`, `stock`, `armazens`,
  >   `transferencias`, `compras`, `conferencia`, `catalogo`, `crm`, `rh`, `financeiro`,
  >   `fornecedores`, `b2b`, `produtos`, `lojas`, `empresas`, `utilizadores`, `modulos`,
  >   `painel`, `historico`, `pesquisa`, `lojaGestao` (gestão do Compra Fácil no ERP),
  >   `copiloto` (UI da Mayra) e `shell` (layout, guards, componentes genéricos) — as 24
  >   áreas do ERP e o POS ficam todas traduzíveis.
  > - `precos.dados.ts` reduzido a números, booleanos e códigos; os textos (nomes,
  >   frases, limites) saem do namespace `precos`.
  > - `formatInteiro`/`formatMoedaInteira` novos em `formatMoeda.ts`, para valores sem
  >   casas decimais (preçário, módulos) que antes concatenavam `MT` à mão.
  > - O aviso do NUIT no browser (`diagnosticoDoNuit`/`diagnosticoDoNuitAoEscrever` em
  >   `shared/utils/nuit.ts`) devolve código + parâmetros, traduzidos pelo namespace
  >   `comum` (`nuit.*`) — usado no registo do fornecedor e no pedido de adesão.
  > - `SelectorIdioma` acessível também no menu móvel (o POS corre em telemóvel).
  > - Etiquetas por mapa fixo (`Record<string,string>`) substituídas por código + chave
  >   em todas as áreas tocadas — nenhuma lista de estados/tipos ficou por traduzir.
  >
  > **Testes**: backend 2332 (todos os suites, incl. o novo `nuit-catalogo.spec.ts` e os
  > dois testes de língua das análises da Mayra); frontend 147 (10 ficheiros, incl. a
  > paridade `pt`↔`en` de todos os 29 namespaces). `tsc` e `npm run build` limpos nos
  > dois repositórios.
  > - **Tradução do inglês escrita por Claude, ainda sem revisão por uma pessoa fluente**
  >   (§4.4) — mesma decisão da Fase 19: publica-se e revê-se depois.
  > - **Fica por fazer**: a regra de lint que proíbe texto solto em JSX (§4.4) não foi
  >   implementada — a prevenção depende por agora da revisão humana. As 65 ferramentas
  >   da Mayra continuam a devolver texto em português (R7, opcional) — o modelo
  >   reformula na língua do utilizador.
  >
  > **Por confirmar pelo utilizador**, que não consigo exercitar daqui: percorrer o ERP e
  > o POS em inglês no browser (todas as 24 áreas), confirmar o e-mail de boas-vindas do
  > fornecedor e da adesão na língua escolhida, e pedir à Mayra uma recomendação de
  > necessidades/classificação de excepção com a conta em inglês.
  >
  > **Correcção depois de fechada a fase** (2026-10-03, mesmo dia): o utilizador pediu
  > confirmação de que a Mayra já falava inglês, o que levou a rever outra vez todas as
  > 29 áreas à procura de texto solto — não apareceu nenhum (nem com útil `useTranslation`
  > em falta, nem texto por traduzir ao lado de texto já traduzido). Apareceu, sim, um
  > defeito mais subtil: `cleanTextForSpeech()` (`useGeminiVoice.ts`, voz de recurso do
  > browser quando a Gemini Live não está disponível) expandia `MZN`/`USD`/`kg`/`%` para
  > palavras portuguesas sempre, mesmo numa resposta em inglês — a frase lida ficava com
  > uma palavra em português a meio de uma frase inglesa. Corrigido: a detecção de língua
  > passa a correr sobre o texto em bruto, antes de qualquer substituição, com as duas
  > versões da expansão. `fix/mayra-voz-tts-ingles`, mesclado directamente (correcção
  > pequena e já verificada, sobre trabalho desta mesma fase já autorizado).

- **2026-10-03 · [FE] · Antonio Mambo** — `fix(i18n): tres falhas encontradas depois de
  fechada a Fase 20`

  > Três defeitos encontrados numa segunda passagem pelo produto em inglês, já depois de
  > fechada a Fase 20:
  >
  > - `CardCarousel` decidia grelha/carrossel pela largura da **janela**, não pela do seu
  >   próprio contentor — com o painel da Mayra aberto ao lado, a janela continuava larga
  >   mas o espaço do carrossel ficava espremido numa grelha de 5 colunas, cortando o texto
  >   dos cartões (mais visível em inglês, por o texto ser nalguns casos mais longo, mas o
  >   defeito já existia em português). Passa a decidir por `ResizeObserver` sobre o próprio
  >   componente.
  > - `site.css`: o CTA da barra do site público («Pedir demonstração») só se escondia abaixo
  >   de 560px, limiar pensado para o texto em português; entre 561 e 900px a barra não tinha
  >   espaço para logótipo + selector de idioma + dois botões sem transbordar, e só não
  >   transbordava em inglês por o texto ser mais curto. Passa a esconder-se no mesmo ponto do
  >   menu móvel (900px), com a acção reposta dentro do menu.
  > - `adoptarIdiomaSeNuncaEscolhido()` (`src/i18n/index.ts`): quando a conta nunca gravou
  >   uma língua, passa a adoptar a do browser no login — antes, escolher inglês como
  >   visitante não chegava a gravar-se na conta, e a mesma conta voltava a português noutro
  >   aparelho ou sessão. Ligado em `useAuthStore`, `useContaClienteStore` e `usePortalStore`.

### Fase 21 — Reservado do Compra Fácil no stock, favoritos e modelo Gemini centralizado (3 Out 2026)

- **2026-10-03 · [BE+FE] · Antonio Mambo** — itens do backlog «Compra Fácil» e «Infra /
  observação» pedidos directamente pelo utilizador, sem passar por «Fase em curso»
  (três correcções pontuais, não uma funcionalidade nova com plano próprio).

  > **Reservado por pedidos online, na listagem de stock.** `GetStockQueriesUseCase`
  > soma as `ReservaStock` activas por posição (produto × armazém,
  > `IStockRepository.getReservadoPorPosicoes`) e devolve `reservadoCommerce` em cada
  > linha; a tabela mostra «N reservadas para o Compra Fácil» sob o disponível. Antes de
  > implementar, verificou-se que o frontend já tem um mecanismo mais amplo
  > (`Stock.estados`, `RetencaoModal`, `useReservas`) — mas está desligado do backend
  > real (ver achado na Secção 3, «Infra / observação»), por isso o campo novo é
  > independente e não reutiliza esse caminho.
  >
  > **Favoritos (`FavoritoCliente`).** O modelo já existia no schema desde a Fase 11;
  > faltava a funcionalidade. Novo `FavoritoController` (`GET/POST /commerce/favoritos`,
  > `DELETE /commerce/favoritos/:produtoId`), idempotente nos dois sentidos (favoritar
  > duas vezes não duplica, desfavoritar o que já não está marcado não é erro), com
  > validação de que o produto pertence à empresa da conta. Frontend: botão de coração
  > no `ProdutoCartao` (mercado e catálogo de loja) e página «Os meus favoritos»
  > (`/loja/:lojaId/favoritos`), ligada no topo ao lado de «Os meus pedidos».
  >
  > **Modelo Gemini centralizado.** Novo `src/shared/gemini-model.ts`: as 8 chamadas
  > que recorriam a `'gemini-2.0-flash'` (retirado da API) quando `GEMINI_MODEL`
  > faltava passam a usar `modeloGeminiPadrao(config)`, que lança em vez de recair no
  > modelo morto. `main.ts` chama `validarModeloGeminiNoArranque()` antes de
  > `app.listen` — sem `GEMINI_MODEL`, a aplicação recusa-se a arrancar, com mensagem
  > clara, em vez de falhar horas depois num 404 sem relação óbvia com a causa.
  >
  > **Testes**: `adicionar-favorito.use-case.spec.ts` novo (produto de outra empresa
  > recusado; idempotência do `upsert`); dois mocks de `ConfigService` existentes
  > (`analisar-necessidades-mayra`, `analisar-excecao-mayra`) ajustados para incluir
  > `GEMINI_MODEL` — caíam no fallback antigo e passavam por acidente, mesmo simulando
  > um ambiente correctamente configurado. Catálogo de erros: nova chave
  > `commerce.favorito.produto_nao_encontrado` em `pt`/`en`. Backend 2335 (suite
  > completa), frontend 147 — ambos limpos; `tsc`/`npm run build` sem erros nos dois
  > repositórios.
  >
  > **Não implementado nesta entrega, por decisão ou âmbito** (itens dos mesmos dois
  > blocos do backlog que ficam por fazer — ver Secção 3 para o porquê de cada um):
  > cobrança M-Pesa/e-Mola no checkout; CRM/recomendações/promoções com risco de
  > stock; histórico de compras entre empresas; galeria de produto com várias fotos;
  > decisão `AGUARDA_CONFIRMACAO`/`AGUARDA_LEVANTAMENTO` (amarrada à migração da
  > Entrega ao Domicílio); confirmar em produção a estabilidade da voz da Mayra;
  > confirmar que a chave do Gemini pertence à facturação da SRG (verificação
  > administrativa, não código).
  >
  > **Achado durante a análise, fora de âmbito, não corrigido**: o sistema de
  > retenção manual de stock que o frontend já tem construído
  > (`RetencaoModal`/`useReservas`/`reservas.api.ts`, rotas `/stock/reservas`,
  > `/stock/:id/quarentena`, `/stock/:id/bloqueio`) não existe no backend — ver
  > entrada própria na Secção 3.

  > **Extensão da mesma entrega (2026-10-03, mesmo dia)**: pedido para avançar os
  > restantes sub-pontos dos blocos «Compra Fácil» e «Infra / observação» que fosse
  > possível implementar sem decisão nova.
  >
  > - **Confirmado pelo utilizador**: a voz da Mayra está estável em produção —
  >   fecha o item pendente desde as Fases 8–9.
  > - **`AGUARDA_CONFIRMACAO`/`AGUARDA_LEVANTAMENTO` removidos do enum
  >   `EstadoPedido`**, antecipando a decisão já tomada para a Entrega ao Domicílio
  >   (§4.1) — ver essa secção para o detalhe da migração
  >   (`20261003030000_remove_estados_mortos_pedido`) e o desvio ao plano (mapear
  >   para `CONFIRMADO`/`PRONTO`, não para `CRIADO`). Limpeza a acompanhar em
  >   `pedido-estado.ts`/`.spec.ts` e em quatro ficheiros de tradução do frontend
  >   (`loja`/`lojaGestao`, pt/en) que ainda listavam os dois estados.
  > - **Confirmado pelo utilizador**: a chave Gemini em produção é da facturação
  >   da SRG — fecha o item pendente desde 28/09/2026.
  > - **Esclarecimento do utilizador sobre "histórico de compras entre empresas"**:
  >   o pedido original da lista semanal não era sobre identidade de cliente entre
  >   empresas (que continua fora de âmbito, por contradizer o isolamento
  >   multi-tenant) — era sobre a loja/empresa ver o histórico das suas próprias
  >   vendas online. Resolvido: ver a entrada própria no backlog («Histórico de
  >   vendas online, por empresa/loja»).
  >
  > **Autorizado pelo utilizador e implementado nesta extensão** (revertendo a
  > avaliação anterior de que exigiam decisão de produto):
  >
  > - **Galeria de fotos do produto.** `GerirImagensProdutoUseCase` passa a
  >   acrescentar em vez de substituir (até 6 imagens por produto — `sharp`
  >   continua a converter tudo para WebP); a primeira imagem nasce principal,
  >   novos endpoints `PATCH .../imagens/:imagemId/principal` e
  >   `PATCH .../imagens/reordenar` trocam isso depois. ERP: grelha de miniaturas
  >   com estrela (definir principal) e remover. Compra Fácil: carrossel com
  >   miniaturas no detalhe do produto, em vez de uma imagem só.
  > - **Promoções com risco de stock.** Novo módulo `promocao`: modelo `Promocao`
  >   (desconto 1–90% por produto ou por categoria, com período), domínio puro
  >   `calcularRiscoStockPromocao` (heurística declarada: elasticidade assumida de
  >   1.5 — cada 10% de desconto sobe a procura esperada 15% sobre a média
  >   histórica de 30 dias; devolve `SEM_DADOS` sem histórico de vendas, nunca uma
  >   previsão inventada), `PrecoPromocionalService` (prioriza promoção directa do
  >   produto sobre a da categoria) e tool da MAYRA `assess_promotion_stock_risk`
  >   (avalia uma promoção hipotética, antes de criar). **O desconto é real, não
  >   só visual**: `CatalogoPublicoService` e `CriarPedidoUseCase` chamam o mesmo
  >   `PrecoPromocionalService` — o preço que o catálogo mostra é o preço que o
  >   checkout cobra. Só `Gestor`/`Admin` podem criar/cancelar (`promocao.gerir`,
  >   migração `20261003050000_promocao_permissoes`). Frontend: página
  >   `/promocoes` (criar com preview do risco antes de confirmar; listar;
  >   cancelar), preço promocional riscado + badge de desconto no detalhe do
  >   produto do Compra Fácil. Fica por fazer a *recomendação* automática (a MAYRA
  >   sugerir por iniciativa própria que promover) — ver item próprio no backlog.
  > - **Histórico de vendas online por empresa/loja.** Nenhum endpoint novo — o
  >   `ListarPedidosGestaoUseCase` já aceitava `estado=CONCLUIDO` e `lojaId`. Só
  >   faltava mostrar isso como histórico: `PedidosCommercePage` passa a somar e
  >   contar os pedidos concluídos num resumo visível quando esse filtro está
  >   activo.
  >
  > **Ainda não implementado** (sem novidade sobre a avaliação anterior):
  > cobrança M-Pesa/e-Mola no checkout (gateway, conta de comerciante, reembolsos
  > — ver Secção 3); CRM, recomendação por regras (a MAYRA sugerir promoções por
  > iniciativa própria — distinto da avaliação de risco, já feita); histórico de
  > compras entre empresas diferentes (identidade de cliente cross-tenant,
  > continua fora de âmbito).
  >
  > **Testes desta extensão**: `risco-stock-promocao.spec.ts` (5),
  > `preco-com-desconto.spec.ts` (2), `preco-promocional.service.spec.ts` (6) —
  > todos novos, domínio puro sem mocks de I/O onde possível. Backend 2352 (suite
  > completa), frontend 148 — ambos limpos; `tsc` sem erros nos dois repositórios.

### Fase 22 — Entrega ao domicílio, Fase 0: Preparar (6 Out 2026)

- **2026-10-06 · [BE+FE] · Antonio Mambo** — `feat/entrega-fase0-preparar`
  - feat(entrega): migração `20261005100000_entrega_domicilio` — só acrescenta: cinco
    enums, nove modelos, colunas novas em `Loja`, `Pedido`, `Venda` e
    `ComercioConfiguracao`, e as seis permissões da entrega
  - feat(permissoes): `entregas`, `estafetas`, `acertos_estafeta`, `zonas_entrega` e
    `webhooks` no editor de perfis (pt/en)

  > **O que entra.** Enums `TipoEntregaPedido`, `EstadoEntregaPedido` (não
  > `EstadoEntrega`, que é o das mensagens do CRM), `EstadoEstafeta`, `EstadoAcerto`,
  > `EstadoWebhookEnvio`; modelos `EnderecoCliente`, `ZonaEntregaLoja`, `Estafeta`,
  > `EntregaPedido`, `EventoEntrega`, `AcertoEstafeta`, `WebhookSubscricao`,
  > `WebhookEnvio`, `WebhookEventoRecebido` (mais a tabela de ligação estafeta–loja);
  > `Pedido` (+`tipoEntrega`, `enderecoId`, `taxaEntrega`), `Venda.taxaEntrega`,
  > `Loja.latitude/longitude`, `ComercioConfiguracao` (+`entregaActiva`,
  > `tempoPreparacaoMinutos`, `raioMaximoKm`, `permiteAgendamento`). Os pedidos existentes
  > ficam `LEVANTAMENTO` com taxa 0. Nada escreve nestas tabelas até à Fase 1/2.
  >
  > **Permissões.** `commerce.entrega.ler/gerir`, `estafeta.gerir`, `acerto.gerir`,
  > `zona_entrega.gerir`, `webhook.gerir`. `Gestor`: entregas (ler e gerir), estafetas,
  > acertos; `Funcionário / Caixa`: entregas só em leitura; `zonas_entrega` e `webhooks`
  > só ADMIN (*bypass*). Na migração **e** no `seed.ts` (senão o seed desfazia a migração).
  > `permissoes.guard.spec.ts` ganha um caso por permissão e um teste de que as raízes novas
  > não colidem com as existentes.
  >
  > **Desvios ao plano.**
  >
  > - **Os três estados novos de `EstadoPedido`** (`EXPEDIDO`, `EM_ROTA`, `FALHADA`)
  >   **não entram aqui**: sem escritor até à Fase 2 seriam o mesmo «estado morto» que a
  >   Fase 21 removeu. Entram na migração da Fase 2, com a classificação em
  >   `pedido-estado.ts` (D12).
  > - **`ZonaEntregaLoja` é por faixas de distância à loja** (haversine), não por
  >   província/cidade como `ZonaEntregaFornecedor`.
  > - **A §4.1 não definia os campos dos nove modelos** («como na versão anterior», que já
  >   não existia): desenhados nesta fase e aprovados pelo utilizador.
  > - **O SQL gerou-se por `prisma migrate diff` entre o `schema.prisma` do `main` e o
  >   novo**, sem *shadow database* — ver o achado abaixo.
  >
  > **Correcção à migração antes de ir para produção (2026-10-06).** Relendo a Fase 1
  > (US-01), a morada pedia província e o modelo só tinha cidade e bairro:
  > `EnderecoCliente.provincia` (obrigatória) acrescentada **na própria
  > `20261005100000_entrega_domicilio`**, que ainda não tinha sido publicada — não numa
  > migração nova. Quem já a aplicou à mão num branch de ensaio tem de o repor. O texto da
  > US-02 foi reescrito para só faixas de distância, como o schema.
  >
  > **Achado, fora de âmbito, não corrigido: o histórico de migrações não se reaplica do
  > zero.** Aplicada a uma base vazia, a `20260730125000_plano02_empresa_id_obrigatorio`
  > falha com «a tabela `copilot_sessions` não existe» (P3006). Consequência: `prisma
  > migrate dev` e `migrate diff --from-migrations` não funcionam (precisam de uma *shadow
  > database*), e uma máquina nova só sobe a partir de uma cópia da base existente. É a mesma
  > família de lacunas que o `fix(prisma): recupera a DDL do Inventário v1.1` já fechou uma vez.
  > Está no backlog (Secção 3, «Infra / observação»).
  >
  > **Verificação.** Backend 2359 testes e frontend 148, `tsc` limpo nos dois. Migração sem
  > nenhum `DROP`/`TRUNCATE`/`DELETE`. **Ensaiada num branch do Neon reposto a partir do
  > principal**, aplicando em SQL as quatro migrações que a produção ainda não tem (as três da
  > Fase 21 e esta), numa transacção: pedidos todos `LEVANTAMENTO` e taxa 0; `EstadoPedido`
  > sem os dois estados mortos; as 11 tabelas e o índice parcial das zonas; as 8 permissões
  > novas (6 da entrega + 2 das promoções) e as ligações certas aos perfis. **Limites:** o
  > branch tinha só 2 pedidos (verificação fraca dos valores por omissão) e aplicou-se à mão,
  > não por `prisma migrate deploy` — o caminho do arranque do contentor não foi exercitado.
  >
  > **Notas de deploy.**
  >
  > - A primeira publicação leva **quatro** migrações, não uma: as três da Fase 21 (que
  >   ainda não foram para produção) e esta. A `20261003030000` recria o enum
  >   `EstadoPedido` — convém um ponto de segurança (branch do Neon a partir do principal)
  >   antes de publicar.
  > - A Fase 21 trouxe uma validação que recusa o arranque sem `GEMINI_MODEL`: confirmar com
  >   `fly secrets list` (só mostra nomes) que está definido antes de publicar.
  > - Depois de publicar: invalidar `permissions:*` no Redis (cache de 24 h), senão quem não
  >   é ADMIN só vê as permissões novas no dia seguinte.
  > - `JWT_ESTAFETA_SECRET` está no `.env.example`, mas **nada o lê** até à Fase 4 — não é
  >   preciso nos `fly secrets` agora.
  > - Backend primeiro, frontend depois.

### Fase 23 — Entrega ao domicílio, Fase 1: O cliente escolhe entrega (6 Out 2026)

- **2026-10-06 · [BE+FE] · Antonio Mambo** — `feat/entrega-fase1-cliente-escolhe`
  - feat(entrega): módulo `entrega` — domínio puro (haversine, cálculo da taxa por faixas,
    validação de sobreposição), zonas (`/entregas/zonas`), configuração
    (`/entregas/configuracao`) e `CotarEntregaUseCase`
  - feat(commerce): moradas do cliente (`/commerce/enderecos`), cotação
    (`POST /commerce/entrega/cotacao`) e `tipoEntrega`/`enderecoId` no pedido, com a taxa
    recotada no servidor
  - feat(loja): `latitude`/`longitude` na loja; `entregaDisponivel` em `GET /commerce/lojas`
  - feat(compra-facil): moradas com mapa, escolha Levantar/Entregar no checkout, taxa e prazo
  - feat(entrega-gestao): ecrã de zonas e configuração (ADMIN), localização da loja, distintivo
    «Entrega» e morada na fila de pedidos

  > **Regras.** A taxa decide-se pela distância em linha recta loja→morada, em faixas
  > `[min, max)` por loja; zona inactiva é como se não existisse; duas zonas activas da mesma
  > loja não se sobrepõem (recusado ao gravar). `calcularTaxa` ordena os motivos de recusa:
  > entrega desactivada → loja sem coordenadas → acima do raio → fora de área → abaixo do
  > valor mínimo; cada um é um código com parâmetros, traduzido no frontend. O servidor
  > **recota** ao criar o pedido (nunca confia na taxa do cliente), antes de reservar stock, e
  > o valor mínimo avalia-se sobre o subtotal já com promoções. `totalFinal = subtotal + taxa`;
  > levantamento não cota nem cobra (testado). Activação por empresa (`entregaActiva`),
  > disponibilidade por loja (coordenadas + zona activa); ligar sem nenhuma loja pronta é 400.
  > Apagar uma morada desactiva-a; 409 se um pedido em curso a usa. Todas as consultas de
  > morada levam `clienteId` e `empresaId`.
  >
  > **Protecções.** `ConfirmarLevantamentoUseCase` recusa pedidos de entrega
  > (`commerce.levantamento.pedido_de_entrega`); a notificação «pronto» tem variantes de entrega
  > (pt/en); o botão de levantamento some do detalhe de gestão para esses pedidos.
  >
  > **Desvios ao plano.** (1) `ConferirPedidoUseCase` recalculava `totalFinal` sem a taxa — a
  > taxa desaparecia ao marcar o pedido como pronto; corrigido (`+ taxaEntrega`), com
  > a regressão coberta pelos testes do pedido. (2) `MapaEntrega` ficou em `src/shared/ui/mapa/`
  > e não em `compra-facil`, porque a gestão de lojas também o usa; continua a ser o único
  > ficheiro que conhece o Leaflet. (3) O texto do carrinho passou a «No levantamento ou na
  > entrega». (4) Namespace i18n novo `entrega` (gestão); os textos do cliente ficaram em
  > `loja`.
  >
  > **Verificação.** Backend: `tsc --noEmit` limpo, 2418 testes. Frontend: `tsc -b` limpo, 149
  > testes, `npm run build` (o mapa sai num chunk à parte, ~159 kB). **Não foi exercitado no
  > browser** nem contra a base de dados real.
  >
  > **Notas de deploy.**
  >
  > - Sem migração nova e sem variáveis de ambiente novas.
  > - `entregaActiva` continua desligada em produção: o checkout só mostra «Entregar» depois de
  >   uma loja ter coordenadas **e** zona activa **e** a empresa ligar a entrega. Até lá o
  >   comportamento é o de sempre.
  > - Os pedidos de entrega ficam em «Pronto» até à Fase 2 (despacho e estafeta).
  > - Os tiles do mapa vêm do servidor público do OpenStreetMap (uso moderado; atribuição
  >   obrigatória no mapa). Para tráfego sério, trocar `URL_TILES` em `MapaEntrega.tsx`.
  > - Backend primeiro, frontend depois (o frontend novo chama `/commerce/enderecos`).

### Fase 24 — Barra de navegação do site sem quebras de linha (6 Out 2026)

- **2026-10-06 · [FE] · Antonio Mambo** — `fix/navbar-site-quebra-de-linha`
  - fix(landing): as ligações da barra (`A operação`, `A Mayra`, `Como começa`, `Comprar online`)
    partiam em duas linhas e ficavam desalinhadas; ganham `white-space: nowrap` e o menu móvel
    passa a entrar abaixo de 1120px (era 900px)

  > A barra precisa de ~1100px para logótipo, seis ligações, selector e dois botões; entre 900 e
  > 1120px não cabia e as ligações de duas palavras quebravam. Frontend apenas; sem notas de deploy.

### Fase 25 — Localização da loja: separador próprio, GPS e atalho na lista (6 Out 2026)

- **2026-10-06 · [FE] · Antonio Mambo** — `fix/loja-localizacao-separador-e-gps`
  - fix(lojas): a localização da loja saiu do separador «Gestor principal» (onde ninguém a
    procurava) para um separador próprio, «Localização», em «Gerir Infraestrutura»
  - feat(lojas): botão «Usar a minha localização (GPS)», com aviso de precisão (>100 m) e
    escondido fora de contexto seguro; marcar no mapa continua possível e substitui o GPS
  - feat(lojas): a lista de lojas mostra se a localização está definida e abre o separador
    directamente

  > A localização decide se uma loja pode fazer entregas, e estava dois cliques e um scroll
  > dentro de um modal. O GPS não grava sozinho: preenche o pino e o gestor confirma em
  > «Guardar localização». Frontend apenas; sem migração nem variáveis novas.

### Fase 26 — Mapa e GPS: precisão, tamanho do mapa e posição à vista (7 Out 2026)

- **2026-10-07 · [FE] · Antonio Mambo** — `fix/mapa-gps-precisao-e-visibilidade`
  - fix(mapa): o GPS passa a ouvir o dispositivo até ~15 s (`watchPosition`) e fica com a posição
    de menor erro, em vez da primeira que `getCurrentPosition` devolve (Wi-Fi/IP, com centenas de
    metros ou quilómetros de erro); cada melhoria aparece no mapa
  - fix(mapa): o mapa remede-se ao mudar de tamanho (`invalidateSize` + `ResizeObserver`) — dentro
    do modal os tiles ficavam deslocados e mostravam outro sítio
  - feat(mapa): círculo com a margem de erro do GPS, coordenadas em texto e ligação «Ver no Google
    Maps» para conferir o ponto; aviso a amarelo acima de 100 m (loja e morada do cliente)

  > Utilitário `obterMelhorPosicao` em `src/shared/utils/geolocalizacao.ts`, com testes. Num
  > computador sem GPS a precisão continua fraca (a posição vem da rede): o aviso diz-o, e o
  > ponto deve ser marcado à mão. Frontend apenas; sem migração nem variáveis novas.

### Fase 27 — Transição de estado do pedido sem corrida (7 Out 2026)

- **2026-10-07 · [BE] · Antonio Mambo** — `fix/transitar-estado-pedido-concorrencia`
  - fix(commerce): `TransitarEstadoPedidoUseCase.transitar` passa a usar `updateMany` condicional
    ao estado esperado (e à empresa), verificando `count`; antes lia e depois fazia `update` por
    id, e dois funcionários a avançar o mesmo pedido passavam ambos

  > Antes, dois «confirmar» em simultâneo passavam ambos a validação e o segundo notificava o
  > cliente em duplicado. Agora só um vence; o outro recebe `commerce.pedido.estado_inesperado`
  > com o estado real e **não** notifica. Quatro testes novos (condição do update, corrida
  > perdida, estado inesperado, outra empresa). Pré-requisito da Fase 2 da entrega, que mexe nas
  > mesmas transições. Backend apenas; sem migração nem variáveis novas.

### Fase 28 — Entrega ao domicílio, Fase 2A: Despachar (7 Out 2026)

- **2026-10-07 · [BE+FE] · Antonio Mambo** — `feat/entrega-fase2a-despachar`
  - feat(entrega): migração `20261007100000_entrega_estados_pedido` — `EstadoPedido` +
    `EXPEDIDO`, `EM_ROTA`, `FALHADA` (só acrescenta)
  - feat(commerce): `ExpedirPedidoUseCase` e `POST /commerce/gestao/pedidos/:id/expedir` —
    despachar um pedido de entrega: sai o stock, nasce a venda e a `EntregaPedido`
  - feat(vendas): método `A_COBRAR_NA_ENTREGA` (só canal `ECOMMERCE`, sem troco, fora da gaveta)
    e `taxaEntrega` na venda, fora do COGS e da margem
  - fix(commerce,vendas): com a mercadoria na rua o pedido já não se cancela (400) nem a venda se
    anula (409)
  - feat(compra-facil-gestao): «Despachar» na gaveta do pedido, estados novos na fila
  - feat(compra-facil): passo «A caminho» e nota de entrega falhada no detalhe do pedido

  > **Ordem do despacho** (cada passo com a sua razão no comentário do código): (1) loja do caixa
  > = loja do pedido; (2) `updateMany` condicional `PRONTO → EXPEDIDO` com `count === 1`, que
  > decide entre dois despachos simultâneos; (3) reservas → `CONSUMIDA`; (4) `EntregaPedido` em
  > `AGUARDA_RECOLHA` com o destino copiado da morada, mais um `EventoEntrega`; (5) a venda;
  > (6) a conta a receber (`RECEITA`/`PENDING`, sem cliente). Vende o que a conferência decidiu
  > (`calcularItensFinais`, partilhado com o levantamento).
  >
  > **Dinheiro.** O pagamento é `A_COBRAR_NA_ENTREGA`: não conta para o saldo do caixa nem para o
  > fecho (só `NUMERARIO` conta — `numerarioLiquidoDaGaveta`, com testes). A taxa soma-se ao total
  > mas não entra na margem. O POS recusa este método e a taxa (só se passam por dentro).
  >
  > **Desvios ao plano.** (1) **Se a venda falhar, o despacho desfaz-se** (entrega e evento
  > apagados, reservas de volta, pedido em `PRONTO`), em vez de deixar «EXPEDIDO sem venda» como
  > no levantamento — aqui a falha não é rara (stock alterado, total que não bate). Se nem a
  > reversão correr, regista-se um erro bem visível. (2) `recusarLojaDiferenteDaDoCaixa` e
  > `calcularItensFinais` extraídas para funções (não para um provider), para os testes do
  > levantamento passarem **sem alteração**. (3) A Fase 2 dividiu-se em 2A (esta) e 2B.
  >
  > **Verificação.** Backend: `tsc --noEmit` limpo, 2477 testes (despacho: 13, incluindo «dois
  > funcionários criam uma só venda» e o desfazer). Frontend: `tsc -b` limpo, 155 testes. **Não foi
  > exercitado contra a base de dados real nem num browser.**
  >
  > **Risco que já existia e que o despacho herda — por resolver.** `ProcessarVendaUseCase`
  > recalcula o total a partir de `precoVenda` + IVA do catálogo, mas o pedido guarda o preço
  > **com promoção** e **sem IVA** (`CriarPedidoUseCase`). Um produto com IVA > 0 ou em promoção faz
  > o total da venda exceder o pedido e a venda falha com «pago insuficiente» — no levantamento (já
  > hoje) e agora no despacho (que desfaz e diz porquê). Só passa quando o IVA é 0 e não há
  > promoção. Registado no backlog; precisa de decisão (o preço do pedido manda, ou o do catálogo?).
  >
  > **Notas de deploy.**
  >
  > - **Uma migração nova**, só `ALTER TYPE ... ADD VALUE` ×3 (um valor de enum não se retira):
  >   branch de segurança no Neon antes de publicar.
  > - Sem variáveis novas. Backend primeiro, frontend depois.
  > - **Não activar a entrega numa loja real** antes da Fase 2B: um pedido despachado fica em
  >   `EXPEDIDO` sem forma de o fechar (entregar, falhar, devolver).
  > - Invalidar `permissions:*` só se ainda não foi feito desde a Fase 22.

### Fase 29 — Entrega ao domicílio, Fase 2B: Operar (7 Out 2026)

- **2026-10-07 · [BE+FE] · Antonio Mambo** — `feat/entrega-fase2b-operar`
  - feat(entrega): estafetas (`/entregas/estafetas`, código `E####` e senha gerados pelo servidor,
    mostrados uma só vez, «repor senha»)
  - feat(entrega): operar a entrega à mão — atribuir, recolher, iniciar rota, entregar, falhar
    (`PATCH /entregas/:id/...`), com `EventoEntrega` imutável e aviso ao cliente
  - feat(entrega): painel (`GET /entregas`, `GET /entregas/:id`) e **devolver**
    (`POST /entregas/:id/devolver`: repõe o stock e anula a venda)
  - fix(vendas): `AnularVendaUseCase` aceita a sessão de caixa fechada quando a venda é de entrega
    sem numerário; a reversão do pedido aceita `FALHADA`
  - feat(entrega-gestao): páginas «Entregas» (painel por estados) e «Estafetas», com diálogos de
    atribuir, entregar, falhar e devolver

  > **Uma só forma de transitar.** `OperarEntregaService.transitar` faz, numa transacção: (1) a
  > entrega muda por `updateMany` condicional ao estado de onde a operação é permitida, (2) o pedido
  > muda por `updateMany` condicional ao estado em que é coerente, (3) grava-se o evento. Dois gestores a
  > avançar a mesma entrega: só um passa, o outro recebe 409. Se o pedido já não estiver onde devia,
  > desfaz-se tudo (`entrega.pedido_incoerente`). O autor é um parâmetro (`FUNCIONARIO` agora): a
  > Fase 4 reutiliza o serviço para o `ESTAFETA`. As transições estão por extenso em
  > `entrega/domain/entrega-estado.ts`, com teste de invariante.
  >
  > **Devolver** corre em dois tempos e é seguro de repetir: (1) `AnularVendaUseCase` (a parte
  > irreversível, com a sua guarda de concorrência; «já anulada» não é erro); (2) numa transacção,
  > `FALHADA → DEVOLVIDA` e conta a receber `PENDING → CANCELLED`, ambos condicionais. Só um gestor
  > (a anulação já o exige). A sessão de caixa fechada só se aceita para venda de entrega **sem
  > numerário**; uma venda de POS com a sessão fechada continua recusada (teste de regressão).
  >
  > **Decisões do utilizador (as seis do plano, com as recomendações):** credenciais geradas pelo
  > servidor; login pelo código `E####`; «em entrega» deriva-se das entregas em curso (o gestor só
  > marca disponível/indisponível); `falhar` vale de qualquer estado antes de `ENTREGUE` (substitui
  > `cancelar`); atribuir só a estafeta activo da mesma loja (ou sem lojas = serve todas); entregar
  > grava método, referência (obrigatória fora do numerário) e hora — o valor é o `valorACobrar`.
  >
  > **Desvios ao plano.** (1) Cinco casos de uso viraram **um serviço** (`OperarEntregaService`) com
  > cinco operações, porque partilham a transacção. (2) `entregar` também vale a partir de
  > `RECOLHIDA` (salta `EM_ROTA`): com o gestor a marcar à mão, um clique que não diz nada de novo só
  > convidava a deixar o estado por actualizar. (3) `NotificarClientePedidoService` é registado
  > **também** no `EntregaModule` (instância sem estado) em vez de importado do `CommerceModule`:
  > importá-lo fechava um ciclo commerce ⇄ entrega. (4) `VendasModule` passa a exportar
  > `AnularVendaUseCase`. (5) `EntregaController` tem de ser o **último** do módulo (`GET /entregas/:id`
  > apanharia `zonas`, `configuracao` e `estafetas`).
  >
  > **Verificação.** Backend: `tsc --noEmit` limpo, 2563 testes; o `AppModule` compila e resolve as
  > dependências (verificado com um teste descartável). Frontend: `tsc -b` limpo, 155 testes, build.
  > **Não foi exercitado contra a base de dados real nem num browser.**
  >
  > **Por fazer / limites.** A ligação do detalhe do pedido da gestão à sua entrega não foi feita
  > (o painel mostra o número do pedido). O estafeta ainda não tem aplicação nem login (Fase 4): as
  > credenciais ficam gravadas e prontas. A diferença entre o que se cobrou e o que devia e o acerto de
  > contas são da Fase 3. **O risco do total da venda (IVA e promoções, Fase 28) continua por
  > resolver e bloqueia a entrega real.**
  >
  > **Notas de deploy.**
  >
  > - **Sem migração nova e sem variáveis novas.**
  > - Backend primeiro, frontend depois.
  > - Invalidar `permissions:*` no Redis se ainda não foi feito desde a Fase 22 (a gestão usa
  >   `VER_ENTREGAS`, `GERIR_ENTREGAS` e `GERIR_ESTAFETAS`).
  > - **Não activar a entrega numa loja real** antes de decidir o preço (IVA/promoções) e de ensaiar o
  >   fluxo completo numa loja piloto.

---

## 3. Backlog — Por Fazer

> Checklist viva. Ao concluir um item, mudar para `- [x]` e acrescentar a entrada
> correspondente na Secção 2 (nova fase ou item dentro da fase em curso), no mesmo
> commit/PR.

### Compra Fácil

- [ ] **CRM, recomendação por regras** (Compra Fácil) — a MAYRA sugerir, por
      iniciativa própria, que produtos promover. Distinto do item de promoções
      abaixo, já resolvido: aqui falta a parte de *recomendação*, não a de
      *avaliação*. Fonte: `plano_feature_compra_facil.md` §8.3 (documento de
      planeamento já removido do `Docs/` por estar superado; texto completo no
      histórico git, commit `feat/compra-facil-fase11`).
- [x] `FavoritoCliente` — resolvido em 2026-10-03 (Fase 21): endpoints
      `GET/POST /commerce/favoritos`, `DELETE /commerce/favoritos/:produtoId`, botão
      de coração no cartão de produto e página «Os meus favoritos».
- [x] **Promoções com verificação de risco de stock** — resolvido em 2026-10-03
      (Fase 21): novo módulo `promocao` (desconto por produto ou categoria, com
      período), tool da MAYRA `assess_promotion_stock_risk`, e o desconto aplicado
      de verdade no catálogo público e no checkout (não é só visual). Ver §4.3 para
      o detalhe. Fica a faltar a *recomendação por regras* (item acima).
- [ ] Histórico de compras entre empresas diferentes — hoje "lojas onde já
      comprei" só vê a empresa da `ContaCliente` autenticada actual (Fase 13);
      exigiria um projecto de identidade de cliente entre empresas, fora do
      âmbito do mercado. **Não confundir** com o item seguinte, que é outra coisa.
- [x] Histórico de vendas online, por empresa/loja — resolvido em 2026-10-03 (Fase
      21). Pedido esclarecido pelo utilizador: não é sobre identidade de cliente
      entre empresas (item acima), é sobre o **lojista** ver o que já vendeu online.
      `ListarPedidosGestaoUseCase` já aceitava filtrar por `estado=CONCLUIDO` e por
      loja — só faltava um resumo visível; a fila de gestão (`PedidosCommercePage`)
      mostra agora a contagem e o total vendido quando esse filtro está activo.
- [x] Galeria de produto com várias fotos no mercado — resolvido em 2026-10-03
      (Fase 21): `GerirImagensProdutoUseCase` passa a acrescentar em vez de
      substituir (até 6 imagens), com `definirPrincipal`/`reordenar`; o ERP mostra
      a grelha e o Compra Fácil mostra um carrossel com miniaturas.
- [x] Mostrar no ecrã de stock quanto está reservado por pedidos online — resolvido
      em 2026-10-03 (Fase 21): `GetStockQueriesUseCase` soma as `ReservaStock`
      activas por posição (produto × armazém) e a tabela de stock mostra a legenda
      sob o disponível. Independente do mecanismo `estados`/retenção manual — ver
      achado fora de âmbito mais abaixo.
- [x] Devolução de uma compra online entrava no CRM como `DEVOLUCAO_POS`/canal
      `POS` — resolvido em 2026-09-22 (Fase 14), com `DEVOLUCAO_ECOMMERCE` novo
      no enum `TipoEventoCliente`.
- [x] Anular a venda não revertia o pedido — resolvido em 2026-09-22 (Fase 14):
      o pedido passa a `CANCELADO` dentro da transacção de anulação.
- [x] `AGUARDA_CONFIRMACAO` e `AGUARDA_LEVANTAMENTO` existem em `EstadoPedido`
      mas nenhum código os escreve — resolvido em 2026-10-03 (Fase 21): removidos do
      enum, antecipando a decisão já tomada para a migração da Entrega ao Domicílio
      (ver nota nessa secção).
- [x] Atribuir `commerce.pedido.ler` e `commerce.pedido.gerir` aos perfis das
      lojas — resolvido em 2026-09-29 (Fase 16): migração
      `20260929090000`, e o cargo passa a escolher o perfil de sistema. Verificado
      em produção com um Caixa.
- [ ] Criar perfis próprios de empresa e atribuí-los a utilizadores. Hoje o ecrã
      de utilizadores só grava o cargo e não há endpoint para ligar um utilizador a
      um perfil; os perfis de sistema, que o cargo usa, são comuns a todas as
      empresas e só a SRG os altera. Uma empresa que queira permissões diferentes
      das do perfil do seu cargo não tem como. Encontrado em 2026-09-29.
- [ ] O menu mostra «Pedidos Compra Fácil» a Armazenistas, que recebem 403 — o
      perfil «Armazenista» não tem `pedidos_commerce` (assunção 10 da §4.1). Ou se
      tira o item do menu a esse cargo, ou se dá a permissão se o picking for dele.
- [ ] Cobrança no checkout com gateway M-Pesa/e-Mola. Hoje o método de pagamento
      do pedido é só uma intenção (`schema.prisma`, modelo `Pedido`) e o valor é
      cobrado fisicamente no levantamento. Passar a cobrar no checkout torna o
      pedido um facto financeiro imediato, mas traz reembolsos, conciliação de
      pagamentos e tratamento de pagamento falhado — é projecto próprio, não
      correcção.

### Entrega ao domicílio (Compra Fácil)

Funcionalidade nova, planeada em 2026-09-22 — ainda **sem código**. Acrescenta ao
Compra Fácil a opção "receber em casa", com estafeta, rastreio no mapa e acerto de
contas do dinheiro cobrado na porta. O levantamento em loja não muda.

- Plano técnico (decisões, alternativas, riscos) e backlog da equipa (22 histórias,
  6 sprints, 124 pontos — revisto em 2026-09-24): **§4.1** deste documento.

**Decisão central, já tomada:** a venda nasce na **expedição**, não na entrega
(`ProcessarVendaUseCase` exige sessão de caixa aberta, e quando a entrega se
confirma o turno pode já estar fechado). O dinheiro cobrado na porta **não** entra
no caixa nesse momento — fica como conta a receber do estafeta até ao acerto.

- [x] **Fase 0 — Desbloquear.** Decidido pelo Product Owner em 2026-09-29 (§4.1, §7):
      (1) **Leaflet + OpenStreetMap** (gratuito; o Google Maps chegou a
      ser escolhido e foi trocado no mesmo dia); (2) `Pedido.estado` **espelha** a entrega;
      (3) um estafeta **pode servir várias lojas** da empresa; (4) **remover**
      `AGUARDA_CONFIRMACAO`/`AGUARDA_LEVANTAMENTO` — **antecipado para 2026-10-03
      (Fase 21), fora desta migração**: não dependiam de nenhuma decisão da entrega
      em si, só da remoção em si, e ficar à espera só atrasava uma limpeza já
      decidida. A migração da entrega já nasce sem eles no enum.
- [x] **Fase 0 — Preparar.** Concluída em 2026-10-06 (Fase 22): migração
      `20261005100000_entrega_domicilio` (não destrutiva, ensaiada num branch do Neon),
      permissões ligadas a perfis na migração e no seed, `.env.example`. **Desvio:** os
      três estados novos de `EstadoPedido` ficam para a migração da Fase 2.
- [ ] Coordenadas (`latitude`/`longitude`) das lojas piloto — as colunas existem desde a
      Fase 22, mas nenhuma loja as tem preenchidas. **Bloqueia a activação**: sem elas (e sem
      uma zona activa) a loja não oferece entrega no checkout.
- [ ] `JWT_ESTAFETA_SECRET` nos `fly secrets` — só antes do deploy que o passe a ler
      (Fase 4); já está no `.env.example`.
- [x] **Fase 1 — O cliente escolhe entrega.** Concluída em 2026-10-06 (Fase 23): moradas
      do cliente, zonas por loja com taxa e prazo, cotação, e escolha entrega/levantamento no
      checkout com a taxa como linha própria. **Desvio:** corrigido o total do pedido na
      conferência, que perdia a taxa. `entregaActiva` fica desligada até haver lojas piloto.
- [x] **Fase 2A — Despachar.** Concluída em 2026-10-07 (Fase 28): migração dos estados
      `EXPEDIDO`/`EM_ROTA`/`FALHADA`, «Despachar» (sai o stock, nasce a venda e a entrega),
      pagamento `A_COBRAR_NA_ENTREGA`, e os dois buracos fechados (com a mercadoria na rua o
      pedido não se cancela nem a venda se anula). **Desvio:** o despacho desfaz-se se a venda
      falhar. **Não activar a entrega numa loja real antes da 2B.**
- [x] **Fase 2B — Operar.** Concluída em 2026-10-07 (Fase 29): estafetas (credenciais geradas pelo
      servidor, mostradas uma vez), atribuir / recolher / rota / entregar / falhar, painel de entregas e
      devolver (stock reposto, venda anulada, mesmo com o caixa de quem despachou já fechado). **A partir
      daqui já se opera entregas a sério**, com o gestor a marcar os estados à mão. **Desvios:** um
      serviço único para as cinco operações; `entregar` também a partir de `RECOLHIDA`. **Por fazer:** a
      ligação do detalhe do pedido à sua entrega.
- [ ] **Total da venda vs. total do pedido** (risco que já existia, visto na Fase 28):
      `ProcessarVendaUseCase` usa `precoVenda` + IVA do catálogo; o pedido guarda o preço com
      promoção e sem IVA. Com IVA > 0 ou promoção, o levantamento e o despacho falham com
      «pago insuficiente». Decidir qual dos preços manda e alinhar. Antes da 2B, para a
      entrega poder ir para produção.
- [ ] **Fase 3 — As contas batem.** Valor cobrado na entrega, acerto de contas do
      estafeta a gerar `MovimentoCaixa(REFORCO)`, visão do que cada estafeta deve.
- [ ] **Fase 4 — O estafeta na rua.** Aplicação web (PWA) com login próprio:
      aceitar, recolher, entregar, falhar. Atribuição automática por proximidade
      é opcional e corta-se sob pressão de prazo.
- [ ] **Fase 5 — Rastreio ao vivo.** Namespace WebSocket `/entregas` que aceita
      funcionário, cliente e estafeta, cada um na sua sala; mapa no detalhe do
      pedido, com recurso a consulta periódica quando não há WebSocket. Inclui o
      rasto do percurso, a rota prevista e o tempo estimado de chegada (serviço de
      rotas externo — fornecedor por decidir, ver US-19b na §4.3).
- [ ] **Fase 6 — Webhooks.** Saída pelo padrão *outbox* (assinatura HMAC, recuo
      exponencial) e entrada assinada e idempotente, para um operador de entregas
      externo poder substituir a frota própria.
- [x] Ligar as permissões novas da entrega aos perfis de sistema `Gestor` e
      `Funcionário / Caixa` — feito em 2026-10-06 (Fase 22), na migração e no seed;
      `zonas_entrega` e `webhooks` só ADMIN. Texto original: **na migração e no `seed.ts`** — o seed apaga e recria
      as ligações dos perfis de sistema, e desfaria a migração. A parte do commerce
      (`pedidos_commerce`, que o "Despachar" exige) ficou feita em 2026-09-29 —
      Fase 16; seguir o mesmo padrão da migração `20260929090000`.
- [x] Defeito pré-existente: `TransitarEstadoPedidoUseCase.transitar` lia o pedido e só
      depois o actualizava, sem update condicional atómico. Corrigido em 2026-10-07
      (Fase 27), com `updateMany` condicional ao estado e testes.
- [ ] Base de PWA no frontend (`vite-plugin-pwa`, manifest, service worker) para a
      Fase 4 — **não existe hoje** e não está estimada no plano da entrega.
      Encontrado no planeamento multilíngue (2026-09-28).

### Multilínguas (internacionalização)

Funcionalidade nova, planeada em 2026-09-28 — ainda **sem código**. Interface,
mensagens do servidor, e-mails e Mayra na língua de cada pessoa, com o português
como origem e recurso final. Não inclui traduzir o conteúdo escrito pelos
utilizadores (produtos, campanhas).

- Plano técnico: **§4.2** deste documento.
- Tamanho: ~2.500–3.500 textos no frontend (176 `.tsx`); ~580 mensagens de erro,
  16 e-mails e 65 ferramentas da Mayra no backend. Hoje não há biblioteca de
  tradução em nenhum dos lados, nem campo de língua em nenhum utilizador.

**Decisões centrais propostas:** `i18next` no frontend e `nestjs-i18n` no backend;
erros com chave estável (`codigo`) traduzida por um filtro global, para
`mensagemDeErro()` não mudar; preferência `idioma` por utilizador, com recurso à
língua da empresa e à do browser; moeda sempre MZN, só a formatação muda.

- [x] **Fase 0 — Decidir.** Decidido pelo Product Owner em 2026-09-29 (§4.2, §7):
      (1) **português e inglês**; (2) começar pelo **Compra Fácil e pelo portal do
      fornecedor**; (3) a infraestrutura entra **antes** da entrega ao domicílio.
- [x] **Fase 1 — Infraestrutura.** Migração `idioma_utilizadores` (não destrutiva:
      `idioma` em `User`, `ContaCliente`, `UtilizadorFornecedor`; `idiomaPadrao` em
      `Empresa`); `nestjs-i18n`, filtro de tradução e `ValidationPipe` traduzido
      (hoje as mensagens do `class-validator` saem em inglês); `i18next` com
      `Accept-Language` no axios; selector de língua; `formatMoeda`/`formatData`
      pela língua activa, substituindo as 143 chamadas `toLocale*` com cinco locales
      diferentes; testes de paridade de chaves.
- [x] **Fase 2A — Compra Fácil e login.** Concluída em 2026-10-01 (Fase 19).
- [x] **Fase 2B — Portal do fornecedor e mercado.** Concluída em 2026-10-03 (Fase 20):
      o portal e o mercado público, as etiquetas de `portal.api.ts`/`mercado.api.ts`, os
      formatadores, 28 erros do `b2b` e o e-mail de boas-vindas ao fornecedor (ganhou
      `idioma`, gravado no registo).
- [x] **Fase 2C — Site público e adesão.** Concluída em 2026-10-03 (Fase 20):
      `copywriting.ts` substituído pelo namespace `site` (`useCopy()`), `precos.dados.ts`
      reduzido a números e códigos, a landing, o pedido de adesão público (que ganhou
      `idioma`, gravado no pedido) e os e-mails de adesão/boas-vindas na língua de quem
      pediu.
- [x] **Fase 3 — ERP e POS.** Concluída em 2026-10-03 (Fase 20): extracção por feature,
      todas as 24 áreas do ERP e o POS, com `SelectorIdioma` também acessível no menu
      móvel.
- [x] **Fase 4 — Servidor e Mayra.** Concluída em 2026-10-03 (Fase 20): `codigo` +
      catálogo generalizado a todos os módulos do backend restantes; a Mayra responde
      por omissão na língua preferida do utilizador no chat, na voz e nas duas análises
      assíncronas (necessidades, excepções de inventário), com a cache separada por
      língua (R3).
- [ ] Revisão das traduções em inglês por uma pessoa fluente (§4.4), de todas as fases
      1 a 4 — decisão de 2026-10-01: publicar com a tradução de Claude e rever depois.
- [ ] Regra de lint que proíba texto solto em JSX nas pastas já migradas (§4.4) — não
      implementada; as 24 áreas do ERP e o POS (Fase 3) dependem por agora só da revisão
      humana para não reintroduzir texto fixo.
- [x] Defeito pré-existente, encontrado no planeamento: `index.html` declara
      `lang="en"` com a interface em português — afecta leitores de ecrã e a
      tradução automática do browser. Corrige-se na Fase 1.

### Login com Google (Compra Fácil)

- [x] Configurar `GOOGLE_CLIENT_ID`/`VITE_GOOGLE_CLIENT_ID` reais em produção
      (Google Cloud Console) — configurado e confirmado funcional em produção
      em 2026-09-21 (Fase 12).
- [ ] Estados de loading/erro dedicados à volta do `<GoogleLogin>` — falta
      confirmar se o comportamento por omissão do componente chega.

### Infra / observação

- [x] Confirmar em produção, com tráfego real, que as correcções de voz da Mayra
      (Fases 8–9) resolveram definitivamente a latência e os turnos perdidos na
      Gemini Live API — confirmado pelo utilizador em 2026-10-03: a voz está estável.
- [x] Trocar o modelo por defeito do Gemini no código — resolvido em 2026-10-03
      (Fase 21): `src/shared/gemini-model.ts` centraliza as 8 chamadas que recorriam
      a `'gemini-2.0-flash'` (modelo retirado da API); `main.ts` recusa o arranque,
      com mensagem clara, se `GEMINI_MODEL` faltar.
- [x] Verificar se a chave do Gemini em produção pertence ao projecto Google e à
      facturação da SRG — confirmado pelo utilizador em 2026-10-03: a chave é da
      empresa SRG.
- [x] Teste instável `bater-ponto.use-case.spec.ts` — resolvido em 2026-09-29 (Fase 17):
      relógio fixo no teste, testes no fuso de Maputo e `TZ` no servidor, que
      corria em UTC e calculava o atraso do ponto 2 h ao lado.
- [ ] Fuso horário por empresa — hoje o servidor inteiro corre em
      `Africa/Maputo` (`fly.toml`). Só é preciso se o SaaS for vendido fora de
      Moçambique; entra com a §4.2 (Multilínguas) ou antes, se aparecer um cliente
      noutro fuso.
- [ ] **Achado fora de âmbito, não corrigido (2026-10-06): o histórico de migrações não se
      reaplica do zero.** A `20260730125000_plano02_empresa_id_obrigatorio` falha numa base
      vazia («a tabela `copilot_sessions` não existe», P3006), pelo que `prisma migrate dev` e
      `migrate diff --from-migrations` não funcionam e uma máquina nova só sobe a partir de
      uma cópia da base. Não está claro quantas migrações têm este defeito — só a primeira a
      falhar aparece. Corrigir exige uma *baseline*: uma migração inicial com o esquema
      actual, marcada como já aplicada em produção (`migrate resolve`) — projecto à parte.
- [ ] **Achado fora de âmbito, não corrigido (2026-10-03):** o frontend do stock
      (`RetencaoModal`, `useReservas`, `reservas.api.ts`) chama
      `/stock/reservas`, `/stock/:id/quarentena`, `/stock/:id/bloqueio` e os
      endpoints de libertação — **nenhum existe no backend**
      (`stock.controller.ts` não os declara). Qualquer clique em "Reservar",
      "Quarentena" ou "Bloquear" no ecrã de stock dá 404. O mesmo vale para
      `Stock.estados` (reservado/quarentena/bloqueado/disponível): o tipo é
      opcional e nunca chega preenchido da listagem real — é código escrito a
      antecipar um backend que não foi implementado. Encontrado ao verificar que
      "mostrar reservado por pedidos online" (acima) não colidia com este
      mecanismo; ficou de fora por ser um projecto à parte (cinco endpoints e o
      cálculo de `EstadosDaPosicao` no servidor), não uma correcção pontual.

---

## 4. Planos de funcionalidades

> Cada funcionalidade planeada e por concluir tem aqui o seu plano completo — análise,
> decisões, riscos, plano técnico e, quando existe, o backlog da equipa. **Não há
> ficheiros de plano separados:** este documento é o único sítio onde os planos vivem,
> e por isso são iguais nos dois repositórios.
>
> Dentro de cada subsecção, as referências «§N» são à numeração do próprio plano, que
> os títulos mantêm. O item correspondente na Secção 3 é o resumo em checklist.

| # | Funcionalidade | Estado | Checklist |
| --- | --- | --- | --- |
| 4.1 | Entrega ao domicílio (Compra Fácil) | Em curso — Fases 0 (Fase 22), 1 (Fase 23), 2A (Fase 28) e 2B (Fase 29) concluídas; a seguir a Fase 3 (as contas batem) | Secção 3 → «Entrega ao domicílio» |
| 4.2 | Multilínguas (internacionalização) | Concluído em inglês — Fases 0 a 4 (Fases 18 a 20); falta a revisão humana das traduções | Secção 3 → «Multilínguas» |
| 4.3 | Promoções com risco de stock (Compra Fácil) | Implementado — 2026-10-03 (Fase 21) | Secção 3 → «Compra Fácil» |

### 4.1 Entrega ao domicílio (Compra Fácil)

- **Data**: 2026-09-22 · **revisto** 2026-09-24 (ver §0)
- **Estado**: Aprovado — decisões do Product Owner de 2026-09-29 (§7). Começa depois da
  Fase 1 da §4.2 (infraestrutura de tradução), para os ecrãs novos nascerem traduzíveis.
- **Âmbito**: Fullstack (Backend + Frontend + Infra)
- **Repositórios afectados**: `ControleCore_BackEnd`, `ControleCore_FrontEnd`
- **Backlog da equipa**: no fim desta secção (histórias e sprints)

---

#### 0. Revisão de 2026-09-24 — o que mudou e porquê

A primeira versão foi escrita antes de quatro commits que tocam directamente nas peças
que este plano usa (`cfd1eb9`, `2b5f83c`, `a6d8ad1`, `af68cdd`), e antes de se ler o
backlog do `plano_implementacao.md`. A revisão confrontou cada afirmação com o código
actual de `main`. Correcções:

| # | O que estava | O que passa a estar | Origem |
| --- | --- | --- | --- |
| 1 | Diagrama com `PRONTO → AGUARDA_LEVANTAMENTO → CONCLUIDO` | `PRONTO → CONCLUIDO`. `AGUARDA_CONFIRMACAO` e `AGUARDA_LEVANTAMENTO` existem no enum mas **nenhum código os escreve**. Decisão sobre eles passa a pergunta bloqueante 4 | `grep` em `src/` · backlog |
| 2 | 4 valores novos em `EstadoPedido` (incl. `ENTREGUE`) | **3**: `EXPEDIDO`, `EM_ROTA`, `FALHADA`. `ENTREGUE` vive só na `EntregaPedido`; o pedido fecha em `CONCLUIDO`, como o levantamento | Simplificação |
| 3 | "Pagamento na entrega vira conta a receber do estafeta" — sem dizer como se regista na venda | Método de pagamento novo **`A_COBRAR_NA_ENTREGA`**, e conta a receber **sem `clienteId`** (D3) | `FecharSessaoCaixaUseCase` · `InadimplenciaScheduler` |
| 4 | `DevolverEntregaUseCase` reimplementava stock + venda + pedido, assinado por `SYSTEM_COMMERCE` | **Reutiliza `AnularVendaUseCase`**, que já faz tudo isso desde `af68cdd`. Exige gestor. Dois ajustes nele (D11) | `af68cdd` |
| 5 | — | `AnularVendaUseCase` passa a **recusar** enquanto a mercadoria está com o estafeta (risco R11) | `af68cdd` |
| 6 | — | `CancelarPedidoGestaoUseCase` passa a recusar a partir de `EXPEDIDO` (risco R12) | `2b5f83c` |
| 7 | — | A expedição reutiliza a verificação "caixa da mesma loja do pedido" | `a6d8ad1` |
| 8 | Regra 7: "a reserva não expira depois de confirmado — já é assim" | **Agora** é assim (não era quando foi escrito). Os estados novos não entram em `ESTADOS_QUE_A_EXPIRACAO_LIBERTA` | `cfd1eb9` |
| 9 | Permissões `VER_ENTREGAS`… sem ligação ao mecanismo real | Convenção real documentada (§3.1), `ACERTAR_CONTAS_ESTAFETA` → `GERIR_ACERTOS_ESTAFETA`, ligação a perfis na migração **e** no seed | Migração `20260920070000` · `PermissoesGuard` · `seed.ts` |
| 10 | Referências por número de linha | Referências por símbolo. O schema mudou e as linhas deslocaram-se (ex.: `enum EstadoEntrega` passou de 918 para 922) | — |

---

#### 1. Objectivo

O Compra Fácil v1 só sabe uma coisa: o cliente compra online e vai levantar à loja.
Isso limita o e-commerce ao raio de quem está disposto a deslocar-se, e deixa a loja
sem o canal que mais cresce em Maputo — a entrega ao domicílio. Este plano abre esse
canal: o cliente escolhe uma morada no checkout, paga a taxa correspondente à zona,
acompanha o estafeta no mapa e recebe em casa; a loja despacha, sabe onde está cada
entrega, e acerta contas com o estafeta no fim do turno.

A decisão de adiar isto está escrita no próprio schema, no comentário do bloco
*COMMERCE — COMPRA FÁCIL*: *«A entrega ao domicílio foi deliberadamente adiada para
uma fase própria, desenhada sobre a lógica de aplicações de entrega (estafeta com
localização em tempo real), em vez de um campo de texto que teria de ser substituído
mais tarde.»* **Este documento é essa fase.**

---

#### 2. Requisito interpretado

Construir o *last-mile* do Compra Fácil: uma entidade de entrega com ciclo de vida
próprio (`EntregaPedido`), atrelada ao `Pedido` mas não confundida com ele; moradas
de cliente georreferenciadas; zonas de entrega com taxa e raio por loja; estafetas
com uma aplicação web própria (PWA) que emite posição; rastreio em tempo real para o
cliente; e uma camada de webhooks — de saída e de entrada — que permite que um
operador de entregas externo substitua a frota própria sem reescrever o domínio.

**Onde a leitura diverge do literal do pedido:** o pedido fala de «como funciona o
webhook» como se o webhook fosse o mecanismo de comunicação com o estafeta. Não é:

| Quem comunica | Mecanismo | Porquê |
| --- | --- | --- |
| Estafeta da frota própria (PWA) | REST + WebSocket (`socket.io`) já existentes | É código nosso, autenticado por token nosso. Um webhook aqui seria uma volta ao quarteirão. |
| Operador de entregas **externo** (Fase 6) | Webhook de **entrada** (ele chama-nos) + webhook de **saída** (nós chamamo-lo) | É código de terceiros, que não pode manter uma ligação persistente à nossa API nem conhecer os nossos tokens internos. |
| Sistemas do próprio lojista (ERP, BI, bot de WhatsApp) | Webhook de **saída** | Integração sem *polling*. |

**O webhook é a fronteira com o mundo exterior, não o transporte interno.** A §4.2.4
descreve o mecanismo completo.

##### Modelo de referência: iFood vs Amazon

| Eixo | iFood | Amazon | Escolha aqui |
| --- | --- | --- | --- |
| Horizonte | Minutos. Uma entrega, um estafeta | Dias. Rede de armazéns, transportadoras | **iFood** — a loja entrega da sua loja, no mesmo dia |
| Facto financeiro | Nasce na aceitação | Nasce na expedição (*shipment*) | **Amazon** — a venda nasce na expedição (D2) |
| Rastreio | Posição ao vivo | Eventos discretos (*scan events*) | **Ambos** — eventos persistidos, posição efémera (D6) |
| Falha de entrega | Devolve à origem | Reagenda, ponto de recolha | **iFood** — devolve à loja, com reposição de stock |
| Cobrança | Pré-paga | Pré-paga | **Nenhum** — em MZ paga-se na porta, e é o caso difícil (D3) |

##### Actores e permissões

Nomes de permissão na forma do controller; a correspondência com a base de dados está
na §3.1.

| Actor / perfil | O que pode fazer | Permissão |
| --- | --- | --- |
| **Cliente final** (`ContaCliente`) | Gerir moradas; escolher entrega ou levantamento; ver a taxa antes de confirmar; acompanhar no mapa | `@ContaCliente()` |
| **Operador de balcão** | Despachar um pedido — é quem entrega a mercadoria ao estafeta, com a sua sessão de caixa aberta **na loja do pedido** | `GERIR_PEDIDOS_COMMERCE` (já existe) |
| **Gestor de loja** | Atribuir/reatribuir estafeta, ver o painel, marcar desfecho, **devolver entrega falhada** (anula a venda — exige perfil `MANAGER`+, como qualquer anulação) | `VER_ENTREGAS`, `GERIR_ENTREGAS`, `GERIR_ESTAFETAS` |
| **Quem fecha o turno do estafeta** | Acerto de contas: dinheiro cobrado na rua → caixa | `GERIR_ACERTOS_ESTAFETA` |
| **Estafeta** (principal novo) | Ver as suas entregas; aceitar; emitir posição; recolher/entregar/falhar; registar o valor cobrado | `@Estafeta()` |
| **ADMIN** | Zonas de entrega, taxas, raio; subscrições de webhook | `GERIR_ZONAS_ENTREGA`, `GERIR_WEBHOOKS` |
| **Operador externo** (Fase 6) | Só via webhook assinado — nunca sessão interactiva | assinatura HMAC |

##### Regras de negócio

1. **Uma `EntregaPedido` por `Pedido`, e só para pedidos `tipoEntrega = ENTREGA`.** Um
   pedido de levantamento continua exactamente como está hoje.
2. **A taxa de entrega é fixada no checkout** e não muda depois — como
   `PedidoItemSubstituicao` fixa preço: o cliente autoriza um valor concreto.
3. **Uma morada fora de qualquer zona activa não permite entrega.** O checkout oferece
   levantamento, não recusa o pedido.
4. **A venda nasce na expedição, não na entrega** (D2). O stock sai quando a mercadoria
   sai fisicamente da loja.
5. *(Implícita)* **O dinheiro só entra no caixa quando entra fisicamente no caixa.** A
   venda da expedição regista o pagamento como `A_COBRAR_NA_ENTREGA`, que
   `FecharSessaoCaixaUseCase` não soma à gaveta (só soma `NUMERARIO`). Entra no acerto.
6. **Uma entrega falhada devolve stock e anula a venda**, pelo caminho que já existe
   (`AnularVendaUseCase`) — não há segunda forma de desfazer uma venda.
7. **A reserva de stock só expira com o pedido em `CRIADO`** — regra em vigor desde
   `cfd1eb9` (`ESTADOS_QUE_A_EXPIRACAO_LIBERTA`). Na entrega a reserva é **consumida**
   na expedição, por isso os estados novos não entram nessa lista. Um pedido de entrega
   parado em `PRONTO` segura a reserva até alguém o despachar ou cancelar — e é por isso
   que `CancelarPedidoGestaoUseCase` existe.
8. *(Implícita)* **Depois de a mercadoria sair, o pedido já não se cancela** — nem pelo
   cliente, nem pela loja, nem anulando a venda. O único caminho é: entrega `FALHADA` →
   mercadoria regressa → devolver. Cancelar com a mercadoria na mota do estafeta daria
   stock reposto sem a mercadoria estar na loja.
9. **A expedição exige o caixa aberto na loja do pedido** — mesma regra que o
   levantamento ganhou em `a6d8ad1`, pela mesma razão: senão o stock sai da loja errada.
10. *(Implícita)* **A posição do estafeta é dado pessoal.** Só é visível ao cliente
    enquanto a entrega dele estiver `EM_ROTA`, e nunca a outro cliente.
11. **Todo o acesso a `EntregaPedido`, `Estafeta`, `EnderecoCliente` e `ZonaEntregaLoja`
    filtra por `empresaId`.**
12. **Um webhook de entrada nunca é aceite sem assinatura válida nem processado duas
    vezes.**

##### Fora de âmbito

- **Cobrança online no checkout** (gateway M-Pesa/e-Mola) — projecto próprio no backlog.
  O modelo não atrapalha quando chegar (assunção 4).
- **Conciliação de pagamentos M-Pesa/e-Mola recebidos na porta.** O estafeta regista a
  referência; conciliar com o extracto da carteira é o mesmo problema do gateway.
- **Devolução depois de entregue** (cliente recebe e devolve dias depois). É uma anulação
  de venda normal, pelo `AnularVendaUseCase`, com as regras que já tem.
- **Optimização de rota multi-paragem**, **previsão estatística de tempo**, **entrega
  entre empresas** (mercado, Fase 13), **app nativa** — como na versão anterior.

---

#### 3. Análise técnica

##### 3.1 Como funcionam as permissões neste código — a convenção a seguir

Há **duas nomenclaturas legítimas**, reconciliadas pelo `PermissoesGuard`:

| Onde | Forma | Exemplo existente |
| --- | --- | --- |
| Tabela `permissoes` | `codigo` + `action` + `resource` + `modulo` | `commerce.pedido.ler` · `read` · `pedidos_commerce` · `commerce` |
| Controller | `@Permissao('VERBO_RECURSO')` | `VER_PEDIDOS_COMMERCE` |
| Frontend (editor de perfis) | `AVAILABLE_RESOURCES` + `IGNORED_PERMISSIONS` | `pedidos_commerce`; `write:`/`delete:` ignorados |

O guarda traduz o verbo (`ver` → `read`/`manage`, `gerir` → `manage`) e compara o
recurso **pela raiz** (primeiros 5 caracteres, sem plural). Um verbo que não esteja em
`ACOES_POR_VERBO` cai só no `manage` — o comentário do guarda diz que isso funciona
**por acidente**. Por isso `ACERTAR_CONTAS_ESTAFETA` passa a `GERIR_ACERTOS_ESTAFETA`.

**Permissões novas** (todas `modulo = commerce`; só `read`/`manage`, como as do
commerce — sem `write`/`delete`):

| `codigo` | `action` | `resource` | Controller | Raiz |
| --- | --- | --- | --- | --- |
| `commerce.entrega.ler` | `read` | `entregas` | `VER_ENTREGAS` | `entre` |
| `commerce.entrega.gerir` | `manage` | `entregas` | `GERIR_ENTREGAS` | `entre` |
| `commerce.estafeta.gerir` | `manage` | `estafetas` | `GERIR_ESTAFETAS` | `estaf` |
| `commerce.acerto.gerir` | `manage` | `acertos_estafeta` | `GERIR_ACERTOS_ESTAFETA` | `acert` |
| `commerce.zona_entrega.gerir` | `manage` | `zonas_entrega` | `GERIR_ZONAS_ENTREGA` | `zonas` |
| `commerce.webhook.gerir` | `manage` | `webhooks` | `GERIR_WEBHOOKS` | `webho` |

*Colisão de raízes verificada* contra todos os recursos das migrações e do seed
(`adeso`, `audit`, `aviso`, `pedid`, `stock`, `user`, `rh`, …): nenhuma raiz nova começa
por uma existente nem o contrário.

**Ligação a perfis — o buraco a não repetir.** A migração `20260920070000` criou as
permissões do commerce e não as ligou a perfil nenhum; hoje só ADMIN/SUPER_ADMIN (com
*bypass*) abrem a fila de pedidos. Como **"Despachar" é uma acção de
`pedidos_commerce`**, a entrega não é operável por um operador de balcão sem fechar esse
buraco. Esta funcionalidade fecha-o:

| Perfil de sistema | Recebe |
| --- | --- |
| `Gestor` | `pedidos_commerce` (read, manage) · `entregas` (read, manage) · `estafetas` · `acertos_estafeta` |
| `Funcionário / Caixa` | `pedidos_commerce` (read, manage) · `entregas` (read) |
| `Administrador` | tudo (já recebe tudo pelo seed; ADMIN tem *bypass*) |

Três armadilhas no mecanismo:

- **O seed desfaz a migração.** `seed.ts` apaga todas as ligações dos perfis de sistema
  (`perfilPermissao.deleteMany({ perfil: { isSystem: true } })`) e recria-as a partir de
  listas de recursos. Se os recursos novos não entrarem nessas listas, correr o seed em
  desenvolvimento remove o que a migração ligou.
- **O seed não corre em produção** (o `Dockerfile` só faz `prisma migrate deploy`). A
  ligação para produção tem de estar **na migração**, por nome de perfil de sistema
  (`@@unique([nome, isSystem])` garante que o nome identifica o perfil).
- **Cache de permissões de 24 h** no Redis (`permissions:<userId>`). Sem invalidar,
  quem tinha sessão continua sem as permissões novas até um dia depois do deploy.

##### 3.2 Impacto no sistema

| Camada | Criar | Alterar |
| --- | --- | --- |
| **Dados** | `EnderecoCliente`, `ZonaEntregaLoja`, `Estafeta`, `EntregaPedido`, `EventoEntrega`, `AcertoEstafeta`, `WebhookSubscricao`, `WebhookEnvio`, `WebhookEventoRecebido` + enums `TipoEntregaPedido`, `EstadoEntregaPedido`, `EstadoEstafeta`, `EstadoAcerto`, `EstadoWebhookEnvio` | `EstadoPedido` (+3; e ver pergunta 4), `Pedido`, `Venda` (+`taxaEntrega`), `Loja` (+coordenadas), `ComercioConfiguracao`; linhas em `permissoes` e `perfil_permissoes` |
| **Backend** | `src/modules/entrega/`, `src/modules/webhooks/` | `pedido-estado.ts`, `CriarPedidoUseCase`, `ConfirmarLevantamentoUseCase` (extracção), `CancelarPedidoGestaoUseCase`, `AnularVendaUseCase` + `anularVendaTransacional`, `ProcessarVendaUseCase` + DTO, `main.ts`, `seed.ts` |
| **Frontend** | `features/entrega/`, `features/estafeta/`, `MoradasPage`, `SelectorMorada`, `MapaEntrega` | `CheckoutPage`, `PedidoDetalhePage`, `PedidosCommercePage`, `pedidos.api.ts`, `useSocket.ts`, `permissions.config.ts`, `router/index.tsx` |

##### 3.3 Decisões de arquitectura

| # | Decisão | Alternativa descartada | Porquê |
| --- | --- | --- | --- |
| **D1** | Módulo `entrega/` separado de `commerce/` | Campos de entrega em `Pedido` | Ciclo de vida, actores e eventos próprios; e um dia serve também o POS. |
| **D2** | **A venda nasce na expedição** (`PRONTO → EXPEDIDO`), pelo funcionário que entrega a mercadoria ao estafeta | Nascer na confirmação de entrega | `ProcessarVendaUseCase` exige sessão de caixa aberta; na confirmação — horas depois, por webhook ou PWA — pode já não haver nenhuma. E mercadoria a circular precisa de documento. |
| **D3** | **Pagamento `A_COBRAR_NA_ENTREGA`** na venda + `RegistroFinanceiro` `RECEITA`/`PENDING` com `vendaId` e **`clienteId` nulo**; o elo ao estafeta vive em `EntregaPedido` | (a) `NUMERARIO` na expedição; (b) `CREDITO` | (a) `FecharSessaoCaixaUseCase` somaria à gaveta dinheiro que está no bolso do estafeta — quebra certa no fecho. (b) `CREDITO` exige cliente e prazo e faz do **cliente** o devedor: o `InadimplenciaScheduler` (filtra `clienteId: { not: null }`) iria cobrá-lo por uma dívida que é do estafeta. Com `clienteId` nulo o motor não lhe toca. |
| **D4** | `taxaEntrega` como campo em `Venda` e `Pedido`, `@default(0)`, fora de COGS e margem | Produto de serviço "Taxa de entrega" | `ProcessarVendaUseCase` move stock por item; um produto de serviço iria a stock negativo. O default 0 deixa o POS igual. |
| **D5** | Frota própria primeiro; operador externo como adaptador (`CanalEntrega`) | Integrar já com operador externo | Não há em MZ um operador com API pública estável; o domínio fica atrás de uma interface desde o dia um. |
| **D6** | Posição efémera no WebSocket, eventos discretos na BD (`EventoEntrega`) | Gravar cada ponto de GPS | ~2.900 linhas/dia/estafeta. O valor de auditoria está nos eventos. |
| **D7** | Zonas por bairro/cidade/província + raio em km | PostGIS | O raio resolve o caso real; uma extensão espacial é custo desproporcionado. |
| **D8** | Webhooks de saída pelo padrão *outbox*, na mesma transacção da mudança de estado | `fetch` dentro do use-case | Não prender a ligação ao Neon à latência de terceiros; uma falha de rede não reverte uma entrega real. |
| **D9** | `fetch` nativo, sem biblioteca HTTP | `axios` / `@nestjs/axios` | O backend não tem cliente HTTP e não precisa. |
| **D10** | `Estafeta` como principal próprio (`JWT_ESTAFETA_SECRET`) | `User` com `Role.COURIER` | Mesma razão de `cliente-token.ts` e `fornecedor-token.ts`: `users.empresaId` é chave de tenant em ~30 módulos. |
| **D11** | **Devolução reutiliza `AnularVendaUseCase`**, com dois ajustes: (i) sessão fechada **deixa de bloquear** quando a venda é de entrega **e** não há numerário a devolver; (ii) a reversão do pedido passa a aceitar `FALHADA` além de `CONCLUIDO` | Reimplementar a anulação em `entrega/` | Uma segunda forma de desfazer uma venda divergiria da primeira. (i) A regra da sessão protege a conferência de um caixa fechado; uma venda `A_COBRAR_NA_ENTREGA` não pôs nada na gaveta, logo anulá-la não mexe nessa conferência. Limitado a vendas de entrega para **não mudar o comportamento do POS**. |
| **D12** | **Três predicados novos** em `pedido-estado.ts`, escritos por extenso: `lojaPodeCancelar` (até `PRONTO`), `ESTADOS_EM_ENTREGA` (`EXPEDIDO`, `EM_ROTA`) e `FALHADA` em `ESTADOS_PENDENTES` | Deixar `estaConcluido` decidir tudo | `estaConcluido` só conhece `CONCLUIDO`/`CANCELADO`; com os estados novos, tudo o que o usa passaria a tratar um pedido na rua como "ainda em curso na loja". `FALHADA` é trabalho à espera na loja (receber e devolver); `EXPEDIDO`/`EM_ROTA` não — está com o estafeta, e não deve somar aos "pedidos por atender" do painel. |

##### 3.4 Riscos e pontos sensíveis

| # | Risco | Impacto | Mitigação |
| --- | --- | --- | --- |
| **R1** | Já existe `enum EstadoEntrega` — estado de entrega de **mensagens** do CRM | Alto | Enum novo chama-se `EstadoEntregaPedido`. Não renomear o existente. |
| **R2** | `EventsGateway` só aceita `JWT_ACCESS_SECRET` e só junta a `empresa_<id>`; um cliente na sala da empresa veria todos os pedidos | Alto | Namespace `/entregas` próprio; salas `empresa_<id>`, `pedido_<id>`, `estafeta_<id>`. Não tocar no namespace raiz (configura o Engine.IO para todos). |
| **R3** | `TransitarEstadoPedidoUseCase.transitar` lê-e-depois-escreve; dois despachos concorrentes criariam duas vendas | Alto | Código novo usa `updateMany` condicional + `count === 1`. Defeito pré-existente, fora de âmbito — registado no backlog. |
| **R4** | Nenhuma coordenada no schema; `Loja` sem ponto | Alto | `Loja.latitude/longitude`; loja sem coordenadas não activa entrega, com erro claro. |
| **R5** | `main.ts` sem `rawBody: true` | Médio | `NestFactory.create(AppModule, { rawBody: true })`. Não altera o `ValidationPipe`. |
| **R6** | Expedição falhada a meio (reserva consumida, venda criada, entrega não) | Médio | Criar `EntregaPedido` **antes** da venda. Sobra uma entrega órfã visível, não uma venda sem entrega invisível. |
| **R7** | Operador externo repete o mesmo evento | Médio | `@@unique([operadorId, eventoExternoId])`; duplicado responde `200`, nunca `409`. |
| **R8** | Posições em memória com mais de uma instância Fly | Médio | Última posição na BD; adaptador Redis do `socket.io` quando houver >1 instância. |
| **R9** | `ALTER TYPE ... ADD VALUE` | Baixo | Postgres do Neon suporta; uma instrução por valor. Se a pergunta 4 decidir remover valores, passa a **Alto** — ver §4.1. |
| **R10** | Bateria e dados do telemóvel | Baixo | Emissão só entre recolha e entrega, 15 s, só se andou >25 m. |
| **R11** | **`AnularVendaUseCase` reverte o pedido só `WHERE estado = CONCLUIDO`.** Anular a venda com o pedido `EXPEDIDO`/`EM_ROTA` repunha o stock e cancelava a venda, e o pedido continuava "a caminho" com a mercadoria na mota — a incoerência que `af68cdd` acabou de corrigir | **Alto** | `AnularVendaUseCase` recusa (`409`) quando o pedido associado está em `ESTADOS_EM_ENTREGA`, com mensagem: registar a entrega como falhada e devolver. |
| **R12** | **`CancelarPedidoGestaoUseCase` só recusa `estaConcluido`.** Com os estados novos cancelaria um pedido `EXPEDIDO` — venda feita, stock abatido — e "não reverte stock" (está escrito nele), porque até hoje o stock só descia no levantamento | **Alto** | Passa a usar `lojaPodeCancelar` (D12). Teste: cancelar um pedido `EXPEDIDO` dá `400`. |
| **R13** | Devolução de entrega falhada que regressa **depois do fecho do caixa** de quem despachou: `AnularVendaUseCase` recusa sessões fechadas | **Alto** | D11 (i). Sem este ajuste, toda a entrega falhada ao fim do dia exigiria ajuste manual de stock e financeiro. |
| **R14** | Seed apaga ligações de perfis de sistema e desfaz a migração; cache de permissões 24 h | Médio | §3.1: recursos novos nas listas do seed; invalidar `permissions:*` no deploy. |
| **R15** | `A_COBRAR_NA_ENTREGA` usado no POS por engano | Médio | `ProcessarVendaUseCase` só o aceita com `canal = 'ECOMMERCE'` (o parâmetro já existe). |

---

#### 4. Plano de implementação

Cada passo **[obrigatório]** ou **[opcional]**.

##### 4.1 Dados

Migração `prisma/migrations/<timestamp>_entrega_domicilio/migration.sql`.
**Não destrutiva** na versão base — só adiciona. Os pedidos existentes ficam
`tipoEntrega = 'LEVANTAMENTO'`.

- [x] **[obrigatório]** Enums novos: `TipoEntregaPedido { LEVANTAMENTO, ENTREGA }` ·
      `EstadoEntregaPedido { AGUARDA_RECOLHA, ATRIBUIDA, RECOLHIDA, EM_ROTA, ENTREGUE,
      FALHADA, DEVOLVIDA, CANCELADA }` · `EstadoEstafeta` · `EstadoAcerto` ·
      `EstadoWebhookEnvio`.
- [ ] **[obrigatório]** `EstadoPedido` ganha **`EXPEDIDO`, `EM_ROTA`, `FALHADA`**. **Adiado para a migração da Fase 2** (decisão de 2026-10-05): sem escritor antes disso seriam estados mortos.
- [x] **[já feito, fora desta migração]** `AGUARDA_CONFIRMACAO` e
      `AGUARDA_LEVANTAMENTO` — removidos em 2026-10-03 (Fase 21), antes desta
      funcionalidade ter código. Migração
      `20261003030000_remove_estados_mortos_pedido`: mapeou
      `AGUARDA_CONFIRMACAO → CONFIRMADO` e `AGUARDA_LEVANTAMENTO → PRONTO` (não
      `CRIADO`, como este plano previa — mapear para a frente é mais seguro do que
      recuar um pedido de estado, e o esperado continua a ser zero linhas em
      qualquer dos dois destinos), depois recriou o tipo sem os dois valores. Já
      sem código de `pedido-estado.ts` nem de etiquetas no frontend a referenciá-los.
- [x] **[obrigatório]** (Fase 22: `ZonaEntregaLoja` por **faixas de distância**, não por província/cidade) `EnderecoCliente`, `ZonaEntregaLoja` (espelha
      `ZonaEntregaFornecedor`, incluindo a nota sobre índices únicos parciais no SQL),
      `Estafeta`, `EntregaPedido`, `EventoEntrega`, `AcertoEstafeta`,
      `WebhookSubscricao`, `WebhookEnvio`, `WebhookEventoRecebido` — campos como na
      versão anterior. `EntregaPedido` ganha `metodoCobrado?` e `referenciaPagamento?`
      (M-Pesa/e-Mola recebidos na porta).
- [x] **[obrigatório]** `Pedido`: `tipoEntrega @default(LEVANTAMENTO)`, `enderecoId?`,
      `taxaEntrega Float @default(0)`, relação `entrega`.
- [x] **[obrigatório]** `Venda.taxaEntrega Float @default(0)`, com comentário no schema
      a dizer que não entra em `totalCogs` nem `grossMargin`.
- [x] **[obrigatório]** `Loja.latitude/longitude` opcionais;
      `ComercioConfiguracao` + `entregaActiva`, `tempoPreparacaoMinutos`,
      `raioMaximoKm?`, `permiteAgendamento`.
- [x] **[obrigatório]** **Permissões na migração**: `INSERT INTO permissoes` das seis
      linhas da §3.1 com `ON CONFLICT DO NOTHING` **sem alvo** (a tabela tem duas
      restrições de unicidade — mesma nota da migração `20260920070000`); e
      `INSERT INTO perfil_permissoes … SELECT` a ligar aos perfis de sistema por nome
      (`Gestor`, `Funcionário / Caixa`, `Administrador`), **incluindo `pedidos_commerce`**.
- [x] **[obrigatório]** `prisma/seed.ts`: `pedidos_commerce`, `entregas`, `estafetas`,
      `acertos_estafeta` nas listas de `permissoesGestor`; `pedidos_commerce` e
      `entregas` na de `permissoesCaixa`. Sem isto, o seed desfaz a migração (R14).
- [ ] **[opcional]** Seed de zonas de Maputo num script de desenvolvimento, não numa
      migração.

##### 4.2 Backend

Módulo novo `src/modules/entrega/`, na estrutura de `commerce` e `b2b` (controllers de
gestão, estafeta, moradas e zonas; `domain/` com funções puras; `application/`;
`infrastructure/` com auth, adaptadores, gateway e tasks). Controllers de gestão com
`@UseGuards(PermissoesGuard, ModuloAccessGuard)` e `@ModuloNecessario('commerce')`, como
`PedidoGestaoController`.

###### 4.2.1 Domínio — [obrigatório]

- [ ] `distancia-haversine.ts` e `calcular-taxa.ts` — funções puras, testadas antes de
      existir controller (casos: sem coordenadas, sobreposição, fora de área, inactiva,
      abaixo do mínimo).
- [ ] `entrega-estado.ts` — transições da `EntregaPedido`, escritas por extenso.
- [ ] **`pedido-estado.ts`** (D12):
  - `ESTADOS_CANCELAVEIS_PELA_LOJA` / `lojaPodeCancelar`: `CRIADO`, `CONFIRMADO`,
    `EM_PREPARACAO`, `PRONTO`.
  - `ESTADOS_EM_ENTREGA`: `EXPEDIDO`, `EM_ROTA`.
  - `ESTADOS_PENDENTES` += `FALHADA`; **não** `EXPEDIDO`/`EM_ROTA`.
  - `ESTADOS_QUE_A_EXPIRACAO_LIBERTA` **não muda** (continua só `CRIADO`).
  - `ESTADOS_CANCELAVEIS_PELO_CLIENTE` não muda.

###### 4.2.2 Ciclo de vida — [obrigatório]

O que existe hoje em cima, o que é novo a **negrito**:

```
CRIADO ─confirmar─→ CONFIRMADO ─iniciarPreparacao─→ EM_PREPARACAO ─conferir─→ PRONTO
                                                                               │
                  ┌────────────────────────────────────────────────────────────┤
                  │ tipoEntrega = LEVANTAMENTO                                 │ tipoEntrega = ENTREGA
                  │ confirmarLevantamento                                      │ **despachar**
                  │  (venda nasce aqui — como hoje)                            │  (**venda nasce aqui**,
                  ▼                                                            ▼   A_COBRAR_NA_ENTREGA)
              CONCLUIDO                                                  **EXPEDIDO**
                                                                               │ estafeta recolhe
                                                                               ▼
                                                                          **EM_ROTA**
                                                                         ┌─────┴─────┐
                                                                entregue │           │ falhou
                                                                         ▼           ▼
                                                                    CONCLUIDO   **FALHADA**
                                                                                     │ devolver
                                                                                     │ (AnularVendaUseCase)
                                                                                     ▼
                                                                                 CANCELADO
Cancelável: cliente até CONFIRMADO · loja até PRONTO · a partir de EXPEDIDO, só FALHADA → devolver.
```

- [ ] **Extrair de `ConfirmarLevantamentoUseCase`** para um serviço partilhado:
      `itensFinais` (quantidades da conferência e substituições) e
      `recusarLojaDiferenteDaDoCaixa`. **Extrair, não copiar** — a regra da loja do
      caixa foi corrigida há dois dias e duas cópias voltariam a divergir.
- [ ] `ExpedirPedidoUseCase` — por ordem: (1) loja do caixa = loja do pedido;
      (2) `updateMany` condicional `PRONTO → EXPEDIDO`, `count === 1`; (3) reservas →
      `CONSUMIDA`; (4) `EntregaPedido` em `AGUARDA_RECOLHA` (R6); (5)
      `ProcessarVendaUseCase(..., 'ECOMMERCE')` com `taxaEntrega` e pagamento
      `A_COBRAR_NA_ENTREGA` (ou o método pré-pago, quando o gateway existir);
      (6) `RegistroFinanceiro` `RECEITA`/`PENDING`, `vendaId`, `clienteId` nulo;
      (7) `WebhookEnvio`; (8) notificação.
- [ ] `AtribuirEstafetaUseCase`, `RegistarRecolhaUseCase`, `RegistarPosicaoUseCase`
      (não grava evento — D6), `ExpirarAtribuicoesTask`.
- [ ] `ConfirmarEntregaUseCase` — entrega `EM_ROTA → ENTREGUE`, pedido
      `EM_ROTA → CONCLUIDO`; regista `valorCobrado`, `metodoCobrado` e, se não for
      numerário, `referenciaPagamento`.
- [ ] `RegistarFalhaEntregaUseCase` — `EM_ROTA → FALHADA`, motivo obrigatório.
- [ ] `DevolverEntregaUseCase` (D11) — exige `MANAGER`+ (herdado da anulação). Por ordem:
      (1) `AnularVendaUseCase` — a parte irreversível, com a sua própria guarda de
      concorrência (`updateMany … estado: CONCLUIDA`); (2) numa transacção:
      `EntregaPedido FALHADA → DEVOLVIDA` e `RegistroFinanceiro → CANCELLED`, ambos
      condicionais e por isso seguros de repetir se (2) falhar depois de (1).
- [ ] `AcertarContasEstafetaUseCase` — só soma entregas com `metodoCobrado = NUMERARIO`
      (M-Pesa/e-Mola não passam pelo bolso do estafeta); `AcertoEstafeta` +
      `MovimentoCaixa(REFORCO)` na sessão de quem recebe + `RegistroFinanceiro → PAID`.
      Diferença regista-se, não bloqueia.

###### 4.2.3 Alterações a código existente — [obrigatório]

- [ ] **`CancelarPedidoGestaoUseCase`**: trocar `estaConcluido` por `lojaPodeCancelar`;
      mensagem para `EXPEDIDO`/`EM_ROTA`/`FALHADA` a dizer o caminho certo (R12).
- [ ] **`AnularVendaUseCase`**: recusar com `409` se o pedido associado estiver em
      `ESTADOS_EM_ENTREGA` (R11); aceitar sessão fechada quando o pedido associado é
      `tipoEntrega = ENTREGA` **e** `numerarioADevolver === 0` (R13). Os dois ajustes
      só disparam quando há pedido de entrega — o POS não muda.
- [ ] **`anularVendaTransacional`**: a reversão do pedido passa de
      `estado: CONCLUIDO` para `estado: { in: [CONCLUIDO, FALHADA] }`.
- [ ] **`ProcessarVendaUseCase` + `processar-venda.dto.ts`**: `A_COBRAR_NA_ENTREGA` em
      `MetodoPagamento`, aceite só com `canal = 'ECOMMERCE'` (R15), sem troco (tratar
      como o `CREDITO` já é tratado no cálculo do troco); `taxaEntrega?` fora de COGS.
      `PagamentoVenda.metodo` é texto — **não há migração** para o método.
- [ ] **`CriarPedidoUseCase` + DTO**: `tipoEntrega`, `enderecoId`, taxa no `totalFinal`.
- [ ] **`main.ts`**: `{ rawBody: true }` (R5).

###### 4.2.4 Autenticação do estafeta, webhooks e tempo real

Sem alterações de fundo face à versão anterior:

- [ ] **[obrigatório]** `estafeta-token.ts` — cópia estrutural de `cliente-token.ts`:
      cookie `tokenEstafeta`, audience `controlcore-estafeta`, `segredoEstafeta()` que
      **lança** sem `JWT_ESTAFETA_SECRET`, validade 12 h. `EstafetaGuard` +
      `@Estafeta()`, com verificação em BD a cada pedido.
- [ ] **[obrigatório na Fase 6]** **Webhooks de saída** — *outbox* na mesma transacção;
      `EnviarWebhooksTask` a cada minuto; `POST` com `X-ControlCore-Evento`,
      `X-ControlCore-Id` (idempotência do lado de lá) e
      `X-ControlCore-Assinatura: t=<ts>,v1=HMAC-SHA256(segredo, "<ts>.<corpo cru>")`;
      *timeout* 10 s; recuo 1 min · 5 · 15 · 60 · 6 h · 24 h; à 7.ª `ABANDONADO`.
      Eventos: `pedido.criado`, `pedido.expedido`, `entrega.atribuida`,
      `entrega.recolhida`, `entrega.em_rota`, `entrega.entregue`, `entrega.falhada`,
      `entrega.cancelada`.
- [ ] **[obrigatório na Fase 6]** **Webhook de entrada** —
      `POST /webhooks/entrega/:operadorId`, `@Public()`; assinatura sobre o corpo cru
      com `crypto.timingSafeEqual`; desfasamento >5 min recusado; duplicado → `200`;
      responde `202` antes de processar; evento de outra empresa ou transição inválida é
      registado em `erro` e ignorado.
- [ ] **[obrigatório]** `entrega.gateway.ts` — namespace `/entregas`, três segredos,
      três salas; nunca um cliente em `empresa_<id>` (R2).

###### Endpoints

| Método | Rota | Entrada | Resposta | Erros | Permissão |
| --- | --- | --- | --- | --- | --- |
| `GET`/`POST`/`PATCH`/`DELETE` | `/commerce/enderecos[/:id]` | `EnderecoDto` | `EnderecoCliente` | `400`, `404`, `409` (em uso) | `@ContaCliente()` |
| `POST` | `/commerce/entrega/cotacao` | `{ lojaId, enderecoId, subtotal }` | `{ disponivel, taxa, prazoMinutos, motivo? }` | `400`, `404` | `@ContaCliente()` |
| `POST` | `/commerce/pedidos` | `CriarPedidoDto` + `tipoEntrega`, `enderecoId?` | `Pedido` | `400`, `404`, `409` | `@ContaCliente()` |
| `GET` | `/commerce/pedidos/:id/entrega` | — | `EntregaPublica` | `404` | `@ContaCliente()` |
| `POST` | `/commerce/gestao/pedidos/:id/expedir` | `{ estafetaId? }` | `{ pedido, entrega, venda }` | `400` (não `PRONTO`, loja do caixa ≠ loja do pedido), `409` (sem caixa) | `GERIR_PEDIDOS_COMMERCE` |
| `GET` | `/entregas` | filtros | `Entrega[]` paginado | `403` | `VER_ENTREGAS` |
| `PATCH` | `/entregas/:id/atribuir` · `/:id/cancelar` | `{ estafetaId }` · `{ motivo }` | `Entrega` | `400`, `404`, `409` | `GERIR_ENTREGAS` |
| `POST` | `/entregas/:id/devolver` | `{ motivo }` | `{ entrega, vendaAnulada }` | `400`, `403` (não é gestor), `404`, `409` | `GERIR_ENTREGAS` + perfil `MANAGER`+ |
| `GET`/`POST` | `/entregas/estafetas` | `EstafetaDto` | `Estafeta` | `400`, `403` | `GERIR_ESTAFETAS` |
| `POST` | `/entregas/acertos` | `{ estafetaId, totalEntregue }` | `AcertoEstafeta` | `400`, `409` (sem caixa) | `GERIR_ACERTOS_ESTAFETA` |
| `GET`/`POST`/`PATCH` | `/entregas/zonas` | `ZonaEntregaDto` | `ZonaEntregaLoja` | `400`, `403` | `GERIR_ZONAS_ENTREGA` |
| `POST` | `/estafeta/auth/entrar` | `{ telefone, password }` | cookie `tokenEstafeta` | `401` | `@Public()` |
| `GET` | `/estafeta/entregas` | — | as suas | `401` | `@Estafeta()` |
| `POST` | `/estafeta/entregas/:id/{aceitar,recolher,entregar,falhar}` | conforme a acção | `Entrega` | `400`, `409` | `@Estafeta()` |
| `POST` | `/estafeta/posicao` | `{ latitude, longitude, precisao? }` | `{ ok: true }` | `400` | `@Estafeta()` |
| `POST` | `/webhooks/entrega/:operadorId` | corpo do operador | `202` \| `200` (duplicado) | `401`, `400` | `@Public()` + assinatura |
| `GET`/`POST`/`DELETE` | `/webhooks/subscricoes` | `SubscricaoDto` | `WebhookSubscricao` | `400`, `403` | `GERIR_WEBHOOKS` |

##### 4.3 Frontend

- [ ] **[obrigatório]** **Checkout** — selector levantar/entregar, `SelectorMorada`,
      cotação a cada mudança; taxa como linha própria antes do botão; fora de área →
      frase concreta e volta a levantamento. Estados: skeleton na linha da taxa, erro
      via `mensagemDeErro()`, sem morada, fora de área.
- [ ] **[obrigatório]** **Moradas** — `MoradasPage` com react-hook-form + Zod; pino no
      mapa; geolocalização **escondida** fora de contexto seguro.
- [ ] **[obrigatório]** **Rastreio** — linha do tempo + `MapaEntrega` quando `EM_ROTA`;
      namespace `/entregas`; sem WebSocket, consulta a cada 30 s. O mapa desenha o rasto
      das posições recebidas (só em memória) e o marcador da morada; mais a rota
      prevista até à morada e o tempo estimado (US-19b, ver Sprint 5), vindos do
      backend — o ecrã não fala com o fornecedor de rotas.
- [ ] **[obrigatório]** **`pedidos.api.ts`** — `EstadoPedido` e
      `ETIQUETA_ESTADO_PEDIDO` com `EXPEDIDO` ("A caminho"), `EM_ROTA` ("O estafeta está a
      caminho"), `FALHADA` ("Não foi possível entregar"); sem os `AGUARDA_*` se a
      pergunta 4 decidir remover. `ETIQUETA_METODO_PAGAMENTO` hoje diz "no
      levantamento" — passa a depender de `tipoEntrega`.
- [ ] **[obrigatório]** **PWA do estafeta** — `/estafeta/*` fora do `ProtectedRoute`
      (como `/loja` e `/fornecedor`); telemóvel primeiro, uma mão, alvos grandes;
      `useEmitirPosicao` com *throttle* 15 s / 25 m. Fila offline **[opcional]**, mas o
      único que não cortaria.
- [ ] **[obrigatório]** **Gestão** — `EntregasPage` (mapa + colunas por estado, socket);
      "Despachar" em `PedidosCommercePage` para pedidos de entrega em `PRONTO`;
      `ZonasEntregaPage`, `EstafetasPage`, `AcertoEstafetaPage`. O botão "Cancelar" some
      a partir de `EXPEDIDO`; o de devolver só aparece em `FALHADA` e só a gestor.
- [ ] **[obrigatório]** **`permissions.config.ts`** — `AVAILABLE_RESOURCES` +=
      `entregas`, `estafetas`, `acertos_estafeta`, `zonas_entrega`, `webhooks`;
      `IGNORED_PERMISSIONS` += `write:`/`delete:` de cada um (só existem `read`/`manage`,
      como em `pedidos_commerce`). Sem isto, perfis personalizados não conseguem receber
      as permissões novas — o editor de perfis não as mostra.
- [ ] **[obrigatório]** **`useSocket.ts`** aceita namespace (hoje fixo na raiz).
- [ ] **[obrigatório]** `MapaEntrega.tsx` único — a biblioteca de mapas (pergunta 1) não
      se espalha por seis ficheiros.

##### 4.4 Transversal

- [ ] **[obrigatório]** Testes backend, além dos da versão anterior
      (taxa, haversine, estados, expedição concorrente, confirmar entrega, acerto,
      assinatura de webhook):
  - `pedido-estado.spec.ts` — `lojaPodeCancelar` recusa `EXPEDIDO`/`EM_ROTA`/`FALHADA`;
    `FALHADA` está em `ESTADOS_PENDENTES`; `EXPEDIDO` não.
  - `cancelar-pedido-gestao.use-case.spec.ts` — pedido `EXPEDIDO` dá `400`.
  - `anular-venda.use-case.spec.ts` — recusa com pedido `EM_ROTA`; aceita sessão fechada
    só com pedido de entrega e numerário zero; **uma venda de POS com sessão fechada
    continua recusada** (regressão).
  - `processar-venda.use-case.spec.ts` — `A_COBRAR_NA_ENTREGA` recusado com canal `POS`;
    não gera troco.
  - `expedir-pedido.use-case.spec.ts` — caixa de outra loja dá `400`; a gaveta não sobe.
  - `devolver-entrega.use-case.spec.ts` — repetir depois de falha parcial não duplica.
- [ ] **[obrigatório]** Frontend: etiqueta para todo o `EstadoPedido` (falha se faltar).
- [ ] **[obrigatório]** Auditoria em expedição, atribuição, entrega, falha, devolução e
      acerto (dinheiro e stock).
- [ ] **[obrigatório]** `.env.example`: `JWT_ESTAFETA_SECRET`, `JWT_ESTAFETA_EXPIRES_IN`,
      `WEBHOOK_TIMEOUT_MS`, `WEBHOOK_MAX_TENTATIVAS`, e do lado do frontend a variável do
      mapa — cada uma com o que acontece se faltar.
- [ ] **[opcional]** Métricas no dashboard; ferramenta MAYRA `consultar_entregas_em_curso`.

##### 4.5 Documentação — [obrigatório]

Pela regra do projecto: código → autorização do merge → documentação → merge.

- [ ] `Docs/plano_implementacao.md` (duas cópias idênticas): Secção 2 por fase fechada;
      fechar na Secção 3 o item das permissões do commerce (resolvido aqui) e, conforme a
      pergunta 4, o dos `AGUARDA_*`.
- [ ] `Docs/TRD.md` (duas cópias): fornecedor de mapas, variáveis novas, namespace
      `/entregas`.
- [ ] Esta secção (plano e backlog da equipa) actualizada a cada desvio, no commit
      que o introduz.

---

#### 5. Ficheiros afectados

##### `ControleCore_BackEnd`

| Ficheiro | Acção | Porquê |
| --- | --- | --- |
| `prisma/schema.prisma` | alterar | Modelos e enums novos; `EstadoPedido`; colunas em `Pedido`/`Venda`/`Loja`/`ComercioConfiguracao` |
| `prisma/migrations/<ts>_entrega_domicilio/migration.sql` | criar | DDL, permissões e ligação a perfis; parte destrutiva só se a pergunta 4 o decidir |
| `prisma/seed.ts` | alterar | Recursos novos + `pedidos_commerce` nas listas dos perfis de sistema |
| `src/modules/entrega/**`, `src/modules/webhooks/**` | criar | Módulos novos |
| `src/modules/commerce/domain/pedido-estado.ts` | alterar | Predicados D12 |
| `src/modules/commerce/application/services/<fecho-de-pedido>.service.ts` | criar | `itensFinais` + `recusarLojaDiferenteDaDoCaixa` extraídos |
| `src/modules/commerce/application/use-cases/confirmar-levantamento.use-case.ts` | alterar | Passa a usar o serviço extraído |
| `src/modules/commerce/application/use-cases/cancelar-pedido-gestao.use-case.ts` | alterar | `lojaPodeCancelar` (R12) |
| `src/modules/commerce/application/use-cases/criar-pedido.use-case.ts` + `dto/pedido.dto.ts` | alterar | Tipo de entrega, morada, taxa |
| `src/modules/commerce/pedido-gestao.controller.ts` | alterar | Rota `:id/expedir` |
| `src/modules/vendas/application/use-cases/anular-venda.use-case.ts` | alterar | R11, R13 |
| `src/modules/vendas/infrastructure/database/prisma-venda.repository.ts` | alterar | Reversão aceita `FALHADA` |
| `src/modules/vendas/application/use-cases/processar-venda.use-case.ts` + `dto/processar-venda.dto.ts` | alterar | `A_COBRAR_NA_ENTREGA`, `taxaEntrega` |
| `src/main.ts` | alterar | `rawBody: true` |
| `src/app.module.ts` | alterar | Registar os módulos novos |
| `.env.example` | alterar | Variáveis novas |

##### `ControleCore_FrontEnd`

| Ficheiro | Acção | Porquê |
| --- | --- | --- |
| `src/features/estafeta/**`, `src/features/entrega/**` | criar | PWA e gestão |
| `src/features/compra-facil/pages/MoradasPage.tsx` | criar | Moradas |
| `src/features/compra-facil/components/SelectorMorada.tsx`, `MapaEntrega.tsx` | criar | Reutilizados em três ecrãs |
| `src/features/compra-facil/pages/CheckoutPage.tsx`, `PedidoDetalhePage.tsx` | alterar | Entrega, taxa, rastreio |
| `src/features/compra-facil/api/pedidos.api.ts` | alterar | Estados, etiquetas, método de pagamento |
| `src/features/compra-facil-gestao/pages/PedidosCommercePage.tsx` | alterar | "Despachar"; cancelar escondido a partir de `EXPEDIDO` |
| `src/shared/hooks/useSocket.ts` | alterar | Namespace como parâmetro |
| `src/shared/config/permissions.config.ts` | alterar | Recursos novos |
| `src/router/index.tsx` | alterar | `/estafeta/*` e rotas de gestão |

---

#### 6. Assunções

1. **A entrega sai da loja que prepara o pedido.** Sem consolidação entre lojas.
2. **Uma entrega, uma viagem** na v1.
3. **O estafeta tem telemóvel com dados e GPS.** Sem isso funciona na mesma, sem rastreio.
4. **O pagamento continua a ser cobrado fisicamente.** Quando o gateway entrar, a venda da
   expedição passa a levar o método pré-pago em vez de `A_COBRAR_NA_ENTREGA`, não se cria
   `RegistroFinanceiro` a receber, e o acerto ignora esses pedidos — por isso
   `valorACobrar` é campo e não derivado.
5. **A taxa de entrega tem IVA de serviço**, não decomposto na v1. Confirmar com a
   facturação.
6. **O estafeta é da empresa ou subcontratado por ela** — `Estafeta.empresaId`
   obrigatório.
7. **`Pedido.taxaEntrega` entra em `totalFinal`.**
8. **Devolver uma entrega falhada é acção de gestor** (`MANAGER`+), porque anula uma
   venda. O operador de balcão recebe a mercadoria; um gestor confirma a devolução.
   *Nova nesta revisão* — consequência de reutilizar `AnularVendaUseCase`.
9. **O acerto de contas é feito pelo perfil `Gestor`**, não por um perfil financeiro
   dedicado — em regra uma loja não tem um. Proposta de regra nova em
   `REGRAS_SEGREGACAO` (`src/shared/segregacao-funcoes.ts`): `ACERTO_ESTAFETA_PROPRIO` —
   ninguém fecha o acerto de um estafeta ligado ao seu próprio `userId` — em modo
   `EXCEPCAO_AUTORIZADA`, como `REQ_CRIAR_APROVAR`: uma loja de uma pessoa tem de
   conseguir operar, mas fica registado. *Nova nesta revisão.*
10. **`Armazenista` não recebe permissões de entrega nem de `pedidos_commerce`.** Se o
    picking for feito por armazenistas, acrescenta-se `pedidos_commerce` a esse perfil.
    *Nova nesta revisão.*

---

#### 7. Perguntas em aberto

Nenhuma bloqueante. Decididas pelo Product Owner em **2026-09-29**:

1. **Fornecedor de mapas → Leaflet + OpenStreetMap**, como recomendado. O Product Owner
   escolheu primeiro o Google Maps e trocou no mesmo dia, para experimentar a opção
   gratuita. Consequências para a implementação:
   - **Sem custo e sem chave de API** — nada entra no `.env.example` nem nos segredos.
   - Os *tiles* públicos do OpenStreetMap têm uma política de uso justo (identificar a
     aplicação, sem tráfego pesado). Se o uso crescer, troca-se o servidor de *tiles*
     (auto-alojado ou um fornecedor pago) sem mudar o resto — é um URL.
   - **Sem pesquisa de moradas escritas na v1:** o cliente marca o pino no mapa. A
     geocodificação (Nominatim) fica como melhoria, se a marcação à mão se revelar
     difícil.
   - `MapaEntrega.tsx` continua a ser o único ficheiro a conhecer a biblioteca: se o
     OpenStreetMap não servir, voltar ao Google Maps mexe só aí e numa variável nova.
2. **`Pedido.estado` espelha a entrega → sim**, como o plano assumia (`EXPEDIDO`,
   `EM_ROTA`, `FALHADA`).
3. **Um estafeta pode servir várias lojas da empresa → sim.** `Estafeta` liga-se à
   empresa, não a uma loja; a atribuição (manual ou automática) escolhe entre os
   estafetas activos da empresa, e a loja fica na `EntregaPedido`.
4. **`AGUARDA_CONFIRMACAO` e `AGUARDA_LEVANTAMENTO` → remover**, na migração da
   entrega, com a estratégia da §4.1 (mapear antes de remover, recriar o tipo).

**Não bloqueantes:** tudo o que está na §6.

---

#### 8. Ordem de execução e verificação

| Fase | Conteúdo | Depende de |
| --- | --- | --- |
| **0 — Desbloquear e preparar** | 4 decisões; migração (incl. permissões e perfis); segredos; coordenadas | — |
| **1 — O cliente escolhe entrega** | Moradas, zonas, cotação, checkout | 0 |
| **2 — A loja despacha** | Estafetas, expedição, painel, desfecho, devolução + alterações a `CancelarPedidoGestao`/`AnularVenda` | 1 |
| **3 — As contas batem** | Valor cobrado, acerto, visão do que cada estafeta deve | 2 |
| **4 — O estafeta na rua** | PWA, auth, atribuição | 2 |
| **5 — Rastreio ao vivo** | Namespace, posição, mapa | 4 |
| **6 — Webhooks** | Saída, entrada, adaptador | 2 |

**Como verificar no fim da Fase 2/3** (o resto como na versão anterior):

```bash
cd C:/Documentos/SRG/ControlCore/ControleCore_BackEnd && npm run lint && npm run build && npm test
cd C:/Documentos/SRG/ControlCore/ControleCore_FrontEnd && npm run lint && npm run build && npm test
```

1. Com um utilizador **de perfil `Funcionário / Caixa`** (não ADMIN — o ADMIN tem
   *bypass* e esconderia um erro de permissões), abrir a fila de pedidos e despachar.
2. Despachar com o caixa aberto noutra loja → `400` com o nome das duas lojas.
3. Despachar certo: venda com `taxaEntrega` e pagamento `A_COBRAR_NA_ENTREGA`; stock
   desce; `RegistroFinanceiro` a receber **sem cliente**; saldo calculado do caixa
   **não sobe**.
4. Com o pedido `EM_ROTA`: tentar cancelar pela gestão → `400`; tentar anular a venda →
   `409`.
5. Marcar falhada; **fechar o caixa de quem despachou**; como gestor, devolver → aceita;
   stock reposto, venda `CANCELADA`, pedido `CANCELADO`, registo financeiro `CANCELLED`.
6. Anular uma venda de **POS** com a sessão fechada → continua recusada.
7. Entregar em numerário, fazer o acerto com 50 MZN de diferença → fecha, diferença
   registada, `MovimentoCaixa(REFORCO)` na sessão de quem recebe.
8. Pedido de levantamento de ponta a ponta → nada mudou.

**Notas de deploy:**

- Migração corre no arranque do contentor. Se a pergunta 4 decidir remover, é destrutiva
  — correr primeiro numa *branch* do Neon com cópia de produção.
- `fly secrets set JWT_ESTAFETA_SECRET=…` **antes** do deploy — sem ele o módulo lança e
  o contentor não sobe.
- **Invalidar a cache de permissões** depois do deploy (`permissions:*` no Redis), senão
  as permissões novas só aparecem a quem tinha sessão ao fim de 24 h.
- Backend primeiro, frontend depois. Variável do mapa na Vercel exige novo build.
- Coordenadas das lojas preenchidas antes de activar a entrega por empresa.

#### Backlog da equipa — histórias e sprints

**Épico:** levar as compras do Compra Fácil a casa do cliente.
**Equipa:** desenvolvimento ControlCore · **Sprints:** 6 × 2 semanas · **Total:** 124 pontos · *revisto em 2026-09-24*

> **Como usar este documento.** É o que se lê no refinamento e se tem aberto durante o
> sprint. Cada história diz o que entregar, quando está pronta e que tarefas tem.
> O **porquê** de cada decisão técnica está no plano técnico acima, nesta mesma
> secção — o backlog não repete essas razões, remete para elas.

---

##### 1. O que vamos construir, em linguagem simples

Hoje o cliente compra no Compra Fácil e vai buscar à loja. Vamos acrescentar a
alternativa: escolher uma morada, pagar uma taxa, e receber em casa por um estafeta
que ele acompanha no mapa — como no iFood.

**O percurso completo, do princípio ao fim:**

1. O cliente guarda uma morada ("Casa — Sommerschield, prédio azul ao lado da farmácia").
2. No checkout escolhe **Entregar em casa** em vez de **Levantar na loja**.
3. O sistema vê em que zona cai a morada e mostra a taxa (ex.: 150 MZN). O cliente confirma.
4. A loja recebe o pedido, prepara e confere — **exactamente como já faz hoje**.
5. Em vez de "Confirmar levantamento", o funcionário carrega em **Despachar** e escolhe o
   estafeta. **É aqui que nasce a venda** e o stock sai.
6. O estafeta vê a entrega no telemóvel, aceita, recolhe na loja e segue.
7. O cliente vê o estafeta a mover-se no mapa. Recebe, paga (se for na entrega), confirma.
8. No fim do turno, o estafeta entrega o dinheiro e faz o **acerto de contas** — só nesse
   momento o dinheiro entra no caixa.

**Se a entrega falhar** (cliente ausente, morada errada): a mercadoria volta à loja, o
stock é reposto e a venda é anulada. Não fica dinheiro nem stock por explicar.

---

##### 2. Vocabulário — as palavras novas

| Palavra | O que significa aqui |
| --- | --- |
| **Pedido** | O que já existe. O processo entre o checkout e a venda. |
| **Entrega** (`EntregaPedido`) | A viagem até casa do cliente. Tem vida própria: um pedido pode existir sem entrega (levantamento), uma entrega nunca existe sem pedido. |
| **Estafeta** | Quem faz a entrega. Não é um `User` do ControlCore — é um tipo de utilizador novo, com login e token próprios. |
| **Zona de entrega** | Onde a loja entrega e por quanto. Definida por bairro/cidade ou por raio em km à volta da loja. |
| **Cotação** | A pergunta "quanto custa entregar nesta morada?", respondida antes de o cliente confirmar. |
| **Acerto de contas** | O fecho do turno do estafeta: o dinheiro que ele cobrou na rua entra no caixa. |
| **Webhook** | Como um sistema **de fora** nos avisa, ou é avisado. Não é como o nosso estafeta comunica — esse usa a API normal. |
| **Expedir / despachar** | O momento em que a mercadoria sai da loja para o estafeta. |

---

##### 3. Decisões já fechadas — não reabrir em refinamento

Estão justificadas no plano técnico (§3, "Decisões de arquitectura"). Quem discordar
levanta no retro, não a meio do sprint.

1. **A venda nasce na expedição, não na entrega.** Porque `ProcessarVendaUseCase` exige
   sessão de caixa aberta, e quando a entrega se confirma o turno pode já estar fechado.
2. **O dinheiro cobrado na rua não entra no caixa na expedição.** A venda regista o
   pagamento como `A_COBRAR_NA_ENTREGA` — o fecho de caixa só soma `NUMERARIO`, por isso
   a gaveta não espera dinheiro que está no bolso do estafeta. Fica uma conta a receber
   **sem cliente** (senão o motor de inadimplência cobrava o cliente por uma dívida do
   estafeta), e entra no caixa no acerto.
3. **A taxa de entrega é um campo em `Venda` e `Pedido`**, com `@default(0)`. Não é um
   produto de serviço (iria a stock negativo).
4. **O estafeta tem token próprio** (`JWT_ESTAFETA_SECRET`), como já acontece com o
   fornecedor e com a conta de cliente.
5. **Módulo novo `src/modules/entrega/`**, não campos dentro de `commerce`.
6. **Devolver uma entrega falhada é anular a venda** pelo `AnularVendaUseCase` que já
   existe — não se escreve uma segunda forma de desfazer uma venda.

---

##### 4. Definição de Pronto (vale para todas as histórias)

Uma história só se dá por fechada quando **tudo** isto se verifica:

- [ ] Compila: `npm run build` nos dois repositórios que tocou.
- [ ] `npm run lint` limpo.
- [ ] `npm test` verde, **incluindo testes novos** para as regras de negócio da história —
      não só o caminho feliz.
- [ ] Toda a consulta filtra por `empresaId`. Sem excepção.
- [ ] A rota declara o seu guarda (`@Permissao`, `@ContaCliente()`, `@Estafeta()`).
- [ ] No frontend: os quatro estados tratados — a carregar (skeleton), erro, lista vazia,
      sucesso. Erros passam por `mensagemDeErro()`.
- [ ] Identificadores e mensagens em português; comentários explicam o *porquê*.
- [ ] Demonstrada na review, a correr, não em slides.
- [ ] `Docs/plano_implementacao.md` actualizado **nas duas cópias**.

---

##### 5. O caminho — visão de conjunto

| Sprint | Objectivo numa frase | Demo no fim | Pontos |
| --- | --- | --- | --- |
| **0** | Desbloquear e preparar o terreno | Migração aplicada, permissões ligadas, segredos no Fly | 11 |
| **1** | O cliente consegue escolher entrega e ver a taxa | Pedido criado com morada e taxa | 21 |
| **2** | A loja despacha e a venda nasce | Pedido ponta a ponta, sem estafeta na rua | 29 |
| **3** | As contas batem | Dinheiro da rua a entrar no caixa pelo acerto | 18 |
| **4** | O estafeta trabalha pelo telemóvel | Entrega feita inteira pela PWA | 23 |
| **5** | O cliente vê onde está a sua encomenda | Mapa ao vivo no detalhe do pedido | 13 |
| **6** | Um operador externo pode substituir a frota | Webhook assinado a mudar o estado | 9 |

**Cada sprint entrega valor sozinho e vai para produção.** O Sprint 2 já permite operar
entregas a sério — com o gestor a marcar os estados à mão. Do 4 em diante é conforto e
escala, não viabilidade.

**Regra de deploy, todos os sprints: backend primeiro, frontend depois.**

---

##### 6. Sprint 0 — Preparar o terreno · 11 pontos

> Não é um sprint de funcionalidades. São 2 a 3 dias antes do Sprint 1.

###### T-00.1 · Fechar as quatro decisões bloqueantes · [Product Owner] — ✅ feita em 2026-09-29

1. **Mapas:** Leaflet + OpenStreetMap, com o cliente a marcar o pino.
2. **`Pedido.estado` espelha a entrega:** sim.
3. **Um estafeta serve várias lojas da mesma empresa:** sim.
4. **`AGUARDA_CONFIRMACAO` e `AGUARDA_LEVANTAMENTO`:** remover nesta migração, com
   mapeamento para `CRIADO`/`PRONTO` antes, para a migração nunca falhar no arranque.

O porquê de cada uma está no plano técnico, §7.

###### T-00.2 · Migração base · 5 pts · [BE]

- Modelos novos e alterações de `schema.prisma` conforme §4.1 do plano técnico.
- `npx prisma migrate dev --name entrega_domicilio` · `npx prisma generate`.
- **Não destrutiva:** os pedidos existentes ficam `tipoEntrega = LEVANTAMENTO`, que é o que
  já são. Confirmar com um pedido antigo em base de dados de desenvolvimento.
- **Excepção:** se a decisão 4 for remover os `AGUARDA_*`, essa parte é destrutiva —
  estratégia no plano técnico §4.1; ensaiar numa *branch* do Neon com cópia de produção.
- ⚠️ O enum novo chama-se **`EstadoEntregaPedido`** e não `EstadoEntrega` — esse nome já
  está ocupado pelo estado de entrega de mensagens do CRM, e reutilizá-lo parte o CRM.

###### T-00.3 · Segredos e configuração · 3 pts · [BE/Infra]

- `fly secrets set JWT_ESTAFETA_SECRET=$(openssl rand -base64 48)` **antes** do deploy do
  código — se faltar, o módulo lança no arranque e o contentor não sobe.
- `.env.example` com as variáveis novas, **cada uma com o comentário do que acontece se
  faltar**.
- Preencher `latitude`/`longitude` das lojas piloto. Sem isso, todas as moradas caem em
  "fora de área" — falha visível, mas confusa se ninguém souber a causa.

###### T-00.4 · Permissões ligadas a perfis · 3 pts · [BE + FE]

Hoje as permissões do commerce existem mas **não estão ligadas a perfil nenhum**: só ADMIN
abre a fila de pedidos. Como "Despachar" é uma acção dessa fila, a entrega não funciona
para um operador de balcão sem fechar isto primeiro.

- Na migração: inserir as seis permissões novas (tabela no plano técnico §3.1) **e** ligá-las,
  junto com `pedidos_commerce`, aos perfis de sistema `Gestor` e `Funcionário / Caixa`.
- No `seed.ts`: os mesmos recursos nas listas de cada perfil. ⚠️ **O seed apaga as ligações
  dos perfis de sistema e recria-as** — se os recursos novos não estiverem nas listas, correr
  o seed desfaz a migração.
- No frontend: recursos novos em `AVAILABLE_RESOURCES` e `write:`/`delete:` em
  `IGNORED_PERMISSIONS` — senão o editor de perfis não os mostra.
- Nomes: `GERIR_ACERTOS_ESTAFETA`, não `ACERTAR_CONTAS_ESTAFETA` — `acertar` não é um verbo
  que o `PermissoesGuard` conheça, e funcionaria só por acidente.
- No deploy: invalidar a cache de permissões no Redis, senão só aparecem ao fim de 24 h.

---

##### 7. Sprint 1 — O cliente escolhe entrega · 21 pontos

**Objectivo:** no fim deste sprint um cliente consegue criar um pedido com morada e taxa.
Ninguém entrega nada ainda — o pedido fica em `PRONTO` como hoje.

###### US-01 · Guardar as minhas moradas · 5 pts · [BE + FE]

**Como** cliente do Compra Fácil, **quero** guardar as minhas moradas, **para** não as
escrever a cada compra.

**Pronto quando:**
- Crio, edito e apago moradas em `/loja/:lojaId/moradas`, e escolho uma como predefinida.
- Cada morada tem província, cidade, bairro, linha de morada e **referência** — em Maputo
  "casa amarela depois da bomba" vale mais do que um número de porta.
- Consigo marcar a localização: botão "Usar a minha localização" **ou** arrastar um pino
  no mapa.
- O botão de geolocalização **esconde-se** fora de contexto seguro (HTTP), não falha — a
  mesma restrição que a câmara do POS já tem.
- Não consigo apagar uma morada que está a ser usada por um pedido em curso (erro `409`
  com explicação).

**Tarefas:** modelo `EnderecoCliente` · `endereco-cliente.controller.ts` com `@ContaCliente()`
· `MoradasPage.tsx` + react-hook-form + Zod · `SelectorMorada.tsx` (reutilizado no checkout)
· `MapaEntrega.tsx` em modo selecção.

###### US-02 · Configurar onde a loja entrega · 5 pts · [BE + FE]

**Como** administrador, **quero** definir zonas com taxa e prazo, **para** controlar onde e
por quanto entregamos.

**Pronto quando:**
- Crio zonas por **faixa de distância à loja** (de X a Y km, em linha recta), cada uma com
  nome, taxa, prazo estimado em minutos, valor mínimo de pedido (opcional) e interruptor
  activa/inactiva. *(Decidido em 2026-10-06: só faixas de distância — bairro, cidade e
  província em texto livre são pouco fiáveis em Maputo e não decidem a taxa. O plano
  original previa também zonas por bairro/cidade/província.)*
- Uma loja **sem coordenadas** não deixa activar entrega, com mensagem clara a dizer porquê.
- **Faixas sobrepostas são recusadas ao gravar**, com mensagem a dizer com qual colide — em
  vez de uma regra de «ganha a mais específica» que ninguém vê. Daí que a cotação nunca
  tenha de escolher entre duas zonas.

**Tarefas:** modelo `ZonaEntregaLoja` (**já existe desde a Fase 22**, por faixas de
distância; só a unicidade parcial do nome entre zonas activas está no SQL da migração, não
no `@@unique` do Prisma) · validação de sobreposição no domínio · `ZonasEntregaPage.tsx`.

###### US-03 · Saber quanto custa entregar · 5 pts · [BE]

**Como** cliente, **quero** ver a taxa antes de confirmar, **para** não ter surpresas.

**Pronto quando:**
- `POST /commerce/entrega/cotacao` devolve `{ disponivel, taxa, prazoMinutos, motivo? }`.
- Morada fora de todas as zonas → `disponivel: false` com motivo legível.
- Subtotal abaixo do mínimo da zona → `disponivel: false` com o valor em falta.
- Zona inactiva é tratada como inexistente.

**Tarefas:** `domain/distancia-haversine.ts` e `domain/calcular-taxa.ts` — **funções puras,
com os testes a passar antes de existir controller** · `calcular-taxa.spec.ts` cobre: sem
coordenadas, zonas sobrepostas, fora de todas, inactiva, abaixo do mínimo.

###### US-04 · Escolher entrega no checkout · 6 pts · [BE + FE]

**Como** cliente, **quero** escolher entre levantar e receber em casa, **para** decidir como
me dá mais jeito.

**Pronto quando:**
- O checkout mostra dois botões: **Levantar na loja** / **Entregar em casa**.
- Escolhida a entrega: lista das minhas moradas e a taxa aparece como **linha própria** no
  resumo, antes do botão de confirmar.
- Morada fora de área → mensagem concreta ("Ainda não entregamos em Matola-Rio. Pode
  levantar na loja.") e volta a levantamento. **Nunca um botão desactivado sem explicação.**
- O pedido guarda `tipoEntrega`, `enderecoId` e `taxaEntrega`; a taxa entra no `totalFinal`.
- 🔴 **Um pedido de levantamento comporta-se exactamente como antes.** Teste de regressão
  obrigatório.

**Tarefas:** `CriarPedidoDto` + `CriarPedidoUseCase` · `CheckoutPage.tsx` · tipos em
`pedidos.api.ts`.

---

##### 8. Sprint 2 — A loja despacha · 29 pontos

**Objectivo:** uma entrega completa, operada pelo painel de gestão. Sem app de estafeta
ainda — o gestor marca os estados à mão. **Já dá para operar a sério.**

###### US-05 · Registar estafetas · 3 pts · [BE + FE]

**Como** gestor, **quero** registar quem faz entregas, **para** poder atribuir-lhes trabalho.

**Pronto quando:** CRUD de estafetas com nome, telefone, veículo, matrícula e loja
(opcional = serve todas) · password definida no registo · estafeta inactivo não aparece nas
atribuições.

###### US-06 · Despachar um pedido · 8 pts · [BE + FE]

**Como** funcionário de loja, **quero** entregar a mercadoria ao estafeta e fechar a saída,
**para** a encomenda seguir caminho.

**Pronto quando:**
- Um pedido em `PRONTO` com `tipoEntrega = ENTREGA` mostra **Despachar**, não "Confirmar
  levantamento".
- Despachar, por esta ordem: (1) muda o estado com **update condicional atómico**;
  (2) reservas → `CONSUMIDA`; (3) cria a `EntregaPedido` em `AGUARDA_RECOLHA`;
  (4) só então chama `ProcessarVendaUseCase` com a `taxaEntrega`.
- 🔴 **Dois funcionários a despachar o mesmo pedido ao mesmo tempo criam UMA venda.** O
  segundo recebe `400`. Teste obrigatório — é o defeito mais caro deste épico.
- Sem sessão de caixa aberta → `409` com mensagem que diz o que fazer.
- Caixa aberto **noutra loja** → `400` com o nome das duas lojas. É a regra que o
  levantamento ganhou há dois dias, pela mesma razão: senão o stock sai da loja errada.
- A venda leva o pagamento `A_COBRAR_NA_ENTREGA` e cria uma conta a receber sem cliente.
  🔴 **O saldo calculado do caixa não sobe.** Verificar na demo.
- A venda usa o que a conferência decidiu (`quantidadeConferida`, substituições), nunca o
  que foi pedido no checkout.

**Tarefas:** `ExpedirPedidoUseCase` · extrair `itensFinais` **e**
`recusarLojaDiferenteDaDoCaixa` de `ConfirmarLevantamentoUseCase` para um serviço
partilhado — **extrair, não copiar** · `A_COBRAR_NA_ENTREGA` em `MetodoPagamento`, aceite
só com canal `ECOMMERCE` ·
`taxaEntrega` opcional em `ProcessarVendaUseCase`, fora do cálculo de COGS e margem ·
teste que prova que o POS não mudou.

###### US-07 · Ver as entregas em curso · 5 pts · [FE]

**Como** gestor, **quero** um painel com as entregas por estado, **para** saber o que está
a acontecer sem telefonar a ninguém.

**Pronto quando:** coluna por estado · filtros por loja, estafeta e data · actualiza pelo
socket · lista vazia diz "Nenhuma entrega em curso", não um ecrã em branco.

###### US-08 · Marcar entregue ou falhada · 5 pts · [BE + FE]

**Como** gestor, **quero** registar o desfecho da entrega, **para** fechar o pedido.

**Pronto quando:** marcar entregue fecha o pedido em `CONCLUIDO` · marcar falhada exige
motivo de uma lista fechada (cliente ausente, morada errada, recusou, inacessível, outro) ·
cada mudança grava um `EventoEntrega` **imutável** (quem, quando, onde) · o cliente é
notificado por e-mail, pelo caminho que já existe.

###### US-09 · Devolver uma entrega falhada · 8 pts · [BE + FE]

**Como** gestor, **quero** que a mercadoria devolvida volte ao stock, **para** as contas
não ficarem penduradas.

**Pronto quando:**
- Devolver chama o `AnularVendaUseCase` que já existe: repõe o stock, anula a venda e põe
  o pedido em `CANCELADO`. Depois, a entrega passa a `DEVOLVIDA` e a conta a receber a
  `CANCELLED`. Repetir depois de uma falha a meio não duplica nada.
- Só um **gestor** pode devolver — a anulação já exige esse perfil, e é uma venda que se
  desfaz.
- 🔴 **Funciona com o caixa de quem despachou já fechado.** Hoje a anulação recusa sessões
  fechadas; passa a aceitar quando a venda é de entrega **e** não há numerário a devolver
  (a venda não pôs nada na gaveta, logo não mexe na conferência). **Uma venda de POS com
  sessão fechada continua recusada** — teste de regressão obrigatório.
- 🔴 **Com a mercadoria na rua, nada cancela o pedido.** Com o pedido `EXPEDIDO` ou
  `EM_ROTA`: cancelar pela gestão dá `400`, anular a venda dá `409`. Os dois com
  mensagem a dizer o caminho certo: marcar falhada e devolver.

**Tarefas:** `DevolverEntregaUseCase` · em `AnularVendaUseCase`, os dois ajustes acima ·
em `anularVendaTransacional`, a reversão do pedido passa a aceitar `FALHADA` além de
`CONCLUIDO` · em `CancelarPedidoGestaoUseCase`, trocar `estaConcluido` por
`lojaPodeCancelar` · em `pedido-estado.ts`, `lojaPodeCancelar`, `ESTADOS_EM_ENTREGA` e
`FALHADA` em `ESTADOS_PENDENTES` (conta nos "por atender" do painel; `EXPEDIDO` e
`EM_ROTA` não — estão com o estafeta).

---

##### 9. Sprint 3 — As contas batem · 18 pontos

**Objectivo:** o dinheiro cobrado na porta chega ao caixa por um caminho rastreável.

###### US-10 · Registar o valor cobrado · 5 pts · [BE + FE]

**Como** quem confirma a entrega, **quero** registar quanto recebi, **para** o acerto ter
base.

**Pronto quando:** confirmar entrega pede o valor **e o método** cobrados · numerário
fica como dívida do estafeta; M-Pesa/e-Mola pedem a referência e **não** entram no acerto
(o dinheiro foi para a carteira da loja, não para o bolso do estafeta) · valor diferente do
esperado **não bloqueia** — regista-se a diferença e fica visível.

###### US-11 · Acerto de contas do estafeta · 8 pts · [BE + FE]

**Como** gestor, **quero** fechar as contas do turno, **para** o dinheiro entrar no caixa.

**Pronto quando:**
- O ecrã soma as entregas do estafeta ainda por acertar e mostra o total esperado.
- Registo o que ele entregou de facto. A diferença **não impede fechar** — fica registada e
  visível. Bloquear o fecho por 50 MZN deixava o estafeta sem poder acabar o turno.
- Fechar cria `MovimentoCaixa(REFORCO)` na sessão de quem recebe e passa os registos
  financeiros a `PAID`.
- Sem sessão de caixa aberta → `409`.
- Auditado, com segregação de funções.

###### US-12 · Quanto é que cada estafeta deve · 5 pts · [FE]

**Como** gestor, **quero** ver o que está por acertar, **para** saber quem tem dinheiro meu
na rua.

**Pronto quando:** lista por estafeta com valor em aberto, entregas pendentes e data do
último acerto · ordenada pelo maior valor em aberto.

---

##### 10. Sprint 4 — O estafeta na rua · 23 pontos

**Objectivo:** a entrega deixa de ser marcada pelo gestor e passa a ser feita pelo estafeta,
no telemóvel dele.

> **Desenhar para telemóvel primeiro, para ser usado com uma mão, na rua, ao sol.** Alvos de
> toque grandes, contraste alto, sem tabelas. Se precisa de zoom, está errado.

###### US-13 · Entrar na app do estafeta · 5 pts · [BE + FE]

**Pronto quando:** `/estafeta/entrar` com telefone e password · token próprio,
**cookie próprio**, validade 12h (um turno) · rotas `/estafeta/*` **fora do
`ProtectedRoute`**, como `/loja` e `/fornecedor` já estão · o guarda confirma na base de
dados a cada pedido que a conta continua activa.

**Tarefa:** `estafeta-token.ts` é uma cópia estrutural de `cliente-token.ts` — **ler esse
ficheiro primeiro**, incluindo o comentário que explica porque não cai para
`JWT_ACCESS_SECRET`.

###### US-14 · Ver e aceitar as minhas entregas · 5 pts · [BE + FE]

**Pronto quando:** vejo só as minhas · aceitar uma já aceite por outro dá `409` com
mensagem clara · uma atribuição não aceite em N minutos volta à fila (tarefa agendada, ao
lado da que expira reservas) · morada com botão que abre o mapa do telemóvel.

###### US-15 · Recolher, entregar, falhar · 8 pts · [BE + FE]

**Pronto quando:** três botões grandes, um por passo · entregar pede o valor cobrado quando
aplicável · falhar exige motivo · foto de prova opcional, para o bucket S3 que já existe ·
cada acção grava `EventoEntrega` · transição inválida (entregar sem ter recolhido) é
recusada com mensagem, não com erro genérico.

###### US-16 · Atribuição automática · 5 pts · [BE] · **opcional**

Atribui ao estafeta `DISPONIVEL` mais próximo da loja. Por proximidade e não por leilão:
um leilão precisa de uma massa de estafetas que uma loja não tem. **Corta-se sob pressão de
prazo** — o gestor continua a atribuir à mão.

---

##### 11. Sprint 5 — O cliente vê onde está · 13 pontos

###### US-17 · Canal de tempo real para três tipos de utilizador · 5 pts · [BE]

**Pronto quando:**
- Namespace novo `/entregas` aceita os três tokens: funcionário, cliente e estafeta.
- 🔴 **Um cliente nunca entra na sala da empresa** — veria as entregas de toda a gente.
  Cada um na sua sala: `empresa_<id>`, `pedido_<id>`, `estafeta_<id>`.
- O namespace raiz **não se toca**: é ele que configura o Engine.IO e os seus cabeçalhos
  valem para todos os namespaces (está comentado no ficheiro).

###### US-18 · Emitir a posição · 3 pts · [FE + BE]

**Pronto quando:** a PWA emite de 15 em 15 segundos, **só** se andou mais de 25 m e **só**
entre recolher e entregar · pára quando a entrega fecha · a última posição guarda-se no
estafeta (sobrescrita), o rasto contínuo **não se grava** — são ~2.900 linhas por dia por
estafeta e o valor de auditoria está nos eventos, não no rasto.

###### US-19 · Mapa e linha do tempo · 5 pts · [FE]

**Pronto quando:** o detalhe do pedido mostra a linha do tempo dos eventos e, em rota, o
mapa com o estafeta · **sem WebSocket, degrada para consulta de 30 em 30 segundos** — um
mapa parado sem aviso é pior do que um mapa lento · etiquetas em linguagem de cliente ("O
estafeta está a caminho"), nunca o nome do estado do sistema.

**Percurso no mapa (acrescentado em 2026-10-05, a pedido do utilizador).** O mapa não
mostra só o ponto actual:
- **Rasto no ecrã** — `MapaEntrega` desenha uma linha com as posições recebidas desde
  que o ecrã abriu. Vive só na memória do browser: **não se grava nada** (a decisão de
  não guardar o rasto, acima, mantém-se). Quem abre o mapa a meio da entrega vê o rasto
  a partir desse momento, não o percurso desde a recolha.
- **Marcador da morada** de destino, com a distância em linha recta.
- **Rota prevista e tempo estimado de chegada (US-19b) — [obrigatório], decidido pelo
  utilizador em 2026-10-05. Pontos por estimar: os 13 do Sprint 5 e o total de 124 do
  plano não a incluem.** Linha da posição actual do estafeta à morada, e o tempo
  restante, no ecrã do cliente e na página de entregas da loja.
  - **Serviço de rotas atrás de uma interface** (`ServicoRotas`, no estilo do
    `CanalEntrega`, D5): o ecrã e o domínio não sabem qual é o fornecedor.
  - **Chamado pelo backend, nunca pelo browser:** a chave não vai para o cliente e o
    resultado partilha-se — cliente e loja a ver a mesma entrega gastam um pedido, não
    dois. Rota e tempo guardam-se em cache (Redis, que já existe), por entrega.
  - **Recalcula-se pouco:** só quando o estafeta se desviou da rota guardada mais de
    ~100 m, ou passado ~1 minuto. Cada pedido de rota custa cota; recalcular a cada
    posição (15 s) gastaria quatro vezes mais sem o cliente notar a diferença.
  - **Sem serviço, sem número:** se o fornecedor falhar ou a cota acabar, o ecrã
    mantém o rasto e a linha recta até à morada e **não mostra tempo estimado** — nunca
    um valor inventado. Mensagem concreta, não um mapa que parece avariado.
  - **Variáveis de ambiente** (no `.env.example`, cada uma com o que acontece se
    faltar): chave e endereço do fornecedor. Faltar = só desliga a rota prevista, não
    impede o arranque nem o rastreio.
  - **Decisão por tomar — o fornecedor** (bloqueia só esta US, não a Fase 0 nem as
    Fases 1 a 4): recomendo começar pelo **OpenRouteService** (plano gratuito com
    chave, cobertura OpenStreetMap), por não exigir infra nossa; o servidor público de
    demonstração do **OSRM não serve** para produção (política de uso, sem garantias).
    Se a cota gratuita não chegar ao volume real, o caminho seguinte é um OSRM próprio
    numa máquina Fly com o extracto de Moçambique do OpenStreetMap. **Antes de fechar:
    confirmar a cota e os termos actuais do fornecedor e orçamentá-la contra o número
    de entregas simultâneas esperado** — não os assumi aqui de memória.

---

##### 12. Sprint 6 — Integrações externas · 9 pontos

**Objectivo:** um operador de entregas externo pode substituir a frota própria sem
reescrever nada do domínio.

###### US-20 · Avisar sistemas de fora · 5 pts · [BE]

**Pronto quando:**
- Uma subscrição diz que URL avisar e de que eventos.
- A linha da fila é criada **na mesma transacção** da mudança de estado. Se o envio falhar,
  o facto fica na mesma; se a transacção falhar, não se avisa ninguém de algo que não
  aconteceu.
- Uma tarefa agendada envia com assinatura HMAC-SHA256 e recuo exponencial
  (1 min, 5, 15, 60, 6 h, 24 h). À 7.ª tentativa desiste e alerta.
- ⚠️ **Nunca chamar o URL externo dentro do use-case** — prendia a transacção do Neon à
  latência de um servidor alheio.

###### US-21 · Receber avisos de fora · 4 pts · [BE]

**Pronto quando:**
- `POST /webhooks/entrega/:operadorId` verifica a assinatura sobre o **corpo cru**
  (exige `rawBody: true` no `main.ts` — hoje não está), em comparação de tempo constante.
- Assinatura inválida → `401`. Desfasamento de mais de 5 minutos → recusado.
- 🔴 **O mesmo evento duas vezes responde `200` e não faz nada.** Nunca `409` — um erro faz
  o operador insistir mais.
- Responde `202` **antes** de processar. Um operador que espera 30 s pela nossa lógica marca
  o webhook como falhado e repete.

---

##### 13. O que a equipa tem de saber antes de começar

**Cinco armadilhas conhecidas.** Estão em detalhe no plano técnico (§3.4, "Riscos"):

1. **`EstadoEntrega` já existe** e é do CRM. O nosso chama-se `EstadoEntregaPedido`.
2. **`TransitarEstadoPedidoUseCase` lê-e-depois-escreve** — defeito **já existente**, que
   não corrigimos neste épico. O código novo usa update condicional atómico. Quem lhe mexer
   por engano, abre um `fix/` próprio.
3. **Não há uma única coordenada no schema.** A `Loja` não tem ponto. Sem isso não há raio
   nem mapa — por isso a T-00.3 vem antes de tudo.
4. **O código que já existe não conhece os estados novos.** `CancelarPedidoGestaoUseCase` e
   `AnularVendaUseCase` aceitariam um pedido com a mercadoria na mota do estafeta. A US-09
   fecha os dois — não é opcional.
5. **Testar com um utilizador que não seja ADMIN.** O ADMIN tem *bypass* de permissões e
   esconde qualquer erro de ligação a perfis. Usar um `Funcionário / Caixa`.

**Convenções que não se negoceiam:** branch por alteração (nunca `main` directo, que faz
deploy automático) · Conventional Commits em português no imperativo · reutilizar antes de
criar (procurar em `src/shared/` primeiro) · `Docs/plano_implementacao.md` actualizado nas
duas cópias, no mesmo PR que fecha a história.

---

##### 14. Como demonstrar no fim de cada sprint

Sempre a correr, com `npm run start:dev` (3100) e `npm run dev` (5273).

| Sprint | O guião da demo |
| --- | --- |
| **1** | Criar morada dentro do raio → taxa aparece. Criar morada fora → mensagem, volta a levantamento. Fazer um pedido de **levantamento** e provar que nada mudou. |
| **2** | Com um **Funcionário / Caixa**: confirmar → preparar → conferir → **Despachar**. Mostrar a venda com a taxa, o stock em baixa e o caixa **na mesma**. Com o pedido na rua, tentar cancelar e anular — ambos recusados. Marcar entregue. Depois repetir, marcar falhada, **fechar o caixa**, e devolver como gestor → stock reposto, venda anulada. |
| **3** | Fechar o acerto de um estafeta com uma diferença de 50 MZN: fecha à mesma, a diferença fica registada, o caixa sobe. |
| **4** | Fazer uma entrega inteira só pelo telemóvel, com a app de gestão aberta ao lado a actualizar sozinha. |
| **5** | Dois ecrãs: o estafeta a andar, o cliente a ver o pino mexer. |
| **6** | `curl` com assinatura válida muda o estado; assinatura errada dá `401`; o mesmo evento repetido não duplica nada. |

**A demo do Sprint 2 é a que importa.** Se aquela correr, a funcionalidade existe — o resto
é torná-la confortável.

---

### 4.2 Multilínguas (internacionalização)

- **Data**: 2026-09-28
- **Estado**: Concluído — Fases 0 a 4 implementadas e mescladas (Secção 2, Fases 18 a
  20). Fica por fazer só a revisão do inglês por uma pessoa fluente e a regra de lint
  anti-texto-solto (ambas na Secção 3), e tudo o que a Secção 2.4 deixa para a entrega
  ao domicílio.
- **Desvios feitos ao longo da implementação** (prevalecem sobre o texto abaixo onde
  divergem):
  1. **A língua do servidor vem só do `Accept-Language`**, que o frontend envia com a
     língua activa — e não do utilizador autenticado (D2): o `nestjs-i18n` resolve a
     língua num middleware, antes do `JwtAuthGuard`. A Mayra é a excepção: o chat de
     texto já tem o pedido HTTP, mas a voz chega por WebSocket sem `Accept-Language` da
     aplicação, por isso as duas análises assíncronas e a voz resolvem a língua a partir
     da base de dados (`idiomaDoUtilizadorPorId`), não do cabeçalho.
  2. **`idioma` é opcional** (`NULL` = não escolheu), e não `@default("pt")` (§4.1):
     com um valor por omissão, `Empresa.idiomaPadrao` nunca seria usada.
  3. **A preferência vem na resposta do login**, e não de `GET /auth/eu` (§4.2/§4.3): o
     frontend não chama essa rota.
  4. **As 143 chamadas `toLocale*` espalhadas mudam com cada ecrã**, nas Fases 2 e 3, e
     não na Fase 1 (§4.3): esses 72 ficheiros são tocados de qualquer forma na extracção.
  5. **O frontend não envia explicitamente a língua à Mayra** (nem no chat nem na voz),
     ao contrário do que a §4.3 previa: o chat de texto já vai com `Accept-Language` no
     `axios`, e a voz lê a preferência gravada do utilizador directamente no servidor —
     enviar a língua a mais seria um segundo caminho para a mesma decisão.
- **Âmbito**: Fullstack (Backend + Frontend + Base de dados)
- **Repositórios afectados**: `ControleCore_BackEnd`, `ControleCore_FrontEnd`
- **Relacionado**: Entrega ao domicílio, §4.1 deste documento (por fazer) — ver §2.4 abaixo

---

#### 1. Objectivo

Hoje todo o sistema fala uma só língua: o português, escrito à mão em cada ecrã, em
cada erro do servidor e em cada e-mail. Isso fecha a porta a três públicos que já
tocam no produto ou vão tocar: clientes do Compra Fácil que não lêem português,
fornecedores da região (África do Sul, Essuatíni, Zimbabué) no portal B2B, e empresas
fora de Moçambique a quem o SaaS se possa vender. Esta funcionalidade cria a estrutura
para o sistema mostrar a interface, as mensagens, os e-mails e as respostas da Mayra na
língua de cada pessoa, e acrescentar uma língua nova sem mexer em código.

---

#### 2. Requisito interpretado

Construir **a infraestrutura de tradução** e **traduzir o sistema existente**, com o
português como língua de origem e por defeito. Na prática são dois trabalhos de tamanho
muito diferente:

1. **Infraestrutura** (pequena, fixa): biblioteca de tradução no frontend e no backend,
   preferência de língua guardada por utilizador, detecção da língua do browser,
   selector de língua, formatação de datas e números pela língua activa.
2. **Extracção e tradução** (grande, proporcional ao código): tirar do código cerca de
   **2.500–3.500 textos** do frontend e **~580 mensagens de erro, 16 e-mails e 65
   ferramentas da Mayra** do backend, e escrevê-los noutra língua.

**Onde a leitura diverge do literal do pedido:** "MultiLínguas" não inclui traduzir o
**conteúdo que os utilizadores escrevem** — nomes de produtos, descrições, textos de
campanhas do CRM, observações. Isso é conteúdo multilíngue (cada produto com o nome em
várias línguas), um projecto diferente e muito mais caro. Fica fora de âmbito (§2.3).

##### 2.1 Actores e permissões

Não há permissões novas: escolher a própria língua é algo que qualquer pessoa com sessão
pode fazer sobre si mesma.

| Actor | O que pode fazer |
| --- | --- |
| **Funcionário** (`User`, qualquer perfil) | Escolher a sua língua da interface |
| **ADMIN da empresa** | Definir a língua por defeito da empresa (para quem ainda não escolheu) |
| **Cliente do Compra Fácil** (`ContaCliente`) | Escolher a língua da loja e dos e-mails de pedido |
| **Utilizador do portal** (`UtilizadorFornecedor`) | Escolher a língua do portal e dos e-mails do portal |
| **Visitante sem sessão** (landing, mercado, loja) | Muda a língua no selector; fica guardada no browser |

##### 2.2 Regras de negócio

1. **O português é a língua de origem e o recurso final.** Uma chave que falte noutra
   língua mostra o texto em português, nunca a chave crua (`checkout.titulo`).
2. **A língua de cada pessoa decide-se por esta ordem:** preferência guardada da pessoa
   → língua da empresa (`Empresa.idiomaPadrao`) → língua do browser, se for suportada →
   português.
3. **A moeda nunca muda com a língua.** É sempre MZN (`Empresa.moeda`). Muda só a
   formatação: `1 234,50 MT` em português, `MT 1,234.50` em inglês.
4. *(Implícita)* **Os e-mails vão na língua do destinatário, não na de quem dispara a
   acção.** Um gestor em inglês que confirma um pedido manda ao cliente o e-mail na
   língua do cliente.
5. *(Implícita)* **Nomes próprios, códigos e valores de enum não se traduzem na base de
   dados.** A API continua a devolver `EM_PREPARACAO`; a etiqueta ("Em preparação" /
   "Being prepared") é do frontend. Já é esta a regra que a Mayra segue
   (`base.persona.ts`).
6. *(Implícita)* **Uma tarefa agendada ou um listener não tem pedido HTTP.** A língua de
   um e-mail enviado por cron vem da preferência guardada do destinatário, não de um
   cabeçalho.

##### 2.3 Fora de âmbito

- **Conteúdo escrito pelos utilizadores** em várias línguas (produtos, categorias,
  campanhas). Projecto próprio, se um dia for pedido.
- **Textos já gravados na base de dados em português** (ex.: descrições geradas em
  `listar-alertas.use-case.ts`, histórico de auditoria). Ficam como estão; só os novos
  passam a ser gerados a partir de códigos.
- **Documentos fiscais noutra língua.** O recibo continua em português (assunção 3).
- **Línguas da direita para a esquerda** (árabe). Nenhuma está pedida; o Tailwind v4
  suporta-as depois, sem refazer o que este plano cria.
- **Tradução automática em tempo real** do que não tiver tradução.

##### 2.4 Relação com a entrega ao domicílio

A entrega ao domicílio (§4.1 deste documento) está por fazer e cria
**muitos textos novos**: cerca de 15 ecrãs, a aplicação do estafeta, etiquetas de
`EstadoPedido` (`EXPEDIDO`, `EM_ROTA`, `FALHADA`), notificações ao cliente e mensagens de
erro dos casos novos (R11, R12).

- **Se a Fase 1 deste plano (infraestrutura) entrar antes da Fase 1 da entrega**, todo
  esse código já nasce com chaves de tradução, e traduzi-lo é só escrever mais um ficheiro.
  **É a ordem recomendada** (pergunta 3).
- Se a entrega vier primeiro, os textos dela entram na extracção em massa da Fase 3 —
  mais trabalho repetido, e sobre código acabado de escrever.
- **Pontos de contacto concretos**, para não esquecer em nenhum dos dois planos:
  - `ETIQUETA_ESTADO_PEDIDO` e `ETIQUETA_METODO_PAGAMENTO` (`pedidos.api.ts`) passam a
    chaves; os estados novos da entrega entram directamente como chaves.
  - As notificações de pedido (`notificar-cliente-pedido.service.ts` e os use-cases que o
    chamam) passam a ir na língua do cliente. A entrega acrescenta notificações — devem
    usar o mesmo mecanismo desde o início.
  - A aplicação do estafeta escolhe a língua pela preferência do `Estafeta` (campo
    `idioma`, a acrescentar ao modelo novo da entrega, com a mesma regra da §4.1).
- **Achado para o plano da entrega:** o frontend **não tem nenhuma base de PWA** (sem
  `vite-plugin-pwa`, sem manifest, sem service worker). A Fase 4 da entrega pressupõe uma
  PWA; esse trabalho não está estimado lá.

---

#### 3. Análise técnica

##### 3.1 Estado actual — o que já existe

| Área | Situação | Onde |
| --- | --- | --- |
| Bibliotecas de tradução | **Nenhuma**, nos dois lados | `package.json` |
| Língua no HTML | `<html lang="en">` com a interface em português — errado hoje | `index.html` |
| Preferência de língua | **Nenhum campo** em `User`, `ContaCliente`, `UtilizadorFornecedor`, `Empresa`, `Cliente` | `prisma/schema.prisma` |
| Formatação de moeda e data | Centralizada em `formatMoeda.ts` e `formatData.ts` (fixas em `pt-MZ`), mas contornada em **143 chamadas `toLocale*` espalhadas por 72 ficheiros**, com 5 locales diferentes (`pt-PT` ×99, `pt-MZ` ×74, `en-US` ×12, `pt-BR` ×4, `en-GB` ×2) | `src/shared/utils/` |
| Moeda escrita à mão | ~43 `MT` concatenados no frontend; **86 em 34 ficheiros** no backend | vários |
| Textos centralizados | Só o site público e o login: `src/shared/constants/copywriting.ts` (433 linhas) | frontend |
| Erros do servidor | **576 `throw new ...Exception('...')`** em português. O `ValidationPipe` global não tem `exceptionFactory` → as mensagens do class-validator saem **em inglês** hoje | `src/main.ts`, módulos |
| E-mails | 16 modelos HTML em template strings, `lang="pt"` fixo | `src/utils/email.templates.ts` |
| Mayra | As personas já mandam **responder na língua do utilizador**; a voz não fixa `languageCode` (detecta pelo áudio). O frontend adivinha `pt-PT`/`en-US` pelo texto (`utils/idioma.ts`) mas **não envia a língua ao backend** | `base.persona.ts`, `voice.persona.ts`, `useGeminiVoice.ts` |
| Preferências do cliente CRM | Tabela chave/valor `ClientePreferencia`, com `idioma` já documentado como exemplo de chave | `schema.prisma` · `identidade.dto.ts` |
| Rotas "a minha conta" | `GET /auth/eu`, `GET /commerce/conta/eu`, `PATCH /portal-fornecedor/perfil` | controllers respectivos |
| Testes | Frontend: Vitest, 7 ficheiros. Backend: Jest, 143 specs | — |

##### 3.2 Impacto no sistema

| Camada | Criar | Alterar |
| --- | --- | --- |
| **Dados** | Migração `idioma_utilizadores` | `User`, `ContaCliente`, `UtilizadorFornecedor` (+`idioma`); `Empresa` (+`idiomaPadrao`) |
| **Backend** | `src/i18n/<lingua>/*.json`; `src/shared/idiomas.ts`; resolvedor da língua | `app.module.ts`, `main.ts` (`ValidationPipe`), `prisma-excecao.filter.ts`, `email.templates.ts`, `mailer.service.ts`, `notificar-cliente-pedido.service.ts`, `ai-copilot-prompt.service.ts`, prompts Gemini, ~576 excepções (Fase 4, por módulo) |
| **Frontend** | `src/i18n/` (configuração), `src/locales/<lingua>/<ns>.json`, `SelectorIdioma` | `main.tsx`, `index.html`, `axios.ts`, `formatMoeda.ts`, `formatData.ts`, `mensagemDeErro.ts`, `useAuthStore.ts`, `useContaClienteStore.ts`, `usePortalStore.ts`, `Header`, schemas Zod (6 ficheiros), 176 `.tsx` de `features/` (Fase 3) |
| **Permissões** | Nenhuma | — |

##### 3.3 Decisões de arquitectura

| # | Decisão | Alternativa descartada | Porquê |
| --- | --- | --- | --- |
| **D1** | **Frontend: `i18next` + `react-i18next`**, com ficheiros JSON por língua e por *namespace* (um por feature), carregados sob pedido | `react-intl` (FormatJS); Lingui | A maior base de utilizadores em React; chaves tipadas em TypeScript; plurais; carregamento por namespace encaixa no *code-splitting* do Vite. `react-intl` obriga a mensagens ICU em todo o lado; Lingui exige um passo de compilação. |
| **D2** | **Backend: `nestjs-i18n`**, com a língua resolvida pelo `AsyncLocalStorage` que o projecto já usa | Traduzir erros só no frontend, por código | O backend precisa de traduzir de qualquer forma: e-mails, notificações e respostas de cron não passam pelo frontend. Um catálogo único no backend evita duas cópias. Traduz também as mensagens do `class-validator` (hoje em inglês). Lê o contexto por ALS, logo os use-cases continuam a não importar nada do Express (regra da Secção 3 do `CLAUDE.md`). |
| **D3** | **Erros ganham uma chave estável**: `throw new NotFoundException({ codigo: 'compra.pedido_nao_encontrado', parametros })`; o filtro global traduz para `message` | Traduzir a string portuguesa como chave | A frase portuguesa como chave parte a tradução sempre que alguém corrige um acento. Com o `message` preenchido pelo filtro, **`mensagemDeErro()` no frontend não muda**. |
| **D4** | **Migração das 576 excepções por módulo, progressiva**; uma excepção sem `codigo` continua a sair em português | Converter todas de uma vez | Um PR com 576 alterações não é revisível. O sistema funciona durante a migração: o que falta traduzir aparece em português, como hoje. |
| **D5** | **`idioma` como `String` validada** contra uma lista em `src/shared/idiomas.ts` (`'pt' \| 'en'`), `@default("pt")` | `enum Idioma` no Prisma | Acrescentar uma língua passa a ser uma linha de código e um ficheiro de traduções, sem migração nem `ALTER TYPE`. |
| **D6** | **Cliente do CRM (`Cliente`) usa `ClientePreferencia` com a chave `idioma`**, sem coluna nova | Coluna `Cliente.idioma` | A tabela existe para isto e o próprio schema dá `idioma` como exemplo. Uma coluna nova duplicaria o conceito. |
| **D7** | **Formatação só por `formatMoeda`/`formatData`/`formatNumero`**, que lêem a língua activa; as 143 chamadas `toLocale*` e os `MT` concatenados passam a usar estas funções | Deixar cada ecrã escolher o locale | Hoje já há cinco locales diferentes no mesmo sistema. Centralizar é o que faz a troca de língua ser real. |
| **D8** | **Personas da Mayra ficam em português**; o backend passa a indicar a língua preferida (`Responde em: <língua>`) no prompt | Traduzir as 9 personas | As personas são instruções para o modelo, não texto para o utilizador; o Gemini segue-as em qualquer língua. Traduzi-las duplicava a manutenção sem ganho. |
| **D9** | **O recibo de venda fica em português** na v1 | Recibo na língua do cliente | É um documento fiscal (NUIT, IVA). Em caso de dúvida legal, o português é a escolha segura (assunção 3). |

##### 3.4 Riscos e pontos sensíveis

| # | Risco | Impacto | Mitigação |
| --- | --- | --- | --- |
| **R1** | **Tamanho da extracção** (2.500–3.500 textos): regressões visuais, textos esquecidos | Alto | Por feature, uma de cada vez; regra de lint que proíbe texto solto em JSX nas features já migradas; teste que falha se uma chave existir em `pt` e faltar em `en`. |
| **R2** | **Textos em inglês são mais longos ou mais curtos**: botões partidos no POS em telemóvel | Médio | Verificar o POS e o checkout em 360 px nas duas línguas antes de fechar cada fase. |
| **R3** | **Cache da análise da Mayra por língua**: `AnalisarNecessidadesMayraUseCase` guarda a análise por `empresa:loja` durante 5 min; um gestor em inglês receberia a análise em português de outro | Médio | A chave de cache passa a incluir a língua. |
| **R4** | **E-mails de cron sem destinatário conhecido** (ex.: relatórios para todos os ADMIN) | Médio | Um e-mail por língua de destinatário; recurso a `Empresa.idiomaPadrao`. |
| **R5** | **Cache de sessão no frontend**: `useAuthStore` guarda o utilizador em `sessionStorage`; quem já tinha sessão não vê o campo `idioma` até voltar a entrar | Baixo | Ler `idioma` de `GET /auth/eu`, que já é chamado ao arrancar. |
| **R6** | **Mensagens de erro já traduzidas pelo filtro chegam a testes que comparam o texto** | Baixo | Os testes passam a comparar `codigo`, não a frase. |
| **R7** | **Ferramentas da Mayra devolvem texto em português** (31 ficheiros) e dinheiro formatado à mão (26) | Baixo | O modelo reformula na língua do utilizador; aceitável na v1. Converter só se aparecerem respostas mistas. |
| **R8** | **Tamanho do bundle** se todas as línguas forem carregadas de uma vez | Baixo | Namespaces carregados sob pedido (D1). |

---

#### 4. Plano de implementação

Cada passo **[obrigatório]** ou **[opcional]**. As fases estão na §8.

##### 4.1 Dados

Migração `prisma/migrations/<timestamp>_idioma_utilizadores/migration.sql`.
**Não destrutiva** — só acrescenta colunas com valor por defeito. As linhas existentes
ficam `'pt'`.

- [x] **[obrigatório]** `User.idioma`, `ContaCliente.idioma`, `UtilizadorFornecedor.idioma`
      — **`String?` opcional**, não `@default("pt")` (desvio 2).
- [x] **[obrigatório]** `Empresa.idiomaPadrao String @default("pt")`.
- [x] **[opcional]** Nada para `Cliente` — usa `ClientePreferencia` (D6).
- [x] **Acrescentado, fora do previsto aqui:** `PedidoAdesao.idioma` (Fase 2C) — o pedido
      de adesão é público, sem conta nem empresa, e precisava da própria coluna.
- [ ] **[obrigatório, na entrega ao domicílio]** `Estafeta.idioma` no modelo novo, com a
      mesma regra (§2.4) — por fazer, a entrega ao domicílio continua por implementar.

##### 4.2 Backend

- [x] **[obrigatório]** `src/shared/idiomas.ts`: `IDIOMAS_SUPORTADOS`, `IDIOMA_PADRAO`,
      `eIdiomaSuportado()` e `resolverIdioma(preferencia, empresa, cabecalho)` com a
      ordem da regra 2. Função pura, testada. Ganhou também `idiomaDoUtilizadorPorId()`
      (Fase 20), partilhada pela Mayra e pelas duas análises assíncronas.
- [x] **[obrigatório]** `nestjs-i18n` em `app.module.ts`: catálogo em `src/i18n/pt/*.json`
      e `src/i18n/en/*.json`, recurso a `pt`, resolvedor que lê o `Accept-Language`
      (desvio 1). Copiado para `dist/` no build (`nest-cli.json` → `assets`).
- [x] **[obrigatório]** `ValidationPipe` com `exceptionFactory` que traduz as mensagens do
      `class-validator` (hoje em inglês).
- [x] **[obrigatório]** Filtro global que traduz `{ codigo, parametros }` para `message`
      na língua do pedido; **sem `codigo`, deixa a mensagem como está** (D4).
      `PrismaExcecaoFilter` passa as suas duas mensagens a chaves.
- [x] **[obrigatório]** Endpoints para guardar a preferência (tabela abaixo); `idioma` na
      resposta do login dos três tipos de conta (desvio 3), não de `GET /auth/eu`.
- [x] **[obrigatório]** E-mails: `email.templates.ts` recebe a língua e lê os textos do
      catálogo; `mailer.service.ts` resolve a língua do destinatário (regra 4). O recibo
      fica em português (D9).
- [x] **[obrigatório]** Notificações de pedido do Compra Fácil (`transitar-estado-pedido`,
      `cancelar-pedido-gestao`, `conferir-pedido`, `confirmar-levantamento` →
      `notificar-cliente-pedido.service.ts`) na língua de `ContaCliente.idioma`.
- [x] **[obrigatório]** Mayra: `ai-copilot-prompt.service.ts` acrescenta a língua preferida
      (lida da base de dados, desvio 1 — não do `Accept-Language`) e formata a data com
      ela; `AnalisarNecessidadesMayraUseCase` e `AnalisarExcecaoMayraUseCase` pedem a
      resposta nessa língua e a cache passa a incluí-la (R3) — concluído na Fase 20,
      depois de verificado em falta após o resto da Fase 4.
      O `assistente-campanha.use-case.ts` **mantém** o português europeu fixo quando a
      campanha é em português — é regra de negócio do CRM, não da interface.
- [x] **[obrigatório, Fase 4]** Converter as excepções por módulo — concluído para
      **todos** os módulos (não só `commerce`/`b2b`/`auth`): `compra`, `inventory`,
      `armazem`, `crm`, `necessidade`, `fornecedor`, `vendas`, `caixa`, `financeiro`,
      `produto`, `users`, `hr`, `ponto`, `turno`, `perfil`, `modulo`, `empresa`,
      `contrato`, `salario`, `categoria`, `cliente`, `loja`, e os guards partilhados.
- [ ] **[opcional]** Converter os textos das 65 ferramentas da Mayra (R7) — não feito; o
      modelo reformula o resultado das ferramentas na língua do utilizador.

###### Endpoints

| Método | Rota | Entrada | Resposta | Erros | Permissão |
| --- | --- | --- | --- | --- | --- |
| `PATCH` | `/auth/eu/idioma` | `{ idioma: 'pt' \| 'en' }` | `{ idioma }` | `400` (não suportada), `401` | `JwtAuthGuard` (o próprio) |
| `PATCH` | `/commerce/conta/eu/idioma` | `{ idioma }` | `{ idioma }` | `400`, `401` | `@ContaCliente()` |
| `PATCH` | `/portal-fornecedor/perfil` (existente) | `+ idioma?` no DTO | perfil | `400`, `401` | guarda do portal (existente) |
| `PATCH` | `/empresas/:id` (existente) | `+ idiomaPadrao?` no DTO | empresa | `400`, `403` | a que já protege a edição da empresa |
| `GET` | `/auth/eu`, `/commerce/conta/eu` (existentes) | — | `+ idioma` | — | existentes |

##### 4.3 Frontend

- [x] **[obrigatório]** `src/i18n/index.ts`: `i18next` + `react-i18next` +
      `i18next-browser-languagedetector`; recurso a `pt`; **todos os namespaces no bundle
      inicial** (`import.meta.glob` eager, não `import()` sob pedido — ver a nota do
      próprio ficheiro: sem isso o ecrã mostrava a chave crua enquanto descarregava, por
      não haver `Suspense`). Inicializado antes do router.
- [x] **[obrigatório]** Tipos: declaração de `react-i18next` a partir de
      `src/locales/pt/*.json`, para que uma chave mal escrita seja erro de `tsc`.
- [x] **[obrigatório]** `index.html` e `document.documentElement.lang` seguem a língua
      activa (hoje `lang="en"` com a interface em português).
- [x] **[obrigatório]** `axios.ts`: interceptor que envia `Accept-Language` com a língua
      activa — é o que faz o servidor responder na língua certa a quem não tem sessão.
- [x] **[obrigatório]** Preferência: ao entrar, a língua vem da resposta do login (desvio
      3); sem sessão, do `localStorage` ou do browser. **Não** guardada em Zustand além
      do que o `i18next` já guarda.
- [x] **[obrigatório]** `SelectorIdioma` em `src/shared/ui/`, usado no `Header` do ERP
      (incl. o menu móvel, Fase 20 — o POS corre em telemóvel), no `LojaPublicaLayout`,
      no `PortalLayout` e na landing/adesão.
- [x] **[obrigatório]** `formatMoeda`, `formatMoedaCompacta`, `formatData`,
      `formatDataRelativa` e `formatInteiro`/`formatMoedaInteira` (acrescentados na Fase
      20, para valores sem casas decimais) passam a ler a língua activa (D7); as 143
      chamadas `toLocale*` e os `MT` concatenados foram substituídos, feature a feature.
- [x] **[obrigatório]** Zod: os schemas passam a mensagens por chave, criados dentro do
      componente com `useMemo(() => criarSchema(t), [t])`.
- [x] **[obrigatório]** Etiquetas de enum (`ETIQUETA_ESTADO_PEDIDO`,
      `ETIQUETA_METODO_PAGAMENTO` e as restantes, em todas as features) passam a chaves.
- [x] **[obrigatório, Fase 2–3]** Extracção por feature, com `copywriting.ts` substituído
      pelo namespace `site` (Fase 2C) e as 24 áreas do ERP + POS (Fase 3).
- [x] **[obrigatório, com desvio]** Mayra: a língua chega ao backend **sem** envio
      explícito no payload (desvio 5) — o chat de texto já vai com `Accept-Language` no
      `axios`; a voz (WebSocket, sem esse cabeçalho) lê a preferência gravada do
      utilizador do lado do servidor. `detectarIdioma()` continua a servir o
      reconhecimento de voz em tempo real, sem alteração.
- [ ] **[opcional]** Pseudo-língua de teste (`[!! Ţéxţö !!]`) — não feita.

##### 4.4 Transversal

- [x] **[obrigatório]** Testes backend: resolução de língua, filtro de tradução
      (`codigos-de-erro.spec.ts` confirma que todo `codigo`/`mensagemTraduzida` usado
      existe nos dois catálogos), e-mail na língua do cliente/destinatário, cache da
      análise de necessidades separada por língua (R3).
- [x] **[obrigatório]** Testes frontend: paridade de chaves `pt` ↔ `en` em todos os
      namespaces (falha se faltar uma); `formatMoeda`/`formatInteiro` nas duas línguas;
      `mensagemDeErro` sem alterações de comportamento.
- [ ] **[obrigatório]** Lint: proibir texto solto em JSX nas pastas já migradas — **não
      implementada** (Secção 3, backlog).
- [ ] **[obrigatório]** Tradução: revisão do `en` por uma pessoa fluente — **não feita**;
      decisão de 2026-10-01 foi publicar com a tradução de Claude e rever depois
      (Secção 3, backlog).
- [x] **[opcional]** Sem variáveis de ambiente novas.

##### 4.5 Documentação — [obrigatório]

- [x] `Docs/plano_implementacao.md` (duas cópias idênticas): entrada por fase fechada.
- [x] `Docs/TRD.md` (duas cópias): `i18next`, `react-i18next`,
      `i18next-browser-languagedetector`, `nestjs-i18n`.
- [ ] Guia curto para a equipa (neste plano ou no `README`): como criar uma chave, onde
      fica cada namespace, como acrescentar uma língua — **não feito**; este §4.2 e o
      padrão já em código (`gerar-catalogo.js`/`gerar-erros.js`, usados pelas Fases 2–4)
      servem de referência por agora.
- [x] Este plano actualizado a cada desvio, no commit que o introduz.

---

#### 5. Ficheiros afectados

##### `ControleCore_BackEnd`

| Ficheiro | Acção | Porquê |
| --- | --- | --- |
| `prisma/schema.prisma` | alterar | `idioma` em `User`, `ContaCliente`, `UtilizadorFornecedor`; `idiomaPadrao` em `Empresa` |
| `prisma/migrations/<ts>_idioma_utilizadores/migration.sql` | criar | Colunas novas, não destrutiva |
| `src/shared/idiomas.ts` + `idiomas.spec.ts` | criar | Línguas suportadas e ordem de resolução |
| `src/i18n/pt/*.json`, `src/i18n/en/*.json` | criar | Catálogo de mensagens |
| `nest-cli.json` | alterar | Copiar `src/i18n/` para `dist/` |
| `src/app.module.ts` | alterar | Registar `nestjs-i18n` |
| `src/main.ts` | alterar | `exceptionFactory` no `ValidationPipe`; filtro de tradução |
| `src/shared/prisma-excecao.filter.ts` | alterar | Mensagens por chave |
| `src/utils/email.templates.ts`, `src/utils/mailer.service.ts` | alterar | Língua do destinatário |
| `src/modules/commerce/application/services/notificar-cliente-pedido.service.ts` + 4 use-cases | alterar | Notificações na língua do cliente |
| `src/modules/auth/auth.controller.ts` (+ DTO) | alterar | `PATCH eu/idioma`; `idioma` em `GET eu` |
| `src/modules/commerce/conta-cliente.controller.ts` (+ DTO) | alterar | `PATCH eu/idioma`; `idioma` em `GET eu` |
| `src/modules/b2b/portal-fornecedor.controller.ts` (+ DTO de perfil) | alterar | `idioma` no `PATCH perfil` |
| `src/modules/ai-copilot/application/services/ai-copilot-prompt.service.ts` | alterar | Língua preferida no prompt |
| `src/modules/necessidade/.../analisar-necessidades-mayra.use-case.ts`, `src/modules/inventory/.../analisar-excecao-mayra.use-case.ts` | alterar | Língua da resposta e da cache |
| `src/modules/ai-copilot/infrastructure/gateways/ai-copilot-voice.gateway.ts` | alterar | `voice_error` por chave |
| `src/modules/**` (excepções) | alterar | Fase 4, por módulo |
| `package.json` | alterar | `nestjs-i18n` |

##### `ControleCore_FrontEnd`

| Ficheiro | Acção | Porquê |
| --- | --- | --- |
| `package.json` | alterar | `i18next`, `react-i18next`, `i18next-browser-languagedetector` |
| `src/i18n/index.ts`, `src/i18n/tipos.d.ts` | criar | Configuração e chaves tipadas |
| `src/locales/pt/*.json`, `src/locales/en/*.json` | criar | Textos por namespace |
| `src/main.tsx`, `index.html` | alterar | Inicialização; `lang` dinâmico |
| `src/shared/config/axios.ts` | alterar | `Accept-Language` |
| `src/shared/utils/formatMoeda.ts`, `formatData.ts` | alterar | Língua activa |
| `src/shared/ui/SelectorIdioma.tsx` | criar | Selector reutilizado em 4 sítios |
| `src/app/layout/Header.tsx`, layouts da loja e do portal | alterar | Selector |
| `src/features/auth/types/index.ts`, `useAuthStore.ts`, `useContaClienteStore.ts`, `usePortalStore.ts` | alterar | `idioma` do utilizador |
| `src/shared/constants/copywriting.ts` | alterar | Primeira extracção (já centralizado) |
| `src/features/compra-facil/api/pedidos.api.ts` e restantes mapas de etiquetas | alterar | Etiquetas por chave |
| 6 ficheiros com schemas Zod (`auth/pages/*`, `EmpresaDialog`, `ProductFormModal`, `UserDialog`) | alterar | Mensagens por chave |
| `src/features/ai-copilot/api/*`, `hooks/useGeminiVoice.ts` | alterar | Enviar a língua ao backend |
| `src/features/**/*.tsx` (176 ficheiros) | alterar | Extracção de textos, Fases 2–3 |

---

#### 6. Assunções

1. **Línguas da v1: português (`pt`, grafia europeia, como hoje) e inglês (`en`).** As
   línguas nacionais (changana, macua, sena…) ficam para depois; a estrutura aceita-as
   sem alterações. Ver pergunta 1.
2. **O português continua a ser a língua em que a equipa escreve o código e as chaves.**
   Os identificadores das chaves são em português (`checkout.confirmar_pedido`), seguindo
   a Secção 2 do `CLAUDE.md`.
3. **O recibo de venda fica em português**, por ser documento fiscal (D9). Confirmar com
   a contabilidade antes da Fase 2.
4. **A tradução para inglês é feita ou revista por uma pessoa fluente**, não só por
   tradução automática.
5. **A Mayra continua a detectar a língua pelo que o utilizador escreve ou diz**; a
   preferência só decide a língua por defeito.
6. **Os textos das campanhas do CRM continuam a ser escritos por quem cria a campanha**,
   na língua que escolher. O sistema não os traduz.

---

#### 7. Perguntas em aberto

Nenhuma bloqueante. Decididas pelo Product Owner em **2026-09-29**:

1. **Que línguas → português e inglês** na v1.
2. **Por onde começar → Compra Fácil e portal do fornecedor** (superfícies públicas).
   O ERP e o POS ficam para a Fase 3.
3. **A infraestrutura entra antes da entrega ao domicílio → sim.** Todo o código da
   entrega (§4.1) usa chaves de tradução desde o início.

**Não bloqueantes:** tudo o que está na §6.

---

#### 8. Ordem de execução e verificação

| Fase | Conteúdo | Tamanho aproximado | Depende de |
| --- | --- | --- | --- |
| **0 — Decidir** | Perguntas 1–3; revisor de inglês identificado | — | — |
| **1 — Infraestrutura** | Migração; `idiomas.ts`; `nestjs-i18n` + filtro + `ValidationPipe`; `i18next`; `Accept-Language`; selector; formatadores; endpoints de preferência; testes de paridade e de resolução | 1–2 semanas | 0 |
| **2 — Superfícies públicas** | `copywriting.ts`; Compra Fácil (26 ficheiros); mercado; portal do fornecedor (14); e-mails e notificações ao cliente; erros de `commerce`, `b2b` e `auth` | 2–3 semanas | 1 |
| **3 — ERP e POS** | Extracção por feature: POS (`vendas`) primeiro, por correr em telemóvel; depois `stock`, `compras`, `necessidades`, `crm`, `hr`, `financeiro` e as restantes. Os ecrãs da entrega ao domicílio entram aqui se tiverem sido feitos antes da Fase 1 | 4–6 semanas | 1 |
| **4 — Mensagens do servidor e Mayra** | Excepções dos módulos restantes; língua preferida no prompt da Mayra; cache por língua | 2–3 semanas, em paralelo com a 3 | 1 |

A Fase 2 e a 3 podem correr em paralelo com pessoas diferentes; a 4 também.

**Como verificar no fim de cada fase:**

```bash
cd C:/Documentos/SRG/ControlCore/ControleCore_BackEnd && npm run lint && npm run build && npm test
cd C:/Documentos/SRG/ControlCore/ControleCore_FrontEnd && npm run lint && npm run build && npm test
```

1. Browser em inglês, sem sessão: a landing e a loja abrem em inglês; mudar para
   português no selector e recarregar → continua em português.
2. Entrar como funcionário, mudar para inglês, sair e voltar a entrar noutro browser →
   abre em inglês (a preferência vem do servidor).
3. Provocar um erro de validação num formulário → mensagem na língua activa, sem
   `lojaIdshould not be empty`.
4. Cliente com a conta em inglês faz um pedido; um gestor em português confirma → o
   e-mail do cliente chega em inglês.
5. Valores em MZN nas duas línguas: `1 234,50 MT` / `MT 1,234.50`; datas no formato de
   cada língua.
6. POS e checkout num telemóvel de 360 px, nas duas línguas: nenhum botão partido.
7. Mayra: utilizador com preferência inglês → saudação e análise de necessidades em
   inglês; outro em português na mesma loja → a análise dele em português (R3).

**Notas de deploy:**

- A migração corre no arranque do contentor e não é destrutiva.
- Sem variáveis de ambiente novas.
- Backend primeiro, frontend depois: o frontend passa a ler `idioma` de `/auth/eu`.
- Confirmar que `src/i18n/` foi copiado para `dist/` na imagem — sem isso o backend
  arranca, mas todas as traduções caem no recurso em português.

---

### 4.3 Promoções com risco de stock (Compra Fácil)

Implementado em 2026-10-03 (Fase 21), a pedido directo do utilizador — sem passar
por «Fase em curso», por ser menor que a Entrega ao Domicílio ou o Multilínguas e
não exigir fases sequenciais.

**O que é:** desconto por período num produto ou numa categoria inteira do Compra
Fácil, com uma avaliação de risco de rutura de stock antes de a promoção ser
lançada — nunca bloqueante, só informativa (mesmo princípio de `saude-stock.ts`:
este sistema informa, não decide por quem lança a promoção).

**Dados** (`prisma/schema.prisma`): `enum TipoPromocao { PRODUTO, CATEGORIA }`;
`model Promocao` (`empresaId`, `nome`, `tipo`, `produtoId?`, `categoriaId?`,
`percentualDesconto` 1–90, `dataInicio`, `dataFim`, `isActive`, `criadoPorId?`).
Migração `20261003040000_promocoes`. O preço com desconto **nunca é persistido**
— calcula-se sempre na leitura, para a promoção acabar sozinha em `dataFim` sem
ser preciso repor nada.

**A heurística do risco** (`src/modules/promocao/domain/risco-stock-promocao.ts`,
testado sem I/O): sem dados históricos de elasticidade de preço reais — nenhuma
promoção tinha corrido ainda —, assume-se uma elasticidade de 1.5: cada 10% de
desconto sobe a procura esperada 15% sobre a média de vendas dos últimos 30 dias.
É uma estimativa declarada, não uma previsão; `SEM_DADOS` é devolvido em vez de
um número quando não há histórico de vendas. Classifica `BAIXO`/`MEDIO`/`ALTO`
comparando a cobertura do stock disponível com a duração da promoção.

**O desconto é real, não só visual** — o mesmo `PrecoPromocionalService`
(`src/modules/promocao/application/services/`) é chamado por
`CatalogoPublicoService` (o que o cliente vê) e por `CriarPedidoUseCase` (o que o
cliente paga no checkout). Prioridade: uma promoção directa no produto vale mais
do que uma da sua categoria. Sem isto, uma promoção seria decorativa — o
catálogo mostraria um preço que o checkout não cobraria.

**Tool da MAYRA** `assess_promotion_stock_risk`
(`src/modules/ai-copilot/infrastructure/tools/crm/`): avalia uma promoção
hipotética por nome de produto ou categoria, antes de ela existir — não cria
nada, só informa.

**Permissões:** `promocao.ver`/`promocao.gerir`, só ligadas ao perfil de sistema
`Gestor` (migração `20261003050000_promocao_permissoes`) — decidir um desconto de
preço é decisão de gestão, ao contrário da fila de pedidos, que o Caixa também
opera.

**Frontend:** página `/promocoes` — criar (com o risco mostrado antes de
confirmar, nunca bloqueando), listar, cancelar. Preço promocional riscado + badge
de desconto no detalhe do produto do Compra Fácil (`ProdutoDetalhePage`).

**Fica por fazer:** a MAYRA *recomendar* por iniciativa própria que produtos
promover (`CRM, recomendação por regras` no backlog) — este plano cobre só a
*avaliação* de uma promoção já decidida por uma pessoa.

---

## 5. Convenção para novas entradas

Ao fechar um merge novo (feature, fix, refactor — qualquer um que altere
comportamento), acrescentar à Secção 2, na fase correspondente ou numa fase nova:

```
- **AAAA-MM-DD · [BE|FE] · <autor do commit de merge>** — `<branch ou #PR>`
  - <subject de cada commit trazido pelo merge>
```

Um merge sem commits associados listados (ex.: `git log <base>..<branch>` vazio)
não entra aqui — normalmente é um merge vazio ou já registado do lado do outro
repositório.
