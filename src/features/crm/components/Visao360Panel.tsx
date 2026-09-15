import { useState } from 'react';
import {
  AlertTriangle,
  Award,
  Ban,
  Calendar,
  ChevronLeft,
  CreditCard,
  Fingerprint,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  Settings2,
  X,
} from 'lucide-react';
import {
  useVisao360,
  useRegistarConsentimento,
  useAdicionarIdentidade,
  useRemoverIdentidade,
  useSaldoPontos,
  useHistoricoPontos,
  useAjustarPontos,
  useGuardarPreferencia,
} from '../hooks/useClientes';
import type {
  CanalComunicacao,
  EstadoRelacionamento,
  TipoIdentidade,
  TipoMovimentoPontos,
  Visao360,
} from '../api/clientes.api';
import { cn } from '@/shared/utils';
import { TableScroll, ConfirmDialog } from '@/shared/ui';

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
    descricao: 'Sem comprar há mais tempo do que é habitual neste cliente',
  },
  INACTIVO: {
    rotulo: 'Inactivo',
    classe: 'bg-rose-50 text-rose-700 border-rose-200',
    descricao: 'Sem comprar há muito mais tempo do que é habitual neste cliente',
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

const ROTULO_MOVIMENTO: Record<TipoMovimentoPontos, string> = {
  GANHO: 'Ganhos numa compra',
  RESGATE: 'Usados como desconto',
  ESTORNO: 'Retirados por venda anulada',
  AJUSTE: 'Ajuste manual',
};

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
  label,
  value,
  sub,
  tom = 'neutro',
}: {
  label: string;
  value: string;
  sub?: string;
  tom?: 'neutro' | 'alerta';
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
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
  // O `confirm()` nativo do browser bloqueia a janela e não se estiliza; o
  // projecto já tem um `ConfirmDialog` para isto.
  const [identidadeARemover, setIdentidadeARemover] = useState<string | null>(null);

  const consentimento = useRegistarConsentimento(clienteId);
  const novaIdentidade = useAdicionarIdentidade(clienteId);
  const removerId = useRemoverIdentidade(clienteId);
  const guardarPreferencia = useGuardarPreferencia(clienteId);

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
        <Recomendacao visao={visao} />

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
          <Identidades visao={visao} onRemover={(id) => setIdentidadeARemover(id)} />
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

        <Seccao titulo="Preferências">
          <Preferencias
            visao={visao}
            onGuardar={(chave, valor) => guardarPreferencia.mutate({ chave, valor })}
            aGuardar={guardarPreferencia.isPending}
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

        <Fidelizacao clienteId={clienteId} />

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

      <ConfirmDialog
        isOpen={identidadeARemover !== null}
        title="Desligar identidade"
        message="Desligar esta identidade do cliente?"
        confirmText="Desligar"
        variant="danger"
        isLoading={removerId.isPending}
        onConfirm={() => {
          if (!identidadeARemover) return;
          removerId.mutate(identidadeARemover, { onSettled: () => setIdentidadeARemover(null) });
        }}
        onCancel={() => setIdentidadeARemover(null)}
      />
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

/**
 * Os pontos do cliente, e como lá chegaram.
 *
 * O saldo já aparece no cabeçalho, mas um número sozinho não responde à
 * pergunta que o cliente faz ao balcão — "porque tenho 340 e não 400?". O
 * histórico responde.
 */
function Fidelizacao({ clienteId }: { clienteId: string }) {
  const { data: saldo, isLoading } = useSaldoPontos(clienteId);
  const { data: historico } = useHistoricoPontos(clienteId);
  const ajustar = useAjustarPontos();

  const [aAjustar, setAAjustar] = useState(false);
  const [pontos, setPontos] = useState('');
  const [motivo, setMotivo] = useState('');

  if (isLoading || !saldo) return null;

  const submeterAjuste = () => {
    const valor = Number(pontos);
    if (!Number.isInteger(valor) || valor === 0 || !motivo.trim()) return;

    ajustar.mutate(
      { clienteId, pontos: valor, motivo: motivo.trim() },
      {
        onSuccess: () => {
          setAAjustar(false);
          setPontos('');
          setMotivo('');
        },
      },
    );
  };

  return (
    <Seccao
      titulo="Pontos de fidelização"
      accao={
        !aAjustar && (
          <button
            onClick={() => setAAjustar(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <Plus size={13} /> Ajustar
          </button>
        )
      }
    >
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-4">
          <div>
            <p className="text-xl font-bold tabular-nums text-amber-600">
              {saldo.pontos.toLocaleString('pt-MZ')}{' '}
              <span className="text-sm font-medium text-slate-400">pontos</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Valem {moeda(saldo.valorEmMeticais)} em desconto.
            </p>
          </div>

          {!saldo.fidelizacaoActiva ? (
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
              Fidelização desligada nesta empresa
            </span>
          ) : saldo.podeResgatar ? (
            <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              Pode usar no balcão
            </span>
          ) : (
            <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
              Faltam {(saldo.minimoResgate - saldo.pontos).toLocaleString('pt-MZ')} para o
              mínimo de {saldo.minimoResgate}
            </span>
          )}
        </div>

        {aAjustar && (
          <div className="border-b border-slate-100 bg-slate-50 p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Pontos</label>
                <input
                  type="number"
                  autoFocus
                  value={pontos}
                  onChange={(e) => setPontos(e.target.value)}
                  placeholder="ex.: -50"
                  className="mt-1 block w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div className="min-w-48 flex-1">
                <label className="text-xs font-medium text-slate-600">Porquê</label>
                <input
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Fica registado e é visível aqui"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setAAjustar(false)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={submeterAjuste}
                  disabled={!motivo.trim() || !pontos || ajustar.isPending}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
                >
                  {ajustar.isPending ? 'A guardar…' : 'Aplicar'}
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Positivo acrescenta, negativo retira. O saldo nunca desce abaixo de zero.
            </p>
          </div>
        )}

        {historico && historico.length > 0 ? (
          <ol className="divide-y divide-slate-100">
            {historico.slice(0, 8).map((m) => (
              <li key={m.id} className="flex items-start gap-3 px-4 py-2.5">
                <span
                  className={cn(
                    'w-16 shrink-0 text-sm font-semibold tabular-nums',
                    m.pontos > 0 ? 'text-emerald-600' : 'text-rose-600',
                  )}
                >
                  {m.pontos > 0 ? '+' : ''}
                  {m.pontos}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700">{ROTULO_MOVIMENTO[m.tipo]}</p>
                  {m.motivo && <p className="text-xs text-slate-400">{m.motivo}</p>}
                  {m.criadoPor && (
                    <p className="text-xs text-slate-400">por {m.criadoPor.name}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-slate-400">{data(m.createdAt)}</p>
                  <p className="text-xs tabular-nums text-slate-400">
                    saldo: {m.saldoApos.toLocaleString('pt-MZ')}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="px-4 py-6 text-center text-sm text-slate-400">
            Ainda sem movimentos de pontos.
          </p>
        )}
      </div>
    </Seccao>
  );
}

function Comportamento({ visao }: { visao: Visao360 }) {
  const { comportamento: c, financeiro } = visao;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Medida
        label="Valor total"
        value={moeda(c.valorTotal)}
        sub={`${c.totalCompras} ${c.totalCompras === 1 ? 'compra' : 'compras'}`}
      />
      <Medida label="Ticket médio" value={moeda(c.ticketMedio)} />
      <Medida
        label="Última compra"
        value={c.diasDesdeUltimaCompra === null ? '—' : `${c.diasDesdeUltimaCompra}d`}
        sub={c.ultimaCompra ? data(c.ultimaCompra) : 'Sem compras'}
        tom={c.diasDesdeUltimaCompra !== null && c.diasDesdeUltimaCompra > 60 ? 'alerta' : 'neutro'}
      />
      <Medida
        label="Compra a cada"
        value={c.frequenciaMediaDias === null ? '—' : `${c.frequenciaMediaDias}d`}
        sub={c.frequenciaMediaDias === null ? 'Precisa de 2 compras' : 'Em média'}
      />
      <Medida
        label="Em dívida"
        value={moeda(financeiro.valorEmAberto)}
        sub={
          financeiro.titulosEmAberto > 0
            ? `${financeiro.titulosEmAberto} ${financeiro.titulosEmAberto === 1 ? 'título' : 'títulos'}`
            : 'Sem títulos em aberto'
        }
        tom={financeiro.valorEmAberto > 0 ? 'alerta' : 'neutro'}
      />
      <Medida label="Já liquidado" value={moeda(financeiro.valorLiquidado)} />
      <Medida
        label="Devoluções"
        value={String(c.totalDevolucoes)}
        sub={c.taxaDevolucao > 0 ? `${Math.round(c.taxaDevolucao * 100)}% do valor` : undefined}
        tom={c.taxaDevolucao > 0.2 ? 'alerta' : 'neutro'}
      />
      <Medida
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

/**
 * O que fazer com este cliente.
 *
 * Fica acima dos números porque é a conclusão deles: quem abre a ficha quer
 * saber o que fazer, não calcular a diferença entre datas. O raciocínio vem
 * junto — uma recomendação que não se pode verificar não merece confiança.
 */
function Recomendacao({ visao }: { visao: Visao360 }) {
  const [verSinais, setVerSinais] = useState(false);
  const a = visao.proximaAccao;
  const previsao = visao.previsaoProximaCompra;

  if (!a) return null;

  const TOM: Record<string, { caixa: string; etiqueta: string; rotulo: string }> = {
    URGENTE: {
      caixa: 'border-amber-300 bg-amber-50',
      etiqueta: 'bg-amber-600 text-white',
      rotulo: 'Agir agora',
    },
    IMPORTANTE: {
      caixa: 'border-rose-200 bg-rose-50',
      etiqueta: 'bg-rose-600 text-white',
      rotulo: 'A ter em conta',
    },
    OPORTUNIDADE: {
      caixa: 'border-blue-200 bg-blue-50',
      etiqueta: 'bg-blue-600 text-white',
      rotulo: 'Oportunidade',
    },
    NENHUMA: {
      caixa: 'border-slate-200 bg-white',
      etiqueta: 'bg-slate-200 text-slate-600',
      rotulo: 'Tudo em ordem',
    },
  };

  const tom = TOM[a.urgencia] ?? TOM.NENHUMA;

  return (
    <div className={cn('rounded-xl border p-4', tom.caixa)}>
      <div className="flex items-start gap-3">
        <Sparkles size={16} className="mt-0.5 shrink-0 text-violet-600" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                tom.etiqueta,
              )}
            >
              {tom.rotulo}
            </span>
            <p className="text-sm font-bold text-slate-900">{a.titulo}</p>
          </div>

          <p className="mt-1.5 text-sm text-slate-700">{a.porque}</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{a.sugestao}</p>

          {previsao && previsao.emDias > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              Pela média dele, deve voltar dentro de {previsao.emDias} dia(s)
              {previsao.confianca === 'BAIXA' && ' — ainda com poucas compras para ter a certeza'}.
            </p>
          )}

          {/* Os números por trás da conclusão, à distância de um clique. */}
          <button
            onClick={() => setVerSinais((v) => !v)}
            className="mt-2 text-xs font-medium text-slate-500 underline decoration-dotted underline-offset-2 hover:text-slate-700"
          >
            {verSinais ? 'Esconder os números' : 'Em que é que se baseia?'}
          </button>

          {verSinais && (
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg bg-white/70 p-2.5 text-xs">
              {Object.entries(a.sinais).map(([chave, valor]) => (
                <div key={chave} className="flex justify-between gap-2">
                  <dt className="text-slate-500">{rotuloSinal(chave)}</dt>
                  <dd className="font-semibold tabular-nums text-slate-800">
                    {formatarSinal(chave, valor)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}

function rotuloSinal(chave: string): string {
  return (
    {
      intervaloHabitualDias: 'Compra a cada',
      diasDesdeUltimaCompra: 'Sem comprar há',
      vezesOIntervalo: 'Isso é',
      valorTotal: 'Já gastou',
      ticketMedio: 'Ticket médio',
      totalCompras: 'Compras',
      dividaEmAberto: 'Em dívida',
      creditoBloqueado: 'Crédito bloqueado',
      proximaCompraPrevistaEmDias: 'Deve voltar em',
      consente: 'Aceita contacto',
    }[chave] ?? chave
  );
}

function formatarSinal(chave: string, valor: unknown): string {
  if (typeof valor === 'boolean') return valor ? 'sim' : 'não';
  if (valor === null || valor === undefined) return '—';
  if (chave === 'vezesOIntervalo') return `${valor}x o hábito`;
  if (chave.includes('Dias') || chave.includes('EmDias')) return `${valor} dias`;
  if (chave === 'valorTotal' || chave === 'ticketMedio' || chave === 'dividaEmAberto') {
    return moeda(Number(valor));
  }
  return String(valor);
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

/** Sugestões de chave — o backend aceita qualquer texto, isto é só para não começar em branco. */
const CHAVES_SUGERIDAS = ['canal_preferido', 'loja_habitual', 'idioma'];

/**
 * Preferências de relacionamento: pares chave/valor livres — canal preferido, loja
 * habitual, idioma. Não é consentimento de contacto (isso é a secção anterior); é o que o
 * cliente prefere, não o que autorizou.
 */
function Preferencias({
  visao,
  onGuardar,
  aGuardar,
}: {
  visao: Visao360;
  onGuardar: (chave: string, valor: string) => void;
  aGuardar: boolean;
}) {
  const [aAdicionar, setAAdicionar] = useState(false);
  const [chave, setChave] = useState('');
  const [valor, setValor] = useState('');

  const entradas = Object.entries(visao.preferencias);

  const submeter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chave.trim() || !valor.trim()) return;
    onGuardar(chave.trim(), valor.trim());
    setAAdicionar(false);
    setChave('');
    setValor('');
  };

  return (
    <div className="space-y-3">
      {entradas.length === 0 && !aAdicionar ? (
        <p className="text-sm text-slate-400">Sem preferências registadas.</p>
      ) : (
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {entradas.map(([k, v]) => (
            <div key={k} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <dt className="text-xs capitalize text-slate-400">{k.replace(/_/g, ' ')}</dt>
              <dd className="text-sm font-medium text-slate-800">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {aAdicionar ? (
        <form onSubmit={submeter} className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-slate-600">Chave</label>
            <input
              list="chaves-preferencia"
              value={chave}
              onChange={(e) => setChave(e.target.value)}
              placeholder="Ex.: canal_preferido"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <datalist id="chaves-preferencia">
              {CHAVES_SUGERIDAS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-slate-600">Valor</label>
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Ex.: WHATSAPP"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <button
            type="button"
            onClick={() => setAAdicionar(false)}
            className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={aGuardar}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            Guardar
          </button>
        </form>
      ) : (
        <button
          onClick={() => setAAdicionar(true)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          <Settings2 size={13} /> Definir preferência
        </button>
      )}
    </div>
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
