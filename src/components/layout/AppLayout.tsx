import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar com estado de colapso */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Área de conteúdo ajustável */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'} flex flex-col min-h-screen`}>
        {/* Header recebe estado para ajustar posição e tamanho */}
        <Header isCollapsed={isCollapsed} />

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
