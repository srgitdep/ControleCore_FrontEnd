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
}

interface POSState {
  // ── Carrinho ──────────────────────────────────────────────────────────────
  cartItems: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
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
    set((state) => {
      const existing = state.cartItems.find(item => item.id === product.id);
      if (existing) {
        return {
          cartItems: state.cartItems.map(item =>
            item.id === product.id
              ? { ...item, cartQuantity: item.cartQuantity + quantity }
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
          },
        ],
      };
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      cartItems: state.cartItems.filter(item => item.id !== productId),
    }));
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => ({
      cartItems: state.cartItems.map(item =>
        item.id === productId ? { ...item, cartQuantity: quantity } : item,
      ),
    }));
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
