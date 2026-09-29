import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PCMPlayer } from './pcm-player';

/** Fonte de áudio falsa: `terminar()` simula o fim natural da reprodução. */
class FonteFalsa {
  buffer: unknown = null;
  onended: (() => void) | null = null;
  connect() {}
  disconnect() {}
  start() {}
  stop() {
    // Como no browser: parar dispara `onended`, de forma assíncrona.
    queueMicrotask(() => this.onended?.());
  }
  terminar() {
    this.onended?.();
  }
}

let fontes: FonteFalsa[];
let estadoInicial: AudioContextState;
let estadoDepoisDoResume: AudioContextState;

class ContextoFalso {
  state: AudioContextState = estadoInicial;
  currentTime = 0;
  destination = {};
  createBuffer(_c: number, length: number, rate: number) {
    return { duration: length / rate, getChannelData: () => ({ set() {} }) };
  }
  createBufferSource() {
    const f = new FonteFalsa();
    fontes.push(f);
    return f;
  }
  resume() {
    this.state = estadoDepoisDoResume;
    return Promise.resolve();
  }
  close() {
    this.state = 'closed';
  }
}

/** Um bloco PCM de 4 amostras (8 bytes) em Base64. */
const BLOCO = btoa(String.fromCharCode(0, 0, 1, 0, 2, 0, 3, 0));

describe('PCMPlayer', () => {
  beforeEach(() => {
    fontes = [];
    estadoInicial = 'running';
    estadoDepoisDoResume = 'running';
    vi.stubGlobal('window', { AudioContext: ContextoFalso });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('avisa quando o último bloco em fila acaba de tocar — e não antes', () => {
    const player = new PCMPlayer();
    const aoFicarEmSilencio = vi.fn();
    player.aoFicarEmSilencio = aoFicarEmSilencio;

    player.feed(BLOCO);
    player.feed(BLOCO);
    expect(player.aTocar).toBe(true);

    fontes[0].terminar();
    expect(aoFicarEmSilencio).not.toHaveBeenCalled();

    fontes[1].terminar();
    expect(aoFicarEmSilencio).toHaveBeenCalledTimes(1);
    expect(player.aTocar).toBe(false);
  });

  it('parar à força (barge-in) não conta como ficar em silêncio', async () => {
    const player = new PCMPlayer();
    const aoFicarEmSilencio = vi.fn();
    player.aoFicarEmSilencio = aoFicarEmSilencio;

    player.feed(BLOCO);
    player.stop();
    await Promise.resolve();

    expect(aoFicarEmSilencio).not.toHaveBeenCalled();
    expect(player.aTocar).toBe(false);
  });

  it('avisa na consola, uma vez, quando o browser não deixa tocar o áudio', async () => {
    estadoInicial = 'suspended';
    estadoDepoisDoResume = 'suspended';
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const player = new PCMPlayer();

    player.feed(BLOCO);
    player.feed(BLOCO);
    await new Promise((r) => setTimeout(r, 0));

    expect(aviso).toHaveBeenCalledTimes(1);
    expect(aviso.mock.calls[0][0]).toContain('som deste site');
    aviso.mockRestore();
  });

  it('não avisa quando o resume() liga o contexto', async () => {
    estadoInicial = 'suspended';
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});

    new PCMPlayer().feed(BLOCO);
    await new Promise((r) => setTimeout(r, 0));

    expect(aviso).not.toHaveBeenCalled();
    aviso.mockRestore();
  });
});
