// `GET /assinatura/minha` — a assinatura vista pela própria empresa (plano §4.15, S2b).

/**
 * - `FIM_PROXIMO`: faltam `dias` para o fim do período;
 * - `TOLERANCIA`: o período acabou; faltam `dias` para a suspensão;
 * - `BLOQUEADA`: sem acesso — o resto da aplicação responde 403;
 * - `NENHUM`: nada a mostrar.
 */
export type TipoDeAviso = 'NENHUM' | 'FIM_PROXIMO' | 'TOLERANCIA' | 'BLOQUEADA';

export type MinhaAssinatura =
  // O Super Admin não tem empresa.
  | { aplicavel: false }
  | {
      aplicavel: true;
      expiracaoActiva: boolean;
      aviso: TipoDeAviso;
      dias: number | null;
      estado: string | null;
      fimDoPeriodo: string | null;
    };
