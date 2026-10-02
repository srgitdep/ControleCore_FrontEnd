import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils';
import { BarraDaPagina } from '@/shared/ui';
import { TabelaTransferencias } from '../components/TabelaTransferencias';
import { MotivoAccaoModal } from '../components/MotivoAccaoModal';
import { ReceberTransferenciaModal } from '../components/ReceberTransferenciaModal';
import { DetalheTransferenciaDrawer } from '../components/DetalheTransferenciaDrawer';
import { SolicitarTransferenciaModal } from '../components/SolicitarTransferenciaModal';
import {
  useCancelarTransferencia,
  useDecidirTransferencia,
  useExpedirTransferencia,
  useReceberTransferencia,
  useSolicitarTransferencia,
  useTransferencias,
} from '../hooks/useTransferencias';
import type { EstadoTransferencia, LinhaTransferencia } from '../types/transferencia.types';

const ESTADOS: EstadoTransferencia[] = ['SOLICITADA', 'APROVADA', 'EXPEDIDA', 'RECEBIDA', 'CANCELADA'];

/**
 * Transferências entre lojas — DT01 §12 e §15.1.
 *
 * A materialização real da "oportunidade de transferência" que o painel de
 * Necessidades calcula: aqui é onde alguém aprova, expede e confirma a recepção.
 */
export function TransferenciasPage() {
  const { t } = useTranslation('transferencias');
  const [estados, setEstados] = useState<EstadoTransferencia[]>([]);
  const [page, setPage] = useState(1);

  const [aRecusar, setARecusar] = useState<LinhaTransferencia | null>(null);
  const [aCancelar, setACancelar] = useState<LinhaTransferencia | null>(null);
  const [aReceber, setAReceber] = useState<LinhaTransferencia | null>(null);
  const [detalheAberto, setDetalheAberto] = useState<string | null>(null);
  const [aSolicitar, setASolicitar] = useState(false);

  const { data: lista, isLoading } = useTransferencias({
    estado: estados.length ? estados : undefined,
    page,
    limit: 10,
  });

  const solicitar = useSolicitarTransferencia();
  const decidir = useDecidirTransferencia();
  const expedir = useExpedirTransferencia();
  const receber = useReceberTransferencia();
  const cancelar = useCancelarTransferencia();

  const alternarEstado = (estado: EstadoTransferencia) => {
    setEstados((anterior) => (anterior.includes(estado) ? anterior.filter((e) => e !== estado) : [...anterior, estado]));
    setPage(1);
  };

  const totalPaginas = lista ? Math.max(Math.ceil(lista.total / lista.limit), 1) : 1;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <BarraDaPagina
        resumo={lista ? t('pagina.resumo', { count: lista.total }) : undefined}
        acoes={
          <button
            type="button"
            onClick={() => setASolicitar(true)}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus size={16} /> {t('pagina.nova')}
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => { setEstados([]); setPage(1); }}
          className={cn(
            'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
            estados.length === 0 ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
          )}
        >
          {t('pagina.todas')}
        </button>
        {ESTADOS.map((estado) => (
          <button
            key={estado}
            type="button"
            onClick={() => alternarEstado(estado)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              estados.includes(estado)
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            {t(`estado.${estado}`)}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <TabelaTransferencias
          linhas={lista?.dados ?? []}
          isLoading={isLoading}
          onAprovar={(linha) => decidir.mutate({ id: linha.id, decisao: 'APROVAR' })}
          onRecusar={setARecusar}
          onExpedir={(linha) => expedir.mutate(linha.id)}
          onReceber={setAReceber}
          onCancelar={setACancelar}
          onVerDetalhe={setDetalheAberto}
        />

        {lista && lista.total > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
            <span>{t('pagina.a_mostrar', { n: lista.dados.length, total: lista.total })}</span>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))} className="rounded-md px-2 py-1 disabled:opacity-30">‹</button>
              <span className="tabular-nums">{page} / {totalPaginas}</span>
              <button disabled={page >= totalPaginas} onClick={() => setPage((p) => Math.min(p + 1, totalPaginas))} className="rounded-md px-2 py-1 disabled:opacity-30">›</button>
            </div>
          </div>
        )}
      </div>

      <MotivoAccaoModal
        isOpen={!!aRecusar}
        isSubmitting={decidir.isPending}
        titulo={t('pagina.recusar_titulo')}
        descricao={t('pagina.recusar_descricao')}
        placeholder={t('pagina.recusar_placeholder')}
        onClose={() => setARecusar(null)}
        onConfirm={(motivo) =>
          decidir.mutate(
            { id: aRecusar!.id, decisao: 'RECUSAR', motivo },
            { onSuccess: () => setARecusar(null) },
          )
        }
      />

      <MotivoAccaoModal
        isOpen={!!aCancelar}
        isSubmitting={cancelar.isPending}
        titulo={t('pagina.cancelar_titulo')}
        descricao={t('pagina.cancelar_descricao')}
        corBotao="danger"
        onClose={() => setACancelar(null)}
        onConfirm={(motivo) =>
          cancelar.mutate({ id: aCancelar!.id, motivo }, { onSuccess: () => setACancelar(null) })
        }
      />

      {aReceber && (
        <ReceberTransferenciaModal
          isOpen={!!aReceber}
          isSubmitting={receber.isPending}
          quantidadeExpedida={aReceber.quantidadeExpedida ?? 0}
          onClose={() => setAReceber(null)}
          onConfirm={(quantidadeRecebida) =>
            receber.mutate(
              { id: aReceber.id, quantidadeRecebida },
              { onSuccess: () => setAReceber(null) },
            )
          }
        />
      )}

      <DetalheTransferenciaDrawer
        transferenciaId={detalheAberto}
        onClose={() => setDetalheAberto(null)}
      />

      <SolicitarTransferenciaModal
        isOpen={aSolicitar}
        isSubmitting={solicitar.isPending}
        onClose={() => setASolicitar(false)}
        onConfirm={(dados) => solicitar.mutate(dados, { onSuccess: () => setASolicitar(false) })}
      />
    </div>
  );
}
