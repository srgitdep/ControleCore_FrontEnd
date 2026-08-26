import { resolverEnderecoDoSocket, type EnderecoDoSocket } from './enderecoApi';

/**
 * O endereço do WebSocket para este browser, lendo o ambiente e a página.
 *
 * A decisão em si vive em `resolverEnderecoDoSocket`, que é pura e tem testes. Aqui só
 * se recolhem os valores — é a fronteira entre a regra e o mundo.
 *
 * Existe para que o socket dos eventos e o da voz da Mayra leiam exactamente a mesma
 * configuração. Antes tinham cópias próprias da lógica, e a da voz não conhecia
 * `VITE_SOCKET_URL`: em produção o socket ia parar à origem do Vercel, que não
 * encaminha WebSockets, e o ecrã da voz ficava em «A ligar…» para sempre.
 */
export function enderecoDoSocket(): EnderecoDoSocket {
  // Sem `window` (testes, renderização fora do browser) não há de onde deduzir.
  if (typeof window === 'undefined') {
    return { endereco: '', avisoDeConfiguracao: null };
  }

  return resolverEnderecoDoSocket({
    apiUrl: import.meta.env.VITE_API_URL as string | undefined,
    socketUrl: import.meta.env.VITE_SOCKET_URL as string | undefined,
    origem: window.location.origin,
    protocolo: window.location.protocol,
    anfitriao: window.location.hostname,
    porta: (import.meta.env.VITE_API_PORT as string | undefined) ?? '3100',
    producao: import.meta.env.PROD,
  });
}
