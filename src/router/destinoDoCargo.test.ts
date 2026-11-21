import { describe, expect, it } from 'vitest';
import { destinoDoCargo } from './destinoDoCargo';

describe('destinoDoCargo', () => {
  // O painel só aceita SUPER_ADMIN, ADMIN e MANAGER (ver `router/index.tsx`). Mandar para
  // lá quem não entra significa um aviso vermelho de «sem permissão» antes do ecrã certo.
  it('o Operador de Caixa vai para o Ponto de Venda, não para o painel', () => {
    expect(destinoDoCargo('CASHIER')).toBe('/vendas');
  });

  it('o Armazenista vai para os produtos', () => {
    expect(destinoDoCargo('STOCK_KEEPER')).toBe('/produtos');
  });

  it('o Funcionário Geral vai para os produtos', () => {
    expect(destinoDoCargo('USER')).toBe('/produtos');
  });

  it.each(['SUPER_ADMIN', 'ADMIN', 'MANAGER'])(
    'o %s vai para o painel, que o aceita',
    (role) => {
      expect(destinoDoCargo(role)).toBe('/dashboard');
    },
  );

  it('sem cargo, fica o painel — o ProtectedRoute decide a partir daí', () => {
    expect(destinoDoCargo(undefined)).toBe('/dashboard');
  });
});
