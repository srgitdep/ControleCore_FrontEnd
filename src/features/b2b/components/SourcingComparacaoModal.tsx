import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  Check,
  ChevronDown,
  ChevronRight,
  Gavel,
  HelpCircle,
  Loader2,
  Package,
  Trophy,
  TruckIcon,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  b2bApi,
  DESCRICAO_ESTRATEGIA,
  ETIQUETA_ESTRATEGIA,
  ETIQUETA_EXCLUSAO,
} from '../api/b2b.api';
import type {
  Candidato,
  CenarioResumo,
  EstrategiaAdjudicacao,
  Requisicao,
  SourcingRun,
} from '../api/b2b.api';
import { cn } from '@/shared/utils';

interface Props {
  requisicao: Requisicao;
  run: SourcingRun;
  onClose: () => void;
  onAdjudicado: () => void;
}

const mt = (v: number | null | undefined) =>
  v === null || v === undefined
    ? '—'
    : `${v.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;

/**
 * A comparação de fornecedores, e a decisão.
 *
 * ## O ecrã que a funcionalidade existe para ter
 *
 * O requisito era: «devem ser fornecidos os factores que vão determinar porque esse
 * fornecedor em específico é o escolhido». Este ecrã é onde isso acontece — não como um
 * número de confiança, mas como a decomposição inteira: o valor bruto de cada factor, o
 * peso que tem nesta empresa, a contribuição para o total, e a frase que diz o que fez.
 *
 * ## Três decisões de apresentação que não são decorativas
 *
 * **Os excluídos aparecem.** Um fornecedor barato que ficou de fora por ter o alvará
 * expirado é a informação mais accionável do ecrã: alguém tem de lhe telefonar. Esconder os
 * excluídos leria-se como «não há mais fornecedores», que é uma afirmação diferente e falsa.
 *
 * **Os factores neutros são marcados.** «Sem histórico» num fornecedor novo não é a mesma
 * coisa que «50% de pontualidade», e mostrar os dois como 0,5 sem distinção faria o
 * utilizador ler um juízo onde há uma ausência de dados.
 *
 * **O custo total não é o critério de ordenação, e o ecrã diz porquê.** Um fornecedor que
 * cobre 3 de 20 linhas tem custo total baixo porque compra pouco. O que se compara é o
 * índice de preço — quanto custa nas linhas que cobre, contra o melhor preço dessas mesmas
 * linhas — e a coluna tem a explicação ao lado.
 */
export function SourcingComparacaoModal({ requisicao, run, onClose, onAdjudicado }: Props) {
  const [expandido, setExpandido] = useState<string | null>(null);
  const [estrategia, setEstrategia] = useState<EstrategiaAdjudicacao | null>(
    run.estrategiaRecomendada ?? null,
  );
  const [motivoDesvio, setMotivoDesvio] = useState('');
  const [aAdjudicar, setAAdjudicar] = useState(false);

  const elegiveis = useMemo(
    () =>
      run.candidatos
        .filter((c) => !c.excluido)
        .sort((a, b) => (a.posicao ?? 999) - (b.posicao ?? 999)),
    [run.candidatos],
  );

  const excluidos = useMemo(() => run.candidatos.filter((c) => c.excluido), [run.candidatos]);
  const cenarios = run.resumo?.cenarios ?? [];

  // O desvio é medido contra a **estratégia recomendada** e não contra a posição no ranking.
  // Numa adjudicação repartida o primeiro do ranking pode legitimamente não levar linhas
  // nenhumas, e pedir justificação a quem seguiu a recomendação seria o falso positivo mais
  // irritante que este ecrã podia ter.
  const haDesvio =
    run.estrategiaRecomendada !== null &&
    estrategia !== null &&
    estrategia !== run.estrategiaRecomendada;

  const adjudicar = async () => {
    if (!estrategia) {
      toast.error('Escolha um cenário antes de adjudicar.');
      return;
    }

    if (haDesvio && motivoDesvio.trim().length < 10) {
      toast.error(
        'Escolher um cenário diferente do recomendado exige um motivo. É o que distingue ' +
          'uma boa razão de um favor, seis meses depois.',
      );
      return;
    }

    setAAdjudicar(true);
    try {
      const resultado = await b2bApi.adjudicar(requisicao.id, {
        runId: run.id,
        estrategia,
        motivoDesvio: haDesvio ? motivoDesvio.trim() : undefined,
      });

      // O aviso vem do backend e é mostrado como está: diz que as ordens ficaram em rascunho
      // e que a despesa continua por aprovar. Um utilizador que adjudique e assuma que o
      // fornecedor já sabe fica com um pedido parado até alguém perguntar pela mercadoria.
      toast.success(resultado.aviso, { duration: 8000 });
      onAdjudicado();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao adjudicar.');
    } finally {
      setAAdjudicar(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4">
      <div className="my-4 w-full max-w-5xl rounded-xl bg-white shadow-xl">
        <header className="sticky top-0 z-10 flex items-start justify-between rounded-t-xl border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Comparação de fornecedores
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Requisição{' '}
              <span className="font-mono font-medium text-slate-700">{requisicao.numero}</span> ·{' '}
              {requisicao.linhas.length} linha{requisicao.linhas.length === 1 ? '' : 's'} ·{' '}
              {run.candidatosAvaliados} fornecedor
              {run.candidatosAvaliados === 1 ? '' : 'es'} avaliado
              {run.candidatosAvaliados === 1 ? '' : 's'} ·{' '}
              <span className="font-mono text-slate-400">{run.versaoAlgoritmo}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-6 px-5 py-5">
          {elegiveis.length === 0 ? (
            <SemCandidatos motivo={run.resumo?.motivo} excluidos={excluidos} />
          ) : (
            <>
              <Ranking
                candidatos={elegiveis}
                linhasTotais={requisicao.linhas.length}
                pesos={run.pesos}
                expandido={expandido}
                onExpandir={(id) => setExpandido(expandido === id ? null : id)}
              />

              {excluidos.length > 0 && <Excluidos candidatos={excluidos} />}

              {cenarios.length > 0 && (
                <Cenarios
                  cenarios={cenarios}
                  recomendado={run.estrategiaRecomendada ?? null}
                  escolhido={estrategia}
                  onEscolher={setEstrategia}
                />
              )}

              {haDesvio && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900">
                        Está a escolher {ETIQUETA_ESTRATEGIA[estrategia!]} e a comparação
                        recomendou {ETIQUETA_ESTRATEGIA[run.estrategiaRecomendada!]}.
                      </p>
                      <p className="mt-1 text-xs text-amber-800">
                        Desviar-se é legítimo — a pontuação não sabe que o fornecedor em
                        segundo está em litígio, nem que o primeiro entregou mal na semana
                        passada e ainda não há factura para o provar. O motivo é o que
                        permite distinguir isso de um favor, meses depois.
                      </p>
                      <textarea
                        value={motivoDesvio}
                        onChange={(e) => setMotivoDesvio(e.target.value)}
                        rows={2}
                        placeholder="Porque é que este cenário e não o recomendado?"
                        className="mt-2 w-full rounded-md border border-amber-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {elegiveis.length > 0 && (
          <footer className="sticky bottom-0 flex items-center justify-between gap-3 rounded-b-xl border-t border-slate-100 bg-slate-50 px-5 py-4">
            <p className="text-xs text-slate-500">
              A adjudicação escolhe o fornecedor. As ordens nascem em rascunho e a despesa
              continua por aprovar.
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
              >
                Fechar
              </button>
              <button
                onClick={adjudicar}
                disabled={aAdjudicar || !estrategia}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {aAdjudicar ? <Loader2 size={16} className="animate-spin" /> : <Gavel size={16} />}
                Adjudicar
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Ranking
// ═══════════════════════════════════════════════════════════════════════════════

function Ranking({
  candidatos,
  linhasTotais,
  pesos,
  expandido,
  onExpandir,
}: {
  candidatos: Candidato[];
  linhasTotais: number;
  pesos: Record<string, number>;
  expandido: string | null;
  onExpandir: (id: string) => void;
}) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Trophy size={15} className="text-amber-500" />
        Ranking
      </h3>

      <div className="space-y-2">
        {candidatos.map((candidato) => {
          const aberto = expandido === candidato.id;
          const nome = candidato.organizacao.nomeComercial ?? candidato.organizacao.razaoSocial;
          const indice = candidato.factores?.indicePreco ?? null;

          return (
            <div
              key={candidato.id}
              className={cn(
                'rounded-lg border transition-colors',
                candidato.posicao === 1
                  ? 'border-blue-200 bg-blue-50/40'
                  : 'border-slate-200 bg-white',
              )}
            >
              <button
                onClick={() => onExpandir(candidato.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    candidato.posicao === 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600',
                  )}
                >
                  {candidato.posicao}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{nome}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Package size={11} />
                      {candidato.linhasCobertas} de {linhasTotais} linhas
                    </span>
                    {candidato.prazoEstimadoDias !== null && (
                      <span className="inline-flex items-center gap-1">
                        <TruckIcon size={11} />
                        {candidato.prazoEstimadoDias} dias
                      </span>
                    )}
                    {indice !== null && (
                      <span
                        className={cn(
                          'font-medium',
                          indice <= 1.001 ? 'text-emerald-600' : 'text-slate-600',
                        )}
                        // O índice é o número que decide, e a maioria das pessoas nunca viu
                        // um. A explicação no `title` é mais barata do que uma legenda que
                        // ninguém lê — e é o único sítio do ecrã onde este conceito aparece.
                        title={
                          'Quanto custa nas linhas que cobre, dividido pelo melhor preço ' +
                          'disponível para essas mesmas linhas. 1,00 é o melhor preço em tudo. ' +
                          'É este número que se compara, e não o custo total: um fornecedor ' +
                          'que cobre pouco tem custo total baixo por comprar pouco.'
                        }
                      >
                        {indice <= 1.001
                          ? 'melhor preço'
                          : `${((indice - 1) * 100).toFixed(1)}% acima do melhor`}
                      </span>
                    )}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-slate-900">{mt(candidato.custoTotal)}</p>
                  <p className="text-xs text-slate-500">
                    {candidato.pontuacao?.toFixed(1)} pontos
                  </p>
                </div>

                {aberto ? (
                  <ChevronDown size={16} className="shrink-0 text-slate-400" />
                ) : (
                  <ChevronRight size={16} className="shrink-0 text-slate-400" />
                )}
              </button>

              {aberto && <Factores candidato={candidato} pesos={pesos} />}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * A decomposição da pontuação — a parte que responde a «porquê este».
 *
 * A barra é proporcional ao **normalizado** e não à contribuição: normalizado é «quão bom é
 * neste factor», que é o que o utilizador quer ler. A contribuição em pontos fica ao lado,
 * em número, porque é o que soma ao total.
 */
function Factores({ candidato, pesos }: { candidato: Candidato; pesos: Record<string, number> }) {
  const factores = candidato.factores?.factores ?? [];
  const somaPesos = Object.entries(pesos)
    .filter(([chave]) => chave.startsWith('peso'))
    .reduce((soma, [, valor]) => soma + Number(valor ?? 0), 0);

  if (factores.length === 0) {
    return (
      <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        Esta corrida não guardou a decomposição dos factores deste candidato.
      </div>
    );
  }

  return (
    <div className="space-y-3 border-t border-slate-100 bg-white/60 px-4 py-4">
      {factores.map((factor) => (
        <div key={factor.chave}>
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs font-medium text-slate-700">
              {factor.etiqueta}
              {factor.neutro && (
                <span
                  className="ml-1.5 inline-flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-normal text-slate-500"
                  // A marca não é cosmética. «Sem histórico» e «50% de pontualidade» dão o
                  // mesmo 0,5, e sem esta distinção o utilizador leria um juízo onde há uma
                  // ausência de dados.
                  title="Sem dados para avaliar este factor. Ficou no ponto neutro — nem premiado nem castigado."
                >
                  <HelpCircle size={9} />
                  sem dados
                </span>
              )}
            </p>
            <p className="shrink-0 text-xs text-slate-500">
              <span className="font-medium text-slate-700">{factor.valorLegivel}</span>
              {' · '}
              {factor.contribuicao.toFixed(1)}/{factor.peso.toFixed(0)}
              {somaPesos > 0 && <span className="text-slate-400"> de {somaPesos.toFixed(0)}</span>}
            </p>
          </div>

          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                factor.neutro
                  ? 'bg-slate-300'
                  : factor.normalizado >= 0.8
                    ? 'bg-emerald-500'
                    : factor.normalizado >= 0.5
                      ? 'bg-blue-500'
                      : 'bg-amber-500',
              )}
              style={{ width: `${Math.max(factor.normalizado * 100, 1)}%` }}
            />
          </div>

          <p className="mt-1 text-[11px] leading-snug text-slate-500">{factor.explicacao}</p>
        </div>
      ))}

      {candidato.factores?.conformidade && (
        <p className="border-t border-slate-100 pt-2 text-[11px] text-slate-500">
          <span className="font-medium text-slate-600">Conformidade:</span>{' '}
          {candidato.factores.conformidade}
        </p>
      )}

      {candidato.factores?.zona && (
        <p className="text-[11px] text-slate-500">
          <span className="font-medium text-slate-600">Entrega:</span> {candidato.factores.zona}
        </p>
      )}

      {candidato.factores?.avisoMinimoEntrega && (
        <p className="rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800">
          <AlertTriangle size={10} className="mr-1 inline" />
          {candidato.factores.avisoMinimoEntrega}
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Excluídos
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Os fornecedores que não entraram na comparação, e porquê.
 *
 * É a secção mais accionável do ecrã: um fornecedor barato que ficou de fora por ter o
 * alvará expirado significa que alguém tem de lhe telefonar. Esconder isto leria-se como
 * «não há mais fornecedores» — que é uma afirmação diferente, e falsa.
 */
function Excluidos({ candidatos }: { candidatos: Candidato[] }) {
  const [aberto, setAberto] = useState(false);

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50/60">
      <button
        onClick={() => setAberto(!aberto)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Ban size={14} className="text-slate-400" />
          {candidatos.length} fornecedor{candidatos.length === 1 ? '' : 'es'} fora da comparação
        </span>
        {aberto ? (
          <ChevronDown size={16} className="text-slate-400" />
        ) : (
          <ChevronRight size={16} className="text-slate-400" />
        )}
      </button>

      {aberto && (
        <ul className="divide-y divide-slate-200 border-t border-slate-200">
          {candidatos.map((c) => (
            <li key={c.id} className="px-4 py-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm text-slate-800">
                  {c.organizacao.nomeComercial ?? c.organizacao.razaoSocial}
                </p>
                <span className="shrink-0 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                  {ETIQUETA_EXCLUSAO[c.motivoExclusao ?? ''] ?? c.motivoExclusao}
                </span>
              </div>
              {c.detalheExclusao && (
                <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                  {c.detalheExclusao}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Cenários
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Os três cenários, com o custo total de cada um.
 *
 * ## O custo administrativo aparece separado, e é o ponto
 *
 * Sem ele, «repartida» ganha sempre — por construção, e não por ser melhor: o mínimo de cada
 * linha é menor ou igual ao que qualquer fornecedor único cobra por ela. Mostrar a mercadoria
 * e a administração em linhas separadas é o que torna visível **porque** é que às vezes vale
 * a pena pagar mais pela mercadoria.
 */
function Cenarios({
  cenarios,
  recomendado,
  escolhido,
  onEscolher,
}: {
  cenarios: CenarioResumo[];
  recomendado: EstrategiaAdjudicacao | null;
  escolhido: EstrategiaAdjudicacao | null;
  onEscolher: (e: EstrategiaAdjudicacao) => void;
}) {
  const validos = cenarios.filter((c) => c.fornecedores.length > 0);

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Como distribuir a compra</h3>

      <div className="grid gap-3 sm:grid-cols-3">
        {validos.map((cenario) => {
          const eRecomendado = cenario.estrategia === recomendado;
          const eEscolhido = cenario.estrategia === escolhido;

          return (
            <button
              key={cenario.estrategia}
              onClick={() => onEscolher(cenario.estrategia)}
              className={cn(
                'rounded-lg border p-3 text-left transition-colors',
                eEscolhido
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                  : 'border-slate-200 bg-white hover:border-slate-300',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-slate-900">
                  {ETIQUETA_ESTRATEGIA[cenario.estrategia]}
                </p>
                {eEscolhido && <Check size={14} className="shrink-0 text-blue-600" />}
              </div>

              {eRecomendado && (
                <span className="mt-1 inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                  recomendado
                </span>
              )}

              <p className="mt-2 text-lg font-semibold text-slate-900">{mt(cenario.custoTotal)}</p>

              <dl className="mt-1.5 space-y-0.5 text-[11px] text-slate-500">
                <div className="flex justify-between gap-2">
                  <dt>Mercadoria</dt>
                  <dd className="font-medium text-slate-600">{mt(cenario.custoMercadoria)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>
                    Processamento
                    <span
                      className="ml-1 cursor-help text-slate-400"
                      title={
                        'Mais uma ordem, mais uma entrega para conferir, mais uma factura ' +
                        'para conciliar. É o número que decide entre único e repartido — sem ' +
                        'ele, repartir ganharia sempre por construção.'
                      }
                    >
                      ⓘ
                    </span>
                  </dt>
                  <dd className="font-medium text-slate-600">
                    {mt(cenario.custoAdministrativo)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2 pt-0.5">
                  <dt>Fornecedores</dt>
                  <dd className="font-medium text-slate-600">{cenario.fornecedores.length}</dd>
                </div>
              </dl>

              {cenario.linhasNaoCobertas > 0 && (
                <p className="mt-2 rounded bg-amber-50 px-1.5 py-1 text-[10px] leading-snug text-amber-800">
                  {cenario.linhasNaoCobertas} linha
                  {cenario.linhasNaoCobertas === 1 ? '' : 's'} sem fornecedor neste cenário
                </p>
              )}

              <p className="mt-2 text-[11px] leading-snug text-slate-500">
                {DESCRICAO_ESTRATEGIA[cenario.estrategia]}
              </p>
            </button>
          );
        })}
      </div>

      {escolhido && (
        <ListaDeFornecedores
          cenario={validos.find((c) => c.estrategia === escolhido)}
        />
      )}
    </section>
  );
}

function ListaDeFornecedores({ cenario }: { cenario?: CenarioResumo }) {
  if (!cenario) return null;

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs font-medium text-slate-600">
        Vai gerar {cenario.fornecedores.length} ordem
        {cenario.fornecedores.length === 1 ? '' : 's'} de compra:
      </p>
      <ul className="mt-2 space-y-1">
        {cenario.fornecedores.map((f) => (
          <li key={f.organizacaoId} className="flex items-baseline justify-between gap-3 text-xs">
            <span className="text-slate-800">{f.nome}</span>
            <span className="shrink-0 text-slate-500">
              {f.linhas} linha{f.linhas === 1 ? '' : 's'} ·{' '}
              <span className="font-medium text-slate-700">{mt(f.custo)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Sem candidatos
// ═══════════════════════════════════════════════════════════════════════════════

function SemCandidatos({
  motivo,
  excluidos,
}: {
  motivo?: string;
  excluidos: Candidato[];
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              Nenhum fornecedor elegível para esta requisição.
            </p>
            <p className="mt-1 text-xs text-amber-800">
              {motivo ??
                'Os fornecedores encontrados foram todos excluídos. Os motivos estão abaixo — ' +
                  'a maioria resolve-se com um telefonema ou uma verificação de documento.'}
            </p>
          </div>
        </div>
      </div>

      {excluidos.length > 0 && <Excluidos candidatos={excluidos} />}
    </div>
  );
}
