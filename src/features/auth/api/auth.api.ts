import { api } from '@/api/axios';
import type {
  LoginPayload,
  LoginResponse,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '@/types/auth.types';

// POST /auth/login — login com código de acesso
export const loginApi = (payload: LoginPayload) =>
  api.post<LoginResponse>('/auth/login', payload).then((r: any) => r.data);

// POST /auth/logout — invalida o token actual no Redis
export const logoutApi = () =>
  api.post('/auth/logout').then((r: any) => r.data);

// POST /auth/forgot-password — envia código de 6 dígitos por email
export const forgotPasswordApi = (payload: ForgotPasswordPayload) =>
  api.post<{ message: string }>('/auth/forgot-password', payload).then((r: any) => r.data);

// POST /auth/reset-password — redefine a senha com o token recebido por email
export const resetPasswordApi = (payload: ResetPasswordPayload) =>
  api.post<{ message: string }>('/auth/reset-password', payload).then((r: any) => r.data);
