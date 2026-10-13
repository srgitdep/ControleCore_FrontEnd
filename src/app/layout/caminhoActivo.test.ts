import { describe, expect, it } from 'vitest';
import { caminhoActivo } from './caminhoActivo';

const MENU = ['/dashboard', '/stock', '/compras', '/compras/necessidades', '/requisicoes'];

describe('caminhoActivo', () => {
  it('🔴 /compras/necessidades acende só «Necessidades», não também «Compras»', () => {
    expect(caminhoActivo('/compras/necessidades', MENU)).toBe('/compras/necessidades');
  });

  it('uma página dentro de Necessidades continua a acendê-la', () => {
    expect(caminhoActivo('/compras/necessidades/abc', MENU)).toBe('/compras/necessidades');
  });

  it('/compras e as suas páginas acendem «Compras»', () => {
    expect(caminhoActivo('/compras', MENU)).toBe('/compras');
    expect(caminhoActivo('/compras/ordens/1', MENU)).toBe('/compras');
  });

  it('um prefixo que não acaba num segmento não conta (/stock-x não é /stock)', () => {
    expect(caminhoActivo('/stock-x', MENU)).toBeUndefined();
  });

  it('uma página fora do menu não acende nada', () => {
    expect(caminhoActivo('/perfil', MENU)).toBeUndefined();
  });
});
