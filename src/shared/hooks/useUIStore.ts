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

  // O cabeçalho é `fixed`, por cima de qualquer ecrã — inclusive o carrinho/checkout do POS no
  // telemóvel, que o cobre como um overlay de ecrã inteiro. Um ecrã pode pedir para o esconder
  // por completo quando não há espaço nem necessidade dele (o checkout mobile do POS é o caso
  // de origem: minimalista, sem hambúrguer nem sino por cima do próprio fluxo de pagamento).
  cabecalhoOculto: boolean;
  definirCabecalhoOculto: (oculto: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileMenuOpen: false,
  isSidebarCollapsed: false,
  carrinhoLateralActivo: false,
  cabecalhoOculto: false,

  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  definirCarrinhoLateral: (activo) => set({ carrinhoLateralActivo: activo }),

  definirCabecalhoOculto: (oculto) => set({ cabecalhoOculto: oculto }),

  toggleSidebarCollapse: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
}));
