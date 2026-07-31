import { useQuery } from '@tanstack/react-query';
import {
  obterConsumoPlano,
  obterContextoAcesso,
  obterEstadoSubscricao,
  obterMapaEventos,
  obterPlanos,
  obterRegistoEventos,
  obterUnidades,
} from '../api/plataforma.api';

export function useContextoAcesso(enabled = true) {
  return useQuery({
    queryKey: ['plataforma', 'acesso', 'actual'],
    queryFn: obterContextoAcesso,
    enabled,
    staleTime: 60_000,
  });
}

export function useEstadoSubscricao(enabled = true) {
  return useQuery({
    queryKey: ['plataforma', 'subscricao', 'estado'],
    queryFn: obterEstadoSubscricao,
    enabled,
    staleTime: 60_000,
  });
}

export function useConsumoPlano(enabled = true) {
  return useQuery({
    queryKey: ['plataforma', 'subscricao', 'consumo'],
    queryFn: obterConsumoPlano,
    enabled,
    staleTime: 60_000,
  });
}

export function usePlanos(enabled = true) {
  return useQuery({
    queryKey: ['plataforma', 'subscricao', 'planos'],
    queryFn: obterPlanos,
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useMapaEventos(enabled = true) {
  return useQuery({
    queryKey: ['plataforma', 'eventos', 'mapa'],
    queryFn: obterMapaEventos,
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useRegistoEventos(enabled = true) {
  return useQuery({
    queryKey: ['plataforma', 'eventos', 'registo'],
    queryFn: () => obterRegistoEventos(50),
    enabled,
    staleTime: 15_000,
  });
}

export function useUnidades(enabled = true) {
  return useQuery({
    queryKey: ['plataforma', 'unidades'],
    queryFn: obterUnidades,
    enabled,
    staleTime: 5 * 60_000,
  });
}
