import React, { useRef, useEffect, useState } from 'react';
import { X, Send, User, Sparkles, Loader2, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { useCopilotStore } from '../store/copilotStore';
import { useUIStore } from '@/store/useUIStore';

export function CopilotWidget() {
  const { isOpen, isExpanded, messages, isLoading, error, setOpen, toggleExpanded, sendMessage, clearMessages } = useCopilotStore();
  const { isSidebarCollapsed } = useUIStore();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para o fundo sempre que chegam novas mensagens
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    sendMessage(inputMessage);
    setInputMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper para formatar Markdown de forma 100% segura sem dangerouslySetInnerHTML
  const parseInlineMarkdown = (text: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
    let match;
    let lastIndex = 0;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const [, , boldItalic, bold, italic] = match;

      if (boldItalic) {
        parts.push(<strong key={key++} className="font-bold text-slate-900 dark:text-slate-100"><em>{boldItalic}</em></strong>);
      } else if (bold) {
        parts.push(<strong key={key++} className="font-bold text-slate-900 dark:text-slate-100">{bold}</strong>);
      } else if (italic) {
        parts.push(<em key={key++}>{italic}</em>);
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const renderFormattedMessage = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // 1. Títulos
      if (line.startsWith('### ')) {
        return (
          <h4 key={index} className="font-bold text-slate-900 dark:text-white text-sm mt-3 mb-1 first:mt-0">
            {parseInlineMarkdown(line.slice(4))}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={index} className="font-bold text-slate-900 dark:text-white text-base mt-4 mb-2 first:mt-0">
            {parseInlineMarkdown(line.slice(3))}
          </h3>
        );
      }

      // 2. Listas
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={index} className="ml-4 list-disc text-sm my-1 text-slate-700 dark:text-slate-300">
            {parseInlineMarkdown(line.trim().slice(2))}
          </li>
        );
      }

      // 3. Linhas vazias
      if (line.trim() === '') {
        return <div key={index} className="h-2" />;
      }

      // 4. Parágrafos comuns
      return (
        <p key={index} className="text-sm leading-relaxed my-0.5 text-slate-700 dark:text-slate-300">
          {parseInlineMarkdown(line)}
        </p>
      );
    });
  };

  return (
    <>
      {/* Painel do Chat (Modern Floating Window) */}
      <div
        className={`fixed z-[100] bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] border border-slate-200 flex flex-col transition-all duration-300 ease-out origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
        } ${
          isExpanded
            ? isSidebarCollapsed 
                ? 'inset-4 sm:inset-y-6 sm:right-6 sm:left-[calc(5rem+1.5rem)] w-auto h-auto'
                : 'inset-4 sm:inset-y-6 sm:right-6 lg:left-[calc(16rem+1.5rem)] sm:left-[calc(16rem+1.5rem)] w-auto h-auto'
            : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100%-2rem)] sm:w-[380px] h-[600px] max-h-[calc(100vh-2rem)]'
        }`}
      >
        {/* Header do Chat */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/10">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-base leading-none tracking-tight">Mayra AI</h2>
              <p className="text-[11px] text-indigo-100 mt-1 flex items-center gap-1.5 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Online e pronta a ajudar
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleExpanded}
              title={isExpanded ? "Restaurar Tamanho" : "Ecrã Inteiro"}
              className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-full transition-colors hidden sm:block"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={clearMessages}
              title="Limpar Conversa"
              className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Área de Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/80 custom-scrollbar">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 shadow-sm ${
                    isUser
                      ? 'bg-slate-200 text-slate-600'
                      : 'bg-indigo-100 text-indigo-600'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>
                <div
                  className={`p-3 text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm'
                      : 'bg-white border border-slate-100 text-slate-700 rounded-2xl rounded-tl-sm'
                  }`}
                >
                  {isUser ? msg.content : renderFormattedMessage(msg.content)}
                </div>
              </div>
            );
          })}

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
          
          {/* Alerta de Erro */}
          {error && (
            <div className="text-center p-2 bg-destructive/10 text-destructive text-xs rounded-md mx-4">
              {error}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 relative bg-slate-50 p-1.5 rounded-full border border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-sm"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte à Mayra..."
              className="flex-1 bg-transparent border-0 focus:ring-0 px-4 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
          <div className="text-center mt-3">
            <span className="text-[10px] text-slate-400 font-medium">
              A Mayra pode cometer erros. Confirme sempre os valores importantes.
            </span>
          </div>
        </div>
      </div>
      
      {/* Backdrop (Mobile) - Mantido para foco em ecrãs pequenos */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[90] sm:hidden transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
