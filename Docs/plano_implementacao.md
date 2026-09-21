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
- Fonte de verdade para "o que já existe": `git log --merges` dos dois
  repositórios. Este documento é a leitura human-friendly desse histórico; se
  divergirem, o `git log` é que manda — corrigir aqui.
- Para a stack técnica, APIs e serviços de terceiros (pagos ou não), ver
  [`TRD.md`](./TRD.md). Este documento não repete essa informação.

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

---

## 3. Backlog — Por Fazer

> Checklist viva. Ao concluir um item, mudar para `- [x]` e acrescentar a entrada
> correspondente na Secção 2 (nova fase ou item dentro da fase em curso), no mesmo
> commit/PR.

### Compra Fácil

- [ ] **CRM, recomendação por regras e promoções** (Compra Fácil). Fonte:
      `plano_feature_compra_facil.md` §8.3 (documento de planeamento já
      removido do `Docs/` por estar superado; texto completo no histórico git,
      commit `feat/compra-facil-fase11`). Depende do núcleo do pedido estar
      estável (Fases 11–12, já concluídas).
- [ ] `FavoritoCliente` — pendência opcional deixada em aberto na Fase 11 (o
      modelo já existe no schema Prisma; falta a funcionalidade de topo).
- [ ] Promoções com verificação de risco de stock (`assess_promotion_stock_risk`,
      tool da MAYRA prevista para uma fase futura).
- [ ] Histórico de compras entre empresas diferentes — hoje "lojas onde já
      comprei" só vê a empresa da `ContaCliente` autenticada actual (Fase 13);
      exigiria um projecto de identidade de cliente entre empresas, fora do
      âmbito do mercado.
- [ ] Galeria de produto com várias fotos no mercado (hoje é uma imagem só por
      produto, herdado da Fase 11).

### Login com Google (Compra Fácil)

- [x] Configurar `GOOGLE_CLIENT_ID`/`VITE_GOOGLE_CLIENT_ID` reais em produção
      (Google Cloud Console) — configurado e confirmado funcional em produção
      em 2026-09-21 (Fase 12).
- [ ] Estados de loading/erro dedicados à volta do `<GoogleLogin>` — falta
      confirmar se o comportamento por omissão do componente chega.

### Infra / observação

- [ ] Confirmar em produção, com tráfego real, que as correcções de voz da Mayra
      (Fases 8–9) resolveram definitivamente a latência e os turnos perdidos na
      Gemini Live API — as últimas entradas da Fase 8 são `diag(...)`, ainda a
      confirmar por logs, não uma correcção fechada com certeza absoluta.

---

## 4. Convenção para novas entradas

Ao fechar um merge novo (feature, fix, refactor — qualquer um que altere
comportamento), acrescentar à Secção 2, na fase correspondente ou numa fase nova:

```
- **AAAA-MM-DD · [BE|FE] · <autor do commit de merge>** — `<branch ou #PR>`
  - <subject de cada commit trazido pelo merge>
```

Um merge sem commits associados listados (ex.: `git log <base>..<branch>` vazio)
não entra aqui — normalmente é um merge vazio ou já registado do lado do outro
repositório.
