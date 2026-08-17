/**
 * A largura que a Mayra ocupa, e a margem que o resto do ecrã lhe cede.
 *
 * ## Porquê num sítio só
 *
 * Três componentes precisam de concordar sobre esta largura: o painel da Mayra, que a
 * ocupa; a área de conteúdo, que encolhe; e o cabeçalho, que é `fixed` e por isso não
 * herda a margem do contentor. Se cada um escrevesse o seu valor, bastava mudar um para o
 * painel deixar de coincidir com o espaço reservado — e o sintoma seria uma faixa branca,
 * ou conteúdo outra vez tapado.
 *
 * ## As classes estão escritas por extenso, de propósito
 *
 * O Tailwind procura classes no código-fonte como **texto**, antes de o correr. Uma classe
 * construída — `` `md:mr-[${largura}]` `` — nunca aparece literalmente em ficheiro nenhum,
 * pelo que o CSS correspondente não seria gerado e o estilo não existiria em produção.
 *
 * Daí o `switch` devolver cadeias completas em vez de as montar. É mais repetitivo de ler
 * e é a única forma que o varrimento reconhece.
 *
 * (Ao verificar isto no CSS compilado, note-se que o Tailwind escapa os nomes:
 * `md:mr-[min(920px,75vw)]` aparece como `md\:mr-\[min\(920px\,75vw\)\]`, com a vírgula
 * também escapada. Um `grep` pelo nome tal como escrito aqui não encontra nada, o que
 * parece indicar ausência quando a classe está lá.)
 *
 * ## Só a partir de `md`
 *
 * Abaixo de `md` a Mayra ocupa o ecrã inteiro, como o ChatGPT ou o Claude no telemóvel:
 * num ecrã de 375 px não há como pôr um painel de 380 px ao lado de alguma coisa.
 * Reservar-lhe margem aí deixaria o conteúdo sem largura nenhuma.
 *
 * Os limites em `vw` acompanham as larguras: num portátil de 1280 px, 920 px de Mayra
 * deixariam 360 px de conteúdo — menos do que num telemóvel.
 */

/** O estado da Mayra que determina a largura. */
export interface EstadoDaMayra {
  isOpen: boolean;
  isExpanded: boolean;
  isHistoryOpen: boolean;
}

/** Qual dos três tamanhos se aplica ao estado actual. */
function tamanho(estado: EstadoDaMayra): 'expandida' | 'comHistorico' | 'normal' {
  if (estado.isExpanded) return 'expandida';
  if (estado.isHistoryOpen) return 'comHistorico';
  return 'normal';
}

/** A classe de largura do próprio painel da Mayra. */
export function classeLarguraDaMayra(estado: EstadoDaMayra): string {
  switch (tamanho(estado)) {
    case 'expandida':
      return 'md:w-[min(920px,75vw)]';
    case 'comHistorico':
      return 'md:w-[min(660px,60vw)]';
    default:
      return 'md:w-[380px]';
  }
}

/**
 * A classe de margem que o conteúdo e o cabeçalho cedem à Mayra.
 *
 * Vazia quando a Mayra está fechada — não há nada a reservar.
 */
export function classeMargemDaMayra(estado: EstadoDaMayra): string {
  if (!estado.isOpen) return '';

  switch (tamanho(estado)) {
    case 'expandida':
      return 'md:mr-[min(920px,75vw)]';
    case 'comHistorico':
      return 'md:mr-[min(660px,60vw)]';
    default:
      return 'md:mr-[380px]';
  }
}
