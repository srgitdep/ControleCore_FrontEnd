import 'i18next';
import type comum from '../locales/pt/comum.json';

// As chaves do `t()` passam a ser verificadas pelo `tsc` contra o catálogo português, que
// é a língua de origem: uma chave mal escrita é erro de compilação, e não um texto em
// falta que só se vê no ecrã. Cada namespace novo entra aqui.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'comum';
    resources: {
      comum: typeof comum;
    };
  }
}
