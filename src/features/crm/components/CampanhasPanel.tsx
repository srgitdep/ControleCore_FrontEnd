import { useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Pencil,
  Plus,
  CheckCheck,
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
  useVerificarEntregas,
  useSegmentos,
  useOportunidades,
  useSugerirMensagens,
} from '../hooks/useClientes';
import type {
  CanalComunicacao,
  Campanha,
  EstadoCampanha,
  EstadoEntrega,
  OportunidadeCampanha,
  ResultadoEnvioCampanha,
  SugestaoMensagem,
} from '../api/clientes.api';
import { useTranslation } from 'react-i18next';
import { cn, formatData, formatMoeda } from '@/shared/utils';
import { TableScroll, ConfirmDialog } from '@/shared/ui';

const moeda = (v: number) => formatMoeda(Number(v));

const data = (iso?: string | null) => (iso ? formatData(iso) : '—');

// Os rótulos são chaves do catálogo (`as const` para o `t()` as aceitar tipadas); o
// texto resolve-se no componente, onde a língua activa é conhecida.
const ESTADOS = {
  RASCUNHO: { rotulo: 'campanhas.estado_rascunho', classe: 'bg-slate-100 text-slate-600 border-slate-200' },
  A_ENVIAR: { rotulo: 'campanhas.estado_a_enviar', classe: 'bg-blue-50 text-blue-700 border-blue-200' },
  CONCLUIDA: { rotulo: 'campanhas.estado_concluida', classe: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELADA: { rotulo: 'campanhas.estado_cancelada', classe: 'bg-slate-100 text-slate-500 border-slate-200' },
} as const satisfies Record<EstadoCampanha, { rotulo: string; classe: string }>;

/**
 * Cada motivo diz uma coisa diferente sobre o que correu mal, e cada um tem uma
 * acção diferente. Mostrar "suprimido" sem dizer porquê deixaria o utilizador
 * sem saber o que corrigir.
 */
const RESULTADOS = {
  ENVIADO: { rotulo: 'campanhas.resultado_enviado', classe: 'bg-emerald-50 text-emerald-700', ajuda: null },
  FALHADO: {
    rotulo: 'campanhas.resultado_falhado',
    classe: 'bg-rose-50 text-rose-700',
    ajuda: 'campanhas.resultado_falhado_ajuda',
  },
  SUPRIMIDO_SEM_CONSENTIMENTO: {
    rotulo: 'campanhas.resultado_sem_consentimento',
    classe: 'bg-amber-50 text-amber-700',
    ajuda: 'campanhas.resultado_sem_consentimento_ajuda',
  },
  SUPRIMIDO_SEM_CONTACTO: {
    rotulo: 'campanhas.resultado_sem_contacto',
    classe: 'bg-amber-50 text-amber-700',
    ajuda: 'campanhas.resultado_sem_contacto_ajuda',
  },
  SUPRIMIDO_JA_COMPROU: {
    rotulo: 'campanhas.resultado_ja_comprou',
    classe: 'bg-blue-50 text-blue-700',
    ajuda: 'campanhas.resultado_ja_comprou_ajuda',
  },
  SUPRIMIDO_LIMITE_FREQUENCIA: {
    rotulo: 'campanhas.resultado_limite_frequencia',
    classe: 'bg-amber-50 text-amber-700',
    ajuda: 'campanhas.resultado_limite_frequencia_ajuda',
  },
  SUPRIMIDO_CANAL_INDISPONIVEL: {
    rotulo: 'campanhas.resultado_canal_indisponivel',
    classe: 'bg-slate-100 text-slate-600',
    ajuda: 'campanhas.resultado_canal_indisponivel_ajuda',
  },
} as const satisfies Record<
  ResultadoEnvioCampanha,
  { rotulo: string; classe: string; ajuda: string | null }
>;

const CANAIS: CanalComunicacao[] = ['SMS', 'WHATSAPP', 'EMAIL'];

/**
 * O que aconteceu à mensagem depois de sair daqui.
 *
 * "Saiu" e "chegou" são coisas diferentes: o fornecedor aceita a mensagem em
 * segundos, mas o operador de rede pode não a entregar — telemóvel desligado,
 * fora de cobertura, número inválido. Mostrar as duas como a mesma coisa faria
 * a campanha parecer bem-sucedida quando ninguém a recebeu.
 */
const ENTREGAS = {
  ACEITE: {
    rotulo: 'campanhas.entrega_a_caminho',
    classe: 'bg-slate-100 text-slate-600',
    ajuda: 'campanhas.entrega_aceite_ajuda',
  },
  ENVIADA: {
    rotulo: 'campanhas.entrega_a_caminho',
    classe: 'bg-slate-100 text-slate-600',
    ajuda: 'campanhas.entrega_enviada_ajuda',
  },
  ENTREGUE: {
    rotulo: 'campanhas.entrega_chegou',
    classe: 'bg-emerald-50 text-emerald-700',
    ajuda: 'campanhas.entrega_entregue_ajuda',
  },
  LIDA: {
    rotulo: 'campanhas.entrega_lida',
    classe: 'bg-emerald-50 text-emerald-700',
    ajuda: 'campanhas.entrega_lida_ajuda',
  },
  NAO_ENTREGUE: {
    rotulo: 'campanhas.entrega_nao_chegou',
    classe: 'bg-rose-50 text-rose-700',
    ajuda: 'campanhas.entrega_nao_entregue_ajuda',
  },
} as const satisfies Record<EstadoEntrega, { rotulo: string; classe: string; ajuda: string }>;

// ──── Modal de criação ────────────────────────────────────────────────────────

function CampanhaModal({
  onClose,
  oportunidadeInicial,
}: {
  onClose: () => void;
  oportunidadeInicial?: OportunidadeCampanha;
}) {
  const { t } = useTranslation('crm');
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
  const [avisoMayra, setAvisoMayra] = useState<string | null>(null);

  /**
   * "Sem compras" fica no fim: são clientes sem histórico nenhum, e uma campanha
   * para eles não tem o que dizer — nem a MAYRA tem com que escrever. Não se
   * esconde, porque contactar quem se registou e nunca comprou é uma decisão
   * defensável; deixa é de ser a primeira coisa que aparece.
   */
  const semHistorico = (chave?: string | null) =>
    chave?.includes('sem_compras') || chave?.includes('sem_valor');

  const comMembros = (segmentos ?? [])
    .filter((s) => s.total > 0)
    .sort((a, b) => Number(semHistorico(a.chave)) - Number(semHistorico(b.chave)));

  const escolhido = comMembros.find((s) => s.id === form.segmentId);
  const escolhidoSemHistorico = semHistorico(escolhido?.chave);

  const pedirSugestoes = () => {
    if (!form.segmentId) return;
    sugerir.mutate(
      { segmentId: form.segmentId, canal: form.canal },
      {
        onSuccess: (r) => {
          setSugestoes(r.sugestoes);
          setAvisoMayra(r.aviso?.mensagem ?? null);
        },
      },
    );
  };

  const usar = (s: SugestaoMensagem) => {
    setForm((f) => ({ ...f, texto: s.texto, assunto: s.assunto ?? f.assunto }));
    setSugestoes(null);
    setAvisoMayra(null);
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
          <h2 className="text-lg font-bold text-slate-900">{t('campanhas.nova_campanha')}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submeter} className="space-y-4 overflow-y-auto p-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('campanhas.nome')}</label>
            <input
              autoFocus
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              placeholder={t('campanhas.nome_exemplo')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <p className="mt-1 text-xs text-slate-400">{t('campanhas.nome_interno')}</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('campanhas.quem_recebe')}</label>
            <select
              value={form.segmentId}
              onChange={(e) => setForm((f) => ({ ...f, segmentId: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">{t('campanhas.escolher_segmento')}</option>
              {comMembros.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} ({s.total}){semHistorico(s.chave) ? ` — ${t('campanhas.ainda_nao_compraram')}` : ''}
                </option>
              ))}
            </select>

            {comMembros.length === 0 ? (
              <p className="mt-1 text-xs text-amber-600">
                {t('campanhas.nenhum_segmento')}
              </p>
            ) : (
              escolhido && (
                // Quantos vão receber de facto depende do consentimento, que só
                // se sabe ao enviar. Dizer o número do segmento sem esta ressalva
                // criaria uma expectativa que o envio não cumpre.
                <p className="mt-1 text-xs text-slate-400">
                  {t('campanhas.no_grupo', { n: escolhido.total })}
                </p>
              )
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('campanhas.canal')}</label>
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
              <label className="mb-1 block text-sm font-medium text-slate-700">{t('campanhas.assunto')}</label>
              <input
                value={form.assunto}
                onChange={(e) => setForm((f) => ({ ...f, assunto: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          )}

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label className="text-sm font-medium text-slate-700">{t('campanhas.mensagem')}</label>
              <button
                type="button"
                onClick={pedirSugestoes}
                disabled={!form.segmentId || escolhidoSemHistorico || sugerir.isPending}
                title={
                  !form.segmentId
                    ? t('campanhas.mayra_escolha_primeiro')
                    : escolhidoSemHistorico
                      ? t('campanhas.mayra_sem_historico_dica')
                      : t('campanhas.mayra_dica')
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
                {sugerir.isPending ? t('campanhas.a_pensar') : t('campanhas.pedir_mayra')}
              </button>
            </div>

            {/* Dizer porque é que a MAYRA não ajuda aqui, e o que fazer em vez
                disso. Um botão apagado sem explicação parece uma avaria. */}
            {escolhidoSemHistorico && (
              <div className="mb-2 flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <Sparkles size={14} className="mt-0.5 shrink-0 text-slate-400" />
                <div className="text-xs text-slate-600">
                  <p className="font-semibold text-slate-700">
                    {t('campanhas.mayra_nao_consegue')}
                  </p>
                  <p className="mt-0.5">
                    {t('campanhas.mayra_nao_consegue_explicacao')}
                  </p>
                </div>
              </div>
            )}

            {/* As sugestões substituem o campo enquanto estão à escolha: mostrar
                as duas coisas ao mesmo tempo obrigaria a decidir onde olhar. */}
            {sugestoes ? (
              <div className="space-y-2">
                {/* A MAYRA escreveu, mas sem produtos no histórico só pôde ser
                    genérica. Dizê-lo é melhor que entregar texto vago como se
                    fosse fundamentado. */}
                {avisoMayra && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                    <span>{avisoMayra}</span>
                  </div>
                )}

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
                        {t('campanhas.caracteres', { n: s.texto.length })}
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
                    <Pencil size={13} /> {t('campanhas.escrever_minha')}
                  </button>
                  <button
                    type="button"
                    onClick={pedirSugestoes}
                    disabled={sugerir.isPending}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={cn(sugerir.isPending && 'animate-spin')} />
                    {t('campanhas.outras_opcoes')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <textarea
                  rows={4}
                  value={form.texto}
                  onChange={(e) => setForm((f) => ({ ...f, texto: e.target.value }))}
                  placeholder={t('campanhas.texto_exemplo', { nome: '{{nome}}' })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <div className="mt-1 flex items-start justify-between gap-2">
                  <p className="text-xs text-slate-400">
                    <code className="rounded bg-slate-100 px-1">{'{{nome}}'}</code>{' '}
                    {t('campanhas.nome_substituido')}
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
                      {form.canal === 'SMS' && form.texto.length > 160 && ` — ${t('campanhas.dois_sms')}`}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t('campanhas.nao_enviar_comprou')}
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
              <span className="text-sm text-slate-500">{t('campanhas.dias')}</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {t('campanhas.evita_insistir')}
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
              disabled={
                criar.isPending || !form.nome.trim() || !form.texto.trim() || !form.segmentId
              }
              className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {criar.isPending ? t('campanhas.a_criar') : t('campanhas.criar_rascunho')}
            </button>
          </div>

          {escolhido && (
            <p className="text-center text-xs text-slate-400">
              {t('campanhas.criada_em_rascunho')}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

// ──── Detalhe ─────────────────────────────────────────────────────────────────

function DetalheCampanha({ id, onVoltar }: { id: string; onVoltar: () => void }) {
  const { t } = useTranslation('crm');
  const [page, setPage] = useState(1);
  const { data: campanha, isLoading } = useCampanha(id);
  const { data: envios } = useEnviosCampanha(id, page);
  const { data: kpi } = useResultadoCampanha(id);
  const enviar = useEnviarCampanha();
  const cancelar = useCancelarCampanha();
  const verificar = useVerificarEntregas();
  // O `confirm()` nativo do browser bloqueia a janela e não se estiliza;
  // enviar uma campanha dispara mensagens reais e merece o mesmo cuidado que
  // as outras confirmações da aplicação.
  const [accaoPendente, setAccaoPendente] = useState<'enviar' | 'cancelar' | null>(null);

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
                {t(estado.rotulo)}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {campanha.canal.toLowerCase()} · {campanha.segment?.nome ?? t('campanhas.audiencia_fixada')}
              {campanha.concluidaEm && ` · ${t('campanhas.enviada_em', { data: data(campanha.concluidaEm) })}`}
            </p>
          </div>
        </div>

        {campanha.estado === 'CONCLUIDA' && (
          <button
            onClick={() => verificar.mutate()}
            disabled={verificar.isPending}
            title={t('campanhas.confirmar_entregas_dica')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <CheckCheck size={14} className={cn(verificar.isPending && 'animate-pulse')} />
            {verificar.isPending ? t('campanhas.a_confirmar') : t('campanhas.confirmar_entregas')}
          </button>
        )}

        {emRascunho && (
          <div className="flex gap-2">
            <button
              onClick={() => setAccaoPendente('enviar')}
              disabled={enviar.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              <Send size={14} />
              {enviar.isPending ? t('campanhas.a_enviar') : t('campanhas.enviar_agora')}
            </button>
            <button
              onClick={() => setAccaoPendente('cancelar')}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              {t('comum.cancelar')}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{t('campanhas.mensagem_titulo')}</p>
        {campanha.assunto && (
          <p className="mt-1 text-sm font-semibold text-slate-700">{campanha.assunto}</p>
        )}
        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{campanha.texto}</p>
      </div>

      {campanha.estado === 'CONCLUIDA' && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Numero rotulo={t('campanhas.kpi_sairam')} valor={String(campanha.totalEnviados)} />
          {/* Chegar é diferente de sair: entre as duas está o operador de rede. */}
          <Numero
            rotulo={t('campanhas.kpi_chegaram')}
            valor={kpi ? String(kpi.entregues) : '—'}
            sub={
              kpi && kpi.naoEntregues > 0
                ? t('campanhas.kpi_nao_chegaram', { n: kpi.naoEntregues })
                : kpi && kpi.porConfirmar > 0
                  ? t('campanhas.kpi_por_confirmar', { n: kpi.porConfirmar })
                  : undefined
            }
            alerta={!!kpi && kpi.naoEntregues > 0}
          />
          <Numero
            rotulo={t('campanhas.kpi_converteram')}
            valor={kpi ? String(kpi.convertidos) : '—'}
            sub={kpi && kpi.enviados > 0 ? t('campanhas.kpi_dos_envios', { n: Math.round(kpi.taxaConversao * 100) }) : undefined}
          />
          <Numero
            rotulo={t('campanhas.kpi_receita')}
            valor={kpi ? moeda(kpi.receita) : '—'}
            sub={kpi && kpi.custo > 0 ? t('campanhas.kpi_custou', { valor: kpi.custo.toFixed(2) }) : undefined}
          />
        </div>
      )}

      {envios && envios.data.length > 0 ? (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-700">
            {t('campanhas.destinatarios')}
            <span className="ml-2 font-normal text-slate-400">{envios.total}</span>
          </h4>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <TableScroll>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {[
                      t('campanhas.col_cliente'),
                      t('campanhas.col_contacto'),
                      t('campanhas.col_resultado'),
                      t('campanhas.col_chegou'),
                      t('campanhas.col_converteu'),
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
                            title={e.erro ?? (r.ajuda ? t(r.ajuda) : undefined)}
                            className={cn('rounded px-2 py-0.5 text-xs font-semibold', r.classe)}
                          >
                            {t(r.rotulo)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          {/* Só faz sentido para mensagens que saíram: uma
                              suprimida nunca teve entrega para acompanhar. */}
                          {e.resultado === 'ENVIADO' && e.estadoEntrega ? (
                            <span
                              title={e.erroEntrega ?? t(ENTREGAS[e.estadoEntrega].ajuda)}
                              className={cn(
                                'rounded px-2 py-0.5 text-xs font-semibold',
                                ENTREGAS[e.estadoEntrega].classe,
                              )}
                            >
                              {t(ENTREGAS[e.estadoEntrega].rotulo)}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
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
                {t('campanhas.pagina', { page: envios.page, lastPage: envios.lastPage })}
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
            {t('campanhas.ainda_nao_enviada')}
          </div>
        )
      )}

      <ConfirmDialog
        isOpen={accaoPendente !== null}
        title={accaoPendente === 'enviar' ? t('campanhas.enviar_campanha') : t('campanhas.cancelar_campanha')}
        message={
          accaoPendente === 'enviar'
            ? t('campanhas.enviar_mensagem', { nome: campanha.nome })
            : t('campanhas.cancelar_mensagem')
        }
        confirmText={accaoPendente === 'enviar' ? t('campanhas.enviar') : t('campanhas.cancelar_campanha')}
        cancelText={t('campanhas.voltar')}
        variant={accaoPendente === 'enviar' ? 'info' : 'danger'}
        isLoading={enviar.isPending || cancelar.isPending}
        onConfirm={() => {
          if (accaoPendente === 'enviar') enviar.mutate(id, { onSettled: () => setAccaoPendente(null) });
          if (accaoPendente === 'cancelar') cancelar.mutate(id, { onSettled: () => setAccaoPendente(null) });
        }}
        onCancel={() => setAccaoPendente(null)}
      />
    </div>
  );
}

function Numero({
  rotulo,
  valor,
  sub,
  alerta,
}: {
  rotulo: string;
  valor: string;
  sub?: string;
  alerta?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{rotulo}</p>
      <p
        className={cn(
          'mt-1 text-xl font-bold tabular-nums',
          alerta ? 'text-amber-700' : 'text-slate-900',
        )}
      >
        {valor}
      </p>
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
  const { t } = useTranslation('crm');
  const { data, isLoading } = useOportunidades();

  if (isLoading) return null;
  if (!data) return null;

  if (data.aviso) {
    return (
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <Sparkles size={16} className="mt-0.5 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-amber-900">{t('campanhas.mayra_sem_dados')}</p>
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
        <h3 className="text-sm font-semibold text-slate-700">{t('campanhas.mayra_sugere')}</h3>
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
              <span className="tabular-nums">{t('campanhas.ja_gastos', { valor: moeda(o.valorEmJogo) })}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export function CampanhasPanel() {
  const { t } = useTranslation('crm');
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
        <p className="text-sm">{t('campanhas.erro_carregar')}</p>
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
              {t('campanhas.intro')}
            </p>
            <button
              onClick={() => setACriar(true)}
              className="flex shrink-0 items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Plus size={15} /> {t('campanhas.nova_campanha')}
            </button>
          </div>

          <Oportunidades onUsar={abrirCom} />

          {lista.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Megaphone size={40} strokeWidth={1} className="text-slate-300" />
              <div>
                <p className="font-medium text-slate-600">{t('campanhas.vazio_titulo')}</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
                  {t('campanhas.vazio_explicacao')}
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
                          {t(estado.rotulo)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-slate-500">
                        {c.canal.toLowerCase()} · {c.segment?.nome ?? t('campanhas.audiencia_fixada')} ·{' '}
                        {data(c.createdAt)}
                      </p>
                    </div>

                    {c.estado === 'CONCLUIDA' && (
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold tabular-nums text-slate-900">
                          {c.totalEnviados}
                        </p>
                        <p className="text-xs text-slate-400">
                          {t('campanhas.de_enviadas', { n: c.totalDestinatarios })}
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
