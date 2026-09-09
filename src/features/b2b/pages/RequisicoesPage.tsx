import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Check,
  ClipboardList,
  Gavel,
  Loader2,
  Plus,
  Radar,
  Send,
  UserCheck,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  b2bApi,
  ETIQUETA_ESTADO,
  ETIQUETA_ESTRATEGIA,
  podeAdjudicar,
  podeCorrerSourcing,
  podeDecidir,
  podeSubmeter,
  saldoPorAdjudicar,
} from '../api/b2b.api';
import type { EstadoRequisicao, Requisicao, SourcingRun } from '../api/b2b.api';
import { CriarRequisicaoModal } from '../components/CriarRequisicaoModal';
import { SourcingComparacaoModal } from '../components/SourcingComparacaoModal';
import { usePermissions, useAuth } from '@/features/auth';
import { cn } from '@/shared/utils';

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
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const utilizadorId = useAuth().user?.id;

  const [filtro, setFiltro] = useState<EstadoRequisicao | 'TODAS'>('TODAS');
  const [aCriar, setACriar] = useState(false);
  const [comparacao, setComparacao] = useState<{ requisicao: Requisicao; run: SourcingRun } | null>(
    null,
  );
  const [aDecidir, setADecidir] = useState<Requisicao | null>(null);

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
      toast.success(`${r.numero} submetida. Aguarda aprovação.`);
      recarregar();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao submeter.'),
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
        toast.error(
          'Nenhum fornecedor elegível. Abra a comparação para ver os motivos de exclusão — ' +
            'a maioria resolve-se com um telefonema.',
          { duration: 7000 },
        );
      }

      setComparacao({ requisicao, run });
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? 'Erro ao correr o sourcing.'),
  });

  const abrirComparacaoExistente = useMutation({
    mutationFn: async (requisicao: Requisicao) => {
      const runs = await b2bApi.listarRuns(requisicao.id);
      if (runs.length === 0) throw new Error('Esta requisição ainda não foi a sourcing.');
      const run = await b2bApi.obterRun(runs[0].id);
      return { requisicao, run };
    },
    onSuccess: (dados) => setComparacao(dados),
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? e?.message ?? 'Erro ao abrir a comparação.'),
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <ClipboardList size={18} className="text-blue-600" />
            Requisições de compra
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            O que as lojas precisam. O fornecedor é escolhido por comparação, não por hábito.
          </p>
        </div>

        {podeCriar && (
          <button
            onClick={() => setACriar(true)}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={15} />
            Nova requisição
          </button>
        )}
      </header>

      <div className="flex flex-wrap gap-1.5">
        {(['TODAS', ...Object.keys(ETIQUETA_ESTADO)] as (EstadoRequisicao | 'TODAS')[]).map(
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
              {estado === 'TODAS' ? 'Todas' : ETIQUETA_ESTADO[estado]}
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
              ? 'Ainda não há requisições.'
              : `Nenhuma requisição em «${ETIQUETA_ESTADO[filtro as EstadoRequisicao]}».`}
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
                        title="Quem submeteu foi quem aprovou, ao abrigo da excepção autorizada REQ_CRIAR_APROVAR. Permitido — há lojas com uma pessoa só — mas registado."
                      >
                        <UserCheck size={9} />
                        auto-aprovada
                      </span>
                    )}
                  </div>

                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                    <span>{requisicao.loja?.nome ?? '—'}</span>
                    <span>
                      {requisicao.linhas.length} linha
                      {requisicao.linhas.length === 1 ? '' : 's'}
                    </span>
                    {requisicao.dataNecessidade && (
                      <span>
                        até{' '}
                        {new Date(requisicao.dataNecessidade).toLocaleDateString('pt-PT')}
                      </span>
                    )}
                    {requisicao.estrategiaAdjudicada && (
                      <span className="text-slate-600">
                        {ETIQUETA_ESTRATEGIA[requisicao.estrategiaAdjudicada]}
                      </span>
                    )}
                  </p>

                  {requisicao.estado === 'PARCIALMENTE_ADJUDICADA' && (
                    <SaldoPendente requisicao={requisicao} />
                  )}

                  {requisicao.motivoDesvio && (
                    <p className="mt-1.5 rounded bg-amber-50 px-2 py-1 text-[11px] leading-snug text-amber-800">
                      <span className="font-medium">Desvio da recomendação:</span>{' '}
                      {requisicao.motivoDesvio}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-1.5">
                  {podeSubmeter(requisicao) && podeCriar && (
                    <Accao
                      onClick={() => submeter.mutate(requisicao.id)}
                      pendente={submeter.isPending && submeter.variables === requisicao.id}
                      icone={<Send size={13} />}
                      texto="Submeter"
                    />
                  )}

                  {podeDecidir(requisicao) && podeGerir && (
                    <Accao
                      onClick={() => setADecidir(requisicao)}
                      icone={<Check size={13} />}
                      texto="Decidir"
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
                      texto={requisicao.estado === 'APROVADA' ? 'Comparar' : 'Comparar de novo'}
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
                      texto="Adjudicar"
                      destaque
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
  return (
    <span
      className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium uppercase', CORES[estado])}
    >
      {ETIQUETA_ESTADO[estado]}
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
  const saldo = saldoPorAdjudicar(requisicao);
  if (saldo.length === 0) return null;

  return (
    <p className="mt-1.5 flex items-start gap-1.5 rounded bg-amber-50 px-2 py-1 text-[11px] leading-snug text-amber-800">
      <AlertTriangle size={11} className="mt-0.5 shrink-0" />
      <span>
        {saldo.length} linha{saldo.length === 1 ? '' : 's'} sem fornecedor:{' '}
        {saldo
          .slice(0, 3)
          .map((l) => `${l.produto?.nome ?? l.produtoId} (${l.quantidade - l.quantidadeAdjudicada})`)
          .join(', ')}
        {saldo.length > 3 && ` e ${saldo.length - 3} mais`}. Compare outra vez para as adjudicar.
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
      toast.error(
        'Recusar exige um motivo — é o que quem for corrigir a requisição vai ler. Sem ele, ' +
          'ela volta amanhã na mesma forma.',
      );
      return;
    }

    setAGravar(true);
    try {
      await b2bApi.decidir(requisicao.id, { decisao, motivo: motivo.trim() || undefined });
      toast.success(
        decisao === 'APROVAR'
          ? `${requisicao.numero} aprovada. Já pode ir a sourcing.`
          : `${requisicao.numero} devolvida a rascunho.`,
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Erro ao registar a decisão.');
    } finally {
      setAGravar(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <form onSubmit={submeter} className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Decidir {requisicao.numero}
          </h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-400">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-4 px-5 py-5">
          <p className="text-xs text-slate-500">
            {requisicao.linhas.length} linha
            {requisicao.linhas.length === 1 ? '' : 's'} · {requisicao.loja?.nome}
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
              Aprovar
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
              Recusar
            </button>
          </div>

          {vaiAutoAprovar && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
              <UserCheck size={14} className="mt-0.5 shrink-0 text-amber-600" />
              <p className="text-[11px] leading-snug text-amber-800">
                Foi você que submeteu esta requisição. A aprovação passa — há lojas com uma
                pessoa só — mas fica marcada como excepção de segregação de funções.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Motivo {decisao === 'RECUSAR' && <span className="text-red-500">*</span>}
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
            Cancelar
          </button>
          <button
            type="submit"
            disabled={aGravar || !decisao}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {aGravar && <Loader2 size={15} className="animate-spin" />}
            Confirmar
          </button>
        </footer>
      </form>
    </div>
  );
}
