import { describe, expect, it } from 'vitest';
import {
  accaoPrincipal,
  accoesPossiveis,
  diferencaDeCobranca,
  estaPorFazer,
  exigeReferencia,
  ligacaoMapa,
  ligacaoTelefone,
  podeMarcarChegada,
} from './passos';

describe('passos da entrega — espelham as transições do servidor', () => {
  it('atribuída: só se pode recolher (ou falhar)', () => {
    expect(accoesPossiveis('ATRIBUIDA')).toEqual(['recolher', 'falhar']);
    expect(accaoPrincipal('ATRIBUIDA')).toBe('recolher');
  });

  it('recolhida: seguir para a rota, entregar logo (a rota pode saltar-se) ou falhar', () => {
    expect(accoesPossiveis('RECOLHIDA')).toEqual(['iniciar_rota', 'entregar', 'falhar']);
    expect(accaoPrincipal('RECOLHIDA')).toBe('iniciar_rota');
  });

  it('em rota: entregar (ou falhar)', () => {
    expect(accoesPossiveis('EM_ROTA')).toEqual(['entregar', 'falhar']);
    expect(accaoPrincipal('EM_ROTA')).toBe('entregar');
  });

  it('🔴 entregue, falhada, devolvida e cancelada não têm acções — nada para fazer', () => {
    for (const estado of ['ENTREGUE', 'FALHADA', 'DEVOLVIDA', 'CANCELADA', 'AGUARDA_RECOLHA'] as const) {
      expect(accoesPossiveis(estado)).toEqual([]);
      expect(accaoPrincipal(estado)).toBeNull();
      expect(estaPorFazer(estado)).toBe(false);
    }
  });

  it('o botão principal nunca é «falhar»', () => {
    for (const estado of ['ATRIBUIDA', 'RECOLHIDA', 'EM_ROTA'] as const) {
      expect(accaoPrincipal(estado)).not.toBe('falhar');
      expect(estaPorFazer(estado)).toBe(true);
    }
  });
});

describe('cobrança', () => {
  it('M-Pesa e e-Mola exigem referência; o numerário não', () => {
    expect(exigeReferencia('NUMERARIO')).toBe(false);
    expect(exigeReferencia('MPESA')).toBe(true);
    expect(exigeReferencia('EMOLA')).toBe(true);
  });

  it('a diferença para o previsto: positiva a mais, negativa a menos, zero se igual', () => {
    expect(diferencaDeCobranca(250, 250)).toBe(0);
    expect(diferencaDeCobranca(250, 300)).toBe(50);
    expect(diferencaDeCobranca(250, 200)).toBe(-50);
    expect(diferencaDeCobranca(0.1 + 0.2, 0.3)).toBe(0);
  });
});

describe('ligações do telemóvel', () => {
  it('o mapa abre o destino com as coordenadas', () => {
    expect(ligacaoMapa(-25.9692, 32.5732)).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=-25.9692,32.5732&travelmode=driving',
    );
  });

  it('o telefone limpa espaços e símbolos mas mantém o +', () => {
    expect(ligacaoTelefone('84 123-4567')).toBe('tel:841234567');
    expect(ligacaoTelefone('+258 (84) 123 4567')).toBe('tel:+258841234567');
  });
});

describe('podeMarcarChegada («Cheguei»)', () => {
  it('só com a entrega a caminho e ainda sem chegada marcada', () => {
    expect(podeMarcarChegada('EM_ROTA', null)).toBe(true);
    expect(podeMarcarChegada('EM_ROTA', undefined)).toBe(true);
  });

  it('depois de marcada, o botão desaparece (repetir não serve de nada)', () => {
    expect(podeMarcarChegada('EM_ROTA', '2026-10-11T10:00:00Z')).toBe(false);
  });

  it.each(['AGUARDA_RECOLHA', 'ATRIBUIDA', 'RECOLHIDA', 'ENTREGUE', 'FALHADA', 'DEVOLVIDA'] as const)(
    'em %s não se oferece',
    (estado) => {
      expect(podeMarcarChegada(estado, null)).toBe(false);
    },
  );
});
