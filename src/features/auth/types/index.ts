// â”€â”€â”€ Roles (espelho do enum do Backend prisma/schema.prisma) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'STOCK_KEEPER' | 'USER';

// Mapeamento de roles para exibiÃ§Ã£o em PortuguÃªs (pt-MZ)
export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Administrador',
  ADMIN: 'Administrador',
  MANAGER: 'Gestor / Supervisor',
  CASHIER: 'Operador de Caixa',
  STOCK_KEEPER: 'Armazenista',
  USER: 'FuncionÃ¡rio',
};

// â”€â”€â”€ Payloads de Request â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// POST /auth/login â€” campo "code", NÃƒO email
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

// â”€â”€â”€ Respostas do Backend â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface AuthUser {
  id: string;
  name: string;
  code: string;
  email: string;
  role: Role;
  permissions?: string[];
}

// Resposta completa do POST /auth/login
// Tokens removidos do body â€” chegam como HttpOnly cookies geridos pelo browser
export interface LoginResponse {
  user: AuthUser;
}

// POST /auth/refresh nÃ£o retorna tokens no body â€” os cookies sÃ£o rotacionados pelo backend
export interface RefreshResponse {
  message: string;
}

// â”€â”€â”€ Estado do AuthContext â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: Role[]) => boolean;
}
