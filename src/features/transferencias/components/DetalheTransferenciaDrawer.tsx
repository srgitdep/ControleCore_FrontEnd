import { Loader2, Package, X } from 'lucide-react';
import { BadgeEstadoTransferencia } from './BadgeEstadoTransferencia';
import { useDetalheTransferencia } from '../hooks/useTransferencias';

interface DetalheTransferenciaDrawerProps {
  transferenciaId: string | null;
  onClose: () => void;
}

/**
 * O detalhe de uma transferência — a linha do tempo completa (quem solicitou, quem
 * aprovou, quem expediu, quem recebeu) que a tabela não tem espaço para mostrar.
 *
 * Drawer lateral, no mesmo espírito de `DetalheNecessidadeDrawer`: fechar devolve
 * exactamente ao filtro e à página da lista de transferências.
 */
export function DetalheTransferenciaDrawer({ transferenciaId, onClose }: DetalheTransferenciaDrawerProps) {
  const { data: detalhe, isLoading } = useDetalheTransferencia(transferenciaId);

  if (!transferenciaId) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/50 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md transform flex-col bg-white shadow-xl transition-transform duration-300">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Detalhe da transferência</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading || !detalhe ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">A carregar detalhe...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  {detalhe.produto.imagemUrl ? (
                    <img src={detalhe.produto.imagemUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Package size={20} strokeWidth={1.5} className="text-slate-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">{detalhe.produto.nome}</p>
                  <p className="text-xs text-slate-400">{detalhe.produto.sku ?? '—'}</p>
                </div>
                <BadgeEstadoTransferencia estado={detalhe.estado} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-400">Origem</p>
                  <p className="text-sm font-medium text-slate-800">{detalhe.origemLoja.nome}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-400">Destino</p>
                  <p className="text-sm font-medium text-slate-800">{detalhe.destinoLoja.nome}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-400">Solicitada</p>
                  <p className="tabular-nums text-sm font-medium text-slate-800">{detalhe.quantidadeSolicitada} un</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-400">Expedida / Recebida</p>
                  <p className="tabular-nums text-sm font-medium text-slate-800">
                    {detalhe.quantidadeExpedida ?? '—'} / {detalhe.quantidadeRecebida ?? '—'}
                  </p>
                </div>
              </div>

              {detalhe.motivo && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Motivo</p>
                  <p className="mt-1 text-sm text-slate-600">{detalhe.motivo}</p>
                </div>
              )}

              {detalhe.motivoCancelamento && (
                <div className="rounded-lg bg-rose-50 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">Cancelamento</p>
                  <p className="mt-1 text-sm text-rose-700">{detalhe.motivoCancelamento}</p>
                </div>
              )}

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Linha do tempo
                </p>
                <ol className="space-y-3 border-l border-slate-100 pl-4">
                  <Evento label="Solicitada por" nome={detalhe.solicitadaPor.name} data={detalhe.createdAt} />
                  {detalhe.aprovadaPor && (
                    <Evento label="Aprovada por" nome={detalhe.aprovadaPor.name} data={detalhe.aprovadaEm} />
                  )}
                  {detalhe.expedidaPor && (
                    <Evento label="Expedida por" nome={detalhe.expedidaPor.name} data={detalhe.expedidaEm} />
                  )}
                  {detalhe.recebidaPor && (
                    <Evento label="Recebida por" nome={detalhe.recebidaPor.name} data={detalhe.recebidaEm} />
                  )}
                  {detalhe.canceladaPor && (
                    <Evento label="Cancelada por" nome={detalhe.canceladaPor.name} data={null} />
                  )}
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Evento({ label, nome, data }: { label: string; nome: string; data: string | null }) {
  return (
    <li className="text-sm">
      <p className="font-medium text-slate-700">
        {label} <span className="font-normal text-slate-500">— {nome}</span>
      </p>
      {data && (
        <p className="text-xs text-slate-400">{new Date(data).toLocaleString('pt-PT')}</p>
      )}
    </li>
  );
}
