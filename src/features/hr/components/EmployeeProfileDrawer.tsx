import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, User, Calendar, TrendingUp, History, Loader2, ShieldAlert } from 'lucide-react';
import { getEmployee360Profile } from '../api/hr.api';
import type { Employee360Profile } from '../types';
import { formatData, formatDataHora, formatMoeda } from '@/shared/utils';

interface EmployeeProfileDrawerProps {
  employeeId: string;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'perfil' | 'assiduidade' | 'performance' | 'auditoria';

export function EmployeeProfileDrawer({ employeeId, isOpen, onClose }: EmployeeProfileDrawerProps) {
  const { t } = useTranslation('rh');
  const [activeTab, setActiveTab] = useState<TabType>('perfil');
  const [profile, setProfile] = useState<Employee360Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && employeeId) {
      setIsLoading(true);
      setError(null);
      getEmployee360Profile(employeeId)
        .then(setProfile)
        .catch(() => setError(t('perfil.erro_carregar')))
        .finally(() => setIsLoading(false));
    } else {
      setProfile(null);
      setActiveTab('perfil');
    }
  }, [isOpen, employeeId, t]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/50 z-40 transition-opacity" 
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-50 flex flex-col transform transition-transform duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-900">{t('perfil.titulo')}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-sm">{t('perfil.a_carregar')}</p>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
                {error}
              </div>
            </div>
          ) : profile ? (
            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl shrink-0">
                  {profile.perfil.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{profile.perfil.nome}</h3>
                  <p className="text-sm text-slate-500">{profile.perfil.cargo} • {profile.perfil.isActive ? t('perfil.ativo') : t('perfil.inativo')}</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveTab('perfil')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'perfil' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <User className="w-4 h-4" /> {t('perfil.aba_perfil')}
                </button>
                <button
                  onClick={() => setActiveTab('assiduidade')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'assiduidade' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Calendar className="w-4 h-4" /> {t('perfil.aba_assiduidade')}
                </button>
                {profile.performance && (
                  <button
                    onClick={() => setActiveTab('performance')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'performance' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" /> {t('perfil.aba_performance')}
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('auditoria')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'auditoria' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <History className="w-4 h-4" /> {t('perfil.aba_auditoria')}
                </button>
              </div>

              {/* Tab Content */}
              <div className="pt-2">
                {activeTab === 'perfil' && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold">{t('perfil.email')}</p>
                        <p className="text-sm font-medium text-slate-900">{profile.perfil.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold">{t('perfil.data_contratacao')}</p>
                        <p className="text-sm font-medium text-slate-900">{formatData(profile.perfil.dataContratacao)}</p>
                      </div>
                    </div>

                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldAlert className="w-4 h-4 text-amber-500" />
                        <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wide">{t('perfil.dados_protegidos')}</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-amber-600/70 uppercase font-semibold">{t('perfil.bi')}</p>
                          <p className="text-sm font-medium text-amber-900">{profile.perfil.bi || t('perfil.nao_disponivel')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-amber-600/70 uppercase font-semibold">{t('perfil.nuit')}</p>
                          <p className="text-sm font-medium text-amber-900">{profile.perfil.nuit || t('perfil.nao_disponivel')}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-amber-600/70 uppercase font-semibold">{t('perfil.salario_base')}</p>
                          <p className="text-sm font-medium text-amber-900">
                            {profile.perfil.salarioBase ? formatMoeda(profile.perfil.salarioBase) : t('perfil.acesso_restrito')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'assiduidade' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-800">{t('perfil.mes_atual')}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <p className="text-2xl font-bold text-slate-700">{profile.assiduidade.turnosPlaneados}</p>
                        <p className="text-xs font-medium text-slate-500 uppercase mt-1">{t('perfil.turnos_planeados')}</p>
                      </div>
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <p className="text-2xl font-bold text-emerald-700">{profile.assiduidade.diasTrabalhados}</p>
                        <p className="text-xs font-medium text-emerald-600 uppercase mt-1">{t('perfil.dias_trabalhados')}</p>
                      </div>
                      <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                        <p className="text-2xl font-bold text-red-700">{profile.assiduidade.faltas}</p>
                        <p className="text-xs font-medium text-red-600 uppercase mt-1">{t('perfil.faltas')}</p>
                      </div>
                      <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                        <p className="text-2xl font-bold text-orange-700">{profile.assiduidade.atrasos}</p>
                        <p className="text-xs font-medium text-orange-600 uppercase mt-1">{t('perfil.atrasos')}</p>
                      </div>
                    </div>
                    {profile.assiduidade.minutosAtraso > 0 && (
                      <div className="text-sm text-center text-orange-600 mt-2">
                        {t('perfil.total_atraso_antes')}{' '}
                        <strong>{t('perfil.total_atraso_minutos', { count: profile.assiduidade.minutosAtraso })}</strong>{' '}
                        {t('perfil.total_atraso_depois')}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'performance' && profile.performance && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-800">{t('perfil.desempenho_pos')}</h4>
                    <div className="grid gap-3">
                      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="text-xs font-medium text-indigo-600 uppercase mb-1">{t('perfil.total_vendido')}</p>
                          <p className="text-xl font-bold text-indigo-900">
                            {formatMoeda(profile.performance.totalVendido)}
                          </p>
                        </div>
                        <TrendingUp className="w-6 h-6 text-indigo-300" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <p className="text-xs font-medium text-slate-500 uppercase mb-1">{t('perfil.ticket_medio')}</p>
                          <p className="text-lg font-bold text-slate-700">
                            {formatMoeda(profile.performance.ticketMedio)}
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <p className="text-xs font-medium text-slate-500 uppercase mb-1">{t('perfil.diferencas_caixa')}</p>
                          <p className={`text-lg font-bold ${profile.performance.diferencasCaixa < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {formatMoeda(profile.performance.diferencasCaixa)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'auditoria' && (
                  <div className="space-y-3">
                    {profile.auditoria.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-6">{t('perfil.sem_auditoria')}</p>
                    ) : (
                      <div className="relative border-l border-slate-200 ml-3 space-y-6 pb-4">
                        {profile.auditoria.map((log) => (
                          <div key={log.id} className="relative pl-5">
                            <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 ring-4 ring-white" />
                            <p className="text-xs text-slate-400 mb-0.5">{formatDataHora(log.createdAt)}</p>
                            <p className="text-sm text-slate-700">
                              <span className="font-semibold text-slate-900">{log.action}</span> {t('perfil.auditoria_em')} <span className="font-medium">{log.entityName}</span>
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 break-all">{t('perfil.id_entidade', { id: log.entityId })}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
