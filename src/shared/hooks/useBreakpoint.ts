import { useEffect, useState } from 'react';

/**
 * Os pontos de corte, alinhados com os do Tailwind e com o que o código já usa.
 *
 * `sm` é onde o `ResponsiveTable` troca a tabela por cartões; `lg` é onde a navegação
 * passa de barra fixa a gaveta (`AppLayout`). Não há breakpoints personalizados no
 * `@theme`, pelo que estes são os valores por omissão do Tailwind v4.
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Responde a «a janela tem pelo menos esta largura?», e **reage** a alterações.
 *
 * ## Porque existe
 *
 * Havia três leituras de `window.innerWidth` no projecto, todas dentro do valor
 * inicial de um estado e nenhuma com listener:
 *
 * ```ts
 * const columnVisibility = { categoria: window.innerWidth >= 640, ... }
 * ```
 *
 * O valor era medido **uma vez**, na primeira renderização. Rodar o telemóvel de
 * retrato para paisagem, ou redimensionar a janela, não recalculava nada: as colunas
 * escondidas ficavam escondidas num ecrã que já tinha espaço, e vice-versa. Num
 * sistema usado sobretudo em telemóvel, rodar o aparelho é o gesto mais comum de
 * todos.
 *
 * Usa `matchMedia` em vez de um listener de `resize`: o browser só notifica quando o
 * limiar é efectivamente cruzado, em vez de a cada pixel arrastado.
 */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  const consulta = `(min-width: ${BREAKPOINTS[breakpoint]}px)`;

  const [corresponde, setCorresponde] = useState(() => {
    // Guarda para renderização no servidor e para ambientes de teste sem `window`
    // (o jsdom do Vitest tem `matchMedia` só a partir de configuração explícita).
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(consulta).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const media = window.matchMedia(consulta);

    // Sincroniza no momento em que o efeito corre: entre a primeira renderização e
    // este ponto a janela pode ter mudado — e no servidor o valor inicial é `false`.
    setCorresponde(media.matches);

    const aoMudar = (evento: MediaQueryListEvent) => setCorresponde(evento.matches);
    media.addEventListener('change', aoMudar);
    return () => media.removeEventListener('change', aoMudar);
  }, [consulta]);

  return corresponde;
}

/**
 * O inverso, para leitura directa: «estamos abaixo deste ponto de corte?».
 *
 * Existe porque `!useBreakpoint('sm')` num JSX lê-se pior do que `useAbaixoDe('sm')`,
 * e a maioria das decisões deste sistema são sobre o caso móvel.
 */
export function useAbaixoDe(breakpoint: Breakpoint): boolean {
  return !useBreakpoint(breakpoint);
}
