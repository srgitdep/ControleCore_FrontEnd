import { describe, it, expect } from 'vitest';
import { detectarIdioma, escolherVoz } from './idioma';

describe('detectarIdioma', () => {
  describe('português', () => {
    it('reconhece uma pergunta comum', () => {
      expect(detectarIdioma('Quanto vendemos hoje na loja do centro?')).toBe('pt-PT');
    });

    it('reconhece pelos acentos, mesmo em frase curta', () => {
      // Nenhuma palavra inglesa comum tem acentos: quem escreve «não» ou «março» não
      // está a escrever inglês, e a prova é suficiente sem contar palavras.
      expect(detectarIdioma('não')).toBe('pt-PT');
      expect(detectarIdioma('março')).toBe('pt-PT');
    });

    it('reconhece um pedido de acção', () => {
      expect(detectarIdioma('Cria um produto novo com este preço')).toBe('pt-PT');
    });
  });

  describe('inglês', () => {
    it('reconhece uma pergunta comum', () => {
      expect(detectarIdioma('How much did we sell today?')).toBe('en-US');
    });

    it('reconhece um pedido de dados', () => {
      expect(detectarIdioma('Show me the products with low stock')).toBe('en-US');
    });

    it('reconhece uma frase sem palavras portuguesas', () => {
      expect(detectarIdioma('What are the sales for this month')).toBe('en-US');
    });
  });

  describe('português por omissão nos casos ambíguos', () => {
    // Ler «Coca-Cola» ou «50 meticais» com fonética inglesa é pior do que o contrário,
    // e o sistema é usado em Moçambique.
    it('devolve português para texto vazio', () => {
      expect(detectarIdioma('')).toBe('pt-PT');
      expect(detectarIdioma('   ')).toBe('pt-PT');
    });

    it('devolve português para uma frase curta demais', () => {
      expect(detectarIdioma('ok')).toBe('pt-PT');
    });

    it('devolve português para só números', () => {
      expect(detectarIdioma('12 441,60')).toBe('pt-PT');
    });

    it('devolve português para um código de produto', () => {
      expect(detectarIdioma('SH-001')).toBe('pt-PT');
    });

    it('devolve português quando há empate de marcadores', () => {
      // «me» e «a» existem nas duas listas e não contam para nenhum lado.
      expect(detectarIdioma('me a me a')).toBe('pt-PT');
    });
  });

  describe('palavras que existem nas duas línguas', () => {
    it('não deixa "a", "me" e "do" decidirem sozinhas', () => {
      // Se «do» contasse como inglês, «do stock da loja» seria mal classificado.
      expect(detectarIdioma('o total do stock da loja')).toBe('pt-PT');
    });

    it('classifica pelo resto da frase quando há palavras comuns', () => {
      expect(detectarIdioma('do you have the sales report')).toBe('en-US');
    });
  });

  it('não confunde palavras funcionais dentro de outras palavras', () => {
    // Um `includes('do')` casaria com «produto»; a comparação é por palavra inteira.
    expect(detectarIdioma('produtos e produtores de queijo')).toBe('pt-PT');
  });
});

describe('escolherVoz', () => {
  const voz = (lang: string, name = lang): SpeechSynthesisVoice =>
    ({ lang, name, default: false, localService: true, voiceURI: name }) as SpeechSynthesisVoice;

  it('prefere a correspondência exacta', () => {
    // `pt-PT` antes de `pt-BR`: a pronúncia difere o suficiente para se notar, e a
    // norma do sistema é a europeia.
    const vozes = [voz('pt-BR'), voz('pt-PT'), voz('en-US')];
    expect(escolherVoz('pt-PT', vozes)?.lang).toBe('pt-PT');
  });

  it('aceita a mesma língua com outra região quando a exacta não existe', () => {
    const vozes = [voz('pt-BR'), voz('en-GB')];
    expect(escolherVoz('pt-PT', vozes)?.lang).toBe('pt-BR');
    expect(escolherVoz('en-US', vozes)?.lang).toBe('en-GB');
  });

  it('devolve undefined quando não há voz para a língua', () => {
    // Quem chama deixa o browser escolher, o que é melhor do que forçar uma voz errada.
    expect(escolherVoz('en-US', [voz('pt-PT')])).toBeUndefined();
  });

  it('devolve undefined quando não há vozes instaladas', () => {
    expect(escolherVoz('pt-PT', [])).toBeUndefined();
  });
});
