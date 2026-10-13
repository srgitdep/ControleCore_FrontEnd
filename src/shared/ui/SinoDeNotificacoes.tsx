import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Bell, BellRing, CheckCheck, Loader2, Radio } from 'lucide-react';
import { cn, formatDataRelativa } from '@/shared/utils';
import { destinoDaNotificacao, textoDaNotificacao } from '@/shared/notificacoes/texto';
import type { FonteDeNotificacoes, Notificacao } from '@/shared/notificacoes/tipos';
import { useNotificacoes } from '@/shared/notificacoes/useNotificacoes';

interface Props {
  fonte: FonteDeNotificacoes;
  /** Para onde levar uma notificação ao tocar nela; por omissão, o destino do tipo de utilizador. */
  destinoDe?: (n: Notificacao) => string | null;
  /** «Ver todas»: a página com a lista inteira (o cliente tem uma). */
  verTodasHref?: string;
  className?: string;
  /** O painel cola-se ao lado direito (cabeçalhos) ou ao esquerdo (o sino à direita do ecrã). */
  alinhamento?: 'direita' | 'esquerda';
  /**
   * Uma segunda secção no mesmo painel (a gestão junta aqui os alertas de reposição). Soma-se ao número do sino:
   * dois sinos lado a lado, para duas listas de «coisas por ver», era o que confundia.
   */
  secaoExtra?: { contagem: number; render: (fechar: () => void) => ReactNode };
}

/**
 * O sino das notificações (plano §4.7), o mesmo para o cliente, a gestão e o estafeta: o número por ler, a lista
 * das mais recentes, «marcar todas como lidas» e, ao tocar numa, vai-se ao pedido ou à entrega.
 *
 * Os quatro estados (a carregar, erro, vazio, com notificações) estão tratados; o número tem `aria-live` para
 * quem usa leitor de ecrã saber que chegou algo.
 */
export function SinoDeNotificacoes({ fonte, destinoDe, verTodasHref, className, alinhamento = 'direita', secaoExtra }: Props) {
  const { t } = useTranslation('notificacoes');
  const navegar = useNavigate();
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const { naoLidas, lista, marcarLida, marcarTodasLidas, ligado } = useNotificacoes(fonte, aberto);

  // Fecha ao clicar fora e com Esc.
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false);
    };
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false);
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', tecla);
    };
  }, [aberto]);

  if (!fonte.activo) return null;

  const traduzir = ((c: string, o?: Record<string, unknown>) => t(c as never, o as never)) as never;
  const abrir = (n: Notificacao) => {
    if (!n.lidaEm) marcarLida.mutate(n.id);
    const destino = (destinoDe ?? destinoDaNotificacao)(n);
    setAberto(false);
    if (destino) navegar(destino);
  };
  const itens = lista.data?.data ?? [];
  const total = naoLidas + (secaoExtra?.contagem ?? 0);

  return (
    <div ref={raiz} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label={`${t('ui.abrir')}${total > 0 ? ` — ${t('ui.por_ler', { count: total })}` : ''}`}
        aria-expanded={aberto}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      >
        {total > 0 ? <BellRing size={20} className="text-blue-600" /> : <Bell size={20} />}
        <span aria-live="polite" className="contents">
          {total > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {total > 9 ? '9+' : total}
            </span>
          )}
        </span>
      </button>

      {aberto && (
        <div
          role="dialog"
          aria-label={t('ui.titulo')}
          className={cn(
            'absolute top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl',
            alinhamento === 'direita' ? 'right-0' : 'left-0',
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              {t('ui.titulo')}
              {ligado && (
                <span title={t('ui.ao_vivo')} className="inline-flex items-center text-emerald-600">
                  <Radio size={12} className="animate-pulse" />
                </span>
              )}
            </p>
            {naoLidas > 0 && (
              <button
                type="button"
                onClick={() => marcarTodasLidas.mutate()}
                disabled={marcarTodasLidas.isPending}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline disabled:opacity-50"
              >
                <CheckCheck size={13} />
                {t('ui.marcar_todas')}
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {lista.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={18} className="animate-spin text-slate-300" />
              </div>
            ) : lista.isError ? (
              <p className="flex flex-wrap items-center gap-2 px-4 py-5 text-xs text-red-700">
                <AlertTriangle size={14} />
                {t('ui.erro')}
                <button type="button" onClick={() => void lista.refetch()} className="font-semibold underline">
                  {t('ui.repetir')}
                </button>
              </p>
            ) : itens.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">{t('ui.vazio')}</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {itens.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => abrir(n)}
                      className={cn('flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50', !n.lidaEm && 'bg-blue-50/50')}
                    >
                      <span
                        aria-hidden="true"
                        className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.lidaEm ? 'bg-transparent' : 'bg-blue-600')}
                      />
                      <span className="min-w-0">
                        <span className={cn('block text-sm text-slate-800', !n.lidaEm && 'font-semibold')}>
                          {textoDaNotificacao(n, traduzir)}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-400">{formatDataRelativa(n.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {secaoExtra && <div className="border-t border-slate-100">{secaoExtra.render(() => setAberto(false))}</div>}

          {verTodasHref && itens.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setAberto(false);
                navegar(verTodasHref);
              }}
              className="w-full border-t border-slate-100 px-4 py-2.5 text-center text-xs font-semibold text-blue-700 hover:bg-slate-50"
            >
              {t('ui.ver_todas')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
