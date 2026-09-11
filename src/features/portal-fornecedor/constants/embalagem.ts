/**
 * O vocabulário de embalagem e unidade, partilhado entre o formulário de um artigo só
 * (`ArtigoFormModal`) e a tabela de revisão da importação em lote (`ImportarCatalogoPage`).
 *
 * Um ficheiro à parte, e não exportado de `ArtigoFormModal`: as duas telas têm de mostrar
 * exactamente as mesmas opções — um fornecedor que crie um artigo a um e outro em lote não
 * deve ver vocabulários diferentes para a mesma pergunta — e um ficheiro de constantes
 * puras também evita o aviso de fast-refresh que exportar constantes de um ficheiro de
 * componente produz.
 */

/**
 * As unidades de medição mais comuns, para o selector.
 *
 * `OUTRA` sai da lista fechada de propósito: um fornecedor que vende em «dúzia» ou «rolo»
 * não pode ficar bloqueado por a unidade dele não estar prevista. A lista cobre o comum —
 * fazer o caso frequente ser um clique — e «Outra» cobre o resto com o texto livre que o
 * campo sempre aceitou.
 */
export const UNIDADES_COMUNS = [
  { valor: 'kg', etiqueta: 'Quilograma (kg)' },
  { valor: 'g', etiqueta: 'Grama (g)' },
  { valor: 'litro', etiqueta: 'Litro (L)' },
  { valor: 'ml', etiqueta: 'Mililitro (ml)' },
  { valor: 'unidade', etiqueta: 'Unidade' },
  { valor: 'metro', etiqueta: 'Metro (m)' },
  { valor: 'm2', etiqueta: 'Metro quadrado (m²)' },
  { valor: 'm3', etiqueta: 'Metro cúbico (m³)' },
  { valor: 'dúzia', etiqueta: 'Dúzia' },
  { valor: 'par', etiqueta: 'Par' },
  { valor: 'rolo', etiqueta: 'Rolo' },
  { valor: 'folha', etiqueta: 'Folha' },
] as const;

/**
 * Os tipos de embalagem mais comuns, para o primeiro selector.
 *
 * «À unidade» é a opção sem embalagem — o fornecedor vende directamente na unidade base, e
 * os campos de quantidade desaparecem, porque a pergunta deixa de fazer sentido.
 */
export const TIPOS_DE_EMBALAGEM = [
  { valor: '', etiqueta: 'À unidade — sem embalagem' },
  { valor: 'caixa', etiqueta: 'Caixa' },
  { valor: 'fardo', etiqueta: 'Fardo' },
  { valor: 'saco', etiqueta: 'Saco' },
  { valor: 'pacote', etiqueta: 'Pacote' },
  { valor: 'engradado', etiqueta: 'Engradado' },
  { valor: 'palete', etiqueta: 'Palete' },
] as const;

export const OUTRA = '__outra__';
