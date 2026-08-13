import {
  BarraDoSitio,
  RodapeDoSitio,
  Heroi,
  FaixaDeContexto,
  OProblema,
  CadeiaViva,
  Modulos,
  AMayra,
  Seguranca,
  ComoComeca,
  Fecho,
} from '@/features/landing';

import '@/features/landing/site.css';

/**
 * A página pública.
 *
 * A ordem das secções não é arbitrária — segue o percurso de quem chega:
 *
 *  1. `Heroi` — a promessa, e a captura do produto a prová-la.
 *  2. `FaixaDeContexto` — o âmbito, em quatro palavras cada.
 *  3. `OProblema` — as quatro dores. Quem não se reconhece aqui, sai daqui.
 *  4. `CadeiaViva` — a tese: sete módulos, um só movimento.
 *  5. `Modulos` — a prova, ecrã a ecrã.
 *  6. `AMayra` — a diferença, com a confirmação antes de escrever à vista.
 *  7. `Seguranca` — a objecção que vem sempre, respondida sem selos inventados.
 *  8. `ComoComeca` — «e quanto tempo até funcionar?».
 *  9. `Fecho` — a acção.
 *
 * A classe `cc-sitio` serve a regra de `prefers-reduced-motion` no `site.css`:
 * limitada a esta árvore, para não desligar as transições do resto da aplicação.
 */
export function LandingPage() {
  return (
    <div className="cc-sitio" style={{ background: '#fff', color: 'var(--tinta)' }}>
      <BarraDoSitio />
      <main>
        <Heroi />
        <FaixaDeContexto />
        <OProblema />
        <CadeiaViva />
        <Modulos />
        <AMayra />
        <Seguranca />
        <ComoComeca />
        <Fecho />
      </main>
      <RodapeDoSitio />
    </div>
  );
}
