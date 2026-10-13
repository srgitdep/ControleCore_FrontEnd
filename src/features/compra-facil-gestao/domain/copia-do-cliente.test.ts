import { describe, expect, it } from 'vitest';
import { diferencasDaCopia, ligacaoAoMapa } from './copia-do-cliente';

const base = {
  cliente: { id: 'c1', nome: 'Ana Silva', telefone: '841111111', email: 'ana@x.mz', nuit: '123', conta: null, comprasOnline: { pedidos: 1, total: 10, ultimoPedidoEm: null } },
  clienteNome: 'Ana Silva',
  clienteTelefone: '841111111',
  clienteEmail: 'ana@x.mz',
  clienteNuit: '123',
  snapshotAproximado: false,
};

describe('diferencasDaCopia', () => {
  it('sem alterações, nada a assinalar', () => {
    expect(diferencasDaCopia(base)).toEqual([]);
  });

  it('🔴 o telefone mudou desde o pedido: mostra o que foi registado e o que é hoje', () => {
    const d = diferencasDaCopia({ ...base, clienteTelefone: '842222222' });

    expect(d).toEqual([{ campo: 'telefone', registado: '842222222', actual: '841111111' }]);
  });

  it('ignora diferenças de maiúsculas e espaços (não é uma mudança)', () => {
    expect(diferencasDaCopia({ ...base, clienteEmail: '  ANA@x.mz ' })).toEqual([]);
  });

  it('um campo que o cliente não deu na altura não é uma diferença', () => {
    expect(diferencasDaCopia({ ...base, clienteNuit: null, cliente: { ...base.cliente, nuit: '999' } })).toEqual([]);
  });

  it('se entretanto apagou o campo, o actual vem nulo', () => {
    const d = diferencasDaCopia({ ...base, cliente: { ...base.cliente, email: null } });

    expect(d).toEqual([{ campo: 'email', registado: 'ana@x.mz', actual: null }]);
  });

  it('🔴 pedido anterior à cópia (aproximado): nada a comparar, a cópia saiu do cliente de hoje', () => {
    expect(diferencasDaCopia({ ...base, snapshotAproximado: true, clienteTelefone: '842222222' })).toEqual([]);
  });
});

describe('ligacaoAoMapa', () => {
  it('com coordenadas, devolve a ligação', () => {
    expect(ligacaoAoMapa({ latitude: -25.96, longitude: 32.58 })).toBe('https://www.google.com/maps?q=-25.96,32.58');
  });

  it('sem coordenadas, nada', () => {
    expect(ligacaoAoMapa({})).toBeNull();
    expect(ligacaoAoMapa(null)).toBeNull();
  });
});
