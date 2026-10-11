import { useEffect } from 'react';
import { Link, Navigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bike, Loader2, LogOut, WifiOff } from 'lucide-react';
import { cn } from '@/shared/utils';
import { useMeuPerfil, useMudarEstado, useOnline } from '../hooks/useEstafeta';
import { ligarPwaDoEstafeta } from '../pwa';
import { useEstafetaStore } from '../store/useEstafetaStore';

/**
 * O invólucro da aplicação do estafeta: confirma a sessão no servidor, liga a PWA (só nestas rotas),
 * mostra quem é, o seu estado (disponível / indisponível) e avisa quando não há ligação.
 *
 * Fora do `ProtectedRoute` de propósito, como `/loja` e `/fornecedor`: esse guarda exige um `User` do
 * lado funcionário, e um estafeta não o é. Sem sessão manda para `/login` — o ecrã único, onde o
 * código `E####` entra.
 */
export function EstafetaLayout() {
  const { t } = useTranslation('estafeta');
  const { utilizador, autenticado, aCarregar, carregar, sair } = useEstafetaStore();
  const online = useOnline();
  const perfil = useMeuPerfil();
  const mudarEstado = useMudarEstado();

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => ligarPwaDoEstafeta(), []);

  if (aCarregar) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 size={26} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!autenticado) return <Navigate to="/login" replace />;

  const estado = perfil.data?.estado;
  const disponivel = estado === 'DISPONIVEL' || estado === 'EM_ENTREGA';

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link to="/estafeta" className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Bike size={18} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-slate-900">{utilizador?.nome}</span>
              <span className="block font-mono text-xs text-slate-400">{utilizador?.codigo}</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => void sair()}
            aria-label={t('sair')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Disponível ou indisponível: o gestor só atribui a quem está disponível. «Em entrega» deriva-se. */}
        {estado && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
            <span className="text-sm text-slate-600">
              {estado === 'EM_ENTREGA' ? t('estado.em_entrega') : disponivel ? t('estado.disponivel') : t('estado.indisponivel')}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={disponivel}
              aria-label={t('estado.alternar')}
              disabled={mudarEstado.isPending || !online}
              onClick={() => mudarEstado.mutate(disponivel ? 'INDISPONIVEL' : 'DISPONIVEL')}
              className={cn(
                'relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-50',
                disponivel ? 'bg-emerald-500' : 'bg-slate-300',
              )}
            >
              <span
                className={cn(
                  'absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all',
                  disponivel ? 'left-7' : 'left-1',
                )}
              />
            </button>
          </div>
        )}
      </header>

      {!online && (
        <p className="flex items-center gap-2 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800" role="alert">
          <WifiOff size={16} className="shrink-0" />
          {t('sem_ligacao')}
        </p>
      )}

      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}
