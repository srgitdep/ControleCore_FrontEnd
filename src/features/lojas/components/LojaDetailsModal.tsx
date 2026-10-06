import React, { useState } from 'react';
import { X, Box, MonitorSmartphone, Plus, Trash2, CheckCircle2, User, Loader2, MapPin, LocateFixed } from 'lucide-react';
import { criarCaixa, removerCaixa } from '@/features/vendas';
import { createArmazem, deleteArmazem, updateLoja, TIPOS_ARMAZEM } from '@/features/lojas';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { MapaEntregaLazy } from '@/shared/ui/mapa/MapaEntregaLazy';
import type { PontoNoMapa } from '@/shared/ui/mapa/MapaEntrega';

export type AbaLoja = 'INFO' | 'ARMAZENS' | 'CAIXAS' | 'LOCALIZACAO';

export function LojaDetailsModal({ loja, users, onClose, onUpdate, abaInicial = 'CAIXAS' }: { loja: any; users: any[]; onClose: () => void; onUpdate: () => void; abaInicial?: AbaLoja }) {
  const { t } = useTranslation('lojas');
  const [activeTab, setActiveTab] = useState<AbaLoja>(abaInicial);
  
  // States para novos
  const [novoCaixa, setNovoCaixa] = useState('');
  const [novoArmazem, setNovoArmazem] = useState('');
  // O tipo era fixo em 'Venda', o que impedia criar reservas e colide com a regra
  // de um único ponto de venda por loja.
  const [novoArmazemTipo, setNovoArmazemTipo] = useState<string>('Reserva');
  const [isCreatingArmazem, setIsCreatingArmazem] = useState(false);
  const [gestorId, setGestorId] = useState(loja.gestorId || '');
  const [isSavingGestor, setIsSavingGestor] = useState(false);
  const [isCreatingCaixa, setIsCreatingCaixa] = useState(false);
  // A localização da loja é o ponto de partida das distâncias da entrega ao domicílio.
  const [localizacao, setLocalizacao] = useState<PontoNoMapa | null>(
    loja.latitude != null && loja.longitude != null ? { latitude: loja.latitude, longitude: loja.longitude } : null,
  );
  const [isSavingLocalizacao, setIsSavingLocalizacao] = useState(false);
  const [aLocalizar, setALocalizar] = useState(false);
  // Metros de erro do último GPS — um gestor dentro da loja com sinal fraco pode receber
  // 500 m de erro, e gravar isso sem aviso estragaria todas as distâncias da entrega.
  const [precisaoGps, setPrecisaoGps] = useState<number | null>(null);

  // A geolocalização só existe em contexto seguro (HTTPS ou localhost): fora dele o botão
  // nem aparece, em vez de falhar em silêncio ao ser premido.
  const podeUsarGps = typeof window !== 'undefined' && window.isSecureContext && 'geolocation' in navigator;

  const handleUsarGps = () => {
    setALocalizar(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocalizacao({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setPrecisaoGps(Math.round(pos.coords.accuracy));
        setALocalizar(false);
      },
      () => {
        toast.error(t('detalhes.gps_negado'));
        setALocalizar(false);
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  };

  const handleSaveLocalizacao = async () => {
    if (!localizacao) return;
    setIsSavingLocalizacao(true);
    try {
      await updateLoja(loja.id, { latitude: localizacao.latitude, longitude: localizacao.longitude });
      toast.success(t('detalhes.localizacao_guardada'));
      onUpdate();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('detalhes.erro_localizacao'));
    } finally {
      setIsSavingLocalizacao(false);
    }
  };

  const handleCreateCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoCaixa.trim()) return;
    setIsCreatingCaixa(true);
    try {
      await criarCaixa({ lojaId: loja.id, nome: novoCaixa });
      toast.success(t('detalhes.caixa_adicionado'));
      setNovoCaixa('');
      onUpdate();
    } catch {
      toast.error(t('detalhes.erro_adicionar_caixa'));
    } finally {
      setIsCreatingCaixa(false);
    }
  };

  const handleCreateArmazem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoArmazem.trim()) return;
    setIsCreatingArmazem(true);
    try {
      await createArmazem({ lojaId: loja.id, nome: novoArmazem, tipo: novoArmazemTipo });
      toast.success(t('detalhes.armazem_adicionado'));
      setNovoArmazem('');
      onUpdate();
    } catch (error: any) {
      // O backend recusa um segundo armazém de venda com mensagem explícita —
      // mostrá-la é mais útil do que um erro genérico.
      toast.error(error?.response?.data?.message || t('detalhes.erro_adicionar_armazem'));
    } finally {
      setIsCreatingArmazem(false);
    }
  };

  const handleDeleteCaixa = async (id: string) => {
    if (!confirm(t('detalhes.confirmar_desativar_terminal'))) return;
    try {
      await removerCaixa(id);
      toast.success(t('detalhes.caixa_removido'));
      onUpdate();
    } catch {
      toast.error(t('detalhes.erro_remover_caixa'));
    }
  };

  const handleDeleteArmazem = async (id: string) => {
    // Desactivação lógica: o stock e os movimentos mantêm-se, por isso o texto não
    // deve prometer que o armazém é apagado.
    if (!confirm(t('detalhes.confirmar_desactivar_armazem'))) return;
    try {
      await deleteArmazem(id);
      toast.success(t('detalhes.armazem_desactivado'));
      onUpdate();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('detalhes.erro_desactivar_armazem'));
    }
  };

  const handleUpdateGestor = async () => {
    setIsSavingGestor(true);
    try {
      await updateLoja(loja.id, { gestorId });
      toast.success(t('detalhes.gestor_actualizado'));
      onUpdate();
    } catch {
      toast.error(t('detalhes.erro_actualizar_gestor'));
    } finally {
      setIsSavingGestor(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{loja.nome}</h2>
            <p className="text-sm text-slate-500">{t('detalhes.subtitulo')}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('CAIXAS')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'CAIXAS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <MonitorSmartphone size={16} /> {t('detalhes.aba_caixas')}
          </button>
          <button 
            onClick={() => setActiveTab('ARMAZENS')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'ARMAZENS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Box size={16} /> {t('detalhes.aba_armazens')}
          </button>
          <button
            onClick={() => setActiveTab('LOCALIZACAO')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'LOCALIZACAO' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <MapPin size={16} /> {t('detalhes.aba_localizacao')}
          </button>
          <button
            onClick={() => setActiveTab('INFO')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'INFO' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <User size={16} /> {t('pagina.gestor_principal')}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
          
          {activeTab === 'CAIXAS' && (
            <div className="space-y-6">
              <form onSubmit={handleCreateCaixa} className="flex gap-3">
                <input 
                  type="text" 
                  value={novoCaixa}
                  onChange={e => setNovoCaixa(e.target.value)}
                  placeholder={t('detalhes.caixa_exemplo')} 
                  className="flex-1 px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                <button type="submit" disabled={!novoCaixa.trim() || isCreatingCaixa} className="px-5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-sm">
                  {isCreatingCaixa ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} {t('acoes.adicionar')}
                </button>
              </form>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                {loja.caixas?.length > 0 ? (
                  <ul className="divide-y divide-slate-100">
                    {loja.caixas.map((c: any) => (
                      <li key={c.id} className={`flex items-center justify-between p-4 ${!c.isActive && 'opacity-50'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${c.isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                            <MonitorSmartphone size={18} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 flex items-center gap-2">
                              {c.nome}
                              {!c.isActive && <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded uppercase font-bold">{t('pagina.inativo')}</span>}
                            </p>
                          </div>
                        </div>
                        {c.isActive && (
                          <button onClick={() => handleDeleteCaixa(c.id)} className="text-slate-400 hover:text-rose-500 p-2 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    <MonitorSmartphone className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <p>{t('detalhes.sem_caixas')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ARMAZENS' && (
            <div className="space-y-6">
              <form onSubmit={handleCreateArmazem} className="flex gap-3">
                <input
                  type="text"
                  value={novoArmazem}
                  onChange={e => setNovoArmazem(e.target.value)}
                  placeholder={t('detalhes.armazem_exemplo')}
                  className="flex-1 px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                <select
                  value={novoArmazemTipo}
                  onChange={e => setNovoArmazemTipo(e.target.value)}
                  title={t('detalhes.tipo_ajuda')}
                  className="px-3 py-2.5 border rounded-xl bg-white focus:ring-2 focus:ring-blue-500 shadow-sm text-sm"
                >
                  {TIPOS_ARMAZEM.map(tipo => (
                    <option key={tipo} value={tipo}>{t(`tipos.${tipo}`)}</option>
                  ))}
                </select>
                <button type="submit" disabled={!novoArmazem.trim() || isCreatingArmazem} className="px-5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 shadow-sm">
                  {isCreatingArmazem ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} {t('acoes.adicionar')}
                </button>
              </form>
              <p className="text-xs text-slate-500 -mt-1">
                {t('detalhes.ponto_venda_antes')} <strong>{t('detalhes.ponto_venda')}</strong> {t('detalhes.ponto_venda_meio')}{' '}
                <em>{t('detalhes.ponto_venda_tipo')}</em>{t('detalhes.ponto_venda_depois')}
              </p>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                {loja.armazens?.length > 0 ? (
                  <ul className="divide-y divide-slate-100">
                    {loja.armazens.map((a: any) => (
                      <li key={a.id} className={`flex items-center justify-between p-4 ${a.isActive === false ? 'opacity-60' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${a.tipo?.toUpperCase() === 'VENDA' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            <Box size={18} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 flex items-center gap-2">
                              {a.nome}
                              {a.tipo?.toUpperCase() === 'VENDA' && (
                                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                                  {t('detalhes.ponto_de_venda_etiqueta')}
                                </span>
                              )}
                              {a.isActive === false && (
                                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                                  {t('detalhes.inactivo')}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500">{t('detalhes.tipo', { tipo: a.tipo || '—' })}</p>
                          </div>
                        </div>
                        {a.isActive !== false && (
                          <button
                            onClick={() => handleDeleteArmazem(a.id)}
                            title={t('detalhes.desactivar_armazem')}
                            className="text-slate-400 hover:text-rose-500 p-2 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    <Box className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <p>{t('detalhes.sem_armazens')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'LOCALIZACAO' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">{t('detalhes.localizacao_label')}</h3>
                <p className="text-xs text-slate-500 mt-1">{t('detalhes.localizacao_ajuda')}</p>
              </div>

              {podeUsarGps ? (
                <button
                  type="button"
                  onClick={handleUsarGps}
                  disabled={aLocalizar}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 disabled:opacity-50"
                >
                  {aLocalizar ? <Loader2 size={18} className="animate-spin" /> : <LocateFixed size={18} />}
                  {t('detalhes.usar_gps')}
                </button>
              ) : (
                <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">{t('detalhes.gps_indisponivel')}</p>
              )}

              {precisaoGps !== null && (
                <p className={precisaoGps > 100 ? 'text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2' : 'text-xs text-emerald-700'}>
                  {precisaoGps > 100
                    ? t('detalhes.gps_precisao_baixa', { metros: precisaoGps })
                    : t('detalhes.gps_precisao', { metros: precisaoGps })}
                </p>
              )}

              <MapaEntregaLazy
                marcador={localizacao}
                aoEscolher={(p) => {
                  setLocalizacao(p);
                  // Marcar à mão substitui o GPS: a precisão deixa de se aplicar.
                  setPrecisaoGps(null);
                }}
              />
              {localizacao ? (
                <p className="text-xs text-slate-500">
                  {localizacao.latitude.toFixed(5)}, {localizacao.longitude.toFixed(5)}
                </p>
              ) : (
                <p className="text-xs text-slate-400">{t('detalhes.localizacao_sem_ponto')}</p>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleSaveLocalizacao}
                  disabled={isSavingLocalizacao || !localizacao}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingLocalizacao ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} {t('detalhes.guardar_localizacao')}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'INFO' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('detalhes.gestor_label')}</label>
                <select 
                  value={gestorId} 
                  onChange={e => setGestorId(e.target.value)} 
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('sem_gestor')}</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
                <p className="text-xs text-slate-500 mt-2">{t('detalhes.gestor_ajuda')}</p>
              </div>
              <div className="flex justify-end pt-2">
                <button 
                  onClick={handleUpdateGestor}
                  disabled={isSavingGestor || gestorId === (loja.gestorId || '')}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle2 size={18} /> {t('detalhes.guardar_gestor')}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
