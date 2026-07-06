import { Construction } from 'lucide-react';

// Placeholder — será desenvolvido na Fase 2
export function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
        <Construction size={28} className="text-blue-500" />
      </div>
      <h2 className="text-xl font-semibold text-slate-800 mb-1">Dashboard</h2>
      <p className="text-slate-500 text-sm max-w-xs">
        Este módulo está a ser desenvolvido na próxima fase. Em breve terá acesso
        aos KPIs, gráficos de vendas e alertas de stock.
      </p>
    </div>
  );
}
