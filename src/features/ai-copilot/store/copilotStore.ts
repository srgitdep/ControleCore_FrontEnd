import { create } from 'zustand';
import { sendChatMessageApi } from '../api/copilot.api';
import type { ChatMessage } from '../api/copilot.api';

interface CopilotState {
  isOpen: boolean;
  isExpanded: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;

  toggleOpen: () => void;
  setOpen: (isOpen: boolean) => void;
  toggleExpanded: () => void;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

// Mensagem de boas-vindas padrão (não enviada para o backend como histórico real)
const WELCOME_MESSAGE: ChatMessage = {
  role: 'model',
  content: 'Olá! Sou a Mayra, o seu assistente inteligente ControlCore. Como posso ajudar na gestão da sua empresa hoje?',
};

export const useCopilotStore = create<CopilotState>((set, get) => ({
  isOpen: false,
  isExpanded: false,
  messages: [WELCOME_MESSAGE],
  isLoading: false,
  error: null,

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen, isExpanded: false })),
  setOpen: (isOpen) => set({ isOpen, isExpanded: false }),
  toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),

  sendMessage: async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: content.trim() };
    
    // Optimistic UI update
    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const { messages } = get();
      
      // Filtra o histórico para enviar à API (remove a mensagem de boas-vindas se for a única da IA e for o primeiro turno real)
      const historyToAPI = messages.filter((msg, idx) => {
         // Opcional: ignorar a mensagem hardcoded de boas-vindas para não poluir o contexto
         if (idx === 0 && msg === WELCOME_MESSAGE) return false;
         return true;
      });

      const response = await sendChatMessageApi(historyToAPI);

      const modelMessage: ChatMessage = {
        role: 'model',
        content: response.reply,
      };

      set((state) => ({
        messages: [...state.messages, modelMessage],
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Ocorreu um erro de comunicação com a IA.',
        isLoading: false,
      });
    }
  },

  clearMessages: () => set({ messages: [WELCOME_MESSAGE], error: null }),
}));
