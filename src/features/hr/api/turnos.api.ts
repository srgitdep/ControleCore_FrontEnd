import { api } from '@/shared/config';

export interface Turno {
  id: string;
  lojaId: string;
  nome: string;
  /** HH:mm */
  horaInicio: string;
  /** HH:mm */
  horaFim: string;
}

export interface CriarTurnoDto {
  lojaId: string;
  nome: string;
  horaInicio: string;
  horaFim: string;
}

export interface EscalaTurno {
  id: string;
  turnoId: string;
  userId: string;
  data: string;
  turno: Turno;
  user: { id: string; name: string; email: string };
}

export interface AtribuirEscalaDto {
  turnoId: string;
  userId: string;
  data: string;
}

/**
 * Turnos (horários-modelo, reutilizáveis, por loja) e escalas (a atribuição de um turno a
 * um funcionário, num dia).
 *
 * ## Um funcionário, um turno por dia
 *
 * `atribuirEscala` recusa uma segunda escala no mesmo dia para o mesmo funcionário — a
 * mensagem do backend já diz isso, e chega tal e qual ao toast de erro.
 *
 * ## `obterEscalas` é por dia, não por intervalo
 *
 * Diferente de `/hr/escalas/semanal` (que existia antes e continua a servir a grelha
 * semanal): esta é a rota de gestão, por loja + um dia único, e devolve o turno e o
 * funcionário completos em vez de strings achatadas.
 */
export const turnosApi = {
  criar: async (dto: CriarTurnoDto) => {
    const { data } = await api.post<Turno>('/rh/turnos', dto);
    return data;
  },

  atribuirEscala: async (dto: AtribuirEscalaDto) => {
    const { data } = await api.post<EscalaTurno>('/rh/turnos/escala', dto);
    return data;
  },

  obterEscalas: async (lojaId: string, data: string) => {
    const { data: escalas } = await api.get<EscalaTurno[]>('/rh/turnos/escala', {
      params: { lojaId, data },
    });
    return escalas;
  },
};
