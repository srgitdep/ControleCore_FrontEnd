import { X, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { usePreverFecho, useCloseCycle } from '@/features/stock';
import toast from 'react-hot-toast';

const moeda = (v: number) =>
  v.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });

interface Props {
  cycleId: string;
  onClose: () => void;
  onClosed: () => void;
}

/**
 * O fecho directo de um ciclo em reconciliação — o atalho que salta recontagem e fila de
 * exceções.
 *
 * ## Porque mostra a prévia antes de perguntar
 *
 * O resumo do fecho só era conhecido **depois** de fechar, quando a operação já é
 * irreversível: escreve movimentos de stock e lança uma despesa por cada falta. Mostrar a
 * prévia primeiro é a diferença entre decidir e descobrir.
 */
export function FecharCicloModal({ cycleId, onClose, onClosed }: Props) {
  const { data: previsao, isLoading } = usePreverFecho(cycleId, true);
  const fechar = useCloseCycle();

  const confirmar = () => {
    fechar.mutate(cycleId, {
      onSuccess: () => {
        toast.success('Ciclo encerrado. Os ajustes de stock e as despesas foram lançados.');
        onClosed();
      },
      onError: (err: any) =>
        toast.error(err?.response?.data?.message ?? 'Não foi possível encerrar o ciclo.'),
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900">Fechar ciclo directamente</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              A calcular o resumo...
            </div>
          ) : !previsao ? (
            <p className="text-sm text-slate-500">Não foi possível calcular a prévia.</p>
          ) : !previsao.podeFechar ? (
            <p className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              Este ciclo não está em condições de ser fechado directamente (estado actual:
              {' '}{previsao.status}).
            </p>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Este atalho salta a recontagem e a fila de exceções — use-o quando as
                divergências forem pequenas e não justificarem esse trabalho todo.
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metrica rotulo="Contados" valor={String(previsao.resumo.totalContado)} />
                <Metrica rotulo="Sem divergência" valor={String(previsao.resumo.semDivergencia)} />
                <Metrica rotulo="Faltas" valor={String(previsao.resumo.faltas)} alerta />
                <Metrica rotulo="Sobras" valor={String(previsao.resumo.sobras)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                  <p className="text-xs text-rose-700">Valor em falta</p>
                  <p className="mt-0.5 text-lg font-semibold text-rose-900">
                    {moeda(previsao.resumo.valorFaltas)}
                  </p>
                  <p className="mt-0.5 text-xs text-rose-700">Lançado como despesa ao fechar</p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-xs text-emerald-700">Valor em sobra</p>
                  <p className="mt-0.5 text-lg font-semibold text-emerald-900">
                    {moeda(previsao.resumo.valorSobras)}
                  </p>
                </div>
              </div>

              {previsao.divergencias.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-left uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2 font-medium">Produto</th>
                        <th className="px-3 py-2 text-right font-medium">Diferença</th>
                        <th className="px-3 py-2 text-right font-medium">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previsao.divergencias.map((d) => (
                        <tr key={d.stockId}>
                          <td className="px-3 py-2 text-slate-800">{d.produto}</td>
                          <td className={`px-3 py-2 text-right font-medium ${d.diferenca < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {d.diferenca > 0 ? '+' : ''}{d.diferenca}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-600">{moeda(d.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 p-6">
          <button
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={fechar.isPending || !previsao?.podeFechar}
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {fechar.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Confirmar fecho
          </button>
        </div>
      </div>
    </div>
  );
}

function Metrica({ rotulo, valor, alerta }: { rotulo: string; valor: string; alerta?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{rotulo}</p>
      <p className={`mt-0.5 text-base font-semibold ${alerta ? 'text-amber-600' : 'text-slate-900'}`}>
        {valor}
      </p>
    </div>
  );
}
