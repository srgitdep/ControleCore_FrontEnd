import i18n from 'i18next';
import type { Resource } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

/**
 * Tradução da interface.
 *
 * ## Línguas e ordem de decisão
 *
 * Português (origem e recurso final), inglês e mandarim (chinês simplificado, `zh`). A
 * língua activa decide-se por esta ordem:
 * a da sessão (vem no login — a escolha da pessoa ou a da empresa), a guardada neste
 * browser, a do browser, português. Espelha `resolverIdioma` do backend
 * (`src/shared/idiomas.ts`).
 *
 * ## Namespaces
 *
 * Um ficheiro por feature em `src/locales/<língua>/<namespace>.json`, juntos pelo
 * `import.meta.glob` — um namespace novo entra sozinho.
 *
 * **`pt` e `en` estão no bundle inicial.** Carregar os namespaces só quando um ecrã os pede
 * (por `import()`) foi a primeira versão, e deixava o ecrã a mostrar as chaves cruas
 * («checkout.titulo») enquanto o ficheiro descarregava: a aplicação não tem nenhum
 * `Suspense` onde esperar.
 *
 * **`zh` carrega sob pedido, de uma só vez** (`./zh.ts` é um chunk com todos os namespaces).
 * Três línguas no bundle inicial somavam ~1 MB de JSON para quem só usa uma, e o
 * problema das chaves cruas não se põe aqui: a língua só muda depois de o chunk chegar
 * (`mudarIdioma`, `aplicarIdiomaGuardado` e `carregarIdiomaActivo` esperam por ele), e o
 * português — sempre carregado — é o recurso final se, ainda assim, faltar alguma coisa.
 */
export const IDIOMAS = ['pt', 'en', 'zh'] as const;
export type Idioma = (typeof IDIOMAS)[number];
export const IDIOMA_PADRAO: Idioma = 'pt';

/** Chave do `localStorage` onde fica a língua deste browser. */
export const CHAVE_IDIOMA = 'idioma';

export function eIdioma(valor: unknown): valor is Idioma {
  return typeof valor === 'string' && (IDIOMAS as readonly string[]).includes(valor);
}

const ficheiros = import.meta.glob<Record<string, unknown>>('../locales/{pt,en}/*.json', {
  eager: true,
  import: 'default',
});

const traducoes: Resource = {};
for (const [caminho, conteudo] of Object.entries(ficheiros)) {
  const [, lingua, namespace] = caminho.match(/locales\/([^/]+)\/([^/]+)\.json$/)!;
  (traducoes[lingua] ??= {})[namespace] = conteudo;
}

/** As línguas cujo catálogo só se descarrega quando alguém as usa (`./zh.ts`). */
const SOB_PEDIDO: Partial<
  Record<Idioma, () => Promise<{ default: Record<string, Record<string, unknown>> }>>
> = {
  zh: () => import('./zh'),
};

const carregadas = new Map<Idioma, Promise<void>>();

/**
 * Garante que o catálogo da língua está no i18next. Para `pt` e `en` não faz nada (já vêm no
 * bundle). Chamar duas vezes devolve a mesma promessa; se o descarregamento falhar, a
 * próxima tentativa começa de novo em vez de ficar presa ao erro.
 */
export function carregarIdioma(lingua: Idioma): Promise<void> {
  const carregar = SOB_PEDIDO[lingua];
  if (!carregar) return Promise.resolve();

  let promessa = carregadas.get(lingua);
  if (!promessa) {
    promessa = carregar()
      .then(({ default: catalogos }) => {
        for (const [namespace, conteudo] of Object.entries(catalogos)) {
          i18n.addResourceBundle(lingua, namespace, conteudo, true, true);
        }
      })
      .catch((erro: unknown) => {
        carregadas.delete(lingua);
        throw erro;
      });
    carregadas.set(lingua, promessa);
  }
  return promessa;
}

/**
 * Muda a língua da interface, esperando primeiro pelo catálogo se ela é carregada sob
 * pedido. É por aqui que passa toda a mudança de língua (selector, sessão): chamar
 * `i18n.changeLanguage` directamente com `zh` mostraria português até o chunk chegar.
 * Se o descarregamento falhar, a língua não muda e o erro sobe a quem chamou.
 */
