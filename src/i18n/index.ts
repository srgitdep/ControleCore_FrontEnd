import i18n from 'i18next';
import type { Resource } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

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
 * Um ficheiro por feature em `src/locales/<língua>/<namespace>.json`, **todos no bundle
 * inicial**, juntos pelo `import.meta.glob` abaixo — um namespace novo entra sozinho.
 *
 * Carregá-los só quando um ecrã os pede (por `import()`) foi a primeira versão, e deixava
 * o ecrã a mostrar as chaves cruas («checkout.titulo») enquanto o ficheiro descarregava:
 * a aplicação não tem nenhum `Suspense` onde esperar. As traduções são pequenas (o `loja`
 * tem ~5 KB por língua); se o ERP (Fase 3) as fizer crescer muito, volta-se ao
 * carregamento sob pedido com uma espera no layout de cada superfície.
 */
export const IDIOMAS = ['pt', 'en'] as const;
export type Idioma = (typeof IDIOMAS)[number];
export const IDIOMA_PADRAO: Idioma = 'pt';

/** Chave do `localStorage` onde fica a língua deste browser. */
export const CHAVE_IDIOMA = 'idioma';

export function eIdioma(valor: unknown): valor is Idioma {
  return typeof valor === 'string' && (IDIOMAS as readonly string[]).includes(valor);
}

const ficheiros = import.meta.glob<Record<string, unknown>>('../locales/*/*.json', {
  eager: true,
  import: 'default',
});

const traducoes: Resource = {};
for (const [caminho, conteudo] of Object.entries(ficheiros)) {
  const [, lingua, namespace] = caminho.match(/locales\/([^/]+)\/([^/]+)\.json$/)!;
  (traducoes[lingua] ??= {})[namespace] = conteudo;
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: traducoes,
    supportedLngs: [...IDIOMAS],
    // `en-GB` e `pt-MZ` do browser contam como `en` e `pt`.
    load: 'languageOnly',
    nonExplicitSupportedLngs: true,
    fallbackLng: IDIOMA_PADRAO,
    ns: Object.keys(traducoes[IDIOMA_PADRAO] ?? {}),
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
