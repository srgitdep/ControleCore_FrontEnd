# ControlCore — Frontend

> SaaS de Gestão de Supermercados · MVP · Vite + React 19 + TypeScript

---

## 📋 Sobre o Projecto

Interface web responsiva que alimenta o sistema **ControlCore** — solução SaaS multi-tenant para gestão de supermercados, minimarkets e pontos de venda.

**Contextos de uso suportados:**

| Contexto | Ecrã | Exemplo de Uso |
|---|---|---|
| **Desktop** | Monitor ≥ 1024px | Gestão de stock, relatórios, backoffice |
| **Tablet / Touch** | 768–1023px | PDV / Caixa com ecrã touch |
| **Mobile** | < 768px | Gestor de loja em mobilidade |

---

## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| **Bundler** | Vite 8 |
| **Framework** | React 19 |
| **Linguagem** | TypeScript 6 |
| **Routing** | react-router-dom v7 |
| **Estilo** | Tailwind CSS v4 · CVA · clsx · tailwind-merge |
| **Estado global** | Zustand 5 |
| **Data fetching** | TanStack Query v5 |
| **Gráficos** | Recharts |
| **Tabelas** | @tanstack/react-table v8 |
| **HTTP** | Axios 1 |
| **Formulários** | react-hook-form + Zod |
| **Realtime** | socket.io-client |
| **Linter** | Oxlint |

---

## 📁 Estrutura do Projecto

```
src/
├── api/
│   ├── axios.ts              # Instância Axios + interceptores JWT + refresh automático
│   ├── auth.api.ts
│   ├── stock.api.ts
│   ├── catalog.api.ts
│   └── ...
├── components/
│   ├── common/
│   │   ├── Button.tsx        # CVA: variantes (default/outline/ghost/destructive) + size touch (44px)
│   │   ├── ResponsiveTable.tsx  # Tabela adaptativa: <table> em sm+, Cards em mobile
│   │   └── ConfirmDialog.tsx
│   └── layout/
│       ├── AppLayout.tsx     # Orquestra sidebar (desktop) + drawer (mobile)
│       ├── Sidebar.tsx       # Drawer-aware: botão X em mobile, chevron em desktop
│       └── Header.tsx        # Hamburger menu em mobile (lg:hidden)
├── hooks/
│   ├── useAuth.ts
│   ├── useStock.ts
│   ├── useSocket.ts
│   └── ...
├── pages/
│   ├── auth/                 # Login
│   ├── dashboard/
│   ├── stock/                # StockListPage (TanStack Table + ResponsiveTable)
│   ├── vendas/               # PDV / Ponto de Venda
│   ├── empresas/
│   ├── users/
│   ├── history/
│   ├── settings/
│   └── ai-copilot/           # Chatbot Widget da Mayra
├── store/
│   ├── useAuthStore.ts       # JWT, user, permissões (Zustand + persist)
│   └── useUIStore.ts         # isMobileMenuOpen + isSidebarCollapsed
├── types/
│   ├── auth.types.ts
│   ├── stock.types.ts
│   └── ...
└── lib/
    └── utils.ts              # cn() helper (clsx + tailwind-merge)
```

---

## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js v20+
- Backend ControlCore API a correr em `http://localhost:3100`

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
```

Em desenvolvimento não é preciso definir `VITE_API_URL`: sem ela, o endereço da API é
deduzido do anfitrião que serve a página (ver `resolverEnderecoDaApi` em
[src/shared/config/axios.ts](src/shared/config/axios.ts)). Defina-a em produção, ou para
apontar para outro servidor.

### 3. Iniciar servidor de desenvolvimento
```bash
npm run dev
```

Aplicação disponível em: **http://localhost:5273**

---

## 📱 Vender pelo telemóvel

### Em produção — o que o operador de caixa faz

1. Abre o endereço do sistema no navegador do telemóvel
2. Entra com o seu código de acesso
3. No POS, toca em **Ler código** e aponta a câmara ao produto
4. Confirma a quantidade e toca em **Adicionar**

É tudo. Não há aplicação para instalar, nem configuração, nem avisos para aceitar.

Funciona porque produção é servida em **HTTPS** (Vercel no frontend, Render na API), e o
HTTPS é a única condição que a câmara exige. Nada de especial é preciso fazer: já está
satisfeita.

### Em desenvolvimento — porque é que aqui dá trabalho

Os navegadores só dão acesso à câmara em **contextos seguros**: HTTPS, ou `localhost`. O
servidor de desenvolvimento serve em `http://`, pelo que num endereço de rede como
`http://192.168.1.20:5273` o `navigator.mediaDevices` **nem existe** — não é uma permissão
recusada, é a API ausente. Nenhuma alteração ao código resolve isto.

Daí os passos abaixo existirem: são andaime para *testar* o leitor na máquina de
desenvolvimento. **Não** são o que o operador de caixa faz.

<details>
<summary>Passos para testar o leitor num telemóvel, em desenvolvimento</summary>

**1.** Em `.env.local` (que não é versionado):

```env
VITE_HTTPS=true
VITE_API_URL=/api/v1
```

O `VITE_API_URL=/api/v1` encaminha os pedidos pelo proxy do Vite
(ver `server.proxy` em [vite.config.ts](vite.config.ts)), para a página e a API
partilharem origem. Sem isso, uma página em HTTPS a chamar uma API em HTTP seria bloqueada
pelo navegador como conteúdo misto.

**2.** Arranque o backend (`npm run start:dev`) e o frontend (`npm run dev`).

**3.** O Vite anuncia o endereço de rede:

```
➜  Local:   https://localhost:5273/
➜  Network: https://192.168.18.17:5273/    ← este, no telemóvel
```

**4.** Abra-o no telemóvel, na mesma rede Wi-Fi. O certificado é auto-assinado, pelo que o
navegador avisa — aceite uma vez («Avançadas» → «Prosseguir»). Em produção isto não
acontece: o certificado é real.

</details>

### Notas

- Sem câmara, ou com a permissão recusada, o leitor oferece escrever o código à mão.
- O botão de leitura só aparece em dispositivos com câmara: num posto de caixa fixo, um
  botão que abre e falha é pior do que botão nenhum.
- O CORS do backend aceita endereços de rede privados, mas só nas portas de
  desenvolvimento e só fora de produção — ver
  [`cors-rede-local.ts`](../SRGControleCore-main/src/shared/cors-rede-local.ts), com testes.

---

## 📐 Arquitetura de UI

### Layout Responsivo (Mobile-First)

O `AppLayout` comporta-se de forma distinta por breakpoint, gerido pelo **`useUIStore`** (Zustand):

```
Mobile / Tablet (< lg)         Desktop (lg+)
┌───────────────────────┐      ┌──────────┬──────────────────────┐
│ ☰  Header             │      │          │ Header               │
│ ─────────────────     │      │ Sidebar  │ ──────────────────── │
│ Conteúdo (full width) │      │ (fixo,   │ Conteúdo             │
│                       │      │ collapse)│                      │
└───────────────────────┘      └──────────┴──────────────────────┘
  Drawer slide-in-from-left
  com overlay/backdrop
```

### `ResponsiveTable` — Adaptive Data Grid

O componente base `<ResponsiveTable table={table} />` (TanStack Table) adapta o layout ao viewport:

- **`sm+` (≥ 640px):** `<table>` semântico com `<thead>/<tbody>/<tr>/<td>`
- **`max-sm` (< 640px):** `<thead>` oculto; cada linha vira um **Card** vertical com rótulo de coluna visível

### `Button` — Variante `touch` (WCAG 2.5.5)

```tsx
// Para PDV/POS com ecrã touch:
<Button variant="success" size="touch">Confirmar Venda</Button>
// → min-h-[44px] min-w-[44px] · Cumpre WCAG 2.5.5 Target Size
```

