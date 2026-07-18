import { api } from '@/api/axios';

export interface HitlActionPayload {
  type: 'HITL_ACTION';
  action: string;
  payload: any;
  message: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  hitlAction?: HitlActionPayload;
}

export interface ChatResponse {
  reply: string;
}

/**
 * Envia o histórico do chat para o assistente de IA.
 * POST /copilot/chat
 */
export const sendChatMessageApi = async (messages: ChatMessage[], sessionId?: string, currentModule?: string) => {
  const { data } = await api.post('/copilot/chat', { messages, sessionId, currentModule });
  return data;
};

export const getCopilotSessionsApi = async () => {
  const { data } = await api.get('/copilot/sessions');
  return data;
};

export const getCopilotSessionMessagesApi = async (sessionId: string) => {
  const { data } = await api.get(`/copilot/sessions/${sessionId}`);
  return data;
};

/**
 * Executa uma ação HITL (Human-In-The-Loop) confirmada.
 * POST /copilot/action/execute
 */
export const executeHitlActionApi = (action: string, payload: any) =>
  api.post<ChatResponse>('/copilot/action/execute', { action, payload }).then((r) => r.data);
