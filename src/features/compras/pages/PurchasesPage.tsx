import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { ShoppingBag, ShoppingCart, Truck, Sparkles, PackageCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { purchasesApi, EstadoPedidoCompra } from '../api/purchases.api';
import type { PurchaseOrder, SugestaoCompra } from '../api/purchases.api';
import { FornecedoresTab } from '@/features/fornecedores';
import { Tabs, type TabDefinition } from '@/shared/ui';
import { usePermissions } from '@/features/auth';
import { cn } from '@/shared/utils';
import { RecebimentoModal } from '../components/RecebimentoModal';
import { RececoesModal } from '../components/RececoesModal';
import { SugestaoComprasModal } from '../components/SugestaoComprasModal';
import { CriarPedidoModal } from '../components/CriarPedidoModal';

type Aba = 'pedidos' | 'fornecedores';

const moeda = (valor: number) =>
  valor.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });

/**
 * A secção Compras: pedidos e fornecedores.
 *
 * ## Porque Fornecedores vive aqui
 *
 * Fornecedores estava em dois lugares — uma entrada no menu com CRUD completo, e um
 * separador aqui que era uma tabela de quatro colunas só de leitura. Duas vistas dos
 * mesmos dados, uma delas incompleta, e a incompleta era a que aparecia no contexto em
 * que os fornecedores importam: a fazer uma compra.
 *
 * Fica só aqui, com o CRUD completo mais o desempenho e o histórico.
 *
 * ## O que passou a funcionar
 *
 * O botão «Sugestão de Compras» mostrava um toast que dizia «(Simulação MVP)» sem fazer
 * nenhuma chamada de rede. O botão «Novo Pedido» não tinha `onClick` — criar um pedido
 * pela interface era impossível.
 */
