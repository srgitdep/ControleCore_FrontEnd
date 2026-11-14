import { beforeEach, describe, expect, it, vi } from 'vitest';

// O store importa `@/main` (que monta a aplicação) só para limpar a cache ao sair.
vi.mock('@/main', () => ({ queryClient: { clear: vi.fn() } }));

const armazem = new Map<string, string>();
vi.stubGlobal('sessionStorage', {
  getItem: (k: string) => armazem.get(k) ?? null,
  setItem: (k: string, v: string) => void armazem.set(k, v),
  removeItem: (k: string) => void armazem.delete(k),
});
// Antes do import: o store regista aqui o ouvinte do evento do axios.
// O `axios.ts` deduz o endereço da API de `window.location` ao ser importado.
const janela = Object.assign(new EventTarget(), {
  location: { protocol: 'http:', hostname: 'localhost', origin: 'http://localhost' },
});
vi.stubGlobal('window', janela);

const { useAuthStore } = await import('./useAuthStore');
const { EVENTO_MUDAR_SENHA } = await import('@/shared/config/axios');

const utilizador = (mudarSenha?: boolean) => ({
  id: 'u1',
  name: 'Ana',
  code: 'U001',
  email: 'ana@exemplo.co.mz',
  role: 'ADMIN' as const,
  mudarSenha,
});

describe('useAuthStore — primeiro acesso', () => {
  beforeEach(() => {
    armazem.clear();
    useAuthStore.setState({ user: utilizador(true), isAuthenticated: true });
  });

  it('concluirPrimeiroAcesso tira a marca e grava-a, para a sessão restaurada não voltar a pedir', () => {
    useAuthStore.getState().concluirPrimeiroAcesso();

    expect(useAuthStore.getState().user?.mudarSenha).toBe(false);
    expect(JSON.parse(armazem.get('authUser') ?? '{}')).toMatchObject({ mudarSenha: false });
  });

  it('exigirMudancaDeSenha volta a pôr a marca (senha reposta a meio da sessão)', () => {
    useAuthStore.setState({ user: utilizador(false) });

    useAuthStore.getState().exigirMudancaDeSenha();

    expect(useAuthStore.getState().user?.mudarSenha).toBe(true);
    expect(JSON.parse(armazem.get('authUser') ?? '{}')).toMatchObject({ mudarSenha: true });
  });

  it('o 403 `auth.guard.mudar_senha` do axios (evento) leva a sessão ao ecrã de mudar a senha', () => {
    useAuthStore.setState({ user: utilizador(undefined) });

    janela.dispatchEvent(new Event(EVENTO_MUDAR_SENHA));

    expect(useAuthStore.getState().user?.mudarSenha).toBe(true);
  });

  it('sem sessão não faz nada', () => {
    useAuthStore.setState({ user: null, isAuthenticated: false });

    useAuthStore.getState().exigirMudancaDeSenha();

    expect(useAuthStore.getState().user).toBeNull();
    expect(armazem.has('authUser')).toBe(false);
  });
});
