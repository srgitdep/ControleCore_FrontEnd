import { api } from '@/shared/config';
import type {
  LoginPayload,
  LoginResponse,
  EntrarPayload,
  RespostaEntrar,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '../types';

// POST /auth/login — login com código de acesso (mantido para compatibilidade; o ecrã de
// entrada usa `entrarApi`, que aceita também códigos de fornecedor)
export const loginApi = (payload: LoginPayload) =>
  api.post<LoginResponse>('/auth/login', payload).then((r) => r.data);

// POST /auth/entrar — o ecrã de entrada único: aceita o identificador de comprador OU de
// fornecedor, e o backend devolve `tipo` para se saber para onde reencaminhar.
export const entrarApi = (payload: EntrarPayload) =>
  api.post<RespostaEntrar>('/auth/entrar', payload).then((r) => r.data);

// POST /auth/logout — invalida o token actual no Redis
export const logoutApi = () =>
  api.post('/auth/logout').then((r) => r.data);

// POST /auth/forgot-password — redefine a senha e envia nome, código de acesso e nova senha por email
export const forgotPasswordApi = (payload: ForgotPasswordPayload) =>
  api.post<{ message: string }>('/auth/forgot-password', payload).then((r) => r.data);

// POST /auth/reset-password — redefine a senha com o token recebido por email
export const resetPasswordApi = (payload: ResetPasswordPayload) =>
  api.post<{ message: string }>('/auth/reset-password', payload).then((r) => r.data);
