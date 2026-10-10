import { Link, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, PackageSearch } from 'lucide-react';
import { formatData, formatMoeda } from '@/shared/utils';
import { useContaClienteStore } from '../store/useContaClienteStore';
import { useMeusPedidos } from '../hooks/usePedidosCommerce';
import { LojaTopo } from '../components/LojaTopo';
import { VoltarLink } from '../components/VoltarLink';

export function MeusPedidosPage() {
  const { lojaId } = useParams<{ lojaId: string }>();
  const { autenticado, aCarregar } = useContaClienteStore();
  const { data: pedidos, isLoading } = useMeusPedidos();
  const { t } = useTranslation('loja');

  if (!lojaId) return null;

  if (!aCarregar && !autenticado) {
    return <Navigate to={`/loja/${lojaId}/entrar`} state={{ de: `/loja/${lojaId}/pedidos` }} replace />;
  }

  return (
    <div>
      <LojaTopo lojaId={lojaId} />

      <div className="cc-caixa max-w-2xl py-8">
        <VoltarLink to={`/loja/${lojaId}`}>{t('navegacao.voltar_catalogo')}</VoltarLink>

        <h1 className="mb-5 text-xl font-bold text-slate-900">{t('pedidos.os_meus')}</h1>

        {(isLoading || aCarregar) && (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 size={22} className="animate-spin text-slate-400" />
          </div>
        )}

        {pedidos && pedidos.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 py-16 text-center">
            <PackageSearch size={28} className="text-slate-300" />
            <p className="text-sm text-slate-500">{t('pedidos.nenhum')}</p>
          </div>
        )}

        <div className="space-y-3">
          {pedidos?.map((pedido) => (
            <Link
              key={pedido.id}
              // O pedido pode ser de outra loja (a conta é da pessoa): abre na loja do próprio pedido.
              to={`/loja/${pedido.lojaId}/pedidos/${pedido.id}`}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-300"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{pedido.numeroPedido}</p>
                <p className="text-xs text-slate-400">
                  {pedido.loja && pedido.lojaId !== lojaId ? `${pedido.loja.nome} · ` : ''}
                  {formatData(pedido.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{formatMoeda(pedido.totalFinal)}</p>
                <p className="text-xs text-slate-500">{t(`estadoPedido.${pedido.estado}`)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
