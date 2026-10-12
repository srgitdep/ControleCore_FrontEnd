import { describe, expect, it } from 'vitest';
import pt from '@/locales/pt/notificacoes.json';
import en from '@/locales/en/notificacoes.json';
import { chaveDaNotificacao, destinoDaNotificacao, eUrgente, textoDaNotificacao } from './texto';
import type { Notificacao } from './tipos';

/** Um `t` mínimo sobre os catálogos reais: resolve a chave aninhada e interpola `{{x}}`, como o i18next. */
function criarT(catalogo: Record<string, unknown>) {
  return (chave: string, opcoes: Record<string, unknown> = {}) => {
    const valor = chave.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], catalogo);
    if (typeof valor !== 'string') return (opcoes.defaultValue as string) ?? chave;
    return valor.replace(/\{\{(\w+)\}\}/g, (_m, nome) => String(opcoes[nome] ?? ''));
  };
}

const N = (extra: Partial<Notificacao>): Notificacao => ({
  id: 'n-1',
  destinatarioTipo: 'CLIENTE',
  tipo: 'entrega.chegou',
  parametros: { numeroPedido: 'PED-42', estafeta: 'João' },
  pedidoId: 'ped-1',
  entregaId: 'ent-1',
  lojaId: 'loja-1',
  lidaEm: null,
  createdAt: '2026-10-11T10:00:00Z',
  ...extra,
});

describe('textoDaNotificacao — a frase na língua de quem lê', () => {
  it('o cliente vê «o estafeta chegou» com o nome e o pedido', () => {
    expect(textoDaNotificacao(N({}), criarT(pt))).toBe('João chegou! O pedido PED-42 está à sua porta.');
  });

  it('a mesma notificação, em inglês (o servidor guarda o tipo, não a frase)', () => {
    expect(textoDaNotificacao(N({}), criarT(en))).toBe('João has arrived! Order PED-42 is at your door.');
  });

  it('o estafeta sem nome conhecido cai em «O estafeta», não numa frase vazia', () => {
    expect(textoDaNotificacao(N({ parametros: { numeroPedido: 'PED-42' } }), criarT(pt))).toContain('O estafeta');
  });

  it('🔴 «pronto» diz-se de duas maneiras: para sair (entrega) ou para levantar', () => {
    const entrega = N({ tipo: 'pedido.pronto', parametros: { numeroPedido: 'PED-1', paraEntrega: true } });
    const levantar = N({ tipo: 'pedido.pronto', parametros: { numeroPedido: 'PED-1', paraEntrega: false } });

    expect(textoDaNotificacao(entrega, criarT(pt))).toContain('embalado e pronto para sair');
    expect(textoDaNotificacao(levantar, criarT(pt))).toContain('pronto para levantar');
    expect(chaveDaNotificacao(entrega)).toBe('CLIENTE.pedido.pronto_entrega');
  });

  it('os ajustes e o motivo acrescentam-se à frase', () => {
    const ajustado = N({ tipo: 'pedido.pronto', parametros: { numeroPedido: 'PED-1', paraEntrega: false, comAjustes: true } });
    const cancelado = N({ tipo: 'pedido.cancelado', parametros: { numeroPedido: 'PED-1', motivo: 'Sem stock' } });

    expect(textoDaNotificacao(ajustado, criarT(pt))).toContain('Houve ajustes');
    expect(textoDaNotificacao(cancelado, criarT(pt))).toBe('O pedido PED-1 foi cancelado. Motivo: Sem stock.');
  });

  it('o estafeta vê a morada da entrega nova', () => {
    const n = N({ destinatarioTipo: 'ESTAFETA', tipo: 'entrega.nova', parametros: { numeroPedido: 'PED-7', morada: 'Rua X, Maputo' } });

    expect(textoDaNotificacao(n, criarT(pt))).toBe('Nova entrega: PED-7 — Rua X, Maputo.');
  });

  it('🔴 um tipo que o catálogo não conhece NUNCA mostra a chave crua: cai numa frase genérica', () => {
    const texto = textoDaNotificacao(N({ tipo: 'entrega.xpto' }), criarT(pt));

    expect(texto).toBe('Há novidades no pedido PED-42.');
    expect(texto).not.toContain('CLIENTE.');
  });

  it('cada tipo que o servidor pode emitir tem frase em português E em inglês (paridade com o backend)', () => {
    const tipos: Array<[Notificacao['destinatarioTipo'], string]> = [
      ...['pedido.recebido', 'pedido.confirmado', 'pedido.em_preparacao', 'pedido.expedido', 'pedido.cancelado', 'pedido.entregue', 'entrega.estafeta_atribuido', 'entrega.recolhida', 'entrega.em_rota', 'entrega.chegou', 'entrega.falhada'].map((t) => ['CLIENTE', t] as [Notificacao['destinatarioTipo'], string]),
      ...['pedido.novo', 'entrega.atribuida', 'entrega.recolhida', 'entrega.em_rota', 'entrega.chegou', 'entrega.entregue', 'entrega.falhada', 'entrega.devolvida'].map((t) => ['FUNCIONARIO', t] as [Notificacao['destinatarioTipo'], string]),
      ...['entrega.nova', 'entrega.retirada'].map((t) => ['ESTAFETA', t] as [Notificacao['destinatarioTipo'], string]),
    ];
    for (const [dest, tipo] of tipos) {
      for (const catalogo of [pt, en]) {
        const t = criarT(catalogo);
        const n = N({ destinatarioTipo: dest, tipo });
        expect(textoDaNotificacao(n, t), `${dest}.${tipo}`).not.toContain('novidades');
        expect(textoDaNotificacao(n, t), `${dest}.${tipo}`).not.toContain('There is news');
      }
    }
    // «pronto» tem as suas duas variantes.
    expect(chaveDaNotificacao(N({ tipo: 'pedido.pronto', parametros: { paraEntrega: true } }))).toBe('CLIENTE.pedido.pronto_entrega');
  });
});

