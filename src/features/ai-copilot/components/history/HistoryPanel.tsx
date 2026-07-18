import React from 'react';
import { History, Plus, X } from 'lucide-react';
import { useCopilotStore } from '../../store/copilotStore';

export function HistoryPanel() {
  const {
    isHistoryOpen,
    toggleHistory,
    sessions,
    currentSessionId,
    loadSessionMessages,
    startNewSession
  } = useCopilotStore();

  return (
    <div
      className={`h-full bg-slate-50 border-slate-200 z-[101] shrink-0 transition-all duration-300 ease-in-out flex flex-col overflow-hidden ${
        isHistoryOpen ? 'w-full sm:w-[280px] border-r opacity-100' : 'w-0 border-r-0 opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex items-center justify-between p-4 bg-indigo-600 text-white shrink-0">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5" />
          <h3 className="font-semibold">Histórico</h3>
        </div>
        <button onClick={toggleHistory} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 shrink-0 border-b border-slate-200 bg-white">
        <button
          onClick={() => startNewSession()}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-lg transition-colors border border-indigo-200"
        >
          <Plus className="w-4 h-4" />
          Nova Conversa
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {sessions.length === 0 ? (
          <p className="text-sm text-slate-500 text-center mt-6">Nenhum histórico encontrado.</p>
        ) : (
          sessions.map((sess: any) => (
            <button
              key={sess.id}
              onClick={() => loadSessionMessages(sess.id)}
              className={`w-full text-left p-3 rounded-lg text-sm transition-colors border ${
                currentSessionId === sess.id
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                  : 'bg-white border-transparent hover:bg-slate-100 text-slate-700'
              }`}
            >
              <p className="font-medium truncate">{sess.title}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                {new Date(sess.updatedAt).toLocaleString('pt-PT')}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
