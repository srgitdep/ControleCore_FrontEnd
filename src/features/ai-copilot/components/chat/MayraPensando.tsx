import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PassoProgresso } from '../../api/copilot.api';

/** Quanto cada passo fica no ecrã antes de dar lugar ao seguinte, por mais depressa que chegue. */
const MS_POR_PASSO = 900;
/** Quantos passos se vêem de cada vez; os mais antigos saem para a lista não crescer. */
const PASSOS_VISIVEIS = 3;

interface MayraPensandoProps {
  passos: PassoProgresso[];
  /**
   * `balao` (por omissão) é o que se vê no chat: avatar animado e cartão. `cartao` é o
   * mesmo cartão sem avatar — para o ecrã de voz, que já tem a sua própria esfera.
   */
  variante?: 'balao' | 'cartao';
}

/**
 * O que a Mayra está a fazer enquanto não responde — em termos gerais, nunca técnicos:
 * «A consultar dados de stock», «A ler os dados», «A interpretar os resultados».
 *
 * Os passos chegam do servidor como códigos (fase + área) e a frase vem das traduções.
 * Chegam por vezes quase juntos (ler e interpretar acontecem num instante), por isso são
 * mostrados em fila, cada um pelo menos `MS_POR_PASSO` — um passo que pisca e desaparece
 * não diz nada a ninguém.
 *
 * Quando a resposta começa a ser escrita, quem o usa deixa de o renderizar.
 */
export function MayraPensando({ passos, variante = 'balao' }: MayraPensandoProps) {
  const { t } = useTranslation('copiloto');
  const semMovimento = useReducedMotion();

  // Quantos passos já passaram para o ecrã. O primeiro entra logo; os seguintes, um a um.
  const [reveladas, setReveladas] = useState(Math.min(1, passos.length));

  useEffect(() => {
    if (reveladas > passos.length) {
      setReveladas(passos.length);
      return;
    }
    if (reveladas >= passos.length) return;
    const espera = setTimeout(() => setReveladas((n) => n + 1), reveladas === 0 ? 0 : MS_POR_PASSO);
    return () => clearTimeout(espera);
  }, [reveladas, passos.length]);

  const emCurso = passos.slice(0, reveladas);
  const visiveis = emCurso.slice(-PASSOS_VISIVEIS);
  const indiceDoActivo = emCurso.length - 1;
  const primeiroVisivel = emCurso.length - visiveis.length;

  const frase = (passo: PassoProgresso) =>
    passo.fase === 'consultar'
      ? t(`progresso.consultar.${passo.area ?? 'dados'}`)
      : t(`progresso.${passo.fase}`);

  const lista = (
    <ul className="flex flex-col gap-1.5" role="status" aria-live="polite">
      <AnimatePresence initial={false} mode="popLayout">
        {visiveis.map((passo, i) => {
          const indice = primeiroVisivel + i;
          const activo = indice === indiceDoActivo;
          return (
            <motion.li
              key={`${indice}-${passo.fase}-${passo.area ?? ''}`}
              layout={!semMovimento}
              initial={semMovimento ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: activo ? 1 : 0.55, y: 0 }}
              exit={semMovimento ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="flex items-center gap-2 text-sm"
            >
              {activo ? <PontosAtivos parado={!!semMovimento} /> : <Check className="h-3.5 w-3.5 text-emerald-500" />}
              <span
                className={
                  activo && !semMovimento
                    ? 'animate-mayra-brilho bg-[linear-gradient(110deg,#64748b_35%,#6366f1_50%,#64748b_65%)] bg-[length:200%_100%] bg-clip-text text-transparent'
                    : activo
                      ? 'text-indigo-600'
                      : 'text-slate-400'
                }
              >
                {frase(passo)}
              </span>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );

  if (variante === 'cartao') {
    return (
      <div className="min-w-[220px] rounded-2xl border border-slate-100 bg-white p-3.5 text-left shadow-sm">
        {lista}
      </div>
    );
  }

  return (
    <div className="flex max-w-[85%] gap-3">
      <Orbe parado={!!semMovimento} />
      <div className="min-w-[210px] rounded-2xl rounded-tl-sm border border-slate-100 bg-white p-3.5 shadow-sm">
        {lista}
      </div>
    </div>
  );
}

/** O avatar da Mayra enquanto trabalha: um anel de luz que roda à volta da estrela. */
function Orbe({ parado }: { parado: boolean }) {
  return (
    <div className="relative mt-1 h-8 w-8 flex-shrink-0">
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#6366f1,#a78bfa,#38bdf8,#6366f1)]"
        animate={parado ? undefined : { rotate: 360 }}
        transition={{ duration: 2.4, ease: 'linear', repeat: Infinity }}
      />
      <div className="absolute inset-[2px] flex items-center justify-center rounded-full bg-white text-indigo-600">
        <motion.span
          animate={parado ? undefined : { scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.6, ease: 'easeInOut', repeat: Infinity }}
          className="flex"
        >
          <Sparkles className="h-4 w-4" />
        </motion.span>
      </div>
    </div>
  );
}

/** Três pontos em onda, no lugar do visto, no passo em curso. */
function PontosAtivos({ parado }: { parado: boolean }) {
  return (
    <span className="flex h-3.5 w-3.5 items-center justify-center gap-[2px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-[3px] w-[3px] rounded-full bg-indigo-500"
          animate={parado ? undefined : { y: [0, -3, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.9, ease: 'easeInOut', repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}