export function PurchasesPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = usePermissions();

  // As rotas de fornecedor exigem `VER_FORNECEDOR`, as de compras `GERIR_COMPRAS`. Um
  // perfil com uma e não a outra veria o separador falhar com 403 — melhor não o
  // mostrar do que mostrar um erro.
  const podeVerFornecedores = hasPermission('read', 'fornecedor');

  const ABAS: TabDefinition<Aba>[] = [
    { id: 'pedidos', label: 'Pedidos de compra', icon: ShoppingCart },
    ...(podeVerFornecedores
      ? [{ id: 'fornecedores' as Aba, label: 'Fornecedores', icon: Truck }]
      : []),
  ];

  const doUrl = searchParams.get('tab');
  const aba: Aba = ABAS.some((a) => a.id === doUrl) ? (doUrl as Aba) : 'pedidos';

  const [aReceber, setAReceber] = useState<PurchaseOrder | null>(null);
  const [aVerRececoes, setAVerRececoes] = useState<PurchaseOrder | null>(null);
  const [mostrarSugestao, setMostrarSugestao] = useState(false);
  const [aCriar, setACriar] = useState<{
    linhas?: { produtoId: string; nome: string; quantidade: number; custoUnitario: number }[];
    fornecedorId?: string;
  } | null>(null);

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['compras-pedidos'],
    queryFn: () => purchasesApi.getOrders(),
    enabled: aba === 'pedidos',
  });

  const recarregar = () => queryClient.invalidateQueries({ queryKey: ['compras-pedidos'] });

  /** Da sugestão para o pedido: as linhas escolhidas viram um rascunho. */
  const daSugestaoParaPedido = (linhas: SugestaoCompra[]) => {
    if (linhas.length === 0) return;

    // O fornecedor do primeiro; um pedido é a um fornecedor só, e o modal da sugestão
    // já avisa quando as linhas escolhidas são de fornecedores diferentes.
    const fornecedorId = linhas[0].fornecedorSugerido?.id;

    setMostrarSugestao(false);
    setACriar({
      fornecedorId,
      linhas: linhas.map((l) => ({
        produtoId: l.produtoId,
        nome: l.nome,
        quantidade: l.quantidadeSugerida,
        custoUnitario: l.fornecedorSugerido?.custoCompra ?? 0,
      })),
    });
  };

  const aoClicarNoPedido = (pedido: PurchaseOrder) => {
    if (pedido.estado === EstadoPedidoCompra.ENVIADO || pedido.estado === EstadoPedidoCompra.PARCIAL) {
      setAReceber(pedido);
    } else if (pedido.estado === EstadoPedidoCompra.RECEBIDO) {
      // Um pedido recebido não aceita mais mercadoria, mas as suas recepções
      // interessam — antes, clicar nele só dava um toast a dizer o estado.
      setAVerRececoes(pedido);
    } else {
      toast(`Este pedido está em ${pedido.estado.toLowerCase()}.`, { icon: 'ℹ️' });
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            Compras
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Pedidos, recepções de mercadoria e fornecedores.
          </p>
        </div>

        {aba === 'pedidos' && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setMostrarSugestao(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Sparkles className="h-4 w-4 text-indigo-600" />
              Sugestão de Compras
            </button>
            <button
              onClick={() => setACriar({})}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <ShoppingBag className="h-4 w-4" />
              Novo Pedido
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Tabs
          tabs={ABAS}
          active={aba}
          onChange={(id) => setSearchParams({ tab: id }, { replace: true })}
          label="Compras"
          className="px-4"
        />

        <div className="p-4 sm:p-6">
          {aba === 'pedidos' && (
            <ListaDePedidos
              pedidos={pedidos}
              isLoading={isLoading}
              onClicar={aoClicarNoPedido}
              onVerRececoes={setAVerRececoes}
            />
          )}
          {aba === 'fornecedores' && <FornecedoresTab />}
        </div>
      </div>

      {aReceber && (
        <RecebimentoModal
          order={aReceber}
          onClose={() => setAReceber(null)}
          onSuccess={recarregar}
        />
      )}

      {aVerRececoes && (
        <RececoesModal
          order={aVerRececoes}
          onClose={() => setAVerRececoes(null)}
          onSuccess={recarregar}
        />
      )}

      {mostrarSugestao && (
        <SugestaoComprasModal
          onClose={() => setMostrarSugestao(false)}
          onCriarPedido={daSugestaoParaPedido}
        />
      )}

      {aCriar && (
        <CriarPedidoModal
          linhasIniciais={aCriar.linhas}
          fornecedorIdInicial={aCriar.fornecedorId}
          onClose={() => setACriar(null)}
          onCreated={recarregar}
        />
      )}
    </div>
  );
}

// ── A lista de pedidos ───────────────────────────────────────────────────────

function ListaDePedidos({
  pedidos,
  isLoading,
  onClicar,
  onVerRececoes,
}: {
  pedidos: PurchaseOrder[];
  isLoading: boolean;
  onClicar: (p: PurchaseOrder) => void;
  onVerRececoes: (p: PurchaseOrder) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        A carregar pedidos...
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="py-16 text-center">
        <ShoppingCart className="mx-auto mb-3 h-12 w-12 text-slate-300" />
        <p className="text-sm font-medium text-slate-700">Ainda não há pedidos de compra.</p>
        <p className="mt-1 text-sm text-slate-500">
          Use a sugestão de compras para saber o que repor, ou crie um pedido directamente.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-2.5 font-medium">Pedido</th>
            <th className="px-3 py-2.5 font-medium">Fornecedor</th>
            <th className="hidden px-3 py-2.5 font-medium sm:table-cell">Data</th>
            <th className="hidden px-3 py-2.5 text-right font-medium md:table-cell">Linhas</th>
            <th className="hidden px-3 py-2.5 text-right font-medium md:table-cell">Valor</th>
            <th className="px-3 py-2.5 font-medium">Estado</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {pedidos.map((p) => {
            // O total sai dos itens, que a listagem não inclui — mostra-se «—» em vez
            // de zero, que se leria como um pedido sem valor.
            const total = p.itens?.reduce(
              (soma, i) => soma + i.quantidadePedida * i.custoUnitario - (i.desconto ?? 0),
              0,
            );

            const recebivel =
              p.estado === EstadoPedidoCompra.ENVIADO || p.estado === EstadoPedidoCompra.PARCIAL;

            return (
              <tr key={p.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <button
                    onClick={() => onClicar(p)}
                    className="font-mono text-xs text-slate-600 hover:text-blue-600 hover:underline"
                  >
                    #{p.id.slice(0, 8)}
                  </button>
                </td>
                <td className="px-3 py-3 font-medium text-slate-900">
                  {p.fornecedor?.nome ?? '—'}
                </td>
                <td className="hidden px-3 py-3 text-slate-500 sm:table-cell">
                  {new Date(p.dataPedido).toLocaleDateString('pt-MZ', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="hidden px-3 py-3 text-right text-slate-500 md:table-cell">
                  {p.itens?.length ?? '—'}
                </td>
                <td className="hidden px-3 py-3 text-right text-slate-700 md:table-cell">
                  {total !== undefined ? moeda(total) : '—'}
                </td>
                <td className="px-3 py-3">
                  <EstadoBadge estado={p.estado} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {recebivel && (
                      <button
                        onClick={() => onClicar(p)}
                        title="Dar entrada de mercadoria"
                        className="p-2 text-slate-400 transition-colors hover:text-emerald-600"
                      >
                        <PackageCheck size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => onVerRececoes(p)}
                      title="Ver recepções"
                      className="p-2 text-slate-400 transition-colors hover:text-blue-600"
                    >
                      <Truck size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  // `PARCIAL` e `PENDENTE` caíam no ramo por omissão e apareciam em azul, como se
  // fossem estados neutros — mas são pedidos à espera de mercadoria.
  const cores: Record<string, string> = {
    RASCUNHO: 'bg-slate-100 text-slate-700',
    ENVIADO: 'bg-blue-100 text-blue-700',
    PENDENTE: 'bg-amber-100 text-amber-800',
    PARCIAL: 'bg-amber-100 text-amber-800',
    RECEBIDO: 'bg-emerald-100 text-emerald-700',
    CANCELADO: 'bg-rose-100 text-rose-700',
  };

  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        cores[estado] ?? 'bg-slate-100 text-slate-700',
      )}
    >
      {estado}
    </span>
  );
}
