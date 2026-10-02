import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RotateCcw, Save, SlidersHorizontal } from 'lucide-react';
import { useConfiguracaoCrm, useActualizarConfiguracao } from '../hooks/useClientes';
import type { CanalComunicacao, ConfiguracaoCrm } from '../api/clientes.api';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { localeIntl } from '@/i18n';
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
 *
 * Função e não constante: os textos vêm do catálogo e mudam com a língua; uma
 * constante de módulo congelava o idioma do primeiro render.
 */
function criarSeccoes(
  t: TFunction<'crm'>,
): Array<{ titulo: string; explicacao: string; campos: Campo[] }> {
  return [
    {
      titulo: t('config.seccao_frequencia_titulo'),
      explicacao: t('config.seccao_frequencia_explicacao'),
      campos: [
        {
          chave: 'limiteMensagens',
          rotulo: t('config.limite_mensagens_rotulo'),
          ajuda: t('config.limite_mensagens_ajuda'),
          min: 1,
          max: 50,
          unidade: t('config.unidade_mensagens'),
        },
        {
          chave: 'limiteJanelaDias',
          rotulo: t('config.limite_janela_rotulo'),
          ajuda: t('config.limite_janela_ajuda'),
          min: 1,
          max: 365,
          unidade: t('config.unidade_dias'),
        },
      ],
    },
    {
      titulo: t('config.seccao_perda_titulo'),
      explicacao: t('config.seccao_perda_explicacao'),
      campos: [
        {
          chave: 'factorRisco',
          rotulo: t('config.factor_risco_rotulo'),
          ajuda: t('config.factor_risco_ajuda'),
          min: 1,
          max: 10,
          passo: 0.5,
          unidade: t('config.unidade_x_habito'),
        },
        {
          chave: 'factorInactivo',
          rotulo: t('config.factor_inactivo_rotulo'),
          ajuda: t('config.factor_inactivo_ajuda'),
          min: 1,
          max: 20,
          passo: 0.5,
          unidade: t('config.unidade_x_habito'),
        },
        {
          chave: 'intervaloMinimoDias',
          rotulo: t('config.intervalo_minimo_rotulo'),
          ajuda: t('config.intervalo_minimo_ajuda'),
          min: 1,
          max: 90,
          unidade: t('config.unidade_dias'),
        },
      ],
    },
    {
      titulo: t('config.seccao_uma_compra_titulo'),
      explicacao: t('config.seccao_uma_compra_explicacao'),
      campos: [
        {
          chave: 'diasRiscoSemHabito',
          rotulo: t('config.dias_risco_sem_habito_rotulo'),
          ajuda: t('config.dias_risco_sem_habito_ajuda'),
          min: 7,
          max: 365,
          unidade: t('config.unidade_dias'),
        },
        {
          chave: 'diasInactivoSemHabito',
          rotulo: t('config.dias_inactivo_sem_habito_rotulo'),
          ajuda: t('config.dias_inactivo_sem_habito_ajuda'),
          min: 14,
          max: 730,
          unidade: t('config.unidade_dias'),
        },
      ],
    },
    {
      titulo: t('config.seccao_medicao_titulo'),
      explicacao: t('config.seccao_medicao_explicacao'),
      campos: [
        {
          chave: 'janelaConversaoDias',
          rotulo: t('config.janela_conversao_rotulo'),
          ajuda: t('config.janela_conversao_ajuda'),
          min: 1,
          max: 90,
          unidade: t('config.unidade_dias'),
        },
      ],
    },
    {
      titulo: t('config.seccao_mayra_titulo'),
      explicacao: t('config.seccao_mayra_explicacao'),
      campos: [
        {
          chave: 'supressaoEmRiscoDias',
          rotulo: t('config.supressao_em_risco_rotulo'),
          ajuda: t('config.supressao_em_risco_ajuda'),
          min: 1,
          max: 365,
          unidade: t('config.unidade_dias'),
        },
        {
          chave: 'supressaoInactivoDias',
          rotulo: t('config.supressao_inactivo_rotulo'),
          ajuda: t('config.supressao_inactivo_ajuda'),
          min: 1,
          max: 365,
          unidade: t('config.unidade_dias'),
        },
      ],
    },
  ];
}

