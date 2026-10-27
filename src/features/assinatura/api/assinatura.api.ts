import { api } from '@/shared/config';
import type { MinhaAssinatura } from '../types';

// GET /assinatura/minha — responde mesmo com a empresa bloqueada, para o ecrã saber porquê.
export const getMinhaAssinatura = async () => {
  const { data } = await api.get<MinhaAssinatura>('/assinatura/minha');
  return data;
};
