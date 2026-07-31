export type TipoArtigo =
  | 'MERCADORIA'
  | 'CONSUMIVEL_LOJA'
  | 'EMBALAGEM'
  | 'SERVICO'
  | 'ACTIVO_BAIXO_VALOR';

export type EstadoArtigo =
  | 'RASCUNHO'
  | 'ACTIVO'
  | 'SUSPENSO'
  | 'DESCONTINUADO'
  | 'ELIMINADO';

export type TipoUnidadeMedida = 'DISCRETA' | 'CONTINUA';

export type EstadoSortido =
  | 'PROPOSTO'
  | 'APROVADO'
  | 'EM_VENDA'
  | 'EM_ESCOAMENTO'
  | 'RETIRADO'
  | 'RECUSADO';

export interface UnidadeCatalogo {
  id: string;
  codigo: string;
  nome: string;
  simbolo: string;
  tipo: TipoUnidadeMedida;
  casasDecimais: number;
}

export interface ConversaoCatalogo {
  id: string;
  factor: string;
  artigoId: string | null;
  de: UnidadeCatalogo;
  para: UnidadeCatalogo;
}

export interface Familia {
  id: string;
  codigo: string;
  nome: string;
  nivel: number;
  paiId: string | null;
  pai?: { id: string; codigo: string; nome: string } | null;
  diasAvisoValidade?: number | null;
  margemAlvoPerc?: string | null;
  _count?: { artigos: number; filhos: number };
}

export interface CodigoBarrasArtigo {
  id: string;
  codigo: string;
  unidadeId: string;
  factor: string;
  principal: boolean;
  unidade?: UnidadeCatalogo;
}

export interface Artigo {
  id: string;
  codigo: string;
  nome: string;
  nomeCurto: string | null;
  codigoBarras: string | null;
  sku: string | null;
  tipo: TipoArtigo;
  estado: EstadoArtigo;
  pesavel: boolean;
  unidadeBaseId: string;
  unidadeCompraId?: string | null;
  unidadeVendaId?: string | null;
  familiaId?: string | null;
  unidadeBase?: UnidadeCatalogo;
  unidadeCompra?: UnidadeCatalogo | null;
  unidadeVenda?: UnidadeCatalogo | null;
  familia?: { id: string; codigo: string; nome: string; nivel?: number } | null;
  marca?: { id: string; codigo: string; nome: string } | null;
  descricao?: string | null;
  plu?: number | null;
  rastreavelPorLote?: boolean;
  temValidade?: boolean;
  taxaImpostoId?: string | null;
  codigosBarrasAdicionais?: CodigoBarrasArtigo[];
  atributos?: Record<string, unknown> | null;
  atributosDefinicoes?: DefinicaoAtributoEfectiva[];
  heranca?: HerancaFamilia | null;
  saude?: {
    preenchidas: string[];
    emFalta: string[];
    completudePerc: number;
  };
  diasAvisoValidadeEfectivo?: number | null;
  margemAlvoFamiliaPerc?: string | null;
  avisos?: string[];
}

export interface Sortido {
  id: string;
  artigoId: string;
  lojaId: string;
  vigenteDe: string;
  vigenteAte: string | null;
  estado: EstadoSortido;
  localizacao: string | null;
  facing: number | null;
  artigo?: { id: string; codigo: string; nome: string; estado: string };
  loja?: { id: string; nome: string };
}

export interface CriarArtigoInput {
  codigo: string;
  nome: string;
  nomeCurto?: string;
  codigoBarras?: string;
  sku?: string;
  tipo?: TipoArtigo;
  unidadeBaseId: string;
  unidadeCompraId?: string;
  unidadeVendaId?: string;
  pesavel?: boolean;
  plu?: number;
  familiaId?: string;
  marcaId?: string;
}

export interface CriarFamiliaInput {
  codigo: string;
  nome: string;
  paiId?: string | null;
  diasAvisoValidade?: number | null;
  margemAlvoPerc?: string | number | null;
}

export interface CriarSortidoInput {
  artigoId: string;
  lojaId: string;
  estado?: EstadoSortido;
  localizacao?: string;
  facing?: number;
  stockMinimoLoja?: string | number;
  stockMaximoLoja?: string | number;
}

export interface CriarUnidadeInput {
  codigo: string;
  nome: string;
  simbolo: string;
  tipo: TipoUnidadeMedida;
  casasDecimais?: number;
}

export interface CriarConversaoInput {
  deId: string;
  paraId: string;
  factor: string | number;
  artigoId?: string | null;
}

export interface CriarCodigoBarrasInput {
  codigo: string;
  unidadeId: string;
  factor: string | number;
  principal?: boolean;
}

export interface Marca {
  id: string;
  codigo: string;
  nome: string;
  marcaPropria: boolean;
  logoUrl?: string | null;
  _count?: { artigos: number };
}

export interface CriarMarcaInput {
  codigo: string;
  nome: string;
  marcaPropria?: boolean;
}

export interface SaudeCatalogo {
  totais: {
    artigos: number;
    activos: number;
    fichasIncompletas: number;
    activosSemSortido: number;
    completudeMediaPerc: number;
  };
  dimensoes: Array<{
    codigo: string;
    nome: string;
    peso: number;
    contagem: number;
  }>;
  avisos: string[];
}

export interface HerancaFamilia {
  familiaId: string;
  familiaCodigo: string;
  familiaNome: string;
  diasAvisoValidade: number | null;
  margemAlvoPerc: string | null;
  origemDiasAviso: string | null;
  origemMargemAlvo: string | null;
}

export type TipoAtributoFamilia =
  | 'TEXTO'
  | 'NUMERICO'
  | 'LISTA'
  | 'BOOLEANO'
  | 'DATA';

export interface AtributoFamilia {
  id: string;
  familiaId: string;
  codigo: string;
  nome: string;
  tipo: TipoAtributoFamilia;
  valoresPermitidos?: string[] | null;
  obrigatorio: boolean;
  pesquisavel: boolean;
  visivelNoPOS: boolean;
  ordem: number;
}

export interface DefinicaoAtributoEfectiva {
  codigo: string;
  nome: string;
  tipo: TipoAtributoFamilia;
  valoresPermitidos: string[] | null;
  obrigatorio: boolean;
  pesquisavel: boolean;
  visivelNoPOS: boolean;
  ordem: number;
  origemFamiliaCodigo: string;
  origemFamiliaId: string;
  definicaoId: string;
}

export interface CriarAtributoFamiliaInput {
  codigo: string;
  nome: string;
  tipo: TipoAtributoFamilia;
  valoresPermitidos?: string[] | null;
  obrigatorio?: boolean;
  pesquisavel?: boolean;
  visivelNoPOS?: boolean;
  ordem?: number;
}