/**
 * Os campos de fidelização, fora das secções porque a secção deles tem
 * interruptor e simulação próprios.
 */
function criarFidelizacao(t: TFunction<'crm'>): Campo[] {
  return [
    {
      chave: 'pontosPorMetical',
      rotulo: t('config.pontos_por_metical_rotulo'),
      ajuda: t('config.pontos_por_metical_ajuda'),
      min: 0,
      max: 1,
      passo: 0.001,
      unidade: t('config.unidade_pontos_mt'),
    },
    {
      chave: 'valorDoPonto',
      rotulo: t('config.valor_do_ponto_rotulo'),
      ajuda: t('config.valor_do_ponto_ajuda'),
      min: 0.01,
      max: 100,
      passo: 0.5,
      unidade: t('config.unidade_mt'),
    },
    {
      chave: 'minimoResgate',
      rotulo: t('config.minimo_resgate_rotulo'),
      ajuda: t('config.minimo_resgate_ajuda'),
      min: 1,
      max: 100000,
      unidade: t('config.unidade_pontos'),
    },
  ];
}

export function ConfiguracaoPanel() {
  const { t } = useTranslation('crm');
  const SECCOES = useMemo(() => criarSeccoes(t), [t]);
  const FIDELIZACAO = useMemo(() => criarFidelizacao(t), [t]);
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
        <p className="text-sm">{t('config.erro_carregar')}</p>
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
              {t('config.intro_titulo')}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {t('config.intro_aviso')}
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
            <RotateCcw size={14} /> {t('config.repor')}
          </button>
          <button
            onClick={guardar}
            disabled={!temAlteracoes || actualizar.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
          >
            <Save size={14} />
            {actualizar.isPending ? t('comum.a_guardar') : t('comum.guardar')}
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
                        title={t('config.valor_origem', { valor: OMISSAO[campo.chave] })}
                        className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700"
                      >
                        {t('config.alterado')}
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
              <h3 className="text-sm font-semibold text-slate-800">{t('config.fidelizacao_titulo')}</h3>
              <p className="mt-0.5 max-w-2xl text-xs text-slate-500">
                {t('config.fidelizacao_explicacao')}
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
              {form.fidelizacaoActiva ? t('config.activa') : t('config.desligada')}
            </button>
          </div>

          {!form.fidelizacaoActiva && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {t('config.aviso_desligada')}
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
                      title={t('config.valor_origem', { valor: OMISSAO[campo.chave] })}
                      className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700"
                    >
                      {t('config.alterado')}
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
                {t('config.simul_compra_de')} <strong>{t('config.simul_mil_mt')}</strong>{' '}
                {t('config.simul_cliente_ganha')}{' '}
                <strong className="tabular-nums">
                  {t('config.simul_pontos', { n: Math.floor(1000 * form.pontosPorMetical) })}
                </strong>
                {t('config.simul_que_valem')}{' '}
                <strong className="tabular-nums">
                  {t('config.simul_valor_mt', {
                    valor: (
                      Math.floor(1000 * form.pontosPorMetical) * form.valorDoPonto
                    ).toLocaleString(localeIntl(), { maximumFractionDigits: 2 }),
                  })}
                </strong>{' '}
                {t('config.simul_de_desconto', {
                  percentagem: custoPercentual.toLocaleString(localeIntl(), {
                    maximumFractionDigits: 2,
                  }),
                })}
              </p>
              <p className="mt-1 text-slate-500">
                {t('config.simul_resgate', {
                  minimo: form.minimoResgate,
                  valor:
                    meticaisAteResgatar === Infinity
                      ? '—'
                      : Math.ceil(meticaisAteResgatar).toLocaleString(localeIntl()),
                })}
              </p>
            </div>
          )}

          {custoPercentual > 20 && form.fidelizacaoActiva && (
            <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle size={14} className="mt-px shrink-0" />
              {t('config.aviso_custo_alto')}
            </p>
          )}
        </section>

        {/* Canais */}
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-800">{t('config.canais_titulo')}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {t('config.canais_explicacao')}
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
        {t('config.rodape')}
      </p>
    </div>
  );
}
