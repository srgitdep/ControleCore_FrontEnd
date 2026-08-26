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

// ── Interromper a Mayra a meio ───────────────────────────────────────────────

/**
 * Quão alto tem de estar o microfone para contar como alguém a falar.
 *
 * Medido em RMS do bloco de áudio. Baixo demais e o próprio altifalante da Mayra
 * interrompe-a; alto demais e é preciso gritar para lhe cortar a palavra.
 */
export const RMS_DE_FALA = 0.08;

/**
 * Quantos blocos seguidos acima do limiar antes de a interromper.
 *
 * Cada bloco é de 2048 amostras a 16 kHz — 128 ms. Dois blocos dão ~256 ms de som
 * contínuo, o que distingue uma pessoa a começar a falar de uma porta a bater ou de um
 * resto de eco que o cancelamento não apanhou. Exigir um só bloco tornava a Mayra
 * impossível de ouvir numa sala com ruído.
 */
export const BLOCOS_PARA_INTERROMPER = 2;

/** O RMS de um bloco de áudio: a medida de quão alto ele está. */
export function calcularRms(amostras: Float32Array | number[]): number {
  let soma = 0;
  for (let i = 0; i < amostras.length; i++) soma += amostras[i] * amostras[i];
  return Math.sqrt(soma / amostras.length);
}

/**
 * Actualiza a contagem de blocos consecutivos com fala.
 *
 * Um bloco silencioso põe a contagem a zero: o que interessa é som **contínuo**, e não
 * o total acumulado ao longo de uma frase inteira dela.
 */
export function contarBlocoDeFala(rms: number, blocosAnteriores: number): number {
  return rms > RMS_DE_FALA ? blocosAnteriores + 1 : 0;
}

/**
 * Se é altura de a calar e passar a ouvir.
 *
 * Só faz sentido enquanto ela fala: fora disso o microfone já está a ser ouvido, e
 * «interromper» não significaria nada.
 */
export function deveInterromper(mayraAFalar: boolean, blocosConsecutivos: number): boolean {
  return mayraAFalar && blocosConsecutivos >= BLOCOS_PARA_INTERROMPER;
}
