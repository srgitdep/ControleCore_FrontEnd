import { AlertTriangle, CheckCircle, Package, TrendingUp } from 'lucide-react';
import { Card } from '@/shared/ui';
import { cn } from '@/shared/utils';
import type { RelatorioLucro } from '../types';

const fmt = (v: number | string) =>
  Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const moeda = (v: number | string) => `${fmt(v)} MT`;

/**
 * Lucro do mês, margem, quebras de caixa e produtos mais vendidos.
 *
 * ## O que este painel mostra que o DRE não mostra
 *
 * O endpoint `GET /finance/lucro` está marcado `[LEGADO]` no servidor, e a tentação era
 * ignorá-lo por o DRE cobrir a receita e a margem. Mas traz duas leituras que não existem
 * em nenhum outro sítio da aplicação:
 *
 *  - **Quebras de caixa.** A soma, no mês, das diferenças entre o saldo que o sistema
 *    calculou e o que o operador declarou ao fechar a sessão. É dinheiro que faltou na
 *    gaveta, e mais nenhum ecrã o agrega — vê-se sessão a sessão, no histórico de caixas,
 *    onde é preciso somar de cabeça doze fechos para chegar ao número do mês.
 *  - **Os cinco produtos com mais unidades vendidas**, com a receita de cada.
 *
 * ## Porque a quebra tem sinal
 *
 * O servidor calcula `calculado − declarado`. Positivo significa que faltou dinheiro;
 * negativo, que sobrou. Mostrar o valor absoluto perderia essa distinção, e as duas
 * situações querem conversas diferentes com quem fecha a caixa.
 */
export function PainelLucroEQuebras({ relatorio }: { relatorio: RelatorioLucro }) {
  const faltou = relatorio.quebrasDeCaixa > 0.005;
  const sobrou = relatorio.quebrasDeCaixa < -0.005;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador
          rotulo="Receita (sem IVA)"
          valor={moeda(relatorio.receitaBrutaLiquidaDeIva)}
        />
        <Indicador
          rotulo="Custo da mercadoria"
          valor={moeda(relatorio.custoMercadoriaVendida)}
        />
        <Indicador
          rotulo="Lucro bruto"
          valor={moeda(relatorio.lucroBruto)}
          destaque={relatorio.lucroBruto >= 0 ? 'positivo' : 'negativo'}
          icone={TrendingUp}
        />
        <Indicador rotulo="Margem" valor={relatorio.margemLucroPercentagem} />
      </div>

      {/* ─── Quebras de caixa ─────────────────────────────────────────────── */}
      <Card
        className={cn(
          faltou && 'border-rose-200 bg-rose-50/60',
          sobrou && 'border-amber-200 bg-amber-50/60',
          !faltou && !sobrou && 'border-emerald-200 bg-emerald-50/60',
        )}
      >
        <div className="flex items-start gap-3 p-4">
          {faltou || sobrou ? (
            <AlertTriangle
              className={cn('mt-0.5 h-5 w-5 shrink-0', faltou ? 'text-rose-600' : 'text-amber-600')}
            />
          ) : (
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          )}

          <div>
            <p
              className={cn(
                'text-sm font-semibold',
                faltou ? 'text-rose-900' : sobrou ? 'text-amber-900' : 'text-emerald-900',
              )}
            >
              {faltou && `Faltaram ${moeda(relatorio.quebrasDeCaixa)} nas caixas deste mês.`}
              {sobrou &&
                `Sobraram ${moeda(Math.abs(relatorio.quebrasDeCaixa))} nas caixas deste mês.`}
              {!faltou && !sobrou && 'As caixas fecharam sem diferenças este mês.'}
            </p>
            <p
              className={cn(
                'mt-1 text-xs',
                faltou ? 'text-rose-800' : sobrou ? 'text-amber-800' : 'text-emerald-800',
              )}
            >
              {faltou
                ? 'É a soma das diferenças entre o saldo calculado e o declarado em cada fecho. Vale confirmar sessão a sessão no histórico de caixas antes de falar com quem fechou.'
                : sobrou
                  ? 'Dinheiro a mais é tão irregular como dinheiro a menos: normalmente indica um troco não registado ou uma venda lançada em falta.'
                  : 'Saldo calculado e declarado coincidiram em todas as sessões fechadas.'}
            </p>
          </div>
        </div>
      </Card>

      {/* ─── Produtos mais vendidos ───────────────────────────────────────── */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Package size={16} className="text-slate-400" />
          Mais vendidos, por unidades
        </h3>

        {relatorio.topProdutos.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">
            Sem vendas registadas neste mês.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[26rem] text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Produto</th>
                  <th className="px-3 py-2.5 text-right font-medium">Unidades</th>
                  <th className="px-4 py-2.5 text-right font-medium">Receita</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {relatorio.topProdutos.map((p) => (
                  <tr key={p.nome}>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{p.nome}</td>
                    <td className="px-3 py-2.5 text-right text-slate-700">
                      {p.quantidade.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                      {moeda(p.receita)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Indicador({
  rotulo,
  valor,
  destaque,
  icone: Icone,
}: {
  rotulo: string;
  valor: string;
  destaque?: 'positivo' | 'negativo';
  icone?: React.ElementType;
}) {
  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center gap-1.5">
          {Icone && <Icone size={13} className="text-slate-400" />}
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{rotulo}</p>
        </div>
        <p
          className={cn(
            'mt-1.5 text-xl font-bold',
            destaque === 'negativo'
              ? 'text-rose-600'
              : destaque === 'positivo'
                ? 'text-emerald-600'
                : 'text-slate-900',
          )}
        >
          {valor}
        </p>
      </div>
    </Card>
  );
}
