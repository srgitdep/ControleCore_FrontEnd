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
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { cn, formatData, formatDataHora, formatInteiro, formatMoeda } from '@/shared/utils';
import { TableScroll, ConfirmDialog } from '@/shared/ui';

const moeda = (valor: number) => formatMoeda(Number(valor));

const data = (iso: string | null | undefined) => (iso ? formatData(iso) : '—');

// ──── Estado do relacionamento ────────────────────────────────────────────────
// A cor diz o que o número sozinho não diz: um cliente que não compra há 90 dias
// precisa de atenção antes de alguém ter de calcular a diferença de datas.
// Rótulos e descrições são chaves do catálogo (`as const`, para o `t()` as aceitar
// tipadas); o texto resolve-se no componente, onde a língua activa é conhecida.
const ESTADOS = {
  ACTIVO: {
    rotulo: 'visao.estado_activo',
    classe: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    descricao: 'visao.estado_activo_desc',
  },
  NOVO: {
    rotulo: 'visao.estado_novo',
    classe: 'bg-blue-50 text-blue-700 border-blue-200',
    descricao: 'visao.estado_novo_desc',
  },
  EM_RISCO: {
    rotulo: 'visao.estado_em_risco',
    classe: 'bg-amber-50 text-amber-700 border-amber-200',
    descricao: 'visao.estado_em_risco_desc',
  },
  INACTIVO: {
    rotulo: 'visao.estado_inactivo',
    classe: 'bg-rose-50 text-rose-700 border-rose-200',
    descricao: 'visao.estado_inactivo_desc',
  },
  SEM_COMPRAS: {
    rotulo: 'visao.estado_sem_compras',
    classe: 'bg-slate-100 text-slate-600 border-slate-200',
    descricao: 'visao.estado_sem_compras_desc',
  },
} as const satisfies Record<
  EstadoRelacionamento,
  { rotulo: string; classe: string; descricao: string }
>;

const ICONE_IDENTIDADE: Record<TipoIdentidade, React.ElementType> = {
  TELEFONE: Phone,
  EMAIL: Mail,
  NUIT: CreditCard,
  CARTAO_FIDELIZACAO: Award,
  WHATSAPP: MessageSquare,
  ECOMMERCE: Smartphone,
};

const ROTULO_IDENTIDADE = {
  TELEFONE: 'visao.identidade_telefone',
  EMAIL: 'visao.identidade_email',
  NUIT: 'visao.identidade_nuit',
  CARTAO_FIDELIZACAO: 'visao.identidade_cartao',
  WHATSAPP: 'visao.identidade_whatsapp',
  ECOMMERCE: 'visao.identidade_ecommerce',
} as const satisfies Record<TipoIdentidade, string>;

const CANAIS: CanalComunicacao[] = ['WHATSAPP', 'SMS', 'EMAIL', 'CHAMADA'];

const ROTULO_MOVIMENTO = {
  GANHO: 'visao.movimento_ganho',
  RESGATE: 'visao.movimento_resgate',
  ESTORNO: 'visao.movimento_estorno',
  AJUSTE: 'visao.movimento_ajuste',
} as const satisfies Record<TipoMovimentoPontos, string>;

