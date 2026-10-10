import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ArrowLeft, Loader2, MapPin, Navigation, Phone } from 'lucide-react';
import { cn, formatDataHora, formatMoeda } from '@/shared/utils';
import { EntregarFolha } from '../components/EntregarFolha';
import { EstadoDaEntrega } from '../components/EstadoDaEntrega';
import { FalharFolha } from '../components/FalharFolha';
import { accaoPrincipal, accoesPossiveis, ligacaoMapa, ligacaoTelefone } from '../domain/passos';
import { useAccoesDaEntrega, useMinhaEntrega, useOnline } from '../hooks/useEstafeta';

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
      <dt className="shrink-0 text-slate-500">{rotulo}</dt>
      <dd className="min-w-0 text-right font-medium text-slate-900">{children}</dd>
    </div>
  );
}

/**
 * Uma entrega: para onde ir, para quem ligar, o que cobrar — e os passos, um botão grande por vez.
 * O servidor é quem decide o que é permitido; aqui só se mostra o que dá certo (`accoesPossiveis`).
 */
export function EntregaPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('estafeta');
  const entrega = useMinhaEntrega(id);
  const accoes = useAccoesDaEntrega(id ?? '');
  const online = useOnline();
  const [folha, setFolha] = useState<'entregar' | 'falhar' | null>(null);

  const Voltar = (
    <Link to="/estafeta" className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-slate-500">
      <ArrowLeft size={16} />
      {t('voltar')}
    </Link>
  );

  if (entrega.isLoading) {
    return (
      <div>
        {Voltar}
        <div className="flex justify-center py-16">
          <Loader2 size={26} className="animate-spin text-slate-300" />
        </div>
      </div>
    );
  }

  if (entrega.isError || !entrega.data) {
    // 404 também quando é de outro estafeta: o servidor não distingue, e isto também não.
    return (
      <div>
        {Voltar}
        <p className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle size={16} className="shrink-0" />
          {t('entrega_nao_encontrada')}
        </p>
      </div>
    );
  }

  const e = entrega.data;
  const possiveis = accoesPossiveis(e.estado);
  const principal = accaoPrincipal(e.estado);
  const aProcessar =
    accoes.recolher.isPending || accoes.iniciarRota.isPending || accoes.entregar.isPending || accoes.falhar.isPending;

  const fecharFolha = () => setFolha(null);

  return (
    <div className={cn(possiveis.length > 0 && 'pb-44')}>
      {Voltar}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{e.pedido.numeroPedido}</h1>
          <p className="text-sm text-slate-500">{e.loja.nome}</p>
        </div>
        <EstadoDaEntrega estado={e.estado} />
      </div>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          <MapPin size={14} />
          {t('detalhe.morada')}
        </h2>
        <p className="mt-2 text-base font-medium text-slate-900">{e.destinoMorada}</p>
        <a
          href={ligacaoMapa(e.destinoLatitude, e.destinoLongitude)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-50 text-sm font-bold text-blue-700 active:bg-blue-100"
        >
          <Navigation size={16} />
          {t('detalhe.abrir_mapa')}
        </a>
      </section>

      {(e.contactoNome || e.contactoTelefone) && (
        <section className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">{t('detalhe.cliente')}</h2>
          {e.contactoNome && <p className="mt-2 text-base font-medium text-slate-900">{e.contactoNome}</p>}
          {e.contactoTelefone && (
            <a
              href={ligacaoTelefone(e.contactoTelefone)}
              className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700 active:bg-emerald-100"
            >
              <Phone size={16} />
              {t('detalhe.ligar', { telefone: e.contactoTelefone })}
            </a>
          )}
        </section>
      )}

      <dl className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-4">
        <Linha rotulo={t('detalhe.a_cobrar')}>
          {e.valorACobrar > 0 ? <span className="text-base font-extrabold">{formatMoeda(e.valorACobrar)}</span> : t('detalhe.ja_pago')}
        </Linha>
        {e.taxa > 0 && <Linha rotulo={t('detalhe.taxa')}>{formatMoeda(e.taxa)}</Linha>}
        {e.prazoPrevistoEm && <Linha rotulo={t('detalhe.prazo')}>{formatDataHora(e.prazoPrevistoEm)}</Linha>}
        {e.valorCobrado !== null && <Linha rotulo={t('detalhe.cobrado')}>{formatMoeda(e.valorCobrado)}</Linha>}
        {e.motivoFalha && <Linha rotulo={t('detalhe.motivo')}>{t(`motivo.${e.motivoFalha}` as 'motivo.OUTRO')}</Linha>}
      </dl>

      {e.estado === 'FALHADA' && <p className="mt-3 rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">{t('detalhe.falhada_ajuda')}</p>}

      {possiveis.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-4 backdrop-blur">
          <div className="mx-auto max-w-lg space-y-2">
            {!online && <p className="text-center text-xs font-medium text-amber-700">{t('sem_ligacao_accao')}</p>}

            {principal === 'recolher' && (
              <button
                type="button"
                disabled={aProcessar || !online}
                onClick={() => accoes.recolher.mutate()}
                className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-base font-bold text-white disabled:opacity-50"
              >
                {accoes.recolher.isPending && <Loader2 size={18} className="animate-spin" />}
                {t('accoes.recolher')}
              </button>
            )}

            {principal === 'iniciar_rota' && (
              <button
                type="button"
                disabled={aProcessar || !online}
                onClick={() => accoes.iniciarRota.mutate()}
                className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-base font-bold text-white disabled:opacity-50"
              >
                {accoes.iniciarRota.isPending && <Loader2 size={18} className="animate-spin" />}
                {t('accoes.iniciar_rota')}
              </button>
            )}

            {possiveis.includes('entregar') && (
              <button
                type="button"
                disabled={aProcessar || !online}
                onClick={() => setFolha('entregar')}
                className={cn(
                  'flex min-h-14 w-full items-center justify-center rounded-2xl text-base font-bold disabled:opacity-50',
                  principal === 'entregar' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700',
                )}
              >
                {t('accoes.entregar')}
              </button>
            )}

            {possiveis.includes('falhar') && (
              <button
                type="button"
                disabled={aProcessar || !online}
                onClick={() => setFolha('falhar')}
                className="flex min-h-12 w-full items-center justify-center rounded-2xl text-sm font-semibold text-rose-600 disabled:opacity-50"
              >
                {t('accoes.falhar')}
              </button>
            )}
          </div>
        </div>
      )}

      {folha === 'entregar' && (
        <EntregarFolha
          valorACobrar={e.valorACobrar}
          aProcessar={accoes.entregar.isPending}
          aoFechar={fecharFolha}
          aoConfirmar={(dados) => accoes.entregar.mutate(dados, { onSuccess: fecharFolha })}
        />
      )}

      {folha === 'falhar' && (
        <FalharFolha
          aProcessar={accoes.falhar.isPending}
          aoFechar={fecharFolha}
          aoConfirmar={(dados) => accoes.falhar.mutate(dados, { onSuccess: fecharFolha })}
        />
      )}
    </div>
  );
}
