import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
  X, Truck, Loader2, AlertTriangle, Clock, TrendingUp, PackageCheck, CalendarClock,
  Building2, Search, GitMerge,
} from 'lucide-react';
import { suppliersApi, b2bFornecedorApi } from '../api/suppliers.api';
import type { Supplier, SuspeitaDuplicado } from '../api/suppliers.api';
import { Tabs, type TabDefinition } from '@/shared/ui';
import { cn, formatData, formatMoeda, mensagemDeErro } from '@/shared/utils';
import { usePermissions } from '@/features/auth';

type Aba = 'desempenho' | 'historico' | 'organizacao';

type EstadoPedido = 'RASCUNHO' | 'ENVIADO' | 'PENDENTE' | 'PARCIAL' | 'RECEBIDO' | 'CANCELADO';

const ESTADOS_PEDIDO: EstadoPedido[] = ['RASCUNHO', 'ENVIADO', 'PENDENTE', 'PARCIAL', 'RECEBIDO', 'CANCELADO'];

const moeda = formatMoeda;

const data = (iso: string | null) => (iso ? formatData(iso) : '—');

/**
 * Desempenho e histórico de um fornecedor.
 *
 * ## Porque a distinção entre prazo e pontualidade tem destaque
 *
 * Um fornecedor que leva 20 dias mas entrega sempre na data combinada é mais fiável,
 * para planear, do que um que leva 5 e falha metade das datas. A tool
 * `get_supplier_lead_time` media só o prazo e chamava-lhe fiabilidade; aqui as duas
 * medidas aparecem lado a lado, com o número de pedidos em que cada uma se baseia.
 *
 * ## Os nulos dizem algo
 *
 * Pontualidade sem valor significa que nenhum pedido tinha data combinada — não «0%
 * pontual». Mostrar zero seria acusar o fornecedor de um incumprimento que não se sabe
 * se houve, e é o tipo de número que se repete numa negociação.
 */
