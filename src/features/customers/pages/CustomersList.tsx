import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function CustomersList() {
  const { t } = useTranslation('painel');

  return (
    <div className="space-y-6">
      {/* O cabeçalho da aplicação já diz «CRM». */}
      <div className="flex items-center justify-end">
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          {t('clientes.novo')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
        <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-lg font-medium text-slate-700 mb-1">{t('clientes.modulo')}</p>
        <p>{t('clientes.descricao')}</p>
        <p className="mt-4 text-sm text-indigo-600">{t('clientes.mayra')}</p>
      </div>
    </div>
  );
}
