import { formatMoeda } from '@/shared/utils/formatMoeda';
import { formatarDistancia } from '@/shared/utils/imagem';
import type { Notificacao } from './tipos';

/** O que o texto precisa da internacionalização: só a função `t`. Assim este ficheiro testa-se sem browser. */
type Traduzir = (chave: string, opcoes?: Record<string, unknown>) => string;

/**
 * A chave da frase de uma notificação no catálogo (`notificacoes:<DESTINATARIO>.<tipo>`).
 *
 * Quase sempre é o `tipo` guardado; a excepção é «pronto», que o servidor guarda como um só tipo e o ecrã
 * diz de duas maneiras: pronto para **sair** (entrega) ou para **levantar**.
 */
export function chaveDaNotificacao(n: Pick<Notificacao, 'destinatarioTipo' | 'tipo' | 'parametros'>): string {
  const tipo =
    n.tipo === 'pedido.pronto' ? (n.parametros.paraEntrega ? 'pedido.pronto_entrega' : 'pedido.pronto_levantar') : n.tipo;
  return `${n.destinatarioTipo}.${tipo}`;
}

/**
 * A frase, na língua de quem lê. O servidor guarda o tipo e os parâmetros — não a frase — porque quem a
 * dispara (um funcionário) não sabe a língua de quem a recebe (um cliente).
 *
 * Uma chave que o catálogo não conhece (um tipo novo no servidor, ecrã por actualizar) **não** mostra a chave
 * crua: cai numa frase genérica. É melhor «Há novidades no pedido PED-1» do que «CLIENTE.entrega.xpto».
 */
export function textoDaNotificacao(n: Notificacao, t: Traduzir): string {
  const p = n.parametros;
  const chave = chaveDaNotificacao(n);
  const frase = t(chave, {
    ns: 'notificacoes',
    numeroPedido: p.numeroPedido ?? '',
    estafeta: p.estafeta ?? t('ui.um_estafeta', { ns: 'notificacoes' }),
    morada: p.morada ?? '',
    valor: p.valorACobrar !== undefined ? formatMoeda(p.valorACobrar) : '',
    loja: p.loja ?? '',
    distancia: p.distanciaMetros !== undefined ? formatarDistancia(p.distanciaMetros) : '',
    minutos: p.minutos ?? '',
    defaultValue: '',
  });

  const base = frase !== '' && frase !== chave ? frase : t('ui.generica', { ns: 'notificacoes', numeroPedido: p.numeroPedido ?? '', defaultValue: p.numeroPedido ?? '' });

  // Os ajustes e o motivo acrescentam-se à frase em vez de multiplicar as chaves.
  const ajustes = p.comAjustes && n.tipo === 'pedido.pronto' ? t('ui.com_ajustes', { ns: 'notificacoes' }) : '';
  const motivo = p.motivo ? t('ui.motivo', { ns: 'notificacoes', motivo: p.motivo }) : '';
  return `${base}${ajustes}${motivo}`;
}

/** A ligação para onde uma notificação leva ao ser aberta, por tipo de utilizador. `null` = não leva a lado nenhum. */
export function destinoDaNotificacao(n: Notificacao): string | null {
  switch (n.destinatarioTipo) {
    case 'CLIENTE':
      return n.lojaId && n.pedidoId ? `/loja/${n.lojaId}/pedidos/${n.pedidoId}` : null;
    case 'ESTAFETA':
      // Uma oferta ainda não é do estafeta: a entrega só se abre depois de aceitar (404 antes), por isso leva ao início.
      return n.entregaId && n.tipo !== 'oferta.nova' ? `/estafeta/entregas/${n.entregaId}` : '/estafeta';
    case 'FUNCIONARIO':
      return n.tipo === 'pedido.novo' ? '/commerce/pedidos' : '/entregas';
  }
}

/** Os avisos que merecem destaque (um aviso passageiro em vez de só o contador): o que muda o que a pessoa faz. */
export function eUrgente(n: Pick<Notificacao, 'destinatarioTipo' | 'tipo'>): boolean {
  return (
    (n.destinatarioTipo === 'CLIENTE' && n.tipo === 'entrega.chegou') ||
    (n.destinatarioTipo === 'ESTAFETA' && (n.tipo === 'entrega.nova' || n.tipo === 'entrega.retirada' || n.tipo === 'oferta.nova')) ||
    (n.destinatarioTipo === 'FUNCIONARIO' && (n.tipo === 'entrega.falhada' || n.tipo === 'pedido.novo' || n.tipo === 'entrega.sem_estafeta'))
  );
}
