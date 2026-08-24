import axios from 'axios';
import { reduzirParaCaminhoSeOutroSitio } from './enderecoApi';

/**
 * O endereço da API.
 *
 * `VITE_API_URL` continua a mandar quando está definido — é assim que produção e os
 * ambientes de teste apontam para o seu servidor.
 *
 * Quando **não** está definido, deduz-se do endereço que serve a página em vez de fixar
 * `localhost`. É o que permite ao operador de caixa abrir o sistema no telemóvel: um
 * `localhost` gravado no pacote significaria, no telemóvel, o próprio telemóvel — que não
 * tem API a correr. Deduzido, o telemóvel chama o mesmo computador de onde carregou a
 * página.
 *
 * Em produção há um passo a mais: um endereço que aponte para outro sítio é reduzido ao
 * seu caminho, para que os pedidos saiam pela própria origem e os cookies de sessão
 * contem como *first-party*. Sem isso o login não sobrevive num iPhone — o motivo está
 * em `enderecoApi.ts`, junto às funções que fazem a redução.
 *
 * Em desenvolvimento não se reduz nada: é onde apontar para outra máquina da rede é
 * legítimo, e é o que permite testar no telemóvel contra o computador.
 */
function resolverEnderecoDaApi(): string {
  const configurado = import.meta.env.VITE_API_URL as string | undefined;

  if (configurado) {
    if (!import.meta.env.PROD || typeof window === 'undefined') return configurado;
    return reduzirParaCaminhoSeOutroSitio(configurado, window.location.hostname);
  }

  // Sem `window` (testes, ou renderização fora do browser) não há de onde deduzir.
  if (typeof window === 'undefined') return '/api/v1';

  const { protocol, hostname } = window.location;
  const porta = (import.meta.env.VITE_API_PORT as string | undefined) ?? '3100';

  // O protocolo acompanha o da página, e não é uma escolha estética: uma página servida
  // em HTTPS não pode chamar um endereço em HTTP — o browser bloqueia como conteúdo
  // misto, sem pedir nada ao servidor.
  //
  // Consequência prática: com `VITE_HTTPS=true` (necessário para a câmara funcionar num
  // endereço de rede), a API também tem de responder em HTTPS. Ver a secção de acesso
  // móvel no README.
  return `${protocol}//${hostname}:${porta}/api/v1`;
}

const BASE_URL = resolverEnderecoDaApi();

// ── Instância base do Axios ──────────────────────────────────────────────────
// withCredentials: true é obrigatório para que o browser envie os cookies
// HttpOnly automaticamente em cada request (incluindo cross-origin para a API).
export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ── Lógica de fila para pedidos que falham durante o refresh ────────────────
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

// ── Response Interceptor: refresh automático em caso de 401 ────────────────
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
