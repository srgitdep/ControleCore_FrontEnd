import { describe, it, expect } from 'vitest';
import {
  detectarIdioma,
  escolherVoz,
  expandirParaFala,
  idiomaDeVozDaInterface,
} from './idioma';

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

describe('mandarim', () => {
  it('uma frase com caracteres chineses é mandarim, mesmo curta', () => {
    expect(detectarIdioma('好')).toBe('zh-CN');
    expect(detectarIdioma('今天卖了多少？')).toBe('zh-CN');
  });

  it('o mandarim vence mesmo com palavras latinas à mistura (nomes, códigos)', () => {
    expect(detectarIdioma('库存 SH-001 低于最低值')).toBe('zh-CN');
    expect(detectarIdioma('Coca-Cola 2L 还有多少')).toBe('zh-CN');
  });

  it('o português e o inglês não mudam', () => {
    expect(detectarIdioma('Quanto vendemos hoje?')).toBe('pt-PT');
    expect(detectarIdioma('How much did we sell today?')).toBe('en-US');
  });

  it('escolherVoz encontra a voz chinesa, exacta ou da mesma língua', () => {
    const voz = (lang: string): SpeechSynthesisVoice =>
      ({ lang, name: lang, default: false, localService: true, voiceURI: lang }) as SpeechSynthesisVoice;
    expect(escolherVoz('zh-CN', [voz('zh-TW'), voz('zh-CN')])?.lang).toBe('zh-CN');
    expect(escolherVoz('zh-CN', [voz('pt-PT'), voz('zh-HK')])?.lang).toBe('zh-HK');
    expect(escolherVoz('zh-CN', [voz('pt-PT')])).toBeUndefined();
  });
});

describe('idiomaDeVozDaInterface', () => {
  it('cada língua da interface tem a sua língua de voz', () => {
    expect(idiomaDeVozDaInterface('pt')).toBe('pt-PT');
    expect(idiomaDeVozDaInterface('en')).toBe('en-US');
    expect(idiomaDeVozDaInterface('zh')).toBe('zh-CN');
  });
});

describe('expandirParaFala', () => {
  it('em português e em inglês fica como era', () => {
    expect(expandirParaFala('50 MZN, 5 kg e 10%', 'pt-PT')).toBe('50 meticais, 5 quilos e 10 por cento');
    expect(expandirParaFala('50 MZN e 10%', 'en-US')).toBe('50 meticals e 10 percent');
  });

  it('em mandarim a moeda lê-se em chinês e o % fica para a síntese', () => {
    expect(expandirParaFala('50 MZN 和 10%', 'zh-CN')).toBe('50 梅蒂卡尔 和 10%');
  });

  it('nenhuma língua deixa a sigla da moeda por ler', () => {
    for (const idioma of ['pt-PT', 'en-US', 'zh-CN'] as const) {
      expect(expandirParaFala('MZN', idioma)).not.toBe('MZN');
    }
  });
});
