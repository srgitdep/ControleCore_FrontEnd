import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Check,
  ClipboardList,
  Gavel,
  ListPlus,
  Loader2,
  Plus,
  Radar,
  RotateCcw,
  Send,
  Sliders,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
  b2bApi,
  EstadoRequisicao,
  podeAdjudicar,
  podeCancelar,
  podeCorrerSourcing,
  podeDecidir,
  podeEditarLinhas,
  podeReabrir,
  podeSubmeter,
  saldoPorAdjudicar,
} from '../api/b2b.api';
import type { Requisicao, SourcingRun } from '../api/b2b.api';
import { CriarRequisicaoModal } from '../components/CriarRequisicaoModal';
import { EditarLinhasModal } from '../components/EditarLinhasModal';
import { MotivoModal } from '../components/MotivoModal';
import { SourcingComparacaoModal } from '../components/SourcingComparacaoModal';
import { usePermissions, useAuth } from '@/features/auth';
import { cn, formatData } from '@/shared/utils';

/**
 * As requisições de compra e o caminho até à adjudicação.
 *
 * ## A peça que faltava no fluxo
 *
 * O sistema documentava «Requisição → Pedido → Recepção» e começava em `PedidoCompra` — ou
 * seja, começava **depois** de o fornecedor já estar escolhido. A escolha acontecia fora do
 * sistema, e com ela desaparecia a única informação que permitiria auditá-la: quais eram as
 * alternativas.
 *
 * Este ecrã é o que existe antes da decisão.
 */
