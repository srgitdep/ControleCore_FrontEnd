import { beforeEach, describe, expect, it } from 'vitest';
import { useCarrinhoStore } from './useCarrinhoStore';
import type { ProdutoLoja } from '../api/catalogo.api';

/** Um produto de 100 MT sem IVA, que o cliente paga a 116 MT (IVA 16%). */
const produto = (extra: Partial<ProdutoLoja> = {}): ProdutoLoja =>
  ({
    id: 'p1',
    nome: 'Arroz',
    precoVenda: 100,
    precoComIva: 116,
    precoOriginal: null,
    precoOriginalComIva: null,
    taxaIva: 16,
    unidadeMedida: 'un',
    imagemUrl: null,
    quantidadeDisponivel: 50,
    ...extra,
  }) as ProdutoLoja;

beforeEach(() => {
  useCarrinhoStore.getState().limpar();
});

describe('carrinho do Compra Fácil — o que se soma é o que o cliente paga', () => {
  it('🔴 soma o preço COM IVA (116), e não o preço sem IVA (100)', () => {
    useCarrinhoStore.getState().adicionar('loja-1', produto(), 2);

    expect(useCarrinhoStore.getState().getSubtotal()).toBeCloseTo(232);
  });

  it('guarda no item o preço com IVA', () => {
    useCarrinhoStore.getState().adicionar('loja-1', produto());

    expect(useCarrinhoStore.getState().itens[0].precoComIva).toBe(116);
  });

  it('com promoção soma o preço promocional com IVA: (100 − 10%) + 16% = 104,40', () => {
    useCarrinhoStore.getState().adicionar('loja-1', produto({ precoVenda: 90, precoComIva: 104.4 }));

    expect(useCarrinhoStore.getState().getSubtotal()).toBeCloseTo(104.4);
  });

  it('um produto sem IVA soma o seu preço', () => {
    useCarrinhoStore.getState().adicionar('loja-1', produto({ precoVenda: 80, precoComIva: 80, taxaIva: 0 }), 3);

    expect(useCarrinhoStore.getState().getSubtotal()).toBe(240);
  });

  it('o carrinho vazio soma zero', () => {
    expect(useCarrinhoStore.getState().getSubtotal()).toBe(0);
  });
});
