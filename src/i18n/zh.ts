/**
 * O catálogo em mandarim, num módulo à parte para o Vite o pôr num chunk próprio.
 *
 * `i18n/index.ts` importa-o por `import()` só quando alguém usa `zh` (a escolha no selector,
 * a da conta, ou um browser em chinês). Importá-lo estaticamente daria ~300 KB de JSON a
 * todos os utilizadores, incluindo os que nunca o vão ler. O `glob` com `eager` dentro
 * deste módulo junta os namespaces todos num só chunk — um pedido, e não quarenta —, e um
 * namespace novo em `locales/zh/` entra sozinho.
 */
const ficheiros = import.meta.glob<Record<string, unknown>>('../locales/zh/*.json', {
  eager: true,
  import: 'default',
});

const catalogos: Record<string, Record<string, unknown>> = {};
for (const [caminho, conteudo] of Object.entries(ficheiros)) {
  const namespace = caminho.match(/\/([^/]+)\.json$/)![1];
  catalogos[namespace] = conteudo;
}

export default catalogos;
