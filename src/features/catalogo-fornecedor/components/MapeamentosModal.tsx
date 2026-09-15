import { useQuery } from '@tanstack/react-query';
import { X, Package, Loader2 } from 'lucide-react';
import { catalogoFornecedorApi, ROTULO_METODO } from '../api/catalogo.api';
import { cn } from '@/shared/utils';

const mt = (v: number) =>
  `${v.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;

interface Props {
  fornecedorId: string;
  nomeFornecedor: string;
  onClose: () => void;
}

/**
 * O catálogo já mapeado de um fornecedor: cada produto ligado, a última importação que o
 * tocou, e os últimos cinco preços com o período em que valeram.
 *
 * Distinto das importações (o histórico de lotes) — isto é o retrato actual: o que o
 * catálogo deste fornecedor diz hoje, independentemente de qual importação o criou.
 */
export function MapeamentosModal({ fornecedorId, nomeFornecedor, onClose }: Props) {
  const { data: mapeamentos = [], isLoading } = useQuery({
    queryKey: ['catalogo-mapeamentos', fornecedorId],
    queryFn: () => catalogoFornecedorApi.mapeamentos(fornecedorId),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Package size={16} className="text-slate-400" />
              Catálogo mapeado
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">{nomeFornecedor}</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              A carregar...
            </div>
          ) : mapeamentos.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-500">
              Este fornecedor ainda não tem produtos mapeados. Importe um catálogo para
              começar.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Produto</th>
                    <th className="px-3 py-2 font-medium">Referência</th>
                    <th className="px-3 py-2 text-right font-medium">Custo actual</th>
                    <th className="px-3 py-2 font-medium">Como mapeou</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mapeamentos.map((m) => (
                    <tr key={m.id}>
                      <td className="px-3 py-2 text-slate-800">
                        {m.produto?.nome ?? m.produtoId}
                        {m.produto?.sku && (
                          <span className="ml-1.5 text-xs text-slate-400">({m.produto.sku})</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-500">{m.referenciaFornecedor || '—'}</td>
                      <td className="px-3 py-2 text-right text-slate-700">{mt(m.custoCompra)}</td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                            m.metodoMapeamento === 'DESCRICAO'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600',
                          )}
                        >
                          {ROTULO_METODO[m.metodoMapeamento]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-100 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
