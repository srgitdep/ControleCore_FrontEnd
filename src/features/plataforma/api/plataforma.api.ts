import { api } from '@/shared/config';
import type {
  ConsumoPlano,
  ContextoAcesso,
  EstadoDaSubscricao,
  Plano,
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
