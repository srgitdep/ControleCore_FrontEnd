import React, { useEffect } from 'react';
import { useCopilotStore } from '../store/copilotStore';
import { useUIStore } from '@/store/useUIStore';

// Modulares Components
import { HistoryPanel } from './history/HistoryPanel';
import { ChatHeader } from './chat/ChatHeader';
import { MessageList } from './chat/MessageList';
import { ChatInput } from './chat/ChatInput';

export function CopilotWidget() {
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
  
  const { isSidebarCollapsed } = useUIStore();

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen, loadSessions]);

  return (
    <>
      {/* Painel do Chat (Modern Floating Window) */}
      <div
        className={`fixed z-[100] bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] border border-slate-200 flex flex-row transition-all duration-300 ease-out origin-bottom-right overflow-hidden ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
        } ${
          isExpanded
            ? isSidebarCollapsed 
                ? 'inset-4 sm:inset-y-6 sm:right-6 sm:left-[calc(5rem+1.5rem)] w-auto h-auto'
                : 'inset-4 sm:inset-y-6 sm:right-6 lg:left-[calc(16rem+1.5rem)] sm:left-[calc(16rem+1.5rem)] w-auto h-auto'
            : isHistoryOpen
                ? 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100%-2rem)] sm:w-[660px] h-[600px] max-h-[calc(100vh-2rem)]'
                : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100%-2rem)] sm:w-[380px] h-[600px] max-h-[calc(100vh-2rem)]'
        }`}
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

          <ChatInput onSend={sendMessage} isLoading={isLoading} />
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
