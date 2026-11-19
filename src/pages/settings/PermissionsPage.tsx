import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { AVAILABLE_ACTIONS } from '@/shared/config/permissions.config';
import { Users, Shield, Save } from 'lucide-react';
import {
  AccoesDoPerfil,
  NovoPerfilForm,
  usePerfis,
  useRecursosPermissao,
  type RecursoDePermissao,
} from '@/features/permissoes';
import { Plus } from 'lucide-react';
import { api } from '@/shared/config';
import { mensagemDeErro } from '@/shared/utils';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

export function PermissionsPage() {
  const { t } = useTranslation('shell');
  const hasRole = useAuthStore((s) => s.hasRole);
  const { data: roles = [], isLoading: isLoadingRoles, isError: erroPerfis } = usePerfis();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [aCriar, setACriar] = useState(false);
  // Um perfil próprio pertence a uma empresa, e o Super Admin não tem nenhuma (fora do modo
  // suporte, onde é visto como ADMIN da empresa). O servidor recusa na mesma, com 400.
  const podeCriarPerfis = !hasRole(['SUPER_ADMIN']);

  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [isLoadingPerms, setIsLoadingPerms] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { data: recursos = [], isLoading: isLoadingRecursos } = useRecursosPermissao();

  // As linhas por área, pela ordem em que o servidor as envia.
  const grupos = recursos.reduce<{ grupo: string; recursos: RecursoDePermissao[] }[]>(
    (acc, recurso) => {
      const ultimo = acc[acc.length - 1];
      if (ultimo && ultimo.grupo === recurso.grupo) ultimo.recursos.push(recurso);
      else acc.push({ grupo: recurso.grupo, recursos: [recurso] });
      return acc;
    },
    [],
  );

  // Os de sistema primeiro, depois os da empresa por nome.
  const perfisOrdenados = useMemo(
    () =>
      [...roles].sort((a, b) =>
        a.isSystem === b.isSystem ? a.nome.localeCompare(b.nome) : a.isSystem ? -1 : 1,
      ),
    [roles],
  );

  const formNovoPerfil = aCriar && (
    <NovoPerfilForm
      perfis={perfisOrdenados}
      onFechar={() => setACriar(false)}
      onCriado={(criado) => {
        setACriar(false);
        setSelectedRoleId(criado.id);
      }}
    />
  );
  const botaoNovoPerfil = podeCriarPerfis && !aCriar && (
    <button
      type="button"
      onClick={() => setACriar(true)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
    >
      <Plus size={14} />
      {t('permissoes.gerir.novo')}
    </button>
  );

  // 1. Escolher um perfil quando a lista chega, ou quando o escolhido deixa de existir.
  useEffect(() => {
    if (erroPerfis) toast.error(t('permissoes.erro_perfis'));
  }, [erroPerfis, t]);

  useEffect(() => {
    if (perfisOrdenados.length === 0) return;
    if (!selectedRoleId || !perfisOrdenados.some((p) => p.id === selectedRoleId)) {
      setSelectedRoleId(perfisOrdenados[0].id);
    }
  }, [perfisOrdenados, selectedRoleId]);

  // 2. Carregar Permissões quando um Role for selecionado
  useEffect(() => {
    async function loadPermissions() {
      if (!selectedRoleId) return;
      try {
        setIsLoadingPerms(true);
        const { data } = await api.get(`/perfis/${selectedRoleId}/permissoes`);
        
        // data deve ser um array de strings ["read:users", "write:lojas"]
        const flat = Array.isArray(data) 
          ? data.map((p: any) => typeof p === 'string' ? p : `${p.action}:${p.resource}`)
          : [];
        setSelectedPermissions(new Set(flat));
      } catch (error) {
        toast.error(t('permissoes.erro_permissoes'));
      } finally {
        setIsLoadingPerms(false);
      }
    }
    
    loadPermissions();
  }, [selectedRoleId, t]);

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
        
        // Se marcou 'manage', marca também as outras acções que este recurso tem.
        if (actionId === 'manage') {
          const recurso = recursos.find((r) => r.id === resourceId);
          recurso?.acoes.forEach((a) => next.add(`${a}:${resourceId}`));
        }
      }
      return next;
    });
  };

  const handleSave = async () => {
    // Sem o catálogo carregado, o filtro abaixo deixava a lista vazia e a gravação apagava
    // todas as permissões do perfil — com um backend antigo (sem `GET /perfis/recursos`) ou
    // uma falha de rede.
    if (!selectedRoleId || somenteLeitura || recursos.length === 0) return;
    
    setIsSaving(true);
    // Só o que a matriz mostra. Um perfil antigo pode trazer linhas que já não existem no
    // catálogo (o `catalogo` que deu lugar a produtos, categorias…): reenviá-las mantinha-as
    // no perfil sem que ninguém as visse nem as pudesse desmarcar.
    const doCatalogo = new Set(recursos.flatMap((r) => r.acoes.map((a) => `${a}:${r.id}`)));
    const flatPermissions = Array.from(selectedPermissions).filter((p) => doCatalogo.has(p));

    try {
      await api.post(`/perfis/${selectedRoleId}/permissoes`, { permissionIds: flatPermissions });
      toast.success(t('permissoes.sucesso'));
    } catch (error) {
      // O servidor explica a recusa — ex.: um perfil de sistema só a SRG o pode alterar.
      // A mensagem fixa escondia o motivo e deixava o ADMIN a tentar outra vez.
      toast.error(mensagemDeErro(error, t('permissoes.erro_guardar')));
    } finally {
      setIsSaving(false);
    }
  };

  const selectedRole = roles.find(r => r.id === selectedRoleId);
  // O servidor recusa (403) a gravação de perfis de sistema a quem não é da SRG; o ecrã
  // já não oferece o que sabe que vai falhar.
  const somenteLeitura = !!selectedRole?.isSystem && !hasRole(['SUPER_ADMIN']);
  const perfilAdminSistema = !!selectedRole?.isSystem && selectedRole.nome === 'Administrador';

  return (
    /* O layout era `flex gap-6` com a barra de perfis em `w-80` **fixo, sem `lg:`** —
     * 320px dos 375 de um telemóvel, sem colapsar. A matriz ficava com 55px. E a altura
     * `h-[calc(100vh-120px)]` assumia um cabeçalho que em mobile tem outra medida.
     *
     * Abaixo de `lg`, a barra dá lugar a um selector e a altura passa a natural. */
    <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:h-[calc(100vh-120px)] lg:flex-row lg:gap-6">

      {/* ── Escolha do perfil, em ecrã estreito ──────────────────────────────
          Um `<select>` em vez da lista: doze perfis numa lista vertical seriam mais
          um ecrã de deslocamento antes de a matriz aparecer. */}
      <div className="space-y-2 lg:hidden">
        <div className="flex items-center justify-between">
          <label htmlFor="perfil" className="block text-sm font-medium text-slate-700">
            {t('permissoes.perfil_acesso')}
          </label>
          {botaoNovoPerfil}
        </div>
        {formNovoPerfil}
        <select
          id="perfil"
          value={selectedRoleId ?? ''}
          onChange={(e) => setSelectedRoleId(e.target.value)}
          disabled={isLoadingRoles}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50"
        >
          {isLoadingRoles && <option>{t('permissoes.a_carregar')}</option>}
          {perfisOrdenados.map((role) => (
            <option key={role.id} value={role.id}>
              {role.isSystem ? `${role.nome} (${t('permissoes.gerir.de_sistema')})` : role.nome}
            </option>
          ))}
        </select>
      </div>

      {/* SIDEBAR: Lista de Perfis — a partir de lg */}
      <div className="hidden w-80 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:flex">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            {t('permissoes.perfis_titulo')}
          </h2>
          <p className="text-xs text-slate-500 mt-1">{t('permissoes.perfis_ajuda')}</p>
          {botaoNovoPerfil && <div className="mt-3">{botaoNovoPerfil}</div>}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
          {formNovoPerfil && <div className="mb-2">{formNovoPerfil}</div>}
          {isLoadingRoles ? (
            <p className="text-center text-sm text-slate-400 py-4">{t('permissoes.a_carregar')}</p>
          ) : perfisOrdenados.map((role) => (
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
                <p className={`flex items-center gap-1.5 text-sm font-medium ${selectedRoleId === role.id ? 'text-emerald-900' : 'text-slate-700'}`}>
                  {role.nome}
                  {role.isSystem && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {t('permissoes.gerir.de_sistema')}
                    </span>
                  )}
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
            {/* Empilha em telemóvel: o título com o badge do perfil e um botão de
                «Guardar Alterações» lado a lado não cabem em 343px. */}
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="min-w-0">
                <h3 className="flex flex-wrap items-center gap-2 text-base font-semibold text-slate-800 sm:text-lg">
                  {t('permissoes.matriz_titulo')}
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-sm font-normal text-emerald-600">
                    {selectedRole.nome}
                  </span>
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {t('permissoes.matriz_ajuda')}
                </p>
                {!selectedRole.isSystem && (
                  <div className="mt-2">
                    <AccoesDoPerfil
                      key={selectedRole.id}
                      perfil={selectedRole}
                      onApagado={() => setSelectedRoleId(null)}
                    />
                  </div>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving || isLoadingPerms || somenteLeitura || recursos.length === 0}
                className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Save className="h-4 w-4" />
                {isSaving ? t('permissoes.a_guardar') : t('permissoes.guardar')}
              </button>
            </div>

            {(somenteLeitura || perfilAdminSistema) && (
              <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 sm:px-6">
                {somenteLeitura ? t('permissoes.aviso_sistema') : t('permissoes.aviso_admin')}
              </div>
            )}

            {/* Deslocamento nos dois eixos. A matriz não vira cartões: o que a torna
                útil é comparar colunas de relance, e um cartão por recurso com quatro
                caixas empilhadas perde exactamente isso.
                A primeira coluna fica fixa (`sticky left-0`) — sem ela, ao deslizar
                para a direita deixa de se saber de que recurso é cada caixa. */}
            <div className="flex-1 overflow-auto custom-scrollbar">
              {isLoadingPerms || isLoadingRecursos ? (
                <div className="flex justify-center p-12 text-slate-500">{t('permissoes.a_carregar_servidor')}</div>
              ) : (
                <table className="w-full min-w-[560px] text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                    <tr>
                      <th className="sticky left-0 z-30 w-1/4 min-w-[140px] bg-slate-50 px-4 py-4 font-medium sm:px-6">
                        {t('permissoes.coluna_recurso')}
                      </th>
                      {AVAILABLE_ACTIONS.map((action) => (
                        <th key={action.id} className="px-3 py-4 text-center font-medium sm:px-6">
                          {t(`permissoes.accao.${action.id}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  {grupos.map(({ grupo, recursos: doGrupo }) => (
                  <tbody key={grupo} className="divide-y divide-slate-100">
                    <tr className="bg-slate-50/70">
                      <th
                        colSpan={AVAILABLE_ACTIONS.length + 1}
                        className="sticky left-0 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6"
                      >
                        {t(`permissoes.grupo.${grupo}`, grupo)}
                      </th>
                    </tr>
                    {doGrupo.map((resource) => (
                      <tr key={resource.id} className="group transition-colors hover:bg-slate-50/50">
                        {/* `bg-white` explícito: uma célula fixa transparente deixaria
                            ver as colunas a passar por baixo dela. */}
                        <td className="sticky left-0 z-10 min-w-[140px] bg-white px-4 py-4 font-medium text-slate-800 group-hover:bg-slate-50 sm:px-6">
                          {t(`permissoes.recurso.${resource.id}`, resource.id)}
                        </td>


                        {AVAILABLE_ACTIONS.map((action) => {
                          const permKey = `${action.id}:${resource.id}`;
                          const isIgnored = !resource.acoes.includes(action.id);
                          const isChecked = selectedPermissions.has(permKey);

                          return (
                            <td key={action.id} className="px-3 py-4 text-center sm:px-6">
                              {!isIgnored ? (
                                <div className="inline-flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggle(action.id, resource.id)}
                                    disabled={somenteLeitura}
                                    className="w-5 h-5 text-emerald-600 bg-white border-2 border-slate-300 rounded focus:ring-emerald-600 focus:ring-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 appearance-none checked:bg-emerald-600 checked:border-emerald-600 transition-all
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
                  ))}
                </table>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <Shield className="w-12 h-12 mb-4 text-slate-300" />
            <p>{t('permissoes.escolha_perfil')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
