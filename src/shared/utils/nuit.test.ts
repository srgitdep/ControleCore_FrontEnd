import { describe, expect, it } from 'vitest';
import {
  avisoDeNuitAoEscrever,
  diagnosticarNuit,
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

describe('diagnosticarNuit', () => {
  it('não assinala nada quando são nove dígitos', () => {
    expect(diagnosticarNuit('400123456')).toBeNull();
    expect(diagnosticarNuit('400 123 456')).toBeNull();
    expect(diagnosticarNuit('MZ400123456')).toBeNull();
  });

  it('diz quantos dígitos sobram', () => {
    // O caso real: treze dígitos, e a mensagem antiga dizia só «inválido».
    const aviso = diagnosticarNuit('3345664221555');

    expect(aviso).toContain('9 dígitos');
    expect(aviso).toContain('escreveu 13');
    expect(aviso).toContain('4 a mais');
  });

  it('diz quantos dígitos faltam', () => {
    const aviso = diagnosticarNuit('4001234');

    expect(aviso).toContain('escreveu 7');
    expect(aviso).toContain('faltam 2');
  });

  it('conta dígitos e não caracteres', () => {
    expect(diagnosticarNuit('400-123-456')).toBeNull();
  });

  it('trata o vazio como obrigatório', () => {
    expect(diagnosticarNuit('')).toBe(`O NUIT é obrigatório e tem ${DIGITOS_DO_NUIT} dígitos.`);
  });
});

describe('avisoDeNuitAoEscrever', () => {
  it('não acusa um campo ainda a meio', () => {
    // Escrever nove dígitos passa por oito estados incompletos. Assinalar cada um pintaria
    // o campo de vermelho durante toda a escrita.
    for (const parcial of ['4', '40', '400', '4001', '40012', '400123', '4001234', '40012345']) {
      expect(avisoDeNuitAoEscrever(parcial)).toBeNull();
    }
  });

  it('não assinala o campo vazio', () => {
    expect(avisoDeNuitAoEscrever('')).toBeNull();
  });

  it('não assinala um NUIT completo', () => {
    expect(avisoDeNuitAoEscrever('400123456')).toBeNull();
  });

  it('assinala quando passou dos nove — que é sempre um erro', () => {
    expect(avisoDeNuitAoEscrever('4001234567')).toContain('1 a mais');
    expect(avisoDeNuitAoEscrever('3345664221555')).toContain('4 a mais');
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
