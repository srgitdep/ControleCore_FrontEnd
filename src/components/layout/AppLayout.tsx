import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useUIStore } from '@/store/useUIStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
  const { isSidebarCollapsed, isMobileMenuOpen, closeMobileMenu } = useUIStore();
  const location = useLocation();

  // Fecha o drawer mobile em cada mudanÃ§a de rota (UX: evita menu aberto apÃ³s navegar)
  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname, closeMobileMenu]);

  const isPOS = location.pathname === '/vendas';

  return (
    <div className={isPOS ? "h-screen bg-slate-50 overflow-hidden" : "min-h-screen bg-slate-50"}>

      {/* â”€â”€ DESKTOP (lg+): Sidebar fixo, sempre visÃ­vel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="hidden lg:block">
        <Sidebar isCollapsed={isSidebarCollapsed} />
      </div>

      {/* â”€â”€ MOBILE (< lg): Overlay + Drawer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop com blur: fecha o menu ao clicar fora */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
          {/* Drawer: Sidebar desliza da esquerda */}
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden animate-in slide-in-from-left duration-200">
            <Sidebar isCollapsed={false} isMobileDrawer />
          </div>
        </>
      )}

      {/* â”€â”€ Ãrea de conteÃºdo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/*
        Desktop: margem esquerda responsiva ao estado collapsed do sidebar
        Mobile:  sem margem (sidebar Ã© overlay)
      */}
      <div
        className={[
          isPOS ? 'flex flex-col h-screen transition-all duration-300' : 'flex flex-col min-h-screen transition-all duration-300',
          // Em desktop, empurra o conteÃºdo para alÃ©m do sidebar
          isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64',
        ].join(' ')}
      >
        <Header isCollapsed={isSidebarCollapsed} />

        {/* O POS ocupa ecrÃ£ completo sem padding extra â€” todas as outras pÃ¡ginas tÃªm o padding padrÃ£o */}
        <main className={isPOS ? 'flex-1 pt-16 overflow-hidden flex flex-col' : 'flex-1 pt-16 overflow-y-auto'}>
          {isPOS ? (
            <Outlet />
          ) : (
            <div className="p-4 sm:p-6">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

