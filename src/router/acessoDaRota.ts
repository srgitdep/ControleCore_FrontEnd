/**
 * Quem pode abrir uma rota protegida.
 *
 * Fora do componente para ter testes: o projecto corre os testes em `node`, sem DOM, e esta
 * é a regra que decide se alguém vê uma página ou é mandado para o painel.
 *
 * ## Cargo **ou** permissão
 *
 * Até aos perfis próprios por empresa (Permissões, Parte 2), uma rota era só por cargo. Com
 * perfis criados pela empresa, o servidor passou a aceitar um «Utilizador» com um perfil que
 * inclui, por exemplo, o Financeiro — e a página recusava-o na mesma. `permissaoAlternativa`
 * é a permissão que, por si só, abre a rota.
 *
 * `requiredPermission` continua a ser o contrário: uma exigência **além** do cargo (o ecrã de
 * Permissões aceita gestores, mas só com `manage:users`). Quem entra pela permissão
 * alternativa não volta a ser verificado: já provou ter a permissão.
 */

export interface EntradaDeAcesso {
  roles?: string[];
  requiredPermission?: string;
  permissaoAlternativa?: string;
}

export type ResultadoDeAcesso = 'permitido' | 'sem_cargo' | 'sem_permissao';

export function decidirAcesso(
  { roles, requiredPermission, permissaoAlternativa }: EntradaDeAcesso,
  temCargo: (roles: string[]) => boolean,
  temPermissao: (permissao: string) => boolean,
): ResultadoDeAcesso {
  const peloCargo = !roles || temCargo(roles);
  const pelaPermissao = permissaoAlternativa ? temPermissao(permissaoAlternativa) : false;

  if (!peloCargo && !pelaPermissao) return 'sem_cargo';
  if (requiredPermission && !pelaPermissao && !temPermissao(requiredPermission)) {
    return 'sem_permissao';
  }
  return 'permitido';
}