describe('destinoDaNotificacao — para onde leva', () => {
  it('o cliente vai ao pedido, na loja certa; sem loja ou pedido, a lado nenhum', () => {
    expect(destinoDaNotificacao(N({}))).toBe('/loja/loja-1/pedidos/ped-1');
    expect(destinoDaNotificacao(N({ lojaId: null }))).toBeNull();
  });

  it('o estafeta vai à entrega; a gestão, ao pedido novo ou ao painel de entregas', () => {
    expect(destinoDaNotificacao(N({ destinatarioTipo: 'ESTAFETA' }))).toBe('/estafeta/entregas/ent-1');
    expect(destinoDaNotificacao(N({ destinatarioTipo: 'ESTAFETA', entregaId: null }))).toBe('/estafeta');
    expect(destinoDaNotificacao(N({ destinatarioTipo: 'FUNCIONARIO', tipo: 'pedido.novo' }))).toBe('/commerce/pedidos');
    expect(destinoDaNotificacao(N({ destinatarioTipo: 'FUNCIONARIO', tipo: 'entrega.em_rota' }))).toBe('/entregas');
  });
});

describe('eUrgente — o que merece um aviso passageiro', () => {
  it.each([
    ['CLIENTE', 'entrega.chegou', true],
    ['ESTAFETA', 'entrega.nova', true],
    ['ESTAFETA', 'entrega.retirada', true],
    ['FUNCIONARIO', 'entrega.falhada', true],
    ['FUNCIONARIO', 'pedido.novo', true],
    ['CLIENTE', 'pedido.confirmado', false],
    ['FUNCIONARIO', 'entrega.em_rota', false],
  ] as const)('%s %s → %s', (destinatarioTipo, tipo, esperado) => {
    expect(eUrgente({ destinatarioTipo, tipo })).toBe(esperado);
  });
});
