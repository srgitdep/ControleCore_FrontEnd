import { localeIntl } from '@/i18n';

/**
 * Número com duas casas decimais na língua activa, sem o símbolo da moeda.
 *
 * O `formatMoeda` partilhado acrescenta «MT» (antes ou depois conforme a língua); o
 * recibo e o cartão de produto mostram o preço unitário sem símbolo, com o «MT» noutro
 * elemento — daí este irmão sem moeda.
 */
export function formatNumero2(valor: number | null | undefined): string {
  if (valor == null) return '';
  return new Intl.NumberFormat(localeIntl(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}
