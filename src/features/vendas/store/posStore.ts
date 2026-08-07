import { create } from 'zustand';
import type { Product } from '@/features/produtos';
import type { Cliente } from '@/features/crm';

// ──â”€ Types ────────────────────────────────────────────────────────────────â”€

export interface CartItem {
  id: string;
  nome: string;
  precoVenda: number;
  imagemUrl?: string;
  taxaIva: number;
  cartQuantity: number;
  desconto: number; // Desconto por linha, em MZN
  /** Saldo disponível no ponto de venda quando o item foi adicionado. */
  stockDisponivel?: number;
}

/**
 * Saldo do produto no armazém que serve de ponto de venda, seguindo a mesma regra
 * do backend: o armazém activo do tipo "Venda"; se a loja tiver um só armazém
 * activo, é esse. Devolve `undefined` quando a informação não veio na resposta,
 * caso em que a validação de disponibilidade é deixada ao backend.
 */
export function getStockDisponivel(product: Product): number | undefined {
  if (!product.stocks) return undefined;

  const activos = product.stocks.filter((s) => s.armazem?.isActive !== false);
  if (activos.length === 0) return 0;

  const deVenda = activos.filter((s) => s.armazem?.tipo?.toUpperCase() === 'VENDA');
  if (deVenda.length === 1) return deVenda[0].currentQuantity;
  if (activos.length === 1) return activos[0].currentQuantity;

  // Loja ambígua (vários armazéns, nenhum ou mais do que um de venda): o backend
  // recusa a venda com erro explícito, por isso não se antecipa aqui um valor.
  return undefined;
}

/** Resultado de uma alteração ao carrinho, para a UI poder informar o operador. */
export type CartResult =
  | { ok: true }
  | { ok: false; motivo: 'SEM_STOCK'; disponivel: number; nome: string };

interface POSState {
  // ── Carrinho ──────────────────────────────────────────────────────────────
  cartItems: CartItem[];
  addItem: (product: Product, quantity?: number) => CartResult;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => CartResult;
  updateLineDiscount: (productId: string, discount: number) => void;
  clearCart: () => void;

  // ── Cliente Identificado (CRM) ────────────────────────────────────────â”€
  clienteIdentificado: Cliente | null;
  associarCliente: (cliente: Cliente | null) => void;

  // ── Desconto Global na Venda ──────────────────────────────────────────â”€
  descontoGlobal: number;
  setDescontoGlobal: (value: number) => void;

  // ── Filtros do Catálogo ────────────────────────────────────────────────
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategoryId: string | null;
  setSelectedCategory: (categoryId: string | null) => void;

  // ── Computed ──────────────────────────────────────────────────────────â”€
  // Nota: usamos funções (não getters) para compatibilidade com Zustand devtools
  getSubtotal: () => number;
  getTotalDesconto: () => number;
  getTotalIva: () => number;
  getTotal: () => number;
}

export const usePosStore = create<POSState>((set, get) => ({
  // ── Carrinho ──────────────────────────────────────────────────────────────

  cartItems: [],

  addItem: (product, quantity = 1) => {
    const disponivel = getStockDisponivel(product);
    const existing = get().cartItems.find(item => item.id === product.id);
    const totalPretendido = (existing?.cartQuantity ?? 0) + quantity;

    // Só bloqueia quando a disponibilidade é conhecida. O backend continua a ser a
    // autoridade — isto evita ao operador montar um carrinho que iria falhar.
    if (disponivel !== undefined && totalPretendido > disponivel) {
      return { ok: false, motivo: 'SEM_STOCK', disponivel, nome: product.nome };
    }

    set((state) => {
      if (existing) {
        return {
          cartItems: state.cartItems.map(item =>
            item.id === product.id
              ? { ...item, cartQuantity: totalPretendido, stockDisponivel: disponivel }
              : item,
          ),
        };
      }
      return {
        cartItems: [
          ...state.cartItems,
          {
            id: product.id,
            nome: product.nome,
            imagemUrl: product.imagemUrl,
            precoVenda: product.precoVenda,
            taxaIva: product.taxaIva,
            cartQuantity: quantity,
            desconto: 0,
            stockDisponivel: disponivel,
          },
        ],
      };
    });

    return { ok: true };
  },

  removeItem: (productId) => {
    set((state) => ({
      cartItems: state.cartItems.filter(item => item.id !== productId),
    }));
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return { ok: true };
    }

    const item = get().cartItems.find(i => i.id === productId);
    if (item?.stockDisponivel !== undefined && quantity > item.stockDisponivel) {
      return { ok: false, motivo: 'SEM_STOCK', disponivel: item.stockDisponivel, nome: item.nome };
    }

    set((state) => ({
      cartItems: state.cartItems.map(i =>
        i.id === productId ? { ...i, cartQuantity: quantity } : i,
      ),
    }));

    return { ok: true };
  },

  updateLineDiscount: (productId, discount) => {
    set((state) => ({
      cartItems: state.cartItems.map(item =>
        item.id === productId
          ? { ...item, desconto: Math.max(0, discount) }
          : item,
      ),
    }));
  },

  clearCart: () =>
    set({ cartItems: [], clienteIdentificado: null, descontoGlobal: 0 }),

  // ── Cliente Identificado ────────────────────────────────────────────────â”€

  clienteIdentificado: null,
  associarCliente: (cliente) => set({ clienteIdentificado: cliente }),

  // ── Desconto Global ──────────────────────────────────────────────────────

  descontoGlobal: 0,
  setDescontoGlobal: (value) => set({ descontoGlobal: Math.max(0, value) }),

  // ── Filtros do Catálogo ──────────────────────────────────────────────────

  searchTerm: '',
  setSearchTerm: (term) => set({ searchTerm: term }),
  selectedCategoryId: null,
  setSelectedCategory: (categoryId) => set({ selectedCategoryId: categoryId }),

  // ── Computed ────────────────────────────────────────────────────────────â”€

  getSubtotal: () =>
    get().cartItems.reduce(
      (acc, item) => acc + item.precoVenda * item.cartQuantity,
      0,
    ),

  getTotalDesconto: () =>
    get().cartItems.reduce((acc, item) => acc + item.desconto, 0) +
    get().descontoGlobal,

  getTotalIva: () =>
    get().cartItems.reduce(
      (acc, item) =>
        acc +
        (item.precoVenda * item.cartQuantity - item.desconto) *
          (item.taxaIva / 100),
      0,
    ),

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const desconto = get().getTotalDesconto();
    const iva = get().getTotalIva();
    return subtotal - desconto + iva;
  },
}));
