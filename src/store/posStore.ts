import { create } from 'zustand';
import type { Product } from '@/types/catalog.types';

export interface CartItem extends Product {
  cartQuantity: number;
}

interface POSState {
  // Cart
  cartItems: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Totals
  get subtotal(): number;
  get total(): number;
  
  // Filters
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategoryId: string | null;
  setSelectedCategory: (categoryId: string | null) => void;
}

export const usePosStore = create<POSState>((set, get) => ({
  // ─── Cart ─────────────────────────────────────────────────────────────────
  cartItems: [],
  
  addItem: (product, quantity = 1) => {
    set((state) => {
      const existingItem = state.cartItems.find(item => item.id === product.id);
      
      if (existingItem) {
        return {
          cartItems: state.cartItems.map(item =>
            item.id === product.id
              ? { ...item, cartQuantity: item.cartQuantity + quantity }
              : item
          )
        };
      }

      return {
        cartItems: [...state.cartItems, { ...product, cartQuantity: quantity }]
      };
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      cartItems: state.cartItems.filter(item => item.id !== productId)
    }));
  },

  updateQuantity: (productId, quantity) => {
    set((state) => ({
      cartItems: state.cartItems.map(item =>
        item.id === productId ? { ...item, cartQuantity: Math.max(1, quantity) } : item
      )
    }));
  },

  clearCart: () => set({ cartItems: [] }),

  // ─── Totals (Getters) ─────────────────────────────────────────────────────
  get subtotal() {
    return get().cartItems.reduce((acc, item) => acc + (item.precoVenda * item.cartQuantity), 0);
  },
  
  get total() {
    // Aqui podes adicionar lógicas de impostos se necessário.
    return get().subtotal;
  },

  // ─── Filters ──────────────────────────────────────────────────────────────
  searchTerm: '',
  setSearchTerm: (term) => set({ searchTerm: term }),
  
  selectedCategoryId: null,
  setSelectedCategory: (categoryId) => set({ selectedCategoryId: categoryId }),
}));
