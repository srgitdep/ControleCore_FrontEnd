import { describe, it, expect, beforeEach } from 'vitest';
import { usePosStore, getStockDisponivel } from './posStore';
import type { Product } from '@/features/produtos';

/** Produto mínimo para os testes; os campos não usados ficam com valores neutros. */
function produto(over: Partial<Product> = {}): Product {
  return {
    id: 'prod-1',
    empresaId: 'emp-1',
    nome: 'Refrigerante',
    precoCusto: 60,
    precoVenda: 100,
    margemLucro: 40,
    taxaIva: 16,
    unidadeMedida: 'UN',
    isWeighable: false,
    isActive: true,
    createdAt: '',
    updatedAt: '',
    ...over,
  } as Product;
}

const armazem = (tipo: string, isActive = true) => ({ tipo, isActive });
const venda = (qtd: number, activo = true) => ({
  armazemId: 'arm-v',
  currentQuantity: qtd,
  armazem: armazem('Venda', activo),
});
const reserva = (qtd: number, activo = true) => ({
  armazemId: 'arm-r',
  currentQuantity: qtd,
  armazem: armazem('Reserva', activo),
});

describe('getStockDisponivel', () => {
  it('devolve undefined quando a resposta não traz stocks', () => {
    // API antiga ou endpoint sem o include: a decisão fica para o backend.
    expect(getStockDisponivel(produto())).toBeUndefined();
  });

  it('devolve 0 quando o produto não tem registos de stock', () => {
    expect(getStockDisponivel(produto({ stocks: [] }))).toBe(0);
  });

  it('devolve o saldo do único armazém de venda', () => {
    expect(getStockDisponivel(produto({ stocks: [venda(7)] }))).toBe(7);
  });

  it('ignora a reserva e usa o ponto de venda', () => {
    expect(getStockDisponivel(produto({ stocks: [reserva(500), venda(7)] }))).toBe(7);
  });

  it('reconhece o tipo independentemente das maiúsculas', () => {
    const stocks = [{ armazemId: 'a', currentQuantity: 3, armazem: armazem('venda') }];
    expect(getStockDisponivel(produto({ stocks }))).toBe(3);
  });

  it('dispensa a marcação de tipo quando há um só armazém activo', () => {
    const stocks = [{ armazemId: 'a', currentQuantity: 9, armazem: armazem('Geral') }];
    expect(getStockDisponivel(produto({ stocks }))).toBe(9);
  });

  it('ignora armazéns inactivos', () => {
    expect(getStockDisponivel(produto({ stocks: [venda(7, false), reserva(4)] }))).toBe(4);
  });

  it('devolve 0 quando todos os armazéns estão inactivos', () => {
    expect(getStockDisponivel(produto({ stocks: [venda(7, false), reserva(4, false)] }))).toBe(0);
  });

  it('devolve undefined com dois armazéns de venda (o backend recusa)', () => {
    const stocks = [
      { armazemId: 'a1', currentQuantity: 7, armazem: armazem('Venda') },
      { armazemId: 'a2', currentQuantity: 3, armazem: armazem('Venda') },
    ];
    expect(getStockDisponivel(produto({ stocks }))).toBeUndefined();
  });

  it('devolve undefined com vários armazéns e nenhum de venda', () => {
    const stocks = [
      reserva(7),
      { armazemId: 'a2', currentQuantity: 2, armazem: armazem('Quebras') },
    ];
    expect(getStockDisponivel(produto({ stocks }))).toBeUndefined();
  });

  it('devolve 0 quando o ponto de venda está esgotado, mesmo com stock na reserva', () => {
    expect(getStockDisponivel(produto({ stocks: [venda(0), reserva(99)] }))).toBe(0);
  });
});

