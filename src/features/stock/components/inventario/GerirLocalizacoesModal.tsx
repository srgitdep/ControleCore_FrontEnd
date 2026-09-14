import { useState } from 'react';
import { X, MapPin, Plus, Trash2, Search, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useLocalizacoesInventario,
  useCriarLocalizacao,
  useDesativarLocalizacao,
  useAssociarProduto,
  useDesassociarProduto,
} from '@/features/stock';
import { useProducts } from '@/features/produtos';
import { Button } from '@/shared/ui';
import type { LocalizacaoDetalhada } from '@/features/stock';

/**
 * Cadastro de Localizações (prateleiras/zonas) e associação de produtos — o
 * que dá ao inventário um perímetro para carregar (§5). Sem uma localização
 * com pelo menos um produto associado, `POST /inventory/cycles` recusa criar
 * o ciclo por não ter nada para contar.
 */
export function GerirLocalizacoesModal({
  armazemId,
  armazemNome,
  onClose,
}: {
  armazemId: string;
  armazemNome: string;
  onClose: () => void;
}) {
  const { data: localizacoes = [], isLoading } = useLocalizacoesInventario(armazemId);
  const [localizacaoSelecionadaId, setLocalizacaoSelecionadaId] = useState<string | null>(null);
  const [novoCodigo, setNovoCodigo] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');

  const criarLocalizacao = useCriarLocalizacao(armazemId);
  const desativarLocalizacao = useDesativarLocalizacao(armazemId);

  const localizacaoSelecionada = localizacoes.find((l) => l.id === localizacaoSelecionadaId) ?? null;

  const handleCriar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoCodigo.trim()) return;
    criarLocalizacao.mutate(
      { codigo: novoCodigo.trim(), descricao: novaDescricao.trim() || undefined },
      {
        onSuccess: (loc) => {
          setNovoCodigo('');
          setNovaDescricao('');
          setLocalizacaoSelecionadaId(loc.id);
        },
        onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Não foi possível criar a localização.'),
      },
    );
  };

  const handleDesativar = (loc: LocalizacaoDetalhada) => {
    if (loc._count.produtos > 0) {
      toast.error('Desassocie os produtos antes de desativar esta localização.');
      return;
    }
    desativarLocalizacao.mutate(loc.id, {
      onSuccess: () => {
        if (localizacaoSelecionadaId === loc.id) setLocalizacaoSelecionadaId(null);
      },
      onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Não foi possível desativar.'),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Localizações</h2>
              <p className="text-xs text-slate-500">{armazemNome}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-[280px_1fr] overflow-hidden">
          {/* Lista de localizações */}
          <div className="flex flex-col overflow-hidden border-r border-slate-100">
            <form onSubmit={handleCriar} className="space-y-2 border-b border-slate-100 p-3">
              <input
                value={novoCodigo}
                onChange={(e) => setNovoCodigo(e.target.value)}
                placeholder="Código (ex: B01)"
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={novaDescricao}
                onChange={(e) => setNovaDescricao(e.target.value)}
                placeholder="Descrição (opcional)"
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button type="submit" size="sm" className="w-full" disabled={!novoCodigo.trim() || criarLocalizacao.isPending}>
                <Plus className="h-3.5 w-3.5" />
                Nova localização
              </Button>
            </form>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <p className="px-3 py-6 text-center text-xs text-slate-400">A carregar...</p>
              ) : localizacoes.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-slate-400">
                  Nenhuma localização. Crie a primeira acima.
                </p>
              ) : (
                localizacoes.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => setLocalizacaoSelecionadaId(loc.id)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
                      loc.id === localizacaoSelecionadaId ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{loc.codigo}</p>
                      {loc.descricao && <p className="truncate text-xs text-slate-400">{loc.descricao}</p>}
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                      {loc._count.produtos}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Produtos da localização selecionada */}
          <div className="flex flex-col overflow-hidden">
            {localizacaoSelecionada ? (
              <ProdutosDaLocalizacao
                armazemId={armazemId}
                localizacao={localizacaoSelecionada}
                onDesativar={() => handleDesativar(localizacaoSelecionada)}
              />
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-400">
                Selecione uma localização para ver e associar produtos.
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 text-right">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProdutosDaLocalizacao({
  armazemId,
  localizacao,
  onDesativar,
}: {
  armazemId: string;
  localizacao: LocalizacaoDetalhada;
  onDesativar: () => void;
}) {
  const [busca, setBusca] = useState('');
  const { data: resultado, isLoading: isBuscando } = useProducts(busca.trim() ? { search: busca.trim(), limit: 8 } : undefined);
  const associarProduto = useAssociarProduto(armazemId);
  const desassociarProduto = useDesassociarProduto(armazemId);

  const idsJaAssociados = new Set(localizacao.produtos.map((p) => p.produto.id));
  const sugestoes = (resultado?.data ?? []).filter((p) => !idsJaAssociados.has(p.id));

  const associar = (productId: string) => {
    associarProduto.mutate(
      { localizacaoId: localizacao.id, productId },
      {
        onSuccess: () => setBusca(''),
        onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Não foi possível associar o produto.'),
      },
    );
  };

  const desassociar = (productId: string) => {
    desassociarProduto.mutate(
      { localizacaoId: localizacao.id, productId },
      { onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Não foi possível desassociar.') },
    );
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="font-semibold text-slate-800">{localizacao.codigo}</p>
          {localizacao.descricao && <p className="text-xs text-slate-400">{localizacao.descricao}</p>}
        </div>
        <button
          onClick={onDesativar}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-rose-500 hover:bg-rose-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Desativar
        </button>
      </div>

      <div className="border-b border-slate-100 p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar produto para associar..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {busca.trim() && (
          <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-slate-100">
            {isBuscando ? (
              <p className="px-3 py-3 text-center text-xs text-slate-400">A procurar...</p>
            ) : sugestoes.length === 0 ? (
              <p className="px-3 py-3 text-center text-xs text-slate-400">Nenhum produto encontrado.</p>
            ) : (
              sugestoes.map((p) => (
                <button
                  key={p.id}
                  onClick={() => associar(p.id)}
                  disabled={associarProduto.isPending}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-slate-50 disabled:opacity-50"
                >
                  <span className="truncate text-slate-700">{p.nome}</span>
                  <Plus className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {localizacao.produtos.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-400">
            Nenhum produto associado a esta localização.
          </p>
        ) : (
          localizacao.produtos.map((lp) => (
            <div key={lp.id} className="flex items-center gap-3 border-b border-slate-50 px-4 py-2.5">
              {lp.produto.imagemUrl ? (
                <img src={lp.produto.imagemUrl} alt="" className="h-8 w-8 rounded object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-slate-300">
                  <Package className="h-4 w-4" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-700">{lp.produto.nome}</p>
                {lp.produto.codigoBarras && <p className="text-[11px] text-slate-400">{lp.produto.codigoBarras}</p>}
              </div>
              <button
                onClick={() => desassociar(lp.produto.id)}
                className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                aria-label="Remover"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