export function FornecedorDetailsModal({
  fornecedor,
  onClose,
}: {
  fornecedor: Supplier;
  onClose: () => void;
}) {
  const { t } = useTranslation('fornecedores');
  const [aba, setAba] = useState<Aba>('desempenho');

  const abas: TabDefinition<Aba>[] = [
    { id: 'desempenho', label: t('det.aba_desempenho'), icon: TrendingUp },
    { id: 'historico', label: t('det.aba_historico'), icon: Clock },
    { id: 'organizacao', label: t('det.aba_organizacao'), icon: Building2 },
  ];

  const desempenhoQuery = useQuery({
    queryKey: ['fornecedor-desempenho', fornecedor.id],
    queryFn: () => suppliersApi.getDesempenho(fornecedor.id),
  });

  const historicoQuery = useQuery({
    queryKey: ['fornecedor-historico', fornecedor.id],
    queryFn: () => suppliersApi.getHistorico(fornecedor.id),
    // Só quando se abre o separador: o histórico traz os itens e as recepções de cada
    // pedido, e é bastante mais pesado do que o resumo.
    enabled: aba === 'historico',
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{fornecedor.nome}</h2>
              <p className="text-sm text-slate-500">
                {fornecedor.tipoFornecimento || t('det.sem_tipo')}
                {fornecedor.nuit && ` · NUIT ${fornecedor.nuit}`}
                {!fornecedor.isActive && (
                  <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                    {t('estado.suspenso')}
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label={t('acao.fechar')}
          >
            <X size={20} />
          </button>
        </div>

        <Tabs tabs={abas} active={aba} onChange={setAba} label={t('det.dados_fornecedor')} className="px-4" />

        <div className="flex-1 overflow-y-auto p-6">
          {aba === 'desempenho' && (
            <Desempenho query={desempenhoQuery} />
          )}
          {aba === 'historico' && <Historico query={historicoQuery} />}
          {aba === 'organizacao' && <Organizacao fornecedor={fornecedor} />}
        </div>
      </div>
    </div>
  );
}

// ── Desempenho ───────────────────────────────────────────────────────────────

function Desempenho({ query }: { query: ReturnType<typeof useQuery<any>> }) {
  const { t } = useTranslation('fornecedores');

  if (query.isLoading) return <Carregando texto={t('det.a_calcular')} />;
  if (query.error) return <Falhou />;

  const d = query.data?.desempenho;
  if (!d) return <Falhou />;

  if (d.pedidos === 0) {
    return (
      <p className="py-12 text-center text-sm text-slate-500">
        {t('det.sem_pedidos_desempenho')}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Prazo real ─────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">{t('det.prazo_titulo')}</h3>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {t('det.prazo_ajuda')}
        </p>

        {d.prazoMedioDias === null ? (
          <p className="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
            {t('det.sem_entregas', { n: d.pedidos })}
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-slate-100">
            <Metrica rotulo={t('det.mais_rapido')} valor={t('det.dias', { count: d.prazoMinimoDias })} />
            <Metrica rotulo={t('det.media')} valor={t('det.dias', { count: d.prazoMedioDias })} destaque />
            <Metrica rotulo={t('det.mais_lento')} valor={t('det.dias', { count: d.prazoMaximoDias })} />
          </div>
        )}
      </section>

      {/* ── Pontualidade ───────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">{t('det.pontualidade_titulo')}</h3>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {t('det.pontualidade_ajuda')}
        </p>

        {d.pontualidadePercent === null ? (
          <p className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {t('det.pontualidade_sem_dados')}
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-slate-100">
            <Metrica
              rotulo={t('det.dentro_prazo')}
              valor={`${d.pontualidadePercent}%`}
              destaque
              alerta={d.pontualidadePercent < 70}
            />
            <Metrica rotulo={t('det.entregas_atrasadas')} valor={String(d.entregasAtrasadas)} />
            <Metrica
              rotulo={t('det.atraso_medio')}
              valor={d.atrasoMedioDias === null ? '—' : t('det.dias', { count: d.atrasoMedioDias })}
            />
          </div>
        )}
        <p className="mt-2 text-xs text-slate-400">
          {t('det.baseado_em', { com: d.pedidosComDataPrevista, total: d.pedidos })}
        </p>
      </section>

      {/* ── Cumprimento ────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2">
          <PackageCheck className="h-4 w-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">{t('det.quantidades_titulo')}</h3>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {t('det.quantidades_ajuda')}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-slate-100 sm:grid-cols-4">
          <Metrica rotulo={t('det.pedidos')} valor={String(d.pedidos)} />
          <Metrica
            rotulo={t('det.cumprimento')}
            valor={d.cumprimentoPercent === null ? '—' : `${d.cumprimentoPercent}%`}
            alerta={d.cumprimentoPercent !== null && d.cumprimentoPercent < 90}
          />
          <Metrica rotulo={t('det.encomendado')} valor={moeda(d.valorEncomendado)} />
          <Metrica rotulo={t('det.recebido')} valor={moeda(d.valorRecebido)} />
        </div>
      </section>

      <p className="border-t border-slate-100 pt-4 text-xs text-slate-400">
        {t('det.rececoes_anuladas')}
      </p>
    </div>
  );
}

// ── Histórico ────────────────────────────────────────────────────────────────

function Historico({ query }: { query: ReturnType<typeof useQuery<any>> }) {
  const { t } = useTranslation('fornecedores');

  if (query.isLoading) return <Carregando texto={t('det.a_carregar_historico')} />;
  if (query.error) return <Falhou />;

  const pedidos = query.data?.pedidos ?? [];

  if (pedidos.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-slate-500">
        {t('det.sem_pedidos')}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {pedidos.map((p: any) => (
        <div key={p.pedidoId} className="rounded-lg border border-slate-200 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 font-medium text-slate-900">
                <span className="font-mono text-xs text-slate-400">
                  #{p.pedidoId.slice(0, 8)}
                </span>
                <EstadoBadge estado={p.estado} />
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {t('det.pedido_em', { data: data(p.dataPedido) })}
                {p.dataPrevista && ` · ${t('det.previsto_para', { data: data(p.dataPrevista) })}`}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-900">{moeda(p.valorPedido)}</p>
              <p className="text-xs text-slate-500">
                {t('det.linhas', { count: p.linhas })}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-xs">
            <span className="text-slate-500">
              {t('det.pedido')}: <strong className="text-slate-700">{p.quantidadePedida}</strong>
            </span>
            <span className="text-slate-500">
              {t('det.recebido')}: <strong className="text-slate-700">{p.quantidadeRecebida}</strong>
            </span>
            {p.pendente > 0 && (
              <span className="font-medium text-amber-600">{t('det.pendente')}: {p.pendente}</span>
            )}
          </div>

          {p.rececoes.length > 0 && (
            <div className="mt-3 space-y-1 border-t border-slate-100 pt-3">
              <p className="text-xs font-medium text-slate-500">{t('det.rececoes')}</p>
              {p.rececoes.map((r: any) => (
                <p key={r.rececaoId} className="text-xs text-slate-600">
                  {data(r.data)} · {r.armazem ?? t('det.armazem_nd')} · {moeda(r.valor)}
                  {r.recebidoPor && ` · ${r.recebidoPor}`}
                </p>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Nunca truncar em silêncio: 50 de 200 pedidos leriam-se como 200. */}
      {query.data?.truncado && (
        <p className="pt-2 text-center text-xs text-slate-400">
          {t('det.truncado')}
        </p>
      )}
    </div>
  );
}

// ── Organização ──────────────────────────────────────────────────────────────

/**
 * A identidade da organização por trás da relação comercial, e a fusão de duplicados.
 *
 * ## Porque não é um separador de edição
 *
 * NUIT, sede e contactos da **organização** são partilhados por todas as empresas que
 * compram a este fornecedor — editá-los aqui mudaria o que todas veem. O único acto
 * disponível é fundir: quando duas organizações na plataforma são de facto a mesma
 * empresa (um erro de cadastro, um fornecedor que se registou duas vezes), fundir uma na
 * outra sem tocar nas ordens de compra, recepções ou registos financeiros — todos apontam
 * para a relação, não para a organização.
 */
function Organizacao({ fornecedor }: { fornecedor: Supplier }) {
  const { t } = useTranslation('fornecedores');
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const podeFundir = hasPermission('manage', 'fornecedor');
  const [aFundir, setAFundir] = useState(false);

  const query = useQuery({
    queryKey: ['fornecedor-organizacao', fornecedor.organizacaoId],
    queryFn: () => b2bFornecedorApi.obterOrganizacao(fornecedor.organizacaoId!),
    enabled: !!fornecedor.organizacaoId,
  });

  if (!fornecedor.organizacaoId) {
    return (
      <p className="py-12 text-center text-sm text-slate-500">
        {t('det.cadastro_antigo')}
      </p>
    );
  }

  if (query.isLoading) return <Carregando texto={t('det.a_carregar_org')} />;
  if (query.error || !query.data) return <Falhou />;

  const org = query.data;

  return (
    <div className="space-y-4">
      {org.fundidaEmId && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {t('det.fundida_em', { data: data(org.fundidaEm ?? null) })}
          {org.motivoFusao && ` ${t('det.motivo_fusao', { motivo: org.motivoFusao })}`}
        </p>
      )}

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Campo rotulo={t('det.razao_social')} valor={org.razaoSocial} />
        <Campo rotulo={t('det.nome_comercial')} valor={org.nomeComercial} />
        <Campo rotulo={t('form.nuit')} valor={org.nuit} />
        <Campo rotulo={t('det.sede')} valor={org.sede} />
        <Campo rotulo={t('form.email')} valor={org.email} />
        <Campo rotulo={t('form.telefone')} valor={org.telefone} />
      </dl>

      {podeFundir && !org.fundidaEmId && (
        <div className="border-t border-slate-100 pt-4">
          <button
            onClick={() => setAFundir(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <GitMerge size={15} /> {t('det.fundir_com_outra')}
          </button>
          <p className="mt-1.5 text-xs text-slate-500">
            {t('det.fundir_ajuda')}
          </p>
        </div>
      )}

      {aFundir && (
        <FundirOrganizacaoModal
          organizacao={org}
          onClose={() => setAFundir(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['fornecedor-organizacao'] });
            setAFundir(false);
          }}
        />
      )}
    </div>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{rotulo}</dt>
      <dd className="text-sm text-slate-800">{valor || '—'}</dd>
    </div>
  );
}

function FundirOrganizacaoModal({
  organizacao,
  onClose,
  onSuccess,
}: {
  organizacao: { id: string; razaoSocial: string };
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation('fornecedores');
  const [pesquisa, setPesquisa] = useState('');
  const [candidatos, setCandidatos] = useState<SuspeitaDuplicado[]>([]);
  const [aPesquisar, setAPesquisar] = useState(false);
  const [alvo, setAlvo] = useState<SuspeitaDuplicado | null>(null);
  const [motivo, setMotivo] = useState('');
  const [aGravar, setAGravar] = useState(false);

  const pesquisar = async () => {
    if (pesquisa.trim().length < 2) return;
    setAPesquisar(true);
    try {
      const resultado = await b2bFornecedorApi.verificarDuplicado({ razaoSocial: pesquisa.trim() });
      setCandidatos(resultado.filter((c) => c.organizacaoId !== organizacao.id));
    } catch (error: any) {
      toast.error(mensagemDeErro(error, t('det.erro_procurar')));
    } finally {
      setAPesquisar(false);
    }
  };

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alvo) return toast.error(t('det.erro_escolher'));
    if (motivo.trim().length < 5) {
      return toast.error(t('det.erro_motivo'));
    }

    setAGravar(true);
    try {
      const resultado = await b2bFornecedorApi.fundirOrganizacoes({
        perdedoraId: alvo.organizacaoId,
        sobreviventeId: organizacao.id,
        motivo: motivo.trim(),
      });
      toast.success(
        t('det.fundida_ok', { relacoes: resultado.relacoesMovidas, contas: resultado.contasMovidas }),
      );
      onSuccess();
    } catch (error: any) {
      toast.error(mensagemDeErro(error, t('det.erro_fundir')));
    } finally {
      setAGravar(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4">
      <form onSubmit={submeter} className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t('det.fundir_titulo')}</h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-4 px-5 py-4">
          <p className="text-xs text-slate-500">
            <strong className="text-slate-700">{organizacao.razaoSocial}</strong>{' '}
            {t('det.fundir_explicacao')}
          </p>

          {alvo ? (
            <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm">
              <span className="font-medium text-slate-900">{alvo.razaoSocial}</span>
              <button type="button" onClick={() => setAlvo(null)} className="text-xs text-blue-600 hover:underline">
                {t('det.trocar')}
              </button>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                {t('det.procurar_absorver')}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={pesquisa}
                    onChange={(e) => setPesquisa(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), pesquisar())}
                    placeholder={t('det.razao_social_ph')}
                    className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={pesquisar}
                  disabled={aPesquisar}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {aPesquisar ? <Loader2 size={14} className="animate-spin" /> : t('det.procurar')}
                </button>
              </div>

              {candidatos.length > 0 && (
                <ul className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-slate-200">
                  {candidatos.map((c) => (
                    <li key={c.organizacaoId}>
                      <button
                        type="button"
                        onClick={() => setAlvo(c)}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        <span className="text-slate-800">{c.razaoSocial}</span>
                        <span className="text-xs text-slate-400">
                          {c.indicios.map((i) => i.descricao).join(', ')}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              {t('contas.decidir_motivo')} <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              placeholder={t('det.motivo_ph')}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
            {t('acao.cancelar')}
          </button>
          <button
            type="submit"
            disabled={aGravar || !alvo}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {aGravar && <Loader2 size={14} className="animate-spin" />}
            {t('det.fundir')}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Peças partilhadas ────────────────────────────────────────────────────────

function Metrica({
  rotulo,
  valor,
  destaque,
  alerta,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
  alerta?: boolean;
}) {
  return (
    <div className="bg-white px-4 py-3">
      <p className="text-xs text-slate-500">{rotulo}</p>
      <p
        className={cn(
          'mt-0.5 font-semibold',
          destaque ? 'text-base' : 'text-sm',
          alerta ? 'text-amber-600' : 'text-slate-900',
        )}
      >
        {valor}
      </p>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const { t } = useTranslation('fornecedores');
  const cores: Record<string, string> = {
    RASCUNHO: 'bg-slate-100 text-slate-700',
    ENVIADO: 'bg-blue-100 text-blue-700',
    PENDENTE: 'bg-amber-100 text-amber-800',
    PARCIAL: 'bg-amber-100 text-amber-800',
    RECEBIDO: 'bg-emerald-100 text-emerald-700',
    CANCELADO: 'bg-rose-100 text-rose-700',
  };

  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        cores[estado] ?? 'bg-slate-100 text-slate-700',
      )}
    >
      {(ESTADOS_PEDIDO as string[]).includes(estado)
        ? t(`det.estado_pedido.${estado as EstadoPedido}`)
        : estado}
    </span>
  );
}

function Carregando({ texto }: { texto: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
      <Loader2 className="h-4 w-4 animate-spin" />
      {texto}
    </div>
  );
}

function Falhou() {
  const { t } = useTranslation('fornecedores');

  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <AlertTriangle className="h-6 w-6 text-amber-500" />
      <p className="text-sm text-slate-600">{t('det.falhou')}</p>
    </div>
  );
}