describe('carrinho do POS', () => {
  beforeEach(() => {
    usePosStore.getState().clearCart();
  });

  describe('limites de stock', () => {
    it('aceita adicionar dentro do disponível', () => {
      const r = usePosStore.getState().addItem(produto({ stocks: [venda(10)] }), 3);

      expect(r.ok).toBe(true);
      expect(usePosStore.getState().cartItems[0].cartQuantity).toBe(3);
    });

    it('recusa adicionar acima do disponível', () => {
      const r = usePosStore.getState().addItem(produto({ stocks: [venda(2)] }), 5);

      expect(r).toEqual({ ok: false, motivo: 'SEM_STOCK', disponivel: 2, nome: 'Refrigerante' });
      expect(usePosStore.getState().cartItems).toHaveLength(0);
    });

    it('considera o que já está no carrinho ao somar', () => {
      const p = produto({ stocks: [venda(5)] });
      usePosStore.getState().addItem(p, 3);

      const r = usePosStore.getState().addItem(p, 3); // 3 + 3 > 5

      expect(r.ok).toBe(false);
      expect(usePosStore.getState().cartItems[0].cartQuantity).toBe(3);
    });

    it('permite atingir exactamente o disponível', () => {
      const p = produto({ stocks: [venda(5)] });
      usePosStore.getState().addItem(p, 3);

      const r = usePosStore.getState().addItem(p, 2);

      expect(r.ok).toBe(true);
      expect(usePosStore.getState().cartItems[0].cartQuantity).toBe(5);
    });

    it('recusa produto esgotado', () => {
      const r = usePosStore.getState().addItem(produto({ stocks: [venda(0)] }));

      expect(r.ok).toBe(false);
      expect(usePosStore.getState().cartItems).toHaveLength(0);
    });

    it('não bloqueia quando a disponibilidade é desconhecida', () => {
      // Sem informação de stock, a validação cabe ao backend.
      const r = usePosStore.getState().addItem(produto(), 999);

      expect(r.ok).toBe(true);
      expect(usePosStore.getState().cartItems[0].cartQuantity).toBe(999);
    });

    it('recusa aumentar a quantidade acima do disponível', () => {
      const p = produto({ stocks: [venda(4)] });
      usePosStore.getState().addItem(p, 2);

      const r = usePosStore.getState().updateQuantity(p.id, 10);

      expect(r.ok).toBe(false);
      expect(usePosStore.getState().cartItems[0].cartQuantity).toBe(2);
    });

    it('permite reduzir a quantidade', () => {
      const p = produto({ stocks: [venda(4)] });
      usePosStore.getState().addItem(p, 4);

      const r = usePosStore.getState().updateQuantity(p.id, 1);

      expect(r.ok).toBe(true);
      expect(usePosStore.getState().cartItems[0].cartQuantity).toBe(1);
    });

    it('remove o item quando a quantidade chega a zero', () => {
      const p = produto({ stocks: [venda(4)] });
      usePosStore.getState().addItem(p, 2);

      usePosStore.getState().updateQuantity(p.id, 0);

      expect(usePosStore.getState().cartItems).toHaveLength(0);
    });
  });

  describe('cálculo do total', () => {
    it('aplica IVA sobre o valor da linha', () => {
      usePosStore.getState().addItem(produto(), 2);

      // 200 + 16% = 232
      expect(usePosStore.getState().getSubtotal()).toBe(200);
      expect(usePosStore.getState().getTotal()).toBeCloseTo(232);
    });

    it('aplica o desconto de linha antes do IVA', () => {
      const p = produto();
      usePosStore.getState().addItem(p, 2);
      usePosStore.getState().updateLineDiscount(p.id, 50);

      // (200 - 50) * 1.16 = 174
      expect(usePosStore.getState().getTotalDesconto()).toBe(50);
      expect(usePosStore.getState().getTotal()).toBeCloseTo(174);
    });

    it('subtrai o desconto global do total', () => {
      usePosStore.getState().addItem(produto(), 2);
      usePosStore.getState().setDescontoGlobal(20);

      // 232 - 20 = 212
      expect(usePosStore.getState().getTotal()).toBeCloseTo(212);
    });

    it('acumula desconto de linha e desconto global', () => {
      const p = produto();
      usePosStore.getState().addItem(p, 2);
      usePosStore.getState().updateLineDiscount(p.id, 50);
      usePosStore.getState().setDescontoGlobal(10);

      expect(usePosStore.getState().getTotalDesconto()).toBe(60);
      expect(usePosStore.getState().getTotal()).toBeCloseTo(164);
    });

    it('não aceita descontos negativos', () => {
      const p = produto();
      usePosStore.getState().addItem(p, 1);
      usePosStore.getState().updateLineDiscount(p.id, -100);
      usePosStore.getState().setDescontoGlobal(-50);

      expect(usePosStore.getState().getTotalDesconto()).toBe(0);
    });
  });

  it('clearCart limpa itens, cliente e desconto global', () => {
    usePosStore.getState().addItem(produto(), 1);
    usePosStore.getState().setDescontoGlobal(50);

    usePosStore.getState().clearCart();

    expect(usePosStore.getState().cartItems).toHaveLength(0);
    expect(usePosStore.getState().descontoGlobal).toBe(0);
    expect(usePosStore.getState().clienteIdentificado).toBeNull();
  });
});
