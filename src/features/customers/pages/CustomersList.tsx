import React from 'react';
import { Users } from 'lucide-react';

export function CustomersList() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-600" />
          Clientes (CRM)
        </h1>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          Novo Cliente
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
        <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-lg font-medium text-slate-700 mb-1">Módulo de CRM</p>
        <p>A lista de clientes e relatórios serão carregados aqui.</p>
        <p className="mt-4 text-sm text-indigo-600">Pode usar a Mayra (IA Copilot) para consultar o perfil ou histórico de qualquer cliente!</p>
      </div>
    </div>
  );
}
