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
│   └── settings/
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
- Backend ControlCore API a correr em `http://localhost:3000`

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:3000/api/v1
```

### 3. Iniciar servidor de desenvolvimento
```bash
npm run dev
```

Aplicação disponível em: **http://localhost:5173**

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
| `/stock` | `StockListPage` | SUPER_ADMIN, ADMIN, MANAGER, STOCK_KEEPER |
| `/stock/:id` | `StockDetailsPage` | SUPER_ADMIN, ADMIN, MANAGER, STOCK_KEEPER |
| `/vendas` | `VendasPage` | SUPER_ADMIN, ADMIN, MANAGER, CASHIER |
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
| Ponto de Venda (PDV) | 🔄 Em desenvolvimento |
| Gestão de Empresas | 🔄 Em desenvolvimento |
| Gestão de Utilizadores | 🔄 Em desenvolvimento |
| Catálogo (Produtos, Categorias, Fornecedores) | ⏳ Pendente |
| Recursos Humanos | ⏳ Pendente |
| Histórico / Auditoria | ⏳ Pendente |
| Configurações | ⏳ Pendente |

---

## 📄 Licença

MIT
