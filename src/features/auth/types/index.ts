// ──â”€ Roles (espelho do enum do Backend prisma/schema.prisma) ────────────────â”€
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'STOCK_KEEPER' | 'USER';

// Mapeamento de roles para exibição em Português (pt-MZ)
export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Administrador',
  ADMIN: 'Administrador',
  MANAGER: 'Gestor / Supervisor',
  CASHIER: 'Operador de Caixa',
  STOCK_KEEPER: 'Armazenista',
  USER: 'Funcionário',
};

// ──â”€ Payloads de Request ──────────────────────────────────────────────────────

// POST /auth/login — campo "code", NÃO email
export interface LoginPayload {
  code: string;
  password: string;
}

// POST /auth/forgot-password
export interface ForgotPasswordPayload {
  email: string;
}

// POST /auth/reset-password
export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

// ──â”€ Respostas do Backend ────────────────────────────────────────────────────â”€

export interface AuthUser {
  id: string;
  name: string;
  code: string;
  email: string;
  role: Role;
  permissions?: string[];
}

// Resposta completa do POST /auth/login
// Tokens removidos do body — chegam como HttpOnly cookies geridos pelo browser
export interface LoginResponse {
  user: AuthUser;
}

// POST /auth/refresh não retorna tokens no body — os cookies são rotacionados pelo backend
export interface RefreshResponse {
  message: string;
}

// ──â”€ Estado do AuthContext ────────────────────────────────────────────────────
export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: Role[]) => boolean;
}
