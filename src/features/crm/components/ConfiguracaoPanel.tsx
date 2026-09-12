import { useEffect, useState } from 'react';
import { AlertTriangle, RotateCcw, Save, SlidersHorizontal } from 'lucide-react';
import { useConfiguracaoCrm, useActualizarConfiguracao } from '../hooks/useClientes';
import type { CanalComunicacao, ConfiguracaoCrm } from '../api/clientes.api';
import { cn } from '@/shared/utils';

/**
 * Os valores de fábrica, para o botão de repor e para assinalar o que foi
 * alterado. Espelham os do backend.
 */
const OMISSAO: ConfiguracaoCrm = {
  limiteMensagens: 4,
  limiteJanelaDias: 30,
  factorRisco: 2,
  factorInactivo: 4,
  intervaloMinimoDias: 7,
  diasRiscoSemHabito: 60,
  diasInactivoSemHabito: 120,
  janelaConversaoDias: 7,
  supressaoEmRiscoDias: 15,
  supressaoInactivoDias: 30,
  canaisPermitidos: [],
  pontosPorMetical: 0.01,
  valorDoPonto: 1,
  minimoResgate: 50,
  fidelizacaoActiva: true,
};

const CANAIS: CanalComunicacao[] = ['WHATSAPP', 'SMS', 'EMAIL'];

type CampoNumerico = Exclude<
  keyof ConfiguracaoCrm,
  'canaisPermitidos' | 'fidelizacaoActiva'
>;

interface Campo {
  chave: CampoNumerico;
  rotulo: string;
  ajuda: string;
  min: number;
  max: number;
  passo?: number;
  unidade: string;
}

/**
 * Os campos agrupados pela pergunta de negócio que respondem, e não pelo nome
 * técnico que têm na base. Quem configura isto pensa em "com que frequência
 * posso falar com um cliente", não em "limiteJanelaDias".
 */
const SECCOES: Array<{ titulo: string; explicacao: string; campos: Campo[] }> = [
  {
    titulo: 'Com que frequência pode falar com um cliente',
    explicacao:
      'Vale para todas as campanhas juntas. Quando um cliente atinge o limite, deixa de receber até a janela passar — mesmo que outra campanha o inclua.',
    campos: [
      {
        chave: 'limiteMensagens',
        rotulo: 'Máximo de mensagens',
        ajuda: 'Por cliente, somando todas as campanhas.',
        min: 1,
        max: 50,
        unidade: 'mensagens',
      },
      {
        chave: 'limiteJanelaDias',
        rotulo: 'Nesse período',
        ajuda: 'Passado este tempo, a contagem recomeça.',
        min: 1,
        max: 365,
        unidade: 'dias',
      },
    ],
  },
  {
    titulo: 'A partir de quando um cliente está a perder-se',
    explicacao:
      'Medido contra o hábito de cada um, não em dias fixos. Com 2x, quem compra de 10 em 10 dias entra em risco aos 20 — e quem compra de 90 em 90 só aos 180.',
    campos: [
      {
        chave: 'factorRisco',
        rotulo: 'Em risco a partir de',
        ajuda: 'Quantas vezes o intervalo habitual dele.',
        min: 1,
        max: 10,
        passo: 0.5,
        unidade: 'x o hábito',
      },
      {
        chave: 'factorInactivo',
        rotulo: 'Inactivo a partir de',
        ajuda: 'Passado isto, recuperar custa muito mais.',
        min: 1,
        max: 20,
        passo: 0.5,
        unidade: 'x o hábito',
      },
      {
        chave: 'intervaloMinimoDias',
        rotulo: 'Intervalo mínimo considerado',
        ajuda: 'Impede que quem compra quase todos os dias dispare alertas por um fim-de-semana.',
        min: 1,
        max: 90,
        unidade: 'dias',
      },
    ],
  },
  {
    titulo: 'Clientes com uma só compra',
    explicacao:
      'Sem duas compras não há intervalo que medir, por isso estes usam dias fixos.',
    campos: [
      {
        chave: 'diasRiscoSemHabito',
        rotulo: 'Deixa de ser "novo" após',
        ajuda: 'Antes disto, conta como cliente recente.',
        min: 7,
        max: 365,
        unidade: 'dias',
      },
      {
        chave: 'diasInactivoSemHabito',
        rotulo: 'Inactivo após',
        ajuda: 'Comprou uma vez e nunca mais voltou.',
        min: 14,
        max: 730,
        unidade: 'dias',
      },
    ],
  },
  {
    titulo: 'Medição das campanhas',
    explicacao:
      'Quanto tempo depois de uma mensagem é que uma compra ainda conta como resultado dela. Janelas longas fazem qualquer campanha parecer bem-sucedida.',
    campos: [
      {
        chave: 'janelaConversaoDias',
        rotulo: 'Compra conta como conversão até',
        ajuda: 'Contado a partir do envio.',
        min: 1,
        max: 90,
        unidade: 'dias',
      },
    ],
  },
  {
    titulo: 'O que a MAYRA sugere',
    explicacao:
      'Janelas que ela propõe ao recomendar uma campanha. Continuam a poder ser alteradas em cada campanha.',
    campos: [
      {
        chave: 'supressaoEmRiscoDias',
        rotulo: 'Clientes em risco',
        ajuda: 'Não enviar a quem comprou neste período.',
        min: 1,
        max: 365,
        unidade: 'dias',
      },
      {
        chave: 'supressaoInactivoDias',
        rotulo: 'Clientes inactivos',
        ajuda: 'Idem, para quem já não compra há muito.',
        min: 1,
        max: 365,
        unidade: 'dias',
      },
    ],
  },
];

