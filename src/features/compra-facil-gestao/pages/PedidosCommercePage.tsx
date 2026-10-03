import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getLojas } from '@/features/lojas';
import { cn, formatMoeda, mensagemDeErro } from '@/shared/utils';
import { BarraDaPagina } from '@/shared/ui';
import { TabelaPedidosCommerce } from '../components/TabelaPedidosCommerce';
import { DetalhePedidoCommerceDrawer } from '../components/DetalhePedidoCommerceDrawer';
import { usePedidosCommerceGestao } from '../hooks/usePedidosCommerceGestao';
import { type EstadoPedidoCommerce, type PedidoCommerceGestao } from '../types/pedido-commerce-gestao.types';

const ESTADOS: EstadoPedidoCommerce[] = [
  'CRIADO',
  'CONFIRMADO',
  'EM_PREPARACAO',
  'PRONTO',
  'CONCLUIDO',
  'CANCELADO',
];

/**
 * A fila de pedidos do Compra Fácil — Fase 12
 * (Docs/plano_feature_compra_facil.md §8.2). Sem isto um pedido criado pelo
 * cliente ficava invisível do lado interno; é aqui que o funcionário confirma,
 * separa, confere e fecha o levantamento.
 */
export function PedidosCommercePage() {
  const { t } = useTranslation('lojaGestao');
  const [estado, setEstado] = useState<EstadoPedidoCommerce | undefined>(undefined);
  const [lojaId, setLojaId] = useState('');
  const [pedidoAberto, setPedidoAberto] = useState<PedidoCommerceGestao | null>(null);

  const { data: lojas } = useQuery({ queryKey: ['lojas'], queryFn: getLojas });
  const { data: pedidos, isLoading, isError, error } = usePedidosCommerceGestao({
    estado,
    lojaId: lojaId || undefined,
  });

  // O drawer segue os dados mais recentes da lista (cada mutação invalida-a),
  // em vez de ficar preso à cópia do momento em que foi aberto.
  const pedidoActual = pedidoAberto ? (pedidos?.find((p) => p.id === pedidoAberto.id) ?? pedidoAberto) : null;

  // "Concluído" é, por definição, o histórico de vendas feitas online — o pedido só
  // chega a este estado depois de `ConfirmarLevantamentoUseCase` gerar a venda real
  // (`vendaId` fica preenchido). O total aqui é o mesmo valor que entrou no caixa.
  const totalHistorico = useMemo(
    () => pedidos?.reduce((soma, p) => soma + p.totalFinal, 0) ?? 0,
    [pedidos],
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <BarraDaPagina resumo={pedidos ? t('pagina.resumo', { count: pedidos.length }) : undefined} />

      <div className="flex flex-wrap items-center gap-2">
        {/*
          A fila mostra os pedidos de toda a empresa — `ListarPedidosGestaoUseCase`
          filtra por `empresaId`, e o token do funcionário não tem loja. Este
          selector é conveniência, não segregação: quem fecha o levantamento na
          loja errada é recusado pelo servidor, não por ter escolhido aqui.
        */}
        <select
          value={lojaId}
          onChange={(e) => setLojaId(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
        >
          <option value="">{t('pagina.todas_lojas')}</option>
          {(lojas ?? []).map((loja: { id: string; nome: string }) => (
            <option key={loja.id} value={loja.id}>
              {loja.nome}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setEstado(undefined)}
          className={cn(
            'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
            !estado ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
          )}
        >
          {t('pagina.todos_estados')}
        </button>
        {ESTADOS.map((valor) => (
          <button
            key={valor}
            type="button"
            onClick={() => setEstado(valor)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              estado === valor ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            {t(`estado.${valor}`)}
          </button>
        ))}
      </div>

      {/* O histórico de vendas online por loja já existia tecnicamente — filtrar por
          "Concluído" e escolher a loja no selector acima. Faltava só este resumo
          para a fila genérica também servir de relatório. */}
      {estado === 'CONCLUIDO' && !isLoading && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <TrendingUp size={18} className="text-emerald-600" />
          <p className="text-sm text-emerald-800">
            {t('pagina.resumo_historico', {
              count: pedidos?.length ?? 0,
              total: formatMoeda(totalHistorico),
            })}
          </p>
        </div>
      )}

      {isError ? (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p>{mensagemDeErro(error, t('pagina.erro_carregar'))}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white">
          <TabelaPedidosCommerce pedidos={pedidos ?? []} isLoading={isLoading} onAbrir={setPedidoAberto} />
        </div>
      )}

      <DetalhePedidoCommerceDrawer pedido={pedidoActual} onClose={() => setPedidoAberto(null)} />
    </div>
  );
}
