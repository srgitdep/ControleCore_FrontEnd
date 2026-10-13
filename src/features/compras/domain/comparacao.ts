import { CRITERIOS, type PesosComparacao } from '../api/comparacao.api';

/** A soma dos pesos. */
export const somaDosPesos = (pesos: PesosComparacao) => CRITERIOS.reduce((s, c) => s + pesos[c], 0);

/** Pesos que o servidor aceita: inteiros ≥ 0 e pelo menos um critério com peso. */
export const pesosValidos = (pesos: PesosComparacao) =>
  CRITERIOS.every((c) => Number.isInteger(pesos[c]) && pesos[c] >= 0) && somaDosPesos(pesos) > 0;

/** Quanto pesa um critério no total, em %, para o cursor dizer «40 %» e não «40». Zero se a soma for zero. */
export function percentagemDoPeso(pesos: PesosComparacao, criterio: (typeof CRITERIOS)[number]): number {
  const soma = somaDosPesos(pesos);
  return soma > 0 ? Math.round((pesos[criterio] / soma) * 100) : 0;
}

export const pesosIguais = (a: PesosComparacao, b: PesosComparacao) => CRITERIOS.every((c) => a[c] === b[c]);

/**
 * O estado da relação diz se se pode comprar: só `ACTIVO` e `PREFERENCIAL` (a mesma regra do servidor, em
 * `permiteComprar`). O servidor recusa a emissão aos outros na mesma; isto só evita oferecer o que falharia.
 */
export const podeComprarAoEstado = (estadoRelacao: string | undefined, isActive: boolean) =>
  estadoRelacao ? estadoRelacao === 'ACTIVO' || estadoRelacao === 'PREFERENCIAL' : isActive;
