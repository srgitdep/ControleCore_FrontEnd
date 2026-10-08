import { describe, expect, it } from 'vitest';
import { formatarLocal, formatarResultadosDaPesquisa } from './nomeDoLocal';

describe('formatarLocal', () => {
  it('monta «rua, bairro, cidade, província» a partir do endereço', () => {
    const r = formatarLocal({
      address: {
        road: 'Avenida 24 de Julho',
        suburb: 'Polana',
        city: 'Maputo',
        state: 'Maputo Cidade',
        country_code: 'mz',
      },
    });

    expect(r).toEqual({
      texto: 'Avenida 24 de Julho, Polana, Maputo, Maputo Cidade',
      foraDeMocambique: false,
    });
  });

  it('sem rua usa o que houver (bairro e cidade)', () => {
    const r = formatarLocal({ address: { neighbourhood: 'Sommerschield', city: 'Maputo', country_code: 'mz' } });

    expect(r?.texto).toBe('Sommerschield, Maputo');
  });

  it('numa vila usa o nome da vila quando não há cidade', () => {
    const r = formatarLocal({ address: { village: 'Mueda', state: 'Cabo Delgado', country_code: 'mz' } });

    expect(r?.texto).toBe('Mueda, Cabo Delgado');
  });

  it('não repete partes iguais (cidade e província com o mesmo nome)', () => {
    const r = formatarLocal({ address: { city: 'Maputo', state: 'Maputo', country_code: 'mz' } });

    expect(r?.texto).toBe('Maputo');
  });

  it('🔴 avisa quando o ponto cai fora de Moçambique', () => {
    const r = formatarLocal({ address: { city: 'Joanesburgo', state: 'Gauteng', country_code: 'za' } });

    expect(r?.foraDeMocambique).toBe(true);
  });

  it('sem código de país não alarma ninguém', () => {
    expect(formatarLocal({ address: { city: 'Algures' } })?.foraDeMocambique).toBe(false);
  });

  it('o código de país não depende de maiúsculas', () => {
    expect(formatarLocal({ address: { city: 'Beira', country_code: 'MZ' } })?.foraDeMocambique).toBe(false);
  });

  it('sem campos estruturados cai nos primeiros pedaços do nome completo', () => {
    const r = formatarLocal({ display_name: 'Escola Primária, Bairro Novo, Pemba, Cabo Delgado, Moçambique' });

    expect(r?.texto).toBe('Escola Primária, Bairro Novo, Pemba');
  });

  it('um sítio que o serviço não conhece (oceano, mato) dá null, e não uma frase vazia', () => {
    expect(formatarLocal({ error: 'Unable to geocode' })).toBeNull();
    expect(formatarLocal({ address: {} })).toBeNull();
  });
});

describe('formatarResultadosDaPesquisa', () => {
  it('converte as coordenadas de texto para número e monta um nome legível', () => {
    const [r] = formatarResultadosDaPesquisa([
      {
        lat: '-25.9692',
        lon: '32.5732',
        display_name: 'Bairro Central, Maputo, Cidade de Maputo, Moçambique',
        address: { suburb: 'Bairro Central', city: 'Maputo', state: 'Cidade de Maputo', country_code: 'mz' },
      },
    ]);

    expect(r).toEqual({
      texto: 'Bairro Central, Maputo, Cidade de Maputo',
      detalhe: 'Bairro Central, Maputo, Cidade de Maputo, Moçambique',
      latitude: -25.9692,
      longitude: 32.5732,
    });
  });

  it('descarta resultados sem coordenadas válidas', () => {
    expect(formatarResultadosDaPesquisa([{ lat: 'x', lon: '1', display_name: 'A' }, { display_name: 'B' }])).toEqual([]);
  });

  it('sem endereço estruturado usa os primeiros pedaços do nome completo', () => {
    const [r] = formatarResultadosDaPesquisa([
      { lat: '-25.9', lon: '32.5', display_name: 'Mercado Central, Baixa, Maputo, Moçambique' },
    ]);

    expect(r.texto).toBe('Mercado Central, Baixa, Maputo');
  });

  it('uma lista vazia dá uma lista vazia', () => {
    expect(formatarResultadosDaPesquisa([])).toEqual([]);
  });
});
