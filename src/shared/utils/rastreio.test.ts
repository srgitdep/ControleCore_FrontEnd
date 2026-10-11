import { describe, expect, it } from 'vitest';
import {
  acrescentarAoRasto,
  devePartilhar,
  distanciaMetros,
  INTERVALO_MINIMO_ENVIO_MS,
  MAXIMO_DO_RASTO,
  POSICAO_RECENTE_MS,
  posicaoRecente,
  SINAL_DE_VIDA_MS,
  textoDeDistancia,
} from './rastreio';

const BASE = { latitude: -25.9692, longitude: 32.5732 };
/** ~0,0005° de latitude ≈ 55 m. */
const A_55_METROS = { latitude: BASE.latitude + 0.0005, longitude: BASE.longitude };
/** ~0,0001° ≈ 11 m: ruído do GPS. */
const A_11_METROS = { latitude: BASE.latitude + 0.0001, longitude: BASE.longitude };
const T0 = 1_000_000;

describe('distanciaMetros', () => {
  it('é zero entre o mesmo ponto e simétrica', () => {
    expect(distanciaMetros(BASE, BASE)).toBe(0);
    expect(distanciaMetros(BASE, A_55_METROS)).toBeCloseTo(distanciaMetros(A_55_METROS, BASE), 6);
  });

  it('mede ~111 km por grau de latitude', () => {
    const d = distanciaMetros({ latitude: -25, longitude: 32 }, { latitude: -26, longitude: 32 });
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_500);
  });
});

describe('devePartilhar — a poupança de bateria e de dados', () => {
  it('a primeira leitura envia-se sempre', () => {
    expect(devePartilhar(null, { ...BASE, em: T0 })).toBe(true);
  });

  it('🔴 menos de 15 s depois não envia, mesmo que se tenha mexido muito', () => {
    const ultimo = { ...BASE, em: T0 };
    expect(devePartilhar(ultimo, { ...A_55_METROS, em: T0 + INTERVALO_MINIMO_ENVIO_MS - 1 })).toBe(false);
  });

  it('passados 15 s com 55 m de deslocação, envia', () => {
    expect(devePartilhar({ ...BASE, em: T0 }, { ...A_55_METROS, em: T0 + INTERVALO_MINIMO_ENVIO_MS })).toBe(true);
  });

  it('o tremor do GPS (11 m) não conta como movimento', () => {
    expect(devePartilhar({ ...BASE, em: T0 }, { ...A_11_METROS, em: T0 + INTERVALO_MINIMO_ENVIO_MS + 1000 })).toBe(false);
  });

  it('parado, dá sinal de vida ao fim de um minuto', () => {
    expect(devePartilhar({ ...BASE, em: T0 }, { ...BASE, em: T0 + SINAL_DE_VIDA_MS })).toBe(true);
    expect(devePartilhar({ ...BASE, em: T0 }, { ...BASE, em: T0 + SINAL_DE_VIDA_MS - 1 })).toBe(false);
  });
});

describe('posicaoRecente', () => {
  const agora = Date.parse('2026-10-11T10:00:00Z');

  it('recente até 2 minutos, velha depois', () => {
    expect(posicaoRecente(new Date(agora - POSICAO_RECENTE_MS), agora)).toBe(true);
    expect(posicaoRecente(new Date(agora - POSICAO_RECENTE_MS - 1), agora)).toBe(false);
  });

  it('aceita texto ISO', () => {
    expect(posicaoRecente('2026-10-11T09:59:30Z', agora)).toBe(true);
  });

  it('🔴 ausente ou inválida nunca é recente', () => {
    expect(posicaoRecente(null, agora)).toBe(false);
    expect(posicaoRecente(undefined, agora)).toBe(false);
    expect(posicaoRecente('lixo', agora)).toBe(false);
  });
});

describe('acrescentarAoRasto', () => {
  it('acrescenta sem mutar o rasto anterior', () => {
    const rasto = [BASE];
    const novo = acrescentarAoRasto(rasto, A_55_METROS);
    expect(novo).toHaveLength(2);
    expect(rasto).toHaveLength(1);
  });

  it('ignora um ponto repetido (o mesmo evento chega duas vezes ao reconectar)', () => {
    expect(acrescentarAoRasto([BASE], { ...BASE })).toHaveLength(1);
  });

  it('🔴 não cresce sem fim: corta os pontos mais antigos', () => {
    let rasto: { latitude: number; longitude: number }[] = [];
    for (let i = 0; i < MAXIMO_DO_RASTO + 50; i++) {
      rasto = acrescentarAoRasto(rasto, { latitude: -25 - i * 0.001, longitude: 32 });
    }
    expect(rasto).toHaveLength(MAXIMO_DO_RASTO);
    expect(rasto[rasto.length - 1].latitude).toBeCloseTo(-25 - (MAXIMO_DO_RASTO + 49) * 0.001, 6);
  });
});

describe('textoDeDistancia', () => {
  it('metros abaixo de 1 km, arredondados às dezenas', () => {
    expect(textoDeDistancia(347)).toBe('350 m');
    expect(textoDeDistancia(2)).toBe('10 m');
  });

  it('quilómetros com uma casa decimal e a vírgula de quem lê', () => {
    expect(textoDeDistancia(2430)).toBe('2,4 km');
    expect(textoDeDistancia(2430, '.')).toBe('2.4 km');
  });

  it('valores impossíveis dão texto vazio', () => {
    expect(textoDeDistancia(NaN)).toBe('');
    expect(textoDeDistancia(-5)).toBe('');
  });
});
