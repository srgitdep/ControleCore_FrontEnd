import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, ExternalLink, Info, Mail, MapPin, Phone, UserRound } from 'lucide-react';
import { formatData, formatMoeda } from '@/shared/utils';
import { diferencasDaCopia, ligacaoAoMapa } from '../domain/copia-do-cliente';
import type { PedidoCommerceGestao } from '../types/pedido-commerce-gestao.types';

/**
 * Quem pede, com o máximo que o cliente deu (plano §4.13, D4).
 *
 * Mostra os dados **actuais** do cliente — o que o cadastro diz hoje — e, quando o que ele tinha dado **neste**
 * pedido já não bate certo (mudou o telefone, por exemplo), diz o que ficou registado. A morada de entrega, com o
 * contacto e uma ligação ao mapa, vem a seguir; a do registo só se mostra se mudou.
 */
export function DadosDoClienteDoPedido({ pedido }: { pedido: PedidoCommerceGestao }) {
  const { t } = useTranslation('lojaGestao');
  const navigate = useNavigate();
  const c = pedido.cliente;
  const diferencas = diferencasDaCopia(pedido);

  const entrega = pedido.tipoEntrega === 'ENTREGA';
  const morada = pedido.endereco;
  const registada = pedido.enderecoSnapshot;
  // A morada do registo só se destaca se difere da de hoje (ou se a de hoje já não existe).
  const moradaMudou =
    entrega &&
    registada !== null &&
    !pedido.snapshotAproximado &&
    (!morada ||
      registada.linha1 !== morada.linha1 ||
      registada.cidade !== morada.cidade ||
      (registada.contactoTelefone ?? '') !== (morada.contactoTelefone ?? ''));
  const mapa = ligacaoAoMapa(morada ?? registada);

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <UserRound size={12} />
            {t('drawer.cliente.titulo')}
          </p>
          <p className="mt-1 truncate text-base font-semibold text-slate-900">{c.nome}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/crm?cliente=${encodeURIComponent(c.id)}`)}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          <ExternalLink size={12} />
          {t('drawer.cliente.ver_no_crm')}
        </button>
      </div>

      <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="flex items-center gap-1 text-[11px] text-slate-400">
            <Phone size={11} />
            {t('drawer.cliente.telefone')}
          </dt>
          <dd className="text-slate-800">{c.telefone ?? <span className="text-slate-400">{t('drawer.sem_telefone')}</span>}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-[11px] text-slate-400">
            <Mail size={11} />
            {t('drawer.cliente.email')}
          </dt>
          <dd className="break-all text-slate-800">{c.email ?? <span className="text-slate-400">—</span>}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-slate-400">{t('drawer.cliente.nuit')}</dt>
          <dd className="text-slate-800">{c.nuit ?? <span className="text-slate-400">—</span>}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-slate-400">{t('drawer.cliente.compras_online')}</dt>
          <dd className="text-slate-800">
            {c.comprasOnline.pedidos === 0
              ? t('drawer.cliente.sem_compras')
              : t('drawer.cliente.resumo_compras', {
                  count: c.comprasOnline.pedidos,
                  total: formatMoeda(c.comprasOnline.total),
                })}
            {c.comprasOnline.ultimoPedidoEm && (
              <span className="block text-xs text-slate-400">
                {t('drawer.cliente.ultimo_pedido', { data: formatData(c.comprasOnline.ultimoPedidoEm) })}
              </span>
            )}
          </dd>
        </div>
      </dl>

      {c.conta && (
        <p className="flex flex-wrap items-center gap-1.5 text-xs">
          {c.conta.emailVerificado && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
              <BadgeCheck size={11} />
              {t('drawer.cliente.email_verificado')}
            </span>
          )}
          {c.conta.viaGoogle && <span className="rounded-full bg-sky-50 px-2 py-0.5 font-semibold text-sky-700">{t('drawer.cliente.google')}</span>}
          {!c.conta.activa && <span className="rounded-full bg-rose-50 px-2 py-0.5 font-semibold text-rose-700">{t('drawer.cliente.conta_inactiva')}</span>}
          {c.conta.ultimoAcessoEm && (
            <span className="text-slate-400">{t('drawer.cliente.ultimo_acesso', { data: formatData(c.conta.ultimoAcessoEm) })}</span>
          )}
        </p>
      )}

      {diferencas.length > 0 && (
        <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
          <p className="mb-1 flex items-center gap-1.5 font-semibold">
            <Info size={12} />
            {t('drawer.cliente.registo_difere')}
          </p>
          <ul className="space-y-0.5">
            {diferencas.map((d) => (
              <li key={d.campo}>
                <span className="font-medium">{t(`drawer.cliente.${d.campo}`)}:</span> {d.registado}
                {d.actual === null && <span className="text-amber-700"> ({t('drawer.cliente.apagado_depois')})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {entrega && morada && (
        <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-sm">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase text-blue-700">
            <MapPin size={12} />
            {t('drawer.cliente.morada')}
            {morada.rotulo && <span className="font-normal normal-case text-blue-600">· {morada.rotulo}</span>}
          </p>
          <p className="mt-1.5 font-medium text-slate-800">
            {morada.linha1}
            {morada.bairro ? `, ${morada.bairro}` : ''}
          </p>
          <p className="text-xs text-slate-500">
            {morada.cidade}, {morada.provincia}
          </p>
          {morada.referencia && <p className="mt-1 text-xs text-slate-500">{morada.referencia}</p>}
          {(morada.contactoNome || morada.contactoTelefone) && (
            <p className="mt-1 text-xs text-slate-600">{[morada.contactoNome, morada.contactoTelefone].filter(Boolean).join(' · ')}</p>
          )}
          {mapa && (
            <a href={mapa} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline">
              <ExternalLink size={11} />
              {t('drawer.cliente.abrir_mapa')}
            </a>
          )}
        </div>
      )}

      {moradaMudou && registada && (
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
          <span className="font-semibold">{t('drawer.cliente.morada_registada')}:</span> {registada.linha1}
          {registada.bairro ? `, ${registada.bairro}` : ''} — {registada.cidade}
          {registada.contactoTelefone ? ` · ${registada.contactoTelefone}` : ''}
        </p>
      )}

      {pedido.snapshotAproximado && <p className="text-[11px] text-slate-400">{t('drawer.cliente.registo_aproximado')}</p>}
    </section>
  );
}
