import { api } from '@/shared/config';

/**
 * Os limiares operacionais da empresa.
 *
 * ## Três leituras, e não uma
 *
 * `definido` é o que a empresa escolheu, com nulos onde não escolheu nada. `omissoes` são os
 * valores do sistema. `efectivo` é o que está em vigor.
 *
 * As três, e não só a última: um ecrã que mostrasse apenas o efectivo não conseguiria dizer se
 * 180 dias é uma decisão da empresa ou o valor de fábrica — e essa diferença decide se o campo
 * aparece preenchido ou como sugestão.
 */

export interface ValoresConfiguracao {
  horasReservaPadrao: number | null;
  diasAvisoValidade: number | null;
  diasValidadeEmRisco: number | null;
  janelaDiasSaude: number | null;
  diasCoberturaMaximo: number | null;
  diasCoberturaBaixaRotacao: number | null;
  diasSemVendaParado: number | null;
  diasSemVendaObsoleto: number | null;
  toleranciaDivergencia: number | null;
  conferentePodeAprovar: boolean | null;
}

export type CampoConfiguracao = keyof ValoresConfiguracao;

export interface ConfiguracaoDaEmpresa {
  definido: ValoresConfiguracao | null;
  /**
   * Os valores de fábrica. Booleanos e números na mesma estrutura: `conferentePodeAprovar`
   * é uma omissão como qualquer outra, e separá-la em dois campos obrigaria cada ecrã a
   * saber de antemão qual é qual.
   */
  omissoes: Record<string, number | boolean>;
  efectivo: Record<string, number | boolean>;
}

export const configuracaoApi = {
  obter: async () => {
    const { data } = await api.get<ConfiguracaoDaEmpresa>('/configuracao');
    return data;
  },

  /**
   * Campo ausente fica como está; campo a `null` volta à omissão do sistema.
   *
   * Sem essa distinção não haveria forma de desfazer uma configuração sem saber de cor o valor
   * original — e o valor original é precisamente o que quem configura não sabe.
   */
  actualizar: async (alteracoes: Partial<ValoresConfiguracao>) => {
    const { data } = await api.patch('/configuracao', alteracoes);
    return data;
  },
};

export interface DefinicaoDeCampo {
  campo: CampoConfiguracao;
  rotulo: string;
  ajuda: string;
  unidade?: string;
  tipo?: 'numero' | 'booleano';
  grupo: 'reservas' | 'validade' | 'rotacao' | 'recepcao';
}

/**
 * O que cada limiar significa, em linguagem de quem gere a loja.
 *
 * A ajuda diz **o que acontece se estiver errado**, e não o que o campo é. «Dias sem venda a
 * partir dos quais um produto conta como parado» não ajuda ninguém a escolher um número;
 * «abaixo disto, produtos de venda mensal apareceriam como parados» ajuda.
 */
export const CAMPOS: DefinicaoDeCampo[] = [
  {
    campo: 'horasReservaPadrao',
    rotulo: 'Prazo de uma reserva',
    unidade: 'horas',
    grupo: 'reservas',
    ajuda:
      'Quanto tempo mercadoria fica apartada para um pedido antes de voltar ao disponível. Curto demais cancela pedidos legítimos; longo demais deixa a prateleira bloqueada por carrinhos abandonados.',
  },
  {
    campo: 'diasAvisoValidade',
    rotulo: 'Aviso de validade',
    unidade: 'dias',
    grupo: 'validade',
    ajuda:
      'A partir de quantos dias antes da validade um lote entra em aviso. Só vale para produtos que não definem o seu próprio prazo — o de um iogurte não é o de uma conserva.',
  },
  {
    campo: 'diasValidadeEmRisco',
    rotulo: 'Validade em risco',
    unidade: 'dias',
    grupo: 'validade',
    ajuda:
      'A partir de quando a mercadoria conta como capital em risco de se perder. Tem de ser menor do que o aviso, senão o estado de aviso nunca chega a aparecer.',
  },
  {
    campo: 'janelaDiasSaude',
    rotulo: 'Janela de vendas',
    unidade: 'dias',
    grupo: 'rotacao',
    ajuda:
      'Quantos dias de histórico se observam para apurar a velocidade de um produto. Curta demais transforma uma quinzena fraca em «stock parado».',
  },
  {
    campo: 'diasCoberturaMaximo',
    rotulo: 'Cobertura de excesso',
    unidade: 'dias',
    grupo: 'rotacao',
    ajuda:
      'Acima de quantos dias de stock o produto conta como excesso — dinheiro parado na prateleira.',
  },
  {
    campo: 'diasCoberturaBaixaRotacao',
    rotulo: 'Cobertura de rotação baixa',
    unidade: 'dias',
    grupo: 'rotacao',
    ajuda:
      'Tem de ser menor do que a de excesso. Acima do máximo já é excesso, e a rotação baixa nunca seria classificada.',
  },
  {
    campo: 'diasSemVendaParado',
    rotulo: 'Produto parado',
    unidade: 'dias',
    grupo: 'rotacao',
    ajuda:
      'Dias sem uma venda a partir dos quais o produto conta como parado. Baixo demais apanha produtos de venda mensal, que numa mercearia são normais.',
  },
  {
    campo: 'diasSemVendaObsoleto',
    rotulo: 'Produto obsoleto',
    unidade: 'dias',
    grupo: 'rotacao',
    ajuda:
      'Tem de ser maior do que «parado»: um produto está parado antes de ser obsoleto, e com a ordem trocada nenhum chegaria a parado.',
  },
  {
    campo: 'toleranciaDivergencia',
    rotulo: 'Tolerância na descarga',
    unidade: '%',
    grupo: 'recepcao',
    ajuda:
      'Diferença entre o facturado e o descarregado que passa sem aprovação. Zero — a omissão — significa que qualquer diferença é decidida por alguém.',
  },
  {
    campo: 'conferentePodeAprovar',
    rotulo: 'Quem confere pode aprovar',
    tipo: 'booleano',
    grupo: 'recepcao',
    ajuda:
      'Por omissão não pode: uma divergência confirmada e aprovada pela mesma pessoa não é uma verificação. Numa loja de três pessoas pode ser inevitável — e nesse caso cada uso fica registado em auditoria.',
  },
];

export const GRUPOS: { id: DefinicaoDeCampo['grupo']; titulo: string; descricao: string }[] = [
  {
    id: 'reservas',
    titulo: 'Reservas',
    descricao: 'Mercadoria apartada para um pedido, e quanto tempo pode ficar assim.',
  },
  {
    id: 'validade',
    titulo: 'Validades',
    descricao: 'Quando avisar, e a partir de quando tratar como capital em risco.',
  },
  {
    id: 'rotacao',
    titulo: 'Rotação e saúde do stock',
    descricao: 'O que conta como excesso, parado ou obsoleto.',
  },
  {
    id: 'recepcao',
    titulo: 'Recepção de mercadoria',
    descricao: 'Quanta diferença passa sem decisão, e quem a pode tomar.',
  },
];
