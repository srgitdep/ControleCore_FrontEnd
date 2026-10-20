import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  streamChatApi: vi.fn(),
  sendChatMessageApi: vi.fn(),
  executeHitlActionApi: vi.fn(),
  getCopilotSessionsApi: vi.fn().mockResolvedValue([]),
  getCopilotSessionMessagesApi: vi.fn(),
}));

vi.mock('../api/copilot.api', () => ({
  ...api,
  StreamIndisponivel: class StreamIndisponivel extends Error {},
}));

import { StreamIndisponivel } from '../api/copilot.api';
import { useCopilotStore } from './copilotStore';

describe('copilotStore.sendMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getCopilotSessionsApi.mockResolvedValue([]);
    useCopilotStore.getState().startNewSession();
    useCopilotStore.setState({ isLoading: false, passos: [] });
  });

  it('acompanha os passos e o texto em stream, e a resposta final substitui o texto parcial', async () => {
    const vistos: { passos: string[]; aEmitir: boolean }[] = [];
    api.streamChatApi.mockImplementation(async (_m, _s, _c, ganchos) => {
      ganchos.onProgresso({ fase: 'consultar', area: 'stock' });
      ganchos.onProgresso({ fase: 'consultar', area: 'stock' }); // repetido: não duplica
      ganchos.onProgresso({ fase: 'responder' });
      ganchos.onTexto('Tem ');
      ganchos.onTexto('3 produtos.');
      const { passos, messages } = useCopilotStore.getState();
      vistos.push({ passos: passos.map((p) => p.fase), aEmitir: !!messages.at(-1)?.aEmitir });
      return { reply: 'Tem 3 produtos.', sessionId: 's1' };
    });

    await useCopilotStore.getState().sendMessage('Qual é o stock?');

    expect(vistos[0].passos).toEqual(['entender', 'consultar', 'responder']);
    expect(vistos[0].aEmitir).toBe(true);

    const { messages, isLoading, passos, currentSessionId } = useCopilotStore.getState();
    expect(isLoading).toBe(false);
    expect(passos).toEqual([]);
    expect(currentSessionId).toBe('s1');
    expect(messages.filter((m) => m.aEmitir)).toHaveLength(0);
    expect(messages.at(-1)).toMatchObject({ role: 'model', content: 'Tem 3 produtos.' });
  });

  it('apaga o texto parcial quando o servidor manda reiniciar', async () => {
    api.streamChatApi.mockImplementation(async (_m, _s, _c, ganchos) => {
      ganchos.onTexto('Vou ver...');
      ganchos.onTextoReiniciado();
      expect(useCopilotStore.getState().messages.some((m) => m.aEmitir)).toBe(false);
      return { reply: 'Vendas: 10.', sessionId: 's1' };
    });

    await useCopilotStore.getState().sendMessage('Vendas?');

    expect(useCopilotStore.getState().messages.at(-1)?.content).toBe('Vendas: 10.');
  });

  it('se o stream não estiver disponível, responde pelo /chat de sempre', async () => {
    api.streamChatApi.mockRejectedValue(new StreamIndisponivel('HTTP 502'));
    api.sendChatMessageApi.mockResolvedValue({ reply: 'Olá!', sessionId: 's2' });

    await useCopilotStore.getState().sendMessage('Olá');

    expect(api.sendChatMessageApi).toHaveBeenCalledTimes(1);
    expect(useCopilotStore.getState().messages.at(-1)?.content).toBe('Olá!');
    expect(useCopilotStore.getState().error).toBeNull();
  });

  it('um cartão HITL chega no fim e fica como acção, não como texto', async () => {
    const cartao = { type: 'HITL_ACTION', action: 'UPDATE_PRODUCT_PRICE', payload: {}, message: 'Confirma?' };
    api.streamChatApi.mockResolvedValue({ reply: JSON.stringify(cartao), sessionId: 's3' });

    await useCopilotStore.getState().sendMessage('Muda o preço');

    const ultima = useCopilotStore.getState().messages.at(-1);
    expect(ultima?.content).toBe('Confirma?');
    expect(ultima?.hitlAction?.action).toBe('UPDATE_PRODUCT_PRICE');
  });

  it('uma falha a meio da resposta deixa o erro e não uma resposta cortada', async () => {
    api.streamChatApi.mockImplementation(async (_m, _s, _c, ganchos) => {
      ganchos.onTexto('Tem 3 pro');
      throw new Error('ligação fechada');
    });

    await useCopilotStore.getState().sendMessage('Stock?');

    const { messages, error, isLoading } = useCopilotStore.getState();
    expect(messages.some((m) => m.aEmitir)).toBe(false);
    // Sem o i18n inicializado nos testes a mensagem vem vazia; o que importa é ter sido posta.
    expect(error).not.toBeNull();
    expect(isLoading).toBe(false);
    expect(api.sendChatMessageApi).not.toHaveBeenCalled();
  });
});
