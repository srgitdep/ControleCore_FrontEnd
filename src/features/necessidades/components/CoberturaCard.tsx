import { ChevronRight } from 'lucide-react';
import { Card } from '@/shared/ui';
import type { KpisNecessidades } from '../types/necessidade.types';

interface CoberturaCardProps {
  kpis: KpisNecessidades | undefined;
  isLoading?: boolean;
}

/**
 * O cartão de Cobertura de Stock — DT01 9.
 *
 * ## De onde vêm os três números
 *
 * O DT01 9 pede "Dentro da meta / Em atenção / Em risco" como síntese geral de cobertura
 * — um conceito mais amplo do que a fila de necessidades (que só mostra o que já exige
 * decisão). Não existe ainda um endpoint de cobertura agregada sobre o catálogo inteiro;
 * construí-lo exigiria correr `saude-stock.ts` sobre todos os produtos, activos ou não
 * na fila, o que é trabalho da Fase 4 (analytics).
 *
 * Enquanto isso não existe, a aproximação honesta é reaproveitar `porRecomendacao`, que
 * o backend já calcula: **Em risco** são as classificações que pedem decisão urgente
 * (Comprar, Transferir), **Em atenção** as que só pedem acompanhamento (Aguardar, Stock
 * parado, Excesso), e **Dentro da meta** é o resto do catálogo, fora da fila. É uma
 * leitura diferente da que o DT01 9 imagina — mais estreita — e fica dito aqui e não
 * escondido atrás de um número que pareça mais do que é.
 *
 * "Ver detalhes" fica desactivado até essa página existir: apontar para um ecrã vazio
 * seria pior do que não ter o botão.
 */
export function CoberturaCard({ kpis, isLoading }: CoberturaCardProps) {
  if (isLoading || !kpis) {
    return (
      <Card className="animate-pulse">
        <div className="h-4 w-32 rounded bg-slate-100" />
        <div className="mx-auto mt-4 h-28 w-28 rounded-full bg-slate-100" />
      </Card>
    );
  }

  const emRisco = kpis.porRecomendacao.COMPRAR + kpis.porRecomendacao.TRANSFERIR;
  const emAtencao =
    kpis.porRecomendacao.AGUARDAR + kpis.porRecomendacao.STOCK_PARADO + kpis.porRecomendacao.EXCESSO;
  const totalNaFila = emRisco + emAtencao + kpis.porRecomendacao.NAO_COMPRAR;

  // Sem o tamanho do catálogo (fora do que este endpoint devolve), "dentro da meta" não
  // é calculável como percentagem do total — só o peso relativo dentro da fila.
  const totalComparavel = totalNaFila || 1;
  const percentagemRisco = Math.round((emRisco / totalComparavel) * 100);
  const percentagemAtencao = Math.round((emAtencao / totalComparavel) * 100);

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Cobertura da fila de necessidades</p>
        <button
          type="button"
          disabled
          title="Análise detalhada de cobertura — por vir"
          className="flex items-center gap-0.5 text-xs font-medium text-slate-300"
        >
          Ver detalhes <ChevronRight size={14} />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div
          className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(#ef4444 0% ${percentagemRisco}%, #f59e0b ${percentagemRisco}% ${
              percentagemRisco + percentagemAtencao
            }%, #10b981 ${percentagemRisco + percentagemAtencao}% 100%)`,
          }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-lg font-bold text-slate-800">
            {totalNaFila}
          </div>
        </div>

        <div className="space-y-1.5 text-sm">
          <Legenda cor="bg-rose-500" label="Em risco (comprar/transferir)" valor={emRisco} />
          <Legenda cor="bg-amber-500" label="Em atenção" valor={emAtencao} />
          <Legenda cor="bg-slate-400" label="Não comprar" valor={kpis.porRecomendacao.NAO_COMPRAR} />
        </div>
      </div>
    </Card>
  );
}

function Legenda({ cor, label, valor }: { cor: string; label: string; valor: number }) {
  return (
    <div className="flex items-center gap-2 text-slate-600">
      <span className={`h-2 w-2 shrink-0 rounded-full ${cor}`} />
      <span>{label}</span>
      <span className="ml-auto font-semibold tabular-nums text-slate-800">{valor}</span>
    </div>
  );
}
