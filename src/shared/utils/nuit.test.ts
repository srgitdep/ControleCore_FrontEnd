import { describe, expect, it } from 'vitest';
import {
  diagnosticoDoNuitAoEscrever,
  diagnosticoDoNuit,
  DIGITOS_DO_NUIT,
  formatarNuit,
  normalizarNuit,
} from './nuit';

describe('normalizarNuit', () => {
  it('reduz a dígitos', () => {
    expect(normalizarNuit('400 123 456')).toBe('400123456');
    expect(normalizarNuit('400.123.456')).toBe('400123456');
    expect(normalizarNuit('MZ400123456')).toBe('400123456');
  });

  it('devolve nulo quando não há dígito nenhum', () => {
    expect(normalizarNuit('')).toBeNull();
    expect(normalizarNuit('   ')).toBeNull();
    expect(normalizarNuit('sem número')).toBeNull();
    expect(normalizarNuit(null)).toBeNull();
    expect(normalizarNuit(undefined)).toBeNull();
  });
});

describe('diagnosticoDoNuit', () => {
  it('não assinala nada quando são nove dígitos', () => {
    expect(diagnosticoDoNuit('400123456')).toBeNull();
    expect(diagnosticoDoNuit('400 123 456')).toBeNull();
    expect(diagnosticoDoNuit('MZ400123456')).toBeNull();
  });

  it('diz quantos dígitos sobram', () => {
    // O caso real: treze dígitos, e a mensagem antiga dizia só «inválido».
    expect(diagnosticoDoNuit('3345664221555')).toEqual({
      chave: 'a_mais',
      parametros: { digitos: 9, escritos: 13, excesso: 4 },
    });
  });

  it('diz quantos dígitos faltam', () => {
    expect(diagnosticoDoNuit('4001234')).toEqual({
      chave: 'a_menos',
      parametros: { digitos: 9, escritos: 7, faltam: 2 },
    });
  });

  it('conta dígitos e não caracteres', () => {
    expect(diagnosticoDoNuit('400-123-456')).toBeNull();
  });

  it('trata o vazio como obrigatório', () => {
    expect(diagnosticoDoNuit('')).toEqual({
      chave: 'obrigatorio',
      parametros: { digitos: DIGITOS_DO_NUIT },
    });
  });
});

describe('diagnosticoDoNuitAoEscrever', () => {
  it('não acusa um campo ainda a meio', () => {
    // Escrever nove dígitos passa por oito estados incompletos. Assinalar cada um pintaria
    // o campo de vermelho durante toda a escrita.
    for (const parcial of ['4', '40', '400', '4001', '40012', '400123', '4001234', '40012345']) {
      expect(diagnosticoDoNuitAoEscrever(parcial)).toBeNull();
    }
  });

  it('não assinala o campo vazio', () => {
    expect(diagnosticoDoNuitAoEscrever('')).toBeNull();
  });

  it('não assinala um NUIT completo', () => {
    expect(diagnosticoDoNuitAoEscrever('400123456')).toBeNull();
  });

  it('assinala quando passou dos nove — que é sempre um erro', () => {
    expect(diagnosticoDoNuitAoEscrever('4001234567')?.chave).toBe('a_mais');
    expect(diagnosticoDoNuitAoEscrever('3345664221555')?.parametros.excesso).toBe(4);
  });
});

describe('formatarNuit', () => {
  it('agrupa nove dígitos em três', () => {
    expect(formatarNuit('400123456')).toBe('400 123 456');
  });

  it('devolve outros comprimentos como estão', () => {
    // Agrupar um número errado fá-lo-ia parecer mais correcto do que é.
    expect(formatarNuit('3345664221555')).toBe('3345664221555');
  });

  it('devolve nulo quando não há NUIT', () => {
    expect(formatarNuit(null)).toBeNull();
  });
});
