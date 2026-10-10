import { useEffect, useState } from 'react';
import { registarProcura } from '../telemetria';
import { useParams } from 'react-router-dom';
import { Loader2, Minus, Package, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { formatMoeda } from '@/shared/utils';
import { useProdutoLoja } from '../hooks/useCatalogoCommerce';
import { useCarrinhoStore } from '../store/useCarrinhoStore';
import { LojaTopo } from '../components/LojaTopo';
import { VoltarLink } from '../components/VoltarLink';

export function ProdutoDetalhePage() {
  const { lojaId, produtoId } = useParams<{ lojaId: string; produtoId: string }>();
  const { data: produto, isLoading, isError } = useProdutoLoja(lojaId, produtoId);
  const adicionar = useCarrinhoStore((s) => s.adicionar);
  const [quantidade, setQuantidade] = useState(1);
  // Começa em 0 e segue a imagem principal quando os dados chegam — não pode
  // depender de `produto` no valor inicial, porque este hook corre antes dos
  // retornos condicionais abaixo (isLoading/isError), antes de `produto` existir.
  const [imagemActiva, setImagemActiva] = useState(0);
  const { t } = useTranslation('loja');

  // Uma visita ao produto (conta quando os dados chegam, não à montagem: um id inválido não é uma vista).
  useEffect(() => {
    if (lojaId && produto) registarProcura({ tipo: 'PRODUTO_VISTO', lojaId, produtoId: produto.id });
  }, [lojaId, produto?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!produto) return;
    const indice = produto.imagens.findIndex((i) => i.isPrincipal);
    if (indice >= 0) setImagemActiva(indice);
  }, [produto]);

  if (!lojaId || !produtoId) return null;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={22} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (isError || !produto) {
    return (
      <div className="cc-caixa py-16 text-center">
        <p className="text-sm text-slate-500">{t('produto.nao_encontrado')}</p>
        <div className="mt-2 flex justify-center">
          <VoltarLink to={`/loja/${lojaId}`}>{t('navegacao.voltar_catalogo')}</VoltarLink>
        </div>
      </div>
    );
  }

  const handleAdicionar = () => {
    const resultado = adicionar(lojaId, produto, quantidade);
    if (!resultado.ok) {
      toast.error(t('carrinho.apenas_disponiveis', { count: resultado.disponivel }));
      return;
    }
    toast.success(t('produto.adicionado', { nome: produto.nome }));
    registarProcura({ tipo: 'CARRINHO_ADICIONADO', lojaId, produtoId: produto.id, quantidade });
    setQuantidade(1);
  };

  const imagens = produto.imagens.length > 0
    ? produto.imagens
    : produto.imagemUrl
      ? [{ url: produto.imagemUrl, ordem: 0, isPrincipal: true }]
      : [];
  const imagemEmDestaque = imagens[imagemActiva]?.url ?? null;

  return (
    <div>
      <LojaTopo lojaId={lojaId} />

      <div className="cc-caixa py-8">
        <VoltarLink to={`/loja/${lojaId}`}>{t('navegacao.voltar_catalogo')}</VoltarLink>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-slate-50">
              {imagemEmDestaque ? (
                <img src={imagemEmDestaque} alt={produto.nome} className="h-full w-full object-cover" />
              ) : (
                <Package size={64} className="text-slate-300" />
              )}
            </div>

            {imagens.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {imagens.map((imagem, indice) => (
                  <button
                    key={imagem.url ?? indice}
                    type="button"
                    onClick={() => setImagemActiva(indice)}
                    className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${
                      indice === imagemActiva ? 'border-blue-600' : 'border-transparent'
                    }`}
                  >
                    {imagem.url ? (
                      <img src={imagem.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-50">
                        <Package size={18} className="text-slate-300" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {produto.categoria && (
              <p className="text-xs uppercase tracking-wide text-slate-400">{produto.categoria.nome}</p>
            )}
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{produto.nome}</h1>

            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-3xl font-bold text-slate-900">{formatMoeda(produto.precoComIva)}</p>
              <p className="text-xs text-slate-400">{t('iva_incluido')}</p>
              {produto.precoOriginal != null && (
                <>
                  <p className="text-base text-slate-400 line-through">{formatMoeda(produto.precoOriginalComIva ?? produto.precoOriginal)}</p>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                    {t('produto.desconto', { percentual: produto.percentualDesconto })}
                  </span>
                </>
              )}
            </div>
            <p className="text-sm text-slate-400">{t('produto.por_unidade', { unidade: produto.unidadeMedida.toLowerCase() })}</p>

            {produto.descricao && (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {produto.descricao}
              </p>
            )}

            <div className="mt-6">
              {produto.disponivel ? (
                <>
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex items-center rounded-lg border border-slate-300">
                      <button
                        type="button"
                        onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                        className="flex h-10 w-10 items-center justify-center text-slate-600 hover:bg-slate-50"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center text-sm font-medium">{quantidade}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantidade((q) => Math.min(produto.quantidadeDisponivel, q + 1))
                        }
                        className="flex h-10 w-10 items-center justify-center text-slate-600 hover:bg-slate-50"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">
                      {t('produto.disponiveis', { count: produto.quantidadeDisponivel })}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAdicionar}
                    className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    {t('produto.adicionar')}
                  </button>
                </>
              ) : (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {t('produto.sem_stock')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
