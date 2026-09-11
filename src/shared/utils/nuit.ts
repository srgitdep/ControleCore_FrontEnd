/**
 * O NUIT, do lado do browser.
 *
 * ## Uma segunda implementação, e a razão de ser aceitável
 *
 * A autoridade é `src/modules/fornecedor/domain/nuit.ts` no backend: é ele que recusa o
 * pedido, e é a única verificação que conta. Esta cópia não substitui nada — serve para o
 * utilizador ver o engano **enquanto escreve**, em vez de submeter o formulário, esperar
 * pela ida e volta, e receber um aviso que tapa o ecrã.
 *
 * Duplicar uma regra é normalmente um erro, e aqui é um compromisso consciente com duas
 * salvaguardas: a regra é uma contagem de dígitos (não há aritmética que possa divergir em
 * silêncio), e as mensagens são deliberadamente as mesmas do backend, palavra por palavra —
 * quem as mudar num lado vê o teste do outro falhar.
 *
 * O que **não** está aqui: a verificação de duplicados. Essa depende da base de dados, e
 * tentar antecipá-la no browser daria uma resposta errada sempre que dois registos
 * acontecessem ao mesmo tempo.
 */

/** Quantos dígitos tem um NUIT moçambicano. */
export const DIGITOS_DO_NUIT = 9;

/**
 * Reduz um NUIT à sua forma comparável: só dígitos.
 *
 * Aceita o prefixo do país colado («MZ400123456») porque as letras caem na filtragem, e os
 * separadores que cada pessoa escreve à sua maneira.
 */
export function normalizarNuit(nuit: string | null | undefined): string | null {
  if (!nuit) return null;
  const digitos = nuit.replace(/\D/g, '');
  return digitos.length > 0 ? digitos : null;
}

/**
 * O que está errado com um NUIT, ou `null` quando está bem.
 *
 * As mensagens são as do backend, para o utilizador não ler duas redacções diferentes do
 * mesmo problema — uma ao escrever e outra ao submeter.
 */
export function diagnosticarNuit(nuit: string | null | undefined): string | null {
  const digitos = normalizarNuit(nuit);

  if (digitos === null) {
    return `O NUIT é obrigatório e tem ${DIGITOS_DO_NUIT} dígitos.`;
  }

  if (digitos.length === DIGITOS_DO_NUIT) return null;

  const excesso = digitos.length - DIGITOS_DO_NUIT;

  return excesso > 0
    ? `O NUIT tem ${DIGITOS_DO_NUIT} dígitos e escreveu ${digitos.length} — ` +
        `${excesso} a mais. Confirme o número no cartão de contribuinte.`
    : `O NUIT tem ${DIGITOS_DO_NUIT} dígitos e escreveu ${digitos.length} — ` +
        `faltam ${-excesso}. Confirme o número no cartão de contribuinte.`;
}

/**
 * O aviso a mostrar **enquanto** se escreve.
 *
 * Difere de `diagnosticarNuit` num ponto que decide se o formulário ajuda ou irrita: um
 * campo ainda incompleto não é um erro. Quem escreveu quatro dígitos de nove está a meio,
 * e pintar o campo de vermelho ao quarto dígito acusa a pessoa de um engano que ela ainda
 * não cometeu.
 *
 * Por isso só assinala quando **passou** dos nove — que é sempre um erro, e o caso do
 * utilizador que escreveu treze. O que falta é dito na submissão, quando escrever acabou.
 */
export function avisoDeNuitAoEscrever(nuit: string): string | null {
  const digitos = normalizarNuit(nuit);
  if (digitos === null || digitos.length <= DIGITOS_DO_NUIT) return null;
  return diagnosticarNuit(nuit);
}

/**
 * Formata um NUIT para leitura: «400123456» → «400 123 456».
 *
 * Só agrupa quando são mesmo nove dígitos: inventar um agrupamento a um número de outro
 * comprimento fá-lo-ia parecer mais correcto do que é.
 */
export function formatarNuit(nuit: string | null | undefined): string | null {
  const n = normalizarNuit(nuit);
  if (n === null) return null;
  if (n.length !== DIGITOS_DO_NUIT) return n;
  return `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
}
