import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Webhook,
  XCircle,
} from 'lucide-react';
import { cn, formatDataHora } from '@/shared/utils';
import {
  useActualizarSubscricao,
  useApagarSubscricao,
  useCriarSubscricao,
  useEnviosWebhook,
  useReenviarEnvio,
  useRodarSegredo,
  useSubscricoesWebhook,
  useTestarSubscricao,
} from '../hooks/useWebhooks';
import { ConfirmarDialog, SegredoDialog, SubscricaoDialog } from '../components/DialogosWebhook';
import type { EstadoEnvio, ResultadoDoTeste, SubscricaoWebhook } from '../types/webhook';

const COR_ESTADO: Record<EstadoEnvio, string> = {
  PENDENTE: 'bg-slate-100 text-slate-700',
  ENVIADO: 'bg-emerald-100 text-emerald-800',
  FALHADO: 'bg-amber-100 text-amber-800',
  DESISTIDO: 'bg-rose-100 text-rose-800',
};

type Dialogo =
  | { tipo: 'criar' }
  | { tipo: 'editar'; sub: SubscricaoWebhook }
  | { tipo: 'segredo'; segredo: string }
  | { tipo: 'apagar'; sub: SubscricaoWebhook }
  | { tipo: 'rodar'; sub: SubscricaoWebhook };

/**
 * Os webhooks da entrega (Fase 6): para onde se avisa quando um pedido ou uma entrega muda, e o que já
 * foi enviado. Só ADMIN (`GERIR_WEBHOOKS`) — o servidor volta a exigi-lo.
 */
export function WebhooksPage() {
  const { t } = useTranslation('entrega');
  const lista = useSubscricoesWebhook();
  const criar = useCriarSubscricao();
  const actualizar = useActualizarSubscricao();
  const apagar = useApagarSubscricao();
  const rodar = useRodarSegredo();
  const testar = useTestarSubscricao();

  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const [aberta, setAberta] = useState<string | null>(null);
  const [testes, setTestes] = useState<Record<string, ResultadoDoTeste>>({});
  const fechar = () => setDialogo(null);

  const subscricoes = lista.data ?? [];

  const fazerTeste = (id: string) =>
    testar.mutate(id, { onSuccess: (r) => setTestes((anteriores) => ({ ...anteriores, [id]: r })) });

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Webhook size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t('webhooks.titulo')}</h1>
            <p className="text-sm text-slate-500">{t('webhooks.subtitulo')}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDialogo({ tipo: 'criar' })}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          {t('webhooks.novo')}
        </button>
      </header>

      {lista.isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 size={22} className="animate-spin text-slate-400" />
        </div>
      ) : lista.isError ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle size={16} />
          {t('webhooks.erro')}
          <button type="button" onClick={() => void lista.refetch()} className="font-semibold underline">
            {t('painel.repetir')}
          </button>
        </div>
      ) : subscricoes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Webhook size={32} className="mx-auto text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">{t('webhooks.vazio')}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {subscricoes.map((s) => (
            <li key={s.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    {s.descricao}
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                        s.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500',
                      )}
                    >
                      {s.isActive ? t('webhooks.activo') : t('webhooks.inactivo')}
                    </span>
                  </p>
                  <p className="mt-0.5 break-all font-mono text-xs text-slate-500">{s.url}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {t('webhooks.segredo_rotulo')}: <span className="font-mono">{s.segredoMascarado}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => fazerTeste(s.id)}
                    disabled={!s.isActive || testar.isPending}
                    title={s.isActive ? undefined : t('webhooks.testar_inactivo')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {testar.isPending && testar.variables === s.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Send size={13} />
                    )}
                    {t('webhooks.testar')}
                  </button>
                  <button
                    type="button"
                    onClick={() => actualizar.mutate({ id: s.id, payload: { isActive: !s.isActive } })}
                    disabled={actualizar.isPending}
                    className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {s.isActive ? t('webhooks.desactivar') : t('webhooks.activar')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDialogo({ tipo: 'editar', sub: s })}
                    aria-label={t('webhooks.editar')}
                    className="rounded-lg border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-50"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDialogo({ tipo: 'rodar', sub: s })}
                    aria-label={t('webhooks.rodar_segredo')}
                    title={t('webhooks.rodar_segredo')}
                    className="rounded-lg border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-50"
                  >
                    <KeyRound size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDialogo({ tipo: 'apagar', sub: s })}
                    aria-label={t('webhooks.apagar')}
                    className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                {s.eventos.length === 0 ? (
                  <span className="text-xs text-amber-700">{t('webhooks.sem_eventos')}</span>
                ) : (
                  s.eventos.map((e) => (
                    <span key={e} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">
                      {e}
                    </span>
                  ))
                )}
              </div>

              {testes[s.id] && (
                <p
                  className={cn(
                    'mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs',
                    testes[s.id]!.sucesso ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800',
                  )}
                  role="status"
                >
                  {testes[s.id]!.sucesso ? (
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                  ) : (
                    <XCircle size={14} className="mt-0.5 shrink-0" />
                  )}
                  {testes[s.id]!.sucesso
                    ? t('webhooks.teste_ok')
                    : t('webhooks.teste_falhou', { erro: testes[s.id]!.ultimoErro ?? '—' })}
                </p>
              )}

              <button
                type="button"
                onClick={() => setAberta(aberta === s.id ? null : s.id)}
                aria-expanded={aberta === s.id}
                className="mt-3 text-xs font-semibold text-blue-700 hover:underline"
              >
                {aberta === s.id ? t('webhooks.esconder_envios') : t('webhooks.ver_envios')}
              </button>
              {aberta === s.id && <Envios subscricaoId={s.id} />}
            </li>
          ))}
        </ul>
      )}

      {(dialogo?.tipo === 'criar' || dialogo?.tipo === 'editar') && (
        <SubscricaoDialog
          {...(dialogo.tipo === 'editar' ? { inicial: dialogo.sub } : {})}
          aProcessar={criar.isPending || actualizar.isPending}
          aoFechar={fechar}
          aoConfirmar={(dados) => {
            if (dialogo.tipo === 'criar') {
              criar.mutate(dados, { onSuccess: (nova) => setDialogo({ tipo: 'segredo', segredo: nova.segredo }) });
            } else {
              actualizar.mutate({ id: dialogo.sub.id, payload: dados }, { onSuccess: fechar });
            }
          }}
        />
      )}
      {dialogo?.tipo === 'segredo' && <SegredoDialog segredo={dialogo.segredo} aoFechar={fechar} />}
      {dialogo?.tipo === 'apagar' && (
        <ConfirmarDialog
          titulo={t('webhooks.apagar_titulo', { nome: dialogo.sub.descricao })}
          texto={t('webhooks.apagar_texto')}
          confirmar={t('webhooks.apagar')}
          aProcessar={apagar.isPending}
          aoFechar={fechar}
          aoConfirmar={() => apagar.mutate(dialogo.sub.id, { onSuccess: fechar })}
        />
      )}
      {dialogo?.tipo === 'rodar' && (
        <ConfirmarDialog
          titulo={t('webhooks.rodar_titulo')}
          texto={t('webhooks.rodar_texto')}
          confirmar={t('webhooks.rodar_segredo')}
          aProcessar={rodar.isPending}
          aoFechar={fechar}
          aoConfirmar={() => rodar.mutate(dialogo.sub.id, { onSuccess: (r) => setDialogo({ tipo: 'segredo', segredo: r.segredo }) })}
        />
      )}
    </div>
  );
}

