import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { formatMoeda, formatMoedaCompacta } from './formatMoeda';
import { formatData, formatDataRelativa } from './formatData';

// Espaços do Intl (sem quebra e estreitos) normalizados, para comparar texto.
const limpo = (s: string) => s.replace(/[  ]/g, ' ');

describe('formatadores — português (o que já existia não muda)', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('pt');
  });

  it('moeda: número pt-MZ seguido de MT', () => {
    expect(limpo(formatMoeda(1234567.5))).toBe(limpo(new Intl.NumberFormat('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(1234567.5)) + ' MT');
  });

  it('moeda compacta', () => {
    expect(formatMoedaCompacta(1_234_567)).toBe('1,23M MT');
    expect(formatMoedaCompacta(12_300)).toBe('12,3K MT');
  });

  it('data curta', () => {
    expect(formatData('2026-04-03T10:00:00')).toBe('03/04/2026');
  });

  it('data relativa', () => {
    vi.setSystemTime(new Date('2026-09-29T12:00:00'));
    expect(formatDataRelativa('2026-09-29T11:59:40')).toBe('agora');
    expect(formatDataRelativa('2026-09-29T11:55:00')).toBe('há 5 min');
    expect(formatDataRelativa('2026-09-29T09:00:00')).toBe('há 3h');
    expect(formatDataRelativa('2026-09-28T12:00:00')).toBe('há 1 dia');
    expect(formatDataRelativa('2026-09-26T12:00:00')).toBe('há 3 dias');
  });
});

describe('formatadores — inglês', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });
  afterAll(async () => {
    vi.useRealTimers();
    await i18n.changeLanguage('pt');
  });

  it('moeda: MT à frente, separadores ingleses; continua a ser MZN', () => {
    expect(limpo(formatMoeda(1234567.5))).toBe('MT 1,234,567.50');
    expect(formatMoedaCompacta(1_234_567)).toBe('MT 1.23M');
  });

  it('data curta em dia/mês/ano (en-GB)', () => {
    expect(formatData('2026-04-03T10:00:00')).toBe('03/04/2026');
  });

  it('data relativa, com plural', () => {
    vi.setSystemTime(new Date('2026-09-29T12:00:00'));
    expect(formatDataRelativa('2026-09-29T11:55:00')).toBe('5 min ago');
    expect(formatDataRelativa('2026-09-28T12:00:00')).toBe('1 day ago');
    expect(formatDataRelativa('2026-09-26T12:00:00')).toBe('3 days ago');
  });
});
