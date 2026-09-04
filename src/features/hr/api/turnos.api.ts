import { api } from '@/shared/config';

/**
 * Turnos e escalas.
 *
 * ## Porque isto faltava
 *
 * `ShiftManagementPage` tinha 200 linhas e uma única chamada: ler a escala da semana.
 * Criar um turno e atribuir um funcionário a um turno existiam no servidor e não eram
 * chamados por nada — pelo que o ecrã de escalas mostrava, para sempre, uma semana vazia.
 *
 * O efeito não ficava no ecrã. O processamento de salário conta como falta cada dia
 * escalado sem registo de ponto; sem escalas, não há dias escalados, e a assiduidade de
 * todos aparece a zero sem que nada indique que a causa é a ausência de escala.
 */

/** Um turno: um horário com nome, numa loja. Não tem pessoas — as pessoas vêm na escala. */
export interface Turno {
  id: string;
  lojaId: string;
  nome: string;
  /** HH:mm. */
  horaInicio: string;
  /** HH:mm. */
  horaFim: string;
  createdAt: string;
  loja?: { id: string; nome: string };
}

/** Um funcionário atribuído a um turno num dia. */
export interface EscalaAtribuida {
  id: string;
  turnoId: string;
  userId: string;
  /** ISO. O servidor guarda-a como data sem hora. */
  data: string;
  turno?: Turno;
  user?: { id: string; name: string; email: string };
}

export interface CriarTurnoDto {
  lojaId: string;
  nome: string;
  /** HH:mm — o servidor recusa outro formato. */
  horaInicio: string;
  horaFim: string;
}

export interface AtribuirEscalaDto {
  turnoId: string;
  userId: string;
  /** AAAA-MM-DD. */
  data: string;
}

export const turnosApi = {
  /**
   * Os turnos definidos, opcionalmente de uma só loja.
   *
   * Esta leitura foi acrescentada ao servidor para este ecrã: sem ela, escolher o turno a
   * atribuir exigia saber o seu `id` de cor, porque a única listagem existente era das
   * escalas de um dia — e essa só mostra turnos a que alguém já foi atribuído.
   */
  listar: async (lojaId?: string) => {
    const { data } = await api.get<Turno[]>('/rh/turnos', {
      params: lojaId ? { lojaId } : undefined,
    });
    return data;
  },

  criar: async (dto: CriarTurnoDto) => {
    const { data } = await api.post<Turno>('/rh/turnos', dto);
    return data;
  },

  /**
   * Atribui um funcionário a um turno num dia.
   *
   * O servidor recusa duas atribuições à mesma pessoa no mesmo dia — há um índice único
   * em `(userId, data)`. A mensagem que devolve nesse caso diz exactamente isso, e é a que
   * se mostra.
   */
  atribuir: async (dto: AtribuirEscalaDto) => {
    const { data } = await api.post<EscalaAtribuida>('/rh/turnos/escala', dto);
    return data;
  },

  // `GET /rh/turnos/escala` — as escalas de uma loja num dia — não tem envolvente aqui de
  // propósito. O calendário semanal já traz todas as lojas da semana numa consulta, e uma
  // leitura por dia seria um segundo pedido para dados que já estão em memória. Fica em
  // aberto no servidor para quando existir um ecrã de um só dia, se existir.
};
