/**
 * Formata uma data para o formato curto pt-MZ.
 * Exemplo: "06/07/2026"
 */
export function formatData(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-MZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

/**
 * Formata uma data com hora para pt-MZ.
 * Exemplo: "06/07/2026, 13:45"
 */
export function formatDataHora(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-MZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Formata a data de forma relativa (ex: "há 2 horas").
 */
export function formatDataRelativa(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutos = Math.floor(diff / 60_000);
  if (minutos < 1) return 'agora';
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas}h`;
  const dias = Math.floor(horas / 24);
  return `há ${dias} dia${dias > 1 ? 's' : ''}`;
}
