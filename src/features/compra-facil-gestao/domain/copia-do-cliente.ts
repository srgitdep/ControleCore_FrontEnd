import type { PedidoCommerceGestao } from '../types/pedido-commerce-gestao.types';

export type CampoDoCliente = 'nome' | 'telefone' | 'email' | 'nuit';

export interface DiferencaDaCopia {
  campo: CampoDoCliente;
  /** O que o cliente tinha dado no pedido. */
  registado: string;
  /** O que o cadastro diz hoje (`null` se entretanto o apagou). */
  actual: string | null;
}

const norm = (v: string | null | undefined) => (v ?? '').trim();

/**
 * Onde o cadastro de hoje já não bate certo com o que o cliente deu **neste** pedido.
 *
 * O ecrã mostra os dados **actuais** (decisão do utilizador, plano §4.13); o registo do pedido só aparece quando
 * difere, para o funcionário ver que o telefone mudou desde esta compra. Num pedido anterior à cópia
 * (`snapshotAproximado`) a cópia foi feita **a partir** do cliente de hoje: não há nada a comparar.
 * Um campo que o cliente não deu na altura (cópia vazia) não é uma diferença.
 */
export function diferencasDaCopia(p: Pick<PedidoCommerceGestao, 'cliente' | 'clienteNome' | 'clienteTelefone' | 'clienteEmail' | 'clienteNuit' | 'snapshotAproximado'>): DiferencaDaCopia[] {
  if (p.snapshotAproximado) return [];
  const pares: Array<[CampoDoCliente, string | null, string | null]> = [
    ['nome', p.clienteNome, p.cliente.nome],
    ['telefone', p.clienteTelefone, p.cliente.telefone],
    ['email', p.clienteEmail, p.cliente.email],
    ['nuit', p.clienteNuit, p.cliente.nuit],
  ];
  return pares
    .filter(([, registado, actual]) => norm(registado) !== '' && norm(registado).toLowerCase() !== norm(actual).toLowerCase())
    .map(([campo, registado, actual]) => ({ campo, registado: norm(registado), actual: norm(actual) === '' ? null : norm(actual) }));
}

/** A ligação ao mapa de uma morada com coordenadas. */
export const ligacaoAoMapa = (m: { latitude?: number; longitude?: number } | null | undefined) =>
  m && typeof m.latitude === 'number' && typeof m.longitude === 'number'
    ? `https://www.google.com/maps?q=${m.latitude},${m.longitude}`
    : null;
