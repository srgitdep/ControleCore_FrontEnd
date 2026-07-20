import { create } from 'zustand';
import { sendChatMessageApi, executeHitlActionApi, getCopilotSessionsApi, getCopilotSessionMessagesApi } from '../api/copilot.api';
import type { ChatMessage, HitlActionPayload } from '../api/copilot.api';

interface CopilotState {
  isOpen: boolean;
  isExpanded: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  currentSessionId: string | null;
  sessions: any[];
  isHistoryOpen: boolean;

  toggleOpen: () => void;
  setOpen: (isOpen: boolean) => void;
  toggleExpanded: () => void;
  sendMessage: (content: string) => Promise<void>;
  executeAction: (action: string, payload: any) => Promise<void>;
  clearMessages: () => void;
  startNewSession: () => void;
  loadSessions: () => Promise<void>;
  loadSessionMessages: (sessionId: string) => Promise<void>;
  toggleHistory: () => void;
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
  currentSessionId: null,
  sessions: [],
  isHistoryOpen: false,

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen, isExpanded: false, isHistoryOpen: false })),
  setOpen: (isOpen) => set({ isOpen, isExpanded: false, isHistoryOpen: false }),
  toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),
  toggleHistory: () => set((state) => ({ isHistoryOpen: !state.isHistoryOpen })),

  startNewSession: () => {
    set({ messages: [WELCOME_MESSAGE], currentSessionId: null, error: null, isHistoryOpen: false });
  },

  loadSessions: async () => {
    try {
      const data = await getCopilotSessionsApi();
      set({ sessions: data });
    } catch (e) {
      console.error(e);
    }
  },

  loadSessionMessages: async (sessionId: string) => {
    set({ isLoading: true, isHistoryOpen: false });
    try {
      const msgs = await getCopilotSessionMessagesApi(sessionId);
      const mappedMsgs = msgs.map((m: any) => ({
        role: m.role === 'ai' ? 'model' : 'user',
        content: m.content,
        hitlAction: m.hitlAction
      }));
      set({ messages: mappedMsgs, currentSessionId: sessionId, isLoading: false, error: null });
    } catch (e) {
      console.error(e);
      set({ isLoading: false, error: 'Erro ao carregar sessão.' });
    }
  },

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

      let currentModule = typeof window !== 'undefined' ? window.location.pathname : 'Geral';
      if (currentModule.includes('/compras') || currentModule.includes('/fornecedores')) {
        currentModule = 'purchasing';
      } else if (currentModule.includes('/clientes') || currentModule.includes('/crm')) {
        currentModule = 'crm';
      } else if (currentModule.includes('/rh') || currentModule.includes('/funcionarios')) {
        currentModule = 'hr';
      }
      const response = await sendChatMessageApi(historyToAPI, get().currentSessionId || undefined, currentModule);

      if (response.sessionId && !get().currentSessionId) {
        set({ currentSessionId: response.sessionId });
        get().loadSessions(); // Reload sessions to show the new one
      }

      let parsedHitlAction: HitlActionPayload | undefined;
      let finalContent = response.reply;
      try {
        const data = JSON.parse(response.reply);
        if (data && data.type === 'HITL_ACTION') {
          parsedHitlAction = data;
          finalContent = data.message;
        }
      } catch (e) {
        // É texto normal, ignorar parse
      }

      const modelMessage: ChatMessage = {
        role: 'model',
        content: finalContent,
        hitlAction: parsedHitlAction,
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

  executeAction: async (action: string, payload: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await executeHitlActionApi(action, payload);
      
      const successMessage: ChatMessage = {
        role: 'model',
        content: `✅ Sucesso: ${response.reply}`,
      };

      set((state) => ({
        messages: state.messages.map(m => 
          // Limpar a ação do cartão anterior para não aparecerem os botões novamente
          m.hitlAction?.action === action ? { ...m, hitlAction: undefined } : m
        ).concat(successMessage),
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Erro ao executar a ação solicitada.',
        isLoading: false,
      });
    }
  },

  clearMessages: () => set({ messages: [WELCOME_MESSAGE], error: null }),
}));
