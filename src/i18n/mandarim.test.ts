import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import i18n, { carregarIdioma, eIdioma, idiomaActivo, localeIntl, mudarIdioma } from '@/i18n';
import { formatMoeda, formatMoedaCompacta, formatMoedaInteira } from '@/shared/utils/formatMoeda';
import { formatData, formatDataRelativa } from '@/shared/utils/formatData';

// Espaços do Intl (sem quebra e estreitos) normalizados, para comparar texto.
const limpo = (s: string) => s.replace(/[  ]/g, ' ');

/**
 * O mandarim (`zh`) é a única língua carregada sob pedido: o catálogo só chega quando
 * alguém a usa. Estes testes provam o que isso promete — que a língua só muda depois de o
 * catálogo chegar, que o plural do mandarim funciona só com «other», e que o formato dos
 * números e das datas é o seu.
 */
describe('mandarim — carregamento sob pedido', () => {
  afterAll(async () => {
    await i18n.changeLanguage('pt');
  });

  it('`zh` é uma língua reconhecida', () => {
    expect(eIdioma('zh')).toBe(true);
    // O browser envia `zh-CN`; o que se guarda é o código já reduzido.
    expect(eIdioma('zh-CN')).toBe(false);
  });

  it('o catálogo não está no i18next até alguém o pedir', () => {
    expect(i18n.hasResourceBundle('zh', 'comum')).toBe(false);
  });

  it('`mudarIdioma` espera pelo catálogo e só depois muda a língua', async () => {
    await mudarIdioma('zh');
    expect(idiomaActivo()).toBe('zh');
    expect(i18n.hasResourceBundle('zh', 'comum')).toBe(true);
    expect(i18n.t('tempo.agora', { ns: 'comum' })).toBe('刚刚');
  });

  it('carregar duas vezes devolve a mesma promessa (um só descarregamento)', () => {
    const primeira = carregarIdioma('zh');
    expect(carregarIdioma('zh')).toBe(primeira);
  });

  it('`pt` e `en` não esperam por nada', async () => {
    await expect(carregarIdioma('pt')).resolves.toBeUndefined();
    await expect(carregarIdioma('en')).resolves.toBeUndefined();
  });

  it('uma chave que o mandarim não tem cai no português, nunca na chave crua', async () => {
    await mudarIdioma('zh');
    // Existe só no português, de propósito: prova o recurso final.
    i18n.addResource('pt', 'comum', 'so_no_pt', 'só em português');
    // Chave fora do catálogo tipado, de propósito: o `t` tipado recusaria compilá-la.
    const traduzir = i18n.t as unknown as (chave: string, opcoes: { ns: string }) => string;
    expect(traduzir('so_no_pt', { ns: 'comum' })).toBe('só em português');
  });
});

describe('mandarim — plural e formatos', () => {
  beforeEach(async () => {
    await mudarIdioma('zh');
  });
  afterAll(async () => {
    await i18n.changeLanguage('pt');
  });

  it('o plural do mandarim só tem «other»: 1 e 3 usam o mesmo texto', () => {
    expect(i18n.t('tempo.ha_dias', { ns: 'comum', count: 1 })).toBe('1 天前');
    expect(i18n.t('tempo.ha_dias', { ns: 'comum', count: 3 })).toBe('3 天前');
  });

  it('o locale do Intl é zh-CN', () => {
    expect(localeIntl()).toBe('zh-CN');
  });

  it('moeda: MT à frente, separadores como no inglês; continua a ser MZN', () => {
    expect(limpo(formatMoeda(1234567.5))).toBe('MT 1,234,567.50');
    expect(formatMoedaCompacta(1_234_567)).toBe('MT 1.23M');
    expect(formatMoedaInteira(6500)).toBe('MT 6,500');
  });

  it('data curta: ano/mês/dia', () => {
    expect(formatData('2026-04-03T10:00:00')).toBe('2026/04/03');
  });

  it('data relativa', () => {
    const agora = new Date('2026-09-29T12:00:00').getTime();
    const realNow = Date.now;
    Date.now = () => agora;
    try {
      expect(formatDataRelativa('2026-09-29T11:55:00')).toBe('5 分钟前');
      expect(formatDataRelativa('2026-09-26T12:00:00')).toBe('3 天前');
    } finally {
      Date.now = realNow;
    }
  });
});
