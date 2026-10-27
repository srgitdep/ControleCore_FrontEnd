import { useAuth } from '@/features/auth';
import { AuditLogTable } from '../components/AuditLogTable';
import { SessoesDeSuporte } from '@/features/suporte';
import { useEmpresas } from '@/features/empresas';
import { History } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function HistoryPage() {
  const { t } = useTranslation('historico');
  const { user } = useAuth();
  const ehSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [empresaId, setEmpresaId] = useState('');
  // A lista só é pedida ao Super Admin: `GET /empresas` é da plataforma e daria 403 aos outros.
  const { data: empresas } = useEmpresas({ activo: ehSuperAdmin });

  // Se for nÍvel gerencial ou superior, vamos não enviar userId por padrão para carregar o histórico global
  // Caso contrário, enviamos o próprio id (embora o backend já faça este enforce de segurança)
  const isManagerial = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user?.role || '');
  const targetUserId = isManagerial ? undefined : user?.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <History size={24} />
        </div>
        {/* Aqui o título dizia mais do que o nome da página: distinguia o histórico
            global do pessoal, e o cabeçalho da aplicação diz só «Histórico no
            Sistema». A distinção fica — é ela que muda o que se está a ver. */}
        <p className="text-sm text-slate-500">
          {isManagerial
            ? t('pagina.global')
            : t('pagina.pessoal')}
        </p>
      </div>

      {ehSuperAdmin && (
        <label className="flex flex-col gap-1 text-sm text-slate-600 sm:max-w-xs">
          {t('pagina.empresa')}
          <select
            value={empresaId}
            onChange={(e) => setEmpresaId(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="">{t('pagina.todas_as_empresas')}</option>
            {empresas?.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        </label>
      )}

      <AuditLogTable userId={targetUserId} empresaId={empresaId || undefined} />

      {/* As visitas da plataforma: só para quem pode ver a auditoria da empresa. */}
      {user?.role === 'ADMIN' && <SessoesDeSuporte />}
    </div>
  );
}
