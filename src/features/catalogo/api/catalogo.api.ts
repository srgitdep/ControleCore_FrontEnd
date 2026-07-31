import { api } from '@/shared/config';
import type {
  Artigo,
  CodigoBarrasArtigo,
  ConversaoCatalogo,
  CriarArtigoInput,
  CriarCodigoBarrasInput,
  CriarConversaoInput,
  CriarFamiliaInput,
  CriarMarcaInput,
  CriarAtributoFamiliaInput,
  CriarSortidoInput,
  CriarUnidadeInput,
  EstadoSortido,
  Familia,
  AtributoFamilia,
  DefinicaoAtributoEfectiva,
  Marca,
  SaudeCatalogo,
  Sortido,
  UnidadeCatalogo,
} from '../types';

export const listarArtigos = () =>
  api.get<Artigo[]>('/catalogo/artigos').then((r) => r.data);

export const obterArtigo = (id: string) =>
  api.get<Artigo>(`/catalogo/artigos/${id}`).then((r) => r.data);

export const criarArtigo = (dados: CriarArtigoInput) =>
  api.post<Artigo>('/catalogo/artigos', dados).then((r) => r.data);

export const activarArtigo = (id: string) =>
  api.post<Artigo>(`/catalogo/artigos/${id}/activar`).then((r) => r.data);

export const suspenderArtigo = (id: string) =>
  api.post<Artigo>(`/catalogo/artigos/${id}/suspender`).then((r) => r.data);

export const descontinuarArtigo = (id: string) =>
  api.post<Artigo>(`/catalogo/artigos/${id}/descontinuar`).then((r) => r.data);

export const listarCodigosBarras = (artigoId: string) =>
  api
    .get<CodigoBarrasArtigo[]>(`/catalogo/artigos/${artigoId}/codigos-barras`)
    .then((r) => r.data);

export const adicionarCodigoBarras = (
  artigoId: string,
  dados: CriarCodigoBarrasInput,
) =>
  api
    .post<CodigoBarrasArtigo>(
      `/catalogo/artigos/${artigoId}/codigos-barras`,
      dados,
    )
    .then((r) => r.data);

export const removerCodigoBarras = (artigoId: string, codigoId: string) =>
  api.delete(`/catalogo/artigos/${artigoId}/codigos-barras/${codigoId}`);

export const listarUnidadesCatalogo = () =>
  api.get<UnidadeCatalogo[]>('/catalogo/unidades').then((r) => r.data);

export const criarUnidadeCatalogo = (dados: CriarUnidadeInput) =>
  api.post<UnidadeCatalogo>('/catalogo/unidades', dados).then((r) => r.data);

export const listarConversoesCatalogo = (artigoId?: string) =>
  api
    .get<ConversaoCatalogo[]>('/catalogo/conversoes', {
      params: artigoId ? { artigoId } : undefined,
    })
    .then((r) => r.data);

export const criarConversaoCatalogo = (dados: CriarConversaoInput) =>
  api.post<ConversaoCatalogo>('/catalogo/conversoes', dados).then((r) => r.data);

export const listarFamilias = () =>
  api.get<Familia[]>('/catalogo/familias').then((r) => r.data);

export const criarFamilia = (dados: CriarFamiliaInput) =>
  api.post<Familia>('/catalogo/familias', dados).then((r) => r.data);

export const listarAtributosFamilia = (familiaId: string) =>
  api
    .get<AtributoFamilia[]>(`/catalogo/familias/${familiaId}/atributos`)
    .then((r) => r.data);

export const listarAtributosEfectivos = (familiaId: string) =>
  api
    .get<DefinicaoAtributoEfectiva[]>(
      `/catalogo/familias/${familiaId}/atributos/efectivos`,
    )
    .then((r) => r.data);

export const criarAtributoFamilia = (
  familiaId: string,
  dados: CriarAtributoFamiliaInput,
) =>
  api
    .post<AtributoFamilia>(`/catalogo/familias/${familiaId}/atributos`, dados)
    .then((r) => r.data);

export const apagarAtributoFamilia = (atributoId: string) =>
  api.delete(`/catalogo/familias/atributos/${atributoId}`);

export const actualizarAtributosArtigo = (
  artigoId: string,
  valores: Record<string, unknown>,
) =>
  api
    .patch<Artigo>(`/catalogo/artigos/${artigoId}/atributos`, { valores })
    .then((r) => r.data);

export const listarMarcas = () =>
  api.get<Marca[]>('/catalogo/marcas').then((r) => r.data);

export const criarMarca = (dados: CriarMarcaInput) =>
  api.post<Marca>('/catalogo/marcas', dados).then((r) => r.data);

export const obterSaudeCatalogo = () =>
  api.get<SaudeCatalogo>('/catalogo/saude').then((r) => r.data);

export const listarSortidos = (lojaId?: string) =>
  api
    .get<Sortido[]>('/catalogo/sortidos', {
      params: lojaId ? { lojaId } : undefined,
    })
    .then((r) => r.data);

export const criarSortido = (dados: CriarSortidoInput) =>
  api.post<Sortido>('/catalogo/sortidos', dados).then((r) => r.data);

export const actualizarEstadoSortido = (
  id: string,
  estado: EstadoSortido,
  motivoExclusao?: string,
) =>
  api
    .patch<Sortido>(`/catalogo/sortidos/${id}/estado`, { estado, motivoExclusao })
    .then((r) => r.data);
