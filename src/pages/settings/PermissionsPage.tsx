import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { AVAILABLE_RESOURCES, AVAILABLE_ACTIONS, IGNORED_PERMISSIONS } from '@/config/permissions.config';
import { Users, Shield, Save } from 'lucide-react';
import { api } from '@/api/axios';

interface Role {
  id: string;
  nome: string;
  descricao?: string;
  isSystem?: boolean;
}

export function PermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isLoadingPerms, setIsLoadingPerms] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Carregar Roles
  useEffect(() => {
    async function loadRoles() {
      try {
        setIsLoadingRoles(true);
        const { data } = await api.get('/perfis');
        setRoles(data);
        if (data.length > 0) {
          setSelectedRoleId(data[0].id);
        }
      } catch (error) {
        toast.error('Erro ao carregar os perfis.');
      } finally {
        setIsLoadingRoles(false);
      }
    }
    loadRoles();
  }, []);

  // 2. Carregar Permissões quando um Role for selecionado
  useEffect(() => {
    async function loadPermissions() {
      if (!selectedRoleId) return;
      try {
        setIsLoadingPerms(true);
        const { data } = await api.get(`/perfis/${selectedRoleId}/permissions`);
        
        // data deve ser um array de strings ["read:users", "write:lojas"]
        const flat = Array.isArray(data) 
          ? data.map((p: any) => typeof p === 'string' ? p : `${p.action}:${p.resource}`)
          : [];
        setSelectedPermissions(new Set(flat));
      } catch (error) {
        toast.error('Erro ao carregar permissões deste perfil.');
      } finally {
        setIsLoadingPerms(false);
      }
    }
    
    loadPermissions();
  }, [selectedRoleId]);

  const handleToggle = (actionId: string, resourceId: string) => {
    const permission = `${actionId}:${resourceId}`;
    
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permission)) {
        // Desmarcar a permissão
        next.delete(permission);
        
        // Se desmarcou 'manage', desmarca também as restantes do recurso
        if (actionId === 'manage') {
          AVAILABLE_ACTIONS.forEach(a => next.delete(`${a.id}:${resourceId}`));
        }
      } else {
        // Marcar a permissão
        next.add(permission);
        
        // Se marcou 'manage', seleciona automaticamente as restantes opções (read, write, delete)
        if (actionId === 'manage') {
          AVAILABLE_ACTIONS.forEach(a => {
            const permKey = `${a.id}:${resourceId}`;
            if (!IGNORED_PERMISSIONS.includes(permKey)) {
              next.add(permKey);
            }
          });
        }
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    
    setIsSaving(true);
    const flatPermissions = Array.from(selectedPermissions);

    try {
      await api.post(`/perfis/${selectedRoleId}/permissions`, { permissionIds: flatPermissions });
      toast.success('Permissões atualizadas com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar permissões.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedRole = roles.find(r => r.id === selectedRoleId);

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-120px)] flex gap-6">
      
      {/* SIDEBAR: Lista de Perfis */}
      <div className="w-80 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Perfis de Acesso
          </h2>
          <p className="text-xs text-slate-500 mt-1">Selecione o perfil para configurar as permissões.</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {isLoadingRoles ? (
            <p className="text-center text-sm text-slate-400 py-4">A carregar...</p>
          ) : roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRoleId(role.id)}
              className={`w-full text-left p-3 rounded-lg transition-all duration-150 flex items-start gap-3 ${
                selectedRoleId === role.id 
                  ? 'bg-emerald-50 border border-emerald-200/60 shadow-sm' 
                  : 'hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className={`p-2 rounded-md ${selectedRoleId === role.id ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className={`text-sm font-medium ${selectedRoleId === role.id ? 'text-emerald-900' : 'text-slate-700'}`}>
                  {role.nome}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{role.descricao}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN: Matriz de Permissões */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {selectedRole ? (
          <>
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  Matriz de Permissões
                  <span className="text-emerald-600 text-sm font-normal bg-emerald-100 px-2 py-0.5 rounded-full">
                    {selectedRole.nome}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">Assinale o que este perfil pode ver e fazer.</p>
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving || isLoadingPerms}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-70 flex items-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'A guardar...' : 'Guardar Alterações'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {isLoadingPerms ? (
                <div className="flex justify-center p-12 text-slate-500">A carregar permissões do servidor...</div>
              ) : (
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-4 font-medium w-1/4">Módulo / Recurso</th>
                      {AVAILABLE_ACTIONS.map((action) => (
                        <th key={action.id} className="px-6 py-4 font-medium text-center">
                          {action.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {AVAILABLE_RESOURCES.map((resource) => (
                      <tr key={resource.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-800">
                          {resource.label}
                        </td>
                        
                        {AVAILABLE_ACTIONS.map((action) => {
                          const permKey = `${action.id}:${resource.id}`;
                          const isIgnored = IGNORED_PERMISSIONS.includes(permKey);
                          const isChecked = selectedPermissions.has(permKey);

                          return (
                            <td key={action.id} className="px-6 py-4 text-center">
                              {!isIgnored ? (
                                <div className="inline-flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggle(action.id, resource.id)}
                                    className="w-5 h-5 text-emerald-600 bg-white border-2 border-slate-300 rounded focus:ring-emerald-600 focus:ring-2 cursor-pointer appearance-none checked:bg-emerald-600 checked:border-emerald-600 transition-all
                                      relative checked:after:content-[''] checked:after:absolute checked:after:left-[6px] checked:after:top-[2px] checked:after:w-[5px] checked:after:h-[10px] checked:after:border-r-2 checked:after:border-b-2 checked:after:border-white checked:after:rotate-45"
                                  />
                                </div>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <Shield className="w-12 h-12 mb-4 text-slate-300" />
            <p>Selecione um perfil à esquerda para configurar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
