import { api } from '@/shared/config';
import type {
  ConsumoPlano,
  ContextoAcesso,
  ConversaoCalculada,
  EstadoDaSubscricao,
  Plano,
  UnidadeMedida,
} from '../types';

export const obterContextoAcesso = () =>
  api.get<ContextoAcesso>('/acesso/simular').then((response) => response.data);

export const obterEstadoSubscricao = () =>
  api
    .get<EstadoDaSubscricao>('/subscricao/estado')
    .then((response) => response.data);

export const obterConsumoPlano = () =>
  api
    .get<ConsumoPlano[]>('/subscricao/consumo')
    .then((response) => response.data);

export const obterPlanos = () =>
  api.get<Plano[]>('/subscricao/planos').then((response) => response.data);

export const obterMapaEventos = () =>
  api
    .get<{ activos: string[]; aliases: Record<string, string> }>('/eventos/mapa')
    .then((response) => response.data);

export const obterRegistoEventos = (limite = 50) =>
  api
    .get<
      Array<{
        momento: string;
        nome: string;
        direccao: 'publicado' | 'consumido';
        empresaId: string | null;
        consumidor?: string;
      }>
    >('/eventos/registo', { params: { limite } })
    .then((response) => response.data);

export const obterUnidades = () =>
  api.get<UnidadeMedida[]>('/unidades').then((response) => response.data);

/** PLT-35 — simulador: "10 caixas = quanto em stock?" */
export const converterUnidade = (pedido: {
  de: string;
  para: string;
  quantidade: string;
  artigoId?: string;
}) =>
  api
    .get<ConversaoCalculada>('/unidades/converter', { params: pedido })
    .then((response) => response.data);
