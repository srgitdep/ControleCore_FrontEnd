import { useState, useRef, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  podeVoltarAOuvir,
  calcularRms,
  contarBlocoDeFala,
  deveInterromper,
} from '../escuta';
import { enderecoDoSocket } from '../../../shared/config/enderecoSocket';
import { PCMPlayer } from '@/shared/utils';
import { api } from '@/shared/config';
import { detectarIdioma, escolherVoz } from '../utils/idioma';

export type VoiceState =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'LISTENING'
  | 'EXECUTING_TOOL'
  | 'SPEAKING'
  | 'ERROR';

export interface UseGeminiVoiceReturn {
  state: VoiceState;
  transcript: string;
  interimTranscript: string;
  executingTool: string | null;
  errorMessage: string | null;
  isFallback: boolean;
  startVoiceSession: () => void;
  endVoiceSession: () => void;
  sendTextMessage: (text: string) => void;
}

export function useGeminiVoice(): UseGeminiVoiceReturn {
  const [state, setState] = useState<VoiceState>('DISCONNECTED');
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [executingTool, setExecutingTool] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState<boolean>(false);

  const socketRef = useRef<Socket | null>(null);
  // O temporizador que desiste de ligar. Numa ref porque `endVoiceSession` tem de o
  // poder cancelar: sem isso, fechar o ecrã antes de ligar deixava-o a disparar e a
  // marcar ERROR numa sessão que já não existe.
  const esperaDeLigacaoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * Se a Mayra está a falar neste preciso momento.
   *
   * Sem este sinal, o microfone reabria enquanto ela falava e transcrevia a própria
   * voz: o texto dela chegava ao gateway como se fosse do utilizador, e ela respondia
   * às suas próprias frases. Nos registos via-se «Está correto ou se deseja que eu
   * procuro...» a entrar como pergunta — uma frase que ela tinha acabado de dizer.
   */
  const mayraAFalarRef = useRef(false);
  /**
   * O MP3 da ElevenLabs que está a tocar.
   *
   * Era uma variável local dentro do handler, fora do alcance de `endVoiceSession` —
   * e por isso fechar a aba da voz não a calava: a síntese do browser era cancelada,
   * o reprodutor PCM era parado, e este `<audio>` continuava até ao fim.
   */
  const audioDaMayraRef = useRef<HTMLAudioElement | null>(null);
  /** Se há sessão de voz aberta. Nada deve reabrir o microfone depois de fechada. */
  const sessaoActivaRef = useRef(false);
  /** Blocos de áudio seguidos em que se ouviu alguém a falar por cima dela. */
  const blocosDeFalaRef = useRef(0);
  const pcmPlayerRef = useRef<PCMPlayer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const fallbackModeRef = useRef<boolean>(false);

  /**
   * O idioma da conversa em curso, deduzido da última resposta da Mayra.
   *
   * Numa `ref` e não em `state`: é lido dentro dos handlers do `SpeechRecognition` e do
   * socket, que são criados uma vez e capturariam um valor obsoleto de `state`. E
   * mudá-lo não deve provocar re-renderização — só afecta a próxima chamada.
   *
   * Começa em português, que é o idioma por omissão do sistema.
   */
  const idiomaDaConversaRef = useRef<'pt-PT' | 'en-US'>('pt-PT');
  const isRefreshingTokenRef = useRef<boolean>(false);

  // Inicializar PCMPlayer (24kHz para Gemini Live Audio)
  useEffect(() => {
    pcmPlayerRef.current = new PCMPlayer(24000);
    return () => {
      if (pcmPlayerRef.current) {
        pcmPlayerRef.current.destroy();
      }
    };
  }, []);

  /**
   * Sanitiza o texto para leitura natural pelo sintetizador do browser.
   */
  const cleanTextForSpeech = useCallback((rawText: string): string => {
    let cleaned = rawText
      .replace(/\[PERSONA:[^\]]+\]/gi, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\bMZN\b/g, 'meticais')
      .replace(/\bUSD\b/g, 'dólares')
      .replace(/\bEUR\b/g, 'euros')
      .replace(/\bkg\b/g, 'quilos')
      .replace(/%/g, ' por cento')
      .replace(/\bSr\.\b/g, 'Senhor')
      .replace(/\bSra\.\b/g, 'Senhora')
      .replace(/\bEng\.\b/g, 'Engenheiro')
      .trim();

    if (cleaned.length > 350) {
      const lastPeriod = cleaned.lastIndexOf('.', 350);
      if (lastPeriod > 100) {
        cleaned = cleaned.substring(0, lastPeriod + 1);
      } else {
        cleaned = cleaned.substring(0, 350);
      }
    }
    return cleaned;
  }, []);

  /**
   * Converte Float32 (-1.0 a 1.0) para PCM Int16 Base64.
   */
  const float32ToBase64Pcm = (inputData: Float32Array): string => {
    const pcm16 = new Int16Array(inputData.length);
    for (let i = 0; i < inputData.length; i++) {
      const s = Math.max(-1, Math.min(1, inputData[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    let binary = '';
    const bytes = new Uint8Array(pcm16.buffer);
    const chunkLength = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkLength) {
      binary += String.fromCharCode.apply(
        null,
        Array.from(bytes.subarray(i, i + chunkLength)),
      );
    }
    return btoa(binary);
  };

  /**
   * Encerra todos os recursos de áudio e conexões.
   */
  /** Cala o microfone. O `onend` que isto dispara não o reabre — ver `voltarAOuvir`. */
  const pararDeOuvir = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (e) {}
  }, []);

  /**
   * Devolve o microfone à escuta — se, e só se, for seguro.
   *
   * Todas as condições têm de passar, e cada uma corresponde a uma avaria observada:
   * a sessão tem de estar aberta (fechar a aba deixava o microfone a reabrir-se),
   * a Mayra não pode estar a falar (senão ela ouve-se a si própria), e o socket tem
   * de estar ligado.
   *
   * O meio segundo de espera não é estético: o altifalante tem cauda, e um microfone
   * aberto cedo demais apanha o fim da frase dela.
   */
  const voltarAOuvir = useCallback(() => {
    setTimeout(() => {
      if (!recognitionRef.current) return;

      // A decisão vive em `escuta.ts`, com testes: cada condição corresponde a uma
      // avaria observada, e errar por excesso não dá erro — só faz a conversa começar
      // a falar sozinha.
      const seguro = podeVoltarAOuvir({
        sessaoActiva: sessaoActivaRef.current,
        emFallback: fallbackModeRef.current,
        mayraAFalar: mayraAFalarRef.current,
        socketLigado: socketRef.current?.connected ?? false,
      });
      if (!seguro) return;
      try {
        // O objecto é reutilizado entre turnos: sem isto o idioma do reconhecimento
        // ficaria preso ao da criação da sessão.
        recognitionRef.current.lang = idiomaDaConversaRef.current;
        recognitionRef.current.start();
      } catch (e) {}
    }, 500);
  }, []);

  /**
   * Cala a Mayra a meio da frase e passa a ouvir.
   *
   * Serve os dois modos, e em cada um há uma coisa diferente a calar: na voz nativa é
   * o reprodutor PCM e é preciso avisar o modelo (senão ele continua a gerar áudio de
   * uma frase que ninguém vai ouvir); no modo de recurso é o MP3 da ElevenLabs ou a
   * síntese do browser.
   */
  const interromperMayra = useCallback(() => {
    if (!mayraAFalarRef.current) return;
    mayraAFalarRef.current = false;
    blocosDeFalaRef.current = 0;

    // Avisa o modelo. Sem isto ele continua a debitar a resposta antiga, e o turno
    // seguinte chega por cima dela.
    if (socketRef.current?.connected) {
      socketRef.current.emit('client_interrupt');
    }

    if (pcmPlayerRef.current) {
      pcmPlayerRef.current.stop();
    }
    if (audioDaMayraRef.current) {
      audioDaMayraRef.current.pause();
      audioDaMayraRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setState('LISTENING');

    // No modo de recurso o microfone estava fechado enquanto ela falava — reabri-lo é
    // o que dá sentido à interrupção. Na voz nativa ele nunca fechou.
    if (fallbackModeRef.current) {
      voltarAOuvir();
    }
  }, [voltarAOuvir]);

  const endVoiceSession = useCallback(() => {
    // Para microfone
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Para áudio e síntese
    //
    // A sessão fecha primeiro, e só depois se cala o que está a tocar: qualquer
    // `onended` que dispare a seguir encontra `sessaoActivaRef` a falso e não reabre
    // o microfone.
    sessaoActivaRef.current = false;
    mayraAFalarRef.current = false;

    if (pcmPlayerRef.current) {
      pcmPlayerRef.current.stop();
    }
    // O MP3 da ElevenLabs: sem isto, fechar a aba deixava-a a falar até ao fim.
    if (audioDaMayraRef.current) {
      audioDaMayraRef.current.pause();
      audioDaMayraRef.current.src = '';
      audioDaMayraRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Para SpeechRecognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignorar
      }
      recognitionRef.current = null;
    }

    // Desconecta socket
    if (esperaDeLigacaoRef.current) {
      clearTimeout(esperaDeLigacaoRef.current);
      esperaDeLigacaoRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setState('DISCONNECTED');
    setExecutingTool(null);
    setInterimTranscript('');
    setIsFallback(false);
    fallbackModeRef.current = false;
  }, []);

  /**
   * Inicia o reconhecimento local via SpeechRecognition (Modo Fallback).
   */
  const startFallbackRecognition = useCallback(() => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setErrorMessage('O seu navegador não suporta reconhecimento de voz local.');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    const recognition = new SpeechRecognitionClass();

    // O `SpeechRecognition` só aceita um idioma de cada vez — não há forma de lhe
    // pedir «português ou inglês». Usa-se o da última resposta da Mayra, que é o da
    // conversa em curso: se ela respondeu em inglês, é porque se falou inglês, e o
    // turno seguinte será provavelmente também em inglês.
    //
    // Começa em português (o valor inicial de `idiomaDaConversaRef`), o que é o certo
    // para Moçambique. Um utilizador que fale inglês na primeira frase é reconhecido
    // pior nesse turno, mas a partir da resposta a conversa passa para inglês.
    recognition.lang = idiomaDaConversaRef.current;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: any) => {
      // Segunda linha de defesa. Mesmo com o microfone bem gerido, um altifalante
      // alto chega a entrar no microfone antes de `pararDeOuvir` fazer efeito. Nada
      // do que se ouve enquanto ela fala pode ser tratado como fala do utilizador.
      if (mayraAFalarRef.current) return;

      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          // Selecionar alternativa com maior confiança
          let bestText = event.results[i][0].transcript;
          let bestConfidence = event.results[i][0].confidence;
          for (let j = 1; j < event.results[i].length; j++) {
            if (event.results[i][j].confidence > bestConfidence) {
              bestText = event.results[i][j].transcript;
              bestConfidence = event.results[i][j].confidence;
            }
          }

          if (bestText.trim().length > 2) {
            setTranscript(bestText.trim());
            setInterimTranscript('');
            setState('LISTENING');

            // Enviar texto para o gateway
            if (socketRef.current) {
              socketRef.current.emit('text_input', { text: bestText.trim() });
            }
          }
        } else {
          interim += event.results[i][0].transcript;
          setInterimTranscript(interim);
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('Erro SpeechRecognition:', event.error);
      }
    };

    recognition.onend = () => {
      // Reabrir aqui incondicionalmente era o ciclo: o `stop()` que se faz quando a
      // Mayra começa a falar dispara este `onend`, que voltava a abrir o microfone
      // 300 ms depois — com ela ainda a falar. Ela ouvia-se, transcrevia-se, e
      // respondia a si própria. `voltarAOuvir` só reabre quando é seguro.
      voltarAOuvir();
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {}
  }, [voltarAOuvir]);

  /**
   * Captura áudio do microfone (16kHz PCM mono) para envio em tempo real.
   */
  const startMicrophone = useCallback(() => {
    navigator.mediaDevices
      .getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      .then((stream) => {
        mediaStreamRef.current = stream;

        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtxClass({ sampleRate: 16000 });
        audioContextRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const processor = audioCtx.createScriptProcessor(2048, 1, 1);
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(audioCtx.destination);

        processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);

          // 1. Deixar espaço para lhe cortar a palavra.
          //
          // A condição era `state === 'SPEAKING'`, e nunca era verdadeira: este
          // `onaudioprocess` fecha sobre o `state` do render em que foi criado — a
          // ligação ainda estava a abrir — e nunca vê os valores seguintes. O barge-in
          // existia no código e não funcionava uma única vez.
          //
          // Uma `ref` não tem esse problema: é sempre a leitura actual.
          //
          // Vale nos dois modos. Antes era excluído o de recurso, que é justamente
          // aquele em que o microfone fecha enquanto ela fala — ou seja, aquele em que
          // não havia mesmo maneira nenhuma de a interromper.
          if (mayraAFalarRef.current) {
            blocosDeFalaRef.current = contarBlocoDeFala(
              calcularRms(inputData),
              blocosDeFalaRef.current,
            );

            if (deveInterromper(mayraAFalarRef.current, blocosDeFalaRef.current)) {
              interromperMayra();
            }
          } else {
            blocosDeFalaRef.current = 0;
          }

          // 2. Enviar chunk de áudio para a Gemini Live API se não estiver em fallback
          if (!fallbackModeRef.current && socketRef.current?.connected) {
            const base64Pcm = float32ToBase64Pcm(inputData);
            socketRef.current.emit('audio_input', { data: base64Pcm });
          }
        };
      })
      .catch((err) => {
        console.error('Erro ao aceder ao microfone:', err);
        setErrorMessage('Não foi possível aceder ao microfone. Verifique as permissões.');
        setState('ERROR');
      });
  }, [interromperMayra]);

  /**
   * Inicia a sessão de voz conectando ao WebSocket Gateway.
   */
  const startVoiceSession = useCallback(async () => {
    endVoiceSession();

    // Depois de `endVoiceSession`, que a fecha. Enquanto isto for falso, nada reabre
    // o microfone nem deixa um `onended` atrasado mexer no estado.
    sessaoActivaRef.current = true;

    setState('CONNECTING');
    setErrorMessage(null);

    // 1. Obter token de voz temporário via API REST (usa o cookie HttpOnly automaticamente)
    let voiceToken: string | undefined;
    try {
      const tokenRes = await api.get('/copilot/voice-token');
      voiceToken = tokenRes.data?.token;
    } catch (e) {
      console.warn('Aviso: Não foi possível obter token de voz via REST API:', e);
    }

    // O endereço do socket **não** segue a regra do REST, e é aqui que a voz partia.
    //
    // Os pedidos REST saem por caminho relativo (`VITE_API_URL=/api/v1`) para os
    // cookies contarem como *first-party* no iOS. Mas os `rewrites` do Vercel não
    // encaminham WebSockets: apontado à origem da página, o socket ficava pendurado no
    // handshake e este ecrã mostrava «A ligar…» indefinidamente.
    //
    // `enderecoDoSocket()` é o mesmo que o socket dos eventos usa, e conhece
    // `VITE_SOCKET_URL` — o endereço directo da API para exactamente este caso.
    const { endereco: socketHost, avisoDeConfiguracao } = enderecoDoSocket();

    if (avisoDeConfiguracao) {
      console.warn(`[Voz] ${avisoDeConfiguracao}`);
    }

    const socket = io(`${socketHost}/ai-copilot/voice`, {
      auth: { token: voiceToken },
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: false,
    });

    socketRef.current = socket;

    // Sem isto, um socket que nunca liga deixa o ecrã em «A ligar…» para sempre: o
    // Socket.io não desiste sozinho, e `reconnection` está desligado. Foi assim que a
    // avaria chegou ao utilizador sem nada que a explicasse.
    esperaDeLigacaoRef.current = setTimeout(() => {
      if (socket.connected) return;
      socket.close();
      setErrorMessage(
        avisoDeConfiguracao ??
          `Não foi possível ligar ao servidor de voz em ${socketHost}. Verifique a ligação.`,
      );
      setState('ERROR');
    }, 12000);

    socket.on('connect', () => {
      if (esperaDeLigacaoRef.current) clearTimeout(esperaDeLigacaoRef.current);
      setState('LISTENING');
      startMicrophone();
    });

    socket.on('connect_error', (err) => {
      if (esperaDeLigacaoRef.current) clearTimeout(esperaDeLigacaoRef.current);
      setErrorMessage(avisoDeConfiguracao ?? `Falha ao ligar ao servidor de voz: ${err.message}`);
      setState('ERROR');
    });

    // 1. Chunk de Áudio Nativo (Gemini Live 24kHz)
    socket.on('audio_chunk', (payload: { mimeType: string; data: string }) => {
      setState('SPEAKING');
      if (pcmPlayerRef.current) {
        pcmPlayerRef.current.feed(payload.data);
      }
    });

    // 2. MP3 da ElevenLabs (TTS Fallback Primário)
    socket.on('system_audio_mp3', (payload: { data: string; text: string }) => {
      setState('SPEAKING');
      mayraAFalarRef.current = true;
      pararDeOuvir();

      // Uma resposta nova cala a anterior: sem isto, duas respostas seguidas tocam
      // sobrepostas e nenhuma se percebe.
      if (audioDaMayraRef.current) {
        audioDaMayraRef.current.pause();
      }

      const audio = new Audio(`data:audio/mp3;base64,${payload.data}`);
      audioDaMayraRef.current = audio;

      const terminou = () => {
        // Só liberta se ainda for este o áudio em curso: uma resposta mais recente
        // pode já ter tomado o lugar, e não é este `onended` que a deve calar.
        if (audioDaMayraRef.current !== audio) return;
        audioDaMayraRef.current = null;
        mayraAFalarRef.current = false;
        if (!sessaoActivaRef.current) return;
        setState('LISTENING');
        voltarAOuvir();
      };

      audio.onended = terminou;
      // Sem isto, um MP3 que falhe a reproduzir deixava `mayraAFalarRef` preso a
      // verdadeiro e o microfone nunca mais reabria: a voz emudecia dos dois lados.
      audio.onerror = terminou;

      audio.play().catch((e) => {
        console.error('Erro ao reproduzir MP3 ElevenLabs:', e);
        terminou();
      });
    });

    // 3. Texto limpo para Web Speech API (TTS Fallback Secundário)
    socket.on('text_chunk', (payload: { text: string }) => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const cleaned = cleanTextForSpeech(payload.text);
        const utterance = new SpeechSynthesisUtterance(cleaned);

        // O idioma sai do texto que a Mayra respondeu, e não de uma constante: se ela
        // responder em inglês (porque lhe falaram inglês), ler a frase com fonética
        // portuguesa torna-a incompreensível.
        //
        // Além do `lang`, escolhe-se a voz: definir `lang` sozinho não muda a voz já
        // seleccionada em alguns browsers, e o resultado seria uma voz portuguesa a
        // tentar ler inglês.
        const idioma = detectarIdioma(cleaned);
        utterance.lang = idioma;

        // Guarda o idioma para o reconhecimento do turno seguinte: se a Mayra
        // respondeu em inglês, é porque se falou inglês, e a pergunta seguinte será
        // provavelmente também em inglês.
        idiomaDaConversaRef.current = idioma;

        const voz = escolherVoz(idioma, window.speechSynthesis.getVoices());
        if (voz) utterance.voice = voz;

        utterance.pitch = 1.1;

        utterance.onstart = () => {
          setState('SPEAKING');
          mayraAFalarRef.current = true;
          pararDeOuvir();
        };

        const terminou = () => {
          mayraAFalarRef.current = false;
          if (!sessaoActivaRef.current) return;
          setState('LISTENING');
          voltarAOuvir();
        };

        utterance.onend = terminou;
        // Um `utterance` que rebente sem `onend` deixaria o microfone fechado para
        // sempre. `onerror` fecha essa porta.
        utterance.onerror = terminou;

        // `mayraAFalarRef` é marcado já aqui, e não só no `onstart`: entre `speak()` e
        // o disparo do `onstart` há uma janela em que o microfone ainda estaria a
        // ouvir, e é onde cabe o início da frase dela.
        mayraAFalarRef.current = true;
        pararDeOuvir();
        window.speechSynthesis.speak(utterance);
      }
    });

    // 4. Status de Execução de Ferramentas (Tool Calling)
    socket.on('tool_executing', (payload: { toolName: string }) => {
      setState('EXECUTING_TOOL');
      setExecutingTool(payload.toolName);
    });

    socket.on('tool_executed', (_payload: { toolName: string; result: any }) => {
      setTimeout(() => {
        setExecutingTool(null);
      }, 4000);
    });

    // 5. Outros eventos de ciclo de vida
    socket.on('turn_complete', () => {
      if (state !== 'SPEAKING') {
        setState('LISTENING');
      }
    });

    socket.on('interrupted', () => {
      if (pcmPlayerRef.current) {
        pcmPlayerRef.current.stop();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setState('LISTENING');
    });

    socket.on('fallback_active', () => {
      setIsFallback(true);
      fallbackModeRef.current = true;
      startFallbackRecognition();
    });

    socket.on('voice_error', async (payload: { message: string }) => {
      console.warn('Erro recebido do Voice Gateway:', payload.message);

      // Tentar auto-refresh se erro for de autenticação expirada
      if (
        (payload.message.includes('expirada') || payload.message.includes('token')) &&
        !isRefreshingTokenRef.current
      ) {
        isRefreshingTokenRef.current = true;
        try {
          await api.post('/auth/refresh');
          isRefreshingTokenRef.current = false;
          // Reconectar sessão após refresh bem-sucedido
          setTimeout(() => startVoiceSession(), 100);
          return;
        } catch (refreshErr) {
          isRefreshingTokenRef.current = false;
          setErrorMessage('Sessão expirada. Por favor, faça login novamente.');
          setState('ERROR');
          return;
        }
      }

      setErrorMessage(payload.message);
      setState('ERROR');
    });

    socket.on('disconnect', () => {
      if (state !== 'DISCONNECTED') {
        setState('DISCONNECTED');
      }
    });
  }, [endVoiceSession, startMicrophone, startFallbackRecognition, cleanTextForSpeech, state, pararDeOuvir, voltarAOuvir]);

  /**
   * Envia uma mensagem de texto alternativa pelo socket ative.
   */
  const sendTextMessage = useCallback((text: string) => {
    if (!text.trim() || !socketRef.current?.connected) return;
    setTranscript(text);
    if (fallbackModeRef.current) {
      socketRef.current.emit('text_input', { text: text.trim() });
    } else {
      socketRef.current.emit('audio_input', { data: '' }); // Ping ou mensagem textual via Socket
    }
  }, []);

  return {
    state,
    transcript,
    interimTranscript,
    executingTool,
    errorMessage,
    isFallback,
    startVoiceSession,
    endVoiceSession,
    sendTextMessage,
  };
}
