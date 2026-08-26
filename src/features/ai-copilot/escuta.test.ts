import { describe, it, expect } from 'vitest';
import {
  podeVoltarAOuvir,
  calcularRms,
  contarBlocoDeFala,
  deveInterromper,
  BLOCOS_PARA_INTERROMPER,
  type EstadoDaEscuta,
} from './escuta';

const seguro: EstadoDaEscuta = {
  sessaoActiva: true,
  emFallback: true,
  mayraAFalar: false,
  socketLigado: true,
};

describe('podeVoltarAOuvir', () => {
  it('reabre o microfone quando tudo está em ordem', () => {
    expect(podeVoltarAOuvir(seguro)).toBe(true);
  });

  it('NÃO reabre enquanto a Mayra fala', () => {
    // A condição que quebra o ciclo. Sem ela, o microfone apanhava a voz dela pelo
    // altifalante, transcrevia-a, e ela respondia às suas próprias frases.
    expect(podeVoltarAOuvir({ ...seguro, mayraAFalar: true })).toBe(false);
  });

  it('NÃO reabre depois de a aba da voz ser fechada', () => {
    // Um `onended` atrasado chega depois de a sessão fechar. Sem esta condição,
    // reabria o microfone de uma sessão que já não existe.
    expect(podeVoltarAOuvir({ ...seguro, sessaoActiva: false })).toBe(false);
  });

  it('NÃO reabre fora do modo de recurso', () => {
    // Na voz nativa é o Gemini que trata do áudio; este microfone não tem lugar nenhum.
    expect(podeVoltarAOuvir({ ...seguro, emFallback: false })).toBe(false);
  });

  it('NÃO reabre com o socket em baixo', () => {
    // Ouvir sem ter para onde enviar só gastaria bateria e daria a ilusão de que a
    // Mayra está à escuta.
    expect(podeVoltarAOuvir({ ...seguro, socketLigado: false })).toBe(false);
  });

  it('exige todas as condições ao mesmo tempo', () => {
    expect(
      podeVoltarAOuvir({
        sessaoActiva: false,
        emFallback: false,
        mayraAFalar: true,
        socketLigado: false,
      }),
    ).toBe(false);
  });
});

describe('interromper a Mayra a meio', () => {
  it('mede o RMS de um bloco', () => {
    expect(calcularRms([0, 0, 0, 0])).toBe(0);
    expect(calcularRms([0.5, -0.5, 0.5, -0.5])).toBeCloseTo(0.5);
  });

  it('conta blocos seguidos e reinicia ao primeiro silêncio', () => {
    // O que interessa é som contínuo. Sem o reinício, os picos dispersos de uma frase
    // inteira dela acabariam por somar e interromperiam-na sozinhos.
    let n = 0;
    n = contarBlocoDeFala(0.2, n);
    expect(n).toBe(1);
    n = contarBlocoDeFala(0.2, n);
    expect(n).toBe(2);
    n = contarBlocoDeFala(0.01, n);
    expect(n).toBe(0);
  });

  it('interrompe só depois de som contínuo suficiente', () => {
    // Um bloco só seria uma porta a bater, ou um resto de eco que o cancelamento não
    // apanhou — e a Mayra ficaria impossível de ouvir numa sala com ruído.
    expect(deveInterromper(true, 1)).toBe(false);
    expect(deveInterromper(true, BLOCOS_PARA_INTERROMPER)).toBe(true);
  });

  it('não interrompe quem não está a falar', () => {
    // Fora do turno dela o microfone já está a ser ouvido; interromper não significaria
    // nada, e limparia o estado sem razão.
    expect(deveInterromper(false, 99)).toBe(false);
  });
});
