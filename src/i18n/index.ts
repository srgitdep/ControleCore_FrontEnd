import i18n from 'i18next';
import type { BackendModule } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import comumPt from '../locales/pt/comum.json';
import comumEn from '../locales/en/comum.json';

/**
 * Tradução da interface.
 *
 * ## Línguas e ordem de decisão
 *
 * Português (origem e recurso final) e inglês. A língua activa decide-se por esta ordem:
 * a da sessão (vem no login — a escolha da pessoa ou a da empresa), a guardada neste
 * browser, a do browser, português. Espelha `resolverIdioma` do backend
 * (`src/shared/idiomas.ts`).
 *
 * ## Namespaces
 *
 * Um ficheiro por feature em `src/locales/<língua>/<namespace>.json`. O `comum` vai no
 * bundle inicial, nas duas línguas: é o que o selector e os formatadores usam logo no
 * primeiro ecrã, e é pequeno. Os outros carregam-se quando um ecrã os pede, por
 * `import()` — cada namespace vira um ficheiro à parte no build do Vite, e quem nunca abre
 * o portal nunca descarrega as traduções do portal.
 */
export const IDIOMAS = ['pt', 'en'] as const;
export type Idioma = (typeof IDIOMAS)[number];
export const IDIOMA_PADRAO: Idioma = 'pt';

/** Chave do `localStorage` onde fica a língua deste browser. */
export const CHAVE_IDIOMA = 'idioma';

export function eIdioma(valor: unknown): valor is Idioma {
  return typeof valor === 'string' && (IDIOMAS as readonly string[]).includes(valor);
}

// O build avisa `INEFFECTIVE_DYNAMIC_IMPORT` para `comum.json`: o `import()` abaixo apanha
// todos os namespaces, e o `comum` também vem por import estático no topo. É o pretendido
// — o `comum` fica no bundle inicial — e o aviso não afecta os outros namespaces.
const carregarNamespace: BackendModule = {
  type: 'backend',
  init() {},
  read(lingua, namespace, devolver) {
    import(`../locales/${lingua}/${namespace}.json`)
      .then((modulo) => devolver(null, modulo.default))
      .catch((erro) => devolver(erro, false));
  },
};

i18n
  .use(carregarNamespace)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { pt: { comum: comumPt }, en: { comum: comumEn } },
    // Com `resources` e um backend ao mesmo tempo: o que está em `resources` não se volta
    // a pedir, o resto carrega-se sob pedido.
    partialBundledLanguages: true,
    supportedLngs: [...IDIOMAS],
    // `en-GB` e `pt-MZ` do browser contam como `en` e `pt`.
    load: 'languageOnly',
    nonExplicitSupportedLngs: true,
    fallbackLng: IDIOMA_PADRAO,
    ns: ['comum'],
    defaultNS: 'comum',
    interpolation: { escapeValue: false }, // o React já escapa
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: CHAVE_IDIOMA,
      caches: ['localStorage'],
    },
    react: { useSuspense: false },
  });

/** A língua activa, já reduzida a uma das suportadas. */
export function idiomaActivo(): Idioma {
  const lingua = (i18n.resolvedLanguage ?? i18n.language ?? '').split('-')[0];
  return eIdioma(lingua) ? lingua : IDIOMA_PADRAO;
}

/**
 * O locale do `Intl` de cada língua, para números e datas. `en-GB` e não `en-US`: dia/mês/
 * ano, como se lê na África Austral — `03/04/2026` é 3 de Abril nas duas línguas.
 */
const LOCALE_INTL: Record<Idioma, string> = { pt: 'pt-MZ', en: 'en-GB' };

export function localeIntl(): string {
  return LOCALE_INTL[idiomaActivo()];
}

/**
 * Aplica a língua que veio da sessão (login ou «a minha conta»). `null`/`undefined` —
 * a pessoa nunca escolheu — deixa a língua deste browser como está.
 */
export function aplicarIdiomaGuardado(idioma: string | null | undefined) {
  if (eIdioma(idioma) && idioma !== idiomaActivo()) {
    void i18n.changeLanguage(idioma);
  }
}

// O `lang` da página segue a língua activa: leitores de ecrã e a tradução automática do
// browser lêem-no. O `index.html` dizia `lang="en"` com a interface em português.
const actualizarLangDaPagina = () => {
  // Sem `document` nos testes (Vitest corre em Node).
  if (typeof document !== 'undefined') document.documentElement.lang = idiomaActivo();
};
i18n.on('languageChanged', actualizarLangDaPagina);
actualizarLangDaPagina();

export default i18n;
