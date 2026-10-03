import { useState } from 'react';
import { Loader2, Percent, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatData } from '@/shared/utils';
import { useCategories, useProducts } from '@/features/produtos';
import { usePromocoes, useCriarPromocao, useCancelarPromocao } from '../hooks/usePromocoes';
import type { TipoPromocao, RiscoStockPromocao } from '../types';

const CORES_RISCO: Record<RiscoStockPromocao['nivel'], string> = {
  SEM_DADOS: 'bg-slate-100 text-slate-600',
  BAIXO: 'bg-emerald-100 text-emerald-700',
  MEDIO: 'bg-amber-100 text-amber-800',
  ALTO: 'bg-rose-100 text-rose-700',
};

function FormularioNovaPromocao({ onFechar }: { onFechar: () => void }) {
  const { t } = useTranslation('promocoes');
  const { data: categorias } = useCategories();
  const { data: produtosPagina } = useProducts({ limit: 100 });
  const criar = useCriarPromocao();

  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<TipoPromocao>('PRODUTO');
  const [alvoId, setAlvoId] = useState('');
  const [percentualDesconto, setPercentualDesconto] = useState(10);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [risco, setRisco] = useState<RiscoStockPromocao | null>(null);

  const produtos = produtosPagina?.data ?? [];

  const aoSubmeter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alvoId || !dataInicio || !dataFim) return;

    criar.mutate(
      {
        nome,
        tipo,
        produtoId: tipo === 'PRODUTO' ? alvoId : undefined,
        categoriaId: tipo === 'CATEGORIA' ? alvoId : undefined,
        percentualDesconto,
        dataInicio,
        dataFim,
      },
      {
        onSuccess: (criada) => {
          setRisco(criada.risco);
          // O formulário só fecha depois de a pessoa ver o risco — é informativo,
          // não bloqueia, mas desaparecer sem mostrar nada seria pior do que não o
          // calcular.
        },
      },
    );
  };

  if (risco) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-900">{t('formulario.criada_titulo')}</p>
        <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${CORES_RISCO[risco.nivel]}`}>
          <Percent size={14} />
          {t(`risco.${risco.nivel}`)}
        </div>
        <p className="mt-2 text-sm text-slate-600">
          {risco.nivel === 'SEM_DADOS'
            ? t('formulario.risco_sem_dados')
            : t('formulario.risco_detalhe', {
                procura: Math.round(risco.procuraEsperada),
                stock: risco.stockDisponivel,
                cobertura: risco.coberturaDias != null ? Math.round(risco.coberturaDias) : '—',
              })}
        </p>
        <button
          type="button"
          onClick={onFechar}
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          {t('formulario.fechar')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={aoSubmeter} className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">{t('formulario.titulo')}</h2>
        <button type="button" onClick={onFechar} className="text-slate-400 hover:text-slate-600">
          <X size={18} />
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          {t('formulario.nome')}
          <input
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          {t('formulario.tipo')}
          <select
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value as TipoPromocao);
              setAlvoId('');
            }}
            className="rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="PRODUTO">{t('formulario.tipo_produto')}</option>
            <option value="CATEGORIA">{t('formulario.tipo_categoria')}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          {tipo === 'PRODUTO' ? t('formulario.produto') : t('formulario.categoria')}
          <select
            required
            value={alvoId}
            onChange={(e) => setAlvoId(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="" disabled>{t('formulario.escolher')}</option>
            {(tipo === 'PRODUTO' ? produtos : categorias ?? []).map((item: { id: string; nome: string }) => (
              <option key={item.id} value={item.id}>{item.nome}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          {t('formulario.percentual')}
          <input
            required
            type="number"
            min={1}
            max={90}
            value={percentualDesconto}
            onChange={(e) => setPercentualDesconto(Number(e.target.value))}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>

        <div />

        <label className="flex flex-col gap-1 text-sm">
          {t('formulario.data_inicio')}
          <input
            required
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          {t('formulario.data_fim')}
          <input
            required
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={criar.isPending}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {criar.isPending && <Loader2 size={14} className="animate-spin" />}
        {t('formulario.criar')}
      </button>
    </form>
  );
}

export function PromocoesPage() {
  const { t } = useTranslation('promocoes');
  const { data: promocoes, isLoading } = usePromocoes();
  const cancelar = useCancelarPromocao();
  const [aCriar, setACriar] = useState(false);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">{t('titulo')}</h1>
        {!aCriar && (
          <button
            type="button"
            onClick={() => setACriar(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={15} />
            {t('nova')}
          </button>
        )}
      </div>

      {aCriar && <FormularioNovaPromocao onFechar={() => setACriar(false)} />}

      <div className="rounded-xl border border-slate-200 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-slate-400" />
          </div>
        ) : promocoes && promocoes.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">{t('tabela.nome')}</th>
                <th className="px-4 py-3">{t('tabela.alvo')}</th>
                <th className="px-4 py-3">{t('tabela.desconto')}</th>
                <th className="px-4 py-3">{t('tabela.periodo')}</th>
                <th className="px-4 py-3">{t('tabela.estado')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {promocoes.map((promocao) => {
                const terminada = new Date(promocao.dataFim) < new Date();
                const estado = !promocao.isActive
                  ? t('tabela.cancelada')
                  : terminada
                    ? t('tabela.terminada')
                    : t('tabela.activa');

                return (
                  <tr key={promocao.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900">{promocao.nome}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {promocao.produto?.nome ?? promocao.categoria?.nome ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">-{promocao.percentualDesconto}%</td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatData(promocao.dataInicio)} – {formatData(promocao.dataFim)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          !promocao.isActive || terminada
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {promocao.isActive && !terminada && (
                        <button
                          type="button"
                          disabled={cancelar.isPending}
                          onClick={() => cancelar.mutate(promocao.id)}
                          className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-50"
                        >
                          {t('tabela.cancelar')}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="px-4 py-12 text-center text-sm text-slate-400">{t('vazio')}</p>
        )}
      </div>
    </div>
  );
}
