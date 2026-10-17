export interface EventoSse {
  evento: string;
  dados: unknown;
}

/**
 * Lê uma resposta `text/event-stream` e devolve os seus eventos à medida que chegam.
 *
 * Existe porque `EventSource` só faz GET e não aceita cabeçalhos nem corpo — e o pedido
 * da Mayra é um POST com o histórico e um `Authorization`. Faz o parse à mão sobre o corpo
 * de um `fetch`.
 *
 * Um evento acaba numa linha em branco, mas os bytes chegam em fatias arbitrárias: uma
 * fatia pode cortar um evento (ou até um carácter UTF-8) a meio, por isso o resto fica em
 * memória até a fatia seguinte o completar. Comentários (`: ...`, os batimentos do
 * servidor) são ignorados.
 */
export async function* lerEventosSse(corpo: ReadableStream<Uint8Array>): AsyncGenerator<EventoSse> {
  const leitor = corpo.getReader();
  const descodificador = new TextDecoder();
  let pendente = '';

  try {
    for (;;) {
      const { done, value } = await leitor.read();
      if (done) break;

      // `stream: true` guarda os bytes de um carácter cortado entre duas fatias.
      pendente += descodificador.decode(value, { stream: true });
      pendente = pendente.replace(/\r\n/g, '\n');

      let fim: number;
      while ((fim = pendente.indexOf('\n\n')) !== -1) {
        const bloco = pendente.slice(0, fim);
        pendente = pendente.slice(fim + 2);

        const evento = eventoDoBloco(bloco);
        if (evento) yield evento;
      }
    }
  } finally {
    leitor.releaseLock();
  }
}

function eventoDoBloco(bloco: string): EventoSse | null {
  let nome = 'message';
  const linhasDeDados: string[] = [];

  for (const linha of bloco.split('\n')) {
    if (linha.startsWith('event:')) nome = linha.slice(6).trim();
    else if (linha.startsWith('data:')) linhasDeDados.push(linha.slice(5).replace(/^ /, ''));
  }

  if (linhasDeDados.length === 0) return null;

  const texto = linhasDeDados.join('\n');
  try {
    return { evento: nome, dados: JSON.parse(texto) };
  } catch {
    return { evento: nome, dados: texto };
  }
}
