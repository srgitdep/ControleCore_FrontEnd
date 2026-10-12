import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCheck, Loader2 } from 'lucide-react';
import { cn, formatDataHora } from '@/shared/utils';
import { destinoDaNotificacao, textoDaNotificacao } from '@/shared/notificacoes/texto';
import { useNotificacoes } from '@/shared/notificacoes/useNotificacoes';
import { useContaClienteStore } from '../store/useContaClienteStore';
import { useFonteDoCliente } from '../hooks/useFonteDoCliente';
import { LojaTopo } from '../components/LojaTopo';
import { VoltarLink } from '../components/VoltarLink';

/**
 * Todas as notificações do cliente, de todas as lojas (plano §4.7): o que aconteceu com cada pedido e entrega,
 * da mais recente para a mais antiga, com «Ver mais» em vez de páginas. A mesma lista do sino, inteira.
 */
export function NotificacoesPage() {
  const { lojaId } = useParams<{ lojaId: string }>();
  const { t } = useTranslation('notificacoes');
  const { t: tLoja } = useTranslation('loja');
  const navegar = useNavigate();
  const { autenticado, aCarregar } = useContaClienteStore();
  const fonte = useFonteDoCliente();
  const [pagina, setPagina] = useState(1);
  const { lista, naoLidas, marcarLida, marcarTodasLidas } = useNotificacoes(fonte, true, pagina);

  if (!lojaId) return null;
  if (!aCarregar && !autenticado) return <Navigate to={`/loja/${lojaId}/entrar`} replace />;

  const traduzir = ((c: string, o?: Record<string, unknown>) => t(c as never, o as never)) as never;
  const itens = lista.data?.data ?? [];
  const total = lista.data?.total ?? 0;
  const haMais = itens.length < total;

  return (
    <div>
      <LojaTopo lojaId={lojaId} />
      <div className="cc-caixa max-w-xl py-8">
        <VoltarLink to={`/loja/${lojaId}`}>{tLoja('notificacoes.voltar')}</VoltarLink>

        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-slate-900">{tLoja('notificacoes.titulo')}</h1>
          {naoLidas > 0 && (
            <button
              type="button"
              onClick={() => marcarTodasLidas.mutate()}
              disabled={marcarTodasLidas.isPending}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:underline disabled:opacity-50"
            >
              <CheckCheck size={14} />
              {t('ui.marcar_todas')}
            </button>
          )}
        </div>

        {lista.isLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 size={22} className="animate-spin text-slate-400" />
          </div>
        ) : lista.isError ? (
          <p className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle size={16} />
            {t('ui.erro')}
            <button type="button" onClick={() => void lista.refetch()} className="font-semibold underline">
              {t('ui.repetir')}
            </button>
          </p>
        ) : itens.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            {t('ui.vazio')}
          </p>
        ) : (
          <>
            <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {itens.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!n.lidaEm) marcarLida.mutate(n.id);
                      const destino = destinoDaNotificacao(n);
                      if (destino) navegar(destino);
                    }}
                    className={cn('flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-slate-50', !n.lidaEm && 'bg-blue-50/50')}
                  >
                    <span aria-hidden="true" className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.lidaEm ? 'bg-transparent' : 'bg-blue-600')} />
                    <span className="min-w-0">
                      <span className={cn('block text-sm text-slate-800', !n.lidaEm && 'font-semibold')}>{textoDaNotificacao(n, traduzir)}</span>
                      <span className="mt-0.5 block text-xs text-slate-400">{formatDataHora(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {haMais && (
              <button
                type="button"
                onClick={() => setPagina((p) => p + 1)}
                disabled={lista.isFetching}
                className="mt-3 w-full rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {t('ui.mais')}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
