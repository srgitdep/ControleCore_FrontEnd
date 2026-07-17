import type { Role } from '@/features/auth';

export interface UserDetail {
  id: string;
  code: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  empresaId?: string;
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
  isActive?: boolean;
}

export type UpdateUserPayload = Partial<CreateUserPayload>;

export interface UserStatusActionPayload {
  reason?: string;
}
