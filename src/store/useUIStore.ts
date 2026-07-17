import { create } from 'zustand';

interface UIState {
  // Estado do drawer de navegaÃ§Ã£o em telas mobile (< lg)
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;

  // Estado do sidebar colapsado em desktop (>= lg)
  isSidebarCollapsed: boolean;
  toggleSidebarCollapse: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileMenuOpen: false,
  isSidebarCollapsed: false,

  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  toggleSidebarCollapse: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
}));
