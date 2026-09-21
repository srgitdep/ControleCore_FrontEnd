/**
 * Uma cor por categoria, determinística (hash do nome) — para os chips do mercado
 * não ficarem todos da mesma cor. Sem isto, uma fila de "Todas / Bebidas / Frescos /
 * Mercearia / Padaria" em tons idênticos lê-se como uma lista, não como filtros vivos.
 */
const PALETA = [
  { chip: 'bg-blue-50 text-blue-700', activo: 'bg-blue-600' },
  { chip: 'bg-emerald-50 text-emerald-700', activo: 'bg-emerald-600' },
  { chip: 'bg-amber-50 text-amber-800', activo: 'bg-amber-500' },
  { chip: 'bg-rose-50 text-rose-700', activo: 'bg-rose-600' },
  { chip: 'bg-violet-50 text-violet-700', activo: 'bg-violet-600' },
  { chip: 'bg-cyan-50 text-cyan-700', activo: 'bg-cyan-600' },
];

export function corDaCategoria(nome: string): { chip: string; activo: string } {
  let hash = 0;
  for (let i = 0; i < nome.length; i++) {
    hash = nome.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETA[Math.abs(hash) % PALETA.length];
}
