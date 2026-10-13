import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils';
import { useDebounce } from '@/shared/hooks';
import { BarraDaPagina } from '@/shared/ui';
import { TabelaTransferencias } from '../components/TabelaTransferencias';
import { MotivoAccaoModal } from '../components/MotivoAccaoModal';
import { ReceberTransferenciaModal } from '../components/ReceberTransferenciaModal';
import { DetalheTransferenciaDrawer } from '../components/DetalheTransferenciaDrawer';
import { DetalheDoPedidoEmMassa } from '../components/DetalheDoPedidoEmMassa';
import { NovaTransferenciaEmMassa } from '../components/NovaTransferenciaEmMassa';
import {
  useArmazensEscolhiveis,
  useCancelarTransferencia,
  useDecidirTransferencia,
  useExpedirTransferencia,
  useReceberTransferencia,
  useTransferencias,
} from '../hooks/useTransferencias';
import type { EstadoTransferencia, LinhaTransferencia } from '../types/transferencia.types';

const ESTADOS: EstadoTransferencia[] = ['SOLICITADA', 'APROVADA', 'EXPEDIDA', 'RECEBIDA', 'CANCELADA'];

const classeCampo = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none';

/**
 * Transferências entre armazéns e lojas — DT01 §12 e §15.1, e o histórico (plano §4.12, D5).
 *
 * A materialização real da "oportunidade de transferência" que o painel de Necessidades calcula: aqui é onde alguém
 * pede (vários produtos de uma vez), aprova, expede e confirma a recepção — e onde fica **o histórico** de tudo, com
 * filtros por referência, armazém, estado e datas. `?pesquisa=TRF-…` abre já filtrada (é por onde se chega do
 * histórico de movimentos de stock).
 */
export function TransferenciasPage() {
  const { t } = useTranslation('transferencias');
  const [searchParams] = useSearchParams();
  const [estados, setEstados] = useState<EstadoTransferencia[]>([]);
  const [page, setPage] = useState(1);
  const [pesquisa, setPesquisa] = useState(searchParams.get('pesquisa') ?? '');
  const pesquisaAdiada = useDebounce(pesquisa, 350);
  const [armazemId, setArmazemId] = useState('');
  const [desde, setDesde] = useState('');
  const [ate, setAte] = useState('');

  const [aRecusar, setARecusar] = useState<LinhaTransferencia | null>(null);
  const [aCancelar, setACancelar] = useState<LinhaTransferencia | null>(null);
  const [aReceber, setAReceber] = useState<LinhaTransferencia | null>(null);
  const [detalheAberto, setDetalheAberto] = useState<string | null>(null);
  const [pedidoAberto, setPedidoAberto] = useState<string | null>(null);
  const [aSolicitar, setASolicitar] = useState(false);

  const armazens = useArmazensEscolhiveis();
  const { data: lista, isLoading } = useTransferencias({
    estado: estados.length ? estados : undefined,
    ...(pesquisaAdiada.trim() ? { pesquisa: pesquisaAdiada.trim() } : {}),
    ...(armazemId ? { armazemId } : {}),
    ...(desde ? { desde } : {}),
    ...(ate ? { ate } : {}),
    page,
    limit: 10,
  });

  const decidir = useDecidirTransferencia();
  const expedir = useExpedirTransferencia();
  const receber = useReceberTransferencia();
  const cancelar = useCancelarTransferencia();

  const alternarEstado = (estado: EstadoTransferencia) => {
    setEstados((anterior) => (anterior.includes(estado) ? anterior.filter((e) => e !== estado) : [...anterior, estado]));
    setPage(1);
  };

  const comFiltros = !!(pesquisa.trim() || armazemId || desde || ate || estados.length);
  const limpar = () => {
    setPesquisa('');
    setArmazemId('');
    setDesde('');
    setAte('');
    setEstados([]);
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

      {/* O histórico: referência, armazém e datas (plano §4.12, D5). */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="relative block min-w-[200px] flex-1">
          <span className="sr-only">{t('filtros.pesquisa')}</span>
          <Search size={15} className="pointer-events-none absolute left-3 top-[calc(50%)] -translate-y-1/2 text-slate-400" />
          <input
            value={pesquisa}
            onChange={(e) => { setPesquisa(e.target.value); setPage(1); }}
            placeholder={t('filtros.pesquisa')}
            className={cn(classeCampo, 'w-full pl-9')}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">{t('filtros.armazem')}</span>
          <select value={armazemId} onChange={(e) => { setArmazemId(e.target.value); setPage(1); }} className={classeCampo}>
            <option value="">{t('filtros.todos_armazens')}</option>
            {(armazens.data ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.lojaNome} — {a.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">{t('filtros.desde')}</span>
          <input type="date" value={desde} max={ate || undefined} onChange={(e) => { setDesde(e.target.value); setPage(1); }} className={classeCampo} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">{t('filtros.ate')}</span>
          <input type="date" value={ate} min={desde || undefined} onChange={(e) => { setAte(e.target.value); setPage(1); }} className={classeCampo} />
        </label>
        {comFiltros && (
          <button type="button" onClick={limpar} className="pb-2 text-xs font-medium text-slate-500 underline">
            {t('filtros.limpar')}
          </button>
        )}
      </div>

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
          onVerPedido={setPedidoAberto}
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

      {pedidoAberto && <DetalheDoPedidoEmMassa grupoId={pedidoAberto} aoFechar={() => setPedidoAberto(null)} />}

      {aSolicitar && <NovaTransferenciaEmMassa aoFechar={() => setASolicitar(false)} />}
    </div>
  );
}
