import React, { useRef, useEffect, useState } from 'react';
import { X, Send, User, Sparkles, Loader2, Trash2, Maximize2, Minimize2, History, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useCopilotStore } from '../store/copilotStore';
import { useUIStore } from '@/store/useUIStore';

export function CopilotWidget() {
  const { isOpen, isExpanded, messages, isLoading, error, setOpen, toggleExpanded, sendMessage, executeAction, startNewSession, isHistoryOpen, toggleHistory, loadSessions, sessions, loadSessionMessages, currentSessionId } = useCopilotStore();
  const { isSidebarCollapsed } = useUIStore();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para o fundo sempre que chegam novas mensagens
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    sendMessage(inputMessage);
    setInputMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  return (
    <>
      {/* Painel do Chat (Modern Floating Window) */}
      <div
        className={`fixed z-[100] bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] border border-slate-200 flex flex-col transition-all duration-300 ease-out origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
        } ${
          isExpanded
            ? isSidebarCollapsed 
                ? 'inset-4 sm:inset-y-6 sm:right-6 sm:left-[calc(5rem+1.5rem)] w-auto h-auto'
                : 'inset-4 sm:inset-y-6 sm:right-6 lg:left-[calc(16rem+1.5rem)] sm:left-[calc(16rem+1.5rem)] w-auto h-auto'
            : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100%-2rem)] sm:w-[380px] h-[600px] max-h-[calc(100vh-2rem)]'
        }`}
      >
        {/* Painel lateral de Histórico */}
        <div className={`absolute top-0 left-0 h-full w-full sm:w-[280px] bg-slate-50 border-r border-slate-200 z-[101] transition-transform duration-300 ease-in-out flex flex-col ${isHistoryOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
                  className={`w-full text-left p-3 rounded-lg text-sm transition-colors border ${currentSessionId === sess.id ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-white border-transparent hover:bg-slate-100 text-slate-700'}`}
                >
                  <p className="font-medium truncate">{sess.title}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{new Date(sess.updatedAt).toLocaleString('pt-PT')}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Header do Chat */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-t-2xl shrink-0">
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

        {/* Área de Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/80 custom-scrollbar">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 shadow-sm ${
                    isUser
                      ? 'bg-slate-200 text-slate-600'
                      : 'bg-indigo-100 text-indigo-600'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>
                <div
                  className={`p-3 text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm'
                      : 'bg-white border border-slate-100 text-slate-700 rounded-2xl rounded-tl-sm'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-th:bg-slate-50 prose-th:p-2 prose-td:p-2 prose-table:border prose-table:rounded-lg prose-table:overflow-hidden prose-tr:border-b">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  
                  {/* Cartão de Ação (HITL) */}
                  {msg.hitlAction && (
                    <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3 shadow-sm">
                      <div className="text-sm font-semibold text-slate-800 mb-2 border-b pb-1">
                        {msg.hitlAction.action === 'UPDATE_PRODUCT_PRICE' && 'Ação Solicitada: Atualizar Preço'}
                        {msg.hitlAction.action === 'ADJUST_STOCK' && 'Ação Solicitada: Ajuste de Stock'}
                        {msg.hitlAction.action === 'TRANSFER_STOCK' && 'Ação Solicitada: Transferência de Stock'}
                        {msg.hitlAction.action === 'CREATE_USER' && 'Ação Solicitada: Novo Funcionário'}
                        {msg.hitlAction.action === 'TOGGLE_USER_STATUS' && 'Ação Solicitada: Alterar Acesso'}
                        {msg.hitlAction.action === 'REGISTER_EXPENSE' && 'Ação Solicitada: Registar Despesa'}
                        {msg.hitlAction.action === 'PAY_BILL' && 'Ação Solicitada: Liquidar Fatura / Despesa'}
                        {!['UPDATE_PRODUCT_PRICE', 'ADJUST_STOCK', 'TRANSFER_STOCK', 'CREATE_USER', 'TOGGLE_USER_STATUS', 'REGISTER_EXPENSE', 'PAY_BILL'].includes(msg.hitlAction.action) && 'Ação Solicitada'}
                      </div>
                      <div className="text-xs text-slate-600 mb-3 space-y-1">
                        {msg.hitlAction.action === 'UPDATE_PRODUCT_PRICE' && (
                          <>
                            <p><span className="font-medium">Produto:</span> {msg.hitlAction.payload.produtoNome}</p>
                            <p><span className="font-medium">Preço Atual:</span> {msg.hitlAction.payload.precoAtual} MT</p>
                            <p><span className="font-medium text-indigo-600">Novo Preço:</span> <span className="font-bold text-indigo-700">{msg.hitlAction.payload.novoPreco} MT</span></p>
                          </>
                        )}
                        
                        {msg.hitlAction.action === 'ADJUST_STOCK' && (
                          <>
                            <p><span className="font-medium">Produto:</span> {msg.hitlAction.payload.produtoNome}</p>
                            <p><span className="font-medium">Armazém:</span> {msg.hitlAction.payload.armazemNome}</p>
                            <p><span className="font-medium text-indigo-600">Ajuste a aplicar:</span> <span className="font-bold text-indigo-700">{msg.hitlAction.payload.ajuste > 0 ? '+' : ''}{msg.hitlAction.payload.ajuste}</span></p>
                            <p><span className="font-medium">Novo Saldo Esperado:</span> {msg.hitlAction.payload.novoSaldo}</p>
                            <p className="mt-2 p-1.5 bg-white rounded border border-slate-200 italic">Motivo: {msg.hitlAction.payload.motivo}</p>
                          </>
                        )}

                        {msg.hitlAction.action === 'TRANSFER_STOCK' && (
                          <>
                            <p><span className="font-medium">Produto:</span> {msg.hitlAction.payload.produtoNome}</p>
                            <p><span className="font-medium text-amber-600">Origem:</span> {msg.hitlAction.payload.sourceArmazemNome}</p>
                            <p><span className="font-medium text-emerald-600">Destino:</span> {msg.hitlAction.payload.destArmazemNome}</p>
                            <p><span className="font-medium text-indigo-600">Qtd. a Transferir:</span> <span className="font-bold text-indigo-700">{msg.hitlAction.payload.quantidade}</span></p>
                          </>
                        )}

                        {msg.hitlAction.action === 'CREATE_USER' && (
                          <>
                            <p><span className="font-medium">Nome:</span> {msg.hitlAction.payload.name}</p>
                            <p><span className="font-medium">Email:</span> {msg.hitlAction.payload.email}</p>
                            <p><span className="font-medium text-indigo-600">Perfil:</span> <span className="font-bold">{msg.hitlAction.payload.role}</span></p>
                          </>
                        )}

                        {msg.hitlAction.action === 'TOGGLE_USER_STATUS' && (
                          <>
                            <p><span className="font-medium">Funcionário:</span> {msg.hitlAction.payload.userName}</p>
                            <p>
                              <span className="font-medium">Ação: </span> 
                              <span className={`font-bold ${msg.hitlAction.payload.newStatus ? 'text-emerald-600' : 'text-red-600'}`}>
                                {msg.hitlAction.payload.newStatus ? 'Ativar Acesso' : 'Bloquear/Desativar Acesso'}
                              </span>
                            </p>
                            <p className="mt-2 p-1.5 bg-white rounded border border-slate-200 italic">Motivo: {msg.hitlAction.payload.reason}</p>
                          </>
                        )}

                        {msg.hitlAction.action === 'REGISTER_EXPENSE' && (
                          <>
                            <p><span className="font-medium">Descrição:</span> {msg.hitlAction.payload.descricao}</p>
                            <p><span className="font-medium text-red-600">Valor:</span> <span className="font-bold text-red-700">{msg.hitlAction.payload.valor} MT</span></p>
                            <p><span className="font-medium">Data de Vencimento:</span> {msg.hitlAction.payload.vencimento}</p>
                            <p>
                              <span className="font-medium">Estado Inicial: </span> 
                              <span className={`font-bold ${msg.hitlAction.payload.isPaga ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {msg.hitlAction.payload.isPaga ? 'PAGO' : 'PENDENTE'}
                              </span>
                            </p>
                          </>
                        )}

                        {msg.hitlAction.action === 'PAY_BILL' && (
                          <>
                            <p><span className="font-medium">Descrição da Conta:</span> {msg.hitlAction.payload.descricao}</p>
                            <p><span className="font-medium text-emerald-600">Valor a Liquidar:</span> <span className="font-bold text-emerald-700">{msg.hitlAction.payload.valor} MT</span></p>
                            <p><span className="font-medium">Vencimento Original:</span> {msg.hitlAction.payload.vencimento}</p>
                            <p className="mt-2 p-1.5 bg-emerald-50 rounded border border-emerald-200 font-medium text-emerald-800">
                              Esta ação marcará a conta como PAGA no momento atual.
                            </p>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => executeAction(msg.hitlAction!.action, msg.hitlAction!.payload)}
                          disabled={isLoading}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium py-1.5 px-3 rounded shadow-sm transition-colors disabled:opacity-50"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => sendMessage('Cancelei a ação.')}
                          disabled={isLoading}
                          className="flex-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-medium py-1.5 px-3 rounded shadow-sm transition-colors disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Indicador de "A escrever..." */}
          {isLoading && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mt-1 shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          
          {/* Alerta de Erro */}
          {error && (
            <div className="text-center p-2 bg-destructive/10 text-destructive text-xs rounded-md mx-4">
              {error}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 relative bg-slate-50 p-1.5 rounded-full border border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-sm"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte à Mayra..."
              className="flex-1 bg-transparent border-0 focus:ring-0 px-4 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
          <div className="text-center mt-3">
            <span className="text-[10px] text-slate-400 font-medium">
              A Mayra pode cometer erros. Confirme sempre os valores importantes.
            </span>
          </div>
        </div>
      </div>
      
      {/* Backdrop (Mobile) - Mantido para foco em ecrãs pequenos */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[90] sm:hidden transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
