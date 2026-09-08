import type { ReactNode } from 'react';
import { cn } from '@/shared/utils';

/**
 * A faixa no topo de uma página: o que há para saber, e o que há para fazer.
 *
 * ## O que substitui, e porquê
 *
 * Cada página trazia o seu próprio `<h1>` com o nome da secção — «Armazéns», «Compras»,
 * «Lojas & Caixas» — e uma linha a descrevê-la. Mas o cabeçalho da aplicação já mostra
 * esse nome, em todos os tamanhos de ecrã: no telemóvel ocupa a barra toda, no
 * computador fica ao lado do menu lateral. O nome aparecia duas vezes, a poucos pixels
 * de distância.
 *
 * Num telemóvel isso custava caro. Entre a barra da aplicação, o título repetido e a
 * descrição, o conteúdo só começava perto de um terço do ecrã — e o que se vai ali
 * fazer é ver dados e carregar em botões.
 *
 * ## O que **não** desapareceu
 *
 * Nem tudo o que vivia nesses cabeçalhos era decoração. «2 armazéns em 1 loja» e
 * «Total: 12» são dados, não rótulos, e passaram para `resumo` — uma linha discreta que
 * continua a dizê-lo sem repetir o nome da página. Apagar isso a par do título teria
 * sido perder informação a pretexto de arrumar.
 *
 * As descrições genéricas («Pedidos, receções de mercadoria e fornecedores») saíram: os
 * separadores logo abaixo dizem o mesmo, e melhor, porque se pode carregar neles.
 */
export interface BarraDaPaginaProps {
  /**
   * Uma linha curta de contexto: contagens, estado, o período em análise. Só o que a
   * página não mostra já noutro sítio.
   */
  resumo?: ReactNode;
  /** Os botões da página. Alinhados à direita no computador, em baixo no telemóvel. */
  acoes?: ReactNode;
  className?: string;
}

export function BarraDaPagina({ resumo, acoes, className }: BarraDaPaginaProps) {
  // Sem nada a dizer nem nada a fazer, não se ocupa espaço nenhum. Um contentor vazio
  // com margem é exactamente o género de espaço morto que esta mudança veio remover.
  if (!resumo && !acoes) return null;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3',
        // O resumo à esquerda e as acções à direita quando há os dois; com um só, ele
        // ocupa o seu lado natural em vez de ficar centrado por acidente.
        resumo && acoes ? 'justify-between' : acoes ? 'justify-end' : 'justify-start',
        className,
      )}
    >
      {resumo && <p className="text-sm text-slate-500">{resumo}</p>}
      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </div>
  );
}
