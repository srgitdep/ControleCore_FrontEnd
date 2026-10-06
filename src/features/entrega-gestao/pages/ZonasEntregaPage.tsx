import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, Loader2, MapPinOff, Pencil, Plus, Truck } from 'lucide-react';
import { cn, formatMoeda } from '@/shared/utils';
import {
  useActualizarConfiguracaoEntrega,
  useActualizarZona,
  useConfiguracaoEntrega,
  useCriarZona,
  useZonasEntrega,
} from '../hooks/useEntregaGestao';
import type { ConfiguracaoEntrega, ZonaEntrega } from '../types';

const classeCampo =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none';

/** «» → `undefined` (campo opcional por preencher); número inválido → `NaN`, apanhado ao gravar. */
const numeroOuUndefined = (valor: string) => (valor.trim() === '' ? undefined : Number(valor));

function CartaoConfiguracao({ configuracao }: { configuracao: ConfiguracaoEntrega }) {
  const { t } = useTranslation('entrega');
  const actualizar = useActualizarConfiguracaoEntrega();
  const [preparacao, setPreparacao] = useState(String(configuracao.tempoPreparacaoMinutos));
  const [raio, setRaio] = useState(configuracao.raioMaximoKm === null ? '' : String(configuracao.raioMaximoKm));

  const guardarParametros = () =>
    actualizar.mutate({
      tempoPreparacaoMinutos: Number(preparacao),
      raioMaximoKm: raio.trim() === '' ? null : Number(raio),
    });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{t('configuracao.titulo')}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{t('configuracao.ajuda')}</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={configuracao.entregaActiva}
            disabled={actualizar.isPending}
            onChange={(e) => actualizar.mutate({ entregaActiva: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300"
          />
          {configuracao.entregaActiva ? t('configuracao.activa') : t('configuracao.desactivada')}
        </label>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-slate-700">{t('configuracao.preparacao')}</label>
          <input
            type="number"
            min={0}
            value={preparacao}
            onChange={(e) => setPreparacao(e.target.value)}
            className={classeCampo}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">{t('configuracao.raio')}</label>
          <input
            type="number"
            min={0}
            step="0.1"
            value={raio}
            placeholder={t('configuracao.raio_sem_limite')}
            onChange={(e) => setRaio(e.target.value)}
            className={classeCampo}
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={guardarParametros}
            disabled={actualizar.isPending || Number.isNaN(Number(preparacao))}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {actualizar.isPending && <Loader2 size={14} className="animate-spin" />}
            {t('configuracao.guardar')}
          </button>
        </div>
      </div>

      <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">{t('configuracao.lojas')}</h3>
      <ul className="mt-2 divide-y divide-slate-100">
        {configuracao.lojas.map((loja) => (
          <li key={loja.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
            <span className="font-medium text-slate-800">{loja.nome}</span>
            <span className="flex flex-wrap items-center gap-3 text-xs">
              <span className={cn('inline-flex items-center gap-1', loja.temCoordenadas ? 'text-emerald-700' : 'text-amber-700')}>
                {loja.temCoordenadas ? <CheckCircle2 size={13} /> : <MapPinOff size={13} />}
                {loja.temCoordenadas ? t('configuracao.com_coordenadas') : t('configuracao.sem_coordenadas')}
              </span>
              <span className={loja.zonasActivas > 0 ? 'text-emerald-700' : 'text-amber-700'}>
                {t('configuracao.zonas_activas', { count: loja.zonasActivas })}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface FormularioZonaProps {
  lojaId: string;
  zona?: ZonaEntrega;
  aoFechar: () => void;
}

function FormularioZona({ lojaId, zona, aoFechar }: FormularioZonaProps) {
  const { t } = useTranslation('entrega');
  const criar = useCriarZona();
  const actualizar = useActualizarZona();

  const [nome, setNome] = useState(zona?.nome ?? '');
  const [de, setDe] = useState(zona ? String(zona.distanciaMinKm) : '0');
  const [ate, setAte] = useState(zona ? String(zona.distanciaMaxKm) : '');
  const [taxa, setTaxa] = useState(zona ? String(zona.taxa) : '');
  const [prazo, setPrazo] = useState(zona?.prazoMinutos != null ? String(zona.prazoMinutos) : '');
  const [minimo, setMinimo] = useState(zona?.valorMinimoPedido != null ? String(zona.valorMinimoPedido) : '');

  const aGuardar = criar.isPending || actualizar.isPending;
  const valido = nome.trim() !== '' && ate.trim() !== '' && taxa.trim() !== '';

  const submeter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valido) return;

    if (zona) {
      // Aqui o campo vazio é `null` (limpar), e não `undefined` (deixar como está).
      actualizar.mutate(
        {
          id: zona.id,
          payload: {
            nome: nome.trim(),
            distanciaMinKm: Number(de),
            distanciaMaxKm: Number(ate),
            taxa: Number(taxa),
            prazoMinutos: prazo.trim() === '' ? null : Number(prazo),
            valorMinimoPedido: minimo.trim() === '' ? null : Number(minimo),
          },
        },
        { onSuccess: aoFechar },
      );
      return;
    }

    criar.mutate(
      {
        lojaId,
        nome: nome.trim(),
        distanciaMinKm: numeroOuUndefined(de),
        distanciaMaxKm: Number(ate),
        taxa: Number(taxa),
        prazoMinutos: numeroOuUndefined(prazo),
        valorMinimoPedido: numeroOuUndefined(minimo),
      },
      { onSuccess: aoFechar },
    );
  };

  return (
    <form onSubmit={submeter} className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
      <h3 className="text-sm font-bold text-slate-900">{zona ? t('zonas.editar') : t('zonas.nova')}</h3>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <label className="block text-xs font-medium text-slate-700">{t('zonas.nome')}</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={80} className={classeCampo} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">{t('zonas.de_km')}</label>
          <input type="number" min={0} step="0.1" value={de} onChange={(e) => setDe(e.target.value)} className={classeCampo} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">{t('zonas.ate_km')}</label>
          <input type="number" min={0} step="0.1" value={ate} onChange={(e) => setAte(e.target.value)} required className={classeCampo} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">{t('zonas.taxa')}</label>
          <input type="number" min={0} step="0.01" value={taxa} onChange={(e) => setTaxa(e.target.value)} required className={classeCampo} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">{t('zonas.prazo')}</label>
          <input type="number" min={0} value={prazo} onChange={(e) => setPrazo(e.target.value)} className={classeCampo} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">{t('zonas.minimo')}</label>
          <input type="number" min={0} step="0.01" value={minimo} onChange={(e) => setMinimo(e.target.value)} className={classeCampo} />
        </div>
      </div>
      <p className="text-xs text-slate-500">{t('zonas.ajuda_faixa')}</p>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={aoFechar}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
        >
          {t('zonas.cancelar')}
        </button>
        <button
          type="submit"
          disabled={aGuardar || !valido}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {aGuardar && <Loader2 size={14} className="animate-spin" />}
          {t('zonas.guardar')}
        </button>
      </div>
    </form>
  );
}

function SeccaoZonas({ configuracao }: { configuracao: ConfiguracaoEntrega }) {
  const { t } = useTranslation('entrega');
  const lojas = configuracao.lojas;
  const [lojaEscolhida, setLojaEscolhida] = useState<string | null>(null);
  const lojaId = lojaEscolhida ?? lojas[0]?.id;
  const zonas = useZonasEntrega(lojaId);
  const actualizar = useActualizarZona();

  // `undefined` = fechado; `null` = zona nova; objecto = a editar.
  const [aEditar, setAEditar] = useState<ZonaEntrega | null | undefined>(undefined);

  if (!lojaId) {
    return <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">{t('zonas.sem_lojas')}</p>;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-slate-900">{t('zonas.titulo')}</h2>
        <div className="flex items-center gap-2">
          <select
            value={lojaId}
            onChange={(e) => {
              setLojaEscolhida(e.target.value);
              setAEditar(undefined);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            aria-label={t('zonas.loja')}
          >
            {lojas.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
          {aEditar === undefined && (
            <button
              type="button"
              onClick={() => setAEditar(null)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={14} />
              {t('zonas.nova')}
            </button>
          )}
        </div>
      </div>

      {aEditar !== undefined && (
        <div className="mt-4">
          <FormularioZona
            key={aEditar?.id ?? 'nova'}
            lojaId={lojaId}
            zona={aEditar ?? undefined}
            aoFechar={() => setAEditar(undefined)}
          />
        </div>
      )}

      <div className="mt-4">
        {zonas.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : zonas.isError ? (
          <p className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle size={16} />
            {t('zonas.erro_carregar')}
          </p>
        ) : zonas.data && zonas.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-3">{t('zonas.nome')}</th>
                  <th className="py-2 pr-3">{t('zonas.faixa')}</th>
                  <th className="py-2 pr-3">{t('zonas.taxa')}</th>
                  <th className="py-2 pr-3">{t('zonas.prazo_curto')}</th>
                  <th className="py-2 pr-3">{t('zonas.minimo_curto')}</th>
                  <th className="py-2 pr-3">{t('zonas.estado')}</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {zonas.data.map((z) => (
                  <tr key={z.id} className={cn(!z.activa && 'text-slate-400')}>
                    <td className="py-2.5 pr-3 font-medium">{z.nome}</td>
                    <td className="py-2.5 pr-3">
                      {z.distanciaMinKm}–{z.distanciaMaxKm} km
                    </td>
                    <td className="py-2.5 pr-3">{formatMoeda(z.taxa)}</td>
                    <td className="py-2.5 pr-3">{z.prazoMinutos != null ? `${z.prazoMinutos} min` : '—'}</td>
                    <td className="py-2.5 pr-3">{z.valorMinimoPedido != null ? formatMoeda(z.valorMinimoPedido) : '—'}</td>
                    <td className="py-2.5 pr-3">
                      <button
                        type="button"
                        disabled={actualizar.isPending}
                        onClick={() => actualizar.mutate({ id: z.id, payload: { activa: !z.activa } })}
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs font-semibold disabled:opacity-50',
                          z.activa ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600',
                        )}
                      >
                        {z.activa ? t('zonas.activa') : t('zonas.inactiva')}
                      </button>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setAEditar(z)}
                        aria-label={t('zonas.editar')}
                        className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                      >
                        <Pencil size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            {t('zonas.nenhuma')}
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * As zonas e taxas da entrega ao domicílio (Docs/plano_implementacao.md §4.1, US-02).
 *
 * A taxa decide-se pela **distância em linha recta** da loja à morada, em faixas
 * `[de, até)` por loja — as províncias não entram na conta. O servidor recusa faixas que
 * se sobreponham, por isso o erro vem com a explicação e não precisa de ser repetido aqui.
 */
export function ZonasEntregaPage() {
  const { t } = useTranslation('entrega');
  const configuracao = useConfiguracaoEntrega();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
          <Truck size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t('titulo')}</h1>
          <p className="text-sm text-slate-500">{t('subtitulo')}</p>
        </div>
      </header>

      {configuracao.isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 size={22} className="animate-spin text-slate-400" />
        </div>
      ) : configuracao.isError || !configuracao.data ? (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle size={16} />
          {t('mensagens.erro_carregar')}
        </p>
      ) : (
        <>
          <CartaoConfiguracao configuracao={configuracao.data} />
          <SeccaoZonas configuracao={configuracao.data} />
        </>
      )}
    </div>
  );
}
