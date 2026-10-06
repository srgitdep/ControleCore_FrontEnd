import type { TFunction } from 'i18next';
import type { MotivoEntrega } from '../api/entrega.api';
import { formatMoeda } from '@/shared/utils';

/**
 * A frase do motivo de uma entrega indisponível, na língua de quem compra.
 *
 * O servidor manda um código com parâmetros, nunca a frase (ver `calcular-taxa.ts`): quem
 * decide a língua é o frontend. Um `switch` e não uma chave montada à mão, para o `tsc`
 * verificar cada chave contra o catálogo.
 */
export function textoMotivoEntrega(t: TFunction<'loja'>, motivo: MotivoEntrega | undefined): string {
  const p = motivo?.parametros ?? {};
  switch (motivo?.codigo) {
    case 'entrega.desactivada':
      return t('entrega.motivo.desactivada');
    case 'entrega.loja_sem_coordenadas':
      return t('entrega.motivo.loja_sem_coordenadas');
    case 'entrega.acima_do_raio':
      return t('entrega.motivo.acima_do_raio', { raio: p.raioMaximoKm });
    case 'entrega.fora_de_area':
      return t('entrega.motivo.fora_de_area', { distancia: p.distanciaKm });
    case 'entrega.abaixo_do_minimo':
      return t('entrega.motivo.abaixo_do_minimo', {
        minimo: formatMoeda(Number(p.valorMinimo)),
        falta: formatMoeda(Number(p.falta)),
      });
    default:
      return t('entrega.motivo.desconhecido');
  }
}