---

## 🔐 Autenticação e Segurança

O `axios.ts` centraliza toda a lógica de autenticação:

- **Request interceptor:** injeta `Authorization: Bearer <token>` automaticamente em cada pedido — garante que o **Audit Log** do backend identifica sempre o utilizador.
- **Refresh automático:** em caso de `401`, usa o `refreshToken` para obter novos tokens sem interromper o UX. Pedidos em paralelo durante o refresh são enfileirados.
- **Zustand sync:** os tokens são lidos de `useAuthStore.getState()` (não direto do `localStorage`) para garantir sincronia pós-refresh.

> ⚠️ **TODO [OWASP A02/A07 — Produção]:** Os tokens residem atualmente em `localStorage` (exposição XSS). Em produção, migrar para **HttpOnly Cookies** (Secure, SameSite=Strict) com CSRF double-submit pattern. Ver comentário em `src/api/axios.ts`.

---

## 🗺️ Rotas

| Path | Componente | Roles |
|---|---|---|
| `/login` | `LoginPage` | Público |
| `/dashboard` | `DashboardPage` | SUPER_ADMIN, ADMIN, MANAGER |
| `/financeiro` | `FinanceiroDashboardPage` | SUPER_ADMIN, ADMIN, MANAGER |
| `/stock` | `StockListPage` | SUPER_ADMIN, ADMIN, MANAGER, STOCK_KEEPER |
| `/stock/:id` | `StockDetailsPage` | SUPER_ADMIN, ADMIN, MANAGER, STOCK_KEEPER |
| `/vendas` | `VendasPage` | SUPER_ADMIN, ADMIN, MANAGER, CASHIER |
| `/sessoes-historico` | `CaixasHistoricoPage` | SUPER_ADMIN, ADMIN, MANAGER, CASHIER |
| `/lojas` | `LojasPage` | SUPER_ADMIN, ADMIN |
| `/crm` | `ClientesPage` | SUPER_ADMIN, ADMIN, MANAGER |
| `/produtos` | `ProdutosPage` | Todos |
| `/empresas` | `EmpresasPage` | SUPER_ADMIN |
| `/utilizadores` | `UsersPage` | SUPER_ADMIN, ADMIN |
| `/historico` | `HistoryPage` | Todos |
| `/configuracoes` | `SettingsPage` | SUPER_ADMIN, ADMIN |

---

## 📜 Scripts

```bash
npm run dev        # Servidor de desenvolvimento (HMR)
npm run build      # Build de produção (tsc + vite build)
npm run preview    # Preview do build
npm run lint       # Oxlint
```

---

## 🗂️ Estado de Desenvolvimento

| Módulo | Estado |
|---|---|
| Autenticação (Login / Refresh / Logout) | ✅ Completo |
| Layout responsivo (Desktop / Tablet / Mobile) | ✅ Completo |
| Dashboard | ✅ Completo |
| Gestão de Stock (Lista + Ledger + Movimentos) | ✅ Completo |
| Ponto de Venda (PDV + Motor CMV) | ✅ Completo |
| Módulo Financeiro (DRE, Cashflow, Inadimplência) | ✅ Completo |
| CRM (Histórico + Risco de Crédito) | ✅ Completo |
| Gestão de Lojas e Caixas | ✅ Completo |
| Gestão de Empresas | 🔄 Em desenvolvimento |
| Gestão de Utilizadores | 🔄 Em desenvolvimento |
| Catálogo (Produtos, Categorias, Fornecedores) | 🔄 Em desenvolvimento |
| Assistente IA (Mayra) - Chat Widget com Markdown | ✅ Completo |
| Recursos Humanos | ⏳ Pendente |
| Histórico / Auditoria | ⏳ Pendente |
| Configurações | ⏳ Pendente |

---

## 📄 Licença

MIT
