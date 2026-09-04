import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Loader2, Scale, X } from 'lucide-react';
import { Button } from '@/shared/ui';
import { cn } from '@/shared/utils';
import { purchasesApi, type LinhaTresVias } from '../api/purchases.api';
import type { PurchaseOrder } from '../api/purchases.api';

/**
 * A conferência a três de uma ordem de compra: pedido, factura e recepção.
 *
 * ## Porque este ecrã faltava
 *
 * O motor já existia. `GET /compras/pedidos/:id/three-way-match` compara as três vias da
 * ordem inteira, aceita uma tolerância e exclui recepções anuladas — e nenhum ecrã o
 * chamava. A pergunta que decide se uma factura se paga só tinha resposta pelo Swagger.
 *
 * ## A tolerância é uma leitura, não uma configuração
 *
 * Fica aqui e não em Configuração de propósito. `toleranciaDivergencia` da empresa decide
 * o que passa **sem aprovação na descarga**; isto é a análise de uma factura em mãos, e
 * quem a analisa precisa de ver a mesma ordem com zero e com três por cento para saber se
 * a diferença é ruído de contagem ou dinheiro a mais. Gravá-la mudaria a regra da empresa
 * a partir de um ecrã de consulta.
 *
 * ## Não decide nada
 *
 * Mostra e explica. Bloquear ou libertar o pagamento é do Financeiro, e a divergência que
 * exige decisão já é apanhada pela aprovação da descarga. Um botão «aprovar» aqui daria
 * dois caminhos para a mesma autorização.
 */
export function ConferenciaTresViasModal({
  order,
  onClose,
}: {
  order: PurchaseOrder;
  onClose: () => void;
}) {
  const [tolerancia, setTolerancia] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['three-way-match', order.id, tolerancia],
    queryFn: () => purchasesApi.compararTresVias(order.id, tolerancia),
  });

  const divergentes = data?.linhas.filter((l) => !l.conforme) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-slate-100 p-2">
              <Scale className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Conferência a três</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {data?.fornecedor ?? order.fornecedor?.nome ?? '—'} · ordem #
                {order.id.slice(0, 8)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
          <label className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-medium text-slate-700">Tolerância</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={tolerancia}
              onChange={(e) => setTolerancia(Math.max(0, Number(e.target.value) || 0))}
              className="w-20 rounded-lg border border-slate-200 px-2.5 py-1.5 text-right text-sm focus:border-blue-400 focus:outline-none"
            />
            <span className="text-slate-400">%</span>
            <span className="text-xs text-slate-500">
              Diferenças de quantidade abaixo desta percentagem deixam de ser assinaladas. A
              diferença de custo é sempre assinalada — um preço acima do acordado não é ruído
              de contagem.
            </span>
          </label>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              A comparar as três vias...
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {(error as any)?.response?.data?.message ??
                'Não foi possível comparar esta ordem.'}
            </div>
          )}

          {data && (
            <div className="space-y-4">
              <Veredicto conforme={data.conforme} divergentes={divergentes.length} />

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[40rem] text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Produto</th>
                      <th className="px-3 py-2.5 text-right font-medium">Pedida</th>
                      <th className="px-3 py-2.5 text-right font-medium">Facturada</th>
                      <th className="px-3 py-2.5 text-right font-medium">Recebida</th>
                      <th className="px-3 py-2.5 text-right font-medium">Δ Qtd.</th>
                      <th className="px-3 py-2.5 text-right font-medium">Δ Custo</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {data.linhas.map((linha) => (
                      <LinhaDaComparacao key={linha.produtoId} linha={linha} />
                    ))}

                    {data.linhas.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                          Esta ordem não tem linhas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-slate-400">
                «Δ Qtd.» é o recebido menos o facturado. Negativo significa que se pagaria
                mercadoria que não chegou; positivo significa mercadoria sem custo, que baixa o
                custo médio em silêncio. Recepções anuladas não contam.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-100 px-5 py-3">
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}

function Veredicto({ conforme, divergentes }: { conforme: boolean; divergentes: number }) {
  if (conforme) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <div className="text-sm text-emerald-900">
          <p className="font-medium">As três vias fecham.</p>
          <p className="mt-0.5 text-emerald-700">
            O que foi pedido, o que foi facturado e o que entrou no armazém coincidem dentro da
            tolerância. Não há nada nesta ordem a impedir o pagamento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <div className="text-sm text-amber-900">
        <p className="font-medium">
          {divergentes} {divergentes === 1 ? 'linha divergente' : 'linhas divergentes'}.
        </p>
        <p className="mt-0.5 text-amber-800">
          Cada linha assinalada abaixo diz o que não fecha. Vale resolver antes de autorizar a
          factura — depois de paga, a correcção passa a ser uma nota de crédito.
        </p>
      </div>
    </div>
  );
}

function LinhaDaComparacao({ linha }: { linha: LinhaTresVias }) {
  const numero = (valor: number) =>
    valor.toLocaleString('pt-MZ', { maximumFractionDigits: 3 });

  /** Zero mostra-se como «—»: um zero alinhado à direita lê-se como um valor medido. */
  const delta = (valor: number, casas: number) => {
    if (Math.abs(valor) < 1e-6) return <span className="text-slate-300">—</span>;

    return (
      <span className={cn('font-semibold', valor < 0 ? 'text-red-600' : 'text-amber-600')}>
        {valor > 0 ? '+' : ''}
        {valor.toLocaleString('pt-MZ', { maximumFractionDigits: casas })}
      </span>
    );
  };

  return (
    <>
      <tr className={cn(!linha.conforme && 'bg-amber-50/40')}>
        <td className="px-4 py-3 font-medium text-slate-900">
          {linha.produto ?? linha.produtoId.slice(0, 8)}
        </td>
        <td className="px-3 py-3 text-right text-slate-500">{numero(linha.pedida)}</td>
        <td className="px-3 py-3 text-right text-slate-700">{numero(linha.facturada)}</td>
        <td className="px-3 py-3 text-right text-slate-700">{numero(linha.recebida)}</td>
        <td className="px-3 py-3 text-right">{delta(linha.diferencaQuantidade, 3)}</td>
        <td className="px-3 py-3 text-right">{delta(linha.diferencaCusto, 2)}</td>
      </tr>

      {/* As observações vêm do domínio já escritas em português e explicam a consequência,
          não só o desvio. Reescrevê-las aqui perderia isso. */}
      {linha.observacoes.length > 0 && (
        <tr className="bg-amber-50/40">
          <td colSpan={6} className="px-4 pb-3 pt-0">
            <ul className="space-y-1">
              {linha.observacoes.map((obs, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-amber-900">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-500" />
                  {obs}
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </>
  );
}
