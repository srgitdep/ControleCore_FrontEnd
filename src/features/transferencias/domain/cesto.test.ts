import { describe, expect, it } from 'vitest';
import {
  cestoPronto,
  errosDeLinhaDaResposta,
  errosPorProduto,
  itemDe,
  linhasParaEnviar,
  podeEscolher,
  quantidadeInicial,
  quantidadeValida,
  totaisDoCesto,
  type Cesto,
} from './cesto';
import type { ProdutoDisponivel } from '../types/transferencia.types';

const produto = (extra: Partial<ProdutoDisponivel> = {}): ProdutoDisponivel => ({
  produtoId: 'p1',
  nome: 'Arroz',
  sku: null,
  codigoBarras: null,
  unidade: 'UN',
  imagemUrl: null,
  fisico: 20,
  reservado: 5,
  disponivel: 15,
  minimo: 6,
  cedivel: 9,
  noDestino: 0,
  emTransitoNoDestino: 0,
  ...extra,
});

describe('o que se pode escolher', () => {
  it('só com disponível (o reservado já está prometido)', () => {
    expect(podeEscolher(produto({ disponivel: 15 }))).toBe(true);
    expect(podeEscolher(produto({ disponivel: 0 }))).toBe(false);
  });

  it('🔴 entra com o que a origem pode ceder sem risco (cedível), não com tudo', () => {
    expect(quantidadeInicial(produto({ disponivel: 15, cedivel: 9 }))).toBe(9);
  });

  it('abaixo do mínimo (cedível zero) entra com o disponível — quem pede decide; a aprovação pode recusar', () => {
    expect(quantidadeInicial(produto({ disponivel: 4, cedivel: 0 }))).toBe(4);
  });

  it('o cedível nunca passa do disponível', () => {
    expect(quantidadeInicial(produto({ disponivel: 3, cedivel: 8 }))).toBe(3);
  });
});

describe('quantidadeValida', () => {
  it.each([
    [5, 15, true],
    [15, 15, true],
    [16, 15, false],
    [0, 15, false],
    [-1, 15, false],
    [Number.NaN, 15, false],
  ])('%s de %s disponíveis → %s', (q, d, esperado) => {
    expect(quantidadeValida(q, d)).toBe(esperado);
  });
});

describe('o cesto', () => {
  const cesto: Cesto = {
    a: { ...itemDe(produto({ produtoId: 'a', nome: 'A' })), quantidade: 5 },
    b: { ...itemDe(produto({ produtoId: 'b', nome: 'B', disponivel: 4, cedivel: 4 })), quantidade: 4 },
  };

  it('conta linhas e unidades', () => {
    expect(totaisDoCesto(cesto)).toEqual({ linhas: 2, unidades: 9, invalidas: 0 });
    expect(cestoPronto(cesto)).toBe(true);
  });

  it('🔴 uma quantidade acima do disponível torna o pedido inválido e conta-se', () => {
    const mau: Cesto = { ...cesto, b: { ...cesto.b, quantidade: 9 } };

    expect(totaisDoCesto(mau).invalidas).toBe(1);
    expect(cestoPronto(mau)).toBe(false);
  });

  it('cesto vazio não está pronto', () => {
    expect(cestoPronto({})).toBe(false);
  });

  it('as unidades somam sem erros de vírgula flutuante', () => {
    const c: Cesto = {
      a: { ...cesto.a, quantidade: 0.1, disponivel: 5 },
      b: { ...cesto.b, quantidade: 0.2, disponivel: 5 },
    };

    expect(totaisDoCesto(c).unidades).toBe(0.3);
  });

  it('envia só o produto e a quantidade', () => {
    expect(linhasParaEnviar(cesto)).toEqual([
      { produtoId: 'a', quantidade: 5 },
      { produtoId: 'b', quantidade: 4 },
    ]);
  });
});

describe('os erros que o servidor devolve', () => {
  const erros = [
    { produtoId: 'a', nome: 'A', motivo: 'ACIMA_DO_DISPONIVEL' as const, disponivel: 2 },
    { produtoId: 'x', nome: null, motivo: 'SEM_STOCK_NA_ORIGEM' as const, disponivel: null },
  ];

  it('indexam-se por produto para marcar as linhas', () => {
    expect(errosPorProduto(erros).a.motivo).toBe('ACIMA_DO_DISPONIVEL');
    expect(errosPorProduto(undefined)).toEqual({});
  });

  it('lêem-se do topo do corpo do 400', () => {
    expect(errosDeLinhaDaResposta({ response: { data: { erros } } })).toEqual(erros);
  });

  it('um erro sem a lista (rede, 500) dá lista vazia', () => {
    expect(errosDeLinhaDaResposta(new Error('rede'))).toEqual([]);
    expect(errosDeLinhaDaResposta({ response: { data: { message: 'x' } } })).toEqual([]);
  });
});
