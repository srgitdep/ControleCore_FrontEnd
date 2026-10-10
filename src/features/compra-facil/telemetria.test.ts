import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { obterSessaoAnonima, registarProcura, telemetriaActiva } from './telemetria';

const LOJA = '22222222-2222-4222-8222-222222222222';

// O ambiente de teste é `node`: não há `sessionStorage`, simula-se um.
function armazemFalso(falha = false) {
  const dados = new Map<string, string>();
  return {
    getItem: (k: string) => {
      if (falha) throw new Error('bloqueado');
      return dados.get(k) ?? null;
    },
    setItem: (k: string, v: string) => {
      if (falha) throw new Error('bloqueado');
      dados.set(k, v);
    },
  };
}

describe('telemetria da procura online', () => {
  const fetchFalso = vi.fn();

  beforeEach(() => {
    fetchFalso.mockReset();
    fetchFalso.mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchFalso);
    vi.stubGlobal('sessionStorage', armazemFalso());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('🔴 desligada por omissão: não envia nada', () => {
    vi.stubEnv('VITE_TELEMETRIA_PROCURA', '');

    registarProcura({ tipo: 'CHECKOUT_INICIADO', lojaId: LOJA });

    expect(telemetriaActiva()).toBe(false);
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it('só liga com o valor exacto "true"', () => {
    vi.stubEnv('VITE_TELEMETRIA_PROCURA', '1');

    registarProcura({ tipo: 'CHECKOUT_INICIADO', lojaId: LOJA });

    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it('ligada: envia o evento com a sessão anónima e sem mais nada', () => {
    vi.stubEnv('VITE_TELEMETRIA_PROCURA', 'true');

    registarProcura({ tipo: 'PESQUISA', lojaId: LOJA, termo: 'arroz' });

    expect(fetchFalso).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFalso.mock.calls[0];
    expect(url).toMatch(/\/commerce\/telemetria$/);
    expect(init.method).toBe('POST');
    expect(init.keepalive).toBe(true);
    expect(init.credentials).toBeUndefined(); // sem cookies
    expect(JSON.parse(init.body)).toEqual({
      sessaoId: obterSessaoAnonima(),
      eventos: [{ tipo: 'PESQUISA', lojaId: LOJA, termo: 'arroz' }],
    });
  });

  it('a sessão anónima é um UUID e mantém-se durante a visita', () => {
    const a = obterSessaoAnonima();

    expect(a).toMatch(/^[0-9a-f-]{36}$/);
    expect(obterSessaoAnonima()).toBe(a);
  });

  it('🔴 falhas nunca chegam ao utilizador: rede em baixo e fetch a lançar', () => {
    vi.stubEnv('VITE_TELEMETRIA_PROCURA', 'true');

    fetchFalso.mockRejectedValue(new Error('rede'));
    expect(() => registarProcura({ tipo: 'CHECKOUT_INICIADO', lojaId: LOJA })).not.toThrow();

    fetchFalso.mockImplementation(() => {
      throw new Error('fetch partido');
    });
    expect(() => registarProcura({ tipo: 'CHECKOUT_INICIADO', lojaId: LOJA })).not.toThrow();
  });

  it('sem sessionStorage (modo privado) não falha', () => {
    vi.stubEnv('VITE_TELEMETRIA_PROCURA', 'true');
    vi.stubGlobal('sessionStorage', armazemFalso(true));

    expect(() => registarProcura({ tipo: 'CHECKOUT_INICIADO', lojaId: LOJA })).not.toThrow();
    expect(obterSessaoAnonima()).toMatch(/^[0-9a-f-]{36}$/);

  });
});
