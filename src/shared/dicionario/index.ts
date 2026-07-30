/**
 * Dicionário de domínio partilhado com o backend (`01-DICIONARIO.md`).
 * Um conceito, um nome, um dono, um sítio.
 */

export const CODIGOS_MODULO = [
  'catalogo',
  'compras',
  'armazem',
  'loja',
  'pos',
  'precos',
  'clientes',
  'pessoas',
  'financeiro',
  'direccao',
  'administracao',
] as const;

export type CodigoModulo = (typeof CODIGOS_MODULO)[number];

export type ConceitoId =
  | 'artigo'
  | 'unidade_medida'
  | 'lote'
  | 'movimento_stock'
  | 'documento'
  | 'pessoa'
  | 'custo'
  | 'preco_em_vigor'
  | 'loja'
  | 'empresa'
  | 'evento'
  | 'subscricao';

export const CONCEITOS: ReadonlyArray<{ id: ConceitoId; nome: string }> = [
  { id: 'artigo', nome: 'Artigo' },
  { id: 'unidade_medida', nome: 'Unidade de Medida e Conversão' },
  { id: 'lote', nome: 'Lote' },
  { id: 'movimento_stock', nome: 'Movimento de Stock' },
  { id: 'documento', nome: 'Documento' },
  { id: 'pessoa', nome: 'Pessoa' },
  { id: 'custo', nome: 'Custo' },
  { id: 'preco_em_vigor', nome: 'Preço em Vigor' },
  { id: 'loja', nome: 'Loja' },
  { id: 'empresa', nome: 'Empresa (Tenant)' },
  { id: 'evento', nome: 'Evento' },
  { id: 'subscricao', nome: 'Subscrição' },
];

export const ROTAS_BANIDAS = [
  'customers',
  'finance',
  'hr',
  'stock',
  'inventory',
] as const;
