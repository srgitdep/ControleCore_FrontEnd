/**
 * Formata um valor numérico para o formato monetário Moçambicano.
 * Exemplo: 1234567.5 → "1.234.567,50 MT"
 */
export function formatMoeda(value: number): string {
  return new Intl.NumberFormat('pt-MZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + ' MT';
}

/**
 * Formata um valor numérico de forma compacta (ex: para KPIs).
 * Exemplo: 1234567 → "1,23M MT"
 */
export function formatMoedaCompacta(value: number): string {
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(2).replace('.', ',') + 'M MT';
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(1).replace('.', ',') + 'K MT';
  }
  return formatMoeda(value);
}
