import { useState } from 'react';
import { AlertTriangle, Lock, ShieldQuestion, Timer } from 'lucide-react';
import { Button } from '@/shared/ui';
import { useReservaMutations } from '../hooks/useReservas';
import type { EstadosDaPosicao } from '../types/stock.types';

export type TipoRetencao = 'RESERVAR' | 'QUARENTENA' | 'BLOQUEIO';

interface RetencaoModalProps {
  stockId: string | null;
  tipo: TipoRetencao | null;
  onClose: () => void;
  /** Nome do produto, para o modal dizer sobre o que se está a decidir. */
  produtoNome?: string | null;
  /** Os estados actuais, para se ver quanto há disponível antes de comprometer. */
  estados?: EstadosDaPosicao;
  unidade?: string;
}

const CONFIGURACAO: Record<
  TipoRetencao,
  { titulo: string; icone: React.ElementType; explicacao: string; motivoObrigatorio: boolean }
> = {
  RESERVAR: {
    titulo: 'Reservar mercadoria',
    icone: Timer,
    explicacao:
      'A mercadoria continua no armazém e continua a valer no inventário, mas deixa de estar disponível para outro pedido. Não gera movimento de stock.',
    motivoObrigatorio: false,
  },
  QUARENTENA: {
    titulo: 'Reter em quarentena',
    icone: ShieldQuestion,
    explicacao:
      'Para mercadoria recebida à espera de aprovação, ou que precisa de análise. Sai do disponível sem sair do armazém.',
    motivoObrigatorio: true,
  },
  BLOQUEIO: {
    titulo: 'Bloquear mercadoria',
    icone: Lock,
    explicacao:
      'Para mercadoria que não deve sair por decisão: litígio com o fornecedor, suspeita de qualidade, mercadoria de um cliente. Distinto da quarentena, que é uma fase da recepção.',
    motivoObrigatorio: true,
  },
};

/**
 * Comprometer ou reter mercadoria.
 *
 * As três operações partilham a mesma forma — uma quantidade e um motivo — e diferem no que
 * significam. Um modal só, com o texto a explicar cada uma, em vez de três quase iguais.
 *
 * O disponível actual está sempre à vista: comprometer mercadoria é uma decisão que se toma
 * contra um número, e obrigar quem decide a fechar o modal para o ir ver é como se pede um
 * erro.
 */
