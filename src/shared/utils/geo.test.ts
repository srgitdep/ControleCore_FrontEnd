import { describe, expect, it } from 'vitest';
import { limitesDoCirculo } from './geo';

describe('limitesDoCirculo', () => {
  it('é simétrico à volta do ponto', () => {
    const [[sul, oeste], [norte, este]] = limitesDoCirculo(-25.96, 32.57, 100);

    expect((sul + norte) / 2).toBeCloseTo(-25.96, 9);
    expect((oeste + este) / 2).toBeCloseTo(32.57, 9);
  });

  it('100 m dão cerca de 0,0009° de latitude', () => {
    const [[sul], [norte]] = limitesDoCirculo(0, 0, 100);

    expect(norte - sul).toBeCloseTo(2 * 0.000898, 5);
  });

  it('a longitude abre mais longe do equador: os meridianos aproximam-se', () => {
    const noEquador = limitesDoCirculo(0, 0, 500);
    const emMaputo = limitesDoCirculo(-25.96, 0, 500);

    const largura = ([[, o], [, e]]: [[number, number], [number, number]]) => e - o;
    expect(largura(emMaputo)).toBeGreaterThan(largura(noEquador));
  });

  it('o sul fica abaixo do norte e o oeste à esquerda do este', () => {
    const [[sul, oeste], [norte, este]] = limitesDoCirculo(-10.85, 40.51, 250);

    expect(sul).toBeLessThan(norte);
    expect(oeste).toBeLessThan(este);
  });

  it('não rebenta nos pólos (cosseno ~ 0)', () => {
    const [[, oeste], [, este]] = limitesDoCirculo(90, 0, 100);

    expect(Number.isFinite(oeste)).toBe(true);
    expect(Number.isFinite(este)).toBe(true);
  });

  it('um raio zero dá um ponto', () => {
    expect(limitesDoCirculo(1, 2, 0)).toEqual([[1, 2], [1, 2]]);
  });
});
