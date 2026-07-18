import React from 'react';
import { useCopilotStore } from '../../store/copilotStore';

interface HitlActionCardProps {
  hitlAction: {
    action: string;
    payload: any;
  };
}

export function HitlActionCard({ hitlAction }: HitlActionCardProps) {
  const { executeAction, sendMessage, isLoading } = useCopilotStore();

  const getActionTitle = (action: string) => {
    switch (action) {
      case 'UPDATE_PRODUCT_PRICE': return 'Ação Solicitada: Atualizar Preço';
      case 'ADJUST_STOCK': return 'Ação Solicitada: Ajuste de Stock';
      case 'TRANSFER_STOCK': return 'Ação Solicitada: Transferência de Stock';
      case 'CREATE_USER': return 'Ação Solicitada: Novo Funcionário';
      case 'TOGGLE_USER_STATUS': return 'Ação Solicitada: Alterar Acesso';
      case 'REGISTER_EXPENSE': return 'Ação Solicitada: Registar Despesa';
      case 'PAY_BILL': return 'Ação Solicitada: Liquidar Fatura / Despesa';
      default: return 'Ação Solicitada';
    }
  };

  const renderPayloadDetails = () => {
    const { action, payload } = hitlAction;

    if (action === 'UPDATE_PRODUCT_PRICE') {
      return (
        <>
          <p><span className="font-medium">Produto:</span> {payload.produtoNome}</p>
          <p><span className="font-medium">Preço Atual:</span> {payload.precoAtual} MT</p>
          <p><span className="font-medium text-indigo-600">Novo Preço:</span> <span className="font-bold text-indigo-700">{payload.novoPreco} MT</span></p>
        </>
      );
    }
    
    if (action === 'ADJUST_STOCK') {
      return (
        <>
          <p><span className="font-medium">Produto:</span> {payload.produtoNome}</p>
          <p><span className="font-medium">Armazém:</span> {payload.armazemNome}</p>
          <p><span className="font-medium text-indigo-600">Ajuste a aplicar:</span> <span className="font-bold text-indigo-700">{payload.ajuste > 0 ? '+' : ''}{payload.ajuste}</span></p>
          <p><span className="font-medium">Novo Saldo Esperado:</span> {payload.novoSaldo}</p>
          <p className="mt-2 p-1.5 bg-white rounded border border-slate-200 italic">Motivo: {payload.motivo}</p>
        </>
      );
    }

    if (action === 'TRANSFER_STOCK') {
      return (
        <>
          <p><span className="font-medium">Produto:</span> {payload.produtoNome}</p>
          <p><span className="font-medium text-amber-600">Origem:</span> {payload.sourceArmazemNome}</p>
          <p><span className="font-medium text-emerald-600">Destino:</span> {payload.destArmazemNome}</p>
          <p><span className="font-medium text-indigo-600">Qtd. a Transferir:</span> <span className="font-bold text-indigo-700">{payload.quantidade}</span></p>
        </>
      );
    }

    if (action === 'CREATE_USER') {
      return (
        <>
          <p><span className="font-medium">Nome:</span> {payload.name}</p>
          <p><span className="font-medium">Email:</span> {payload.email}</p>
          <p><span className="font-medium text-indigo-600">Perfil:</span> <span className="font-bold">{payload.role}</span></p>
        </>
      );
    }

    if (action === 'TOGGLE_USER_STATUS') {
      return (
        <>
          <p><span className="font-medium">Funcionário:</span> {payload.userName}</p>
          <p>
            <span className="font-medium">Ação: </span> 
            <span className={`font-bold ${payload.newStatus ? 'text-emerald-600' : 'text-red-600'}`}>
              {payload.newStatus ? 'Ativar Acesso' : 'Bloquear/Desativar Acesso'}
            </span>
          </p>
          <p className="mt-2 p-1.5 bg-white rounded border border-slate-200 italic">Motivo: {payload.reason}</p>
        </>
      );
    }

    if (action === 'REGISTER_EXPENSE') {
      return (
        <>
          <p><span className="font-medium">Descrição:</span> {payload.descricao}</p>
          <p><span className="font-medium text-red-600">Valor:</span> <span className="font-bold text-red-700">{payload.valor} MT</span></p>
          <p><span className="font-medium">Data de Vencimento:</span> {payload.vencimento}</p>
          <p>
            <span className="font-medium">Estado Inicial: </span> 
            <span className={`font-bold ${payload.isPaga ? 'text-emerald-600' : 'text-amber-600'}`}>
              {payload.isPaga ? 'PAGO' : 'PENDENTE'}
            </span>
          </p>
        </>
      );
    }

    if (action === 'PAY_BILL') {
      return (
        <>
          <p><span className="font-medium">Descrição da Conta:</span> {payload.descricao}</p>
          <p><span className="font-medium text-emerald-600">Valor a Liquidar:</span> <span className="font-bold text-emerald-700">{payload.valor} MT</span></p>
          <p><span className="font-medium">Vencimento Original:</span> {payload.vencimento}</p>
          <p className="mt-2 p-1.5 bg-emerald-50 rounded border border-emerald-200 font-medium text-emerald-800">
            Esta ação marcará a conta como PAGA no momento atual.
          </p>
        </>
      );
    }

    return null;
  };

  return (
    <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3 shadow-sm">
      <div className="text-sm font-semibold text-slate-800 mb-2 border-b pb-1">
        {getActionTitle(hitlAction.action)}
      </div>
      <div className="text-xs text-slate-600 mb-3 space-y-1">
        {renderPayloadDetails()}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => executeAction(hitlAction.action, hitlAction.payload)}
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
  );
}
