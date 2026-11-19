import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Loader2, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatData, formatMoeda } from '@/shared/utils';
import { useCategories, useProducts } from '@/features/produtos';
import {
  useAprovarCandidato,
  useCandidatosPreco,
  useCriarPoliticaPreco,
  useFilaDeExcecoes,
  useHistoricoDeProduto,
  usePoliticasPreco,
  useRecusarCandidato,
  useSimularPreco,
} from '../hooks/usePrecificacao';
import type { CandidatoPreco, DecisaoCandidatoPreco, EscopoPoliticaPreco } from '../types';

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

function MotivosDoCandidato({ candidato }: { candidato: CandidatoPreco }) {
  const { t } = useTranslation('precificacao');
  if (candidato.motivos.length === 0) return null;
  return (
    <p className="mt-1 text-xs text-slate-400">
      {candidato.motivos.map((motivo) => t(`simulacao.motivo.${motivo}`, motivo)).join(', ')}
    </p>
  );
}

/**
 * A fila de preços que não puderam autoaprovar: abaixo do custo, fora do piso da política,
 * ou sem política elegível. Quem pediu o preço não aparece como podendo aprová-lo aqui —
 * o servidor recusa-o (403) se tentar, por isso nem se mostra o botão a essa pessoa.
 */
function SeparadorExcecoes() {
  const { t } = useTranslation('precificacao');
  const { data: candidatos, isLoading } = useFilaDeExcecoes();
  const aprovar = useAprovarCandidato();
  const recusar = useRecusarCandidato();
  const [aRecusar, setARecusar] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');

  const confirmarRecusa = (id: string) => {
    if (!motivo.trim()) return;
    recusar.mutate({ id, motivo: motivo.trim() }, { onSuccess: () => setARecusar(null) });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">{t('excecoes.descricao')}</p>

      <div className="rounded-xl border border-slate-200 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-slate-400" />
          </div>
        ) : candidatos && candidatos.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">{t('excecoes.tabela.produto')}</th>
                <th className="px-4 py-3">{t('excecoes.tabela.preco_actual')}</th>
                <th className="px-4 py-3">{t('excecoes.tabela.preco_proposto')}</th>
                <th className="px-4 py-3">{t('excecoes.tabela.margem_efectiva')}</th>
                <th className="px-4 py-3">{t('excecoes.tabela.origem')}</th>
                <th className="px-4 py-3">{t('excecoes.tabela.motivo')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {candidatos.map((candidato) => (
                <tr key={candidato.id} className="border-b border-slate-50 last:border-0 align-top">
                  <td className="px-4 py-3">{candidato.produto?.nome ?? '—'}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {candidato.precoActual != null ? formatMoeda(candidato.precoActual) : '—'}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {candidato.preco != null ? formatMoeda(candidato.preco) : '—'}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {candidato.margemEfectiva != null
                      ? formatPercentagem(candidato.margemEfectiva)
                      : '—'}
                  </td>
                  <td className="px-4 py-3">{t(`excecoes.origem.${candidato.origem}`)}</td>
                  <td className="px-4 py-3"><MotivosDoCandidato candidato={candidato} /></td>
                  <td className="px-4 py-3">
                    {aRecusar === candidato.id ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          autoFocus
                          value={motivo}
                          onChange={(e) => setMotivo(e.target.value)}
                          placeholder={t('excecoes.motivo_placeholder')}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                        />
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => confirmarRecusa(candidato.id)}
                            disabled={recusar.isPending || !motivo.trim()}
                            className="rounded-lg bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                          >
                            {t('excecoes.confirmar_recusa')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setARecusar(null)}
                            className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                          >
                            {t('formulario.fechar')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => aprovar.mutate(candidato.id)}
                          disabled={aprovar.isPending}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <Check size={13} />
                          {t('excecoes.aprovar')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setARecusar(candidato.id);
                            setMotivo('');
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          <X size={13} />
                          {t('excecoes.recusar')}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-4 py-10 text-center text-sm text-slate-400">{t('excecoes.vazio')}</p>
        )}
      </div>
    </div>
  );
}

/** O histórico de um produto: cada preço que esteve em vigor, com quem o aprovou e porquê. */
function SeparadorHistorico() {
  const { t } = useTranslation('precificacao');
  const { data: produtosPagina } = useProducts({ limit: 100 });
  const [produtoId, setProdutoId] = useState('');
  const { data: historico, isLoading } = useHistoricoDeProduto(produtoId || undefined);

  const produtos = produtosPagina?.data ?? [];

  return (
    <div className="space-y-4">
      <label className="flex flex-col gap-1 text-sm">
        {t('simulacao.produto')}
        <select
          value={produtoId}
          onChange={(e) => setProdutoId(e.target.value)}
          className="max-w-md rounded-lg border border-slate-200 px-3 py-2"
        >
          <option value="">{t('formulario.escolher')}</option>
          {produtos.map((produto: { id: string; nome: string }) => (
            <option key={produto.id} value={produto.id}>{produto.nome}</option>
          ))}
        </select>
      </label>

      <div className="rounded-xl border border-slate-200 bg-white">
        {!produtoId ? (
          <p className="px-4 py-10 text-center text-sm text-slate-400">{t('historico.escolha_produto')}</p>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-slate-400" />
          </div>
        ) : historico && historico.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">{t('historico.tabela.preco')}</th>
                <th className="px-4 py-3">{t('historico.tabela.vigencia')}</th>
                <th className="px-4 py-3">{t('historico.tabela.margem_efectiva')}</th>
                <th className="px-4 py-3">{t('historico.tabela.origem')}</th>
                <th className="px-4 py-3">{t('historico.tabela.decidido_por')}</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((versao) => (
                <tr key={versao.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 font-semibold tabular-nums">{formatMoeda(versao.preco)}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatData(versao.vigenteDe)}
                    {versao.vigenteAte ? ` — ${formatData(versao.vigenteAte)}` : ` (${t('historico.em_vigor')})`}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {versao.candidato.margemEfectiva != null
                      ? formatPercentagem(versao.candidato.margemEfectiva)
                      : '—'}
                  </td>
                  <td className="px-4 py-3">{t(`excecoes.origem.${versao.candidato.origem}`)}</td>
                  <td className="px-4 py-3 text-slate-500">{versao.candidato.decididoPor?.name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-4 py-10 text-center text-sm text-slate-400">{t('historico.vazio')}</p>
        )}
      </div>
    </div>
  );
}

const SEPARADORES = ['politicas', 'simulacao', 'excecoes', 'historico'] as const;
type Separador = (typeof SEPARADORES)[number];

export function PrecificacaoPage() {
  const { t } = useTranslation('precificacao');
  const [searchParams, setSearchParams] = useSearchParams();

  // A notificação de um preço pendente leva a ?tab=excecoes; um valor inválido ou ausente
  // cai nas políticas, o separador de leitura.
  const doUrl = searchParams.get('tab');
  const separador: Separador = SEPARADORES.includes(doUrl as Separador)
    ? (doUrl as Separador)
    : 'politicas';

  const mudarSeparador = (novo: Separador) => setSearchParams({ tab: novo }, { replace: true });

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <h1 className="text-lg font-bold text-slate-900">{t('titulo')}</h1>

      <div className="flex gap-2 overflow-x-auto border-b border-slate-200">
        {SEPARADORES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => mudarSeparador(s)}
            className={`shrink-0 px-3 py-2 text-sm font-semibold ${separador === s ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
          >
            {t(`separador.${s}`)}
          </button>
        ))}
      </div>

      {separador === 'politicas' && <SeparadorPoliticas />}
      {separador === 'simulacao' && <SeparadorSimulacao />}
      {separador === 'excecoes' && <SeparadorExcecoes />}
      {separador === 'historico' && <SeparadorHistorico />}
    </div>
  );
}
