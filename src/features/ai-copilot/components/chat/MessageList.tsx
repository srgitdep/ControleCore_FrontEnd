import { lazy, Suspense, useRef, useEffect } from 'react';
import { useCopilotStore } from '../../store/copilotStore';
import { WelcomeScreen } from './WelcomeScreen';
import { MayraPensando } from './MayraPensando';

// Carregada sob pedido: o react-markdown traz um regex com lookbehind (`(?<=`) que o Safari < 16.4 não consegue
// sequer ler — e um regex literal inválido derruba o bundle INTEIRO (ecrã branco no iPhone antigo), não só a Mayra.
// Fora do bundle principal, o pior que lhe acontece é a Mayra não abrir nesses aparelhos.
const MessageBubble = lazy(() => import('./MessageBubble').then((m) => ({ default: m.MessageBubble })));

export function MessageList() {
  const { messages, isLoading, passos } = useCopilotStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para o fundo sempre que chegam novas mensagens
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, passos]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/80 custom-scrollbar flex flex-col">
      {messages.length <= 1 ? (
        <WelcomeScreen />
      ) : (
        messages.map((msg, idx) => (
          <Suspense key={idx} fallback={null}>
            <MessageBubble msg={msg} idx={idx} />
          </Suspense>
        ))
      )}
      
      {/* O que a Mayra está a fazer, até a resposta começar a aparecer. Quando o texto
          começa a chegar, é ele que ocupa o lugar (a mensagem em `aEmitir`). */}
      {isLoading && !messages[messages.length - 1]?.aEmitir && <MayraPensando passos={passos.length > 0 ? passos : [{ fase: 'interpretar' }]} />}

      <div ref={messagesEndRef} />
    </div>
  );
}
