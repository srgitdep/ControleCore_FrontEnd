import type { TFunction } from 'i18next';

const TIPOS_CONHECIDOS = ['venda', 'reserva', 'quebras'] as const;

/**
 * Etiqueta de um tipo de armazém na língua activa. O valor guardado e enviado à API
 * continua a ser o original (`Venda`, `Reserva`, `Quebras`); só a etiqueta se traduz.
 * Um tipo que não esteja na lista (dados antigos, texto livre) mostra-se tal como vem.
 */
export function rotuloTipoArmazem(t: TFunction<'armazens'>, tipo: string | null | undefined): string {
  const codigo = TIPOS_CONHECIDOS.find((c) => c === tipo?.toLowerCase());
  return codigo ? t(`tipo_armazem.${codigo}`) : (tipo ?? '');
}
