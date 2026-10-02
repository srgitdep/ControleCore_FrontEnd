import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import i18n from '@/i18n';
import { formatDataHora } from '@/shared/utils';
import { reservasApi, type CriarReservaPayload, type LibertarPayload, type ReterPayload } from '../api/reservas.api';
import type { EstadoReserva } from '../types/stock.types';

export function useReservas(params?: {
  estado?: EstadoReserva;
  stockId?: string;
  produtoId?: string;
}) {
  return useQuery({
    queryKey: ['reservas', params],
    queryFn: () => reservasApi.listar(params),
    placeholderData: (prev) => prev,
  });
}

/**
 * As mutações de reserva e retenção.
 *
 * ## Invalidam o stock, não só as reservas
 *
 * Reservar não altera a existência física, mas altera o **disponível** — que é o número que
 * a listagem de stock mostra desde que a verificação existe no abate. Invalidar só
 * `['reservas']` deixaria a tabela de stock a anunciar mercadoria que acabou de ser
 * comprometida, e o operador tentaria vendê-la.
 *
 * `['saude-stock']` entra pela mesma razão: o disponível conta para os dias de cobertura.
 */
export function useReservaMutations() {
  const queryClient = useQueryClient();

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['reservas'] });
    queryClient.invalidateQueries({ queryKey: ['stocks'] });
    queryClient.invalidateQueries({ queryKey: ['stock'] });
    queryClient.invalidateQueries({ queryKey: ['saude-stock'] });
    // O POS e o catálogo lêem disponibilidade a partir desta chave.
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const aoFalhar = (erro: any) => {
    // A mensagem do servidor é a que interessa: diz quantas unidades estão reservadas, em
    // quarentena ou bloqueadas, e quantas faltam. Substituí-la por «ocorreu um erro» apagaria
    // precisamente a informação que resolve o problema.
    toast.error(erro?.response?.data?.message || i18n.t('stock:operacao.erro_generico'));
  };

  const criar = useMutation({
    mutationFn: (payload: CriarReservaPayload) => reservasApi.criar(payload),
    onSuccess: (reserva) => {
      invalidar();
      toast.success(
        reserva.expiraEm
          ? i18n.t('stock:reservas.criada_ate', {
              count: reserva.quantidade,
              data: formatDataHora(reserva.expiraEm),
            })
          : i18n.t('stock:reservas.criada_sem_prazo', { count: reserva.quantidade }),
      );
    },
    onError: aoFalhar,
  });

  const libertar = useMutation({
    mutationFn: ({ reservaId, motivo }: { reservaId: string; motivo?: string }) =>
      reservasApi.libertar(reservaId, { motivo }),
    onSuccess: (reserva) => {
      invalidar();
      toast.success(i18n.t('stock:reservas.libertada', { count: reserva.quantidade }));
    },
    onError: aoFalhar,
  });

  const expirarAgora = useMutation({
    mutationFn: () => reservasApi.expirarAgora(),
    onSuccess: (resultado) => {
      invalidar();
      toast.success(
        resultado.expiradas === 0
          ? i18n.t('stock:reservas.nenhuma_caducada')
          : i18n.t('stock:reservas.caducadas', {
              count: resultado.expiradas,
              unidades: resultado.quantidadeLibertada,
            }),
      );
    },
    onError: aoFalhar,
  });

  const reterEmQuarentena = useMutation({
    mutationFn: ({ stockId, ...payload }: ReterPayload & { stockId: string }) =>
      reservasApi.reterEmQuarentena(stockId, payload),
    onSuccess: (posicao) => {
      invalidar();
      toast.success(
        i18n.t('stock:reservas.quarentena_aplicada', { disponivel: posicao.estados.disponivel }),
      );
    },
    onError: aoFalhar,
  });

  const libertarDaQuarentena = useMutation({
    mutationFn: ({ stockId, ...payload }: LibertarPayload & { stockId: string }) =>
      reservasApi.libertarDaQuarentena(stockId, payload),
    onSuccess: (posicao) => {
      invalidar();
      toast.success(
        i18n.t('stock:reservas.quarentena_libertada', { disponivel: posicao.estados.disponivel }),
      );
    },
    onError: aoFalhar,
  });

  const bloquear = useMutation({
    mutationFn: ({ stockId, ...payload }: ReterPayload & { stockId: string }) =>
      reservasApi.bloquear(stockId, payload),
    onSuccess: (posicao) => {
      invalidar();
      toast.success(
        i18n.t('stock:reservas.bloqueada', { disponivel: posicao.estados.disponivel }),
      );
    },
    onError: aoFalhar,
  });

  const desbloquear = useMutation({
    mutationFn: ({ stockId, ...payload }: LibertarPayload & { stockId: string }) =>
      reservasApi.desbloquear(stockId, payload),
    onSuccess: (posicao) => {
      invalidar();
      toast.success(
        i18n.t('stock:reservas.desbloqueada', { disponivel: posicao.estados.disponivel }),
      );
    },
    onError: aoFalhar,
  });

  return {
    criar,
    libertar,
    expirarAgora,
    reterEmQuarentena,
    libertarDaQuarentena,
    bloquear,
    desbloquear,
    aDecorrer:
      criar.isPending ||
      libertar.isPending ||
      expirarAgora.isPending ||
      reterEmQuarentena.isPending ||
      libertarDaQuarentena.isPending ||
      bloquear.isPending ||
      desbloquear.isPending,
  };
}
