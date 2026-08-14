import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { X, Box, Search, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { getStockDoArmazem, type Armazem } from '@/features/lojas';
import { cn } from '@/shared/utils';
import { TableScroll } from '@/shared/ui';

/**
 * O que está dentro de um armazém.
 *
 * ## Porque existe
 *
 * Os armazéns listavam-se com nome, tipo e três botões de acção, e clicar num não
 * fazia nada — o `<li>` não tinha `onClick`. Saber o que estava lá dentro obrigava a
 * ir à secção Stock, que mostrava as posições de todos os armazéns misturadas, sem
 * coluna de armazém e sem filtro.
 *
 * ## O que mostra, e porquê
 *
 * Além da quantidade, o **custo médio** e o **valor imobilizado** de cada linha. Um
 * armazém não é uma lista de artigos: é capital parado, e é essa a leitura que
 * interessa a quem decide o que comprar e o que transferir.
 *
 * Esconde as posições a zero por omissão. Criar um produto abre uma posição em todos
 * os armazéns da empresa, pelo que sem o filtro um armazém de quebras com três artigos
 * apareceria com o catálogo inteiro a zero — e o que interessa saber é o que lá está.
 */
export function ArmazemDetailsModal({
  armazem,
  lojaNome,
  onClose,
}: {
  armazem: Armazem;
  lojaNome: string;
  onClose: () => void;
}) {
  const [pesquisa, setPesquisa] = useState('');
  const [incluirSemSaldo, setIncluirSemSaldo] = useState(false);
  const [soAbaixoDoMinimo, setSoAbaixoDoMinimo] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['armazem-stock', armazem.id, incluirSemSaldo],
    queryFn: () => getStockDoArmazem(armazem.id, incluirSemSaldo),
  });

  const termo = pesquisa.trim().toLowerCase();

  // Filtragem em memória: a lista de um armazém cabe num pedido, e filtrar no cliente
  // responde a cada tecla sem uma ida ao servidor.
  const posicoes = (data?.posicoes ?? []).filter((p) => {
    if (soAbaixoDoMinimo && !p.abaixoDoMinimo) return false;
    if (!termo) return true;
    return (
      p.nome.toLowerCase().includes(termo) ||
      p.codigoBarras?.toLowerCase().includes(termo) ||
      p.sku?.toLowerCase().includes(termo)
    );
  });

  const moeda = (valor: number) =>
    valor.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'rounded-lg p-2',
                armazem.tipo?.toUpperCase() === 'VENDA' ? 'bg-blue-100' : 'bg-emerald-100',
              )}
            >
              <Box
                className={cn(
                  'h-5 w-5',
                  armazem.tipo?.toUpperCase() === 'VENDA' ? 'text-blue-600' : 'text-emerald-600',
                )}
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{armazem.nome}</h2>
              <p className="text-sm text-slate-500">
                {lojaNome} · {armazem.tipo}
                {!armazem.isActive && (
                  <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                    Inactivo
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Resumo ─────────────────────────────────────────────────────── */}
        {data && (
          <div className="grid grid-cols-2 gap-px border-b border-slate-100 bg-slate-100 sm:grid-cols-4">
            {[
              { rotulo: 'Produtos', valor: String(data.resumo.totalProdutos) },
              {
                rotulo: 'Unidades',
                valor: data.resumo.totalUnidades.toLocaleString('pt-MZ'),
              },
              { rotulo: 'Valor imobilizado', valor: moeda(data.resumo.valorImobilizado) },
              {
                rotulo: 'Abaixo do mínimo',
                valor: String(data.resumo.abaixoDoMinimo),
                alerta: data.resumo.abaixoDoMinimo > 0,
              },
            ].map((item) => (
              <div key={item.rotulo} className="bg-white px-4 py-3">
                <p className="text-xs text-slate-500">{item.rotulo}</p>
                <p
                  className={cn(
                    'mt-0.5 text-sm font-semibold',
                    item.alerta ? 'text-amber-600' : 'text-slate-900',
                  )}
                >
                  {item.valor}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Filtros ────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder="Pesquisar produto, SKU ou código de barras..."
              className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-slate-600">
            <input
              type="checkbox"
              checked={soAbaixoDoMinimo}
              onChange={(e) => setSoAbaixoDoMinimo(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Só abaixo do mínimo
          </label>

          <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-slate-600">
            <input
              type="checkbox"
              checked={incluirSemSaldo}
              onChange={(e) => setIncluirSemSaldo(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Incluir sem saldo
          </label>
        </div>

        {/* ── Lista ──────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              A carregar existências...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <p className="text-sm text-slate-600">
                Não foi possível carregar as existências deste armazém.
              </p>
            </div>
          ) : posicoes.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-slate-500">
              {termo || soAbaixoDoMinimo
                ? 'Nenhum produto corresponde aos filtros.'
                : 'Este armazém não tem existências. Dê entrada de mercadoria por uma recepção de compra ou por um ajuste de stock.'}
            </div>
          ) : (
            <TableScroll>
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-2.5 font-medium">Produto</th>
                  <th className="px-3 py-2.5 text-right font-medium">Quantidade</th>
                  <th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">Mínimo</th>
                  <th className="hidden px-3 py-2.5 text-right font-medium md:table-cell">
                    Custo médio
                  </th>
                  <th className="px-6 py-2.5 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posicoes.map((p) => (
                  <tr key={p.stockId} className="hover:bg-slate-50/60">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/stock/${p.stockId}`}
                          onClick={onClose}
                          className="font-medium text-slate-900 hover:text-blue-600 hover:underline"
                          title="Ver histórico de movimentos"
                        >
                          {p.nome}
                        </Link>
                        <ExternalLink className="h-3 w-3 flex-shrink-0 text-slate-300" />
                      </div>
                      {(p.codigoBarras || p.sku) && (
                        <p className="mt-0.5 font-mono text-xs text-slate-400">
                          {p.codigoBarras ?? p.sku}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span
                        className={cn(
                          'font-semibold',
                          p.quantidade <= 0
                            ? 'text-rose-600'
                            : p.abaixoDoMinimo
                              ? 'text-amber-600'
                              : 'text-slate-900',
                        )}
                      >
                        {p.quantidade.toLocaleString('pt-MZ')}
                      </span>
                      <span className="ml-1 text-xs text-slate-400">{p.unidadeMedida}</span>
                    </td>
                    <td className="hidden px-3 py-3 text-right text-slate-500 sm:table-cell">
                      {/* Zero significa «sem mínimo definido», não «mínimo de zero» —
                          mostrar 0 leria-se como um limiar configurado. */}
                      {p.minimo > 0 ? p.minimo.toLocaleString('pt-MZ') : '—'}
                    </td>
                    <td className="hidden px-3 py-3 text-right text-slate-500 md:table-cell">
                      {p.custoMedio > 0 ? moeda(p.custoMedio) : '—'}
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-slate-700">
                      {moeda(p.valorImobilizado)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </TableScroll>
          )}
        </div>

        {/* ── Rodapé ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 border-t border-slate-100 bg-slate-50 px-6 py-3">
          <p className="text-xs text-slate-500">
            {posicoes.length}
            {data && posicoes.length !== data.posicoes.length ? ` de ${data.posicoes.length}` : ''}{' '}
            {posicoes.length === 1 ? 'produto' : 'produtos'}
          </p>
          <Link
            to={`/stock?tab=estoque`}
            onClick={onClose}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            Abrir na secção Stock
          </Link>
        </div>
      </div>
    </div>
  );
}
