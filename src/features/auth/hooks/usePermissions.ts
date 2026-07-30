import { useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useContextoAcesso } from '@/features/plataforma';

export function usePermissions() {
  const { user, permissions: storePermissions } = useAuthStore();
  const contexto = useContextoAcesso(Boolean(user));
  const effectivePermissions =
    contexto.data?.permissoes.map((permissao) => permissao.codigo) ??
    user?.permissions ??
    storePermissions;

  const hasPermission = useCallback(
    (codigoOuAccao: string, recurso?: string): boolean => {
      const exigida = normalizarPermissao(codigoOuAccao, recurso);
      return effectivePermissions.includes(exigida);
    },
    [effectivePermissions],
  );

  return {
    hasPermission,
    permissions: effectivePermissions,
    isLoading: contexto.isLoading,
  };
}

const ALIASES_LEGADOS: Record<string, string> = {
  'read:users': 'pessoas.utilizador.ler',
  'manage:users': 'administracao.perfil.gerir',
  'manage:empresa': 'administracao.empresa.gerir',
  'manage:all': 'administracao.empresa.gerir',
  'read:produto': 'catalogo.artigo.ler',
  'create:produto': 'catalogo.artigo.criar',
  'write:produto': 'catalogo.artigo.editar',
  'delete:produto': 'catalogo.artigo.apagar',
};

function normalizarPermissao(codigoOuAccao: string, recurso?: string): string {
  const codigo = recurso ? `${codigoOuAccao}:${recurso}` : codigoOuAccao;
  return ALIASES_LEGADOS[codigo] ?? codigo.toLowerCase().replaceAll(':', '.');
}
