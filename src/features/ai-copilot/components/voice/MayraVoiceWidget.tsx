import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Volume2,
  Wrench,
  X,
  RotateCw,
  Sparkles,
  AlertCircle,
  Send,
  Zap,
} from 'lucide-react';
import { useGeminiVoice, type VoiceState } from '../../hooks/useGeminiVoice';

interface MayraVoiceWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MayraVoiceWidget({ isOpen, onClose }: MayraVoiceWidgetProps) {
  const {
    state,
    transcript,
    interimTranscript,
    executingTool,
    errorMessage,
    isFallback,
    startVoiceSession,
    endVoiceSession,
    sendTextMessage,
  } = useGeminiVoice();

  const [inputMessage, setInputMessage] = useState('');
  const [isMicMuted, setIsMicMuted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startVoiceSession();
    } else {
      endVoiceSession();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendText = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim()) return;
    sendTextMessage(inputMessage.trim());
    setInputMessage('');
  };

  const getStateBadge = (currentState: VoiceState) => {
    switch (currentState) {
      case 'CONNECTING':
        return { text: 'A ligar à Mayra...', color: 'bg-purple-100 text-purple-700' };
      case 'LISTENING':
        return { text: 'A ouvir a sua voz...', color: 'bg-emerald-100 text-emerald-700' };
      case 'SPEAKING':
        return { text: 'Mayra a responder...', color: 'bg-indigo-100 text-indigo-700' };
      case 'EXECUTING_TOOL':
        return { text: 'A consultar sistema...', color: 'bg-cyan-100 text-cyan-700' };
      case 'ERROR':
        return { text: 'Erro de conexão', color: 'bg-red-100 text-red-700' };
      default:
        return { text: 'Desconectado', color: 'bg-slate-100 text-slate-700' };
    }
  };

  const getOrbGradient = (currentState: VoiceState) => {
    switch (currentState) {
      case 'LISTENING':
        return 'from-emerald-400 via-teal-500 to-cyan-600 shadow-[0_0_50px_rgba(16,185,129,0.4)]';
      case 'SPEAKING':
        return 'from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_60px_rgba(99,102,241,0.5)]';
      case 'EXECUTING_TOOL':
        return 'from-cyan-400 via-blue-500 to-indigo-600 shadow-[0_0_50px_rgba(6,182,212,0.4)]';
      case 'ERROR':
        return 'from-red-500 to-rose-600 shadow-[0_0_40px_rgba(239,68,68,0.4)]';
      default:
        return 'from-purple-400 via-indigo-500 to-slate-600 shadow-[0_0_30px_rgba(99,102,241,0.3)]';
    }
  };

  const badge = getStateBadge(state);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="fixed bottom-6 right-6 z-[110] w-[calc(100vw-3rem)] sm:w-[420px] bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.25)] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 leading-none">Mayra Voice</h3>
              <span className="text-[11px] text-slate-400 font-medium">Modo Conversacional Live</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${badge.color}`}>
              {badge.text}
            </span>
            {isFallback && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Resiliente
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Central Visualizer Area */}
        <div className="p-8 flex flex-col items-center justify-center relative min-h-[220px] bg-gradient-to-b from-slate-50/30 to-white">
          {/* Fluid Morphing Orb */}
          <motion.div
            animate={
              state === 'SPEAKING'
                ? {
                    scale: [1, 1.15, 1, 1.2, 1],
                    borderRadius: [
                      '40% 60% 70% 30% / 40% 50% 60% 50%',
                      '60% 40% 30% 70% / 50% 30% 70% 50%',
                      '40% 60% 70% 30% / 40% 50% 60% 50%',
                    ],
                    rotate: [0, 90, 180, 270, 360],
                  }
                : state === 'LISTENING'
                ? {
                    scale: [1, 1.05, 1],
                    borderRadius: [
                      '50% 50% 50% 50%',
                      '45% 55% 50% 50%',
                      '50% 50% 50% 50%',
                    ],
                  }
                : {
                    rotate: [0, 360],
                  }
            }
            transition={{
              duration: state === 'SPEAKING' ? 3 : 5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={`w-28 h-28 rounded-full bg-gradient-to-br ${getOrbGradient(
              state,
            )} flex items-center justify-center transition-all duration-500`}
          >
            {state === 'CONNECTING' && <RotateCw className="w-10 h-10 text-white animate-spin" />}
            {state === 'LISTENING' && <Mic className="w-10 h-10 text-white animate-pulse" />}
            {state === 'SPEAKING' && <Volume2 className="w-10 h-10 text-white animate-bounce" />}
            {state === 'EXECUTING_TOOL' && <Wrench className="w-10 h-10 text-white animate-spin" />}
            {state === 'ERROR' && <AlertCircle className="w-10 h-10 text-white" />}
            {state === 'DISCONNECTED' && <MicOff className="w-10 h-10 text-white/70" />}
          </motion.div>

          {/* Executing Tool Indicator */}
          {executingTool && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs rounded-full font-medium flex items-center gap-2"
            >
              <Wrench className="w-3.5 h-3.5 animate-spin" />
              <span>A executar: {executingTool}</span>
            </motion.div>
          )}

          {/* Transcript / Subtitles display */}
          <div className="mt-5 text-center max-w-[340px] px-2 min-h-[44px] flex items-center justify-center">
            {interimTranscript ? (
              <p className="text-xs text-slate-500 italic animate-pulse font-medium">
                "{interimTranscript}"
              </p>
            ) : transcript ? (
              <p className="text-xs font-medium text-slate-700 bg-slate-100/70 px-3 py-1.5 rounded-xl border border-slate-200/50">
                "{transcript}"
              </p>
            ) : errorMessage ? (
              <p className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
                {errorMessage}
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                {state === 'LISTENING' && 'Fale naturalmente... A Mayra está a ouvir.'}
                {state === 'SPEAKING' && 'A Mayra está a responder por voz.'}
                {state === 'CONNECTING' && 'A estabelecer canal áudio seguro...'}
              </p>
            )}
          </div>
        </div>

        {/* Text alternative input */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <form onSubmit={handleSendText} className="flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Digite se preferir não falar..."
              className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-100/50">
          <button
            onClick={() => startVoiceSession()}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" /> Reconectar
          </button>

          <button
            onClick={() => setIsMicMuted(!isMicMuted)}
            className={`p-2.5 rounded-full transition-colors ${
              isMicMuted
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
            }`}
          >
            {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
