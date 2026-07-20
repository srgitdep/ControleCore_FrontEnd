import { X, Sparkles, Trash2, Maximize2, Minimize2, History } from 'lucide-react';
import { useCopilotStore } from '../../store/copilotStore';

export function ChatHeader() {
  const { isExpanded, toggleExpanded, toggleHistory, startNewSession, setOpen } = useCopilotStore();

  return (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/10">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-base leading-none tracking-tight">Mayra AI</h2>
          <p className="text-[11px] text-indigo-100 mt-1 flex items-center gap-1.5 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Online e pronta a ajudar
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={toggleExpanded}
          title={isExpanded ? "Restaurar Tamanho" : "Ecrã Inteiro"}
          className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-full transition-colors hidden sm:block"
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
        <button
          onClick={toggleHistory}
          title="Histórico de Conversas"
          className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <History className="w-4 h-4" />
        </button>
        <button
          onClick={startNewSession}
          title="Limpar Conversa (Nova Sessão)"
          className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setOpen(false)}
          className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
