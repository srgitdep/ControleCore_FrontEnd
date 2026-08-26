/**
 * Quando é seguro reabrir o microfone.
 *
 * ## Porquê uma regra à parte
 *
 * No modo de recurso, a Mayra fala pelo altifalante e o reconhecimento de voz do browser
 * ouve pelo microfone do mesmo aparelho. Se o microfone estiver aberto enquanto ela fala,
 * transcreve-a — e o texto dela chega ao servidor como se fosse do utilizador. Ela passa
 * a responder às suas próprias frases, e a conversa foge sozinha.
 *
 * Aconteceu em produção. Nos registos do servidor via-se «Está correto ou se deseja que
 * eu procuro por não ter um similar...» a entrar como pergunta do utilizador: uma frase
 * que a Mayra tinha acabado de dizer.
 *
 * A causa era o `onend` do reconhecimento reabrir o microfone incondicionalmente. Como
 * calar o microfone **dispara** `onend`, o próprio acto de a calar reagendava a
 * reabertura 300 ms depois — com ela ainda a falar. Cada condição abaixo corresponde a
 * uma avaria observada, e é por isso que estão todas aqui, num sítio que se pode testar.
 */
export interface EstadoDaEscuta {
  /** Se a aba da voz continua aberta. */
  sessaoActiva: boolean;
  /** Se a sessão está no modo de recurso, o único em que este microfone é usado. */
  emFallback: boolean;
  /** Se a Mayra está a falar neste momento. */
  mayraAFalar: boolean;
  /** Se o socket com o servidor continua ligado. */
  socketLigado: boolean;
}

/**
 * Se o microfone pode voltar a abrir.
 *
 * Todas as condições têm de passar. Uma resposta errada por excesso não dá erro nenhum —
 * a conversa apenas começa a falar sozinha, e demora a perceber-se porquê.
 */
export function podeVoltarAOuvir(estado: EstadoDaEscuta): boolean {
  return (
    estado.sessaoActiva && estado.emFallback && !estado.mayraAFalar && estado.socketLigado
  );
}
