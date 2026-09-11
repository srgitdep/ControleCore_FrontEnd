import { useState } from 'react';
import {
  AlertTriangle,
  Award,
  Ban,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  CreditCard,
  Fingerprint,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Repeat,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Store,
  Trash2,
  TrendingUp,
  Undo2,
  Wallet,
  X,
} from 'lucide-react';
import {
  useVisao360,
  useRegistarConsentimento,
  useAdicionarIdentidade,
  useRemoverIdentidade,
} from '../hooks/useClientes';
import type {
  CanalComunicacao,
  EstadoRelacionamento,
  TipoIdentidade,
  Visao360,
} from '../api/clientes.api';
import { cn } from '@/shared/utils';
import { TableScroll } from '@/shared/ui';

const moeda = (valor: number) =>
  `${Number(valor).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT`;

const data = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ──── Estado do relacionamento ────────────────────────────────────────────────
// A cor diz o que o número sozinho não diz: um cliente que não compra há 90 dias
// precisa de atenção antes de alguém ter de calcular a diferença de datas.
const ESTADOS: Record<
  EstadoRelacionamento,
  { rotulo: string; classe: string; descricao: string }
> = {
  ACTIVO: {
    rotulo: 'Activo',
    classe: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    descricao: 'Comprou recentemente',
  },
  NOVO: {
    rotulo: 'Novo',
    classe: 'bg-blue-50 text-blue-700 border-blue-200',
    descricao: 'Primeira compra recente',
  },
  EM_RISCO: {
    rotulo: 'Em risco',
    classe: 'bg-amber-50 text-amber-700 border-amber-200',
    descricao: 'Há mais de 60 dias sem comprar',
  },
  INACTIVO: {
    rotulo: 'Inactivo',
    classe: 'bg-rose-50 text-rose-700 border-rose-200',
    descricao: 'Há mais de 120 dias sem comprar',
  },
  SEM_COMPRAS: {
    rotulo: 'Sem compras',
    classe: 'bg-slate-100 text-slate-600 border-slate-200',
    descricao: 'Registado, ainda não comprou',
  },
};

const ICONE_IDENTIDADE: Record<TipoIdentidade, React.ElementType> = {
  TELEFONE: Phone,
  EMAIL: Mail,
  NUIT: CreditCard,
  CARTAO_FIDELIZACAO: Award,
  WHATSAPP: MessageSquare,
  ECOMMERCE: Smartphone,
};

const ROTULO_IDENTIDADE: Record<TipoIdentidade, string> = {
  TELEFONE: 'Telefone',
  EMAIL: 'E-mail',
  NUIT: 'NUIT',
  CARTAO_FIDELIZACAO: 'Cartão',
  WHATSAPP: 'WhatsApp',
  ECOMMERCE: 'Loja online',
};

const CANAIS: CanalComunicacao[] = ['WHATSAPP', 'SMS', 'EMAIL', 'CHAMADA'];

const ROTULO_EVENTO: Record<string, string> = {
  COMPRA_POS: 'Compra na loja',
  COMPRA_ECOMMERCE: 'Compra online',
  DEVOLUCAO_POS: 'Devolução',
  CREDITO_BLOQUEADO: 'Crédito bloqueado',
  PAGAMENTO_RECEBIDO: 'Pagamento recebido',
  CLIENTE_IDENTIFICADO_POS: 'Identificado no balcão',
  CONSENTIMENTO_ALTERADO: 'Consentimento alterado',
  MENSAGEM_ENVIADA: 'Mensagem enviada',
  CAMPANHA_ENTRADA: 'Entrou em campanha',
};

// ──── Peças ───────────────────────────────────────────────────────────────────

