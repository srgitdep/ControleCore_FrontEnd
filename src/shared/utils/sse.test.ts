import { describe, expect, it } from 'vitest';
import { lerEventosSse } from './sse';

/** Um corpo de resposta que entrega as fatias dadas, uma a uma. */
function corpo(...fatias: (string | Uint8Array)[]): ReadableStream<Uint8Array> {
  const codificador = new TextEncoder();
  return new ReadableStream({
    start(controlo) {
      for (const f of fatias) controlo.enqueue(typeof f === 'string' ? codificador.encode(f) : f);
      controlo.close();
    },
  });
}

async function todos(stream: ReadableStream<Uint8Array>) {
  const eventos = [];
  for await (const e of lerEventosSse(stream)) eventos.push(e);
  return eventos;
}

describe('lerEventosSse', () => {
  it('lê eventos com nome e JSON', async () => {
    const eventos = await todos(
      corpo('event: progresso\ndata: {"fase":"entender"}\n\nevent: texto\ndata: {"pedaco":"Olá"}\n\n'),
    );
    expect(eventos).toEqual([
      { evento: 'progresso', dados: { fase: 'entender' } },
      { evento: 'texto', dados: { pedaco: 'Olá' } },
    ]);
  });

  it('junta um evento cortado entre duas fatias', async () => {
    const eventos = await todos(corpo('event: tex', 'to\ndata: {"pedaco":', '"a"}\n', '\n'));
    expect(eventos).toEqual([{ evento: 'texto', dados: { pedaco: 'a' } }]);
  });

  it('não parte um carácter UTF-8 cortado a meio', async () => {
    const bytes = new TextEncoder().encode('event: texto\ndata: {"pedaco":"ção"}\n\n');
    const corte = bytes.indexOf(0xc3) + 1; // entre os dois bytes do «ç»
    const eventos = await todos(corpo(bytes.slice(0, corte), bytes.slice(corte)));
    expect(eventos).toEqual([{ evento: 'texto', dados: { pedaco: 'ção' } }]);
  });

  it('ignora os comentários de batimento e aceita CRLF', async () => {
    const eventos = await todos(corpo(': a trabalhar\r\n\r\nevent: fim\r\ndata: {"ok":true}\r\n\r\n'));
    expect(eventos).toEqual([{ evento: 'fim', dados: { ok: true } }]);
  });

  it('um evento sem terminador não é entregue', async () => {
    expect(await todos(corpo('event: texto\ndata: {"pedaco":"a"}\n'))).toEqual([]);
  });
});
