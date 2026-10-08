import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProdutoLoja } from '../api/catalogo.api';

/**
 * O carrinho do Compra Fácil.
 *
 * ## Parte de `posStore.ts`, com uma diferença deliberada
 *
 * A validação de disponibilidade no cliente (bloquear antes de o pedido chegar ao
 * servidor) é a mesma ideia do POS — poupa uma viagem ao servidor só para ouvir "não
 * há stock". Mas aqui é sempre um palpite: entre o produto ser mostrado e o checkout
 * ser submetido, outro cliente pode ter reservado a mesma unidade. O servidor
 * valida sempre de novo, com bloqueio real (`CriarPedidoUseCase`) — esta verificação
 * só evita a frustração óbvia de encher o carrinho com mais do que existia há um
 * minuto.
 *
 * ## `persist`, ao contrário do carrinho do POS
 *
 * O carrinho do balcão morre com o refresh de propósito — é uma sessão de caixa
 * curta. Aqui um cliente pode fechar o browser a meio das compras e continuar depois;
 * sem persistência isso custaria recomeçar o carrinho do zero.
 *
 * ## Uma loja por carrinho
 *
 * Um pedido pertence sempre a uma só loja (Docs/plano_compra_facil.md §4.3) —
 * misturar produtos de duas lojas no mesmo carrinho criaria um pedido que o backend
 * nunca aceitaria. Trocar de loja limpa o carrinho.
 */

export interface ItemCarrinho {
  produtoId: string;
  nome: string;
  /** O que o cliente paga por unidade: o preço **com IVA** (e com a promoção, se houver). */
  precoComIva: number;
  imagemUrl: string | null;
  unidadeMedida: string;
  quantidade: number;
  /** Disponibilidade vista quando o item foi adicionado — um palpite, não a autoridade. */
  quantidadeDisponivel: number;
}

export type ResultadoCarrinho =
  | { ok: true }
  | { ok: false; motivo: 'SEM_STOCK'; disponivel: number; nome: string };

interface EstadoCarrinho {
  lojaId: string | null;
  itens: ItemCarrinho[];

  adicionar: (lojaId: string, produto: ProdutoLoja, quantidade?: number) => ResultadoCarrinho;
  remover: (produtoId: string) => void;
  actualizarQuantidade: (produtoId: string, quantidade: number) => ResultadoCarrinho;
  limpar: () => void;

  getSubtotal: () => number;
}

export const useCarrinhoStore = create<EstadoCarrinho>()(
  persist(
    (set, get) => ({
      lojaId: null,
      itens: [],

      adicionar: (lojaId, produto, quantidade = 1) => {
        const trocouDeLoja = get().lojaId !== null && get().lojaId !== lojaId;
        const itensActuais = trocouDeLoja ? [] : get().itens;

        const existente = itensActuais.find((i) => i.produtoId === produto.id);
        const totalPretendido = (existente?.quantidade ?? 0) + quantidade;

        if (totalPretendido > produto.quantidadeDisponivel) {
          return {
            ok: false,
            motivo: 'SEM_STOCK',
            disponivel: produto.quantidadeDisponivel,
            nome: produto.nome,
          };
        }

        const proximosItens = existente
          ? itensActuais.map((i) =>
              i.produtoId === produto.id
                ? { ...i, quantidade: totalPretendido, quantidadeDisponivel: produto.quantidadeDisponivel }
                : i,
            )
          : [
              ...itensActuais,
              {
                produtoId: produto.id,
                nome: produto.nome,
                precoComIva: produto.precoComIva,
                imagemUrl: produto.imagemUrl,
                unidadeMedida: produto.unidadeMedida,
                quantidade,
                quantidadeDisponivel: produto.quantidadeDisponivel,
              },
            ];

        set({ lojaId, itens: proximosItens });
        return { ok: true };
      },

      remover: (produtoId) =>
        set((state) => ({ itens: state.itens.filter((i) => i.produtoId !== produtoId) })),

      actualizarQuantidade: (produtoId, quantidade) => {
        if (quantidade <= 0) {
          get().remover(produtoId);
          return { ok: true };
        }

        const item = get().itens.find((i) => i.produtoId === produtoId);
        if (item && quantidade > item.quantidadeDisponivel) {
          return {
            ok: false,
            motivo: 'SEM_STOCK',
            disponivel: item.quantidadeDisponivel,
            nome: item.nome,
          };
        }

        set((state) => ({
          itens: state.itens.map((i) => (i.produtoId === produtoId ? { ...i, quantidade } : i)),
        }));
        return { ok: true };
      },

      limpar: () => set({ itens: [], lojaId: null }),

      // A soma do que o cliente paga pela mercadoria: preços **com IVA**, como no POS. O servidor
      // refaz esta conta ao criar o pedido (`totaisDoPedido`) e cobra o mesmo valor — antes o
      // carrinho somava o preço sem IVA e a venda, ao levantar, calculava outro total, o que
      // bloqueava o levantamento («pago insuficiente»).
      getSubtotal: () => get().itens.reduce((acc, i) => acc + i.precoComIva * i.quantidade, 0),
    }),
    {
      name: 'compra-facil-carrinho',
      // Versão 1: os itens passaram a guardar o preço **com IVA** (`precoComIva`). Um carrinho
      // guardado antes tem o campo antigo (`precoVenda`, sem IVA) e mostraria um total errado até
      // ao checkout — descarta-se, e o cliente volta a juntar os produtos, já ao preço certo.
      version: 1,
      migrate: () => ({ lojaId: null, itens: [] }),
    },
  ),
);
