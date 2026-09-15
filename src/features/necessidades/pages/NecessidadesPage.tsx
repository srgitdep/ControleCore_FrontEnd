import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Download, AlertCircle, History, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { getLojas } from '@/features/lojas/api/lojas.api';
import { BarraDaPagina } from '@/shared/ui';
import { KpisNecessidades } from '../components/KpisNecessidades';
import { ChipsRecomendacao } from '../components/ChipsRecomendacao';
import { TabelaNecessidades } from '../components/TabelaNecessidades';
import { CoberturaCard } from '../components/CoberturaCard';
import { PainelMayra } from '../components/PainelMayra';
import { DetalheNecessidadeDrawer } from '../components/DetalheNecessidadeDrawer';
import {
  useNecessidades,
  useKpisNecessidades,
  useCriarRequisicaoDeNecessidade,
} from '../hooks/useNecessidades';
import type { LinhaNecessidade, RecomendacaoNecessidade } from '../types/necessidade.types';

/**
 * Painel Central de Necessidades e Compras Inteligentes — DT01.
 *
 * ## Cancelamento ao mudar de loja — DT01 7.2
 *
 * "Pedidos de dados ainda pendentes da loja anterior devem ser cancelados ou descartados
 * para impedir mistura de informação." O React Query já resolve isto: `lojaId` faz parte
 * da `queryKey` em `useNecessidades`/`useKpisNecessidades`, e o próprio hook cancela a
 * requisição em curso quando a chave muda antes de a resposta anterior chegar — não é
 * preciso código manual de cancelamento aqui.
 *
 * ## Pesquisa global — DT01 7.1
 *
 * A pesquisa desta página filtra a tabela de necessidades (nome, SKU, código de barras).
 * Não é a pesquisa global do cabeçalho (`PesquisaGlobal`, em `Header`), que abre
 * produtos, fornecedores, requisições, RFQs e ordens de compra sem tocar em nenhum
 * filtro desta página.
 */
export function NecessidadesPage() {
  const navigate = useNavigate();
  const [lojaId, setLojaId] = useState<string>('');
  const [pesquisa, setPesquisa] = useState('');
  const [recomendacoes, setRecomendacoes] = useState<RecomendacaoNecessidade[]>([]);
  const [page, setPage] = useState(1);
  const [necessidadeAberta, setNecessidadeAberta] = useState<string | null>(null);

  const { data: lojas } = useQuery({ queryKey: ['lojas'], queryFn: getLojas });

  const filtros = useMemo(
    () => ({
      lojaId: lojaId || undefined,
      pesquisa: pesquisa || undefined,
      recomendacao: recomendacoes.length ? recomendacoes : undefined,
      page,
      limit: 10,
    }),
    [lojaId, pesquisa, recomendacoes, page],
  );

  const { data: lista, isLoading } = useNecessidades(filtros);
  const { data: kpis, isLoading: aCarregarKpis } = useKpisNecessidades(lojaId || undefined);
  const criarRequisicao = useCriarRequisicaoDeNecessidade();

  const alternarRecomendacao = (recomendacao: RecomendacaoNecessidade) => {
    setRecomendacoes((anterior) =>
      anterior.includes(recomendacao)
        ? anterior.filter((r) => r !== recomendacao)
        : [...anterior, recomendacao],
    );
    setPage(1);
  };

  const handleCriarRequisicao = (linha: LinhaNecessidade) => {
    criarRequisicao.mutate({ necessidadeId: linha.id });
  };

  const totalPaginas = lista ? Math.max(Math.ceil(lista.total / lista.limit), 1) : 1;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <BarraDaPagina
        resumo={lista ? `${lista.total} necessidades activas` : undefined}
        acoes={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/compras/necessidades/alertas')}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <Bell size={16} /> Alertas
            </button>
            <button
              type="button"
              onClick={() => navigate('/compras/necessidades/historico')}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <History size={16} /> Histórico
            </button>
            <select
              value={lojaId}
              onChange={(e) => {
                setLojaId(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            >
              <option value="">Todas as lojas</option>
              {(lojas ?? []).map((loja: { id: string; nome: string }) => (
                <option key={loja.id} value={loja.id}>
                  {loja.nome}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <KpisNecessidades
        lojaId={lojaId || undefined}
        onFiltrarRisco={() => {
          // DT01 8: filtra para risco crítico, não abre relatório.
          setRecomendacoes(['COMPRAR']);
          setPage(1);
        }}
        onFiltrarTodas={() => {
          setRecomendacoes([]);
          setPage(1);
        }}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <ChipsRecomendacao
              contagens={
                lista?.contagemPorRecomendacao ?? {
                  COMPRAR: 0,
                  TRANSFERIR: 0,
                  AGUARDAR: 0,
                  NAO_COMPRAR: 0,
                  STOCK_PARADO: 0,
                  EXCESSO: 0,
                }
              }
              total={lista?.total ?? 0}
              seleccionadas={recomendacoes}
              onAlternar={alternarRecomendacao}
              onLimpar={() => {
                setRecomendacoes([]);
                setPage(1);
              }}
            />
            <button
              type="button"
              onClick={() => toast('Exportação ainda não disponível nesta versão.')}
              className="flex items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:self-auto"
            >
              <Download size={16} /> Exportar
            </button>
          </div>

          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={pesquisa}
              onChange={(e) => {
                setPesquisa(e.target.value);
                setPage(1);
              }}
              placeholder="Pesquisar produto, categoria ou código..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white">
            <TabelaNecessidades
              linhas={lista?.dados ?? []}
              isLoading={isLoading}
              onAbrirDetalhe={setNecessidadeAberta}
              onCriarRequisicao={handleCriarRequisicao}
            />

            {lista && lista.total > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
                <span>
                  A mostrar {lista.dados.length} de {lista.total} produtos
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    className="rounded-md px-2 py-1 disabled:opacity-30"
                  >
                    ‹
                  </button>
                  <span className="tabular-nums">
                    {page} / {totalPaginas}
                  </span>
                  <button
                    disabled={page >= totalPaginas}
                    onClick={() => setPage((p) => Math.min(p + 1, totalPaginas))}
                    className="rounded-md px-2 py-1 disabled:opacity-30"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </div>

          {(lista?.contagemPorRecomendacao.TRANSFERIR ?? 0) > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <AlertCircle size={16} className="shrink-0" />
              Existem {lista?.contagemPorRecomendacao.TRANSFERIR} produtos que podem ser
              resolvidos com transferência entre lojas antes de realizar novas compras.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <CoberturaCard kpis={kpis} isLoading={aCarregarKpis} />
          <PainelMayra kpis={kpis} isLoading={aCarregarKpis} lojaId={lojaId || undefined} />
        </div>
      </div>

      <DetalheNecessidadeDrawer
        necessidadeId={necessidadeAberta}
        onClose={() => setNecessidadeAberta(null)}
      />
    </div>
  );
}
