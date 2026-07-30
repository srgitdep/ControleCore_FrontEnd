/**
 * Formatação pt-MZ (espelho FE do PLT-33).
 */
const locale = 'pt-MZ';

function normalizarEspacos(texto: string): string {
  return texto.replace(/\u00a0|\u202f/g, ' ');
}

export function formatarNumero(
  valor: number,
  casasMin = 0,
  casasMax = 1,
): string {
  return normalizarEspacos(
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: casasMin,
      maximumFractionDigits: casasMax,
    }).format(valor),
  );
}

export function formatarMoeda(valor: number, casas = 2): string {
  const numero = normalizarEspacos(
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    }).format(valor),
  );
  return `${numero} MT`;
}

export function formatarVariacao(percentagem: number, casas = 1): string {
  const sinal = percentagem > 0 ? '+' : '';
  const numero = normalizarEspacos(
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    }).format(percentagem),
  );
  return `${sinal}${numero}%`;
}
