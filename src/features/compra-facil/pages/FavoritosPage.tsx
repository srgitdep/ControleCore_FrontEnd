import { Link, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, HeartOff, Loader2 } from 'lucide-react';
import { formatMoeda } from '@/shared/utils';
import { useContaClienteStore } from '../store/useContaClienteStore';
import { useAlternarFavorito, useFavoritos } from '../hooks/useFavoritos';
import { LojaTopo } from '../components/LojaTopo';
import { VoltarLink } from '../components/VoltarLink';

export function FavoritosPage() {
  const { lojaId } = useParams<{ lojaId: string }>();
  const { autenticado, aCarregar } = useContaClienteStore();
  const { data: favoritos, isLoading } = useFavoritos(lojaId);
  const { remover } = useAlternarFavorito();
  const { t } = useTranslation('loja');

  if (!lojaId) return null;

  if (!aCarregar && !autenticado) {
    return <Navigate to={`/loja/${lojaId}/entrar`} state={{ de: `/loja/${lojaId}/favoritos` }} replace />;
  }

  return (
    <div>
      <LojaTopo lojaId={lojaId} />

      <div className="cc-caixa max-w-2xl py-8">
        <VoltarLink to={`/loja/${lojaId}`}>{t('navegacao.voltar_catalogo')}</VoltarLink>

        <h1 className="mb-5 text-xl font-bold text-slate-900">{t('favoritos.titulo')}</h1>

        {(isLoading || aCarregar) && (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 size={22} className="animate-spin text-slate-400" />
          </div>
        )}

        {favoritos && favoritos.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 py-16 text-center">
            <Heart size={28} className="text-slate-300" />
            <p className="text-sm text-slate-500">{t('favoritos.vazio')}</p>
            <p className="text-xs text-slate-400">{t('favoritos.vazio_dica')}</p>
          </div>
        )}

        <div className="space-y-3">
          {favoritos?.map((favorito) => (
            <div
              key={favorito.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
            >
              <Link
                to={`/loja/${lojaId}/produtos/${favorito.produtoId}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                {favorito.produto.imagemUrl ? (
                  <img
                    src={favorito.produto.imagemUrl}
                    alt={favorito.produto.nome}
                    className="h-12 w-12 flex-shrink-0 rounded-lg bg-slate-100 object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-slate-100" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {favorito.produto.nome}
                  </p>
                  {favorito.produto.isActive ? (
                    <p className="text-sm font-semibold text-blue-700">
                      {formatMoeda(favorito.produto.precoComIva)}
                    </p>
                  ) : (
                    <p className="text-xs text-rose-600">{t('favoritos.produto_desactivado')}</p>
                  )}
                </div>
              </Link>

              <button
                type="button"
                onClick={() => remover.mutate(favorito.produtoId)}
                title={t('produto.desfavoritar')}
                className="flex-shrink-0 rounded-full p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
              >
                <HeartOff size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
