/**
 * Os dados do preçário público.
 *
 * Em código e não vindos da API, de propósito: a página de preços é pública e
 * tem de pintar sem depender do servidor — um pedido à API antes de mostrar o
 * preço falha exactamente quando o servidor está em baixo, que é quando mais
 * interessa parecer uma empresa a funcionar. É a mesma decisão do catálogo
 * `/modulos` (preço por módulo, administrado em `features/modulos`): aqui os
 * três escalões agrupam esses módulos numa oferta que se vende, não o CRUD
 * interno de plataforma.
 *
 * Aqui ficam só números, códigos e booleanos. Os textos (nomes, frases, rótulos,
 * perguntas) vivem no catálogo `precos` e indexam-se pelo `codigo` de cada item:
 * traduzir é trocar o catálogo, nunca esta tabela, e um `codigo` sem texto no
 * catálogo é erro de compilação (as chaves do `t()` são verificadas contra o
 * catálogo português).
 */

import type catalogo from '@/locales/pt/precos.json';

/** Os códigos vêm do catálogo: uma capacidade ou módulo sem texto não compila. */
export type CodigoDeCapacidade = keyof (typeof catalogo)['capacidade'];
export type CodigoDeModulo = keyof (typeof catalogo)['modulo'];

export type Escalao = 'loja' | 'rede' | 'enterprise';

/** Os limites que cada cartão mostra, pela ordem em que aparecem. */
export type CodigoDeLimite = 'lojas' | 'utilizadores' | 'armazens' | 'mayra' | 'historico';

export interface Limite {
  codigo: CodigoDeLimite;
  /** `null` é «sem limite»; o resto é a quantidade (perguntas por mês, anos de histórico, etc.). */
  valor: number | null;
}

export interface Plano {
  codigo: Escalao;
  mensal: number;
  anual: number;
  lojas: number;
  utilizadores: number;
  destacado?: boolean;
  limites: Limite[];
}

/** O anual é dez vezes o mensal — dois meses grátis, igual à convenção do sector. */
export const PLANOS: Plano[] = [
  {
    codigo: 'loja',
    mensal: 6_500,
    anual: 65_000,
    lojas: 1,
    utilizadores: 5,
    limites: [
      { codigo: 'lojas', valor: 1 },
      { codigo: 'utilizadores', valor: 5 },
      { codigo: 'armazens', valor: 1 },
      { codigo: 'mayra', valor: 500 },
      { codigo: 'historico', valor: 1 },
    ],
  },
  {
    codigo: 'rede',
    mensal: 14_900,
    anual: 149_000,
    lojas: 5,
    utilizadores: 20,
    // O do meio é o que responde à maioria dos casos, e dizê-lo poupa tempo a
    // quem lê. Não é manipulação: é informação.
    destacado: true,
    limites: [
      { codigo: 'lojas', valor: 5 },
      { codigo: 'utilizadores', valor: 20 },
      { codigo: 'armazens', valor: null },
      { codigo: 'mayra', valor: 4_000 },
      { codigo: 'historico', valor: 3 },
    ],
  },
  {
    codigo: 'enterprise',
    mensal: 32_900,
    anual: 329_000,
    lojas: Infinity,
    utilizadores: 60,
    limites: [
      { codigo: 'lojas', valor: null },
      { codigo: 'utilizadores', valor: 60 },
      { codigo: 'armazens', valor: null },
      { codigo: 'mayra', valor: 15_000 },
      { codigo: 'historico', valor: 7 },
    ],
  },
];

/** Desce com o volume: o custo marginal do 40.º utilizador é menor do que o do 10.º. */
export const ESCALOES_UTILIZADOR = [
  { ate: 15, preco: 420 },
  { ate: 40, preco: 340 },
  { ate: Infinity, preco: 260 },
];

export function precoPorUtilizadorExtra(total: number): number {
  return ESCALOES_UTILIZADOR.find((e) => total <= e.ate)?.preco ?? 260;
}

// ── As capacidades, por módulo ──────────────────────────────────────────────
//
// Completa e honesta: uma tabela que só mostra o que está incluído esconde o
// que falta, e o cliente descobre depois de pagar — a forma mais cara de o
// perder.

export interface Capacidade {
  /** Chave estável do texto no catálogo (`capacidade.<codigo>`); única em toda a tabela. */
  codigo: CodigoDeCapacidade;
  loja: boolean;
  rede: boolean;
  enterprise: boolean;
  /** Destaca as que decidem uma subida de escalão. */
  chave?: boolean;
}

export type FamiliaDeModulo = 'loja' | 'cadeia' | 'gestao' | 'governo';

export interface ModuloDoPrecario {
  codigo: CodigoDeModulo;
  familia: FamiliaDeModulo;
  capacidades: Capacidade[];
}

