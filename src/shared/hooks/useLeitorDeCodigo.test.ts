import { describe, it, expect } from 'vitest';
import { deveEntregarLeitura, type UltimaLeitura } from './useLeitorDeCodigo';

/**
 * A regra de repetição do leitor de códigos de barras.
 *
 * ## Porque é isto que se testa
 *
 * A câmara analisa 8 imagens por segundo, e um código de barras parado à frente da lente
 * é lido em todas elas. Sem esta regra, apontar durante um segundo acrescentaria o mesmo
 * produto oito vezes ao carrinho — um erro de facturação que o operador só notaria no
 * total.
 *
 * A detecção em si é do browser ou da biblioteca; o que é nosso, e pode falhar em
 * silêncio, é decidir quais leituras contam.
 */

const leitura = (codigo: string, quando: number): UltimaLeitura => ({ codigo, quando });

/** A pausa por omissão do hook, em milissegundos. */
const PAUSA = 1500;

describe('deveEntregarLeitura', () => {
  it('entrega a primeira leitura', () => {
    expect(deveEntregarLeitura('5601234567890', null, 1000, PAUSA)).toBe(true);
  });

  it('descarta o mesmo código dentro da pausa', () => {
    // O caso real: fotogramas seguidos do mesmo código, a 125 ms de intervalo.
    const anterior = leitura('111', 1000);
    expect(deveEntregarLeitura('111', anterior, 1125, PAUSA)).toBe(false);
    expect(deveEntregarLeitura('111', anterior, 2000, PAUSA)).toBe(false);
  });

  it('aceita o mesmo código depois de passada a pausa', () => {
    // Duas unidades do mesmo produto, lidas uma após a outra de propósito.
    const anterior = leitura('111', 1000);
    expect(deveEntregarLeitura('111', anterior, 2500, PAUSA)).toBe(true);
  });

  it('aceita exactamente no limite da pausa', () => {
    // O limite é inclusivo: com `>` em vez de `>=`, uma leitura no milissegundo exacto
    // seria descartada sem razão.
    const anterior = leitura('111', 1000);
    expect(deveEntregarLeitura('111', anterior, 1000 + PAUSA, PAUSA)).toBe(true);
  });

  it('aceita um código diferente sem esperar pela pausa', () => {
    // A pausa é por código, não global. Se fosse global, o operador esperaria 1,5 s
    // entre artigos diferentes — mais lento do que escrever à mão.
    const anterior = leitura('111', 1000);
    expect(deveEntregarLeitura('222', anterior, 1050, PAUSA)).toBe(true);
  });

  it('descarta códigos vazios ou só com espaços', () => {
    expect(deveEntregarLeitura('', null, 1000, PAUSA)).toBe(false);
    expect(deveEntregarLeitura('   ', null, 1000, PAUSA)).toBe(false);
  });

  it('compara ignorando espaços em volta', () => {
    // Alguns leitores devolvem o código com espaços ou um fim de linha. Sem o `trim` na
    // comparação, «111» e «111 » seriam códigos distintos e a repetição passaria.
    const anterior = leitura('111', 1000);
    expect(deveEntregarLeitura(' 111 ', anterior, 1100, PAUSA)).toBe(false);
  });

  it('com pausa zero entrega sempre', () => {
    // Configuração de quem quer cada fotograma — usada em testes e diagnóstico.
    const anterior = leitura('111', 1000);
    expect(deveEntregarLeitura('111', anterior, 1000, 0)).toBe(true);
  });
});