function Medida({
  icon: Icon,
  label,
  value,
  sub,
  tom = 'neutro',
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  tom?: 'neutro' | 'alerta';
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon size={14} />
        <p className="text-[11px] font-semibold uppercase tracking-wider">{label}</p>
      </div>
      <p
        className={cn(
          'mt-1.5 text-xl font-bold tabular-nums',
          tom === 'alerta' ? 'text-rose-600' : 'text-slate-900',
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function Seccao({
  titulo,
  accao,
  children,
}: {
  titulo: string;
  accao?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">{titulo}</h3>
        {accao}
      </div>
      {children}
    </section>
  );
}

function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 py-6 text-center text-sm text-slate-400">
      {children}
    </div>
  );
}

// ──── Modal de nova identidade ────────────────────────────────────────────────

function IdentidadeModal({
  onClose,
  onSave,
  isSaving,
}: {
  onClose: () => void;
  onSave: (payload: { tipo: TipoIdentidade; valor: string }) => void;
  isSaving: boolean;
}) {
  const [tipo, setTipo] = useState<TipoIdentidade>('TELEFONE');
  const [valor, setValor] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-900">Ligar identidade</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (valor.trim()) onSave({ tipo, valor: valor.trim() });
          }}
          className="space-y-4 p-5"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoIdentidade)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {(Object.keys(ROTULO_IDENTIDADE) as TipoIdentidade[]).map((t) => (
                <option key={t} value={t}>
                  {ROTULO_IDENTIDADE[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Valor</label>
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder={tipo === 'EMAIL' ? 'cliente@email.com' : '+258 84 000 0000'}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Se já pertencer a outro cliente, é criada uma suspeita de duplicado para revisão.
            </p>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !valor.trim()}
              className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isSaving ? 'A ligar…' : 'Ligar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ──── Painel ──────────────────────────────────────────────────────────────────

export function Visao360Panel({
  clienteId,
  onBack,
}: {
  clienteId: string;
  onBack: () => void;
}) {
  const { data: visao, isLoading, isError } = useVisao360(clienteId);
  const [showIdentidade, setShowIdentidade] = useState(false);

  const consentimento = useRegistarConsentimento(clienteId);
  const novaIdentidade = useAdicionarIdentidade(clienteId);
  const removerId = useRemoverIdentidade(clienteId);

  if (isLoading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  if (isError || !visao) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-3 text-slate-400">
        <AlertTriangle size={36} strokeWidth={1} />
        <p className="text-sm">Não foi possível carregar a ficha do cliente.</p>
        <button onClick={onBack} className="text-sm font-medium text-slate-700 underline">
          Voltar à lista
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Cabecalho visao={visao} onBack={onBack} />

      <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-5">
        <Comportamento visao={visao} />

        {visao.segmentos.length > 0 && (
          <Seccao titulo="Segmentos">
            <Segmentos visao={visao} />
          </Seccao>
        )}

        <Seccao
          titulo="Identidades"
          accao={
            <button
              onClick={() => setShowIdentidade(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <Plus size={13} /> Ligar identidade
            </button>
          }
        >
          <Identidades
            visao={visao}
            onRemover={(id) => {
              if (confirm('Desligar esta identidade do cliente?')) removerId.mutate(id);
            }}
          />
        </Seccao>

        <Seccao titulo="Consentimentos de contacto">
          <Consentimentos
            visao={visao}
            onAlternar={(canal, concedido) =>
              consentimento.mutate({ finalidade: 'MARKETING', canal, concedido })
            }
            aGuardar={consentimento.isPending}
          />
        </Seccao>

        {visao.produtosRecorrentes.length > 0 && (
          <Seccao titulo="Compra com frequência">
            <div className="flex flex-wrap gap-2">
              {visao.produtosRecorrentes.map((p) => (
                <span
                  key={p.produtoId}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
                >
                  {p.nome}
                  <span className="rounded bg-slate-100 px-1.5 text-xs font-semibold tabular-nums text-slate-500">
                    {p.vezes}x
                  </span>
                </span>
              ))}
            </div>
          </Seccao>
        )}

        <Seccao titulo="Últimas compras">
          <UltimasCompras visao={visao} />
        </Seccao>

        <Seccao titulo="Actividade recente">
          <Timeline visao={visao} />
        </Seccao>
      </div>

      {showIdentidade && (
        <IdentidadeModal
          onClose={() => setShowIdentidade(false)}
          isSaving={novaIdentidade.isPending}
          onSave={(payload) =>
            novaIdentidade.mutate(payload, { onSuccess: () => setShowIdentidade(false) })
          }
        />
      )}
    </div>
  );
}

// ──── Blocos do painel ────────────────────────────────────────────────────────

function Cabecalho({ visao, onBack }: { visao: Visao360; onBack: () => void }) {
  const { cliente, comportamento } = visao;
  const estado = ESTADOS[comportamento.estado];

  return (
    <div className="border-b border-slate-100 p-5">
      <div className="flex items-start gap-3">
        <button onClick={onBack} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
          <ChevronLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-bold text-slate-900">{cliente.nome}</h2>
            <span
              title={estado.descricao}
              className={cn('rounded-full border px-2 py-0.5 text-xs font-semibold', estado.classe)}
            >
              {estado.rotulo}
            </span>
            {cliente.creditoBloqueado && (
              <span className="flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                <Ban size={11} /> Crédito bloqueado
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            Cliente desde {data(cliente.clienteDesde)}
            {comportamento.lojaPreferidaNome && ` · Loja habitual: ${comportamento.lojaPreferidaNome}`}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pontos</p>
          <p className="text-lg font-bold tabular-nums text-amber-600">{cliente.pontos}</p>
        </div>
      </div>
    </div>
  );
}

function Comportamento({ visao }: { visao: Visao360 }) {
  const { comportamento: c, financeiro } = visao;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Medida
        icon={TrendingUp}
        label="Valor total"
        value={moeda(c.valorTotal)}
        sub={`${c.totalCompras} ${c.totalCompras === 1 ? 'compra' : 'compras'}`}
      />
      <Medida icon={ShoppingBag} label="Ticket médio" value={moeda(c.ticketMedio)} />
      <Medida
        icon={Clock}
        label="Última compra"
        value={c.diasDesdeUltimaCompra === null ? '—' : `${c.diasDesdeUltimaCompra}d`}
        sub={c.ultimaCompra ? data(c.ultimaCompra) : 'Sem compras'}
        tom={c.diasDesdeUltimaCompra !== null && c.diasDesdeUltimaCompra > 60 ? 'alerta' : 'neutro'}
      />
      <Medida
        icon={Repeat}
        label="Compra a cada"
        value={c.frequenciaMediaDias === null ? '—' : `${c.frequenciaMediaDias}d`}
        sub={c.frequenciaMediaDias === null ? 'Precisa de 2 compras' : 'Em média'}
      />
      <Medida
        icon={Wallet}
        label="Em dívida"
        value={moeda(financeiro.valorEmAberto)}
        sub={
          financeiro.titulosEmAberto > 0
            ? `${financeiro.titulosEmAberto} ${financeiro.titulosEmAberto === 1 ? 'título' : 'títulos'}`
            : 'Sem títulos em aberto'
        }
        tom={financeiro.valorEmAberto > 0 ? 'alerta' : 'neutro'}
      />
      <Medida icon={CheckCircle2} label="Já liquidado" value={moeda(financeiro.valorLiquidado)} />
      <Medida
        icon={Undo2}
        label="Devoluções"
        value={String(c.totalDevolucoes)}
        sub={c.taxaDevolucao > 0 ? `${Math.round(c.taxaDevolucao * 100)}% do valor` : undefined}
        tom={c.taxaDevolucao > 0.2 ? 'alerta' : 'neutro'}
      />
      <Medida
        icon={Store}
        label="Canal habitual"
        value={c.canalPredominante === 'POS' ? 'Loja' : (c.canalPredominante ?? '—')}
        sub={
          Object.keys(c.comprasPorCanal).length > 1
            ? `${Object.keys(c.comprasPorCanal).length} canais`
            : undefined
        }
      />
    </div>
  );
}

function Segmentos({ visao }: { visao: Visao360 }) {
  /** Mesma leitura por estado do painel de segmentos: o que precisa de atenção destaca-se. */
  const tom = (chave?: string | null) => {
    if (!chave) return 'border-slate-200 bg-white text-slate-700';
    if (chave.includes('em_risco')) return 'border-amber-200 bg-amber-50 text-amber-800';
    if (chave.includes('inactivo')) return 'border-rose-200 bg-rose-50 text-rose-800';
    if (chave.includes('activo') || chave.includes('alto'))
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    if (chave.includes('novo')) return 'border-blue-200 bg-blue-50 text-blue-800';
    return 'border-slate-200 bg-white text-slate-700';
  };

  return (
    <div className="flex flex-wrap gap-2">
      {visao.segmentos.map((s) => (
        <span
          key={s.segmentId}
          // A justificação explica porque o sistema classificou assim — sem ela, a
          // etiqueta seria um veredicto sem argumento.
          title={s.justificacao ? JSON.stringify(s.justificacao, null, 2) : undefined}
          className={cn(
            'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm',
            tom(s.chave),
          )}
        >
          {s.nome}
          <span className="text-xs opacity-60">desde {data(s.desde)}</span>
        </span>
      ))}
    </div>
  );
}

function Identidades({
  visao,
  onRemover,
}: {
  visao: Visao360;
  onRemover: (id: string) => void;
}) {
  if (visao.identidades.length === 0) {
    return (
      <Vazio>
        Nenhuma identidade ligada. O cliente só é reconhecido pelos dados do cadastro.
      </Vazio>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {visao.identidades.map((identidade) => {
        const Icone = ICONE_IDENTIDADE[identidade.tipo] ?? Fingerprint;

        return (
          <span
            key={identidade.id}
            className="group flex items-center gap-2 rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-1.5 text-sm text-slate-700"
          >
            <Icone size={14} className="text-slate-400" />
            <span className="tabular-nums">{identidade.valor}</span>
            <span className="text-xs text-slate-400">{ROTULO_IDENTIDADE[identidade.tipo]}</span>
            {identidade.principal && (
              <span className="rounded bg-blue-50 px-1.5 text-[10px] font-semibold text-blue-700">
                principal
              </span>
            )}
            <button
              onClick={() => onRemover(identidade.id)}
              aria-label={`Desligar ${identidade.valor}`}
              className="rounded p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 size={13} />
            </button>
          </span>
        );
      })}
    </div>
  );
}

function Consentimentos({
  visao,
  onAlternar,
  aGuardar,
}: {
  visao: Visao360;
  onAlternar: (canal: CanalComunicacao, concedido: boolean) => void;
  aGuardar: boolean;
}) {
  const concedidos = new Set(
    visao.consentimentos.filter((c) => c.finalidade === 'MARKETING').map((c) => c.canal),
  );

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {CANAIS.map((canal) => {
          const activo = concedidos.has(canal);

          return (
            <button
              key={canal}
              disabled={aGuardar}
              onClick={() => onAlternar(canal, !activo)}
              className={cn(
                'flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-50',
                activo
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
              )}
            >
              <span className="capitalize">{canal.toLowerCase()}</span>
              {activo ? <ShieldCheck size={15} /> : <Ban size={15} className="text-slate-300" />}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Marketing por canal. Avisos de conta e cobrança não dependem destes consentimentos.
      </p>
    </>
  );
}

function UltimasCompras({ visao }: { visao: Visao360 }) {
  if (visao.ultimasVendas.length === 0) {
    return <Vazio>Nenhuma compra registada.</Vazio>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <TableScroll>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Factura', 'Data', 'Itens', 'Valor', 'Estado'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visao.ultimasVendas.map((venda) => (
              <tr key={venda.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-2.5 font-semibold text-slate-900">{venda.numeroFatura}</td>
                <td className="px-4 py-2.5 text-slate-500">{data(venda.createdAt)}</td>
                <td className="px-4 py-2.5 tabular-nums text-slate-500">
                  {venda.itens?.length ?? 0}
                </td>
                <td className="px-4 py-2.5 font-semibold tabular-nums text-slate-900">
                  {moeda(venda.totalFinal)}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[10px] font-semibold',
                      venda.estado === 'CONCLUIDA'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700',
                    )}
                  >
                    {venda.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>
    </div>
  );
}

function Timeline({ visao }: { visao: Visao360 }) {
  if (visao.eventosRecentes.length === 0) {
    return (
      <Vazio>
        Ainda sem actividade registada. As compras passam a aparecer aqui à medida que acontecem.
      </Vazio>
    );
  }

  return (
    <ol className="space-y-0">
      {visao.eventosRecentes.map((evento, indice) => {
        const devolucao = evento.tipo === 'DEVOLUCAO_POS';
        const ultimo = indice === visao.eventosRecentes.length - 1;

        return (
          <li key={evento.id} className="flex gap-3">
            {/* A linha vertical liga os pontos da timeline e pára no último. */}
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                  devolucao ? 'bg-rose-400' : 'bg-slate-300',
                )}
              />
              {!ultimo && <span className="w-px flex-1 bg-slate-200" />}
            </div>

            <div className={cn('min-w-0 flex-1', ultimo ? 'pb-0' : 'pb-4')}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium text-slate-700">
                  {ROTULO_EVENTO[evento.tipo] ?? evento.tipo}
                </p>
                {evento.valor != null && (
                  <p
                    className={cn(
                      'shrink-0 text-sm font-semibold tabular-nums',
                      devolucao ? 'text-rose-600' : 'text-slate-900',
                    )}
                  >
                    {devolucao ? '−' : ''}
                    {moeda(Number(evento.valor))}
                  </p>
                )}
              </div>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                <Calendar size={11} />
                {new Date(evento.ocorridoEm).toLocaleString('pt-PT', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
