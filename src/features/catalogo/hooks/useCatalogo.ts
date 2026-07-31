import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adicionarCodigoBarras,
  activarArtigo,
  actualizarEstadoSortido,
  criarArtigo,
  criarConversaoCatalogo,
  criarFamilia,
  criarAtributoFamilia,
  criarMarca,
  criarSortido,
  criarUnidadeCatalogo,
  descontinuarArtigo,
  listarCodigosBarras,
  listarArtigos,
  listarAtributosFamilia,
  listarConversoesCatalogo,
  listarFamilias,
  listarMarcas,
  listarSortidos,
  listarUnidadesCatalogo,
  obterArtigo,
  obterSaudeCatalogo,
  apagarAtributoFamilia,
  actualizarAtributosArtigo,
  removerCodigoBarras,
  suspenderArtigo,
} from '../api/catalogo.api';
import type {
  CriarArtigoInput,
  CriarAtributoFamiliaInput,
  CriarCodigoBarrasInput,
  CriarConversaoInput,
  CriarFamiliaInput,
  CriarMarcaInput,
  CriarSortidoInput,
  CriarUnidadeInput,
  EstadoSortido,
} from '../types';

export function useArtigos(activo = true) {
  return useQuery({
    queryKey: ['catalogo', 'artigos'],
    queryFn: listarArtigos,
    enabled: activo,
  });
}

export function useArtigo(id?: string) {
  return useQuery({
    queryKey: ['catalogo', 'artigos', id],
    queryFn: () => obterArtigo(id as string),
    enabled: Boolean(id),
  });
}

export function useCodigosBarras(artigoId?: string) {
  return useQuery({
    queryKey: ['catalogo', 'artigos', artigoId, 'codigos-barras'],
    queryFn: () => listarCodigosBarras(artigoId as string),
    enabled: Boolean(artigoId),
  });
}

export function useUnidadesCatalogo(activo = true) {
  return useQuery({
    queryKey: ['catalogo', 'unidades'],
    queryFn: listarUnidadesCatalogo,
    enabled: activo,
  });
}

export function useConversoesCatalogo(artigoId?: string) {
  return useQuery({
    queryKey: ['catalogo', 'conversoes', artigoId ?? 'global'],
    queryFn: () => listarConversoesCatalogo(artigoId),
  });
}

export function useFamilias(activo = true) {
  return useQuery({
    queryKey: ['catalogo', 'familias'],
    queryFn: listarFamilias,
    enabled: activo,
  });
}

export function useMarcas(activo = true) {
  return useQuery({
    queryKey: ['catalogo', 'marcas'],
    queryFn: listarMarcas,
    enabled: activo,
  });
}

export function useSaudeCatalogo(activo = true) {
  return useQuery({
    queryKey: ['catalogo', 'saude'],
    queryFn: obterSaudeCatalogo,
    enabled: activo,
  });
}

export function useSortidos(lojaId?: string) {
  return useQuery({
    queryKey: ['catalogo', 'sortidos', lojaId ?? 'todas'],
    queryFn: () => listarSortidos(lojaId),
  });
}

export function useCriarArtigo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: CriarArtigoInput) => criarArtigo(dados),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalogo', 'artigos'] }),
  });
}

export function useActivarArtigo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activarArtigo(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['catalogo', 'artigos'] });
      qc.invalidateQueries({ queryKey: ['catalogo', 'artigos', id] });
    },
  });
}

function invalidarArtigo(qc: ReturnType<typeof useQueryClient>, id?: string) {
  qc.invalidateQueries({ queryKey: ['catalogo', 'artigos'] });
  if (id) {
    qc.invalidateQueries({ queryKey: ['catalogo', 'artigos', id] });
  }
}

export function useSuspenderArtigo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => suspenderArtigo(id),
    onSuccess: (_, id) => invalidarArtigo(qc, id),
  });
}

export function useDescontinuarArtigo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => descontinuarArtigo(id),
    onSuccess: (_, id) => invalidarArtigo(qc, id),
  });
}

export function useAdicionarCodigoBarras(artigoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: CriarCodigoBarrasInput) =>
      adicionarCodigoBarras(artigoId, dados),
    onSuccess: () => invalidarArtigo(qc, artigoId),
  });
}

export function useRemoverCodigoBarras(artigoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (codigoId: string) =>
      removerCodigoBarras(artigoId, codigoId),
    onSuccess: () => invalidarArtigo(qc, artigoId),
  });
}

export function useCriarUnidadeCatalogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: CriarUnidadeInput) => criarUnidadeCatalogo(dados),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalogo', 'unidades'] });
      qc.invalidateQueries({ queryKey: ['plataforma', 'unidades'] });
    },
  });
}

export function useCriarConversaoCatalogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: CriarConversaoInput) => criarConversaoCatalogo(dados),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['catalogo', 'conversoes'] }),
  });
}

export function useCriarFamilia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: CriarFamiliaInput) => criarFamilia(dados),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalogo', 'familias'] });
      qc.invalidateQueries({ queryKey: ['catalogo', 'saude'] });
    },
  });
}

export function useAtributosFamilia(familiaId?: string) {
  return useQuery({
    queryKey: ['catalogo', 'familias', familiaId, 'atributos'],
    queryFn: () => listarAtributosFamilia(familiaId as string),
    enabled: Boolean(familiaId),
  });
}

export function useCriarAtributoFamilia(familiaId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: CriarAtributoFamiliaInput) =>
      criarAtributoFamilia(familiaId, dados),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['catalogo', 'familias', familiaId, 'atributos'],
      });
      qc.invalidateQueries({ queryKey: ['catalogo', 'artigos'] });
    },
  });
}

export function useApagarAtributoFamilia(familiaId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (atributoId: string) => apagarAtributoFamilia(atributoId),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['catalogo', 'familias', familiaId, 'atributos'],
      });
      qc.invalidateQueries({ queryKey: ['catalogo', 'artigos'] });
    },
  });
}

export function useActualizarAtributosArtigo(artigoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (valores: Record<string, unknown>) =>
      actualizarAtributosArtigo(artigoId, valores),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalogo', 'artigos', artigoId] });
      qc.invalidateQueries({ queryKey: ['catalogo', 'saude'] });
    },
  });
}

export function useCriarMarca() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: CriarMarcaInput) => criarMarca(dados),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalogo', 'marcas'] });
      qc.invalidateQueries({ queryKey: ['catalogo', 'saude'] });
    },
  });
}

export function useCriarSortido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: CriarSortidoInput) => criarSortido(dados),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalogo', 'sortidos'] }),
  });
}

export function useActualizarEstadoSortido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      id: string;
      estado: EstadoSortido;
      motivoExclusao?: string;
    }) => actualizarEstadoSortido(args.id, args.estado, args.motivoExclusao),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalogo', 'sortidos'] }),
  });
}