export function RetencaoModal({
  stockId,
  tipo,
  onClose,
  produtoNome,
  estados,
  unidade = 'UN',
}: RetencaoModalProps) {
  const [quantidade, setQuantidade] = useState<number | ''>('');
  const [motivo, setMotivo] = useState('');
  const [referencia, setReferencia] = useState('');
  const [horas, setHoras] = useState<number | ''>('');
  const [semPrazo, setSemPrazo] = useState(false);

  const mutacoes = useReservaMutations();

  if (!stockId || !tipo) return null;

  const config = CONFIGURACAO[tipo];
  const Icone = config.icone;

  const q = Number(quantidade);
  const disponivel = estados?.disponivel;

  // Verificado no ecrã e no servidor. O servidor é a autoridade — esta verificação evita uma
  // ida ao servidor para receber uma recusa que já se sabia.
  const excedeDisponivel = disponivel !== undefined && q > 0 && q > disponivel;
  const faltaMotivo = config.motivoObrigatorio && !motivo.trim();
  const podeSubmeter = q > 0 && !excedeDisponivel && !faltaMotivo && !mutacoes.aDecorrer;

  const submeter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeSubmeter) return;

    const aoTerminar = { onSuccess: onClose };

    if (tipo === 'RESERVAR') {
      mutacoes.criar.mutate(
        {
          stockId,
          quantidade: q,
          referencia: referencia.trim() || undefined,
          motivo: motivo.trim() || undefined,
          semPrazo,
          horasAteExpirar: semPrazo || !horas ? undefined : Number(horas),
        },
        aoTerminar,
      );
    } else if (tipo === 'QUARENTENA') {
      mutacoes.reterEmQuarentena.mutate({ stockId, quantidade: q, motivo }, aoTerminar);
    } else {
      mutacoes.bloquear.mutate({ stockId, quantidade: q, motivo }, aoTerminar);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 p-5">
          <div className="flex items-start gap-3">
            <Icone className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-500" />
            <div>
              <h2 className="font-bold text-slate-800">{config.titulo}</h2>
              {produtoNome && <p className="text-sm text-slate-500">{produtoNome}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xl leading-none text-slate-400 hover:text-slate-700"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <form onSubmit={submeter} className="space-y-4 p-5">
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
            {config.explicacao}
          </p>

          {estados && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg border border-slate-200 px-3 py-2">
                <span className="block text-[11px] uppercase tracking-wide text-slate-400">
                  Disponível
                </span>
                <span className="font-semibold tabular-nums text-slate-800">
                  {estados.disponivel} {unidade}
                </span>
              </div>
              <div className="rounded-lg border border-slate-200 px-3 py-2">
                <span className="block text-[11px] uppercase tracking-wide text-slate-400">
                  Em armazém
                </span>
                <span className="font-semibold tabular-nums text-slate-800">
                  {estados.fisico} {unidade}
                </span>
              </div>
            </div>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Quantidade</span>
            <input
              type="number"
              min="0"
              step="any"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value === '' ? '' : Number(e.target.value))}
              autoFocus
              className={`w-full rounded-lg border px-3 py-2 text-base ${
                excedeDisponivel ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
              }`}
            />
            {excedeDisponivel && (
              <span className="mt-1 flex items-start gap-1.5 text-xs text-rose-600">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                Apenas {disponivel} {unidade} estão disponíveis. O resto está em armazém mas
                comprometido.
              </span>
            )}
          </label>

          {tipo === 'RESERVAR' && (
            <>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Referência <span className="font-normal text-slate-400">(recomendado)</span>
                </span>
                <input
                  type="text"
                  placeholder="ex: PED-2026-00412"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <span className="mt-1 block text-xs text-slate-400">
                  O pedido que originou a reserva. Sem isto, uma reserva encontrada dentro de
                  duas semanas não tem como ser explicada a ninguém.
                </span>
              </label>

              <div className="space-y-2">
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={semPrazo}
                    onChange={(e) => setSemPrazo(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">
                    Sem prazo
                    <span className="mt-0.5 block text-xs font-normal text-slate-500">
                      Para mercadoria já separada à espera de recolha, onde caducar sozinha
                      devolveria ao disponível caixas que estão num palete à porta.
                    </span>
                  </span>
                </label>

                {!semPrazo && (
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">
                      Caduca em <span className="font-normal text-slate-400">(horas)</span>
                    </span>
                    <input
                      type="number"
                      min="1"
                      placeholder="48"
                      value={horas}
                      onChange={(e) => setHoras(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <span className="mt-1 block text-xs text-slate-400">
                      Vazio usa 48 horas. Passado o prazo, a mercadoria volta ao disponível
                      automaticamente.
                    </span>
                  </label>
                )}
              </div>
            </>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Motivo
              {config.motivoObrigatorio ? (
                <span className="ml-1 text-rose-600">obrigatório</span>
              ) : (
                <span className="ml-1 font-normal text-slate-400">opcional</span>
              )}
            </span>
            <textarea
              rows={2}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm ${
                faltaMotivo && motivo !== '' ? 'border-rose-400' : 'border-slate-200'
              }`}
            />
            {config.motivoObrigatorio && (
              <span className="mt-1 block text-xs text-slate-400">
                Mercadoria retida sem motivo não é libertada por ninguém, por medo de desfazer
                uma decisão que ninguém sabe qual foi.
              </span>
            )}
          </label>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!podeSubmeter}>
              {mutacoes.aDecorrer ? 'A gravar...' : 'Confirmar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
