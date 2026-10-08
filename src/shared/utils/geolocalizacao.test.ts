import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { avaliarPrecisao, obterMelhorPosicao } from './geolocalizacao';

/** Um GPS de brincar: o teste decide quando chega cada posição ou erro. */
function gpsFalso() {
  let aoSucesso: PositionCallback = () => {};
  let aoErro: PositionErrorCallback = () => {};
  const clearWatch = vi.fn();
  const fonte = {
    watchPosition: vi.fn((s: PositionCallback, e?: PositionErrorCallback | null) => {
      aoSucesso = s;
      aoErro = e ?? (() => {});
      return 7;
    }),
    clearWatch,
  };
  const posicao = (precisao: number, lat = -25.96, lng = 32.57) =>
    aoSucesso({ coords: { latitude: lat, longitude: lng, accuracy: precisao } } as GeolocationPosition);
  const erro = () => aoErro({ code: 1, message: 'negado' } as GeolocationPositionError);
  return { fonte, posicao, erro, clearWatch };
}

describe('obterMelhorPosicao', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('pára logo que a precisão chega ao alvo', async () => {
    const gps = gpsFalso();
    const resultado = obterMelhorPosicao(gps.fonte, { alvoMetros: 25 });

    gps.posicao(900);
    gps.posicao(40);
    gps.posicao(12);

    await expect(resultado).resolves.toMatchObject({ precisaoMetros: 12 });
    expect(gps.clearWatch).toHaveBeenCalledWith(7);
  });

  it('fica com a de menor erro quando o alvo nunca é atingido', async () => {
    const gps = gpsFalso();
    const resultado = obterMelhorPosicao(gps.fonte, { alvoMetros: 5, tempoMaximoMs: 10_000 });

    gps.posicao(800, -25.9, 32.5);
    gps.posicao(60, -25.96, 32.57);
    gps.posicao(300, -25.0, 32.0); // pior que a anterior: não a substitui
    vi.advanceTimersByTime(10_000);

    await expect(resultado).resolves.toEqual({ latitude: -25.96, longitude: 32.57, precisaoMetros: 60 });
  });

  it('avisa a cada melhoria, para o ecrã mostrar o progresso', async () => {
    const gps = gpsFalso();
    const aoMelhorar = vi.fn();
    const resultado = obterMelhorPosicao(gps.fonte, { aoMelhorar, tempoMaximoMs: 1000 });

    gps.posicao(500);
    gps.posicao(700); // pior: não avisa
    gps.posicao(100);
    vi.advanceTimersByTime(1000);
    await resultado;

    expect(aoMelhorar.mock.calls.map(([p]) => p.precisaoMetros)).toEqual([500, 100]);
  });

  it('rejeita se a permissão for negada antes de qualquer posição', async () => {
    const gps = gpsFalso();
    const resultado = obterMelhorPosicao(gps.fonte);

    gps.erro();

    await expect(resultado).rejects.toMatchObject({ code: 1 });
  });

  it('um erro depois de já haver posição não a deita fora', async () => {
    const gps = gpsFalso();
    const resultado = obterMelhorPosicao(gps.fonte, { alvoMetros: 1 });

    gps.posicao(80);
    gps.erro();

    await expect(resultado).resolves.toMatchObject({ precisaoMetros: 80 });
  });

  it('rejeita por tempo esgotado se nunca chegou nenhuma posição', async () => {
    const gps = gpsFalso();
    const resultado = obterMelhorPosicao(gps.fonte, { tempoMaximoMs: 5000 });
    const verificado = expect(resultado).rejects.toThrow('Tempo esgotado');

    vi.advanceTimersByTime(5000);

    await verificado;
    expect(gps.clearWatch).toHaveBeenCalled();
  });
});

describe('avaliarPrecisao', () => {
  it('até 100 m é boa', () => {
    expect(avaliarPrecisao(5)).toBe('boa');
    expect(avaliarPrecisao(100)).toBe('boa');
  });

  it('entre 100 m e 1 km é fraca: usa-se, mas avisa-se', () => {
    expect(avaliarPrecisao(101)).toBe('fraca');
    expect(avaliarPrecisao(1000)).toBe('fraca');
  });

  it('🔴 acima de 1 km é inutilizável: o computador sem GPS que põe o pino noutra província', () => {
    expect(avaliarPrecisao(1001)).toBe('inutilizavel');
    expect(avaliarPrecisao(25_000)).toBe('inutilizavel');
  });
});
