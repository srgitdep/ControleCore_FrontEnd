import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useUIStore } from '@/shared/hooks';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CopilotWidget } from '@/features/ai-copilot';
import { useCopilotStore } from '@/features/ai-copilot/store/copilotStore';
import { classeMargemDaMayra } from '@/features/ai-copilot/utils/margem-layout';

export function AppLayout() {
  const { isSidebarCollapsed, isMobileMenuOpen, closeMobileMenu } = useUIStore();
  const location = useLocation();

  // A Mayra é uma coluna encostada à direita, não uma janela a flutuar por cima. O
  // conteúdo encolhe para lhe dar espaço, como já fazia com o menu lateral — antes,
  // numa tabela larga, ela tapava as últimas colunas e os botões de acção.
  //
  // Só a partir de `md`: abaixo disso a Mayra ocupa o ecrã inteiro, e reservar-lhe
  // margem deixaria o conteúdo sem largura nenhuma.
  const margemDaMayra = classeMargemDaMayra(useCopilotStore());

  // Fecha o drawer mobile em cada mudança de rota (UX: evita menu aberto após navegar)
  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname, closeMobileMenu]);

  const isPOS = location.pathname === '/vendas';

  return (
    <div
      className={
        isPOS
          ? 'h-screen h-[100dvh] bg-slate-50 overflow-hidden'
          : 'min-h-screen bg-slate-50'
      }
    >

      {/* ── DESKTOP (lg+): Sidebar fixo, sempre visível ────────────────────── */}
      <div className="hidden lg:block">
        <Sidebar isCollapsed={isSidebarCollapsed} />
      </div>

      {/* ── MOBILE (< lg): Overlay + Drawer ────────────────────────────────── */}
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

      {/* ── Área de conteúdo ─────────────────────────────────────────────── */}
      <div
        className={[
          isPOS
            ? 'flex flex-col h-screen h-[100dvh] transition-all duration-300'
            : 'flex flex-col min-h-screen transition-all duration-300',
          // Em desktop, empurra o conteúdo para além do sidebar
          isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64',
          // ... e encolhe-o à direita quando a Mayra está aberta.
          margemDaMayra,
        ].join(' ')}
      >
        <Header isCollapsed={isSidebarCollapsed} />

        {/* O POS ocupa ecrã completo sem padding extra — todas as outras páginas têm o padding padrão */}
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

      {/* ── Widget AI Global ────────────────────────────────────────────── */}
      <CopilotWidget />
    </div>
  );
}
