import { describe, it, expect } from 'vitest';
import { podeVoltarAOuvir, type EstadoDaEscuta } from './escuta';

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
