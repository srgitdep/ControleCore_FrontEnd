import i18n, { localeIntl } from '@/i18n';

/**
 * Formata uma data no formato curto da língua activa.
 * Exemplo: "06/07/2026"
 */
export function formatData(date: string | Date): string {
  return new Intl.DateTimeFormat(localeIntl(), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

/**
 * Formata uma data com hora na língua activa.
 * Exemplo: "06/07/2026, 13:45"
 */
export function formatDataHora(date: string | Date): string {
  return new Intl.DateTimeFormat(localeIntl(), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Formata a data de forma relativa (ex: "há 2h" / "2h ago").
 */
export function formatDataRelativa(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutos = Math.floor(diff / 60_000);
  if (minutos < 1) return i18n.t('tempo.agora');
  if (minutos < 60) return i18n.t('tempo.ha_minutos', { n: minutos });
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return i18n.t('tempo.ha_horas', { n: horas });
  const dias = Math.floor(horas / 24);
  return i18n.t('tempo.ha_dias', { count: dias });
}
