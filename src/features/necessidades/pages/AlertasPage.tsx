import { AlertTriangle, Clock, PackageX } from 'lucide-react';
import { BarraDaPagina, Card } from '@/shared/ui';
import { cn } from '@/shared/utils';
import { useAlertas } from '../hooks/useNecessidades';
import { TIPO_ALERTA_LABEL, type Alerta, type TipoAlerta } from '../types/necessidade.types';

const ICONE_POR_TIPO: Record<TipoAlerta, React.ElementType> = {
  RISCO_RUPTURA: PackageX,
  OC_ATRASADA: Clock,
  RECEPCAO_PENDENTE: AlertTriangle,
};

const COR_POR_TIPO: Record<TipoAlerta, string> = {
  RISCO_RUPTURA: 'text-rose-500',
  OC_ATRASADA: 'text-amber-500',
  RECEPCAO_PENDENTE: 'text-blue-500',
};

/**
 * O Centro de Alertas — DT01 §15.4.
 *
 * "Concentra ruptura, atraso de fornecedor, OC atrasada, transporte atrasado,
 * recepção pendente, divergência e outros alertas." Três fontes têm dado real hoje —
 * risco de ruptura, OC atrasada e recepção pendente — e é isso que esta página
 * mostra. Atraso de fornecedor e transporte exigiriam um módulo de logística que não
 * existe; divergência de inventário já tem o seu próprio ecrã, e duplicá-la aqui
 * divergiria da fila que o Gestor de Inventário já usa.
 */
export function AlertasPage() {
  const { data, isLoading } = useAlertas();

  const linha = (alerta: Alerta) => {
    const Icone = ICONE_POR_TIPO[alerta.tipo];
    return (
      <div
        key={`${alerta.tipo}-${alerta.entidadeId}`}
        className="flex items-start gap-3 border-b border-slate-100 px-4 py-3 last:border-0"
      >
        <Icone size={18} className={cn('mt-0.5 shrink-0', COR_POR_TIPO[alerta.tipo])} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-medium text-slate-800">{alerta.titulo}</p>
            <span className="shrink-0 text-xs text-slate-400">
              há {alerta.diasEmAberto} {alerta.diasEmAberto === 1 ? 'dia' : 'dias'}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">{alerta.descricao}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium">
              {TIPO_ALERTA_LABEL[alerta.tipo]}
            </span>
            {alerta.loja && <span>{alerta.loja.nome}</span>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <BarraDaPagina resumo={data ? `${data.total} alertas activos` : undefined} />

      <Card padding="sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-slate-400">
            A carregar alertas...
          </div>
        ) : !data?.dados.length ? (
          <div className="py-16 text-center text-sm text-slate-400">
            Sem alertas activos. Tudo dentro do esperado.
          </div>
        ) : (
          data.dados.map(linha)
        )}
      </Card>
    </div>
  );
}
