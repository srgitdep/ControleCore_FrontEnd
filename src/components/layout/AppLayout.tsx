import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar fixa à esquerda (240px) */}
      <Sidebar />

      {/* Área de conteúdo: margem à esquerda da sidebar + padding do header */}
      <div className="ml-64 flex flex-col min-h-screen">
        {/* Header fixo no topo */}
        <Header />

        {/* Conteúdo principal da página */}
        <main className="flex-1 pt-16 overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