/** O histórico de envios de uma subscrição: estado, tentativas, último erro e «reenviar». */
function Envios({ subscricaoId }: { subscricaoId: string }) {
  const { t } = useTranslation('entrega');
  const [pagina, setPagina] = useState(1);
  const envios = useEnviosWebhook(subscricaoId, pagina);
  const reenviar = useReenviarEnvio();

  if (envios.isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 size={18} className="animate-spin text-slate-400" />
      </div>
    );
  }
  if (envios.isError) {
    return (
      <p className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
        <AlertTriangle size={14} />
        {t('webhooks.envios.erro')}
        <button type="button" onClick={() => void envios.refetch()} className="font-semibold underline">
          {t('painel.repetir')}
        </button>
      </p>
    );
  }

  const dados = envios.data;
  if (!dados || dados.data.length === 0) {
    return <p className="mt-3 rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">{t('webhooks.envios.vazio')}</p>;
  }

  const totalPaginas = Math.max(1, Math.ceil(dados.total / dados.limite));

  return (
    <div className="mt-3">
      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
        {dados.data.map((e) => (
          <li key={e.id} className="flex flex-wrap items-start justify-between gap-2 px-3 py-2.5 text-xs">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-slate-800">{e.evento}</span>
                <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', COR_ESTADO[e.estado])}>
                  {t(`webhooks.envios.estado.${e.estado}`)}
                </span>
                <span className="text-slate-400">
                  {t('webhooks.envios.tentativas', { count: e.tentativas })} · {formatDataHora(e.createdAt)}
                </span>
              </p>
              {e.ultimoErro && <p className="mt-1 break-words text-rose-700">{e.ultimoErro}</p>}
              {e.estado === 'FALHADO' && e.proximaTentativaEm && (
                <p className="mt-0.5 text-slate-500">
                  {t('webhooks.envios.proxima', { quando: formatDataHora(e.proximaTentativaEm) })}
                </p>
              )}
            </div>
            {(e.estado === 'FALHADO' || e.estado === 'DESISTIDO') && (
              <button
                type="button"
                onClick={() => reenviar.mutate(e.id)}
                disabled={reenviar.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw size={12} />
                {t('webhooks.envios.reenviar')}
              </button>
            )}
          </li>
        ))}
      </ul>

      {totalPaginas > 1 && (
        <div className="mt-2 flex items-center justify-end gap-2 text-xs text-slate-500">
          <button
            type="button"
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina <= 1}
            aria-label={t('webhooks.envios.anterior')}
            className="rounded-lg border border-slate-300 p-1 disabled:opacity-40"
          >
            <ChevronLeft size={14} />
          </button>
          {pagina} / {totalPaginas}
          <button
            type="button"
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina >= totalPaginas}
            aria-label={t('webhooks.envios.seguinte')}
            className="rounded-lg border border-slate-300 p-1 disabled:opacity-40"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
