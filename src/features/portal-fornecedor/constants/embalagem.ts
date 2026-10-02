/**
 * O vocabulário de embalagem e unidade (valor gravado + chave da etiqueta em
 * `portal:unidade.*` e `portal:embalagem.*`), partilhado entre o formulário de um artigo só
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
  { valor: 'kg', chave: 'kg' },
  { valor: 'g', chave: 'g' },
  { valor: 'litro', chave: 'litro' },
  { valor: 'ml', chave: 'ml' },
  { valor: 'unidade', chave: 'unidade' },
  { valor: 'metro', chave: 'metro' },
  { valor: 'm2', chave: 'm2' },
  { valor: 'm3', chave: 'm3' },
  { valor: 'dúzia', chave: 'duzia' },
  { valor: 'par', chave: 'par' },
  { valor: 'rolo', chave: 'rolo' },
  { valor: 'folha', chave: 'folha' },
] as const;

/**
 * Os tipos de embalagem mais comuns, para o primeiro selector.
 *
 * «À unidade» é a opção sem embalagem — o fornecedor vende directamente na unidade base, e
 * os campos de quantidade desaparecem, porque a pergunta deixa de fazer sentido.
 */
export const TIPOS_DE_EMBALAGEM = [
  { valor: '', chave: 'sem_embalagem' },
  { valor: 'caixa', chave: 'caixa' },
  { valor: 'fardo', chave: 'fardo' },
  { valor: 'saco', chave: 'saco' },
  { valor: 'pacote', chave: 'pacote' },
  { valor: 'engradado', chave: 'engradado' },
  { valor: 'palete', chave: 'palete' },
] as const;

export const OUTRA = '__outra__';
