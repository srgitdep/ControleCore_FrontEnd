/**
 * A parte «instalável» da aplicação do estafeta (plano §4.5, D6).
 *
 * ## Só nas rotas `/estafeta`
 *
 * O ControlCore, a loja e o portal do fornecedor **não** são PWA e não podem passar a sê-lo por
 * arrasto: um *service worker* de âmbito `/` serviria páginas guardadas ao ERP inteiro. Por isso:
 * - o `<link rel="manifest">` é acrescentado aqui, quando a aplicação do estafeta monta, e retirado
 *   quando sai (o `index.html` não o tem);
 * - o *service worker* regista-se com o âmbito `/estafeta/`, que é tudo o que ele controla.
 *
 * ## O que o *service worker* guarda
 *
 * Só ficheiros da aplicação (`/assets/`, com *hash* no nome) e as páginas `/estafeta` — para abrir
 * depressa e mostrar o casco sem rede. **Nunca a API**: dados de entregas velhos seriam pior do que um
 * aviso «sem ligação». Ver a configuração em `vite.config.ts`.
 */

const MANIFEST = '/estafeta.webmanifest';
const COR = '#2563eb';

/** Liga a PWA do estafeta; devolve a função que a desliga (ao sair das rotas `/estafeta`). */
export function ligarPwaDoEstafeta(): () => void {
  const elementos: HTMLElement[] = [];

  const acrescentar = (tag: 'link' | 'meta', atributos: Record<string, string>) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(atributos)) el.setAttribute(k, v);
    document.head.appendChild(el);
    elementos.push(el);
  };

  acrescentar('link', { rel: 'manifest', href: MANIFEST });
  acrescentar('link', { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' });
  acrescentar('meta', { name: 'theme-color', content: COR });
  // O iOS só trata a página como aplicação (ecrã inteiro) com estas duas.
  acrescentar('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
  acrescentar('meta', { name: 'apple-mobile-web-app-title', content: 'Estafeta' });

  // Só em produção: em desenvolvimento não há `sw.js` e um registo falhado só faz ruído.
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: '/estafeta/' }).catch(() => undefined);
  }

  return () => elementos.forEach((el) => el.remove());
}
