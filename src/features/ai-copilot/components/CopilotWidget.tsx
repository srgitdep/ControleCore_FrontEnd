import { useState, useEffect } from 'react';
import { useCopilotStore } from '../store/copilotStore';
import { classeLarguraDaMayra } from '../utils/margem-layout';

// Modulares Components
import { HistoryPanel } from './history/HistoryPanel';
import { ChatHeader } from './chat/ChatHeader';
import { MessageList } from './chat/MessageList';
import { ChatInput } from './chat/ChatInput';
import { MayraVoiceWidget } from './voice/MayraVoiceWidget';

export function CopilotWidget() {
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  const { 
    isOpen, 
    isExpanded, 
    isHistoryOpen, 
    setOpen, 
    loadSessions,
    sendMessage,
    isLoading,
    error
  } = useCopilotStore();
  

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen, loadSessions]);

  return (
    <>
      {/* Painel da Mayra.

          ## Encostado, e não a flutuar

          Era uma janela flutuante com `bottom-4 right-4`, por cima do conteúdo: numa
          tabela larga tapava as últimas colunas e os botões de acção, e não havia como
          ver o que estava debaixo sem fechar a Mayra.

          Agora é uma coluna encostada à direita, e o conteúdo encolhe para lhe dar
          espaço — o mesmo comportamento do menu lateral. Ver `larguraDaMayra` em
          `AppLayout`, que é quem aplica a margem.

          ## Ecrã inteiro no telemóvel

          Abaixo de `md` não há largura para pôr a Mayra ao lado de nada: 380 px num ecrã
          de 375 px deixaria o conteúdo sem espaço. Passa a ocupar o ecrã todo, como o
          ChatGPT ou o Claude fazem no telemóvel. */}
      <div
        className={`fixed z-[100] bg-white border-slate-200 flex flex-row transition-all duration-300 ease-out overflow-hidden ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
        } ${
          // Telemóvel: ecrã inteiro, sem cantos redondos nem margens — não há espaço
          // para as ter, e um painel encostado aos quatro bordos lê-se como um ecrã.
          'inset-0 md:inset-y-0 md:left-auto md:right-0 md:border-l md:shadow-[-8px_0_32px_rgba(0,0,0,0.08)] '
        } ${classeLarguraDaMayra({ isOpen, isExpanded, isHistoryOpen })}`}
      >
        <HistoryPanel />

        {/* Painel do Chat Principal */}
        <div className={`flex-1 flex flex-col h-full bg-white relative transition-all duration-300 ${isHistoryOpen ? 'hidden sm:flex' : 'flex'}`}>
          
          <ChatHeader />

          <MessageList />
          
          {/* Alerta de Erro */}
          {error && (
            <div className="text-center p-2 bg-destructive/10 text-destructive text-xs rounded-md mx-4 mb-2">
              {error}
            </div>
          )}

          <ChatInput onSend={sendMessage} isLoading={isLoading} onOpenVoice={() => setIsVoiceOpen(true)} />
        </div>
      </div>
      
      {/* Widget de Voz (Gemini Live Overlay) */}
      <MayraVoiceWidget isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />

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
