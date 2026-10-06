import { contaApi } from './conta.api';

/** As 11 províncias de Moçambique — a morada exige uma delas (não decide a taxa). */
export const PROVINCIAS_MOCAMBIQUE = [
  'Maputo Cidade',
  'Maputo Província',
  'Gaza',
  'Inhambane',
  'Sofala',
  'Manica',
  'Tete',
  'Zambézia',
  'Nampula',
  'Cabo Delgado',
  'Niassa',
] as const;

export interface EnderecoCliente {
  id: string;
  rotulo: string | null;
  linha1: string;
  referencia: string | null;
  bairro: string | null;
  cidade: string;
  provincia: string;
  latitude: number;
  longitude: number;
  contactoNome: string | null;
  contactoTelefone: string | null;
  isPadrao: boolean;
}

export type DadosEndereco = Omit<EnderecoCliente, 'id' | 'isPadrao'> & { isPadrao?: boolean };

export type CodigoMotivoEntrega =
  | 'entrega.desactivada'
  | 'entrega.loja_sem_coordenadas'
  | 'entrega.acima_do_raio'
  | 'entrega.fora_de_area'
  | 'entrega.abaixo_do_minimo';

/** Porque é que a entrega não está disponível — um código com parâmetros, traduzido aqui. */
export interface MotivoEntrega {
  codigo: CodigoMotivoEntrega;
  parametros?: Record<string, string | number>;
}

/** Tem de corresponder a `CotacaoEntrega` do backend (`entrega/domain/calcular-taxa.ts`). */
export interface CotacaoEntrega {
  disponivel: boolean;
  taxa: number;
  prazoMinutos: number | null;
  zonaId: string | null;
  distanciaKm: number | null;
  motivo?: MotivoEntrega;
}

export const entregaApi = {
  listarEnderecos: async () => {
    const { data } = await contaApi.get<EnderecoCliente[]>('/commerce/enderecos');
    return data;
  },

  criarEndereco: async (dados: DadosEndereco) => {
    const { data } = await contaApi.post<EnderecoCliente>('/commerce/enderecos', dados);
    return data;
  },

  actualizarEndereco: async (id: string, dados: Partial<DadosEndereco>) => {
    const { data } = await contaApi.patch<EnderecoCliente>(`/commerce/enderecos/${id}`, dados);
    return data;
  },

  removerEndereco: async (id: string) => {
    const { data } = await contaApi.delete<{ ok: true }>(`/commerce/enderecos/${id}`);
    return data;
  },

  cotar: async (payload: { lojaId: string; enderecoId: string; subtotal: number }) => {
    const { data } = await contaApi.post<CotacaoEntrega>('/commerce/entrega/cotacao', payload);
    return data;
  },
};