// Tipos de evento que o servidor pode acrescentar sem avisar: os que não estão aqui
// mostram-se com o código tal como vem.
const ROTULO_EVENTO = {
  COMPRA_POS: 'visao.evento_compra_pos',
  COMPRA_ECOMMERCE: 'visao.evento_compra_ecommerce',
  DEVOLUCAO_POS: 'visao.evento_devolucao_pos',
  CREDITO_BLOQUEADO: 'visao.evento_credito_bloqueado',
  PAGAMENTO_RECEBIDO: 'visao.evento_pagamento_recebido',
  CLIENTE_IDENTIFICADO_POS: 'visao.evento_cliente_identificado_pos',
  CONSENTIMENTO_ALTERADO: 'visao.evento_consentimento_alterado',
  MENSAGEM_ENVIADA: 'visao.evento_mensagem_enviada',
  CAMPANHA_ENTRADA: 'visao.evento_campanha_entrada',
} as const;

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
  const { t } = useTranslation('crm');
  const [tipo, setTipo] = useState<TipoIdentidade>('TELEFONE');
  const [valor, setValor] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-900">{t('visao.ligar_identidade')}</h2>
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
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('visao.tipo')}</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoIdentidade)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {(Object.keys(ROTULO_IDENTIDADE) as TipoIdentidade[]).map((tp) => (
                <option key={tp} value={tp}>
                  {t(ROTULO_IDENTIDADE[tp])}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('visao.valor')}</label>
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder={tipo === 'EMAIL' ? t('visao.exemplo_email') : '+258 84 000 0000'}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <p className="mt-1.5 text-xs text-slate-400">
              {t('visao.identidade_duplicado')}
            </p>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {t('comum.cancelar')}
            </button>
            <button
              type="submit"
              disabled={isSaving || !valor.trim()}
              className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isSaving ? t('visao.a_ligar') : t('visao.ligar')}
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
  const { t } = useTranslation('crm');
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
        <p className="text-sm">{t('visao.erro_carregar')}</p>
        <button onClick={onBack} className="text-sm font-medium text-slate-700 underline">
          {t('visao.voltar_lista')}
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
          <Seccao titulo={t('visao.seccao_segmentos')}>
            <Segmentos visao={visao} />
          </Seccao>
        )}

        <Seccao
          titulo={t('visao.seccao_identidades')}
          accao={
            <button
              onClick={() => setShowIdentidade(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <Plus size={13} /> {t('visao.ligar_identidade')}
            </button>
          }
        >
          <Identidades visao={visao} onRemover={(id) => setIdentidadeARemover(id)} />
        </Seccao>

        <Seccao titulo={t('visao.seccao_consentimentos')}>
          <Consentimentos
            visao={visao}
            onAlternar={(canal, concedido) =>
              consentimento.mutate({ finalidade: 'MARKETING', canal, concedido })
            }
            aGuardar={consentimento.isPending}
          />
        </Seccao>

        <Seccao titulo={t('visao.seccao_preferencias')}>
          <Preferencias
            visao={visao}
            onGuardar={(chave, valor) => guardarPreferencia.mutate({ chave, valor })}
            aGuardar={guardarPreferencia.isPending}
          />
        </Seccao>

        {visao.produtosRecorrentes.length > 0 && (
          <Seccao titulo={t('visao.seccao_compra_frequencia')}>
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

        <Seccao titulo={t('visao.seccao_ultimas_compras')}>
          <UltimasCompras visao={visao} />
        </Seccao>

        <Seccao titulo={t('visao.seccao_actividade')}>
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
        title={t('visao.desligar_titulo')}
        message={t('visao.desligar_mensagem')}
        confirmText={t('visao.desligar')}
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
  const { t } = useTranslation('crm');
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
              title={t(estado.descricao)}
              className={cn('rounded-full border px-2 py-0.5 text-xs font-semibold', estado.classe)}
            >
              {t(estado.rotulo)}
            </span>
            {cliente.creditoBloqueado && (
              <span className="flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                <Ban size={11} /> {t('visao.credito_bloqueado')}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            {t('visao.cliente_desde', { data: data(cliente.clienteDesde) })}
            {comportamento.lojaPreferidaNome &&
              ` · ${t('visao.loja_habitual', { nome: comportamento.lojaPreferidaNome })}`}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{t('visao.pontos')}</p>
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
  const { t } = useTranslation('crm');
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
      titulo={t('visao.fid_titulo')}
      accao={
        !aAjustar && (
          <button
            onClick={() => setAAjustar(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <Plus size={13} /> {t('visao.fid_ajustar')}
          </button>
        )
      }
    >
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-4">
          <div>
            <p className="text-xl font-bold tabular-nums text-amber-600">
              {formatInteiro(saldo.pontos)}{' '}
              <span className="text-sm font-medium text-slate-400">{t('visao.fid_pontos')}</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {t('visao.fid_valem', { valor: moeda(saldo.valorEmMeticais) })}
            </p>
          </div>

          {!saldo.fidelizacaoActiva ? (
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
              {t('visao.fid_desligada')}
            </span>
          ) : saldo.podeResgatar ? (
            <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              {t('visao.fid_pode_usar')}
            </span>
          ) : (
            <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
              {t('visao.fid_faltam', {
                n: formatInteiro(saldo.minimoResgate - saldo.pontos),
                minimo: saldo.minimoResgate,
              })}
            </span>
          )}
        </div>

        {aAjustar && (
          <div className="border-b border-slate-100 bg-slate-50 p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">{t('visao.pontos')}</label>
                <input
                  type="number"
                  autoFocus
                  value={pontos}
                  onChange={(e) => setPontos(e.target.value)}
                  placeholder={t('visao.fid_exemplo_pontos')}
                  className="mt-1 block w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div className="min-w-48 flex-1">
                <label className="text-xs font-medium text-slate-600">{t('visao.fid_porque')}</label>
                <input
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder={t('visao.fid_porque_exemplo')}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setAAjustar(false)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white"
                >
                  {t('comum.cancelar')}
                </button>
                <button
                  onClick={submeterAjuste}
                  disabled={!motivo.trim() || !pontos || ajustar.isPending}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
                >
                  {ajustar.isPending ? t('comum.a_guardar') : t('visao.fid_aplicar')}
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {t('visao.fid_ajuda')}
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
                  <p className="text-sm text-slate-700">{t(ROTULO_MOVIMENTO[m.tipo])}</p>
                  {m.motivo && <p className="text-xs text-slate-400">{m.motivo}</p>}
                  {m.criadoPor && (
                    <p className="text-xs text-slate-400">{t('visao.fid_por', { nome: m.criadoPor.name })}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-slate-400">{data(m.createdAt)}</p>
                  <p className="text-xs tabular-nums text-slate-400">
                    {t('visao.fid_saldo', { valor: formatInteiro(m.saldoApos) })}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="px-4 py-6 text-center text-sm text-slate-400">
            {t('visao.fid_sem_movimentos')}
          </p>
        )}
      </div>
    </Seccao>
  );
}

function Comportamento({ visao }: { visao: Visao360 }) {
  const { t } = useTranslation('crm');
  const { comportamento: c, financeiro } = visao;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Medida
        label={t('visao.valor_total')}
        value={moeda(c.valorTotal)}
        sub={t('visao.n_compras', { count: c.totalCompras })}
      />
      <Medida label={t('visao.ticket_medio')} value={moeda(c.ticketMedio)} />
      <Medida
        label={t('visao.ultima_compra')}
        value={c.diasDesdeUltimaCompra === null ? '—' : `${c.diasDesdeUltimaCompra}d`}
        sub={c.ultimaCompra ? data(c.ultimaCompra) : t('visao.sem_compras')}
        tom={c.diasDesdeUltimaCompra !== null && c.diasDesdeUltimaCompra > 60 ? 'alerta' : 'neutro'}
      />
      <Medida
        label={t('visao.compra_a_cada')}
        value={c.frequenciaMediaDias === null ? '—' : `${c.frequenciaMediaDias}d`}
        sub={c.frequenciaMediaDias === null ? t('visao.precisa_2_compras') : t('visao.em_media')}
      />
      <Medida
        label={t('visao.em_divida')}
        value={moeda(financeiro.valorEmAberto)}
        sub={
          financeiro.titulosEmAberto > 0
            ? t('visao.n_titulos', { count: financeiro.titulosEmAberto })
            : t('visao.sem_titulos')
        }
        tom={financeiro.valorEmAberto > 0 ? 'alerta' : 'neutro'}
      />
      <Medida label={t('visao.ja_liquidado')} value={moeda(financeiro.valorLiquidado)} />
      <Medida
        label={t('visao.devolucoes')}
        value={String(c.totalDevolucoes)}
        sub={c.taxaDevolucao > 0 ? t('visao.pct_do_valor', { n: Math.round(c.taxaDevolucao * 100) }) : undefined}
        tom={c.taxaDevolucao > 0.2 ? 'alerta' : 'neutro'}
      />
      <Medida
        label={t('visao.canal_habitual')}
        value={c.canalPredominante === 'POS' ? t('visao.canal_loja') : (c.canalPredominante ?? '—')}
        sub={
          Object.keys(c.comprasPorCanal).length > 1
            ? t('visao.n_canais', { n: Object.keys(c.comprasPorCanal).length })
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
  const { t } = useTranslation('crm');
  const [verSinais, setVerSinais] = useState(false);
  const a = visao.proximaAccao;
  const previsao = visao.previsaoProximaCompra;

  if (!a) return null;

  const TOM = {
    URGENTE: {
      caixa: 'border-amber-300 bg-amber-50',
      etiqueta: 'bg-amber-600 text-white',
      rotulo: 'analise.urgencia_urgente',
    },
    IMPORTANTE: {
      caixa: 'border-rose-200 bg-rose-50',
      etiqueta: 'bg-rose-600 text-white',
      rotulo: 'analise.urgencia_importante',
    },
    OPORTUNIDADE: {
      caixa: 'border-blue-200 bg-blue-50',
      etiqueta: 'bg-blue-600 text-white',
      rotulo: 'analise.urgencia_oportunidade',
    },
    NENHUMA: {
      caixa: 'border-slate-200 bg-white',
      etiqueta: 'bg-slate-200 text-slate-600',
      rotulo: 'visao.tudo_em_ordem',
    },
  } as const;

  const tom = TOM[a.urgencia as keyof typeof TOM] ?? TOM.NENHUMA;

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
              {t(tom.rotulo)}
            </span>
            <p className="text-sm font-bold text-slate-900">{a.titulo}</p>
          </div>

          <p className="mt-1.5 text-sm text-slate-700">{a.porque}</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{a.sugestao}</p>

          {previsao && previsao.emDias > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              {t('visao.previsao', { n: previsao.emDias })}
              {previsao.confianca === 'BAIXA' && ` — ${t('visao.previsao_baixa')}`}.
            </p>
          )}

          {/* Os números por trás da conclusão, à distância de um clique. */}
          <button
            onClick={() => setVerSinais((v) => !v)}
            className="mt-2 text-xs font-medium text-slate-500 underline decoration-dotted underline-offset-2 hover:text-slate-700"
          >
            {verSinais ? t('visao.esconder_numeros') : t('visao.em_que_se_baseia')}
          </button>

          {verSinais && (
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg bg-white/70 p-2.5 text-xs">
              {Object.entries(a.sinais).map(([chave, valor]) => (
                <div key={chave} className="flex justify-between gap-2">
                  <dt className="text-slate-500">{rotuloSinal(chave, t)}</dt>
                  <dd className="font-semibold tabular-nums text-slate-800">
                    {formatarSinal(chave, valor, t)}
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

const ROTULO_SINAL = {
  intervaloHabitualDias: 'visao.sinal_intervalo_habitual',
  diasDesdeUltimaCompra: 'visao.sinal_dias_desde_ultima',
  vezesOIntervalo: 'visao.sinal_vezes_intervalo',
  valorTotal: 'visao.sinal_valor_total',
  ticketMedio: 'visao.ticket_medio',
  totalCompras: 'visao.sinal_total_compras',
  dividaEmAberto: 'visao.em_divida',
  creditoBloqueado: 'visao.credito_bloqueado',
  proximaCompraPrevistaEmDias: 'visao.sinal_proxima_compra',
  consente: 'visao.sinal_consente',
} as const;

function rotuloSinal(chave: string, t: TFunction<'crm'>): string {
  return chave in ROTULO_SINAL ? t(ROTULO_SINAL[chave as keyof typeof ROTULO_SINAL]) : chave;
}

function formatarSinal(chave: string, valor: unknown, t: TFunction<'crm'>): string {
  if (typeof valor === 'boolean') return valor ? t('visao.sim') : t('visao.nao');
  if (valor === null || valor === undefined) return '—';
  if (chave === 'vezesOIntervalo') return t('visao.x_o_habito', { n: String(valor) });
  if (chave.includes('Dias') || chave.includes('EmDias')) return t('visao.n_dias', { n: String(valor) });
  if (chave === 'valorTotal' || chave === 'ticketMedio' || chave === 'dividaEmAberto') {
    return moeda(Number(valor));
  }
  return String(valor);
}

function Segmentos({ visao }: { visao: Visao360 }) {
  const { t } = useTranslation('crm');
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
          <span className="text-xs opacity-60">{t('visao.desde', { data: data(s.desde) })}</span>
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
  const { t } = useTranslation('crm');
  if (visao.identidades.length === 0) {
    return (
      <Vazio>
        {t('visao.sem_identidades')}
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
            <span className="text-xs text-slate-400">{t(ROTULO_IDENTIDADE[identidade.tipo])}</span>
            {identidade.principal && (
              <span className="rounded bg-blue-50 px-1.5 text-[10px] font-semibold text-blue-700">
                {t('visao.principal')}
              </span>
            )}
            <button
              onClick={() => onRemover(identidade.id)}
              aria-label={t('visao.desligar_valor', { valor: identidade.valor })}
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
  const { t } = useTranslation('crm');
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
              <span className="capitalize">
                {canal === 'CHAMADA' ? t('visao.canal_chamada') : canal.toLowerCase()}
              </span>
              {activo ? <ShieldCheck size={15} /> : <Ban size={15} className="text-slate-300" />}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-400">
        {t('visao.consentimentos_nota')}
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
  const { t } = useTranslation('crm');
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
        <p className="text-sm text-slate-400">{t('visao.sem_preferencias')}</p>
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
            <label className="mb-1 block text-xs font-medium text-slate-600">{t('visao.chave')}</label>
            <input
              list="chaves-preferencia"
              value={chave}
              onChange={(e) => setChave(e.target.value)}
              placeholder={t('visao.chave_exemplo')}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <datalist id="chaves-preferencia">
              {CHAVES_SUGERIDAS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-slate-600">{t('visao.valor')}</label>
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder={t('visao.valor_exemplo')}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <button
            type="button"
            onClick={() => setAAdicionar(false)}
            className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            {t('comum.cancelar')}
          </button>
          <button
            type="submit"
            disabled={aGuardar}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {t('comum.guardar')}
          </button>
        </form>
      ) : (
        <button
          onClick={() => setAAdicionar(true)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          <Settings2 size={13} /> {t('visao.definir_preferencia')}
        </button>
      )}
    </div>
  );
}

function UltimasCompras({ visao }: { visao: Visao360 }) {
  const { t } = useTranslation('crm');
  if (visao.ultimasVendas.length === 0) {
    return <Vazio>{t('visao.nenhuma_compra')}</Vazio>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <TableScroll>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {[
                t('visao.col_factura'),
                t('visao.col_data'),
                t('visao.col_itens'),
                t('visao.valor'),
                t('visao.col_estado'),
              ].map((h) => (
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
  const { t } = useTranslation('crm');
  if (visao.eventosRecentes.length === 0) {
    return (
      <Vazio>
        {t('visao.sem_actividade')}
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
                  {evento.tipo in ROTULO_EVENTO
                    ? t(ROTULO_EVENTO[evento.tipo as keyof typeof ROTULO_EVENTO])
                    : evento.tipo}
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
                {formatDataHora(evento.ocorridoEm)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
