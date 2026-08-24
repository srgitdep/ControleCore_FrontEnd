import { motion } from 'framer-motion';
import type { VoiceState } from '../../hooks/useGeminiVoice';

/**
 * A esfera que representa o estado da conversa por voz.
 *
 * ## Porque não tem ícone dentro
 *
 * Tinha: um microfone a ouvir, um altifalante a responder, e uma **chave de fendas**
 * enquanto consultava o sistema. A chave era o pior — um símbolo de oficina no meio de uma
 * conversa, que dizia «estou a mexer nas engrenagens» a quem só queria saber se estava a
 * ser ouvido.
 *
 * O estado passa a ler-se pelo **movimento**, que é o que a esfera já fazia em segundo
 * plano: parada e a respirar quando ouve, agitada quando responde, a girar devagar quando
 * consulta. Um ícone por cima disso era informação repetida a tapar a animação.
 *
 * ## O movimento
 *
 * `borderRadius` animado em quatro valores assimétricos é o que dá a sensação de fluido:
 * a forma deixa de ser um círculo e ondula. Não é uma imagem nem um vídeo — são duas
 * camadas de gradiente com `blur`, o que custa pouco e adapta-se a qualquer tamanho.
 *
 * As cores são as do sistema (azul), não o violeta da referência.
 */

/** Formas por que a esfera passa. Assimétricas de propósito — um círculo não ondula. */
const FORMAS_FLUIDAS = [
  '42% 58% 61% 39% / 45% 42% 58% 55%',
  '58% 42% 39% 61% / 55% 58% 42% 45%',
  '39% 61% 55% 45% / 58% 45% 55% 42%',
  '42% 58% 61% 39% / 45% 42% 58% 55%',
];

/** Como a esfera se move em cada estado. */
function movimentoPara(estado: VoiceState) {
  switch (estado) {
    case 'LISTENING':
      // A ouvir: quase parada, a respirar. O utilizador está a falar — a esfera não deve
      // roubar-lhe a atenção.
      return {
        animacao: { scale: [1, 1.04, 1], borderRadius: FORMAS_FLUIDAS.slice(0, 2) },
        duracao: 2.4,
      };

    case 'SPEAKING':
      // A responder: ondula com força, como uma voz tem cadência.
      return {
        animacao: {
          scale: [1, 1.08, 0.98, 1.06, 1],
          borderRadius: FORMAS_FLUIDAS,
          rotate: [0, 8, -6, 4, 0],
        },
        duracao: 3.2,
      };

    case 'EXECUTING_TOOL':
      // A consultar o sistema: rotação lenta e contínua. Diz «estou a trabalhar» sem
      // precisar de uma chave de fendas a dizê-lo.
      return {
        animacao: { rotate: [0, 360], scale: [1, 1.02, 1], borderRadius: FORMAS_FLUIDAS },
        duracao: 6,
      };

    case 'CONNECTING':
      return { animacao: { scale: [0.94, 1.02, 0.94], opacity: [0.7, 1, 0.7] }, duracao: 1.6 };

    case 'ERROR':
      // Parada: um erro não deve parecer actividade.
      return { animacao: { scale: 1 }, duracao: 0.4 };

    default:
      return { animacao: { scale: [1, 1.02, 1] }, duracao: 4 };
  }
}

/** As cores de cada estado, na paleta do sistema. */
function coresPara(estado: VoiceState) {
  switch (estado) {
    case 'LISTENING':
      return { de: '#2563eb', para: '#22d3ee', halo: 'rgba(37,99,235,0.35)' };
    case 'SPEAKING':
      return { de: '#1d4ed8', para: '#818cf8', halo: 'rgba(29,78,216,0.45)' };
    case 'EXECUTING_TOOL':
      return { de: '#0ea5e9', para: '#3b82f6', halo: 'rgba(14,165,233,0.35)' };
    case 'ERROR':
      return { de: '#dc2626', para: '#f87171', halo: 'rgba(220,38,38,0.3)' };
    default:
      return { de: '#64748b', para: '#94a3b8', halo: 'rgba(100,116,139,0.2)' };
  }
}

export function OrbeFluida({ estado, tamanho = 132 }: { estado: VoiceState; tamanho?: number }) {
  const { animacao, duracao } = movimentoPara(estado);
  const cores = coresPara(estado);

  return (
    <div className="relative flex items-center justify-center" style={{ width: tamanho, height: tamanho }}>
      {/* Halo: uma segunda camada desfocada, maior e mais lenta. É o que dá profundidade —
          sem ela a esfera parece um autocolante. */}
      <motion.div
        aria-hidden
        animate={{ scale: estado === 'ERROR' ? 1 : [1, 1.18, 1], opacity: [0.5, 0.75, 0.5] }}
        transition={{ duration: duracao * 1.4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full blur-2xl"
        style={{ background: `radial-gradient(circle, ${cores.halo} 0%, transparent 70%)` }}
      />

      {/* O corpo da esfera. */}
      <motion.div
        animate={animacao}
        transition={{ duration: duracao, repeat: estado === 'ERROR' ? 0 : Infinity, ease: 'easeInOut' }}
        className="relative overflow-hidden"
        style={{
          width: tamanho * 0.74,
          height: tamanho * 0.74,
          background: `linear-gradient(135deg, ${cores.de} 0%, ${cores.para} 100%)`,
          boxShadow: `0 12px 40px ${cores.halo}`,
          borderRadius: '50%',
        }}
      >
        {/* Brilho deslocado do centro: sugere uma superfície curva com luz de cima, o que
            faz a forma ler-se como volume e não como uma mancha de cor. */}
        <div
          className="absolute rounded-full blur-md"
          style={{
            top: '12%',
            left: '18%',
            width: '42%',
            height: '34%',
            background: 'rgba(255,255,255,0.55)',
          }}
        />

        {/* Reflexo interior lento, para a superfície não parecer estática. */}
        <motion.div
          aria-hidden
          animate={{ x: ['-30%', '40%', '-30%'], y: ['20%', '-10%', '20%'], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: duracao * 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full blur-lg"
          style={{ background: 'rgba(255,255,255,0.4)' }}
        />
      </motion.div>
    </div>
  );
}
