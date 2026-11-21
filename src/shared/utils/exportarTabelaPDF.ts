import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportarTabelaPDFOpcoes {
  /** O título no topo da página. */
  titulo: string;
  /** O cabeçalho da tabela, uma célula por coluna. */
  colunas: string[];
  /** Uma linha por registo, as células na mesma ordem de `colunas`. */
  linhas: (string | number)[][];
  /** O nome do ficheiro, sem extensão — `.pdf` é acrescentado aqui. */
  nomeFicheiro: string;
  /** Texto sob o título (por omissão, "Gerado em <data>"). */
  subtitulo?: string;
  /** `[r, g, b]` do cabeçalho da tabela. Por omissão, azul (`#2563eb`). */
  corCabecalho?: [number, number, number];
}

/**
 * Exporta uma lista para PDF — tabela com cabeçalho, título e data de geração. Único
 * sítio com `jsPDF`/`autoTable`: antes disto, cada ecrã (Histórico, Empresas,
 * Utilizadores, Caixas) escrevia a sua própria cópia do mesmo código.
 *
 * Deliberadamente simples (uma tabela, uma página contínua): ecrãs com necessidades
 * próprias de layout (como o recibo da venda, com o cabeçalho da loja) continuam a
 * construir o `jsPDF` directamente — isto serve as listas, não substitui tudo.
 */
export function exportarTabelaPDF({
  titulo,
  colunas,
  linhas,
  nomeFicheiro,
  subtitulo,
  corCabecalho = [37, 99, 235],
}: ExportarTabelaPDFOpcoes): void {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(titulo, 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(subtitulo ?? `Gerado em ${new Date().toLocaleString('pt-PT')}`, 14, 28);

  autoTable(doc, {
    startY: 35,
    head: [colunas],
    body: linhas,
    theme: 'grid',
    headStyles: { fillColor: corCabecalho },
  });

  doc.save(`${nomeFicheiro}_${Date.now()}.pdf`);
}
