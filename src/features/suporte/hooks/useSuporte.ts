import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { entrarEmSuporte, getSessoesDeSuporte, getSuporteActual, sairDeSuporte } from '../api/suporte.api';

/**
 * Marca uma saída pedida pelo próprio Super Admin. Sem isto, o efeito abaixo tomava a
 * resposta «já não há sessão» por uma expiração e mandava para o painel por cima do destino
 * da saída (o `clear()` apaga a pergunta e ela refaz-se logo a seguir).
 */
let saidaPedida = false;

/**
 * Mantém a aplicação a par da sessão de suporte do servidor.
 *
 * A fonte da verdade é `GET /suporte/actual` e não o browser: a sessão expira ao fim de uma
 * hora ou é fechada pela plataforma sem o browser saber. Pergunta de minuto a minuto e de
 * cada vez que a janela volta ao primeiro plano, e põe o resultado no store — de onde o
 * `useAuth()` tira o papel efectivo (ADMIN da empresa) e a faixa o seu texto.
 *
 * Só para quem **é** Super Admin (o papel verdadeiro, do `user` guardado): para os outros a
 * rota responde sempre «não» e a pergunta seria um pedido à toa em cada ecrã.
 */
export function useSincronizarSuporte() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const eSuperAdmin = useAuthStore((s) => s.user?.role === 'SUPER_ADMIN');
  const definirSuporte = useAuthStore((s) => s.definirSuporte);
  const estavaEmSuporte = useRef(false);

  const { data } = useQuery({
    queryKey: ['suporte', 'actual'],
    queryFn: getSuporteActual,
    enabled: eSuperAdmin,
    refetchInterval: 60_000,
    retry: 1,
  });

  useEffect(() => {
    if (!data) return;
    if (data.activa) {
      estavaEmSuporte.current = true;
      definirSuporte({
        sessaoId: data.sessaoId,
        empresa: data.empresa,
        escrita: data.escrita,
        iniciadaEm: data.iniciadaEm,
        expiraEm: data.expiraEm,
      });
    } else {
      definirSuporte(null);
      // A sessão acabou sem o Super Admin carregar em «Sair» (expirou, ou foi fechada):
      // os dados em cache são da empresa e já não são dele.
      if (estavaEmSuporte.current && !saidaPedida) {
        queryClient.clear();
        navigate('/dashboard', { replace: true });
      }
      estavaEmSuporte.current = false;
      saidaPedida = false;
    }
  }, [data, definirSuporte, queryClient, navigate]);
}

/**
 * Entrar e sair mudam de âmbito: o que está em cache é da plataforma (ou da empresa) e não
 * serve do outro lado. `clear()` e não `invalidate`: invalidar deixava os dados antigos à
 * vista até chegarem os novos — durante um instante, a lista de uma empresa com o título
 * de outra.
 */
export function useModoSuporte() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const definirSuporte = useAuthStore((s) => s.definirSuporte);

  const entrar = useMutation({
    mutationFn: entrarEmSuporte,
    onSuccess: (sessao) => {
      queryClient.clear();
      definirSuporte(sessao);
      navigate('/dashboard', { replace: true });
    },
  });

  const sair = useMutation({
    mutationFn: sairDeSuporte,
    onSuccess: () => {
      saidaPedida = true;
      queryClient.clear();
      definirSuporte(null);
      navigate('/empresas', { replace: true });
    },
  });

  return { entrar, sair };
}

export function useSessoesDeSuporte() {
  return useQuery({ queryKey: ['suporte', 'sessoes'], queryFn: getSessoesDeSuporte });
}
