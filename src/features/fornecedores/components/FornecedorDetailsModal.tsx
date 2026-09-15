import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  X, Truck, Loader2, AlertTriangle, Clock, TrendingUp, PackageCheck, CalendarClock,
  Building2, Search, GitMerge,
} from 'lucide-react';
import { suppliersApi, b2bFornecedorApi } from '../api/suppliers.api';
import type { Supplier, SuspeitaDuplicado } from '../api/suppliers.api';
import { Tabs, type TabDefinition } from '@/shared/ui';
import { cn } from '@/shared/utils';
import { usePermissions } from '@/features/auth';

type Aba = 'desempenho' | 'historico' | 'organizacao';

const ABAS: TabDefinition<Aba>[] = [
  { id: 'desempenho', label: 'Desempenho', icon: TrendingUp },
  { id: 'historico', label: 'Histórico de compras', icon: Clock },
  { id: 'organizacao', label: 'Organização', icon: Building2 },
];

const moeda = (valor: number) =>
  valor.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });

const data = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

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
  const [aba, setAba] = useState<Aba>('desempenho');

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
                {fornecedor.tipoFornecimento || 'Sem tipo definido'}
                {fornecedor.nuit && ` · NUIT ${fornecedor.nuit}`}
                {!fornecedor.isActive && (
                  <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                    Suspenso
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <Tabs tabs={ABAS} active={aba} onChange={setAba} label="Dados do fornecedor" className="px-4" />

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
  if (query.isLoading) return <Carregando texto="A calcular o desempenho..." />;
  if (query.error) return <Falhou />;

  const d = query.data?.desempenho;
  if (!d) return <Falhou />;

  if (d.pedidos === 0) {
    return (
      <p className="py-12 text-center text-sm text-slate-500">
        Ainda não há pedidos de compra a este fornecedor. O desempenho aparece assim que
        houver o primeiro.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Prazo real ─────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Prazo de entrega</h3>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Dias entre encomendar e a primeira entrega. Diz com quanta antecedência se tem
          de encomendar.
        </p>

        {d.prazoMedioDias === null ? (
          <p className="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
            {d.pedidos} pedido(s) sem nenhuma entrega registada — não há prazo a medir.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-slate-100">
            <Metrica rotulo="Mais rápido" valor={`${d.prazoMinimoDias} dias`} />
            <Metrica rotulo="Média" valor={`${d.prazoMedioDias} dias`} destaque />
            <Metrica rotulo="Mais lento" valor={`${d.prazoMaximoDias} dias`} />
          </div>
        )}
      </section>

      {/* ── Pontualidade ───────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Pontualidade</h3>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Entregas dentro da data combinada. Diz se se pode confiar na data que o
          fornecedor promete — que é diferente de ser rápido.
        </p>

        {d.pontualidadePercent === null ? (
          <p className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Nenhum dos pedidos tinha data de entrega combinada, pelo que não é possível
            medir a pontualidade. Preencha a data prevista ao criar os próximos pedidos.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-slate-100">
            <Metrica
              rotulo="Dentro do prazo"
              valor={`${d.pontualidadePercent}%`}
              destaque
              alerta={d.pontualidadePercent < 70}
            />
            <Metrica rotulo="Entregas atrasadas" valor={String(d.entregasAtrasadas)} />
            <Metrica
              rotulo="Atraso médio"
              valor={d.atrasoMedioDias === null ? '—' : `${d.atrasoMedioDias} dias`}
            />
          </div>
        )}
        <p className="mt-2 text-xs text-slate-400">
          Baseado em {d.pedidosComDataPrevista} de {d.pedidos} pedido(s) com data combinada.
        </p>
      </section>

      {/* ── Cumprimento ────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2">
          <PackageCheck className="h-4 w-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Quantidades e valores</h3>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Distingue quem entrega tarde de quem entrega a menos.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-slate-100 sm:grid-cols-4">
          <Metrica rotulo="Pedidos" valor={String(d.pedidos)} />
          <Metrica
            rotulo="Cumprimento"
            valor={d.cumprimentoPercent === null ? '—' : `${d.cumprimentoPercent}%`}
            alerta={d.cumprimentoPercent !== null && d.cumprimentoPercent < 90}
          />
          <Metrica rotulo="Encomendado" valor={moeda(d.valorEncomendado)} />
          <Metrica rotulo="Recebido" valor={moeda(d.valorRecebido)} />
        </div>
      </section>

      <p className="border-t border-slate-100 pt-4 text-xs text-slate-400">
        Recepções anuladas não contam para nenhuma destas medidas — não houve entrega.
      </p>
    </div>
  );
}

// ── Histórico ────────────────────────────────────────────────────────────────

function Historico({ query }: { query: ReturnType<typeof useQuery<any>> }) {
  if (query.isLoading) return <Carregando texto="A carregar o histórico..." />;
  if (query.error) return <Falhou />;

  const pedidos = query.data?.pedidos ?? [];

  if (pedidos.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-slate-500">
        Ainda não há pedidos de compra a este fornecedor.
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
                Pedido em {data(p.dataPedido)}
                {p.dataPrevista && ` · previsto para ${data(p.dataPrevista)}`}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-900">{moeda(p.valorPedido)}</p>
              <p className="text-xs text-slate-500">
                {p.linhas} {p.linhas === 1 ? 'linha' : 'linhas'}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-xs">
            <span className="text-slate-500">
              Pedido: <strong className="text-slate-700">{p.quantidadePedida}</strong>
            </span>
            <span className="text-slate-500">
              Recebido: <strong className="text-slate-700">{p.quantidadeRecebida}</strong>
            </span>
            {p.pendente > 0 && (
              <span className="font-medium text-amber-600">Pendente: {p.pendente}</span>
            )}
          </div>

          {p.rececoes.length > 0 && (
            <div className="mt-3 space-y-1 border-t border-slate-100 pt-3">
              <p className="text-xs font-medium text-slate-500">Recepções</p>
              {p.rececoes.map((r: any) => (
                <p key={r.rececaoId} className="text-xs text-slate-600">
                  {data(r.data)} · {r.armazem ?? 'armazém n/d'} · {moeda(r.valor)}
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
          A mostrar os 50 pedidos mais recentes.
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
        Cadastro anterior à separação de identidade — sem organização própria associada.
      </p>
    );
  }

  if (query.isLoading) return <Carregando texto="A carregar a organização..." />;
  if (query.error || !query.data) return <Falhou />;

  const org = query.data;

  return (
    <div className="space-y-4">
      {org.fundidaEmId && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Esta organização foi fundida noutra em {data(org.fundidaEm ?? null)}.
          {org.motivoFusao && ` Motivo: ${org.motivoFusao}.`}
        </p>
      )}

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Campo rotulo="Razão social" valor={org.razaoSocial} />
        <Campo rotulo="Nome comercial" valor={org.nomeComercial} />
        <Campo rotulo="NUIT" valor={org.nuit} />
        <Campo rotulo="Sede" valor={org.sede} />
        <Campo rotulo="Email" valor={org.email} />
        <Campo rotulo="Telefone" valor={org.telefone} />
      </dl>

      {podeFundir && !org.fundidaEmId && (
        <div className="border-t border-slate-100 pt-4">
          <button
            onClick={() => setAFundir(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <GitMerge size={15} /> Fundir com outra organização
          </button>
          <p className="mt-1.5 text-xs text-slate-500">
            Para quando duas organizações na plataforma são a mesma empresa. Reversível —
            fica registada como remissivo, não apagada.
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
      toast.error(error?.response?.data?.message || 'Erro ao procurar organizações.');
    } finally {
      setAPesquisar(false);
    }
  };

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alvo) return toast.error('Escolha a organização a fundir.');
    if (motivo.trim().length < 5) {
      return toast.error('Indique o motivo — fica registado na fusão.');
    }

    setAGravar(true);
    try {
      const resultado = await b2bFornecedorApi.fundirOrganizacoes({
        perdedoraId: alvo.organizacaoId,
        sobreviventeId: organizacao.id,
        motivo: motivo.trim(),
      });
      toast.success(
        `Fundida. ${resultado.relacoesMovidas} relação(ões) e ${resultado.contasMovidas} conta(s) movidas.`,
      );
      onSuccess();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao fundir as organizações.');
    } finally {
      setAGravar(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4">
      <form onSubmit={submeter} className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Fundir organização</h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-4 px-5 py-4">
          <p className="text-xs text-slate-500">
            <strong className="text-slate-700">{organizacao.razaoSocial}</strong> fica. A que
            escolher é absorvida — as suas relações comerciais e contas bancárias passam para
            esta.
          </p>

          {alvo ? (
            <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm">
              <span className="font-medium text-slate-900">{alvo.razaoSocial}</span>
              <button type="button" onClick={() => setAlvo(null)} className="text-xs text-blue-600 hover:underline">
                trocar
              </button>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Procurar a organização a absorver
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={pesquisa}
                    onChange={(e) => setPesquisa(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), pesquisar())}
                    placeholder="Razão social..."
                    className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={pesquisar}
                  disabled={aPesquisar}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {aPesquisar ? <Loader2 size={14} className="animate-spin" /> : 'Procurar'}
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
              Motivo <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              placeholder="Ex.: mesmo NUIT, cadastrado duas vezes por engano."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={aGravar || !alvo}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {aGravar && <Loader2 size={14} className="animate-spin" />}
            Fundir
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
      {estado}
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
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <AlertTriangle className="h-6 w-6 text-amber-500" />
      <p className="text-sm text-slate-600">Não foi possível carregar estes dados.</p>
    </div>
  );
}
