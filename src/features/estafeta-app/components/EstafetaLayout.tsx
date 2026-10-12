import { useEffect } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bike, Loader2, LogOut, WifiOff } from 'lucide-react';
import { useMeuPerfil, useMinhasEntregas, useOnline } from '../hooks/useEstafeta';
import { useEmitirPosicao } from '../hooks/useEmitirPosicao';
import { useOfertas } from '../hooks/useOfertas';
import { InterruptorOnline } from './InterruptorOnline';
import { OfertaDeEntrega } from './OfertaDeEntrega';
import { PartilhaDePosicao } from './PartilhaDePosicao';
import { SinoDeNotificacoes } from '@/shared/ui';
import { useFonteDoEstafeta } from '../hooks/useFonteDoEstafeta';
import { ligarPwaDoEstafeta } from '../pwa';
import { useEstafetaStore } from '../store/useEstafetaStore';

/** A rota do assistente de documentos: é a única que alguém em onboarding alcança. */
const ROTA_DO_ONBOARDING = '/estafeta/onboarding';

/**
 * O invólucro da aplicação do estafeta: confirma a sessão no servidor, liga a PWA (só nestas rotas),
 * mostra quem é, o seu estado (online / disponível) e avisa quando não há ligação.
 *
 * ## O onboarding fecha as outras rotas (plano §4.9, D15)
 *
 * Quem ainda não completou o registo só vê o assistente de documentos: qualquer outra rota redirecciona para ele. É
 * cortesia — o servidor recusa na mesma (403) tudo o que não seja do assistente. Um estafeta **anterior** ao
 * onboarding tem-no «completo» e não é redireccionado: a sua frota não pára por uma regra nova.
 *
 * ## Um só canal para a posição e as ofertas
 *
 * `useEmitirPosicao` abre o canal de tempo real e devolve-o; as ofertas (`oferta.nova`) escutam-se nesse mesmo
 * canal. Um estafeta online da plataforma partilha a posição para ser escolhido por proximidade — e é por aí que a
 * oferta lhe chega.
 *
 * Fora do `ProtectedRoute` de propósito, como `/loja` e `/fornecedor`: esse guarda exige um `User` do
 * lado funcionário, e um estafeta não o é. Sem sessão manda para `/login` — o ecrã único, onde o
 * código `E####` entra.
 */
export function EstafetaLayout() {
  const { t } = useTranslation('estafeta');
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { utilizador, autenticado, aCarregar, carregar, sair } = useEstafetaStore();
  const rede = useOnline();
  const perfil = useMeuPerfil();
  // A mesma consulta da lista (mesma chave): não gera pedido novo. É ela que diz se há uma entrega em rota.
  const entregas = useMinhasEntregas(false);
  const emRota = (entregas.data ?? []).some((e) => e.estado === 'EM_ROTA');
  const fonteDeNotificacoes = useFonteDoEstafeta();

  const dados = perfil.data;
  const daPlataforma = dados?.frota === 'PLATAFORMA';
  // Só o estafeta da plataforma partilha a posição por estar online: a frota própria não precisa dela para nada.
  const onlineComPosicao = daPlataforma && !!dados?.online && dados.onboardingCompleto;

  const partilha = useEmitirPosicao({ emRota, online: onlineComPosicao });
  const ofertas = useOfertas({
    activo: onlineComPosicao,
    socket: partilha.socket,
    aoAceitar: (entregaId) => navigate(`/estafeta/entregas/${entregaId}`),
  });

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

  // Em onboarding só há o assistente. Espera-se pelo perfil: redireccionar com ele por carregar mandava quem já
  // completou o registo para o assistente por um instante.
  if (dados && !dados.onboardingCompleto && pathname !== ROTA_DO_ONBOARDING) {
    return <Navigate to={ROTA_DO_ONBOARDING} replace />;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
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

          {/* O sino das notificações: entrega nova, ou «já não é sua». Com a aplicação aberta; fechada, não há aviso. */}
          <SinoDeNotificacoes fonte={fonteDeNotificacoes} className="ml-auto" />

          <button
            type="button"
            onClick={() => void sair()}
            aria-label={t('sair')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Online (plataforma) ou disponível (frota própria). Só com o onboarding completo: antes disso o servidor
            não deixa ficar online, e o botão seria uma promessa que não se cumpre. */}
        {dados && dados.onboardingCompleto && <InterruptorOnline perfil={dados} semRede={!rede} />}
      </header>

      {!rede && (
        <p className="flex items-center gap-2 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800" role="alert">
          <WifiOff size={16} className="shrink-0" />
          {t('sem_ligacao')}
        </p>
      )}

      <PartilhaDePosicao estado={partilha.estado} consentir={partilha.consentir} modo={partilha.modo} />

      <main className="flex-1 p-4">
        <Outlet />
      </main>

      {ofertas.oferta && (
        <OfertaDeEntrega
          oferta={ofertas.oferta}
          segundosRestantes={ofertas.segundosRestantes}
          aceitar={() => ofertas.aceitar.mutate(ofertas.oferta!.id)}
          recusar={() => ofertas.recusar.mutate(ofertas.oferta!.id)}
          aAceitar={ofertas.aceitar.isPending}
          aRecusar={ofertas.recusar.isPending}
        />
      )}
    </div>
  );
}
