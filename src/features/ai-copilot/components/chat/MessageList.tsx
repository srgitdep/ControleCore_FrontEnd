import { useRef, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useCopilotStore } from '../../store/copilotStore';
import { MessageBubble } from './MessageBubble';
import { WelcomeScreen } from './WelcomeScreen';

export function MessageList() {
  const { messages, isLoading } = useCopilotStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para o fundo sempre que chegam novas mensagens
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/80 custom-scrollbar flex flex-col">
      {messages.length <= 1 ? (
        <WelcomeScreen />
      ) : (
        messages.map((msg, idx) => (
          <MessageBubble key={idx} msg={msg} idx={idx} />
        ))
      )}
      
      {/* Indicador de "A escrever..." */}
      {isLoading && (
        <div className="flex gap-3 max-w-[85%]">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mt-1 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
