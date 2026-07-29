import heroImg from '@/assets/HeroPages/HeroIMG.avif';
import posImg from '@/assets/HeroPages/POS.png';
import dashboardImg from '@/assets/HeroPages/Dashboard.png';
import produtosImg from '@/assets/HeroPages/Produtos.png';
import crmImg from '@/assets/HeroPages/CRM.png';
import auditLogImg from '@/assets/HeroPages/AuditLog.png';
import sessoesCaixaImg from '@/assets/HeroPages/SessoesCaixa.png';

export const LANDING_IMAGES = {
  hero: heroImg,
  pos: posImg,
  dashboard: dashboardImg,
  produtos: produtosImg,
  crm: crmImg,
  auditLog: auditLogImg,
  sessoesCaixa: sessoesCaixaImg,
};

export const LANDING_COPYWRITING = {
  header: {
    brandName: 'ControlCore',
    brandSubtitle: 'Supermercados',
    navLinks: [
      { label: 'Produtos', href: '#produtos' },
      { label: 'Soluções', href: '#solucoes' },
      { label: 'Recursos', href: '#recursos' },
      { label: 'Preços', href: '#precos' },
    ],
    loginBtn: 'Entrar',
    ctaBtn: 'Agendar Demonstração',
  },

  heroSection: {
    headline: 'O ERP inteligente que impulsiona suas operações.',
    description: 'O ControlCore facilita a gestão da sua rede de supermercados: PDV ultrarrápido, inventário automatizado, inteligência anti-ruptura e IA integrada. Em minutos, sem complicação.',
    ctaPrimary: 'Testar ControlCore grátis',
    ctaSecondary: 'Agendar demonstração',
    heroImage: heroImg,
    floatingCard: {
      orderId: 'Pedido #904',
      date: '18 JAN, 2026',
      amount: 'R$ 2.490,00',
      btnEdit: 'Editar',
      btnShare: 'Compartilhar fatura',
    },
    bottomOverlayText: 'Gerencie os seus pedidos com o ControlCore',
  },

  platformFeatures: {
    eyebrow: 'A PLATAFORMA',
    title: 'O sistema central para a sua rede de supermercados rodar',
    ctaExplore: 'Explorar o ControlCore',
    tabs: [
      {
        id: 'workspace',
        title: 'Painel Geral & KPIs',
        description: 'Acompanhe vendas por loja, margem bruta, giro de estoque e faturamento em tempo real.',
        image: dashboardImg,
        icon: 'BarChart3',
      },
      {
        id: 'pos',
        title: 'Frente de Caixa & PDV',
        description: 'Faturamento de alta velocidade, contingência offline automática e emissão fiscal NFC-e em segundos.',
        image: posImg,
        icon: 'ShoppingCart',
      },
      {
        id: 'stock',
        title: 'Catálogo de Produtos & Estoque',
        description: 'Controle de lotes, datas de validade, contagem de inventário por ciclo e alerta de ruptura.',
        image: produtosImg,
        icon: 'Package',
      },
      {
        id: 'crm',
        title: 'CRM & Fidelização de Clientes',
        description: 'Gestão de limites de crédito, histórico de compras por cliente e programas de recompensa.',
        image: crmImg,
        icon: 'Users',
      },
      {
        id: 'audit',
        title: 'Auditoria & Prevenção de Perdas',
        description: 'Rastreamento de sangrias, cancelamentos de itens e relatórios detalhados por operador de caixa.',
        image: auditLogImg,
        icon: 'ShieldCheck',
      },
    ],
  },

  customSolutions: {
    eyebrow: 'SOLUÇÕES OPERACIONAIS',
    title: 'Crie fluxos operacionais que se encaixam perfeitamente',
    ctaLearnMore: 'Saber mais',
    cards: [
      {
        id: 'card-1',
        title: 'Hora de abandonar as planilhas manuais',
        description: 'Capacite suas equipes de loja com um software moderno, produtivo e fácil de usar. Mais resultados em menos tempo.',
        image: produtosImg,
        requestWidget: {
          badge: 'SOLICITAÇÃO',
          title: 'Atualização de Estoque',
          account: 'Loja 01 - Centro',
          priority: 'Alta',
          assigned: 'Carlos Silva',
          btnApprove: 'Aprovar',
        },
      },
      {
        id: 'card-2',
        title: 'Software que enxerga o seu supermercado como você',
        description: 'Gerencie aplicações operacionais com modelo de dados flexível e interface totalmente configurável para sua operação.',
        image: crmImg,
        statsPills: [
          { label: 'Clientes Ativos', count: '2.490', status: 'DISPONÍVEIS' },
          { label: 'Pedidos PDV', count: '11.559', status: 'CONCLUÍDOS' },
          { label: 'Entregas', count: '11.224', status: 'ENVIADOS' },
        ],
      },
    ],
  },

  enterpriseBanner: {
    eyebrow: 'SEGURANÇA & ESCALA',
    title: 'Pronto para escala empresarial',
    subtitle: 'O ControlCore é auditado e cumpre os mais rigorosos padrões de conformidade da indústria.',
    complianceBadges: [
      { label: 'GDPR / LGPD', sub: 'PRONTO' },
      { label: 'ISO 27001', sub: 'CERTIFICADO' },
      { label: 'SOC 2 TYPE II', sub: 'CONFORME' },
      { label: 'CRIPTOGRAFIA 256-BIT', sub: 'ATIVO' },
    ],
    bannerTitle: 'Gerencie a sua rede com total controle, segurança e transparência',
    backgroundImage: heroImg,
    ctaPrimary: 'Testar ControlCore grátis',
    ctaSecondary: 'Agendar demonstração',
  },

  footer: {
    brandName: 'ControlCore',
    tagline: 'O ERP definitivo para supermercados e redes varejistas.',
    columns: [
      {
        title: 'Empresa',
        links: [
          { label: 'Sobre nós', href: '#' },
          { label: 'Carreiras', href: '#' },
          { label: 'Política de privacidade', href: '#' },
          { label: 'Política de cookies', href: '#' },
        ],
      },
      {
        title: 'Central de conhecimento',
        links: [
          { label: 'Blog', href: '#' },
          { label: 'Central de ajuda', href: '#' },
          { label: 'Status do sistema', href: '#' },
          { label: 'Especialistas', href: '#' },
          { label: 'Fórum da comunidade', href: '#' },
        ],
      },
      {
        title: 'Soluções',
        links: [
          { label: 'Frente de Caixa (PDV)', href: '#' },
          { label: 'Gestão de Estoque', href: '#' },
          { label: 'CRM & Fidelização', href: '#' },
          { label: 'Auditoria & Segurança', href: '#' },
          { label: 'Copiloto de IA Mayra', href: '#' },
        ],
      },
    ],
    copyright: '© 2026 ControlCore Inc. Todos os direitos reservados.',
  },
};
