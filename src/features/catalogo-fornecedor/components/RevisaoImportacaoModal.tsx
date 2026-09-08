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
import { cn } from '@/shared/utils';
import { catalogApi } from '@/features/produtos';
import {
  catalogoFornecedorApi,
  ROTULO_ESTADO_LINHA,
  ROTULO_METODO,
} from '../api/catalogo.api';
import type { LinhaImportacao, EstadoLinha } from '../api/catalogo.api';

interface Props {
  importacaoId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const mt = (v: number) =>
  `${v.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;

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
        `${r.mapeamentosCriados} artigos novos, ${r.mapeamentosActualizados} actualizados, ` +
          `${r.precosCriados} preços.`,
      );
      if (r.aviso) toast(r.aviso, { icon: '⚠️', duration: 7000 });
      recarregar();
      onSuccess();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao aplicar.');
    } finally {
      setAAplicar(false);
    }
  };

  const reverter = async () => {
    if (motivoReversao.trim().length < 5) {
      toast.error('A reversão exige um motivo.');
      return;
    }
    setAAplicar(true);
    try {
      const r = await catalogoFornecedorApi.reverter(importacaoId, motivoReversao.trim());
      toast.success(
        `Revertido: ${r.precosApagados} preços apagados, ${r.mapeamentosRestaurados} ` +
          `mapeamentos restaurados, ${r.mapeamentosApagados} removidos.`,
      );
      recarregar();
      onSuccess();
      setAReverter(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao reverter.');
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
              {importacao.ficheiroNome ?? 'Importação de catálogo'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {importacao.totalLinhas} linhas · {ROTULO_ESTADO_IMPORTACAO_LOCAL[importacao.estado]}
              {importacao.criadoPor && ` · ${importacao.criadoPor.name}`}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </header>

        <div className="border-b border-slate-100 px-5 py-3">
          <div className="grid grid-cols-3 gap-3">
            <Contador rotulo="Prontas" valor={prontas} cor="emerald" />
            <Contador rotulo="Por rever" valor={porRever} cor="amber" />
            <Contador rotulo="Com erro" valor={importacao.linhasComErro} cor="rose" />
          </div>

          {/* Guardar o mapa de colunas é o que responde à primeira pergunta que alguém
              faz quando um preço aparece errado: que coluna é que ele leu como preço? */}
          {importacao.mapaColunas && (
            <p className="mt-3 text-xs text-slate-500">
              Colunas lidas:{' '}
              {Object.entries(importacao.mapaColunas)
                .map(([papel, indice]) => `${papel} → coluna ${Number(indice) + 1}`)
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
                {f === 'TODAS' ? 'Todas' : ROTULO_ESTADO_LINHA[f]}
              </button>
            ),
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {visiveis.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              {filtro === 'POR_REVER'
                ? 'Nenhuma linha por rever. Podes aplicar.'
                : 'Nenhuma linha neste estado.'}
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
                        {l.descricao ?? l.referenciaFornecedor ?? '(sem descrição)'}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {l.referenciaFornecedor && `Ref. ${l.referenciaFornecedor} · `}
                        {l.gtin && `EAN ${l.gtin} · `}
                        {l.precoUnitario != null ? mt(l.precoUnitario) : 'sem preço'}
                        {l.unidadeFornecedor && ` / ${l.unidadeFornecedor}`}
                        {l.factorConversao && l.factorConversao !== 1 && (
                          <span className="text-slate-600"> ({l.factorConversao} un.)</span>
                        )}
                      </p>
                      {l.mensagem && (
                        <p className="mt-1.5 text-xs text-slate-600">{l.mensagem}</p>
                      )}
                      {l.metodo && l.confianca != null && (
                        <p className="mt-0.5 text-xs text-slate-400">
                          Por {ROTULO_METODO[l.metodo]} · confiança{' '}
                          {(l.confianca * 100).toFixed(0)}%
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
                          Decidir
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
                Reverter apaga os preços que este lote criou e devolve aos que ele fechou a data
                de fim que tinham. Os mapeamentos voltam ao que eram; os que este lote criou de
                raiz desaparecem.
              </p>
              <input
                value={motivoReversao}
                onChange={(e) => setMotivoReversao(e.target.value)}
                placeholder="A coluna do preço estava trocada com a do desconto."
                className="mt-2 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm placeholder:text-rose-300 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {emRevisao && porRever > 0 && (
                <>
                  <strong>{porRever}</strong> linhas por rever não vão ser aplicadas.
                </>
              )}
            </p>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                Fechar
              </button>

              {importacao.estado === 'APLICADA' &&
                (aReverter ? (
                  <button
                    onClick={reverter}
                    disabled={aAplicar}
                    className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    {aAplicar && <Loader2 size={14} className="animate-spin" />}
                    Confirmar reversão
                  </button>
                ) : (
                  <button
                    onClick={() => setAReverter(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    <Undo2 size={14} /> Reverter
                  </button>
                ))}

              {emRevisao && (
                <button
                  onClick={aplicar}
                  disabled={aAplicar || prontas === 0}
                  title={prontas === 0 ? 'Nenhuma linha pronta para aplicar' : undefined}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {aAplicar ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )}
                  Aplicar {prontas} linhas
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

const ROTULO_ESTADO_IMPORTACAO_LOCAL: Record<string, string> = {
  EM_REVISAO: 'em revisão',
  APLICADA: 'aplicada',
  REVERTIDA: 'revertida',
  CANCELADA: 'cancelada',
};

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
      {ROTULO_ESTADO_LINHA[estado]}
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
      toast.success(produtoId ? 'Linha mapeada.' : 'Linha descartada.');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao decidir a linha.');
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
                Linha {linha.numeroLinha}
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
              placeholder="Procurar produto..."
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
                ? 'Escreve pelo menos duas letras.'
                : 'Nenhum produto encontrado.'}
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
                          {p.sku && `SKU ${p.sku}`}
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
            <EyeOff size={14} /> Descartar linha
          </button>
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
        </footer>
      </div>
    </div>
  );
}
