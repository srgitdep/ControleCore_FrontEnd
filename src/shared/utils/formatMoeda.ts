import { idiomaActivo, localeIntl } from '@/i18n';

/**
 * A moeda é sempre o metical (MZN) — muda só a forma de o escrever com a língua activa:
 * `1.234.567,50 MT` em português, `MT 1,234,567.50` em inglês.
 */
function comSimbolo(numero: string): string {
  return idiomaActivo() === 'en' ? `MT ${numero}` : `${numero} MT`;
}

/**
 * Formata um valor numérico para o formato monetário Moçambicano.
 * Exemplo: 1234567.5 → "1.234.567,50 MT"
 */
export function formatMoeda(value: number): string {
  return comSimbolo(
    new Intl.NumberFormat(localeIntl(), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value),
  );
}

/**
 * Formata um valor numérico de forma compacta (ex: para KPIs).
 * Exemplo: 1234567 → "1,23M MT"
 */
export function formatMoedaCompacta(value: number): string {
  const separadorDecimal = idiomaActivo() === 'en' ? '.' : ',';
  if (value >= 1_000_000) {
    return comSimbolo((value / 1_000_000).toFixed(2).replace('.', separadorDecimal) + 'M');
  }
  if (value >= 1_000) {
    return comSimbolo((value / 1_000).toFixed(1).replace('.', separadorDecimal) + 'K');
  }
  return formatMoeda(value);
}

/**
 * Inteiro com separador de milhares sempre visível (`1 900`, `4 000`). O `Intl` em pt só
 * agrupa a partir de cinco dígitos (regra do CLDR), o que faria `1900` e `14 900` aparecerem
 * lado a lado numa tabela de preços; `useGrouping: 'always'` uniformiza.
 */
export function formatInteiro(value: number): string {
  return new Intl.NumberFormat(localeIntl(), {
    maximumFractionDigits: 0,
    useGrouping: 'always',
  }).format(value);
}

/**
 * Metical sem casas decimais, para preços de tabela (`6 500 MT`, `MT 6,500` em inglês).
 * `formatMoeda` mostra sempre dois decimais, o que num preçário de valores inteiros só
 * acrescenta `,00` a cada cartão.
 */
export function formatMoedaInteira(value: number): string {
  return comSimbolo(formatInteiro(Math.round(value)));
}
