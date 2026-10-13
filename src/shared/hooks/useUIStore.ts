import { create } from 'zustand';

interface UIState {
  // Estado do drawer de navegação em telas mobile (< lg)
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;

  // Estado do sidebar colapsado em desktop (>= lg)
  isSidebarCollapsed: boolean;
  toggleSidebarCollapse: () => void;

  // O carrinho do POS ocupa a coluna da direita em toda a altura do ecrã (>= lg), por cima da faixa do cabeçalho.
  // O cabeçalho é `fixed` e não vê o POS, por isso encurta-se por aqui para não ficar por baixo do carrinho.
  carrinhoLateralActivo: boolean;
  definirCarrinhoLateral: (activo: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileMenuOpen: false,
  isSidebarCollapsed: false,
  carrinhoLateralActivo: false,

  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  definirCarrinhoLateral: (activo) => set({ carrinhoLateralActivo: activo }),

  toggleSidebarCollapse: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
}));
