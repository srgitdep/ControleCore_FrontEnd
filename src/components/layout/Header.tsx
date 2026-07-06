import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_LABELS } from '@/types/auth.types';
import { cn } from '@/lib/utils';

// Mapeia o path para o título da página
const PAGE_TITLES: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/produtos':      'Produtos',
  '/fornecedores':  'Fornecedores',
  '/compras':       'Compras',
  '/stock':         'Stock',
  '/vendas':        'Ponto de Venda',
  '/clientes':      'Clientes',
  '/rh':            'Recursos Humanos',
  '/configuracoes': 'Configurações',
};

// Cores dos badges de role
const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-900/50 text-purple-300 border border-purple-700',
  ADMIN:       'bg-blue-900/50 text-blue-300 border border-blue-700',
  MANAGER:     'bg-emerald-900/50 text-emerald-300 border border-emerald-700',
  USER:        'bg-slate-800 text-slate-300 border border-slate-600',
};

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'ControlCore';

  const handleLogout = async () => {
    const toastId = toast.loading('A terminar sessão...');
    try {
      await logout();
      toast.success('Sessão encerrada com sucesso.', { id: toastId });
      navigate('/login', { replace: true });
    } catch {
      toast.error('Erro ao terminar sessão. Tente novamente.', { id: toastId });
    }
  };

  return (
    <header className="fixed top-0 left-64 right-0 z-30 h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200">

      {/* ─── Título da página ──────────────────────────────────────── */}
      <h1 className="text-lg font-semibold text-slate-800">{pageTitle}</h1>

      {/* ─── Acções do utilizador ──────────────────────────────────── */}
      <div className="flex items-center gap-3">

        {/* Notificações (placeholder para fase futura) */}
        <button
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title="Notificações"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
        </button>

        {/* Separador */}
        <div className="w-px h-6 bg-slate-200" />

        {/* Info do utilizador */}
        {user && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-slate-700 leading-none">{user.name}</p>
              <span
                className={cn(
                  'inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium',
                  ROLE_COLORS[user.role] ?? ROLE_COLORS.USER,
                )}
              >
                {ROLE_LABELS[user.role]}
              </span>
            </div>
          </div>
        )}

        {/* Botão Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          title="Terminar sessão"
        >
          <LogOut size={16} />
          <span className="hidden md:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}
