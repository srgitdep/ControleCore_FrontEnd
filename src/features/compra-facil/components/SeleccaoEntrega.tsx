import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Loader2, MapPin, Plus, Store, Truck } from 'lucide-react';
import { cn, formatMoeda } from '@/shared/utils';
import { textoMotivoEntrega } from '../utils/motivoEntrega';
import type { CotacaoEntrega, EnderecoCliente } from '../api/entrega.api';
import type { TipoEntregaPedido } from '../api/pedidos.api';

interface SeleccaoEntregaProps {
  lojaId: string;
  tipo: TipoEntregaPedido;
  aoMudarTipo: (tipo: TipoEntregaPedido) => void;
  enderecos: EnderecoCliente[];
  aCarregarEnderecos: boolean;
  enderecoId: string | null;
  aoEscolherEndereco: (id: string) => void;
  cotacao: CotacaoEntrega | undefined;
  aCotar: boolean;
  erroCotacao: boolean;
}

/**
 * Levantar na loja ou receber em casa. O ecrã só é montado quando a loja oferece entrega
 * (`entregaDisponivel`): uma loja sem ela mostra o checkout de sempre, sem opções a mais.
 *
 * Mostra sempre o que a cotação diz — taxa e prazo se for possível, uma frase concreta se
 * não (porquê e o que falta). O valor aqui é informativo: o servidor volta a cotar ao criar
 * o pedido.
 */
export function SeleccaoEntrega({
  lojaId,
  tipo,
  aoMudarTipo,
  enderecos,
  aCarregarEnderecos,
  enderecoId,
  aoEscolherEndereco,
  cotacao,
  aCotar,
  erroCotacao,
}: SeleccaoEntregaProps) {
  const { t } = useTranslation('loja');

  const opcoes: { valor: TipoEntregaPedido; icone: typeof Store; rotulo: string }[] = [
    { valor: 'LEVANTAMENTO', icone: Store, rotulo: t('entrega.levantar') },
    { valor: 'ENTREGA', icone: Truck, rotulo: t('entrega.entregar') },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">{t('entrega.titulo')}</h2>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        {opcoes.map(({ valor, icone: Icone, rotulo }) => {
          const seleccionado = tipo === valor;
          return (
            <label
              key={valor}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-colors',
                seleccionado ? 'border-blue-600 bg-blue-50/60' : 'border-slate-200 hover:border-slate-300',
              )}
            >
              <input
                type="radio"
                name="tipoEntrega"
                value={valor}
                checked={seleccionado}
                onChange={() => aoMudarTipo(valor)}
                className="sr-only"
              />
              <Icone size={20} className={seleccionado ? 'text-blue-700' : 'text-slate-400'} />
              <span className={cn('text-sm font-semibold', seleccionado ? 'text-blue-700' : 'text-slate-600')}>
                {rotulo}
              </span>
            </label>
          );
        })}
      </div>

      {tipo === 'ENTREGA' && (
        <div className="mt-4">
          <h3 className="text-xs font-semibold text-slate-700">{t('entrega.morada')}</h3>

          {aCarregarEnderecos ? (
            <div className="mt-2 h-16 animate-pulse rounded-xl bg-slate-100" />
          ) : enderecos.length === 0 ? (
            <div className="mt-2 rounded-xl border border-dashed border-slate-300 p-4 text-center">
              <MapPin size={20} className="mx-auto text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">{t('entrega.sem_moradas')}</p>
              <Link
                to={`/loja/${lojaId}/moradas`}
                state={{ de: `/loja/${lojaId}/checkout` }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
              >
                <Plus size={13} />
                {t('moradas.nova')}
              </Link>
            </div>
          ) : (
            <>
              <ul className="mt-2 space-y-2">
                {enderecos.map((e) => (
                  <li key={e.id}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-xl border-2 px-3 py-3',
                        enderecoId === e.id ? 'border-blue-600 bg-blue-50/60' : 'border-slate-200 hover:border-slate-300',
                      )}
                    >
                      <input
                        type="radio"
                        name="enderecoId"
                        checked={enderecoId === e.id}
                        onChange={() => aoEscolherEndereco(e.id)}
                        className="mt-1"
                      />
                      <span className="min-w-0 text-sm">
                        <span className="block font-semibold text-slate-900">{e.rotulo ?? e.linha1}</span>
                        <span className="block text-slate-600">
                          {e.linha1}
                          {e.bairro ? `, ${e.bairro}` : ''} · {e.cidade}
                        </span>
                        {e.referencia && <span className="block text-xs text-slate-400">{e.referencia}</span>}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <Link
                to={`/loja/${lojaId}/moradas`}
                state={{ de: `/loja/${lojaId}/checkout` }}
                className="mt-2 inline-block text-xs font-medium text-blue-700 hover:underline"
              >
                {t('entrega.gerir_moradas')}
              </Link>
            </>
          )}

          {enderecoId && (
            <div className="mt-4" aria-live="polite">
              {aCotar ? (
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 size={14} className="animate-spin" />
                  {t('entrega.a_calcular')}
                </p>
              ) : erroCotacao ? (
                <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  {t('entrega.erro_cotacao')}
                </p>
              ) : cotacao?.disponivel ? (
                <p className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  <span>
                    {t('entrega.taxa')}: <strong>{formatMoeda(cotacao.taxa)}</strong>
                  </span>
                  {cotacao.prazoMinutos !== null && (
                    <span>{t('entrega.prazo', { minutos: cotacao.prazoMinutos })}</span>
                  )}
                </p>
              ) : cotacao ? (
                <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  {textoMotivoEntrega(t, cotacao.motivo)}
                </p>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
