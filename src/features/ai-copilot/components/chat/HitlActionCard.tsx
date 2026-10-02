import { useTranslation } from 'react-i18next';
import { useCopilotStore } from '../../store/copilotStore';

interface HitlActionCardProps {
  hitlAction: {
    action: string;
    payload: any;
  };
}

export function HitlActionCard({ hitlAction }: HitlActionCardProps) {
  const { t } = useTranslation('copiloto');
  const { executeAction, sendMessage, isLoading } = useCopilotStore();

  const getActionTitle = (action: string) => {
    switch (action) {
      case 'UPDATE_PRODUCT_PRICE': return t('hitl.titulo.UPDATE_PRODUCT_PRICE');
      case 'ADJUST_STOCK': return t('hitl.titulo.ADJUST_STOCK');
      case 'TRANSFER_STOCK': return t('hitl.titulo.TRANSFER_STOCK');
      case 'CREATE_USER': return t('hitl.titulo.CREATE_USER');
      case 'TOGGLE_USER_STATUS': return t('hitl.titulo.TOGGLE_USER_STATUS');
      case 'REGISTER_EXPENSE': return t('hitl.titulo.REGISTER_EXPENSE');
      case 'PAY_BILL': return t('hitl.titulo.PAY_BILL');
      default: return t('hitl.titulo.outra');
    }
  };

  const renderPayloadDetails = () => {
    const { action, payload } = hitlAction;

    if (action === 'UPDATE_PRODUCT_PRICE') {
      return (
        <>
          <p><span className="font-medium">{t('hitl.produto')}</span> {payload.produtoNome}</p>
          <p><span className="font-medium">{t('hitl.preco_atual')}</span> {payload.precoAtual} MT</p>
          <p><span className="font-medium text-indigo-600">{t('hitl.novo_preco')}</span> <span className="font-bold text-indigo-700">{payload.novoPreco} MT</span></p>
        </>
      );
    }
    
    if (action === 'ADJUST_STOCK') {
      return (
        <>
          <p><span className="font-medium">{t('hitl.produto')}</span> {payload.produtoNome}</p>
          <p><span className="font-medium">{t('hitl.armazem')}</span> {payload.armazemNome}</p>
          <p><span className="font-medium text-indigo-600">{t('hitl.ajuste')}</span> <span className="font-bold text-indigo-700">{payload.ajuste > 0 ? '+' : ''}{payload.ajuste}</span></p>
          <p><span className="font-medium">{t('hitl.novo_saldo')}</span> {payload.novoSaldo}</p>
          <p className="mt-2 p-1.5 bg-white rounded border border-slate-200 italic">{t('hitl.motivo', { motivo: payload.motivo })}</p>
        </>
      );
    }

    if (action === 'TRANSFER_STOCK') {
      return (
        <>
          <p><span className="font-medium">{t('hitl.produto')}</span> {payload.produtoNome}</p>
          <p><span className="font-medium text-amber-600">{t('hitl.origem')}</span> {payload.sourceArmazemNome}</p>
          <p><span className="font-medium text-emerald-600">{t('hitl.destino')}</span> {payload.destArmazemNome}</p>
          <p><span className="font-medium text-indigo-600">{t('hitl.qtd_transferir')}</span> <span className="font-bold text-indigo-700">{payload.quantidade}</span></p>
        </>
      );
    }

    if (action === 'CREATE_USER') {
      return (
        <>
          <p><span className="font-medium">{t('hitl.nome')}</span> {payload.name}</p>
          <p><span className="font-medium">{t('hitl.email')}</span> {payload.email}</p>
          <p><span className="font-medium text-indigo-600">{t('hitl.perfil')}</span> <span className="font-bold">{payload.role}</span></p>
        </>
      );
    }

    if (action === 'TOGGLE_USER_STATUS') {
      return (
        <>
          <p><span className="font-medium">{t('hitl.funcionario')}</span> {payload.userName}</p>
          <p>
            <span className="font-medium">{t('hitl.accao')}{' '}</span>
            <span className={`font-bold ${payload.newStatus ? 'text-emerald-600' : 'text-red-600'}`}>
              {payload.newStatus ? t('hitl.ativar_acesso') : t('hitl.bloquear_acesso')}
            </span>
          </p>
          <p className="mt-2 p-1.5 bg-white rounded border border-slate-200 italic">{t('hitl.motivo', { motivo: payload.reason })}</p>
        </>
      );
    }

    if (action === 'REGISTER_EXPENSE') {
      return (
        <>
          <p><span className="font-medium">{t('hitl.descricao')}</span> {payload.descricao}</p>
          <p><span className="font-medium text-red-600">{t('hitl.valor')}</span> <span className="font-bold text-red-700">{payload.valor} MT</span></p>
          <p><span className="font-medium">{t('hitl.vencimento')}</span> {payload.vencimento}</p>
          <p>
            <span className="font-medium">{t('hitl.estado_inicial')}{' '}</span>
            <span className={`font-bold ${payload.isPaga ? 'text-emerald-600' : 'text-amber-600'}`}>
              {payload.isPaga ? t('hitl.pago') : t('hitl.pendente')}
            </span>
          </p>
        </>
      );
    }

    if (action === 'PAY_BILL') {
      return (
        <>
          <p><span className="font-medium">{t('hitl.conta_descricao')}</span> {payload.descricao}</p>
          <p><span className="font-medium text-emerald-600">{t('hitl.valor_liquidar')}</span> <span className="font-bold text-emerald-700">{payload.valor} MT</span></p>
          <p><span className="font-medium">{t('hitl.vencimento_original')}</span> {payload.vencimento}</p>
          <p className="mt-2 p-1.5 bg-emerald-50 rounded border border-emerald-200 font-medium text-emerald-800">
            {t('hitl.aviso_pagar')}
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
          {t('hitl.confirmar')}
        </button>
        <button
          onClick={() => sendMessage(t('hitl.cancelei'))}
          disabled={isLoading}
          className="flex-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-medium py-1.5 px-3 rounded shadow-sm transition-colors disabled:opacity-50"
        >
          {t('hitl.cancelar')}
        </button>
      </div>
    </div>
  );
}
