import { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { cn } from '@/shared/utils';
import { ETIQUETA_CANAL, type CanalComunicacao, type PedidoItemCommerce, type SubstituirItemPayload } from '../types/pedido-commerce-gestao.types';

const CANAIS: CanalComunicacao[] = ['WHATSAPP', 'SMS', 'EMAIL', 'CHAMADA'];
const REGISTO_MINIMO = 10;

interface SubstituirItemModalProps {
  item: PedidoItemCommerce | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (payload: SubstituirItemPayload) => void;
}

/**
 * Regista uma substituição ou aceitação parcial — Documento 02 §34. A
 * autorização do cliente nunca é assumida: o campo de registo é texto livre
 * obrigatório (a transcrição da resposta dele, ou uma nota de que confirmou no
 * ecrã), exactamente como o backend exige (`SubstituirItemDto.registoAutorizacao`).
 */
export function SubstituirItemModal({ item, isSubmitting, onClose, onConfirm }: SubstituirItemModalProps) {
  const [produtoSubstitutoId, setProdutoSubstitutoId] = useState('');
  const [quantidadeAceite, setQuantidadeAceite] = useState(0);
  const [motivo, setMotivo] = useState('');
  const [canalAutorizacao, setCanalAutorizacao] = useState<CanalComunicacao>('WHATSAPP');
  const [registoAutorizacao, setRegistoAutorizacao] = useState('');

  if (!item) return null;

  const invalido =
    !Number.isFinite(quantidadeAceite) ||
    quantidadeAceite < 0 ||
    quantidadeAceite > item.quantidade ||
    motivo.trim().length < 3 ||
    registoAutorizacao.trim().length < REGISTO_MINIMO;

  const fechar = () => {
    setProdutoSubstitutoId('');
    setQuantidadeAceite(0);
    setMotivo('');
    setCanalAutorizacao('WHATSAPP');
    setRegistoAutorizacao('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              <RefreshCw size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Registar substituição</h3>
              <p className="text-xs text-slate-400">
                {item.produto.nome} — pedido: {item.quantidade}
              </p>
            </div>
          </div>
          <button onClick={fechar} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Quantidade que o cliente aceitou</label>
            <input
              type="number"
              min={0}
              max={item.quantidade}
              value={quantidadeAceite}
              onChange={(e) => setQuantidadeAceite(Number(e.target.value))}
              autoFocus
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">
              Produto substituto (opcional — vazio se for só menos quantidade do mesmo artigo)
            </label>
            <input
              type="text"
              value={produtoSubstitutoId}
              onChange={(e) => setProdutoSubstitutoId(e.target.value)}
              placeholder="ID do produto substituto"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Motivo</label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: ruptura de stock à chegada da equipa de picking"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Canal usado para contactar o cliente</label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {CANAIS.map((canal) => (
                <button
                  key={canal}
                  type="button"
                  onClick={() => setCanalAutorizacao(canal)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    canalAutorizacao === canal
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {ETIQUETA_CANAL[canal]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">
              Registo da autorização (obrigatório — nunca inferido)
            </label>
            <textarea
              value={registoAutorizacao}
              onChange={(e) => setRegistoAutorizacao(e.target.value)}
              rows={3}
              placeholder="Ex.: cliente confirmou por WhatsApp às 10:32 — aceita 1 unidade."
              className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            />
            {registoAutorizacao.length > 0 && registoAutorizacao.trim().length < REGISTO_MINIMO && (
              <p className="mt-1 text-xs text-rose-500">Mínimo de {REGISTO_MINIMO} caracteres.</p>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={fechar} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Voltar
          </button>
          <button
            disabled={invalido || isSubmitting}
            onClick={() =>
              onConfirm({
                produtoSubstitutoId: produtoSubstitutoId.trim() || undefined,
                quantidadeAceite,
                motivo: motivo.trim(),
                canalAutorizacao,
                registoAutorizacao: registoAutorizacao.trim(),
              })
            }
            className={cn(
              'rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700',
              (invalido || isSubmitting) && 'cursor-not-allowed opacity-50',
            )}
          >
            {isSubmitting ? 'A registar...' : 'Registar substituição'}
          </button>
        </div>
      </div>
    </div>
  );
}
