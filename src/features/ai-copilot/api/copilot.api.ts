import { api } from '@/api/axios';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ChatResponse {
  reply: string;
}

/**
 * Envia o histórico do chat para o assistente de IA.
 * POST /copilot/chat
 */
export const sendChatMessageApi = (messages: ChatMessage[]) =>
  api.post<ChatResponse>('/copilot/chat', { messages }).then((r) => r.data);
