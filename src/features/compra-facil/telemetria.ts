import { api } from '@/shared/config';

/**
 * A navegação anónima do Compra Fácil para o registo da procura online (plano §4.4): o que se
 * pesquisa, vê, põe no carrinho e quando se chega ao checkout.
 *
 * ## Desligada por omissão
 *
 * Só envia com `VITE_TELEMETRIA_PROCURA=true` **no build** (as variáveis `VITE_*` são substituídas
 * no build, não lidas em runtime). Fica desligada até estar validado o enquadramento legal da
 * recolha e escrito o texto de consentimento; o servidor tem o seu próprio interruptor
 * (`TELEMETRIA_PROCURA_ACTIVA`) e os dois têm de estar ligados.
 *
 * ## Anónima, e nunca no caminho do cliente
 *
 * Só leva um `sessaoId` gerado aqui (uma visita, não uma pessoa), sem cookies nem conta. Falhar —
 * rede em baixo, servidor desligado, `sessionStorage` bloqueado — nunca se mostra nem atrasa nada:
 * é analítica, e a loja funciona igual sem ela.
 */

export type EventoDeNavegacao =
  | { tipo: 'PESQUISA'; lojaId: string; termo: string }
  | { tipo: 'PRODUTO_VISTO'; lojaId: string; produtoId: string }
  | { tipo: 'CARRINHO_ADICIONADO'; lojaId: string; produtoId: string; quantidade: number }
  | { tipo: 'CARRINHO_REMOVIDO'; lojaId: string; produtoId: string }
  | { tipo: 'CHECKOUT_INICIADO'; lojaId: string };

const CHAVE_SESSAO = 'compraFacilSessaoAnonima';

/** Lido a cada chamada (e não ao importar) para se poder testar com `vi.stubEnv`. */
export const telemetriaActiva = () => import.meta.env.VITE_TELEMETRIA_PROCURA === 'true';

/** O identificador da visita: um UUID por separador, guardado em `sessionStorage` (acaba com o separador). */
export function obterSessaoAnonima(): string {
  try {
    const guardada = sessionStorage.getItem(CHAVE_SESSAO);
    if (guardada) return guardada;
    const nova = crypto.randomUUID();
    sessionStorage.setItem(CHAVE_SESSAO, nova);
    return nova;
  } catch {
    // Sem `sessionStorage` (modo privado, bloqueado): um id por chamada. Perde-se o encadeamento da
    // visita, mas nada falha.
    return crypto.randomUUID();
  }
}

/** Regista um evento. Não espera, não lança e não faz nada se estiver desligada. */
export function registarProcura(evento: EventoDeNavegacao): void {
  if (!telemetriaActiva()) return;

  try {
    void fetch(`${api.defaults.baseURL ?? ''}/commerce/telemetria`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // `keepalive`: sobrevive à navegação para outra página (ir para o checkout, por exemplo).
      keepalive: true,
      body: JSON.stringify({ sessaoId: obterSessaoAnonima(), eventos: [evento] }),
    }).catch(() => undefined);
  } catch {
    /* analítica nunca falha para o utilizador */
  }
}
