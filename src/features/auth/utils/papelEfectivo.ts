import type { Role } from '../types';

/**
 * O papel com que a aplicação se comporta (plano §4.15, S3).
 *
 * Em modo suporte, o Super Admin é **ADMIN da empresa** — como o servidor o trata
 * (`JwtStrategy`). Os menus, as rotas e os ecrãs que escolhem pelo papel vêem a empresa como
 * o ADMIN dela a vê, e não o painel da plataforma.
 *
 * Só o Super Admin muda de papel: uma sessão de suporte posta, por engano, no estado de
 * outra pessoa não a promove a ADMIN.
 */
export function papelEfectivo(
  user: { role: Role } | null,
  suporte: unknown | null,
): Role | undefined {
  if (!user) return undefined;
  return user.role === 'SUPER_ADMIN' && suporte ? 'ADMIN' : user.role;
}
