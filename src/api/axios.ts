import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL as string;

// ─── Instância base do Axios ──────────────────────────────────────────────────
// withCredentials: true é obrigatório para que o browser envie os cookies
// HttpOnly automaticamente em cada request (incluindo cross-origin para a API).
export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Lógica de fila para pedidos que falham durante o refresh ─────────────────
let isRefreshing = false;
type QueueItem = { resolve: () => void; reject: (reason?: unknown) => void };
let failedQueue: QueueItem[] = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  failedQueue = [];
};

// ─── Response Interceptor: refresh automático em caso de 401 ─────────────────
// Com cookies HttpOnly, o browser gere os tokens de forma transparente.
// O interceptor apenas precisa de disparar o refresh quando o accessToken expirar.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isLoginRequest = originalRequest.url?.includes('/auth/login');
    const isRefreshRequest = originalRequest.url?.includes('/auth/refresh');

    // Só tenta refresh se for 401, não for login/refresh e ainda não reentrou
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isLoginRequest &&
      !isRefreshRequest
    ) {
      if (isRefreshing) {
        // Encadeia pedidos que chegam enquanto o refresh está em curso
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(api(originalRequest)),
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // O refreshToken é enviado automaticamente via cookie HttpOnly.
        // Não é necessário ler nem enviar nenhum token manualmente.
        await api.post('/auth/refresh');

        // O backend emitiu novos cookies — repetir o pedido original.
        // O novo accessToken já está no cookie e será enviado automaticamente.
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Refresh falhou (token expirado/revogado) — forçar novo login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
