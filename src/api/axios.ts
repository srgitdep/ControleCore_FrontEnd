import axios from 'axios';
import type { RefreshResponse } from '@/types/auth.types';

const BASE_URL = import.meta.env.VITE_API_URL as string;

// ─── Instância base do Axios ──────────────────────────────────────────────────
export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor: injeta o access token em cada pedido ────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Lógica de fila para pedidos que falham durante o refresh ─────────────────
let isRefreshing = false;
type QueueItem = { resolve: (value: unknown) => void; reject: (reason?: unknown) => void };
let failedQueue: QueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

// ─── Response Interceptor: refresh automático em caso de 401 ─────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isLoginRequest = originalRequest.url?.includes('/auth/login');

    // Só tenta refresh se for 401, não for um pedido de login e ainda não reentrou
    if (error.response?.status === 401 && !originalRequest._retry && !isLoginRequest) {
      const refreshToken = localStorage.getItem('refreshToken');

      // Sem refresh token → limpa sessão e redireciona (exceto se já estiver no login)
      if (!refreshToken) {
        localStorage.clear();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Coloca na fila enquanto o refresh já está em curso
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Usa axios puro (não a instância api) para evitar loop infinito
        const { data } = await axios.post<RefreshResponse>(
          `${BASE_URL}/auth/refresh`,
          { refreshToken },
        );

        // Guarda os novos tokens
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        // Actualiza o header padrão
        api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        processQueue(null, data.accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
