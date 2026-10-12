import { describe, expect, it } from 'vitest';
import { dimensoesFinais, formatarDistancia, LADO_MAXIMO_PX } from './imagem';

describe('dimensoesFinais', () => {
  it('reduz o que passa do limite no lado maior, mantendo a proporção', () => {
    expect(dimensoesFinais(4000, 3000)).toEqual({ largura: 1600, altura: 1200 });
    expect(dimensoesFinais(3000, 4000)).toEqual({ largura: 1200, altura: 1600 });
  });

  it('o lado maior fica exactamente no limite', () => {
    const r = dimensoesFinais(5000, 2000);
    expect(Math.max(r.largura, r.altura)).toBe(LADO_MAXIMO_PX);
  });

  it('🔴 nunca amplia uma imagem pequena', () => {
    expect(dimensoesFinais(800, 600)).toEqual({ largura: 800, altura: 600 });
    expect(dimensoesFinais(1600, 1000)).toEqual({ largura: 1600, altura: 1000 });
  });

  it('aceita um limite diferente', () => {
    expect(dimensoesFinais(2000, 1000, 1000)).toEqual({ largura: 1000, altura: 500 });
  });

  it('nunca devolve uma dimensão a zero, mesmo numa imagem estreitíssima', () => {
    const r = dimensoesFinais(20000, 3);
    expect(r.largura).toBe(1600);
    expect(r.altura).toBeGreaterThanOrEqual(1);
  });

  it('dimensões inválidas (zero, NaN) passam como vieram: não rebenta', () => {
    expect(dimensoesFinais(0, 0)).toEqual({ largura: 0, altura: 0 });
    expect(dimensoesFinais(Number.NaN, 100)).toEqual({ largura: Number.NaN, altura: 100 });
  });
});

describe('formatarDistancia', () => {
  it.each([
    [0, '0 m'],
    [850, '850 m'],
    [999, '999 m'],
    [1000, '1,0 km'],
    [1234, '1,2 km'],
    [25000, '25,0 km'],
  ])('%d m → %s', (metros, esperado) => {
    expect(formatarDistancia(metros)).toBe(esperado);
  });

  it('um valor impossível mostra um travessão em vez de «NaN km»', () => {
    expect(formatarDistancia(Number.NaN)).toBe('—');
    expect(formatarDistancia(-5)).toBe('—');
  });
});
