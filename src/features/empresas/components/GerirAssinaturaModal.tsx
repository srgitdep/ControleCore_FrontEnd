import { useMemo, useState } from 'react';
import { AlertTriangle, Loader2, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { localeIntl } from '@/i18n';
import { Button } from '@/shared/ui';
import { mensagemDeErro } from '@/shared/utils';
import { useModulos } from '@/features/modulos';
import { useAssinatura, useGerirAssinatura } from '../hooks/useAssinatura';
import {
  METODOS_PAGAMENTO,
  type AlterarAssinaturaPayload,
  type AssinaturaGerida,
  type CicloAssinatura,
  type EstadoManual,
  type MetodoPagamento,
  type SituacaoAssinatura,
} from '../types/assinatura';

const CICLOS: CicloAssinatura[] = ['MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'];
const ESTADOS_MANUAIS: EstadoManual[] = ['ATIVA', 'SUSPENSA', 'CANCELADA'];

const campo =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none';
const etiqueta = 'mb-1 block text-xs font-medium text-slate-600';

/** `YYYY-MM-DD` de um ISO, para um `<input type="date">`. */
const paraData = (iso: string | null) => (iso ? iso.slice(0, 10) : '');
/** O fim do dia escolhido, na hora local: «acaba a 30» quer dizer que o dia 30 ainda conta. */
const fimDoDia = (data: string) => new Date(`${data}T23:59:59`).toISOString();

/** Muda sempre que o servidor devolve a assinatura alterada. */
const versao = (a: AssinaturaGerida) =>
  [a.id, a.estado, a.ciclo, a.dataFim, a.trialAte, a.valorTotal, a.desconto, a.renovacaoAutomatica, a.pagamentos.length,
    a.modulos.map((m) => `${m.moduloId}:${m.precoAcordado}`).join(',')].join('|');

interface GerirAssinaturaModalProps {
  empresaId: string;
  onClose: () => void;
}

/**
 * A assinatura de uma empresa, gerida pela plataforma (plano §4.15, S2a).
 *
 * Um formulário só para as alterações, com um motivo só: módulos, preço, datas e estado
 * mudam muitas vezes juntos («passou a anual com desconto e reactivámos»), e o motivo é o
 * mesmo. Os pagamentos são à parte porque são um registo, não uma alteração.
 *
 * A expiração automática ainda não está ligada: a «situação» diz o que **aconteceria** se
 * as datas contassem, para quem decide saber o que está em jogo.
 */
export function GerirAssinaturaModal({ empresaId, onClose }: GerirAssinaturaModalProps) {
  const { t } = useTranslation('empresas');
  const { data, isLoading, isError, error, refetch } = useAssinatura(empresaId);

  const moeda = (valor: string | number) =>
    Number(valor).toLocaleString(localeIntl(), {
      style: 'currency',
      currency: data?.empresa.moeda || 'MZN',
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-800">{t('assinatura.titulo')}</h2>
            <p className="truncate text-xs text-slate-500">{data?.empresa.nome}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('acoes.fechar')}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto bg-slate-50/50 p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-rose-100 bg-rose-50 p-6 text-center">
              <p className="text-sm text-rose-700">{mensagemDeErro(error, t('assinatura.erro_carregar'))}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                {t('assinatura.tentar_novamente')}
              </Button>
            </div>
          ) : !data?.assinatura ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              {t('assinatura.sem_assinatura')}
            </p>
          ) : (
            <>
              <Resumo
                assinatura={data.assinatura}
                fimDoAcesso={data.fimDoAcesso}
                situacao={data.situacao}
                moeda={moeda}
              />
              {/* `key` com a versão da assinatura: os campos nascem dela, e sem remontar ficavam
                  com os valores de antes de um pagamento estender a data — o «Guardar»
                  seguinte repunha a data antiga sem ninguém ter pedido. */}
              <FormularioAlterar key={versao(data.assinatura)} empresaId={empresaId} assinatura={data.assinatura} />
              <Pagamentos key={`p-${versao(data.assinatura)}`} empresaId={empresaId} assinatura={data.assinatura} moeda={moeda} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Resumo({
  assinatura: a,
  fimDoAcesso,
  situacao,
  moeda,
}: {
  assinatura: AssinaturaGerida;
  fimDoAcesso: string | null;
  situacao: SituacaoAssinatura | null;
  moeda: (v: string | number) => string;
}) {
  const { t } = useTranslation('empresas');
  const data = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(localeIntl()) : '—');

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-slate-900 px-2 py-1 text-xs font-bold text-white">
          {t(`assinatura.estado.${a.estado}`)}
        </span>
        {a.modulos.map((m) => (
          <span key={m.moduloId} className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-800">
            {m.modulo.nome}
          </span>
        ))}
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
        <Item rotulo={t('assinatura.ciclo')} valor={t(`assinatura.ciclos.${a.ciclo}`)} />
        <Item rotulo={t('assinatura.valor')} valor={moeda(a.valorTotal)} />
        <Item rotulo={t('assinatura.desconto')} valor={`${Number(a.desconto)}%`} />
        <Item rotulo={t('assinatura.inicio')} valor={data(a.dataInicio)} />
        <Item rotulo={t('assinatura.fim')} valor={data(a.dataFim)} />
        {a.estado === 'TRIAL' && <Item rotulo={t('assinatura.trial_ate')} valor={data(a.trialAte ?? a.dataFim)} />}
      </dl>

      {a.estado === 'SUSPENSA' && a.motivoSuspensao && (
        <p className="rounded-lg bg-slate-100 p-3 text-xs text-slate-600">
          {t('assinatura.suspensa_em', { data: data(a.suspensaEm), motivo: a.motivoSuspensao })}
        </p>
      )}

      {situacao && situacao !== 'EM_DIA' && (
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {t(`assinatura.situacao.${situacao}`, { data: data(fimDoAcesso) })}
        </p>
      )}
    </section>
  );
}

