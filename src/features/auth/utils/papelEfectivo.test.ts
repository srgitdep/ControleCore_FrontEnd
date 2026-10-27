import { describe, expect, it } from 'vitest';
import { papelEfectivo } from './papelEfectivo';

const sessao = { sessaoId: 's1' };

describe('papelEfectivo', () => {
  it('em suporte, o Super Admin é ADMIN da empresa', () => {
    expect(papelEfectivo({ role: 'SUPER_ADMIN' }, sessao)).toBe('ADMIN');
  });

  it('fora do suporte, mantém o seu papel', () => {
    expect(papelEfectivo({ role: 'SUPER_ADMIN' }, null)).toBe('SUPER_ADMIN');
    expect(papelEfectivo({ role: 'CASHIER' }, null)).toBe('CASHIER');
  });

  it('uma sessão de suporte não promove quem não é Super Admin', () => {
    expect(papelEfectivo({ role: 'CASHIER' }, sessao)).toBe('CASHIER');
    expect(papelEfectivo({ role: 'MANAGER' }, sessao)).toBe('MANAGER');
  });

  it('sem utilizador, não há papel', () => {
    expect(papelEfectivo(null, sessao)).toBeUndefined();
  });
});
