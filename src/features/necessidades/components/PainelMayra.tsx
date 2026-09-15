import { Sparkles, ChevronRight } from 'lucide-react';
import { Card } from '@/shared/ui';
import type { KpisNecessidades } from '../types/necessidade.types';

interface PainelMayraProps {
  kpis: KpisNecessidades | undefined;
  isLoading?: boolean;
}

/**
 * MAYRA — Assistente de Abastecimento — DT01 14.
 *
 * ## O que este componente é, e o que ainda não é
 *
 * O DT01 pede cinco números accionáveis e uma recomendação priorizada, vindos de uma
 * análise de IA sobre Stock, Vendas, Compras, Fornecedores, Recepções, Inventários,
 * Transferências, Validades, Custos e Commerce.
 *
 * Isso é o módulo `ai-copilot`/MAYRA, que hoje não tem uma leitura agregada por
 * necessidades — é a Fase 4 do plano. O que este componente mostra enquanto isso não
 * existe é a mesma contagem dos KPIs, reorganizada na forma que o DT01 pede (quantos em
 * risco, quantos resolvíveis por transferência, quantos já cobertos, quantos por
 * decidir), **sem** o texto de recomendação gerado por IA — que seria inventado se
 * aparecesse aqui.
 *
 * "Ver análise completa" fica desactivado pela mesma razão do cartão de cobertura: um
 * botão que abre vazio é pior do que a ausência dele.
 */
export function PainelMayra({ kpis, isLoading }: PainelMayraProps) {
  if (isLoading || !kpis) {
    return (
      <Card className="animate-pulse" padding="lg">
        <div className="h-4 w-40 rounded bg-slate-100" />
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded bg-slate-100" />
          <div className="h-3 w-3/4 rounded bg-slate-100" />
        </div>
      </Card>
    );
  }

  const emRisco = kpis.emRiscoRuptura;
  const resolveisPorTransferencia = kpis.porRecomendacao.TRANSFERIR;
  const jaEmTransito = kpis.porRecomendacao.AGUARDAR;
  const precisamNovaCompra = kpis.porRecomendacao.COMPRAR;

  return (
    <Card padding="lg">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-indigo-500" />
        <p className="text-sm font-semibold text-slate-800">MAYRA — Assistente de Abastecimento</p>
      </div>

      <ul className="mt-4 space-y-2 text-sm text-slate-600">
        <li className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
          <span className="tabular-nums font-semibold text-slate-800">{emRisco}</span> em risco de
          ruptura
        </li>
        <li className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
          <span className="tabular-nums font-semibold text-slate-800">
            {resolveisPorTransferencia}
          </span>{' '}
          resolvíveis por transferência
        </li>
        <li className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
          <span className="tabular-nums font-semibold text-slate-800">{jaEmTransito}</span> já com
          compra/transferência em trânsito
        </li>
        <li className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
          <span className="tabular-nums font-semibold text-slate-800">{precisamNovaCompra}</span>{' '}
          precisam de nova compra
        </li>
      </ul>

      {resolveisPorTransferencia > 0 && (
        <div className="mt-4 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900">
          Considere transferir {resolveisPorTransferencia} produto
          {resolveisPorTransferencia === 1 ? '' : 's'} de outras lojas antes de criar novas
          compras.
        </div>
      )}

      <button
        type="button"
        disabled
        title="Análise completa da MAYRA — por vir"
        className="mt-4 flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-300"
      >
        Ver análise completa <ChevronRight size={14} />
      </button>
    </Card>
  );
}
