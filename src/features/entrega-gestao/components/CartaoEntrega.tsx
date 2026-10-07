import { useTranslation } from 'react-i18next';
import { MapPin, Phone, User } from 'lucide-react';
import { Can } from '@/features/auth';
import { formatMoeda } from '@/shared/utils';
import type { EntregaPainel } from '../types/operacao';

export type AccaoEntrega = 'atribuir' | 'recolher' | 'iniciar_rota' | 'entregar' | 'falhar' | 'devolver';

/**
 * As acções que cada estado permite — espelha `TRANSICOES` do backend
 * (`entrega/domain/entrega-estado.ts`). O servidor é quem decide: isto só esconde o que seria
 * recusado, para o painel não oferecer botões que dão erro.
 */
const ACCOES: Partial<Record<EntregaPainel['estado'], AccaoEntrega[]>> = {
  AGUARDA_RECOLHA: ['atribuir', 'falhar'],
  ATRIBUIDA: ['recolher', 'atribuir', 'falhar'],
  RECOLHIDA: ['iniciar_rota', 'entregar', 'falhar'],
  EM_ROTA: ['entregar', 'falhar'],
  FALHADA: ['devolver'],
};

const ROTULO: Record<AccaoEntrega, 'accao.atribuir' | 'accao.reatribuir' | 'accao.recolhida' | 'accao.iniciar_rota' | 'accao.entregue' | 'accao.falhada' | 'accao.devolver'> = {
  atribuir: 'accao.atribuir',
  recolher: 'accao.recolhida',
  iniciar_rota: 'accao.iniciar_rota',
  entregar: 'accao.entregue',
  falhar: 'accao.falhada',
  devolver: 'accao.devolver',
};

const ESTILO: Record<AccaoEntrega, string> = {
  atribuir: 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  recolher: 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700',
  iniciar_rota: 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700',
  entregar: 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700',
  falhar: 'border-rose-300 bg-white text-rose-700 hover:bg-rose-50',
  devolver: 'border-rose-600 bg-rose-600 text-white hover:bg-rose-700',
};

export function CartaoEntrega({
  entrega,
  aoEscolher,
}: {
  entrega: EntregaPainel;
  aoEscolher: (accao: AccaoEntrega, entrega: EntregaPainel) => void;
}) {
  const { t } = useTranslation('entrega');
  const accoes = ACCOES[entrega.estado] ?? [];

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-slate-900">{entrega.pedido.numeroPedido}</p>
        <p className="text-xs text-slate-400">{entrega.loja.nome}</p>
      </div>

      <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-600">
        <MapPin size={12} className="mt-0.5 shrink-0 text-slate-400" />
        <span>{entrega.destinoMorada}</span>
      </p>

      {(entrega.contactoNome || entrega.contactoTelefone) && (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          <Phone size={12} className="shrink-0 text-slate-400" />
          {[entrega.contactoNome, entrega.contactoTelefone].filter(Boolean).join(' · ')}
        </p>
      )}

      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
        <User size={12} className="shrink-0 text-slate-400" />
        {entrega.estafeta ? `${entrega.estafeta.nome} (${entrega.estafeta.codigo})` : t('painel.sem_estafeta')}
      </p>

      <p className="mt-2 flex items-baseline justify-between text-xs text-slate-500">
        <span>{t('painel.a_cobrar')}</span>
        <span className="text-sm font-semibold text-slate-900">{formatMoeda(entrega.valorACobrar)}</span>
      </p>

      {entrega.estado === 'FALHADA' && entrega.motivoFalha && (
        <p className="mt-2 rounded-lg bg-orange-50 px-2 py-1.5 text-xs text-orange-800">
          {t(`motivo_falha.${entrega.motivoFalha as 'OUTRO'}`)}
        </p>
      )}

      {accoes.length > 0 && (
        <Can action="manage" resource="entregas">
          <div className="mt-3 flex flex-wrap gap-1.5">
            {accoes.map((accao) => (
              <button
                key={accao}
                type="button"
                onClick={() => aoEscolher(accao, entrega)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${ESTILO[accao]}`}
              >
                {accao === 'atribuir' && entrega.estado === 'ATRIBUIDA' ? t('accao.reatribuir') : t(ROTULO[accao])}
              </button>
            ))}
          </div>
        </Can>
      )}
    </li>
  );
}