export async function mudarIdioma(lingua: Idioma): Promise<void> {
  await carregarIdioma(lingua);
  await i18n.changeLanguage(lingua);
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
    // `added`: se o catálogo de uma língua chegar depois de o componente desenhar (um
    // `zh` escolhido pelo browser antes do chunk), o componente refaz-se sozinho.
    react: { useSuspense: false, bindI18nStore: 'added' },
  });

/**
 * Espera pelo catálogo da língua que o detector escolheu (o browser em `zh-CN`). O
 * `main.tsx` espera por isto antes do primeiro render: sem isso, quem tem o browser em
 * chinês via um relâmpago de português. Uma falha de rede não impede a aplicação de
 * arrancar — fica em português, que é o recurso final.
 */
export function carregarIdiomaActivo(): Promise<void> {
  // `i18n.language` e não `idiomaActivo()`: sem o catálogo carregado, o `resolvedLanguage`
  // já voltou ao português, e perguntar-lhe daria sempre «pt» — a língua que o detector
  // escolheu é a que está em `language`.
  const pedida = (i18n.language ?? '').split('-')[0];
  if (!eIdioma(pedida)) return Promise.resolve();
  return carregarIdioma(pedida).then(
    () => i18n.changeLanguage(pedida).then(() => undefined),
    () => undefined,
  );
}

/** A língua activa, já reduzida a uma das suportadas. */
export function idiomaActivo(): Idioma {
  const lingua = (i18n.resolvedLanguage ?? i18n.language ?? '').split('-')[0];
  return eIdioma(lingua) ? lingua : IDIOMA_PADRAO;
}

/**
 * O locale do `Intl` de cada língua, para números e datas. `en-GB` e não `en-US`: dia/mês/
 * ano, como se lê na África Austral — `03/04/2026` é 3 de Abril nas duas línguas.
 */
const LOCALE_INTL: Record<Idioma, string> = { pt: 'pt-MZ', en: 'en-GB', zh: 'zh-CN' };

export function localeIntl(): string {
  return LOCALE_INTL[idiomaActivo()];
}

/**
 * Aplica a língua que veio da sessão (login ou «a minha conta»). `null`/`undefined` —
 * a pessoa nunca escolheu — deixa a língua deste browser como está. Se o catálogo não
 * descarregar, fica na língua actual (a pessoa pode voltar a escolher no selector).
 */
export function aplicarIdiomaGuardado(idioma: string | null | undefined) {
  if (eIdioma(idioma) && idioma !== idiomaActivo()) {
    void mudarIdioma(idioma).catch(() => {});
  }
}

/**
 * O complemento de `aplicarIdiomaGuardado`: quando a conta **nunca** escolheu língua
 * nenhuma (`idioma` nulo), adopta a deste browser como preferência da conta.
 *
 * É o momento em que alguém escolhe inglês como visitante — na landing, no ecrã de
 * login — e entra pela primeira vez. Sem isto, a escolha ficava só neste browser: a
 * mesma conta, aberta noutro aparelho ou depois de limpar o `localStorage`, voltava a
 * mostrar-se em português, e a pessoa tinha de escolher inglês outra vez em cada ecrã
 * novo — exactamente o sintoma que levou a escrever esta função.
 *
 * Silenciosa de propósito: é uma gravação implícita, não um pedido explícito da
 * pessoa — uma falha de rede aqui não pode interromper o login.
 */
export function adoptarIdiomaSeNuncaEscolhido(
  idiomaDaConta: string | null | undefined,
  gravar: (idioma: Idioma) => Promise<unknown>,
) {
  if (idiomaDaConta != null) return; // já escolheu — a conta manda, o browser não a pisa
  void gravar(idiomaActivo()).catch(() => {});
}

// O `lang` da página segue a língua activa: leitores de ecrã e a tradução automática do
// browser lêem-no. O `index.html` dizia `lang="en"` com a interface em português.
// `zh-CN` e não `zh`: é o que faz o browser escolher os glifos simplificados (os mesmos
// caracteres Han desenham-se diferente no chinês, no japonês e no tradicional).
const LANG_DA_PAGINA: Record<Idioma, string> = { pt: 'pt', en: 'en', zh: 'zh-CN' };
const actualizarLangDaPagina = () => {
  // Sem `document` nos testes (Vitest corre em Node).
  if (typeof document !== 'undefined') document.documentElement.lang = LANG_DA_PAGINA[idiomaActivo()];
};
i18n.on('languageChanged', actualizarLangDaPagina);
actualizarLangDaPagina();

export default i18n;
