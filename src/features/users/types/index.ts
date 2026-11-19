import type { Role } from '@/features/auth';

export interface UserDetail {
  id: string;
  code: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  empresaId?: string;
  /** Perfil de permissões próprio; nulo usa o do cargo (`perfil-por-cargo.ts` no servidor). */
  perfilId?: string | null;
  /** Bloqueado por tentativas falhadas até esta data (só na lista; nulo ou passada = livre). */
  bloqueadoAte?: string | null;
  createdAt: string;
  updatedAt: string;
  empresa?: {
    id: string;
    nome: string;
  };
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password?: string; // opcional se for auto-gerada
  role: Role;
  empresaId?: string; // opcional para SuperAdmin atribuir
  /**
   * Perfil de permissões: um de sistema ou da empresa. Omitir (ou `null`, a editar) usa o
   * perfil do cargo. O servidor recusa um perfil de outra empresa.
   */
  perfilId?: string | null;
  isActive?: boolean;
}

export type UpdateUserPayload = Partial<CreateUserPayload>;

export interface UserStatusActionPayload {
  reason?: string;
}
