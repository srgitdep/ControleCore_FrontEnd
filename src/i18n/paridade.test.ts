import { describe, expect, it } from 'vitest';

/**
 * Todas as chaves do português existem nas outras línguas, e vice-versa, em todos os
 * namespaces — e cada tradução leva as mesmas `{{variáveis}}` do original.
 *
 * Uma chave em falta não dá erro nenhum — o i18next mostra o texto português, e o ecrã
 * em inglês ou chinês fica meio traduzido sem ninguém dar por isso. Uma `{{variável}}`
 * apagada ou mal escrita é o mesmo defeito, mais subtil: o texto sai, mas sem o número
 * ou o nome que o explicava. Este teste é o aviso.
 */
const catalogos = import.meta.glob<Record<string, unknown>>('../locales/*/*.json', {
  eager: true,
  import: 'default',
});

/** As línguas a comparar com o português, que é a origem. */
const OUTRAS_LINGUAS = ['en', 'zh'] as const;

/**
 * Os sufixos de plural que o i18next acrescenta à chave (`produtos_one`, `produtos_other`).
 * Cada língua tem as suas categorias — o português e o inglês têm `one`/`other`, o mandarim
 * só `other` —, por isso a paridade compara a chave **sem** o sufixo: «existe o plural de
 * `produtos`», e não «existem exactamente as mesmas formas».
 */
const SUFIXO_DE_PLURAL = /_(zero|one|two|few|many|other)$/;

function textos(objecto: Record<string, unknown>, prefixo = ''): Array<[string, string]> {
  return Object.entries(objecto).flatMap(([chave, valor]) => {
    const caminho = prefixo ? `${prefixo}.${chave}` : chave;
    return typeof valor === 'object' && valor !== null
      ? textos(valor as Record<string, unknown>, caminho)
      : [[caminho, String(valor)] as [string, string]];
  });
}

function chaves(objecto: Record<string, unknown>): string[] {
  return [...new Set(textos(objecto).map(([caminho]) => caminho.replace(SUFIXO_DE_PLURAL, '')))];
}

/** Chave sem sufixo de plural → as `{{variáveis}}` de todas as suas formas. */
function variaveis(objecto: Record<string, unknown>): Map<string, string[]> {
  const porChave = new Map<string, Set<string>>();
  for (const [caminho, texto] of textos(objecto)) {
    const base = caminho.replace(SUFIXO_DE_PLURAL, '');
    const conjunto = porChave.get(base) ?? new Set<string>();
    for (const m of texto.matchAll(/\{\{\s*([\w.]+)/g)) conjunto.add(m[1]);
    porChave.set(base, conjunto);
  }
  return new Map([...porChave].map(([chave, conjunto]) => [chave, [...conjunto].sort()]));
}

const porLingua = (lingua: string) =>
  Object.fromEntries(
    Object.entries(catalogos)
      .filter(([caminho]) => caminho.includes(`/locales/${lingua}/`))
      .map(([caminho, conteudo]) => [caminho.split('/').pop()!.replace('.json', ''), conteudo]),
  );

describe('paridade das traduções', () => {
  const pt = porLingua('pt');

  describe.each(OUTRAS_LINGUAS)('português e «%s»', (lingua) => {
    const outra = porLingua(lingua);

    it('os mesmos namespaces', () => {
      expect(Object.keys(outra).sort()).toEqual(Object.keys(pt).sort());
    });

    it.each(Object.keys(pt))('namespace «%s»: as mesmas chaves', (namespace) => {
      expect(chaves(outra[namespace] ?? {}).sort()).toEqual(chaves(pt[namespace]).sort());
    });

    it.each(Object.keys(pt))('namespace «%s»: as mesmas {{variáveis}}', (namespace) => {
      const origem = variaveis(pt[namespace]);
      const traduzido = variaveis(outra[namespace] ?? {});
      const diferentes = [...origem]
        .filter(([chave, vars]) => JSON.stringify(traduzido.get(chave) ?? []) !== JSON.stringify(vars))
        .map(([chave, vars]) => ({ chave, esperado: vars, recebido: traduzido.get(chave) }));
      expect(diferentes).toEqual([]);
    });
  });

  it('o mandarim só tem a forma de plural «other»', () => {
    // O i18next pede `chave_other` para `zh` (o mandarim não distingue singular de plural).
    // Um `_one` aqui nunca seria lido — sinal de que se copiou o plural do português.
    const sobras = Object.entries(porLingua('zh')).flatMap(([namespace, conteudo]) =>
      textos(conteudo)
        .map(([caminho]) => caminho)
        // `_zero` fica de fora: o i18next usa-o para `count === 0` em qualquer língua.
        .filter((caminho) => /_(one|two|few|many)$/.test(caminho))
        .map((caminho) => `${namespace}:${caminho}`),
    );
    expect(sobras).toEqual([]);
  });
});
