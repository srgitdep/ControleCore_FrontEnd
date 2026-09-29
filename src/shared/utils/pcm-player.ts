/**
 * PCMPlayer — Reprodutor de Áudio PCM mono de 24kHz (16-bit LE) em tempo real.
 * Alimenta um AudioContext do browser com buffers contínuos agendados.
 */
export class PCMPlayer {
  private audioCtx: AudioContext | null = null;
  private sampleRate: number;
  private nextStartTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private isStopped: boolean = false;
  private avisouBloqueio = false;

  /**
   * Chamado quando o último bloco em fila acaba de tocar.
   *
   * O `turn_complete` do Gemini chega quando ele acaba de **gerar** a resposta, não
   * quando ela acaba de **tocar**: ainda há segundos de áudio em fila no browser. Quem
   * precisa de saber que a Mayra se calou mesmo (para deixar de a poder interromper, e
   * para o ecrã voltar a "a ouvir") só o sabe por aqui.
   *
   * Não é chamado por `stop()`: aí quem parou já sabe que parou.
   */
  aoFicarEmSilencio: (() => void) | null = null;

  constructor(sampleRate: number = 24000) {
    this.sampleRate = sampleRate;
  }

  /** Se ainda há áudio em fila ou a tocar. */
  get aTocar(): boolean {
    return this.activeSources.length > 0;
  }

  private initAudioContext() {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass({ sampleRate: this.sampleRate });
    }
    if (this.audioCtx.state === 'suspended') {
      // Com o som do site bloqueado no Chrome, o `resume()` não liga o contexto e o
      // áudio é descartado sem erro nenhum — a Mayra "não fala" e não fica rasto. O
      // aviso na consola é a única pista para quem estiver a diagnosticar.
      const ctx = this.audioCtx;
      ctx
        .resume()
        .catch(() => undefined)
        .then(() => {
          if (ctx.state !== 'running' && !this.avisouBloqueio) {
            this.avisouBloqueio = true;
            console.warn(
              `[Voz] O browser não deixou tocar o áudio da Mayra (AudioContext em "${ctx.state}"). Verifique se o som deste site está bloqueado ou silenciado.`,
            );
          }
        });
    }
  }

  /**
   * Recebe um chunk de áudio PCM 24kHz codificado em Base64 e agenda a reprodução.
   */
  feed(base64Pcm: string) {
    if (this.isStopped) return;
    this.initAudioContext();
    if (!this.audioCtx) return;

    try {
      // 1. Decodificar Base64 para binário
      const binaryString = atob(base64Pcm);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 2. Converter Int16 (Little Endian) para Float32Array (-1.0 a 1.0)
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      if (float32Array.length === 0) return;

      // 3. Criar AudioBuffer
      const audioBuffer = this.audioCtx.createBuffer(1, float32Array.length, this.sampleRate);
      audioBuffer.getChannelData(0).set(float32Array);

      // 4. Agendar reprodução contínua sem falhas
      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioCtx.destination);

      const currentTime = this.audioCtx.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime + 0.05; // Buffer inicial de 50ms para estabilidade
      }

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;

      this.activeSources.push(source);

      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        // `stop()` esvazia a lista antes de os `onended` dispararem, por isso um bloco
        // parado à força não chega aqui e não conta como "ficou em silêncio".
        if (idx === -1) return;
        this.activeSources.splice(idx, 1);
        if (this.activeSources.length === 0) {
          this.aoFicarEmSilencio?.();
        }
      };
    } catch (e) {
      console.error('Erro ao processar chunk PCM no PCMPlayer:', e);
    }
  }

  /**
   * Para imediatamente toda a reprodução em curso (usado para Barge-in).
   */
  stop() {
    this.isStopped = true;
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Ignorar se já parou
      }
    }
    this.activeSources = [];
    if (this.audioCtx) {
      this.nextStartTime = this.audioCtx.currentTime;
    }
    this.isStopped = false;
  }

  /**
   * Encerra o contexto de áudio completamente.
   */
  destroy() {
    this.stop();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}
