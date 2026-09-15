import { cn } from '@/shared/utils';
import { RECOMENDACAO_LABEL, type RecomendacaoNecessidade } from '../types/necessidade.types';

const ORDEM: RecomendacaoNecessidade[] = [
  'COMPRAR',
  'TRANSFERIR',
  'AGUARDAR',
  'NAO_COMPRAR',
  'STOCK_PARADO',
  'EXCESSO',
];

/** A cor de cada classificação — a mesma em todo o painel, do chip à coluna da tabela. */
const COR: Record<RecomendacaoNecessidade, string> = {
  COMPRAR: 'bg-amber-100 text-amber-800 border-amber-200',
  TRANSFERIR: 'bg-blue-100 text-blue-800 border-blue-200',
  AGUARDAR: 'bg-slate-100 text-slate-700 border-slate-200',
  NAO_COMPRAR: 'bg-slate-100 text-slate-500 border-slate-200',
  STOCK_PARADO: 'bg-purple-100 text-purple-700 border-purple-200',
  EXCESSO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const CHIP_SELECCIONADO: Record<RecomendacaoNecessidade, string> = {
  COMPRAR: 'bg-amber-500 text-white border-amber-500',
  TRANSFERIR: 'bg-blue-500 text-white border-blue-500',
  AGUARDAR: 'bg-slate-500 text-white border-slate-500',
  NAO_COMPRAR: 'bg-slate-500 text-white border-slate-500',
  STOCK_PARADO: 'bg-purple-500 text-white border-purple-500',
  EXCESSO: 'bg-emerald-500 text-white border-emerald-500',
};

interface ChipsRecomendacaoProps {
  contagens: Record<RecomendacaoNecessidade, number>;
  total: number;
  seleccionadas: RecomendacaoNecessidade[];
  onAlternar: (recomendacao: RecomendacaoNecessidade) => void;
  onLimpar: () => void;
}

/**
 * Os filtros por classificação — DT01 5 e 10 — com a contagem de cada um.
 *
 * Multi-selecção: "Comprar" e "Transferir" ao mesmo tempo é um filtro legítimo (tudo o
 * que exige mercadoria, por oposição ao que só se acompanha). Um único `radio` não
 * permitiria essa combinação.
 */
export function ChipsRecomendacao({
  contagens,
  total,
  seleccionadas,
  onAlternar,
  onLimpar,
}: ChipsRecomendacaoProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onLimpar}
        className={cn(
          'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
          seleccionadas.length === 0
            ? 'border-slate-900 bg-slate-900 text-white'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
        )}
      >
        Todos ({total})
      </button>

      {ORDEM.map((recomendacao) => {
        const activo = seleccionadas.includes(recomendacao);
        const quantidade = contagens[recomendacao] ?? 0;

        return (
          <button
            key={recomendacao}
            type="button"
            onClick={() => onAlternar(recomendacao)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              activo ? CHIP_SELECCIONADO[recomendacao] : COR[recomendacao],
              !activo && 'hover:opacity-80',
            )}
          >
            {RECOMENDACAO_LABEL[recomendacao]} ({quantidade})
          </button>
        );
      })}
    </div>
  );
}
