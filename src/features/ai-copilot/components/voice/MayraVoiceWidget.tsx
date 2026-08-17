import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, MessageSquare, Send, ArrowLeft } from 'lucide-react';
import { useGeminiVoice, type VoiceState } from '../../hooks/useGeminiVoice';
import { OrbeFluida } from './OrbeFluida';

/**
 * O modo de voz da Mayra.
 *
 * ## Sobrepõe-se ao painel, não abre outro
 *
 * Era uma segunda janela flutuante, com cabeçalho, dois rótulos de estado e barra de
 * botões próprios — dois painéis ao mesmo tempo no ecrã, cada um com o seu «fechar», e
 * nenhum dos dois claramente o principal.
 *
 * Agora cobre o painel da Mayra por dentro (`absolute inset-0`), como uma camada. Sair
 * volta à conversa escrita, que continuou onde estava — o histórico não se perde, porque
 * nada foi desmontado.
 *
 * ## Sem ícones a dizer o que a animação já diz
 *
 * A esfera não tem símbolo dentro. Tinha microfone, altifalante, e uma chave de fendas
 * enquanto consultava o sistema — um símbolo de oficina no meio de uma conversa. O estado
 * lê-se pelo movimento da esfera e por uma linha de texto; ver `OrbeFluida`.
 */

interface MayraVoiceWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Uma frase por estado. Substitui as pastilhas coloridas que havia no cabeçalho. */
function legendaDe(estado: VoiceState, ferramenta: string | null): string {
  switch (estado) {
    case 'CONNECTING':
      return 'A ligar...';
    case 'LISTENING':
      return 'A ouvir';
    case 'SPEAKING':
      return 'A responder';
    case 'EXECUTING_TOOL':
      // O nome da ferramenta é interno («get_low_stock_alerts») e não diz nada a quem
      // está a falar; a frase genérica informa melhor do que o identificador.
      return ferramenta ? 'A consultar os dados...' : 'A pensar...';
    case 'ERROR':
      return 'Não foi possível ligar';
    default:
      return 'Toque no microfone para falar';
  }
}

export function MayraVoiceWidget({ isOpen, onClose }: MayraVoiceWidgetProps) {
  const {
    state,
    transcript,
    interimTranscript,
    executingTool,
    errorMessage,
    startVoiceSession,
    endVoiceSession,
    sendTextMessage,
  } = useGeminiVoice();

  const [modoTexto, setModoTexto] = useState(false);
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    if (isOpen) {
      startVoiceSession();
    } else {
      endVoiceSession();
      setModoTexto(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const enviarTexto = (e?: React.FormEvent) => {
    e?.preventDefault();
    const texto = mensagem.trim();
    if (!texto) return;
    sendTextMessage(texto);
    setMensagem('');
    setModoTexto(false);
  };

  /** O que está a ser dito, ou a legenda do estado. */
  const aoVivo = interimTranscript || transcript;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          // `absolute` e não `fixed`: fica dentro do painel da Mayra, cobrindo-o. Com
          // `fixed` voltaria a ser uma janela por cima de tudo, que é o que se queria
          // deixar de ter.
          className="absolute inset-0 z-30 flex flex-col bg-white"
        >
          {/* Voltar à conversa escrita. Um só botão — o painel já tem o seu próprio
              fechar, e dois «fechar» no mesmo ecrã não dizem qual faz o quê. */}
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              aria-label="Voltar à conversa escrita"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-slate-400">Voz</span>
            <span className="w-10" />
          </div>

          {/* A esfera e o que se está a dizer */}
          <div className="flex flex-1 flex-col items-center justify-center gap-8 px-8">
            <OrbeFluida estado={state} />

            <div className="min-h-[72px] max-w-sm text-center">
              {errorMessage ? (
                <p className="text-sm text-red-600">{errorMessage}</p>
              ) : aoVivo ? (
                // O que foi dito, sem aspas nem itálico: é a fala do utilizador, não uma
                // citação de outra pessoa.
                <p
                  className={`text-base leading-relaxed ${
                    interimTranscript ? 'text-slate-400' : 'text-slate-800'
                  }`}
                >
                  {aoVivo}
                </p>
              ) : (
                <p className="text-sm text-slate-400">{legendaDe(state, executingTool)}</p>
              )}
            </div>
          </div>

          {/* Escrever, em vez de falar. Aparece só quando pedido: um campo de texto
              sempre à vista num ecrã de voz convida a escrever, que é o contrário do
              propósito. */}
          {modoTexto && (
            <motion.form
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={enviarTexto}
              className="flex items-center gap-2 px-5 pb-2"
            >
              <input
                autoFocus
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Escreva a sua pergunta..."
                className="h-11 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-400 focus:bg-white"
              />
              <button
                type="submit"
                disabled={!mensagem.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white disabled:opacity-40"
                aria-label="Enviar"
              >
                <Send className="h-4 w-4" />
              </button>
            </motion.form>
          )}

          {/* Os três controlos, como na referência: escrever, microfone ao centro (maior,
              porque é a acção principal), e sair. */}
          <div className="flex items-center justify-center gap-5 px-6 pb-8 pt-2">
            <button
              onClick={() => setModoTexto((v) => !v)}
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                modoTexto
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
              aria-label="Escrever em vez de falar"
            >
              <MessageSquare className="h-5 w-5" />
            </button>

            {/* Reconectar quando a ligação caiu; nos outros estados o microfone é o
                indicador de que a sessão está viva. */}
            <button
              onClick={() => (state === 'ERROR' || state === 'DISCONNECTED') && startVoiceSession()}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/25 transition-transform active:scale-95"
              aria-label={
                state === 'ERROR' || state === 'DISCONNECTED' ? 'Ligar de novo' : 'A ouvir'
              }
            >
              {state === 'ERROR' || state === 'DISCONNECTED' ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </button>

            <button
              onClick={onClose}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
              aria-label="Sair do modo de voz"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
