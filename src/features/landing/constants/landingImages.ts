import posImg from '@/assets/HeroPages/POS.png';
import dashboardImg from '@/assets/HeroPages/Dashboard.png';
import produtosImg from '@/assets/HeroPages/Produtos.png';
import crmImg from '@/assets/HeroPages/CRM.png';
import auditLogImg from '@/assets/HeroPages/AuditLog.png';
import sessoesCaixaImg from '@/assets/HeroPages/SessoesCaixa.png';

/**
 * As capturas do produto usadas na landing.
 *
 * Separadas do copy de propósito: `shared/constants/copywriting.ts` é um ficheiro
 * de **texto**, e um ficheiro de texto que importa de `@/assets` deixa de o ser —
 * passa a depender do bundler, e quem edita uma frase precisa de saber o que é um
 * `import` de imagem. O copy guarda a chave (`'dashboard'`), este mapa resolve-a.
 *
 * `HeroIMG.avif` — a fotografia de banco do herói anterior — ficou de fora. Era uma
 * imagem genérica com um `alt` que prometia um painel, e as capturas reais do
 * produto estavam aqui ao lado o tempo todo.
 */
export const LANDING_IMAGES = {
  dashboard: dashboardImg,
  pos: posImg,
  produtos: produtosImg,
  crm: crmImg,
  auditLog: auditLogImg,
  sessoesCaixa: sessoesCaixaImg,
} satisfies Record<string, string>;
