import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X, Truck, Loader2, AlertTriangle, Clock, TrendingUp, PackageCheck, CalendarClock,
} from 'lucide-react';
import { suppliersApi } from '../api/suppliers.api';
import type { Supplier } from '../api/suppliers.api';
import { Tabs, type TabDefinition } from '@/shared/ui';
import { cn } from '@/shared/utils';

type Aba = 'desempenho' | 'historico';

const ABAS: TabDefinition<Aba>[] = [
  { id: 'desempenho', label: 'Desempenho', icon: TrendingUp },
  { id: 'historico', label: 'Histórico de compras', icon: Clock },
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
