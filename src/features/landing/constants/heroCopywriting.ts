export interface HeroFeature {
  id: string;
  title: string;
  description: string;
  badge: string;
  iconName: 'ShoppingCart' | 'Package' | 'ShieldAlert' | 'Sparkles';
  mockupTitle: string;
  mockupSubtitle: string;
}

export const HERO_COPYWRITING = {
  eyebrow: 'MVP Multi-tenant para Supermercados',
  headline: 'O ERP para supermercados que pensa junto com você.',
  subheadline: 'Simplifique a gestão da sua rede de supermercados com automação inteligente, prevenção de perdas em tempo real e assistente de IA por voz.',
  ctaPrimary: 'Agendar Demonstração',
  ctaSecondary: 'Conhecer Funcionalidades',
  features: [
    {
      id: 'pdv',
      title: 'PDV Ultrarrápido',
      description: 'Faturamento contínuo mesmo offline, leitura instantânea e integração de pagamento.',
      badge: 'Frente de Caixa',
      iconName: 'ShoppingCart',
      mockupTitle: 'PDV 01 - Caixa Preferencial',
      mockupSubtitle: '32 itens registrados • Leitura média: 0.8s • Emissão NFC-e em andamento',
    },
    {
      id: 'estoque',
      title: 'Estoque Anti-Ruptura',
      description: 'Previsão de demanda via IA para evitar gôndolas vazias e perdas de validade.',
      badge: 'Inteligência',
      iconName: 'Package',
      mockupTitle: 'Previsão de Compras e Estoque',
      mockupSubtitle: '4 alertas de reposição prioritária • Prevenção de desperdício',
    },
    {
      id: 'auditoria',
      title: 'Auditoria Anti-Fraude',
      description: 'Monitoramento em tempo real de cancelamentos, descontos e divergências de inventário.',
      badge: 'Segurança',
      iconName: 'ShieldAlert',
      mockupTitle: 'Painel de Prevenção de Perdas',
      mockupSubtitle: 'Detecção automática de anomalias em caixas e sangrias',
    },
    {
      id: 'copiloto',
      title: 'Copiloto Mayra AI',
      description: 'Assistente de voz e texto que analisa dados operacionais e responde instantaneamente.',
      badge: 'Mayra Voice',
      iconName: 'Sparkles',
      mockupTitle: 'Copiloto de IA em Tempo Real',
      mockupSubtitle: '"Mayra, qual foi o faturamento total da Loja 02 nas últimas 4 horas?"',
    },
  ] as HeroFeature[],
};
