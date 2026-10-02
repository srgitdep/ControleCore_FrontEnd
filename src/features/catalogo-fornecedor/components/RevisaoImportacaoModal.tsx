import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Loader2,
  Check,
  EyeOff,
  AlertTriangle,
  Upload,
  Undo2,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { cn, formatMoeda } from '@/shared/utils';
import { catalogApi } from '@/features/produtos';
import { catalogoFornecedorApi } from '../api/catalogo.api';
import type { LinhaImportacao, EstadoLinha } from '../api/catalogo.api';

interface Props {
  importacaoId: string;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * A revisão de uma importação de catálogo, linha a linha.
 *
 * ## Este ecrã é o passo que dá sentido a toda a importação
 *
 * Sem ele, importar é aplicar às cegas. Com ele, vê-se o que vai acontecer **antes** de
 * acontecer — e o que a leitura não conseguiu decidir sozinha fica visível em vez de
 * passar em silêncio.
 *
 * ## O filtro começa nas linhas por rever
 *
 * É onde está o trabalho. As linhas prontas não precisam de atenção; as que têm erro não
 * se resolvem aqui — corrige-se o ficheiro e importa-se outra vez.
 */
export function RevisaoImportacaoModal({ importacaoId, onClose, onSuccess }: Props) {
  const { t } = useTranslation('catalogo');
  const queryClient = useQueryClient();
  const [filtro, setFiltro] = useState<EstadoLinha | 'TODAS'>('POR_REVER');
  const [aDecidir, setADecidir] = useState<LinhaImportacao | null>(null);
  const [aAplicar, setAAplicar] = useState(false);
  const [aReverter, setAReverter] = useState(false);
  const [motivoReversao, setMotivoReversao] = useState('');

  const { data: importacao, isLoading } = useQuery({
    queryKey: ['importacao', importacaoId],
    queryFn: () => catalogoFornecedorApi.obter(importacaoId),
  });

  const recarregar = () => {
    queryClient.invalidateQueries({ queryKey: ['importacao', importacaoId] });
    queryClient.invalidateQueries({ queryKey: ['importacoes'] });
  };

  if (isLoading || !importacao) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50">
        <Loader2 className="h-6 w-6 animate-spin text-white" />
      </div>
    );
  }

  const linhas = importacao.linhas ?? [];
  const visiveis = filtro === 'TODAS' ? linhas : linhas.filter((l) => l.estado === filtro);
  const prontas = linhas.filter((l) => l.estado === 'MAPEADA').length;
  const porRever = linhas.filter((l) => l.estado === 'POR_REVER').length;
  const emRevisao = importacao.estado === 'EM_REVISAO';

  const aplicar = async () => {
    setAAplicar(true);
    try {
      const r = await catalogoFornecedorApi.aplicar(importacaoId);
      toast.success(
        t('revisao.aplicada_resumo', {
          novos: r.mapeamentosCriados,
          actualizados: r.mapeamentosActualizados,
          precos: r.precosCriados,
        }),
      );
      if (r.aviso) toast(r.aviso, { icon: '⚠️', duration: 7000 });
      recarregar();
      onSuccess();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('revisao.erro_aplicar'));
    } finally {
      setAAplicar(false);
    }
  };

  const reverter = async () => {
    if (motivoReversao.trim().length < 5) {
      toast.error(t('revisao.motivo_obrigatorio'));
      return;
    }
    setAAplicar(true);
    try {
      const r = await catalogoFornecedorApi.reverter(importacaoId, motivoReversao.trim());
      toast.success(
        t('revisao.revertido_resumo', {
          apagados: r.precosApagados,
          restaurados: r.mapeamentosRestaurados,
          removidos: r.mapeamentosApagados,
        }),
      );
      recarregar();
      onSuccess();
      setAReverter(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('revisao.erro_reverter'));
    } finally {
      setAAplicar(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {importacao.ficheiroNome ?? t('revisao.titulo_defeito')}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {t('revisao.linhas_estado', {
                total: importacao.totalLinhas,
                estado: t(`estado_importacao_minuscula.${importacao.estado}`),
              })}
              {importacao.criadoPor && ` · ${importacao.criadoPor.name}`}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </header>

        <div className="border-b border-slate-100 px-5 py-3">
          <div className="grid grid-cols-3 gap-3">
            <Contador rotulo={t('revisao.contador_prontas')} valor={prontas} cor="emerald" />
            <Contador rotulo={t('revisao.contador_por_rever')} valor={porRever} cor="amber" />
            <Contador rotulo={t('revisao.contador_erro')} valor={importacao.linhasComErro} cor="rose" />
          </div>

          {/* Guardar o mapa de colunas é o que responde à primeira pergunta que alguém
              faz quando um preço aparece errado: que coluna é que ele leu como preço? */}
          {importacao.mapaColunas && (
            <p className="mt-3 text-xs text-slate-500">
              {t('revisao.colunas_lidas')}{' '}
              {Object.entries(importacao.mapaColunas)
                .map(([papel, indice]) =>
                  t('revisao.coluna_mapa', { papel, indice: Number(indice) + 1 }),
                )
                .join(' · ')}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 border-b border-slate-100 px-5 py-3">
          {(['POR_REVER', 'MAPEADA', 'ERRO', 'IGNORADA', 'APLICADA', 'TODAS'] as const).map(
            (f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  filtro === f
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
              >
                {f === 'TODAS' ? t('revisao.filtro_todas') : t(`estado_linha.${f}`)}
              </button>
            ),
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {visiveis.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              {filtro === 'POR_REVER' ? t('revisao.vazio_por_rever') : t('revisao.vazio_estado')}
            </p>
          ) : (
            <ul className="space-y-2">
              {visiveis.map((l) => (
                <li
                  key={l.id}
                  className={cn(
                    'rounded-lg border p-3',
                    l.estado === 'ERRO'
                      ? 'border-rose-200 bg-rose-50'
                      : l.estado === 'POR_REVER'
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-slate-200',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        <span className="mr-2 font-mono text-xs text-slate-400">
                          L{l.numeroLinha}
                        </span>
                        {l.descricao ?? l.referenciaFornecedor ?? t('revisao.sem_descricao')}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {l.referenciaFornecedor &&
                          `${t('revisao.ref', { valor: l.referenciaFornecedor })} · `}
                        {l.gtin && `${t('revisao.ean', { valor: l.gtin })} · `}
                        {l.precoUnitario != null ? formatMoeda(l.precoUnitario) : t('revisao.sem_preco')}
                        {l.unidadeFornecedor && ` / ${l.unidadeFornecedor}`}
                        {l.factorConversao && l.factorConversao !== 1 && (
                          <span className="text-slate-600">
                            {' '}
                            {t('revisao.factor_unidades', { factor: l.factorConversao })}
                          </span>
                        )}
                      </p>
                      {l.mensagem && (
                        <p className="mt-1.5 text-xs text-slate-600">{l.mensagem}</p>
                      )}
                      {l.metodo && l.confianca != null && (
                        <p className="mt-0.5 text-xs text-slate-400">
                          {t('revisao.metodo_confianca', {
                            metodo: t(`metodo.${l.metodo}`),
                            percentagem: (l.confianca * 100).toFixed(0),
                          })}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <EstadoLinhaBadge estado={l.estado} />
                      {emRevisao && l.estado === 'POR_REVER' && (
                        <button
                          onClick={() => setADecidir(l)}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
                        >
                          {t('revisao.decidir')}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="border-t border-slate-100 px-5 py-4">
          {aReverter && (
            <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
              <p className="text-xs text-rose-800">
                {t('revisao.aviso_reverter')}
              </p>
              <input
                value={motivoReversao}
                onChange={(e) => setMotivoReversao(e.target.value)}
                placeholder={t('revisao.placeholder_motivo')}
                className="mt-2 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm placeholder:text-rose-300 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {emRevisao && porRever > 0 && (
                <>
                  <strong>{porRever}</strong>{' '}
                  {t('revisao.por_rever_nao_aplicadas', { count: porRever })}
                </>
              )}
            </p>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                {t('revisao.fechar')}
              </button>

              {importacao.estado === 'APLICADA' &&
                (aReverter ? (
                  <button
                    onClick={reverter}
                    disabled={aAplicar}
                    className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    {aAplicar && <Loader2 size={14} className="animate-spin" />}
                    {t('revisao.confirmar_reversao')}
                  </button>
                ) : (
                  <button
                    onClick={() => setAReverter(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    <Undo2 size={14} /> {t('revisao.reverter')}
                  </button>
                ))}

              {emRevisao && (
                <button
                  onClick={aplicar}
                  disabled={aAplicar || prontas === 0}
                  title={prontas === 0 ? t('revisao.nenhuma_pronta') : undefined}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {aAplicar ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )}
                  {t('revisao.aplicar', { count: prontas })}
                </button>
              )}
            </div>
          </div>
        </footer>
      </div>

      {aDecidir && (
        <DecidirLinhaModal
          importacaoId={importacaoId}
          linha={aDecidir}
          onClose={() => setADecidir(null)}
          onSuccess={recarregar}
        />
      )}
    </div>
  );
}

function Contador({
  rotulo,
  valor,
  cor,
}: {
  rotulo: string;
  valor: number;
  cor: 'emerald' | 'amber' | 'rose';
}) {
  const classes = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    rose: 'border-rose-200 bg-rose-50 text-rose-900',
  };

  return (
    <div className={cn('rounded-lg border p-2.5', classes[cor])}>
      <p className="text-xs opacity-80">{rotulo}</p>
      <p className="text-lg font-semibold">{valor}</p>
    </div>
  );
}

function EstadoLinhaBadge({ estado }: { estado: EstadoLinha }) {
  const { t } = useTranslation('catalogo');
  const cores: Record<EstadoLinha, string> = {
    MAPEADA: 'bg-emerald-100 text-emerald-700',
    POR_REVER: 'bg-amber-100 text-amber-800',
    ERRO: 'bg-rose-100 text-rose-700',
    APLICADA: 'bg-blue-100 text-blue-700',
    IGNORADA: 'bg-slate-100 text-slate-500',
  };

  return (
    <span
      className={cn(
        'whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        cores[estado],
      )}
    >
      {t(`estado_linha.${estado}`)}
    </span>
  );
}

/**
 * Escolher o produto de uma linha, ou descartá-la.
 *
 * A escolha grava-se como manual e sem confiança: uma decisão de pessoa não tem confiança
 * estatística, tem um autor.
 */
function DecidirLinhaModal({
  importacaoId,
  linha,
  onClose,
  onSuccess,
}: {
  importacaoId: string;
  linha: LinhaImportacao;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation('catalogo');
  const [pesquisa, setPesquisa] = useState(linha.descricao ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const { data: produtos = [], isFetching } = useQuery({
    queryKey: ['produtos-para-mapear', pesquisa],
    queryFn: () => catalogApi.getProducts({ search: pesquisa, limit: 20 }),
    enabled: pesquisa.trim().length >= 2,
    select: (r: any) => r?.data ?? r ?? [],
  });

  const decidir = async (produtoId?: string) => {
    setIsSaving(true);
    try {
      await catalogoFornecedorApi.decidirLinha(importacaoId, linha.id, {
        produtoId,
        ignorar: !produtoId,
      });
      toast.success(produtoId ? t('decidir.linha_mapeada') : t('decidir.linha_descartada'));
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('decidir.erro'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl">
        <header className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900">
                {t('decidir.titulo', { numero: linha.numeroLinha })}
              </h2>
              <p className="mt-0.5 text-sm text-slate-600">{linha.descricao}</p>
            </div>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
          {linha.mensagem && (
            <p className="mt-2 flex gap-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              {linha.mensagem}
            </p>
          )}
        </header>

        <div className="border-b border-slate-100 px-5 py-3">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder={t('decidir.procurar')}
              autoFocus
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {isFetching ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : produtos.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              {pesquisa.trim().length < 2
                ? t('decidir.escrever_duas_letras')
                : t('decidir.nenhum_produto')}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {produtos.map((p: any) => (
                <li key={p.id}>
                  <button
                    onClick={() => decidir(p.id)}
                    disabled={isSaving}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">{p.nome}</p>
                      {(p.sku || p.codigoBarras) && (
                        <p className="text-xs text-slate-500">
                          {p.sku && t('decidir.sku', { valor: p.sku })}
                          {p.sku && p.codigoBarras && ' · '}
                          {p.codigoBarras}
                        </p>
                      )}
                    </div>
                    <Check size={16} className="shrink-0 text-slate-300" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="flex justify-between gap-2 border-t border-slate-100 px-5 py-4">
          <button
            onClick={() => decidir(undefined)}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <EyeOff size={14} /> {t('decidir.descartar')}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            {t('decidir.cancelar')}
          </button>
        </footer>
      </div>
    </div>
  );
}
