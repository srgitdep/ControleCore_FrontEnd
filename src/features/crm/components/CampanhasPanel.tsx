import { useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import {
  useCampanhas,
  useCampanha,
  useEnviosCampanha,
  useResultadoCampanha,
  useCriarCampanha,
  useEnviarCampanha,
  useCancelarCampanha,
  useSegmentos,
  useOportunidades,
  useSugerirMensagens,
} from '../hooks/useClientes';
import type {
  CanalComunicacao,
  Campanha,
  EstadoCampanha,
  OportunidadeCampanha,
  ResultadoEnvioCampanha,
  SugestaoMensagem,
} from '../api/clientes.api';
import { cn } from '@/shared/utils';
import { TableScroll } from '@/shared/ui';

const moeda = (v: number) =>
  `${Number(v).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT`;

const data = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

const ESTADOS: Record<EstadoCampanha, { rotulo: string; classe: string }> = {
  RASCUNHO: { rotulo: 'Rascunho', classe: 'bg-slate-100 text-slate-600 border-slate-200' },
  A_ENVIAR: { rotulo: 'A enviar', classe: 'bg-blue-50 text-blue-700 border-blue-200' },
  CONCLUIDA: { rotulo: 'Concluída', classe: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELADA: { rotulo: 'Cancelada', classe: 'bg-slate-100 text-slate-500 border-slate-200' },
};

/**
 * Cada motivo diz uma coisa diferente sobre o que correu mal, e cada um tem uma
 * acção diferente. Mostrar "suprimido" sem dizer porquê deixaria o utilizador
 * sem saber o que corrigir.
 */
const RESULTADOS: Record<ResultadoEnvioCampanha, { rotulo: string; classe: string; ajuda?: string }> = {
  ENVIADO: { rotulo: 'Enviada', classe: 'bg-emerald-50 text-emerald-700' },
  FALHADO: {
    rotulo: 'Falhou',
    classe: 'bg-rose-50 text-rose-700',
    ajuda: 'O fornecedor recusou a mensagem.',
  },
  SUPRIMIDO_SEM_CONSENTIMENTO: {
    rotulo: 'Sem consentimento',
    classe: 'bg-amber-50 text-amber-700',
    ajuda: 'O cliente não aceitou ser contactado por este canal.',
  },
  SUPRIMIDO_SEM_CONTACTO: {
    rotulo: 'Sem contacto',
    classe: 'bg-amber-50 text-amber-700',
    ajuda: 'O cliente não tem telefone ou e-mail para este canal.',
  },
  SUPRIMIDO_JA_COMPROU: {
    rotulo: 'Já comprou',
    classe: 'bg-blue-50 text-blue-700',
    ajuda: 'A mensagem deixou de ser relevante: o cliente já comprou.',
  },
  SUPRIMIDO_LIMITE_FREQUENCIA: {
    rotulo: 'Demasiadas mensagens',
    classe: 'bg-amber-50 text-amber-700',
    ajuda: 'O cliente já recebeu o máximo de mensagens deste período.',
  },
  SUPRIMIDO_CANAL_INDISPONIVEL: {
    rotulo: 'Canal indisponível',
    classe: 'bg-slate-100 text-slate-600',
    ajuda: 'O envio por este canal não está configurado no sistema.',
  },
};

const CANAIS: CanalComunicacao[] = ['SMS', 'WHATSAPP', 'EMAIL'];

// ──── Modal de criação ────────────────────────────────────────────────────────

function CampanhaModal({
  onClose,
  oportunidadeInicial,
}: {
  onClose: () => void;
  oportunidadeInicial?: OportunidadeCampanha;
}) {
  const { data: segmentos } = useSegmentos();
  const criar = useCriarCampanha();
  const sugerir = useSugerirMensagens();

  const [form, setForm] = useState({
    // Quando vem de uma recomendação da MAYRA, o formulário nasce preenchido:
    // repetir à mão o que ela já decidiu seria trabalho sem valor.
    nome: oportunidadeInicial ? `${oportunidadeInicial.nome}` : '',
    texto: '',
    assunto: '',
    canal: (oportunidadeInicial?.canalSugerido ?? 'SMS') as CanalComunicacao,
    segmentId: oportunidadeInicial?.segmentId ?? '',
    suprimirSeComprouEmDias: oportunidadeInicial?.supressaoSugeridaDias
      ? String(oportunidadeInicial.supressaoSugeridaDias)
      : '',
  });

  const [sugestoes, setSugestoes] = useState<SugestaoMensagem[] | null>(null);

  const comMembros = (segmentos ?? []).filter((s) => s.total > 0);
  const escolhido = comMembros.find((s) => s.id === form.segmentId);

  const pedirSugestoes = () => {
    if (!form.segmentId) return;
    sugerir.mutate(
      { segmentId: form.segmentId, canal: form.canal },
      { onSuccess: (r) => setSugestoes(r.sugestoes) },
    );
  };

  const usar = (s: SugestaoMensagem) => {
    setForm((f) => ({ ...f, texto: s.texto, assunto: s.assunto ?? f.assunto }));
    setSugestoes(null);
  };

  const submeter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.texto.trim() || !form.segmentId) return;

    criar.mutate(
      {
        nome: form.nome.trim(),
        texto: form.texto.trim(),
        assunto: form.canal === 'EMAIL' ? form.assunto.trim() : undefined,
        canal: form.canal,
        segmentId: form.segmentId,
        suprimirSeComprouEmDias: form.suprimirSeComprouEmDias
          ? Number(form.suprimirSeComprouEmDias)
          : undefined,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[6vh] backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-900">Nova campanha</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submeter} className="space-y-4 overflow-y-auto p-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nome *</label>
            <input
              autoFocus
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              placeholder="Ex.: Recuperar clientes em risco"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <p className="mt-1 text-xs text-slate-400">Nome interno. O cliente não o vê.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Quem recebe *</label>
            <select
              value={form.segmentId}
              onChange={(e) => setForm((f) => ({ ...f, segmentId: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">Escolher segmento…</option>
              {comMembros.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} ({s.total})
                </option>
              ))}
            </select>
            {comMembros.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                Nenhum segmento tem clientes. Calcule os segmentos primeiro.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Canal *</label>
            <div className="flex gap-2">
              {CANAIS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, canal: c }))}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors',
                    form.canal === c
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                  )}
                >
                  {c.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {form.canal === 'EMAIL' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Assunto *</label>
              <input
                value={form.assunto}
                onChange={(e) => setForm((f) => ({ ...f, assunto: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          )}

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label className="text-sm font-medium text-slate-700">Mensagem *</label>
              <button
                type="button"
                onClick={pedirSugestoes}
                disabled={!form.segmentId || sugerir.isPending}
                title={
                  form.segmentId
                    ? 'A MAYRA lê o que estes clientes compram e escreve três opções.'
                    : 'Escolha primeiro quem recebe.'
                }
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors',
                  'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100',
                  'disabled:cursor-not-allowed disabled:opacity-40',
                )}
              >
                {sugerir.isPending ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <Sparkles size={13} />
                )}
                {sugerir.isPending ? 'A pensar…' : 'Pedir à MAYRA'}
              </button>
            </div>

            {/* As sugestões substituem o campo enquanto estão à escolha: mostrar
                as duas coisas ao mesmo tempo obrigaria a decidir onde olhar. */}
            {sugestoes ? (
              <div className="space-y-2">
                {sugestoes.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => usar(s)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left transition-colors hover:border-violet-300 hover:bg-violet-50/40"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                        {s.tom}
                      </span>
                      <span className="text-[11px] tabular-nums text-slate-400">
                        {s.texto.length} caracteres
                      </span>
                    </div>
                    {s.assunto && (
                      <p className="text-sm font-semibold text-slate-800">{s.assunto}</p>
                    )}
                    <p className="whitespace-pre-wrap text-sm text-slate-700">{s.texto}</p>
                    <p className="mt-1.5 text-xs text-slate-400">{s.porque}</p>
                  </button>
                ))}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSugestoes(null)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <Pencil size={13} /> Escrever a minha
                  </button>
                  <button
                    type="button"
                    onClick={pedirSugestoes}
                    disabled={sugerir.isPending}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={cn(sugerir.isPending && 'animate-spin')} />
                    Outras opções
                  </button>
                </div>
              </div>
            ) : (
              <>
                <textarea
                  rows={4}
                  value={form.texto}
                  onChange={(e) => setForm((f) => ({ ...f, texto: e.target.value }))}
                  placeholder="Olá {{nome}}, temos novidades esta semana."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <div className="mt-1 flex items-start justify-between gap-2">
                  <p className="text-xs text-slate-400">
                    <code className="rounded bg-slate-100 px-1">{'{{nome}}'}</code> é substituído
                    pelo primeiro nome do cliente.
                  </p>
                  {form.texto.length > 0 && (
                    <span
                      className={cn(
                        'shrink-0 text-xs tabular-nums',
                        // Um SMS acima de 160 caracteres conta como dois e custa
                        // a dobrar — o aviso tem de ser visível antes de enviar.
                        form.canal === 'SMS' && form.texto.length > 160
                          ? 'font-semibold text-amber-600'
                          : 'text-slate-400',
                      )}
                    >
                      {form.texto.length}
                      {form.canal === 'SMS' && form.texto.length > 160 && ' — 2 SMS'}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Não enviar a quem comprou nos últimos
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={365}
                value={form.suprimirSeComprouEmDias}
                onChange={(e) =>
                  setForm((f) => ({ ...f, suprimirSeComprouEmDias: e.target.value }))
                }
                placeholder="—"
                className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <span className="text-sm text-slate-500">dias</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Evita insistir com quem já comprou entretanto. Deixe vazio para enviar a todos.
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
              disabled={
                criar.isPending || !form.nome.trim() || !form.texto.trim() || !form.segmentId
              }
              className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {criar.isPending ? 'A criar…' : 'Criar rascunho'}
            </button>
          </div>

          {escolhido && (
            <p className="text-center text-xs text-slate-400">
              A campanha é criada em rascunho. Só sai quando confirmar o envio.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

// ──── Detalhe ─────────────────────────────────────────────────────────────────

function DetalheCampanha({ id, onVoltar }: { id: string; onVoltar: () => void }) {
  const [page, setPage] = useState(1);
  const { data: campanha, isLoading } = useCampanha(id);
  const { data: envios } = useEnviosCampanha(id, page);
  const { data: kpi } = useResultadoCampanha(id);
  const enviar = useEnviarCampanha();
  const cancelar = useCancelarCampanha();

  if (isLoading || !campanha) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  const estado = ESTADOS[campanha.estado];
  const emRascunho = campanha.estado === 'RASCUNHO';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <button onClick={onVoltar} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-bold text-slate-900">{campanha.nome}</h3>
              <span className={cn('rounded-full border px-2 py-0.5 text-xs font-semibold', estado.classe)}>
                {estado.rotulo}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {campanha.canal.toLowerCase()} · {campanha.segment?.nome ?? 'audiência fixada'}
              {campanha.concluidaEm && ` · enviada em ${data(campanha.concluidaEm)}`}
            </p>
          </div>
        </div>

        {emRascunho && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (confirm(`Enviar "${campanha.nome}"? As mensagens saem de imediato.`)) {
                  enviar.mutate(id);
                }
              }}
              disabled={enviar.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              <Send size={14} />
              {enviar.isPending ? 'A enviar…' : 'Enviar agora'}
            </button>
            <button
              onClick={() => {
                if (confirm('Cancelar esta campanha?')) cancelar.mutate(id);
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Mensagem</p>
        {campanha.assunto && (
          <p className="mt-1 text-sm font-semibold text-slate-700">{campanha.assunto}</p>
        )}
        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{campanha.texto}</p>
      </div>

      {campanha.estado === 'CONCLUIDA' && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Numero rotulo="Enviadas" valor={String(campanha.totalEnviados)} />
          <Numero
            rotulo="Não enviadas"
            valor={String(campanha.totalSuprimidos + campanha.totalFalhados)}
            sub={`de ${campanha.totalDestinatarios} destinatários`}
          />
          <Numero
            rotulo="Converteram"
            valor={kpi ? String(kpi.convertidos) : '—'}
            sub={kpi && kpi.enviados > 0 ? `${Math.round(kpi.taxaConversao * 100)}% dos envios` : undefined}
          />
          <Numero rotulo="Receita atribuída" valor={kpi ? moeda(kpi.receita) : '—'} />
        </div>
      )}

      {envios && envios.data.length > 0 ? (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-700">
            Destinatários
            <span className="ml-2 font-normal text-slate-400">{envios.total}</span>
          </h4>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <TableScroll>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Cliente', 'Contacto', 'Resultado', 'Converteu'].map((h) => (
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
                  {envios.data.map((e) => {
                    const r = RESULTADOS[e.resultado];
                    return (
                      <tr key={e.cliente.id} className="border-b border-slate-50 last:border-0">
                        <td className="px-4 py-2.5 font-semibold text-slate-900">{e.cliente.nome}</td>
                        <td className="px-4 py-2.5 text-slate-500">
                          {e.cliente.telefone || e.cliente.email || '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            title={e.erro ?? r.ajuda}
                            className={cn('rounded px-2 py-0.5 text-xs font-semibold', r.classe)}
                          >
                            {r.rotulo}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 tabular-nums text-slate-500">
                          {e.convertidoEm ? moeda(Number(e.valorConvertido ?? 0)) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableScroll>
          </div>

          {envios.lastPage > 1 && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Página {envios.page} de {envios.lastPage}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(envios.lastPage, p + 1))}
                  disabled={page === envios.lastPage}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        emRascunho && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 py-6 text-center text-sm text-slate-400">
            Ainda não foi enviada.
          </div>
        )
      )}
    </div>
  );
}

function Numero({ rotulo, valor, sub }: { rotulo: string; valor: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{rotulo}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{valor}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

// ──── Painel ──────────────────────────────────────────────────────────────────

/**
 * O que a MAYRA recomenda contactar.
 *
 * Aparece acima das campanhas porque é a pergunta que vem primeiro: não "que
 * campanhas fiz" mas "a quem devia falar agora". Cada cartão leva directamente
 * ao formulário já preenchido.
 */
function Oportunidades({ onUsar }: { onUsar: (o: OportunidadeCampanha) => void }) {
  const { data, isLoading } = useOportunidades();

  if (isLoading) return null;
  if (!data) return null;

  if (data.aviso) {
    return (
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <Sparkles size={16} className="mt-0.5 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-amber-900">A MAYRA ainda não tem com que trabalhar</p>
          <p className="mt-0.5 text-sm text-amber-700">{data.aviso}</p>
        </div>
      </div>
    );
  }

  // Só vale a pena mostrar grupos que se conseguem mesmo contactar.
  const uteis = data.oportunidades.filter((o) => o.contactaveis > 0).slice(0, 3);
  if (uteis.length === 0) return null;

  const TOM: Record<string, string> = {
    ALTA: 'border-amber-200 bg-amber-50',
    MEDIA: 'border-blue-200 bg-blue-50',
    BAIXA: 'border-slate-200 bg-white',
  };

  return (
    <section className="mb-6">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles size={15} className="text-violet-600" />
        <h3 className="text-sm font-semibold text-slate-700">A MAYRA sugere contactar</h3>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {uteis.map((o) => (
          <button
            key={o.segmentId}
            onClick={() => onUsar(o)}
            className={cn(
              'rounded-xl border p-4 text-left transition-colors hover:border-violet-300',
              TOM[o.prioridade],
            )}
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-semibold text-slate-900">{o.nome}</p>
              <span className="shrink-0 text-lg font-bold tabular-nums text-slate-900">
                {o.contactaveis}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600">{o.porque}</p>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
              {o.canalSugerido && (
                <span className="rounded bg-white/70 px-1.5 py-0.5 font-semibold capitalize">
                  {o.canalSugerido.toLowerCase()}
                </span>
              )}
              <span className="tabular-nums">{moeda(o.valorEmJogo)} já gastos</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export function CampanhasPanel() {
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [aCriar, setACriar] = useState(false);
  const [oportunidade, setOportunidade] = useState<OportunidadeCampanha | undefined>();
  const { data: campanhas, isLoading, isError } = useCampanhas();

  const abrirCom = (o: OportunidadeCampanha) => {
    setOportunidade(o);
    setACriar(true);
  };

  const fechar = () => {
    setACriar(false);
    setOportunidade(undefined);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
        <AlertTriangle size={36} strokeWidth={1} />
        <p className="text-sm">Não foi possível carregar as campanhas.</p>
      </div>
    );
  }

  const lista = campanhas ?? [];

  return (
    <div className="custom-scrollbar h-full overflow-y-auto p-5">
      {seleccionada ? (
        <DetalheCampanha id={seleccionada} onVoltar={() => setSeleccionada(null)} />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Mensagens a um segmento de clientes, com consentimento verificado antes de cada envio.
            </p>
            <button
              onClick={() => setACriar(true)}
              className="flex shrink-0 items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Plus size={15} /> Nova campanha
            </button>
          </div>

          <Oportunidades onUsar={abrirCom} />

          {lista.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Megaphone size={40} strokeWidth={1} className="text-slate-300" />
              <div>
                <p className="font-medium text-slate-600">Ainda não há campanhas.</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
                  Uma campanha envia a mesma mensagem a todos os clientes de um segmento — só a
                  quem aceitou ser contactado.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {lista.map((c: Campanha) => {
                const estado = ESTADOS[c.estado];
                return (
                  <button
                    key={c.id}
                    onClick={() => setSeleccionada(c.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-slate-300"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-slate-900">{c.nome}</p>
                        <span
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-xs font-semibold',
                            estado.classe,
                          )}
                        >
                          {estado.rotulo}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-slate-500">
                        {c.canal.toLowerCase()} · {c.segment?.nome ?? 'audiência fixada'} ·{' '}
                        {data(c.createdAt)}
                      </p>
                    </div>

                    {c.estado === 'CONCLUIDA' && (
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold tabular-nums text-slate-900">
                          {c.totalEnviados}
                        </p>
                        <p className="text-xs text-slate-400">
                          de {c.totalDestinatarios} enviadas
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {aCriar && <CampanhaModal onClose={fechar} oportunidadeInicial={oportunidade} />}
    </div>
  );
}
