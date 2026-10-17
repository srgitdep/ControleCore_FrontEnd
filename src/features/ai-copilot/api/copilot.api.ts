import { api } from '@/shared/config';
import { enderecoDoSocket } from '@/shared/config/enderecoSocket';
import { idiomaActivo } from '@/i18n';
import { lerEventosSse } from '@/shared/utils/sse';

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
  /** A resposta ainda está a ser escrita pelo modelo (stream em curso). */
  aEmitir?: boolean;
}

export interface ChatResponse {
  reply: string;
}

/**
 * Em que ponto do trabalho a Mayra está. Só códigos: as frases vivem nas traduções
 * (`copiloto.progresso.*`), e o servidor nunca envia nomes de ferramentas.
 */
export type FaseProgresso = 'entender' | 'consultar' | 'ler' | 'interpretar' | 'responder';

export type AreaMayra =
  | 'stock'
  | 'vendas'
  | 'financas'
  | 'clientes'
  | 'equipa'
  | 'compras'
  | 'mercado'
  | 'auditoria'
  | 'empresa'
  | 'dados';

export interface PassoProgresso {
  fase: FaseProgresso;
  area?: AreaMayra;
}

/**
 * Envia o histórico do chat para o assistente de IA.
 * POST /copilot/chat
 */
export const sendChatMessageApi = async (messages: ChatMessage[], sessionId?: string, currentModule?: string) => {
  const { data } = await api.post('/copilot/chat', { messages, sessionId, currentModule });
  return data;
};

export interface GanchosDoStream {
  onProgresso: (passo: PassoProgresso) => void;
  onTexto: (pedaco: string) => void;
  /** O texto já recebido afinal precedia um pedido de ferramenta: deve ser apagado. */
  onTextoReiniciado: () => void;
}

/** Falha do stream **antes** de chegar qualquer evento: o chamador pode tentar o `/chat`. */
export class StreamIndisponivel extends Error {}

/**
 * Envia o histórico e acompanha a Mayra em Server-Sent Events.
 * POST /copilot/chat/stream — devolve o mesmo corpo que `/copilot/chat` (`{ reply, sessionId }`).
 *
 * ## Porque não usa a instância `api`
 *
 * O axios não lê streams no browser, e o pedido tem de ir **directo à API**: os `rewrites`
 * da Vercel guardam a resposta toda e entregam-na de uma vez no fim, o que mataria o ponto
 * de a ver chegar. É o mesmo problema do WebSocket da voz, e a solução é a mesma: pede-se
 * por REST (que passa pela Vercel e leva o cookie) um token curto, e entrega-se no
 * `Authorization`, já que os cookies da Vercel não seguem para outro domínio.
 */
export async function streamChatApi(
  messages: ChatMessage[],
  sessionId: string | undefined,
  currentModule: string | undefined,
  ganchos: GanchosDoStream,
): Promise<{ reply: string; sessionId: string }> {
  let resposta: Response;
  try {
    const { data } = await api.get<{ token: string }>('/copilot/voice-token');
    const { endereco } = enderecoDoSocket();

    resposta = await fetch(`${endereco}/api/v1/copilot/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        Authorization: `Bearer ${data.token}`,
        'Accept-Language': idiomaActivo(),
      },
      body: JSON.stringify({ messages, sessionId, currentModule }),
    });
  } catch (erro) {
    throw new StreamIndisponivel(erro instanceof Error ? erro.message : 'stream indisponível');
  }

  if (!resposta.ok || !resposta.body) {
    throw new StreamIndisponivel(`HTTP ${resposta.status}`);
  }

  let fim: { reply: string; sessionId: string } | null = null;
  for await (const { evento, dados } of lerEventosSse(resposta.body)) {
    if (evento === 'progresso') ganchos.onProgresso(dados as PassoProgresso);
    else if (evento === 'texto') ganchos.onTexto((dados as { pedaco: string }).pedaco);
    else if (evento === 'texto_reiniciar') ganchos.onTextoReiniciado();
    else if (evento === 'fim') fim = dados as { reply: string; sessionId: string };
  }

  if (!fim) throw new Error('A ligação fechou antes de a resposta terminar.');
  return fim;
}

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