/**
 * Os campos de fidelização, fora das SECCOES porque a secção deles tem
 * interruptor e simulação próprios.
 */
const FIDELIZACAO: Campo[] = [
  {
    chave: 'pontosPorMetical',
    rotulo: 'Pontos por cada metical',
    ajuda: '0,01 dá 1 ponto por cada 100 MT gastos.',
    min: 0,
    max: 1,
    passo: 0.001,
    unidade: 'pontos/MT',
  },
  {
    chave: 'valorDoPonto',
    rotulo: 'Quanto vale um ponto',
    ajuda: 'Em desconto, quando o cliente os usa.',
    min: 0.01,
    max: 100,
    passo: 0.5,
    unidade: 'MT',
  },
  {
    chave: 'minimoResgate',
    rotulo: 'Mínimo para usar',
    ajuda: 'Abaixo disto o cliente acumula, mas não pode gastar.',
    min: 1,
    max: 100000,
    unidade: 'pontos',
  },
];

export function ConfiguracaoPanel() {
  const { data: guardada, isLoading, isError } = useConfiguracaoCrm();
  const actualizar = useActualizarConfiguracao();

  const [form, setForm] = useState<ConfiguracaoCrm | null>(null);

  useEffect(() => {
    if (guardada) {
      // Os números chegam da API como string quando são Decimal.
      setForm({
        ...guardada,
        factorRisco: Number(guardada.factorRisco),
        factorInactivo: Number(guardada.factorInactivo),
        pontosPorMetical: Number(guardada.pontosPorMetical),
        valorDoPonto: Number(guardada.valorDoPonto),
      });
    }
  }, [guardada]);

  if (isLoading || !form) {
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
        <p className="text-sm">Não foi possível carregar as definições.</p>
      </div>
    );
  }

  const alterado = (chave: CampoNumerico) => form[chave] !== OMISSAO[chave];

  // Quanto de cada venda volta ao cliente em pontos. É este número, e não
  // "0,01 pontos por metical", que diz se a regra é sustentável.
  const custoPercentual = form.pontosPorMetical * form.valorDoPonto * 100;

  // Quanto o cliente tem de gastar antes de poder usar alguma coisa. Com
  // pontosPorMetical a zero nunca chega lá — daí o Infinity, tratado na vista.
  const meticaisAteResgatar =
    form.pontosPorMetical > 0 ? form.minimoResgate / form.pontosPorMetical : Infinity;

  const temAlteracoes =
    guardada &&
    (Object.keys(form) as Array<keyof ConfiguracaoCrm>).some((k) => {
      if (k === 'canaisPermitidos') {
        return JSON.stringify(form[k]) !== JSON.stringify(guardada[k]);
      }
      if (k === 'fidelizacaoActiva') {
        return form[k] !== guardada[k];
      }
      return Number(form[k]) !== Number(guardada[k]);
    });

  const guardar = () => {
    const { canaisPermitidos, ...numeros } = form;
    actualizar.mutate({ ...numeros, canaisPermitidos });
  };

  const alternarCanal = (canal: CanalComunicacao) =>
    setForm((f) =>
      f
        ? {
            ...f,
            canaisPermitidos: f.canaisPermitidos.includes(canal)
              ? f.canaisPermitidos.filter((c) => c !== canal)
              : [...f.canaisPermitidos, canal],
          }
        : f,
    );

  return (
    <div className="custom-scrollbar h-full overflow-y-auto p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <SlidersHorizontal size={16} className="mt-0.5 shrink-0 text-slate-400" />
          <div>
            <p className="text-sm text-slate-600">
              Como o CRM se comporta nesta empresa.
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Os valores mudam a classificação de toda a base no próximo cálculo, e quantas
              mensagens saem.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            onClick={() =>
              setForm({
                ...OMISSAO,
                // Repor os números não é o mesmo que voltar a ligar um programa
                // de pontos que a loja decidiu desligar.
                canaisPermitidos: form.canaisPermitidos,
                fidelizacaoActiva: form.fidelizacaoActiva,
              })
            }
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw size={14} /> Repor
          </button>
          <button
            onClick={guardar}
            disabled={!temAlteracoes || actualizar.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
          >
            <Save size={14} />
            {actualizar.isPending ? 'A guardar…' : 'Guardar'}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {SECCOES.map((seccao) => (
          <section key={seccao.titulo} className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-800">{seccao.titulo}</h3>
            <p className="mt-0.5 max-w-2xl text-xs text-slate-500">{seccao.explicacao}</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {seccao.campos.map((campo) => (
                <div key={campo.chave}>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                    {campo.rotulo}
                    {alterado(campo.chave) && (
                      <span
                        title={`Valor de origem: ${OMISSAO[campo.chave]}`}
                        className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700"
                      >
                        alterado
                      </span>
                    )}
                  </label>

                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="number"
                      min={campo.min}
                      max={campo.max}
                      step={campo.passo ?? 1}
                      value={form[campo.chave]}
                      onChange={(e) =>
                        setForm((f) =>
                          f ? { ...f, [campo.chave]: Number(e.target.value) } : f,
                        )
                      }
                      className={cn(
                        'w-24 rounded-lg border px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900',
                        alterado(campo.chave) ? 'border-blue-300' : 'border-slate-300',
                      )}
                    />
                    <span className="text-sm text-slate-500">{campo.unidade}</span>
                  </div>

                  <p className="mt-1 text-xs text-slate-400">{campo.ajuda}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Fidelização: não entra na grelha genérica porque tem um interruptor
            e porque o que importa aqui não são os números, é o que resulta
            deles. Quem configura precisa de ver quanto custa à loja. */}
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Pontos de fidelização</h3>
              <p className="mt-0.5 max-w-2xl text-xs text-slate-500">
                Quanto os clientes ganham por comprar, e quanto isso vale quando usam.
              </p>
            </div>

            <button
              onClick={() =>
                setForm((f) => (f ? { ...f, fidelizacaoActiva: !f.fidelizacaoActiva } : f))
              }
              role="switch"
              aria-checked={form.fidelizacaoActiva}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                form.fidelizacaoActiva
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
              )}
            >
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  form.fidelizacaoActiva ? 'bg-emerald-500' : 'bg-slate-300',
                )}
              />
              {form.fidelizacaoActiva ? 'Activa' : 'Desligada'}
            </button>
          </div>

          {!form.fidelizacaoActiva && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Desligada, ninguém ganha nem usa pontos. Os saldos actuais ficam guardados e
              voltam a estar disponíveis se a religar.
            </p>
          )}

          <div
            className={cn(
              'mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3',
              !form.fidelizacaoActiva && 'pointer-events-none opacity-50',
            )}
          >
            {FIDELIZACAO.map((campo) => (
              <div key={campo.chave}>
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  {campo.rotulo}
                  {alterado(campo.chave) && (
                    <span
                      title={`Valor de origem: ${OMISSAO[campo.chave]}`}
                      className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700"
                    >
                      alterado
                    </span>
                  )}
                </label>

                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    min={campo.min}
                    max={campo.max}
                    step={campo.passo ?? 1}
                    value={form[campo.chave]}
                    onChange={(e) =>
                      setForm((f) => (f ? { ...f, [campo.chave]: Number(e.target.value) } : f))
                    }
                    className={cn(
                      'w-24 rounded-lg border px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900',
                      alterado(campo.chave) ? 'border-blue-300' : 'border-slate-300',
                    )}
                  />
                  <span className="text-sm text-slate-500">{campo.unidade}</span>
                </div>

                <p className="mt-1 text-xs text-slate-400">{campo.ajuda}</p>
              </div>
            ))}
          </div>

          {/* O que os números acima querem dizer na prática. Sem isto, ninguém
              percebe que 0,05 com o ponto a 1 MT é dar 5% de desconto. */}
          {form.fidelizacaoActiva && (
            <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
              <p>
                Numa compra de <strong>1 000 MT</strong> o cliente ganha{' '}
                <strong className="tabular-nums">
                  {Math.floor(1000 * form.pontosPorMetical)} pontos
                </strong>
                , que valem{' '}
                <strong className="tabular-nums">
                  {(Math.floor(1000 * form.pontosPorMetical) * form.valorDoPonto).toLocaleString(
                    'pt-MZ',
                    { maximumFractionDigits: 2 },
                  )}{' '}
                  MT
                </strong>{' '}
                de desconto — {custoPercentual.toLocaleString('pt-MZ', {
                  maximumFractionDigits: 2,
                })}
                % do valor da compra.
              </p>
              <p className="mt-1 text-slate-500">
                Só pode usar a partir de {form.minimoResgate} pontos, ou seja depois de gastar{' '}
                {meticaisAteResgatar === Infinity
                  ? '—'
                  : Math.ceil(meticaisAteResgatar).toLocaleString('pt-MZ')}{' '}
                MT.
              </p>
            </div>
          )}

          {custoPercentual > 20 && form.fidelizacaoActiva && (
            <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle size={14} className="mt-px shrink-0" />
              Está a devolver mais de um quinto de cada venda em pontos. Confirme que a margem
              aguenta.
            </p>
          )}
        </section>

        {/* Canais */}
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-800">Canais que esta empresa usa</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Nenhum seleccionado significa todos os que o sistema conseguir entregar.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {CANAIS.map((canal) => {
              const activo = form.canaisPermitidos.includes(canal);
              return (
                <button
                  key={canal}
                  onClick={() => alternarCanal(canal)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors',
                    activo
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
                  )}
                >
                  {canal.toLowerCase()}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* O aviso fica no fim, junto ao botão, e não no topo onde se esquece. */}
      <p className="mt-5 text-xs text-slate-400">
        As definições aplicam-se ao próximo cálculo de segmentos — corre todas as noites, ou
        quando o pedir na aba Segmentos.
      </p>
    </div>
  );
}