export function RequisicoesPage() {
  const { t } = useTranslation('b2b');
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const utilizadorId = useAuth().user?.id;

  const [filtro, setFiltro] = useState<EstadoRequisicao | 'TODAS'>('TODAS');
  const [aCriar, setACriar] = useState(false);
  const [comparacao, setComparacao] = useState<{ requisicao: Requisicao; run: SourcingRun } | null>(
    null,
  );
  const [aDecidir, setADecidir] = useState<Requisicao | null>(null);
  const [aEditarLinhas, setAEditarLinhas] = useState<Requisicao | null>(null);
  const [aReabrir, setAReabrir] = useState<Requisicao | null>(null);
  const [aCancelar, setACancelar] = useState<Requisicao | null>(null);

  const podeGerir = hasPermission('manage', 'requisicoes');
  const podeCriar = hasPermission('write', 'requisicoes');
  const podeSourcing = hasPermission('manage', 'sourcing');

  const { data: requisicoes, isLoading } = useQuery({
    queryKey: ['requisicoes', filtro],
    queryFn: () => b2bApi.listar(filtro === 'TODAS' ? undefined : { estado: filtro }),
  });

  const recarregar = () => queryClient.invalidateQueries({ queryKey: ['requisicoes'] });

  const submeter = useMutation({
    mutationFn: (id: string) => b2bApi.submeter(id),
    onSuccess: (r) => {
      toast.success(t('req.submetida', { numero: r.numero }));
      recarregar();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? t('req.erro_submeter')),
  });

  /**
   * Correr o sourcing e abrir logo a comparação.
   *
   * Uma corrida sobre vinte linhas e trinta fornecedores leva alguns segundos, e o botão fica
   * em espera. Abrir o modal só no fim é deliberado: mostrar um ecrã de comparação a
   * preencher-se aos poucos convidaria a decidir sobre um ranking incompleto.
   */
  const correrSourcing = useMutation({
    mutationFn: async (requisicao: Requisicao) => {
      const run = await b2bApi.correrSourcing(requisicao.id);
      return { requisicao, run };
    },
    onSuccess: ({ requisicao, run }) => {
      recarregar();

      const elegiveis = run.candidatos.filter((c) => !c.excluido).length;

      if (elegiveis === 0) {
        toast.error(t('req.nenhum_elegivel'), { duration: 7000 });
      }

      setComparacao({ requisicao, run });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? t('req.erro_sourcing')),
  });

  const reabrir = useMutation({
    mutationFn: ({ requisicao, motivo }: { requisicao: Requisicao; motivo: string }) =>
      b2bApi.reabrir(requisicao.id, motivo),
    onSuccess: (r) => {
      toast.success(t('req.devolvida', { numero: r.numero }));
      recarregar();
      setAReabrir(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? t('req.erro_reabrir')),
  });

  const cancelar = useMutation({
    mutationFn: ({ requisicao, motivo }: { requisicao: Requisicao; motivo: string }) =>
      b2bApi.cancelar(requisicao.id, motivo),
    onSuccess: (r) => {
      toast.success(t('req.cancelada', { numero: r.numero }));
      recarregar();
      setACancelar(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? t('req.erro_cancelar')),
  });

  const abrirComparacaoExistente = useMutation({
    mutationFn: async (requisicao: Requisicao) => {
      const runs = await b2bApi.listarRuns(requisicao.id);
      if (runs.length === 0) throw new Error(t('req.sem_sourcing'));
      const run = await b2bApi.obterRun(runs[0].id);
      return { requisicao, run };
    },
    onSuccess: (dados) => setComparacao(dados),
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? e?.message ?? t('req.erro_abrir_comparacao')),
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <ClipboardList size={18} className="text-blue-600" />
            {t('req.titulo')}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">{t('req.subtitulo')}</p>
        </div>

        <div className="flex shrink-0 gap-2">
          {podeSourcing && (
            <Link
              to="/requisicoes/pesos"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Sliders size={15} />
              {t('pesos.titulo')}
            </Link>
          )}

          {podeCriar && (
            <button
              onClick={() => setACriar(true)}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus size={15} />
              {t('req.nova')}
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {(['TODAS', ...Object.keys(EstadoRequisicao)] as (EstadoRequisicao | 'TODAS')[]).map(
          (estado) => (
            <button
              key={estado}
              onClick={() => setFiltro(estado)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                filtro === estado
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
            >
              {estado === 'TODAS' ? t('req.todas') : t(`req.estado.${estado}`)}
            </button>
          ),
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin text-slate-400" />
        </div>
      ) : !requisicoes || requisicoes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 py-14 text-center">
          <ClipboardList size={26} className="mx-auto text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">
            {filtro === 'TODAS'
              ? t('req.vazio')
              : t('req.vazio_estado', { estado: t(`req.estado.${filtro}`) })}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {requisicoes.map((requisicao) => (
            <li
              key={requisicao.id}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-medium text-slate-900">
                      {requisicao.numero}
                    </span>
                    <Etiqueta estado={requisicao.estado} />
                    {requisicao.sodExcepcao && (
                      <span
                        className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700"
                        title={t('req.auto_aprovada_ajuda')}
                      >
                        <UserCheck size={9} />
                        {t('req.auto_aprovada')}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                    <span>{requisicao.loja?.nome ?? '—'}</span>
                    <span>{t('req.linhas', { count: requisicao.linhas.length })}</span>
                    {requisicao.dataNecessidade && (
                      <span>
                        {t('req.ate')} {formatData(requisicao.dataNecessidade)}
                      </span>
                    )}
                    {requisicao.estrategiaAdjudicada && (
                      <span className="text-slate-600">
                        {t(`req.estrategia.${requisicao.estrategiaAdjudicada}`)}
                      </span>
                    )}
                  </p>

                  {requisicao.estado === 'PARCIALMENTE_ADJUDICADA' && (
                    <SaldoPendente requisicao={requisicao} />
                  )}

                  {requisicao.motivoDesvio && (
                    <p className="mt-1.5 rounded bg-amber-50 px-2 py-1 text-[11px] leading-snug text-amber-800">
                      <span className="font-medium">{t('req.desvio')}</span>{' '}
                      {requisicao.motivoDesvio}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-1.5">
                  {podeEditarLinhas(requisicao) && podeCriar && (
                    <Accao
                      onClick={() => setAEditarLinhas(requisicao)}
                      icone={<ListPlus size={13} />}
                      texto={t('req.editar_linhas')}
                    />
                  )}

                  {podeSubmeter(requisicao) && podeCriar && (
                    <Accao
                      onClick={() => submeter.mutate(requisicao.id)}
                      pendente={submeter.isPending && submeter.variables === requisicao.id}
                      icone={<Send size={13} />}
                      texto={t('req.submeter')}
                    />
                  )}

                  {podeDecidir(requisicao) && podeGerir && (
                    <Accao
                      onClick={() => setADecidir(requisicao)}
                      icone={<Check size={13} />}
                      texto={t('req.decidir')}
                      destaque
                    />
                  )}

                  {podeCorrerSourcing(requisicao) && podeSourcing && (
                    <Accao
                      onClick={() => correrSourcing.mutate(requisicao)}
                      pendente={
                        correrSourcing.isPending &&
                        correrSourcing.variables?.id === requisicao.id
                      }
                      icone={<Radar size={13} />}
                      texto={
                        requisicao.estado === 'APROVADA'
                          ? t('req.comparar')
                          : t('req.comparar_de_novo')
                      }
                      destaque={requisicao.estado === 'APROVADA'}
                    />
                  )}

                  {podeAdjudicar(requisicao) && podeGerir && (
                    <Accao
                      onClick={() => abrirComparacaoExistente.mutate(requisicao)}
                      pendente={
                        abrirComparacaoExistente.isPending &&
                        abrirComparacaoExistente.variables?.id === requisicao.id
                      }
                      icone={<Gavel size={13} />}
                      texto={t('req.adjudicar')}
                      destaque
                    />
                  )}

                  {podeReabrir(requisicao) && podeGerir && (
                    <Accao
                      onClick={() => setAReabrir(requisicao)}
                      icone={<RotateCcw size={13} />}
                      texto={t('req.reabrir')}
                    />
                  )}

                  {podeCancelar(requisicao) && podeGerir && (
                    <Accao
                      onClick={() => setACancelar(requisicao)}
                      icone={<XCircle size={13} />}
                      texto={t('acao.cancelar')}
                    />
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {aCriar && (
        <CriarRequisicaoModal onClose={() => setACriar(false)} onSuccess={recarregar} />
      )}

      {comparacao && (
        <SourcingComparacaoModal
          requisicao={comparacao.requisicao}
          run={comparacao.run}
          onClose={() => setComparacao(null)}
          onAdjudicado={recarregar}
        />
      )}

      {aDecidir && (
        <DecidirModal
          requisicao={aDecidir}
          utilizadorId={utilizadorId}
          onClose={() => setADecidir(null)}
          onSuccess={recarregar}
        />
      )}

      {aEditarLinhas && (
        <EditarLinhasModal
          requisicao={aEditarLinhas}
          onClose={() => setAEditarLinhas(null)}
          onSuccess={recarregar}
        />
      )}

      {aReabrir && (
        <MotivoModal
          titulo={t('req.reabrir_titulo', { numero: aReabrir.numero })}
          descricao={t('req.reabrir_descricao')}
          textoConfirmar={t('req.reabrir')}
          onConfirmar={(motivo) => reabrir.mutateAsync({ requisicao: aReabrir, motivo })}
          onClose={() => setAReabrir(null)}
        />
      )}

      {aCancelar && (
        <MotivoModal
          titulo={t('req.cancelar_titulo', { numero: aCancelar.numero })}
          descricao={t('req.cancelar_descricao')}
          textoConfirmar={t('req.cancelar_requisicao')}
          corConfirmar="rose"
          onConfirmar={(motivo) => cancelar.mutateAsync({ requisicao: aCancelar, motivo })}
          onClose={() => setACancelar(null)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Peças
// ═══════════════════════════════════════════════════════════════════════════════

const CORES: Record<EstadoRequisicao, string> = {
  RASCUNHO: 'bg-slate-100 text-slate-600',
  AGUARDA_APROVACAO: 'bg-amber-100 text-amber-700',
  APROVADA: 'bg-blue-100 text-blue-700',
  EM_SOURCING: 'bg-violet-100 text-violet-700',
  EM_DECISAO: 'bg-violet-100 text-violet-700',
  ADJUDICADA: 'bg-emerald-100 text-emerald-700',
  // Amarelo e não verde, de propósito: há saldo sem fornecedor, e uma requisição parcial que
  // pareça concluída fica na lista de pendências para sempre.
  PARCIALMENTE_ADJUDICADA: 'bg-amber-100 text-amber-700',
  CANCELADA: 'bg-slate-100 text-slate-400',
};

function Etiqueta({ estado }: { estado: EstadoRequisicao }) {
  const { t } = useTranslation('b2b');
  return (
    <span
      className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium uppercase', CORES[estado])}
    >
      {t(`req.estado.${estado}`)}
    </span>
  );
}

/**
 * As linhas que ficaram sem fornecedor.
 *
 * Uma requisição parcialmente adjudicada não é um erro — é o saldo que precisa de nova
 * decisão. O que seria um erro é não a distinguir de uma adjudicada, e é para isso que este
 * bloco existe: o saldo tem de estar visível na listagem, não escondido a dois cliques.
 */
function SaldoPendente({ requisicao }: { requisicao: Requisicao }) {
  const { t } = useTranslation('b2b');
  const saldo = saldoPorAdjudicar(requisicao);
  if (saldo.length === 0) return null;

  return (
    <p className="mt-1.5 flex items-start gap-1.5 rounded bg-amber-50 px-2 py-1 text-[11px] leading-snug text-amber-800">
      <AlertTriangle size={11} className="mt-0.5 shrink-0" />
      <span>
        {t('req.saldo_sem_fornecedor', { count: saldo.length })}{' '}
        {saldo
          .slice(0, 3)
          .map((l) => `${l.produto?.nome ?? l.produtoId} (${l.quantidade - l.quantidadeAdjudicada})`)
          .join(', ')}
        {saldo.length > 3 && ` ${t('req.saldo_e_mais', { n: saldo.length - 3 })}`}.{' '}
        {t('req.saldo_comparar')}
      </span>
    </p>
  );
}

function Accao({
  onClick,
  pendente,
  icone,
  texto,
  destaque,
}: {
  onClick: () => void;
  pendente?: boolean;
  icone: React.ReactNode;
  texto: string;
  destaque?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={pendente}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
        destaque
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'border border-slate-300 text-slate-700 hover:bg-slate-50',
      )}
    >
      {pendente ? <Loader2 size={13} className="animate-spin" /> : icone}
      {texto}
    </button>
  );
}

/**
 * Aprovar ou recusar a requisição.
 *
 * O aviso de auto-aprovação aparece **antes** de decidir, e não depois num relatório de
 * auditoria. Quem está prestes a aprovar o que submeteu deve saber que a acção fica marcada
 * — a marca é legítima, mas a surpresa não é.
 */
function DecidirModal({
  requisicao,
  utilizadorId,
  onClose,
  onSuccess,
}: {
  requisicao: Requisicao;
  utilizadorId?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation('b2b');
  const [decisao, setDecisao] = useState<'APROVAR' | 'RECUSAR' | null>(null);
  const [motivo, setMotivo] = useState('');
  const [aGravar, setAGravar] = useState(false);

  const vaiAutoAprovar =
    !!utilizadorId &&
    decisao === 'APROVAR' &&
    (requisicao.submetidaPorId ?? requisicao.criadoPorId) === utilizadorId;

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisao) return;

    if (decisao === 'RECUSAR' && motivo.trim().length < 5) {
      toast.error(t('req.decidir_erro_motivo'));
      return;
    }

    setAGravar(true);
    try {
      await b2bApi.decidir(requisicao.id, { decisao, motivo: motivo.trim() || undefined });
      toast.success(
        decisao === 'APROVAR'
          ? t('req.aprovada', { numero: requisicao.numero })
          : t('req.devolvida', { numero: requisicao.numero }),
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? t('req.decidir_erro'));
    } finally {
      setAGravar(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <form onSubmit={submeter} className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {t('req.decidir_titulo', { numero: requisicao.numero })}
          </h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-400">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-4 px-5 py-5">
          <p className="text-xs text-slate-500">
            {t('req.linhas', { count: requisicao.linhas.length })} · {requisicao.loja?.nome}
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDecisao('APROVAR')}
              className={cn(
                'rounded-md border px-3 py-2 text-sm font-medium',
                decisao === 'APROVAR'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50',
              )}
            >
              {t('req.aprovar')}
            </button>
            <button
              type="button"
              onClick={() => setDecisao('RECUSAR')}
              className={cn(
                'rounded-md border px-3 py-2 text-sm font-medium',
                decisao === 'RECUSAR'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50',
              )}
            >
              {t('req.recusar')}
            </button>
          </div>

          {vaiAutoAprovar && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
              <UserCheck size={14} className="mt-0.5 shrink-0 text-amber-600" />
              <p className="text-[11px] leading-snug text-amber-800">
                {t('req.auto_aprovar_aviso')}
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700">
              {t('motivo.motivo')} {decisao === 'RECUSAR' && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <footer className="flex justify-end gap-2 rounded-b-xl border-t border-slate-100 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
          >
            {t('acao.cancelar')}
          </button>
          <button
            type="submit"
            disabled={aGravar || !decisao}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {aGravar && <Loader2 size={15} className="animate-spin" />}
            {t('req.confirmar')}
          </button>
        </footer>
      </form>
    </div>
  );
}
