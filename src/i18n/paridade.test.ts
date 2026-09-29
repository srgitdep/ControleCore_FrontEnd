import { describe, expect, it } from 'vitest';

/**
 * Todas as chaves do português existem no inglês, e vice-versa, em todos os namespaces.
 *
 * Uma chave em falta não dá erro nenhum — o i18next mostra o texto português, e o ecrã
 * em inglês fica meio traduzido sem ninguém dar por isso. Este teste é o aviso.
 */
const catalogos = import.meta.glob<Record<string, unknown>>('../locales/*/*.json', {
  eager: true,
  import: 'default',
});

function chaves(objecto: Record<string, unknown>, prefixo = ''): string[] {
  return Object.entries(objecto).flatMap(([chave, valor]) => {
    const caminho = prefixo ? `${prefixo}.${chave}` : chave;
    return typeof valor === 'object' && valor !== null
      ? chaves(valor as Record<string, unknown>, caminho)
      : [caminho];
  });
}

const porLingua = (lingua: string) =>
  Object.fromEntries(
    Object.entries(catalogos)
      .filter(([caminho]) => caminho.includes(`/locales/${lingua}/`))
      .map(([caminho, conteudo]) => [caminho.split('/').pop()!.replace('.json', ''), conteudo]),
  );

describe('paridade das traduções', () => {
  const pt = porLingua('pt');
  const en = porLingua('en');

  it('os mesmos namespaces nas duas línguas', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(pt).sort());
  });

  it.each(Object.keys(pt))('namespace «%s»: as mesmas chaves', (namespace) => {
    expect(chaves(en[namespace] ?? {}).sort()).toEqual(chaves(pt[namespace]).sort());
  });
});
