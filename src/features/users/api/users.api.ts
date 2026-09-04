import { api } from '@/shared/config';
import type { UserDetail, CreateUserPayload, UpdateUserPayload, UserStatusActionPayload } from '@/features/users';

export const getUsers = async (): Promise<UserDetail[]> => {
  const { data } = await api.get<UserDetail[]>('/users');
  return data;
};

export const getUser = async (id: string): Promise<UserDetail> => {
  const { data } = await api.get<UserDetail>(`/users/${id}`);
  return data;
};

export const createUser = async (payload: CreateUserPayload): Promise<UserDetail> => {
  const { data } = await api.post<UserDetail>('/users', payload);
  return data;
};

export const updateUser = async (id: string, payload: UpdateUserPayload): Promise<UserDetail> => {
  const { data } = await api.patch<UserDetail>(`/users/${id}`, payload);
  return data;
};

export const deactivateUser = async (id: string, payload: UserStatusActionPayload): Promise<void> => {
  await api.patch(`/users/${id}/status`, payload);
};

export const activateUser = async (id: string, payload: UserStatusActionPayload): Promise<void> => {
  await api.patch(`/users/${id}/status`, payload);
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}`);
};

export const resendPassword = async (id: string): Promise<{ message: string }> => {
  const { data } = await api.post(`/users/${id}/reenviar-senha`);
  return data;
};

/**
 * Define o PIN de um utilizador.
 *
 * ## Porque o PIN não é a senha
 *
 * A senha serve para entrar no sistema; o PIN serve para autorizar uma acção no balcão sem
 * fechar a sessão da caixa — anular uma linha, abrir a gaveta, aplicar um desconto. São
 * quatro a seis dígitos precisamente porque se digita à frente do cliente, e é essa
 * diferença que justifica os dois existirem.
 *
 * `PATCH /users/:id/pin` existia no servidor, com validação de comprimento e de só-dígitos,
 * e a palavra «PIN» não aparecia uma única vez no frontend.
 */
export const setUserPin = async (id: string, pin: string): Promise<void> => {
  await api.patch(`/users/${id}/pin`, { pin });
};
