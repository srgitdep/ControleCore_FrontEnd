import { describe, expect, it, vi } from 'vitest';

const textMock = vi.fn();
const saveMock = vi.fn();
const autoTableMock = vi.fn();

vi.mock('jspdf', () => ({
  default: vi.fn(function JsPdfMock(this: any) {
    this.setFontSize = vi.fn();
    this.setTextColor = vi.fn();
    this.text = textMock;
    this.save = saveMock;
  }),
}));

vi.mock('jspdf-autotable', () => ({
  default: autoTableMock,
}));

const { exportarTabelaPDF } = await import('./exportarTabelaPDF');

describe('exportarTabelaPDF', () => {
  it('escreve o título, passa as colunas e linhas à tabela, e grava com o nome e um sufixo', () => {
    exportarTabelaPDF({
      titulo: 'Catálogo de Produtos',
      colunas: ['Produto', 'Preço'],
      linhas: [['Arroz', '100.00 MT']],
      nomeFicheiro: 'produtos',
    });

    expect(textMock).toHaveBeenCalledWith('Catálogo de Produtos', 14, 20);
    expect(autoTableMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        head: [['Produto', 'Preço']],
        body: [['Arroz', '100.00 MT']],
      }),
    );
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(saveMock.mock.calls[0][0]).toMatch(/^produtos_\d+\.pdf$/);
  });

  it('usa a cor por omissão quando não se indica corCabecalho', () => {
    exportarTabelaPDF({
      titulo: 'X',
      colunas: ['A'],
      linhas: [['1']],
      nomeFicheiro: 'x',
    });

    expect(autoTableMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ headStyles: { fillColor: [37, 99, 235] } }),
    );
  });
});
