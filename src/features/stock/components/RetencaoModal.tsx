import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Lock, LockOpen, PackageCheck, ShieldQuestion, Timer } from 'lucide-react';
import { Button } from '@/shared/ui';
import { useReservaMutations } from '../hooks/useReservas';
import type { EstadosDaPosicao } from '../types/stock.types';

/**
 * As cinco operações que mexem no que o stock oferece sem mexer no que ele tem.
 *
 * As duas de libertação existem porque a alternativa era uma armadilha: punha-se mercadoria
 * em quarentena pela interface e não havia como a tirar de lá — ficava presa até alguém usar
 * a API directamente.
 */
export type TipoRetencao =
  | 'RESERVAR'
  | 'QUARENTENA'
  | 'BLOQUEIO'
  | 'LIBERTAR_QUARENTENA'
  | 'LIBERTAR_BLOQUEIO';

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

interface ConfiguracaoOperacao {
  icone: React.ElementType;
  motivoObrigatorio: boolean;
  /** Uma libertação devolve ao disponível em vez de o consumir — muda o limite e o texto. */
  liberta: boolean;
}

// O título e a explicação de cada operação vêm do catálogo i18n
// (`retencao.<TIPO>.titulo` / `.explicacao`), para existirem em português e em inglês.
const CONFIGURACAO: Record<TipoRetencao, ConfiguracaoOperacao> = {
  RESERVAR: {
    icone: Timer,
    motivoObrigatorio: false,
    liberta: false,
  },
  QUARENTENA: {
    icone: ShieldQuestion,
    motivoObrigatorio: true,
    liberta: false,
  },
  BLOQUEIO: {
    icone: Lock,
    motivoObrigatorio: true,
    liberta: false,
  },
  LIBERTAR_QUARENTENA: {
    icone: PackageCheck,
    motivoObrigatorio: false,
    liberta: true,
  },
  LIBERTAR_BLOQUEIO: {
    icone: LockOpen,
    motivoObrigatorio: false,
    liberta: true,
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
  const { t } = useTranslation('stock');
  const [quantidade, setQuantidade] = useState<number | ''>('');
  const [motivo, setMotivo] = useState('');
  const [referencia, setReferencia] = useState('');
  const [horas, setHoras] = useState<number | ''>('');
  const [semPrazo, setSemPrazo] = useState(false);

  const mutacoes = useReservaMutations();

  if (!stockId || !tipo) return null;

  const config = CONFIGURACAO[tipo];
  const Icone = config.icone;
  const titulo = t(`retencao.${tipo}.titulo`);
  const explicacao = t(`retencao.${tipo}.explicacao`);

  const q = Number(quantidade);

  /**
   * Contra o que a quantidade é medida.
   *
   * Reter mede-se contra o disponível; libertar mede-se contra o que está retido. Usar o
   * disponível nos dois casos deixaria libertar 100 de uma quarentena de 20 — e o servidor
   * recusaria, mas só depois de a pessoa escrever e submeter.
   */
  const limite =
    tipo === 'LIBERTAR_QUARENTENA'
      ? estados?.quarentena
      : tipo === 'LIBERTAR_BLOQUEIO'
        ? estados?.bloqueado
        : estados?.disponivel;

  const excedeLimite = limite !== undefined && q > 0 && q > limite;
  const faltaMotivo = config.motivoObrigatorio && !motivo.trim();
  const podeSubmeter = q > 0 && !excedeLimite && !faltaMotivo && !mutacoes.aDecorrer;

  const submeter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeSubmeter) return;

    const aoTerminar = { onSuccess: onClose };
    const texto = motivo.trim() || undefined;

    if (tipo === 'RESERVAR') {
      mutacoes.criar.mutate(
        {
          stockId,
          quantidade: q,
          referencia: referencia.trim() || undefined,
          motivo: texto,
          semPrazo,
          horasAteExpirar: semPrazo || !horas ? undefined : Number(horas),
        },
        aoTerminar,
      );
    } else if (tipo === 'QUARENTENA') {
      mutacoes.reterEmQuarentena.mutate({ stockId, quantidade: q, motivo }, aoTerminar);
    } else if (tipo === 'BLOQUEIO') {
      mutacoes.bloquear.mutate({ stockId, quantidade: q, motivo }, aoTerminar);
    } else if (tipo === 'LIBERTAR_QUARENTENA') {
      mutacoes.libertarDaQuarentena.mutate({ stockId, quantidade: q, motivo: texto }, aoTerminar);
    } else {
      mutacoes.desbloquear.mutate({ stockId, quantidade: q, motivo: texto }, aoTerminar);
    }
  };

  /** Preencher tudo é o caso comum ao libertar: a análise acabou, sai tudo. */
  const preencherTudo = () => setQuantidade(limite ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 p-5">
          <div className="flex items-start gap-3">
            <Icone className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-500" />
            <div>
              <h2 className="font-bold text-slate-800">{titulo}</h2>
              {produtoNome && <p className="text-sm text-slate-500">{produtoNome}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xl leading-none text-slate-400 hover:text-slate-700"
            aria-label={t('retencao.fechar')}
          >
            ×
          </button>
        </div>

        <form onSubmit={submeter} className="space-y-4 p-5">
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
            {explicacao}
          </p>

          {estados && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              {/* Ao libertar, o número que interessa é o que está retido — mostrar o
                  disponível em destaque faria olhar para a métrica errada. */}
              <div className="rounded-lg border border-slate-200 px-3 py-2">
                <span className="block text-[11px] uppercase tracking-wide text-slate-400">
                  {tipo === 'LIBERTAR_QUARENTENA'
                    ? t('retencao.em_quarentena')
                    : tipo === 'LIBERTAR_BLOQUEIO'
                      ? t('retencao.bloqueado')
                      : t('retencao.disponivel')}
                </span>
                <span className="font-semibold tabular-nums text-slate-800">
                  {limite ?? 0} {unidade}
                </span>
              </div>
              <div className="rounded-lg border border-slate-200 px-3 py-2">
                <span className="block text-[11px] uppercase tracking-wide text-slate-400">
                  {config.liberta ? t('retencao.disponivel_agora') : t('retencao.em_armazem')}
                </span>
                <span className="font-semibold tabular-nums text-slate-800">
                  {config.liberta ? estados.disponivel : estados.fisico} {unidade}
                </span>
              </div>
            </div>
          )}

          <label className="block">
            <span className="mb-1 flex items-center justify-between text-sm font-medium text-slate-700">
              {t('retencao.quantidade')}
              {config.liberta && !!limite && (
                <button
                  type="button"
                  onClick={preencherTudo}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  {t('retencao.libertar_tudo', { n: limite })}
                </button>
              )}
            </span>
            <input
              type="number"
              min="0"
              step="any"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value === '' ? '' : Number(e.target.value))}
              autoFocus
              className={`w-full rounded-lg border px-3 py-2 text-base ${
                excedeLimite ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
              }`}
            />
            {excedeLimite && (
              <span className="mt-1 flex items-start gap-1.5 text-xs text-rose-600">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                {config.liberta
                  ? t('retencao.excede_retidas', { n: limite, unidade })
                  : t('retencao.excede_disponiveis', { n: limite, unidade })}
              </span>
            )}
          </label>

          {tipo === 'RESERVAR' && (
            <>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  {t('retencao.referencia')} <span className="font-normal text-slate-400">{t('retencao.recomendado')}</span>
                </span>
                <input
                  type="text"
                  placeholder={t('retencao.exemplo_referencia')}
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <span className="mt-1 block text-xs text-slate-400">
                  {t('retencao.referencia_dica')}
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
                    {t('retencao.sem_prazo')}
                    <span className="mt-0.5 block text-xs font-normal text-slate-500">
                      {t('retencao.sem_prazo_dica')}
                    </span>
                  </span>
                </label>

                {!semPrazo && (
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">
                      {t('retencao.caduca_em')} <span className="font-normal text-slate-400">{t('retencao.horas')}</span>
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
                      {t('retencao.caduca_dica')}
                    </span>
                  </label>
                )}
              </div>
            </>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              {t('retencao.motivo')}
              {config.motivoObrigatorio ? (
                <span className="ml-1 text-rose-600">{t('retencao.obrigatorio')}</span>
              ) : (
                <span className="ml-1 font-normal text-slate-400">{t('retencao.opcional')}</span>
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
                {t('retencao.motivo_dica')}
              </span>
            )}
          </label>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('retencao.cancelar')}
            </Button>
            <Button type="submit" disabled={!podeSubmeter}>
              {mutacoes.aDecorrer ? t('retencao.a_gravar') : t('retencao.confirmar')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
