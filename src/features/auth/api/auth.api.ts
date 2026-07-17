import { api } from '@/api/axios';
import type {
  LoginPayload,
  LoginResponse,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '../types';

// POST /auth/login â€” login com cÃ³digo de acesso
export const loginApi = (payload: LoginPayload) =>
  api.post<LoginResponse>('/auth/login', payload).then((r) => r.data);

// POST /auth/logout â€” invalida o token actual no Redis
export const logoutApi = () =>
  api.post('/auth/logout').then((r) => r.data);

// POST /auth/forgot-password â€” envia cÃ³digo de 6 dÃ­gitos por email
export const forgotPasswordApi = (payload: ForgotPasswordPayload) =>
  api.post<{ message: string }>('/auth/forgot-password', payload).then((r) => r.data);

// POST /auth/reset-password â€” redefine a senha com o token recebido por email
export const resetPasswordApi = (payload: ResetPasswordPayload) =>
  api.post<{ message: string }>('/auth/reset-password', payload).then((r) => r.data);
