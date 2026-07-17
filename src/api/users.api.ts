import { api } from './axios';
import type { UserDetail, CreateUserPayload, UpdateUserPayload, UserStatusActionPayload } from '@/types/user.types';

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
  await api.delete(`/users/${id}`, { data: payload });
};

export const activateUser = async (id: string, payload: UserStatusActionPayload): Promise<void> => {
  await api.patch(`/users/${id}/activate`, payload);
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}/delete`);
};

export const resendPassword = async (id: string): Promise<{ message: string }> => {
  const { data } = await api.post(`/users/${id}/reenviar-senha`);
  return data;
};
