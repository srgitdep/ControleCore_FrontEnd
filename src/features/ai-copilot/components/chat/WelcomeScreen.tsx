import React from 'react';
import { Sparkles } from 'lucide-react';
import { useAuthStore } from '@/features/auth';
import { useCopilotStore } from '../../store/copilotStore';

const getSuggestionsByRole = (role?: string) => {
  if (role === 'STOCK_KEEPER') {
    return [
      { icon: '🚨', title: 'Prever Rutura', description: 'Prever risco de ruptura de estoque', prompt: 'Prever risco de ruptura de estoque' },
      { icon: '📦', title: 'Capital Congelado', description: 'Analisar estoque parado nas lojas', prompt: 'Analisar estoque parado (capital congelado)' },
      { icon: '📝', title: 'Movimentos', description: 'Verificar últimos movimentos', prompt: 'Mostrar os últimos movimentos de estoque de hoje' },
      { icon: '📊', title: 'Baixo Estoque', description: 'Listar produtos no limite', prompt: 'Quais produtos estão com o estoque abaixo do mínimo?' }
    ];
  }
  
  if (role === 'CASHIER') {
    return [
      { icon: '💰', title: 'Meu Turno', description: 'Resumo das minhas vendas', prompt: 'Resumir as minhas vendas de hoje' },
      { icon: '🏷️', title: 'Consultar Preço', description: 'Verificar o preço de produto', prompt: 'Consultar preço de um produto' },
      { icon: '🕒', title: 'Meus Horários', description: 'Ver minhas marcações de ponto', prompt: 'Mostrar minhas entradas e saídas de hoje' },
      { icon: '🛒', title: 'Top Vendas', description: 'Produtos mais vendidos', prompt: 'Quais foram os produtos mais vendidos por mim hoje?' }
    ];
  }

  // DEFAULT (ADMIN / MANAGER)
  return [
    { icon: '📉', title: 'Auditar Margens', description: 'Analisar produtos com margem de lucro baixa', prompt: 'Analisar produtos com margem de lucro baixa ou negativa' },
    { icon: '🛡️', title: 'Anti-fraude', description: 'Auditoria de ocorrências suspeitas', prompt: 'Auditoria Anti-fraude (Ocorrências suspeitas da semana)' },
    { icon: '🏪', title: 'Fecho de Caixas', description: 'Resumir fechamentos de todos os turnos', prompt: 'Resumir fechamentos de caixa de hoje' },
    { icon: '📦', title: 'Capital Congelado', description: 'Analisar estoque sem saídas', prompt: 'Analisar estoque parado (capital congelado)' }
  ];
};

export function WelcomeScreen() {
  const { user } = useAuthStore();
  const { sendMessage, isLoading } = useCopilotStore();

  return (
    <div className="flex flex-col items-center justify-center flex-1 h-full text-center px-2 py-6">
      <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-4 shadow-sm border border-indigo-50">
        <Sparkles className="w-7 h-7 text-indigo-600" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1">Olá, {user?.name || 'Gestor'}!</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-sm">Eu sou a Mayra, a sua assistente de IA. Selecione uma sugestão abaixo ou faça uma pergunta livre.</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {getSuggestionsByRole(user?.role).map((sug, idx) => (
           <button
             key={idx}
             onClick={() => sendMessage(sug.prompt)}
             disabled={isLoading}
             className="flex flex-col items-start text-left p-3.5 bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 rounded-xl transition-all cursor-pointer group disabled:opacity-50"
           >
             <span className="text-2xl mb-2">{sug.icon}</span>
             <span className="font-semibold text-slate-700 text-[13px] mb-0.5 group-hover:text-indigo-700">{sug.title}</span>
             <span className="text-[11px] text-slate-500 line-clamp-2 leading-snug">{sug.description}</span>
           </button>
        ))}
      </div>
    </div>
  );
}
