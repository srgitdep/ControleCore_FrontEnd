import type { ErroDeLinha, LinhaDoPedido, ProdutoDisponivel } from '../types/transferencia.types';

/**
 * O «cesto» do pedido em massa (plano §4.12, D3): os produtos escolhidos, com a quantidade de cada um.
 *
 * Vive à parte da lista que o servidor pagina: escolher na página 1, procurar outro produto e voltar não pode perder
 * o que já estava escolhido. A chave é o `produtoId`.
 */
export interface ItemDoCesto {
  produtoId: string;
  nome: string;
  unidade: string;
  quantidade: number;
  /** O que havia disponível quando se escolheu — o tecto que o ecrã mostra e valida. */
  disponivel: number;
}

export type Cesto = Record<string, ItemDoCesto>;

/** Pode transferir-se? Só com disponível: o reservado já está prometido a outro. */
export const podeEscolher = (p: Pick<ProdutoDisponivel, 'disponivel'>) => p.disponivel > 0;

/**
 * A quantidade com que um produto entra no cesto: **o que a origem pode ceder sem risco** (`cedivel`), e, se não cede
 * nada (abaixo do mínimo), o disponível — o ecrã avisa que a aprovação pode recusar, mas a decisão é de quem pede.
 */
export const quantidadeInicial = (p: Pick<ProdutoDisponivel, 'disponivel' | 'cedivel'>) =>
  p.cedivel > 0 ? Math.min(p.cedivel, p.disponivel) : p.disponivel;

export const itemDe = (p: ProdutoDisponivel): ItemDoCesto => ({
  produtoId: p.produtoId,
  nome: p.nome,
  unidade: p.unidade,
  quantidade: quantidadeInicial(p),
  disponivel: p.disponivel,
});

/** Uma quantidade serve se é positiva, finita e não passa do disponível. */
export const quantidadeValida = (quantidade: number, disponivel: number) =>
  Number.isFinite(quantidade) && quantidade > 0 && quantidade <= disponivel;

export interface TotaisDoCesto {
  linhas: number;
  unidades: number;
  /** Linhas com quantidade que não serve (zero, negativa ou acima do disponível). */
  invalidas: number;
}

export function totaisDoCesto(cesto: Cesto): TotaisDoCesto {
  const itens = Object.values(cesto);
  return {
    linhas: itens.length,
    unidades: Number(itens.reduce((s, i) => s + (Number.isFinite(i.quantidade) ? i.quantidade : 0), 0).toFixed(3)),
    invalidas: itens.filter((i) => !quantidadeValida(i.quantidade, i.disponivel)).length,
  };
}

/** O que se pode enviar: há linhas e nenhuma é inválida. */
export const cestoPronto = (cesto: Cesto) => {
  const t = totaisDoCesto(cesto);
  return t.linhas > 0 && t.invalidas === 0;
};

export const linhasParaEnviar = (cesto: Cesto): LinhaDoPedido[] =>
  Object.values(cesto).map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade }));

/** `produtoId → erro` das linhas que o servidor recusou, para as marcar nas próprias linhas. */
export const errosPorProduto = (erros: ErroDeLinha[] | undefined): Record<string, ErroDeLinha> =>
  Object.fromEntries((erros ?? []).map((e) => [e.produtoId, e]));

/** Lê os erros de linha de uma resposta 400 (`erros` está no topo do corpo; o filtro retira os `parametros`). */
export function errosDeLinhaDaResposta(erro: unknown): ErroDeLinha[] {
  const lista = (erro as { response?: { data?: { erros?: unknown } } })?.response?.data?.erros;
  return Array.isArray(lista) ? (lista as ErroDeLinha[]) : [];
}
