import { describe, it, expect } from 'vitest';
import { mensagemDeErro } from './mensagemDeErro';

/**
 * O caso que originou isto: ao criar um caixa sem loja, o ecrã do telemóvel mostrava
 *
 *   lojaIdshould not be emptylojaIdmust be a UUID
 *
 * — o array do `ValidationPipe` renderizado sem separador.
 */
describe('mensagemDeErro', () => {
  const erroDaApi = (message: unknown) => ({ response: { data: { message } } });

  it('separa as entradas de um array em vez de as colar', () => {
    const r = mensagemDeErro(
      erroDaApi(['lojaId should not be empty', 'lojaId must be a UUID']),
      'alternativa',
    );

    expect(r).toBe('LojaId should not be empty\nLojaId must be a UUID');
    expect(r).not.toContain('emptylojaId');
  });

  it('usa a mensagem quando o servidor manda uma frase', () => {
    // O caso da regra de negócio: a frase do servidor é a explicação útil e deve passar
    // intacta ao utilizador.
    const frase = 'A loja SHOPRITE Central já tem um armazém do tipo "Venda".';
    expect(mensagemDeErro(erroDaApi(frase), 'alternativa')).toBe(frase);
  });

  it('capitaliza cada entrada', () => {
    expect(mensagemDeErro(erroDaApi(['nome should not be empty']), 'x')).toBe(
      'Nome should not be empty',
    );
  });

  it('descarta entradas vazias', () => {
    expect(mensagemDeErro(erroDaApi(['', '  ', 'nome inválido']), 'x')).toBe('Nome inválido');
  });

  it('cai na alternativa quando o array não tem nada de útil', () => {
    expect(mensagemDeErro(erroDaApi([]), 'Não foi possível criar o caixa.')).toBe(
      'Não foi possível criar o caixa.',
    );
  });

  it('cai na alternativa quando não há resposta do servidor', () => {
    // Rede em baixo: `Network Error` não diz nada ao operador de caixa.
    expect(mensagemDeErro(new Error('Network Error'), 'Não foi possível criar o caixa.')).toBe(
      'Não foi possível criar o caixa.',
    );
  });

  it('não rebenta com valores inesperados', () => {
    expect(mensagemDeErro(null, 'alternativa')).toBe('alternativa');
    expect(mensagemDeErro(undefined, 'alternativa')).toBe('alternativa');
    expect(mensagemDeErro(erroDaApi({ algo: 1 }), 'alternativa')).toBe('alternativa');
  });
});
