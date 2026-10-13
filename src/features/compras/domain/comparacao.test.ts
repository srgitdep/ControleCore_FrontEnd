import { describe, expect, it } from 'vitest';
import { PESOS_PADRAO } from '../api/comparacao.api';
import { percentagemDoPeso, pesosIguais, pesosValidos, podeComprarAoEstado, somaDosPesos } from './comparacao';

describe('pesos da comparação', () => {
  it('os pesos por omissão somam 100 e são válidos', () => {
    expect(somaDosPesos(PESOS_PADRAO)).toBe(100);
    expect(pesosValidos(PESOS_PADRAO)).toBe(true);
  });

  it('recusa negativos, fraccionários e tudo a zero (o servidor também)', () => {
    expect(pesosValidos({ ...PESOS_PADRAO, preco: -1 })).toBe(false);
    expect(pesosValidos({ ...PESOS_PADRAO, preco: 1.5 })).toBe(false);
    expect(pesosValidos({ preco: 0, pontualidade: 0, prazo: 0, cumprimento: 0, credito: 0 })).toBe(false);
  });

  it('a percentagem é do total, não do valor do cursor', () => {
    expect(percentagemDoPeso({ preco: 50, pontualidade: 50, prazo: 0, cumprimento: 0, credito: 0 }, 'preco')).toBe(50);
    expect(percentagemDoPeso({ preco: 10, pontualidade: 0, prazo: 0, cumprimento: 0, credito: 0 }, 'preco')).toBe(100);
    expect(percentagemDoPeso({ preco: 0, pontualidade: 0, prazo: 0, cumprimento: 0, credito: 0 }, 'preco')).toBe(0);
  });

  it('compara pesos', () => {
    expect(pesosIguais(PESOS_PADRAO, { ...PESOS_PADRAO })).toBe(true);
    expect(pesosIguais(PESOS_PADRAO, { ...PESOS_PADRAO, credito: 11 })).toBe(false);
  });
});

describe('podeComprarAoEstado', () => {
  it.each([
    ['ACTIVO', true],
    ['PREFERENCIAL', true],
    ['SUSPENSO', false],
    ['BLOQUEADO', false],
    ['EM_ANALISE', false],
    ['EM_CADASTRO', false],
    ['ENCERRADA', false],
  ])('%s → %s', (estado, esperado) => {
    expect(podeComprarAoEstado(estado, true)).toBe(esperado);
  });

  it('sem estado (resposta antiga), vale `isActive`', () => {
    expect(podeComprarAoEstado(undefined, true)).toBe(true);
    expect(podeComprarAoEstado(undefined, false)).toBe(false);
  });
});
