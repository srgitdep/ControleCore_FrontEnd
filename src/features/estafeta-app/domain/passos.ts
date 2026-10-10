import type { EstadoEntrega, MetodoCobranca } from '../types/estafeta';

/** O que o estafeta pode fazer a uma entrega — os mesmos passos do servidor (`TRANSICOES`). */
export type Accao = 'recolher' | 'iniciar_rota' | 'entregar' | 'falhar';

/**
 * As acções possíveis em cada estado, **espelhando** as transições do backend: o servidor é quem
 * decide (e recusa o resto com 409), isto só evita mostrar botões que dariam erro.
 *
 * `iniciar_rota` pode ser saltada (`RECOLHIDA → ENTREGUE`), por isso `entregar` também está em
 * `RECOLHIDA`: com o estafeta a marcar à mão, obrigar a um toque que não diz nada de novo só convidava
 * a deixar o estado por actualizar.
 */
const ACCOES: Partial<Record<EstadoEntrega, readonly Accao[]>> = {
  ATRIBUIDA: ['recolher', 'falhar'],
  RECOLHIDA: ['iniciar_rota', 'entregar', 'falhar'],
  EM_ROTA: ['entregar', 'falhar'],
};

export function accoesPossiveis(estado: EstadoEntrega): readonly Accao[] {
  return ACCOES[estado] ?? [];
}

/** O próximo passo normal — o botão grande, em destaque. `falhar` nunca é o principal. */
export function accaoPrincipal(estado: EstadoEntrega): Accao | null {
  return accoesPossiveis(estado).find((a) => a !== 'falhar') ?? null;
}

/** Está por fazer (o estafeta ainda tem de agir) ou já terminou? */
export function estaPorFazer(estado: EstadoEntrega): boolean {
  return accoesPossiveis(estado).length > 0;
}

/** M-Pesa e e-Mola exigem a referência da transacção; o numerário não. */
export function exigeReferencia(metodo: MetodoCobranca): boolean {
  return metodo !== 'NUMERARIO';
}

/** Uma ligação que abre o destino na aplicação de mapas do telemóvel (Android e iOS). */
export function ligacaoMapa(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
}

/** Uma ligação `tel:` que o telemóvel abre a marcar. Tira espaços, hífenes e parêntesis; mantém o `+`. */
export function ligacaoTelefone(telefone: string): string {
  return `tel:${telefone.replace(/[^\d+]/g, '')}`;
}

/** Quanto o valor cobrado difere do previsto; 0 se iguais (ou arredondamento de cêntimos). */
export function diferencaDeCobranca(previsto: number, cobrado: number): number {
  const d = Math.round((cobrado - previsto) * 100) / 100;
  return Math.abs(d) < 0.005 ? 0 : d;
}
