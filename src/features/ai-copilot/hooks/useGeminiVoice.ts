import { useState, useRef, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { PCMPlayer } from '@/shared/utils';
import { api } from '@/shared/config';

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
  const pcmPlayerRef = useRef<PCMPlayer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const fallbackModeRef = useRef<boolean>(false);
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
    if (pcmPlayerRef.current) {
      pcmPlayerRef.current.stop();
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
    recognition.lang = 'pt-PT';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: any) => {
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
      // Reiniciar continuamente se mantiver em modo fallback e listening
      if (fallbackModeRef.current && socketRef.current?.connected) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {}
        }, 300);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {}
  }, []);

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

          // 1. Voice Activity Detection (VAD) para Barge-in no modo nativo
          if (state === 'SPEAKING' && !fallbackModeRef.current) {
            let sumSq = 0;
            for (let i = 0; i < inputData.length; i++) {
              sumSq += inputData[i] * inputData[i];
            }
            const rms = Math.sqrt(sumSq / inputData.length);

            // RMS > 0.08 indica fala ativa do utilizador por cima da agente
            if (rms > 0.08) {
              if (socketRef.current) {
                socketRef.current.emit('client_interrupt');
              }
              if (pcmPlayerRef.current) {
                pcmPlayerRef.current.stop();
              }
              if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
              setState('LISTENING');
            }
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
  }, [state]);

  /**
   * Inicia a sessão de voz conectando ao WebSocket Gateway.
   */
  const startVoiceSession = useCallback(async () => {
    endVoiceSession();

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

    // Derivar URL do Socket.io a partir da VITE_API_URL
    const baseUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3100/api/v1';
    const socketHost = baseUrl.replace(/\/api\/v1\/?$/, '');

    const socket = io(`${socketHost}/ai-copilot/voice`, {
      auth: { token: voiceToken },
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: false,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setState('LISTENING');
      startMicrophone();
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
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }

      const audio = new Audio(`data:audio/mp3;base64,${payload.data}`);
      audio.onended = () => {
        setState('LISTENING');
        if (fallbackModeRef.current) {
          setTimeout(() => {
            if (recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {}
            }
          }, 300);
        }
      };
      audio.play().catch((e) => console.error('Erro ao reproduzir MP3 ElevenLabs:', e));
    });

    // 3. Texto limpo para Web Speech API (TTS Fallback Secundário)
    socket.on('text_chunk', (payload: { text: string }) => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const cleaned = cleanTextForSpeech(payload.text);
        const utterance = new SpeechSynthesisUtterance(cleaned);
        utterance.lang = 'pt-PT';
        utterance.pitch = 1.1;

        utterance.onstart = () => setState('SPEAKING');
        utterance.onend = () => {
          setState('LISTENING');
          if (fallbackModeRef.current) {
            setTimeout(() => {
              if (recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                } catch (e) {}
              }
            }, 300);
          }
        };

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
  }, [endVoiceSession, startMicrophone, startFallbackRecognition, cleanTextForSpeech, state]);

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
