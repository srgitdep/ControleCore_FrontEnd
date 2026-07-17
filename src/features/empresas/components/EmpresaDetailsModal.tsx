import { X, Building2, MapPin, Phone, Mail, Calendar, CheckCircle2, Ban, CreditCard, Users, Store, ShieldCheck, Box } from 'lucide-react';
import type { Empresa } from '@/features/empresas';
import { useQuery } from '@tanstack/react-query';
import { getEmpresaDetails } from '@/features/empresas';

interface EmpresaDetailsModalProps {
  empresa: Empresa;
  onClose: () => void;
}

export function EmpresaDetailsModal({ empresa, onClose }: EmpresaDetailsModalProps) {
  const { data: details, isLoading } = useQuery({
    queryKey: ['empresa-detalhes', empresa.id],
    queryFn: () => getEmpresaDetails(empresa.id),
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const gestorPrincipal = details?.users?.find(u => u.role === 'ADMIN' || u.role === 'MANAGER');
  const totalFuncionarios = details?.users?.length || 0;
  
  const assinaturaAtiva = details?.assinaturas?.find(a => a.estado === 'ATIVA' || a.estado === 'TRIAL');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Building2 size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Detalhes da Empresa</h2>
              <p className="text-xs text-slate-500">VisualizaÃ§Ã£o completa do registo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto bg-slate-50/50">
          
          {/* Status Badge */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 mb-6 shadow-sm">
            <div>
              <h3 className="text-base font-semibold text-slate-800">{empresa.nome}</h3>
              <p className="text-sm text-slate-500 mt-0.5">NUIT: {empresa.nuit}</p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                empresa.isActive
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-200 text-slate-700 border border-slate-300'
              }`}
            >
              {empresa.isActive ? <CheckCircle2 size={14} /> : <Ban size={14} />}
              {empresa.isActive ? 'Ativa no Sistema' : 'Conta Suspensa'}
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-32 bg-slate-200 rounded-xl"></div>
              <div className="h-32 bg-slate-200 rounded-xl"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Coluna Esquerda */}
              <div className="space-y-6">
                
                {/* Contactos e LocalizaÃ§Ã£o */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Contactos & LocalizaÃ§Ã£o</h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Mail size={16} className="text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500">E-mail Principal</p>
                        <p className="text-sm font-medium text-slate-800">{empresa.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone size={16} className="text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500">Telefone</p>
                        <p className="text-sm font-medium text-slate-800">{empresa.telefone || 'NÃ£o informado'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500">LocalizaÃ§Ã£o</p>
                        <p className="text-sm font-medium text-slate-800">
                          {empresa.endereco ? `${empresa.endereco}, ${empresa.cidade || ''}` : 'EndereÃ§o nÃ£o informado'}
                          <br />
                          <span className="text-slate-500">{empresa.pais}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recursos Humanos */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Users size={16} /> Equipa e GestÃ£o
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Gestor Principal</p>
                      {gestorPrincipal ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                            {gestorPrincipal.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{gestorPrincipal.name}</p>
                            <p className="text-xs text-slate-500">{gestorPrincipal.email}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic">Sem informaÃ§Ã£o</p>
                      )}
                    </div>
                    
                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-500">Total de FuncionÃ¡rios (Utilizadores)</p>
                      <p className="text-lg font-bold text-slate-800">{totalFuncionarios}</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Coluna Direita */}
              <div className="space-y-6">
                
                {/* Plano e FaturaÃ§Ã£o */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ShieldCheck size={16} /> Plano e FaturaÃ§Ã£o
                  </h4>
                  
                  {assinaturaAtiva ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-start bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                        <div>
                          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Plano Atual</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {assinaturaAtiva.modulos.map((m, idx) => (
                              <span key={idx} className="bg-white border border-blue-200 text-blue-800 text-xs px-2 py-0.5 rounded shadow-sm">
                                {m.modulo.nome}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                          {assinaturaAtiva.estado}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Ciclo de FaturaÃ§Ã£o:</span>
                        <span className="font-medium text-slate-800">{assinaturaAtiva.ciclo}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Valor Total:</span>
                        <span className="font-medium text-slate-800">{Number(assinaturaAtiva.valorTotal).toLocaleString('pt-MZ', { style: 'currency', currency: empresa.moeda })}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Expira em:</span>
                        <span className="font-medium text-rose-600">{formatDate(assinaturaAtiva.dataFim)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-slate-500 italic">Nenhum plano ativo no momento.</p>
                    </div>
                  )}
                  
                  {/* HistÃ³rico Resumido */}
                  {details?.assinaturas && details.assinaturas.length > 1 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-500 mb-2">HistÃ³rico de Assinaturas ({details.assinaturas.length})</p>
                      <div className="space-y-2 max-h-24 overflow-y-auto pr-1">
                        {details.assinaturas.map(ass => (
                          <div key={ass.id} className="flex justify-between text-xs border border-slate-100 p-2 rounded">
                            <span className="font-medium text-slate-600">{formatDate(ass.dataInicio)}</span>
                            <span className={ass.estado === 'ATIVA' ? 'text-emerald-600 font-medium' : 'text-slate-400'}>{ass.estado}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Lojas e OperaÃ§Ãµes */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Store size={16} /> Lojas e OperaÃ§Ãµes
                  </h4>
                  
                  {details?.lojas && details.lojas.length > 0 ? (
                    <div className="space-y-3">
                      {details.lojas.map(loja => (
                        <div key={loja.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                              <Box size={14} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">{loja.nome}</p>
                              <p className="text-xs text-slate-500">{loja.cidade || 'Local nÃ£o definido'}</p>
                            </div>
                          </div>
                          <span className={`w-2 h-2 rounded-full ${loja.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      <p className="text-sm text-slate-500 italic mb-1">Sem informaÃ§Ã£o</p>
                      <p className="text-xs text-slate-400">Nenhuma loja registada para esta empresa.</p>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* RodapÃ© informativo (Criado em) */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Registada no sistema a {formatDateTime(empresa.createdAt)}
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
