# FrontEnd — SRG ControlCore (Back-Office)

## Contexto e Objectivo

O backend NestJS do **SRG ControlCore** já tem **7 fases** desenvolvidas e em produção, com mais de 20 módulos expostos via REST API (`/api/v1/...`).

O frontend será um **Back-Office Web** (painel de gestão interno), destinado a Gestores, Funcionários e Armazenistas — responsável por toda a operação do sistema: desde o login até gestão de stock, vendas, CRM e relatórios.

---

## ✅ Decisões Confirmadas

| # | Questão | Decisão |
|---|---------|---------| 
| 1 | Framework de UI | ✅ **shadcn/ui** (Radix UI + Tailwind CSS) |
| 2 | Idioma da interface | ✅ **Português (pt-MZ)** — igual ao backend |
| 3 | Abordagem de desenvolvimento | ✅ **Módulo a módulo** — começar pelo Login e Dashboard |
| 4 | URL da API (dev) | ✅ `http://localhost:3000/api/v1` |
| 5 | Moeda | ✅ Meticais — formato `X.XXX,XX MT` |
| 6 | Tokens | ✅ **localStorage** (access + refresh token) |
| 7 | Sem permissão (403) | ✅ Notificação toast — sem página separada |

---

## Stack Técnica (Confirmada)

| Camada | Tecnologia | Decisão |
|--------|-----------|---------| 
| Framework | **React 18 + TypeScript** via Vite | ✅ |
| Routing | **React Router v6** | ✅ |
| State / Cache | **TanStack Query v5** | ✅ |
| Tabelas | **TanStack Table v8** | ✅ |
| Formulários | **React Hook Form + Zod** | ✅ |
| UI Components | **shadcn/ui** (Radix UI + Tailwind v4) | ✅ |
| Gráficos | **Recharts** | ✅ |
| HTTP Client | **Axios** com interceptors JWT | ✅ |
| Notificações | **react-hot-toast** | ✅ |
| Ícones | **Lucide React** (incluído no shadcn/ui) | ✅ |
| Auth Guard | Context API + JWT (access + refresh token) | ✅ |

---

## Módulos do Back-Office (por prioridade de entrega)

### 🔐 Módulo 1 — Autenticação *(em curso)*
- Página de Login (`/login`) em Português (pt-MZ)
- Login por **código de acesso** (`code`) — não por email
- Refresh token automático via interceptor Axios (rotation pattern)
- Protecção de rotas por perfil (`SUPER_ADMIN` / `ADMIN` / `MANAGER` / `USER`)
- Formulário com validação Zod + React Hook Form
- Páginas: Login, Recuperar Password, Redefinir Password

### 🏢 Módulo 2 — Dashboard *(2.º a construir)*
- KPIs: Vendas do dia, Stock crítico, Pedidos pendentes
- Gráfico de vendas (últimos 7/30 dias) com Recharts
- Alertas de stock mínimo
- Valores formatados em Meticais (`X.XXX,XX MT`)

### 📦 Módulo 3 — Produtos e Categorias
- Lista de produtos com filtros e pesquisa (TanStack Table)
- CRUD de categorias
- CRUD de produtos (com unidades, fator de conversão, preço em MT)

### 🏭 Módulo 4 — Fornecedores
- CRUD de fornecedores
- Associação produto ↔ fornecedor + preço de compra

### 🛒 Módulo 5 — Compras e Requisições
- Lista de requisições internas
- Criação de pedidos de compra
- Fluxo de aprovação do Gestor (Aprovar / Rejeitar)
- Receção de mercadoria (total e parcial)

### 📊 Módulo 6 — Stock
- Tabela de saldos de stock por produto/armazém
- Histórico de movimentos
- Custo médio ponderado visível em MT

### 🏪 Módulo 7 — Ponto de Venda (POS)
- Gestão de caixas e sessões
- Registo de vendas
- Pagamentos múltiplos

### 👥 Módulo 8 — CRM / Clientes
- Lista de clientes com níveis (🥉 Normal / 🥈 Frequente / 🥇 VIP)
- Histórico de compras por cliente
- Gestão de pontos e fidelização

### 👨‍💼 Módulo 9 — Recursos Humanos
- Utilizadores e Perfis
- Contratos, Turnos, Pontos
- Processamento salarial

### 🏗️ Módulo 10 — Configurações
- Empresa, Lojas, Armazéns
- Módulos do sistema

---

## Estrutura de Ficheiros

```
ControleCore_FrontEnd/
├── Docs/                          # Documentação do projecto
│   └── implementation_plan_FRONTED.md
├── src/
│   ├── api/                       # Axios instance + serviços por módulo
│   │   ├── axios.ts               # Config base + interceptors JWT
│   │   ├── auth.api.ts
│   │   ├── dashboard.api.ts
│   │   ├── produto.api.ts
│   │   └── ...
│   ├── components/
│   │   ├── ui/                    # shadcn/ui (auto-gerados pelo CLI)
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── AppLayout.tsx
│   │   └── shared/
│   │       ├── DataTable.tsx
│   │       ├── FormField.tsx
│   │       ├── StatusBadge.tsx
│   │       ├── MoedaDisplay.tsx
│   │       └── PageHeader.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── usePermission.ts
│   ├── lib/
│   │   └── utils.ts               # cn() do shadcn
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   └── ResetPasswordPage.tsx
│   │   ├── dashboard/
│   │   ├── produtos/
│   │   ├── fornecedores/
│   │   ├── compras/
│   │   ├── stock/
│   │   ├── vendas/
│   │   ├── clientes/
│   │   ├── rh/
│   │   └── configuracoes/
│   ├── router/
│   │   ├── index.tsx
│   │   └── ProtectedRoute.tsx
│   ├── types/
│   │   ├── auth.types.ts
│   │   └── ...
│   └── utils/
│       ├── formatMoeda.ts
│       └── formatData.ts
├── .env                           # Variáveis locais (não commitar)
├── .env.example                   # Template de variáveis de ambiente
├── components.json                # shadcn/ui config
├── vite.config.ts
└── package.json
```

---

## Sequência de Execução (Módulo a Módulo)

| Passo | Fase | Estado |
|-------|------|--------|
| 0 | **Scaffold** | ✅ Vite + React + TS + dependências instaladas |
| 1 | **Design System** | 🔄 Tailwind v4 + shadcn/ui + tema de cor |
| 2 | **Auth** | ⏳ AuthContext + Axios interceptors + Login page |
| 3 | **Layout** | ⏳ Sidebar em PT + Header + AppLayout + ProtectedRoute |
| 4 | **Dashboard** | ⏳ KPIs + gráfico de vendas (Recharts) em MT |
| 5 | **Módulos CRUD** | ⏳ Produtos → Fornecedores → Stock → Compras → Clientes |

---

## Verification Plan

### Automated Tests
- `npm run dev` — servidor Vite arranca sem erros na porta 5173
- `npx tsc --noEmit` — TypeScript sem erros de tipos

### Manual Verification
- Login com `code` + `password` do seed do backend
- Refresh token automático transparente
- Logout invalida token no Redis
- Navegação entre módulos sem erros de routing
- Dashboard carrega dados reais via API
- Valores monetários formatados correctamente em MT
- Textos todos em Português (pt-MZ)