function Item({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{rotulo}</dt>
      <dd className="font-medium text-slate-800">{valor}</dd>
    </div>
  );
}

function FormularioAlterar({ empresaId, assinatura: a }: { empresaId: string; assinatura: AssinaturaGerida }) {
  const { t } = useTranslation('empresas');
  const { data: catalogo, isLoading: aCarregarCatalogo } = useModulos();
  const { alterar } = useGerirAssinatura(empresaId);

  // O estado inicial é a assinatura como está: o que se envia é a diferença.
  const precosIniciais = useMemo(
    () => Object.fromEntries(a.modulos.map((m) => [m.moduloId, String(Number(m.precoAcordado))])),
    [a.modulos],
  );
  const [precos, setPrecos] = useState<Record<string, string>>(precosIniciais);
  const [ciclo, setCiclo] = useState<CicloAssinatura>(a.ciclo);
  const [valor, setValor] = useState('');
  const [desconto, setDesconto] = useState(String(Number(a.desconto)));
  const [dataFim, setDataFim] = useState(paraData(a.dataFim));
  const [trialAte, setTrialAte] = useState(paraData(a.trialAte ?? (a.estado === 'TRIAL' ? a.dataFim : null)));
  const [renovacao, setRenovacao] = useState(a.renovacaoAutomatica);
  const [estado, setEstado] = useState<EstadoManual | ''>('');
  const [motivo, setMotivo] = useState('');

  // Os módulos que se podem escolher: os activos do catálogo, mais os que a empresa já tem
  // (mesmo desactivados no catálogo — retirá-los é uma escolha, não um efeito secundário).
  const opcoes = useMemo(() => {
    const doCatalogo = (catalogo ?? []).filter((m) => m.isAtivo).map((m) => ({ id: m.id, nome: m.nome, preco: Number(m.precoMensal) }));
    const jaTem = a.modulos
      .filter((m) => !doCatalogo.some((c) => c.id === m.moduloId))
      .map((m) => ({ id: m.moduloId, nome: m.modulo.nome, preco: Number(m.modulo.precoMensal) }));
    return [...doCatalogo, ...jaTem];
  }, [catalogo, a.modulos]);

  const modulosMudaram =
    Object.keys(precos).length !== Object.keys(precosIniciais).length ||
    Object.entries(precos).some(([id, p]) => precosIniciais[id] !== p);

  const somaDosPrecos = Object.values(precos).reduce((s, p) => s + (Number(p) || 0), 0);

  const montarPayload = (): AlterarAssinaturaPayload => {
    const p: AlterarAssinaturaPayload = { motivo: motivo.trim() };
    if (modulosMudaram)
      p.modulos = Object.entries(precos).map(([moduloId, preco]) => ({ moduloId, precoAcordado: Number(preco) || 0 }));
    if (ciclo !== a.ciclo) p.ciclo = ciclo;
    if (valor.trim() !== '') p.valorTotal = Number(valor);
    if (Number(desconto) !== Number(a.desconto)) p.desconto = Number(desconto);
    if (dataFim && dataFim !== paraData(a.dataFim)) p.dataFim = fimDoDia(dataFim);
    if (a.estado === 'TRIAL' && trialAte && trialAte !== paraData(a.trialAte ?? a.dataFim)) p.trialAte = fimDoDia(trialAte);
    if (renovacao !== a.renovacaoAutomatica) p.renovacaoAutomatica = renovacao;
    if (estado) p.estado = estado;
    return p;
  };

  const payload = montarPayload();
  const temAlteracoes = Object.keys(payload).length > 1;

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    alterar.mutate(payload, {
      onSuccess: () => {
        toast.success(t('assinatura.alterada'));
        setMotivo('');
        setValor('');
        setEstado('');
      },
      onError: (erro) => toast.error(mensagemDeErro(erro, t('assinatura.erro_alterar'))),
    });
  };

  const alternarModulo = (id: string, preco: number) =>
    setPrecos((actual) => {
      const novo = { ...actual };
      if (id in novo) delete novo[id];
      else novo[id] = String(preco);
      return novo;
    });

  return (
    <form onSubmit={guardar} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800">{t('assinatura.alterar')}</h3>

      <fieldset>
        <legend className={etiqueta}>{t('assinatura.modulos')}</legend>
        {aCarregarCatalogo ? (
          <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
        ) : (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {opcoes.map((m) => {
              const escolhido = m.id in precos;
              return (
                <li key={m.id} className="flex items-center gap-3 px-3 py-2">
                  <input
                    id={`mod-${m.id}`}
                    type="checkbox"
                    checked={escolhido}
                    onChange={() => alternarModulo(m.id, m.preco)}
                    className="h-4 w-4"
                  />
                  <label htmlFor={`mod-${m.id}`} className="min-w-0 flex-1 truncate text-sm text-slate-700">
                    {m.nome}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    disabled={!escolhido}
                    aria-label={t('assinatura.preco_de', { nome: m.nome })}
                    value={escolhido ? precos[m.id] : ''}
                    placeholder={String(m.preco)}
                    onChange={(e) => setPrecos((p) => ({ ...p, [m.id]: e.target.value }))}
                    className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm disabled:bg-slate-50"
                  />
                </li>
              );
            })}
          </ul>
        )}
        {modulosMudaram && <p className="mt-1 text-xs text-amber-700">{t('assinatura.aviso_modulos')}</p>}
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="a-ciclo" className={etiqueta}>{t('assinatura.ciclo')}</label>
          <select id="a-ciclo" value={ciclo} onChange={(e) => setCiclo(e.target.value as CicloAssinatura)} className={campo}>
            {CICLOS.map((c) => (
              <option key={c} value={c}>{t(`assinatura.ciclos.${c}`)}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="a-valor" className={etiqueta}>{t('assinatura.valor')}</label>
          <input
            id="a-valor"
            type="number"
            min={0}
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={modulosMudaram ? String(somaDosPrecos) : String(Number(a.valorTotal))}
            className={campo}
          />
        </div>
        <div>
          <label htmlFor="a-desconto" className={etiqueta}>{t('assinatura.desconto')}</label>
          <input
            id="a-desconto"
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={desconto}
            onChange={(e) => setDesconto(e.target.value)}
            className={campo}
          />
        </div>
        <div>
          <label htmlFor="a-fim" className={etiqueta}>{t('assinatura.fim')}</label>
          <input id="a-fim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className={campo} />
        </div>
        {a.estado === 'TRIAL' && (
          <div>
            <label htmlFor="a-trial" className={etiqueta}>{t('assinatura.trial_ate')}</label>
            <input id="a-trial" type="date" value={trialAte} onChange={(e) => setTrialAte(e.target.value)} className={campo} />
          </div>
        )}
        <div>
          <label htmlFor="a-estado" className={etiqueta}>{t('assinatura.mudar_estado')}</label>
          <select id="a-estado" value={estado} onChange={(e) => setEstado(e.target.value as EstadoManual | '')} className={campo}>
            <option value="">{t('assinatura.manter_estado')}</option>
            {ESTADOS_MANUAIS.filter((s) => s !== a.estado).map((s) => (
              <option key={s} value={s}>{t(`assinatura.estado.${s}`)}</option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={renovacao} onChange={(e) => setRenovacao(e.target.checked)} className="h-4 w-4" />
        {t('assinatura.renovacao_automatica')}
      </label>

      {estado === 'SUSPENSA' && (
        <p className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {t('assinatura.aviso_suspender')}
        </p>
      )}

      <div>
        <label htmlFor="a-motivo" className={etiqueta}>{t('assinatura.motivo')}</label>
        <textarea
          id="a-motivo"
          rows={2}
          maxLength={500}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder={t('assinatura.motivo_dica')}
          className={campo}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!temAlteracoes || !motivo.trim() || alterar.isPending}>
          {alterar.isPending && <Loader2 size={16} className="animate-spin" />}
          {t('assinatura.guardar')}
        </Button>
      </div>
    </form>
  );
}

function Pagamentos({
  empresaId,
  assinatura: a,
  moeda,
}: {
  empresaId: string;
  assinatura: AssinaturaGerida;
  moeda: (v: string | number) => string;
}) {
  const { t } = useTranslation('empresas');
  const { pagar } = useGerirAssinatura(empresaId);
  const [aRegistar, setARegistar] = useState(false);
  const hoje = new Date().toISOString().slice(0, 10);
  const [valor, setValor] = useState(String(Number(a.valorTotal)));
  const [metodo, setMetodo] = useState<MetodoPagamento>('TRANSFERENCIA');
  const [referencia, setReferencia] = useState('');
  const [dataPagamento, setDataPagamento] = useState(hoje);
  const [observacoes, setObservacoes] = useState('');
  const [estender, setEstender] = useState(true);
  const cancelada = a.estado === 'CANCELADA';

  const registar = (e: React.FormEvent) => {
    e.preventDefault();
    pagar.mutate(
      {
        valor: Number(valor),
        metodoPagamento: metodo,
        referencia: referencia.trim() || undefined,
        // Meio-dia local: o dia escolhido, sem o fuso o empurrar para o dia anterior em UTC.
        dataPagamento: new Date(`${dataPagamento}T12:00:00`).toISOString(),
        observacoes: observacoes.trim() || undefined,
        estenderAssinatura: estender,
      },
      {
        onSuccess: () => {
          toast.success(t('assinatura.pagamento_registado'));
          setARegistar(false);
          setReferencia('');
          setObservacoes('');
        },
        onError: (erro) => toast.error(mensagemDeErro(erro, t('assinatura.erro_pagamento'))),
      },
    );
  };

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-800">{t('assinatura.pagamentos')}</h3>
        {!aRegistar && (
          <Button size="sm" variant="outline" onClick={() => setARegistar(true)} disabled={cancelada}>
            <Plus size={14} />
            {t('assinatura.registar_pagamento')}
          </Button>
        )}
      </div>
      {cancelada && <p className="text-xs text-slate-500">{t('assinatura.cancelada_sem_pagamentos')}</p>}

      {aRegistar && (
        <form onSubmit={registar} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="p-valor" className={etiqueta}>{t('assinatura.valor_pago')}</label>
              <input id="p-valor" type="number" min={0.01} step="0.01" required value={valor} onChange={(e) => setValor(e.target.value)} className={campo} />
            </div>
            <div>
              <label htmlFor="p-metodo" className={etiqueta}>{t('assinatura.metodo')}</label>
              <select id="p-metodo" value={metodo} onChange={(e) => setMetodo(e.target.value as MetodoPagamento)} className={campo}>
                {METODOS_PAGAMENTO.map((m) => (
                  <option key={m} value={m}>{t(`assinatura.metodos.${m}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="p-data" className={etiqueta}>{t('assinatura.data_pagamento')}</label>
              <input id="p-data" type="date" max={hoje} required value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)} className={campo} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="p-ref" className={etiqueta}>{t('assinatura.referencia')}</label>
              <input id="p-ref" maxLength={120} value={referencia} onChange={(e) => setReferencia(e.target.value)} className={campo} />
            </div>
            <div>
              <label htmlFor="p-obs" className={etiqueta}>{t('assinatura.observacoes')}</label>
              <input id="p-obs" maxLength={500} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className={campo} />
            </div>
          </div>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={estender} onChange={(e) => setEstender(e.target.checked)} className="mt-0.5 h-4 w-4" />
            <span>
              {t('assinatura.estender', { ciclo: t(`assinatura.ciclos.${a.ciclo}`) })}
              {a.estado === 'SUSPENSA' && estender && (
                <span className="block text-xs text-slate-500">{t('assinatura.suspensa_mantem')}</span>
              )}
            </span>
          </label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setARegistar(false)} disabled={pagar.isPending}>
              {t('acoes.cancelar')}
            </Button>
            <Button type="submit" disabled={!(Number(valor) > 0) || pagar.isPending}>
              {pagar.isPending && <Loader2 size={16} className="animate-spin" />}
              {t('assinatura.registar')}
            </Button>
          </div>
        </form>
      )}

      {a.pagamentos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400">
          {t('assinatura.sem_pagamentos')}
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {a.pagamentos.map((p) => (
            <li key={p.id} className="flex flex-col gap-1 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium text-slate-800">{moeda(p.valor)}</p>
                <p className="truncate text-xs text-slate-500">
                  {t(`assinatura.metodos.${p.metodoPagamento}`, { defaultValue: p.metodoPagamento })}
                  {p.referencia ? ` · ${p.referencia}` : ''}
                </p>
              </div>
              <span className="text-xs text-slate-500">
                {p.dataPagamento ? new Date(p.dataPagamento).toLocaleDateString(localeIntl()) : '—'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
