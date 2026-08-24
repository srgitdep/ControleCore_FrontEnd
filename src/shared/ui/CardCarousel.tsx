import { Children, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/shared/utils';
import { useBreakpoint } from '@/shared/hooks';

/**
 * Cartões que se deslizam na horizontal, com pontos de posição.
 *
 * ## Porque existe
 *
 * As grelhas de indicadores empilhavam num telemóvel: `grid-cols-1 md:grid-cols-2
 * lg:grid-cols-4` põe quatro cartões um debaixo do outro em `<md`, e cada um mede
 * cerca de 130px. São 520px de altura antes de o conteúdo do ecrã começar — o gráfico
 * de vendas e as tabelas ficavam a dois ecrãs de distância do topo.
 *
 * Na horizontal, os quatro ocupam a altura de um e a navegação é o gesto que já se usa
 * em qualquer aplicação de telefone.
 *
 * ## Deslocamento nativo, não arrastar simulado
 *
 * Usa `overflow-x-auto` com `scroll-snap`, e não `framer-motion` com gesto de arrastar.
 * Três razões: funciona com o dedo, com a roda do rato e com as setas do teclado sem
 * código adicional; respeita a velocidade de deslize do sistema operativo, que difere
 * entre iOS e Android; e não intercepta o gesto vertical — arrastar na diagonal continua
 * a deslocar a página, o que um `drag` do framer-motion quebraria.
 *
 * ## Em ecrã largo desaparece
 *
 * A partir de `lg` volta a ser uma grelha: num monitor os quatro cartões cabem lado a
 * lado, e esconder três atrás de um gesto seria esconder informação que já estava
 * visível. É a mesma decisão em ambos os sentidos — mostrar o que cabe.
 */

interface CardCarouselProps {
  children: React.ReactNode;
  /** Rótulo do grupo, para leitores de ecrã. */
  label: string;
  /**
   * Colunas na grelha a partir de `lg`. Com 3 indicadores, quatro colunas deixariam
   * uma lacuna.
   */
  colunas?: 2 | 3 | 4;
  className?: string;
}

export function CardCarousel({ children, label, colunas = 4, className }: CardCarouselProps) {
  const slides = Children.toArray(children).filter(Boolean);
  const pista = useRef<HTMLDivElement>(null);
  const [activo, setActivo] = useState(0);

  const emEcraLargo = useBreakpoint('lg');

  /**
   * Qual o cartão mais próximo do início da área visível.
   *
   * Calculado a partir da posição de deslocamento e não com um `IntersectionObserver`:
   * com `snap-center`, dois cartões podem estar simultaneamente visíveis e o observador
   * dispararia para ambos, fazendo os pontos oscilar durante o gesto.
   */
  const actualizarActivo = useCallback(() => {
    const el = pista.current;
    if (!el || slides.length === 0) return;

    const larguraDeUm = el.scrollWidth / slides.length;
    if (larguraDeUm <= 0) return;

    const indice = Math.round(el.scrollLeft / larguraDeUm);
    setActivo(Math.min(Math.max(indice, 0), slides.length - 1));
  }, [slides.length]);

  useEffect(() => {
    const el = pista.current;
    if (!el || emEcraLargo) return;

    // `passive` porque o handler não cancela o gesto: sem isto, o browser não pode
    // optimizar o deslize e nota-se em telemóveis mais lentos.
    el.addEventListener('scroll', actualizarActivo, { passive: true });
    return () => el.removeEventListener('scroll', actualizarActivo);
  }, [actualizarActivo, emEcraLargo]);

  const irPara = (indice: number) => {
    const el = pista.current;
    if (!el) return;

    // `scroll-behavior: smooth` está definido em `html, body` no `index.css` e é
    // herdado, pelo que a animação vem sem configuração adicional.
    el.scrollTo({ left: (el.scrollWidth / slides.length) * indice });
    setActivo(indice);
  };

  // ── Grelha, em ecrã largo ──────────────────────────────────────────────────
  if (emEcraLargo) {
    return (
      <div
        className={cn(
          'grid gap-4',
          colunas === 2 && 'grid-cols-2',
          colunas === 3 && 'grid-cols-3',
          colunas === 4 && 'grid-cols-4',
          className,
        )}
      >
        {children}
      </div>
    );
  }

  // Um cartão só não é um carrossel: os pontos e o deslize não teriam para onde ir.
  if (slides.length <= 1) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      <div
        ref={pista}
        role="group"
        aria-label={label}
        className={cn(
          'flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1',
          // A barra é escondida porque os pontos já dizem a posição — e uma barra
          // debaixo de quatro cartões é ruído. A classe está definida no `index.css`.
          'hide-scrollbar',
          // `-mx-4 px-4` deixa o primeiro e o último cartão alinhados com o resto da
          // página, mas permite que o deslize chegue à margem: sem isto, o último
          // cartão encosta ao bordo do ecrã e parece cortado.
          '-mx-4 px-4 sm:-mx-6 sm:px-6',
        )}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            // `basis` a 78% em telemóvel deixa o cartão seguinte meio visível — é o que
            // indica que há mais para o lado, antes de o utilizador ver os pontos.
            className="min-w-0 shrink-0 grow-0 basis-[78%] snap-start sm:basis-[45%]"
          >
            {slide}
          </div>
        ))}
      </div>

      {/* ── Os pontos ─────────────────────────────────────────────────────────
          São botões e não `<span>`: além de indicarem a posição, levam até ao cartão.
          Numa lista de quatro, tocar no último é mais rápido do que deslizar três vezes. */}
      <div className="mt-3 flex items-center justify-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => irPara(i)}
            aria-label={`Ir para o cartão ${i + 1} de ${slides.length}`}
            aria-current={i === activo}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
              i === activo ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-300 hover:bg-slate-400',
            )}
          />
        ))}
      </div>
    </div>
  );
}
