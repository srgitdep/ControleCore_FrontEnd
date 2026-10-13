import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, Loader2, Scale, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDebounce } from '@/shared/hooks';
import { cn, formatMoeda, mensagemDeErro } from '@/shared/utils';
import {
  comparacaoApi,
  CRITERIOS,
  PESOS_PADRAO,
  type LinhaParaComparar,
  type MarcaComparacao,
  type PesosComparacao,
  type ResultadoDoFornecedor,
} from '../api/comparacao.api';
import { percentagemDoPeso, pesosIguais, pesosValidos } from '../domain/comparacao';

/** Marcas que explicam porque um fornecedor está fora da classificação (a razão vai em destaque). */
const MARCAS_DE_EXCLUSAO: MarcaComparacao[] = ['NAO_COMPRAVEL', 'LINHAS_EM_FALTA', 'MOEDA_NAO_COMPARAVEL'];

const COR_DA_MARCA: Record<MarcaComparacao, string> = {
  NAO_COMPRAVEL: 'bg-slate-200 text-slate-700',
  LINHAS_EM_FALTA: 'bg-amber-100 text-amber-800',
  MOEDA_NAO_COMPARAVEL: 'bg-amber-100 text-amber-800',
  DADOS_INSUFICIENTES: 'bg-sky-100 text-sky-800',
  QUANTIDADE_AJUSTADA: 'bg-violet-100 text-violet-800',
  PRECO_ANTIGO: 'bg-orange-100 text-orange-800',
};

/** Os estados em que não se compra; cada um tem o seu texto em `comparacao.estado`. */
type ESTADO_NAO_COMPRAVEL = 'EM_CADASTRO' | 'EM_ANALISE' | 'SUSPENSO' | 'BLOQUEADO' | 'ENCERRADA';

const valorOuTraco = (v: number | null, sufixo = '') => (v === null ? '—' : `${v}${sufixo}`);

/**
 * A comparação de fornecedores dentro do «Novo pedido de compra» (plano §4.11).
 *
 * Compara **para as linhas que estão no pedido**: o melhor fornecedor depende do que se compra e em que quantidade.
 * É uma ajuda — escolher outro que não o primeiro é livre. Os pesos movem-se aqui sem gravar nada (só mudam a
 * ordem); «guardar como padrão» é um passo à parte. O cálculo é do servidor, a mesma conta para toda a gente.
 */
