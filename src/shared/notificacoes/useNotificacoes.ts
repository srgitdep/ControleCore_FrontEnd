import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useCanalDeEntregas } from '@/shared/hooks/useCanalDeEntregas';
import { eUrgente, textoDaNotificacao } from './texto';
import type { FonteDeNotificacoes, Notificacao } from './tipos';

const TRINTA_SEGUNDOS = 30_000;
/** Com o canal ligado, a consulta só serve de rede de segurança (um aviso perdido numa reconexão). */
const DOIS_MINUTOS = 120_000;

/**
 * As notificações de quem está com sessão (plano §4.7): o número do sino, a lista e as acções.
 *
 * ## Em tempo real, com recurso
 *
 * Liga ao canal `/entregas` e, quando chega `notificacao.nova`, refaz o contador e a lista e mostra um aviso
 * passageiro (mais demorado se for urgente: «o estafeta chegou», «nova entrega»). **Sem canal, consulta de 30 em
 * 30 s** — o contador nunca fica parado, só menos fresco. Com o canal ligado, a consulta passa a 2 min.
 *
 * `aberta` diz se o painel está aberto: a lista (mais pesada que o contador) só se pede quando alguém a vai ver.
 */
export function useNotificacoes(fonte: FonteDeNotificacoes, aberta: boolean, pagina = 1) {
  const { t } = useTranslation('notificacoes');
  const queryClient = useQueryClient();
  const chave = [fonte.chave] as const;

  const { ligado } = useCanalDeEntregas({
    activo: fonte.activo,
    obterToken: fonte.obterToken,
    eventos: {
      'notificacao.nova': ((n: Notificacao) => {
        void queryClient.invalidateQueries({ queryKey: chave });
        // O aviso passageiro: o contador sozinho não chama a atenção de quem está a olhar para outro ecrã.
        const texto = textoDaNotificacao(n, ((c: string, o?: Record<string, unknown>) => t(c as never, o as never)) as never);
        toast(texto, { duration: eUrgente(n) ? 9000 : 4500, id: n.id });
      }) as (d: never) => void,
    },
  });

  const contagem = useQuery({
    queryKey: [...chave, 'contagem'],
    queryFn: () => fonte.api.contagem(),
    enabled: fonte.activo,
    refetchInterval: ligado ? DOIS_MINUTOS : TRINTA_SEGUNDOS,
  });

  const lista = useQuery({
    queryKey: [...chave, 'lista', pagina],
    queryFn: () => fonte.api.listar(pagina),
    enabled: fonte.activo && aberta,
    placeholderData: (anterior) => anterior,
  });

  const marcarLida = useMutation({
    mutationFn: (id: string) => fonte.api.marcarLida(id),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: chave }),
  });

  const marcarTodasLidas = useMutation({
    mutationFn: () => fonte.api.marcarTodasLidas(),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: chave }),
  });

  return { naoLidas: contagem.data ?? 0, lista, marcarLida, marcarTodasLidas, ligado };
}
