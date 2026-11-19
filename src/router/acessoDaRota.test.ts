import { describe, expect, it } from 'vitest';
import { decidirAcesso } from './acessoDaRota';

/** Quem tem exactamente estas permissões. */
const com = (...permissoes: string[]) => (p: string) => permissoes.includes(p);
const semPermissoes = () => false;
const ehGerente = (roles: string[]) => roles.includes('MANAGER');
const ehUtilizador = (roles: string[]) => roles.includes('USER');

describe('decidirAcesso', () => {
  it('sem cargos exigidos, qualquer pessoa entra', () => {
    expect(decidirAcesso({}, () => false, semPermissoes)).toBe('permitido');
  });

  it('o cargo certo abre a rota', () => {
    expect(
      decidirAcesso({ roles: ['ADMIN', 'MANAGER'] }, ehGerente, semPermissoes),
    ).toBe('permitido');
  });

  it('sem o cargo e sem permissão alternativa, recusa', () => {
    expect(
      decidirAcesso({ roles: ['ADMIN', 'MANAGER'] }, ehUtilizador, semPermissoes),
    ).toBe('sem_cargo');
  });

  describe('perfil próprio da empresa', () => {
    it('um «Utilizador» com read:financeiro abre o Financeiro, que é de gerentes', () => {
      expect(
        decidirAcesso(
          { roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'], permissaoAlternativa: 'read:financeiro' },
          ehUtilizador,
          com('read:financeiro'),
        ),
      ).toBe('permitido');
    });

    it('sem essa permissão continua recusado', () => {
      expect(
        decidirAcesso(
          { roles: ['MANAGER'], permissaoAlternativa: 'read:financeiro' },
          ehUtilizador,
          com('read:stock'),
        ),
      ).toBe('sem_cargo');
    });

    it('a permissão alternativa dispensa a exigência estrita (já a provou)', () => {
      expect(
        decidirAcesso(
          {
            roles: ['ADMIN'],
            requiredPermission: 'manage:users',
            permissaoAlternativa: 'manage:users',
          },
          ehUtilizador,
          com('manage:users'),
        ),
      ).toBe('permitido');
    });
  });

  describe('exigência além do cargo', () => {
    it('o gerente sem manage:users não entra em Permissões', () => {
      expect(
        decidirAcesso(
          { roles: ['MANAGER'], requiredPermission: 'manage:users' },
          ehGerente,
          com('read:users'),
        ),
      ).toBe('sem_permissao');
    });

    it('o gerente com manage:users entra', () => {
      expect(
        decidirAcesso(
          { roles: ['MANAGER'], requiredPermission: 'manage:users' },
          ehGerente,
          com('manage:users'),
        ),
      ).toBe('permitido');
    });
  });

  it('uma rota da plataforma (sem permissão alternativa) continua só por cargo', () => {
    expect(
      decidirAcesso({ roles: ['SUPER_ADMIN'] }, ehUtilizador, () => true),
    ).toBe('sem_cargo');
  });
});