export function ComparacaoFornecedores({
  linhas,
  nomes,
  fornecedorId,
  aoUsar,
}: {
  linhas: LinhaParaComparar[];
  /** `produtoId → nome`, para dizer de que produto é um ajuste de quantidade. */
  nomes: Record<string, string>;
  fornecedorId: string;
  aoUsar: (fornecedorId: string) => void;
}) {
  const { t } = useTranslation('compras');
  const queryClient = useQueryClient();
  const [aberto, setAberto] = useState(false);

  const criterios = useQuery({
    queryKey: ['compras', 'criterios-comparacao'],
    queryFn: () => comparacaoApi.obterCriterios(),
    enabled: aberto,
    staleTime: 60_000,
  });
  const padraoDaEmpresa = criterios.data ?? PESOS_PADRAO;

  // Os pesos «ao vivo». `null` = ainda não mexeu: vale o padrão da empresa, mesmo que chegue depois.
  const [alterados, setAlterados] = useState<PesosComparacao | null>(null);
  const pesos = alterados ?? padraoDaEmpresa;
  const pesosAdiados = useDebounce(pesos, 400);

  // A chave inclui as linhas: acrescentar um produto ou mudar a quantidade recalcula.
  const chaveDasLinhas = useMemo(() => JSON.stringify([...linhas].sort((a, b) => a.produtoId.localeCompare(b.produtoId))), [linhas]);
  const pode = aberto && linhas.length > 0 && pesosValidos(pesosAdiados);

  const comparacao = useQuery({
    queryKey: ['compras', 'comparacao-fornecedores', chaveDasLinhas, pesosAdiados],
    queryFn: () => comparacaoApi.comparar(linhas, pesosAdiados),
    enabled: pode,
    placeholderData: (anterior) => anterior,
    staleTime: 30_000,
  });

  const guardar = useMutation({
    mutationFn: () => comparacaoApi.guardarCriterios(pesos),
    onSuccess: (guardados) => {
      queryClient.setQueryData(['compras', 'criterios-comparacao'], guardados);
      setAlterados(null);
      toast.success(t('comparacao.pesos_guardados'));
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('comparacao.erro_guardar'))),
  });

  // Quando as linhas esvaziam, nada a comparar: volta ao padrão para a próxima abertura.
  useEffect(() => {
    if (linhas.length === 0) setAlterados(null);
  }, [linhas.length]);

  const mudou = alterados !== null && !pesosIguais(alterados, padraoDaEmpresa);
  const resultado = comparacao.data;

  return (
    <section className="rounded-xl border border-slate-200">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Scale size={16} className="text-indigo-600" />
          {t('comparacao.titulo')}
        </span>
        <span className="text-xs font-medium text-indigo-600">{aberto ? t('comparacao.esconder') : t('comparacao.mostrar')}</span>
      </button>

      {aberto && (
        <div className="space-y-4 border-t border-slate-100 p-4">
          {linhas.length === 0 ? (
            <p className="text-sm text-slate-500">{t('comparacao.sem_linhas')}</p>
          ) : (
            <>
              <p className="text-xs text-slate-500">{t('comparacao.ajuda')}</p>

              {/* Os cursores: recalculam, não gravam. */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {CRITERIOS.map((c) => (
                  <label key={c} className="block">
                    <span className="flex items-center justify-between text-xs font-medium text-slate-700">
                      {t(`comparacao.criterio.${c}`)}
                      <span className="tabular-nums text-slate-500">{percentagemDoPeso(pesos, c)} %</span>
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={pesos[c]}
                      onChange={(e) => setAlterados({ ...pesos, [c]: Number(e.target.value) })}
                      className="mt-1 w-full accent-indigo-600"
                      aria-label={t(`comparacao.criterio.${c}`)}
                    />
                  </label>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!pesosValidos(pesos) && <p className="text-xs font-medium text-red-600">{t('comparacao.pesos_invalidos')}</p>}
                <button
                  type="button"
                  disabled={!mudou}
                  onClick={() => setAlterados(null)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  {t('comparacao.repor_pesos')}
                </button>
                <button
                  type="button"
                  disabled={!mudou || !pesosValidos(pesos) || guardar.isPending}
                  onClick={() => guardar.mutate()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-40"
                >
                  {guardar.isPending && <Loader2 size={12} className="animate-spin" />}
                  {t('comparacao.guardar_pesos')}
                </button>
              </div>

              {comparacao.isLoading ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
                  ))}
                </div>
              ) : comparacao.isError ? (
                <p className="flex flex-wrap items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  <AlertTriangle size={15} />
                  {mensagemDeErro(comparacao.error, t('comparacao.erro'))}
                  <button type="button" onClick={() => void comparacao.refetch()} className="font-semibold underline">
                    {t('comparacao.tentar_outra_vez')}
                  </button>
                </p>
              ) : !resultado || resultado.fornecedores.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  {t('comparacao.sem_fornecedores')}
                </p>
              ) : (
                <>
                  {resultado.classificados < 2 && <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{t('comparacao.sem_com_quem_comparar')}</p>}

                  <div className={cn('overflow-x-auto rounded-lg border border-slate-200', comparacao.isFetching && 'opacity-60')}>
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-3 py-2">#</th>
                          <th className="px-3 py-2">{t('comparacao.col.fornecedor')}</th>
                          <th className="px-3 py-2 text-right">{t('comparacao.col.total')}</th>
                          <th className="px-3 py-2 text-right">{t('comparacao.col.prazo')}</th>
                          <th className="px-3 py-2 text-right">{t('comparacao.col.pontualidade')}</th>
                          <th className="px-3 py-2 text-right">{t('comparacao.col.cumprimento')}</th>
                          <th className="px-3 py-2 text-right">{t('comparacao.col.credito')}</th>
                          <th className="px-3 py-2 text-right">{t('comparacao.col.pontuacao')}</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {resultado.fornecedores.map((f) => (
                          <LinhaDoFornecedor key={f.fornecedorId} f={f} nomes={nomes} escolhido={f.fornecedorId === fornecedorId} aoUsar={aoUsar} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

function LinhaDoFornecedor({
  f,
  nomes,
  escolhido,
  aoUsar,
}: {
  f: ResultadoDoFornecedor;
  nomes: Record<string, string>;
  escolhido: boolean;
  aoUsar: (id: string) => void;
}) {
  const { t } = useTranslation('compras');
  const naoCompravel = f.marcas.includes('NAO_COMPRAVEL');
  const exclusao = f.marcas.filter((m) => MARCAS_DE_EXCLUSAO.includes(m));
  const outras = f.marcas.filter((m) => !MARCAS_DE_EXCLUSAO.includes(m));

  return (
    <>
      <tr className={cn(escolhido && 'bg-indigo-50/60', f.posicao === null && 'text-slate-500')}>
        <td className="px-3 py-2.5 font-semibold tabular-nums">{f.posicao ?? '—'}</td>
        <td className="px-3 py-2.5">
          <p className="flex flex-wrap items-center gap-1.5 font-medium text-slate-900">
            {f.nome}
            {f.preferencial && (
              <span title={t('comparacao.preferencial')} className="inline-flex items-center text-amber-500">
                <Star size={13} fill="currentColor" />
              </span>
            )}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {[...exclusao, ...outras].map((m) => (
              <span key={m} className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', COR_DA_MARCA[m])}>
                {m === 'LINHAS_EM_FALTA'
                  ? t('comparacao.marca.LINHAS_EM_FALTA', { cobre: f.linhasCobertas, total: f.linhasTotal })
                  : m === 'NAO_COMPRAVEL'
                    ? t(`comparacao.estado.${f.estadoRelacao as ESTADO_NAO_COMPRAVEL}`)
                    : m === 'PRECO_ANTIGO'
                      ? t('comparacao.marca.PRECO_ANTIGO', { dias: f.diasPrecoMaisAntigo ?? 0 })
                      : t(`comparacao.marca.${m}`)}
              </span>
            ))}
          </div>
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums">{f.totalPedido === null ? '—' : formatMoeda(f.totalPedido)}</td>
        <td className="px-3 py-2.5 text-right tabular-nums">{valorOuTraco(f.prazoMedioDias, ` ${t('comparacao.dias')}`)}</td>
        <td className="px-3 py-2.5 text-right tabular-nums">{valorOuTraco(f.pontualidadePercent, ' %')}</td>
        <td className="px-3 py-2.5 text-right tabular-nums">{valorOuTraco(f.cumprimentoPercent, ' %')}</td>
        <td className="px-3 py-2.5 text-right tabular-nums">{f.diasCredito} {t('comparacao.dias')}</td>
        <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">{valorOuTraco(f.pontuacaoTotal)}</td>
        <td className="px-3 py-2.5 text-right">
          <button
            type="button"
            disabled={naoCompravel}
            onClick={() => aoUsar(f.fornecedorId)}
            className={cn(
              'inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold disabled:opacity-40',
              escolhido ? 'bg-indigo-600 text-white' : 'border border-slate-300 text-slate-700 hover:bg-slate-50',
            )}
          >
            {escolhido && <Check size={12} />}
            {escolhido ? t('comparacao.escolhido') : t('comparacao.usar')}
          </button>
        </td>
      </tr>
      {f.ajustes.length > 0 && (
        <tr className="bg-violet-50/40">
          <td />
          <td colSpan={8} className="px-3 pb-2.5 text-xs text-violet-800">
            {f.ajustes.map((a) => (
              <p key={a.produtoId}>
                <span className="font-semibold">{nomes[a.produtoId] ?? a.produtoId}:</span> {t('comparacao.ajuste', { de: a.de, para: a.para })} — {a.motivo}
              </p>
            ))}
          </td>
        </tr>
      )}
    </>
  );
}
