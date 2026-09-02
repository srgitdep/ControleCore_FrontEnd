import { api } from '@/shared/config';

/**
 * Alertas: o que precisa de uma decisão, e não tudo o que aconteceu.
 *
 * O histórico do sistema já regista tudo o que se passou, para quem for procurar depois. Isto
 * é o que vai ter com a pessoa — e é por isso que são poucos e ordenados por urgência, e não
 * por data.
 */

export type TipoAlerta =
  | 'STOCK_BAIXO'
  | 'STOCK_RUPTURA'
  | 'VALIDADE_PROXIMA'
  | 'VALIDADE_EXPIRADA'
  | 'RECEPCAO_DIVERGENCIA'
  | 'TRANSFERENCIA_PERDA'
  | 'INVENTARIO_PERDA'
  | 'REQUISICAO_PENDENTE'
  | 'RESERVA_EXPIRADA'
  | 'DIVIDA_VENCIDA';

export type SeveridadeAlerta = 'INFO' | 'AVISO' | 'CRITICO';

export interface Alerta {
  id: string;
  tipo: TipoAlerta;
  severidade: SeveridadeAlerta;
  titulo: string;
  mensagem: string;
  entidade: string | null;
  entidadeId: string | null;
  dados: Record<string, unknown> | null;
  lidoEm: string | null;
  resolvidoEm: string | null;
  createdAt: string;
  lidoPor: { name: string } | null;
}

export interface ContagemAlertas {
  total: number;
  criticos: number;
}

export const alertasApi = {
  listar: async (filtros?: { porLer?: boolean; tipo?: TipoAlerta; limite?: number }) => {
    const { data } = await api.get<Alerta[]>('/alertas', {
      params: {
        ...(filtros?.porLer ? { porLer: true } : {}),
        ...(filtros?.tipo ? { tipo: filtros.tipo } : {}),
        ...(filtros?.limite ? { limite: filtros.limite } : {}),
      },
    });
    return data;
  },

  /**
   * Só o número, sem o conteúdo.
   *
   * É pedido a cada carregamento de página; trazer cinquenta linhas para mostrar um número
   * seria trabalho a mais em cada navegação.
   */
  contar: async () => {
    const { data } = await api.get<ContagemAlertas>('/alertas/contagem');
    return data;
  },

  marcarLido: async (id: string) => {
    const { data } = await api.patch<Alerta>(`/alertas/${id}/lido`);
    return data;
  },

  marcarTodos: async () => {
    const { data } = await api.post<{ marcados: number }>('/alertas/lidos');
    return data;
  },
};

/** Para onde levar quem carrega num alerta. */
export function destinoDoAlerta(alerta: Alerta): string | null {
  switch (alerta.entidade) {
    case 'Stock':
      return alerta.entidadeId ? `/stock/${alerta.entidadeId}` : '/stock';
    case 'SessaoRecepcao':
      return alerta.entidadeId ? `/recepcoes/${alerta.entidadeId}` : '/recepcoes';
    case 'Transferencia':
      return '/transferencias';
    case 'InventoryCycle':
      return '/stock?tab=inventario';
    case 'RequisicaoCompra':
      return '/requisicoes';
    case 'ReservaStock':
      return '/stock?tab=reservas';
    case 'Cliente':
      return alerta.entidadeId ? `/crm?cliente=${alerta.entidadeId}` : '/crm';
    default:
      return null;
  }
}