const T = true;
const F = false;

export const MODULOS: ModuloDoPrecario[] = [
  {
    codigo: 'caixa', familia: 'loja',
    capacidades: [
      { codigo: 'caixa_venda', loja: T, rede: T, enterprise: T },
      { codigo: 'caixa_pagamentos', loja: T, rede: T, enterprise: T },
      { codigo: 'caixa_recibo', loja: T, rede: T, enterprise: T },
      { codigo: 'caixa_sessao', loja: T, rede: T, enterprise: T },
      { codigo: 'caixa_historico_lojas', loja: F, rede: T, enterprise: T },
    ],
  },
  {
    codigo: 'catalogo', familia: 'loja',
    capacidades: [
      { codigo: 'catalogo_produtos', loja: T, rede: T, enterprise: T },
      { codigo: 'catalogo_stock', loja: T, rede: T, enterprise: T },
      { codigo: 'catalogo_movimentos', loja: T, rede: T, enterprise: T },
      { codigo: 'catalogo_alerta_minimo', loja: T, rede: T, enterprise: T },
      { codigo: 'catalogo_transferencias', loja: F, rede: T, enterprise: T },
      { codigo: 'catalogo_multi_armazem', loja: F, rede: T, enterprise: T },
    ],
  },
  {
    codigo: 'compras', familia: 'cadeia',
    capacidades: [
      { codigo: 'compras_fornecedores', loja: T, rede: T, enterprise: T },
      { codigo: 'compras_encomendas', loja: T, rede: T, enterprise: T },
      { codigo: 'compras_recepcao', loja: T, rede: T, enterprise: T },
      { codigo: 'compras_necessidades', loja: F, rede: T, enterprise: T },
      { codigo: 'compras_mercado', loja: F, rede: F, enterprise: T, chave: T },
      { codigo: 'compras_portal', loja: F, rede: F, enterprise: T },
    ],
  },
  {
    codigo: 'crm', familia: 'cadeia',
    capacidades: [
      { codigo: 'crm_ficha', loja: T, rede: T, enterprise: T },
      { codigo: 'crm_limite_credito', loja: F, rede: T, enterprise: T },
      { codigo: 'crm_venda_prazo', loja: F, rede: T, enterprise: T },
    ],
  },
  {
    codigo: 'financeiro', familia: 'gestao',
    capacidades: [
      { codigo: 'financeiro_indicadores', loja: T, rede: T, enterprise: T },
      { codigo: 'financeiro_margem', loja: F, rede: T, enterprise: T },
      { codigo: 'financeiro_consolidado', loja: F, rede: F, enterprise: T, chave: T },
    ],
  },
  {
    codigo: 'pessoas', familia: 'gestao',
    capacidades: [
      { codigo: 'pessoas_cadastro', loja: T, rede: T, enterprise: T },
      { codigo: 'pessoas_permissoes', loja: T, rede: T, enterprise: T },
      { codigo: 'pessoas_rh', loja: F, rede: F, enterprise: T },
      { codigo: 'pessoas_permissoes_granulares', loja: F, rede: F, enterprise: T },
    ],
  },
  {
    codigo: 'auditoria', familia: 'governo',
    capacidades: [
      { codigo: 'auditoria_registo', loja: T, rede: T, enterprise: T },
      { codigo: 'auditoria_autor', loja: T, rede: T, enterprise: T },
      { codigo: 'auditoria_historico', loja: T, rede: T, enterprise: T },
    ],
  },
];

/** A Mayra é limitada em capacidade e em quantidade. */
export const MAYRA: Capacidade[] = [
  { codigo: 'mayra_perguntar', loja: T, rede: T, enterprise: T },
  { codigo: 'mayra_explicar', loja: T, rede: T, enterprise: T },
  { codigo: 'mayra_perfil', loja: T, rede: T, enterprise: T },
  { codigo: 'mayra_escrita', loja: F, rede: T, enterprise: T },
  { codigo: 'mayra_sem_limite', loja: F, rede: F, enterprise: T, chave: T },
];

export type CodigoDeComplemento = 'loja_adicional' | 'pacote_mayra';

/** Outro sítio de trabalho, ou consumo com custo variável real. */
export const COMPLEMENTOS: { codigo: CodigoDeComplemento; preco: number }[] = [
  { codigo: 'loja_adicional', preco: 1_900 },
  { codigo: 'pacote_mayra', preco: 2_400 },
];

/** O que nunca se factura. */
export const SEMPRE_INCLUIDO = ['administracao', 'auditoria', 'mayra', 'exportar'] as const;

export const PERGUNTAS = ['mudar_plano', 'passar_limite', 'deixar_pagar', 'iva', 'servidores'] as const;
