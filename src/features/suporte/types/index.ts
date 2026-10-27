// O modo suporte do Super Admin (plano §4.15, S3). Contrato de `/plataforma/suporte/*` e `/suporte/*`.

export interface EntrarSuportePayload {
  empresaId: string;
  motivo: string;
  /** Poder alterar dados. Por omissão, só leitura. */
  escrita: boolean;
}

export interface SessaoEntrada {
  sessaoId: string;
  empresa: { id: string; nome: string };
  escrita: boolean;
  iniciadaEm: string;
  expiraEm: string;
}

/** `GET /suporte/actual`: fora do modo, só `{ activa: false }`. */
export type SuporteActual =
  | { activa: false }
  | {
      activa: true;
      sessaoId: string;
      empresa: { id: string; nome: string };
      escrita: boolean;
      iniciadaEm: string;
      expiraEm: string;
    };

/** `GET /suporte/sessoes`: o que a empresa vê de cada visita da plataforma. */
export interface SessaoDeSuporte {
  id: string;
  quem: { name: string; code: string };
  motivo: string;
  escrita: boolean;
  iniciadaEm: string;
  expiraEm: string;
  terminadaEm: string | null;
}
