import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatData, formatMoeda } from '@/shared/utils';
import { useCategories, useProducts } from '@/features/produtos';
import {
  useCandidatosPreco,
  useCriarPoliticaPreco,
  usePoliticasPreco,
  useSimularPreco,
} from '../hooks/usePrecificacao';
import type { DecisaoCandidatoPreco, EscopoPoliticaPreco } from '../types';

const CORES_DECISAO: Record<DecisaoCandidatoPreco, string> = {
  AUTO_APPROVED: 'bg-emerald-100 text-emerald-700',
  REVIEW_REQUIRED: 'bg-amber-100 text-amber-800',
  BLOCKED: 'bg-rose-100 text-rose-700',
};

const formatPercentagem = (fracao: number) => `${(fracao * 100).toFixed(1)}%`;

function FormularioNovaPolitica({ onFechar }: { onFechar: () => void }) {
  const { t } = useTranslation('precificacao');
  const { data: categorias } = useCategories();
  const { data: produtosPagina } = useProducts({ limit: 100 });
  const criar = useCriarPoliticaPreco();

  const [escopo, setEscopo] = useState<EscopoPoliticaPreco>('EMPRESA');
  const [alvoId, setAlvoId] = useState('');
  const [margemAlvo, setMargemAlvo] = useState(20);
  const [margemPiso, setMargemPiso] = useState(5);
  const [limiteAutoaprovacao, setLimiteAutoaprovacao] = useState('');

  const produtos = produtosPagina?.data ?? [];

  const aoSubmeter = (e: React.FormEvent) => {
    e.preventDefault();
    if (escopo !== 'EMPRESA' && !alvoId) return;

    criar.mutate(
      {
        escopo,
        categoriaId: escopo === 'CATEGORIA' ? alvoId : undefined,
        produtoId: escopo === 'PRODUTO' ? alvoId : undefined,
        margemAlvo: margemAlvo / 100,
        margemPiso: margemPiso / 100,
        limiteAutoaprovacao: limiteAutoaprovacao
          ? Number(limiteAutoaprovacao) / 100
          : undefined,
      },
      { onSuccess: onFechar },
    );
  };

  return (
    <form onSubmit={aoSubmeter} className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">{t('formulario.titulo')}</h2>
        <button type="button" onClick={onFechar} className="text-slate-400 hover:text-slate-600">
          {t('formulario.fechar')}
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          {t('formulario.escopo')}
          <select
            value={escopo}
            onChange={(e) => {
              setEscopo(e.target.value as EscopoPoliticaPreco);
              setAlvoId('');
            }}
            className="rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="EMPRESA">{t('formulario.escopo_empresa')}</option>
            <option value="CATEGORIA">{t('formulario.escopo_categoria')}</option>
            <option value="PRODUTO">{t('formulario.escopo_produto')}</option>
          </select>
        </label>

        {escopo !== 'EMPRESA' && (
          <label className="flex flex-col gap-1 text-sm">
            {escopo === 'CATEGORIA' ? t('formulario.categoria') : t('formulario.produto')}
            <select
              required
              value={alvoId}
              onChange={(e) => setAlvoId(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="" disabled>{t('formulario.escolher')}</option>
              {(escopo === 'CATEGORIA' ? categorias ?? [] : produtos).map(
                (item: { id: string; nome: string }) => (
                  <option key={item.id} value={item.id}>{item.nome}</option>
                ),
              )}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1 text-sm">
          {t('formulario.margem_alvo')}
          <input
            required
            type="number"
            min={0}
            max={95}
            step="0.1"
            value={margemAlvo}
            onChange={(e) => setMargemAlvo(Number(e.target.value))}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          {t('formulario.margem_piso')}
          <input
            required
            type="number"
            min={0}
            max={95}
            step="0.1"
            value={margemPiso}
            onChange={(e) => setMargemPiso(Number(e.target.value))}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          {t('formulario.limite_autoaprovacao')}
          <input
            type="number"
            min={0}
            step="0.1"
            placeholder={t('formulario.limite_autoaprovacao_vazio')}
            value={limiteAutoaprovacao}
            onChange={(e) => setLimiteAutoaprovacao(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
          <span className="text-xs text-slate-500">{t('formulario.limite_autoaprovacao_ajuda')}</span>
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

function SeparadorPoliticas() {
  const { t } = useTranslation('precificacao');
  const { data: politicas, isLoading } = usePoliticasPreco();
  const [aCriar, setACriar] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{t('politicas.descricao')}</p>
        {!aCriar && (
          <button
            type="button"
            onClick={() => setACriar(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={15} />
            {t('politicas.nova')}
          </button>
        )}
      </div>

      {aCriar && <FormularioNovaPolitica onFechar={() => setACriar(false)} />}

      <div className="rounded-xl border border-slate-200 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-slate-400" />
          </div>
        ) : politicas && politicas.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">{t('politicas.tabela.alvo')}</th>
                <th className="px-4 py-3">{t('politicas.tabela.margem_alvo')}</th>
                <th className="px-4 py-3">{t('politicas.tabela.margem_piso')}</th>
                <th className="px-4 py-3">{t('politicas.tabela.limite_autoaprovacao')}</th>
                <th className="px-4 py-3">{t('politicas.tabela.vigente_desde')}</th>
              </tr>
            </thead>
            <tbody>
              {politicas.map((politica) => (
                <tr key={politica.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3">
                    {politica.escopo === 'EMPRESA' && t('formulario.escopo_empresa')}
                    {politica.escopo === 'CATEGORIA' && (politica.categoria?.nome ?? '—')}
                    {politica.escopo === 'PRODUTO' && (politica.produto?.nome ?? '—')}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{formatPercentagem(politica.margemAlvo)}</td>
                  <td className="px-4 py-3 tabular-nums">{formatPercentagem(politica.margemPiso)}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {politica.limiteAutoaprovacao != null
                      ? formatPercentagem(politica.limiteAutoaprovacao)
                      : t('politicas.sem_limite')}
                  </td>
                  <td className="px-4 py-3">{formatData(politica.vigenteDe)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-4 py-10 text-center text-sm text-slate-400">{t('politicas.vazio')}</p>
        )}
      </div>
    </div>
  );
}

function SeparadorSimulacao() {
  const { t } = useTranslation('precificacao');
  const { data: produtosPagina } = useProducts({ limit: 100 });
  const [produtoId, setProdutoId] = useState('');
  const [custoHipotetico, setCustoHipotetico] = useState('');
  const simular = useSimularPreco();
  const { data: candidatos, isLoading } = useCandidatosPreco(produtoId || undefined);

  const produtos = produtosPagina?.data ?? [];

  const aoSimular = (e: React.FormEvent) => {
    e.preventDefault();
    if (!produtoId) return;

    simular.mutate({
      produtoId,
      custoHipotetico: custoHipotetico ? Number(custoHipotetico) : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={aoSimular} className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-500">{t('simulacao.descricao')}</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            {t('simulacao.produto')}
            <select
              required
              value={produtoId}
              onChange={(e) => setProdutoId(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="" disabled>{t('formulario.escolher')}</option>
              {produtos.map((produto: { id: string; nome: string }) => (
                <option key={produto.id} value={produto.id}>{produto.nome}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            {t('simulacao.custo_hipotetico')}
            <input
              type="number"
              min={0}
              step="0.01"
              placeholder={t('simulacao.custo_hipotetico_vazio')}
              value={custoHipotetico}
              onChange={(e) => setCustoHipotetico(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={simular.isPending}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {simular.isPending && <Loader2 size={14} className="animate-spin" />}
          {t('simulacao.simular')}
        </button>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-slate-400" />
          </div>
        ) : candidatos && candidatos.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">{t('simulacao.tabela.produto')}</th>
                <th className="px-4 py-3">{t('simulacao.tabela.custo')}</th>
                <th className="px-4 py-3">{t('simulacao.tabela.preco_sugerido')}</th>
                <th className="px-4 py-3">{t('simulacao.tabela.margem_efectiva')}</th>
                <th className="px-4 py-3">{t('simulacao.tabela.decisao')}</th>
                <th className="px-4 py-3">{t('simulacao.tabela.quando')}</th>
              </tr>
            </thead>
            <tbody>
              {candidatos.map((candidato) => (
                <tr key={candidato.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3">{candidato.produto?.nome ?? '—'}</td>
                  <td className="px-4 py-3 tabular-nums">{formatMoeda(candidato.custoUsado)}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {candidato.preco != null ? formatMoeda(candidato.preco) : '—'}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {candidato.margemEfectiva != null
                      ? formatPercentagem(candidato.margemEfectiva)
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${CORES_DECISAO[candidato.decisao]}`}
                    >
                      {t(`simulacao.decisao.${candidato.decisao}`)}
                    </span>
                    {candidato.motivos.length > 0 && (
                      <p className="mt-1 text-xs text-slate-400">
                        {candidato.motivos
                          .map((motivo) => t(`simulacao.motivo.${motivo}`, motivo))
                          .join(', ')}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{formatData(candidato.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-4 py-10 text-center text-sm text-slate-400">{t('simulacao.vazio')}</p>
        )}
      </div>
    </div>
  );
}

export function PrecificacaoPage() {
  const { t } = useTranslation('precificacao');
  const [separador, setSeparador] = useState<'politicas' | 'simulacao'>('politicas');

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <h1 className="text-lg font-bold text-slate-900">{t('titulo')}</h1>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setSeparador('politicas')}
          className={`px-3 py-2 text-sm font-semibold ${separador === 'politicas' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
        >
          {t('separador.politicas')}
        </button>
        <button
          type="button"
          onClick={() => setSeparador('simulacao')}
          className={`px-3 py-2 text-sm font-semibold ${separador === 'simulacao' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
        >
          {t('separador.simulacao')}
        </button>
      </div>

      {separador === 'politicas' ? <SeparadorPoliticas /> : <SeparadorSimulacao />}
    </div>
  );
}
