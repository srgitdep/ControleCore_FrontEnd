/**
 * Os dados do preçário público.
 *
 * Em código e não vindos da API, de propósito: a página de preços é pública e
 * tem de pintar sem depender do servidor — um pedido à API antes de mostrar o
 * preço falha exactamente quando o servidor está em baixo, que é quando mais
 * interessa parecer uma empresa a funcionar. É a mesma decisão do catálogo
 * `/modulos` (preço por módulo, administrado em `features/modulos`): aqui os
 * três escalões agrupam esses módulos numa oferta que se vende, não o CRUD
 * interno de plataforma.
 */

export type Escalao = 'loja' | 'rede' | 'enterprise';

export interface Plano {
  codigo: Escalao;
  nome: string;
  frase: string;
  ambito: string;
  mensal: number;
  anual: number;
  lojas: number;
  utilizadores: number;
  destacado?: boolean;
  limites: { etiqueta: string; valor: string }[];
}

/** O anual é dez vezes o mensal — dois meses grátis, igual à convenção do sector. */
export const PLANOS: Plano[] = [
  {
    codigo: 'loja',
    nome: 'Loja',
    frase: 'Sei o que vendi hoje, com que stock e com que caixa certa.',
    ambito: 'Uma loja, um armazém. O ponto de venda e o essencial à sua volta.',
    mensal: 6_500,
    anual: 65_000,
    lojas: 1,
    utilizadores: 5,
    limites: [
      { etiqueta: 'Lojas incluídas', valor: '1' },
      { etiqueta: 'Utilizadores incluídos', valor: '5' },
      { etiqueta: 'Armazéns', valor: '1' },
      { etiqueta: 'Perguntas à Mayra', valor: '500 / mês' },
      { etiqueta: 'Histórico consultável', valor: '1 ano' },
    ],
  },
  {
    codigo: 'rede',
    nome: 'Rede',
    frase: 'Sei o que se passa em cada loja, sem pedir o relatório a ninguém.',
    ambito: 'Várias lojas e armazéns. Transferências, compras e crédito a clientes.',
    mensal: 14_900,
    anual: 149_000,
    lojas: 5,
    utilizadores: 20,
    // O do meio é o que responde à maioria dos casos, e dizê-lo poupa tempo a
    // quem lê. Não é manipulação: é informação.
    destacado: true,
    limites: [
      { etiqueta: 'Lojas incluídas', valor: '5' },
      { etiqueta: 'Utilizadores incluídos', valor: '20' },
      { etiqueta: 'Armazéns', valor: 'sem limite' },
      { etiqueta: 'Perguntas à Mayra', valor: '4 000 / mês' },
      { etiqueta: 'Histórico consultável', valor: '3 anos' },
    ],
  },
  {
    codigo: 'enterprise',
    nome: 'Enterprise',
    frase: 'Sei quanto custou de verdade e se cada loja está a dar lucro.',
    ambito: 'A rede inteira. Financeiro, recursos humanos e o mercado de fornecedores.',
    mensal: 32_900,
    anual: 329_000,
    lojas: Infinity,
    utilizadores: 60,
    limites: [
      { etiqueta: 'Lojas incluídas', valor: 'sem limite' },
      { etiqueta: 'Utilizadores incluídos', valor: '60' },
      { etiqueta: 'Armazéns', valor: 'sem limite' },
      { etiqueta: 'Perguntas à Mayra', valor: '15 000 / mês' },
      { etiqueta: 'Histórico consultável', valor: '7 anos' },
    ],
  },
];

/** Desce com o volume: o custo marginal do 40.º utilizador é menor do que o do 10.º. */
export const ESCALOES_UTILIZADOR = [
  { ate: 15, preco: 420 },
  { ate: 40, preco: 340 },
  { ate: Infinity, preco: 260 },
];

export function precoPorUtilizadorExtra(total: number): number {
  return ESCALOES_UTILIZADOR.find((e) => total <= e.ate)?.preco ?? 260;
}

// ── As capacidades, por módulo ──────────────────────────────────────────────
//
// Completa e honesta: uma tabela que só mostra o que está incluído esconde o
// que falta, e o cliente descobre depois de pagar — a forma mais cara de o
// perder.

export interface Capacidade {
  nome: string;
  loja: boolean;
  rede: boolean;
  enterprise: boolean;
  /** Destaca as que decidem uma subida de escalão. */
  chave?: boolean;
}

export interface ModuloDoPrecario {
  codigo: string;
  nome: string;
  familia: string;
  capacidades: Capacidade[];
}

const T = true;
const F = false;

export const MODULOS: ModuloDoPrecario[] = [
  {
    codigo: 'caixa', nome: 'Frente de caixa', familia: 'Loja',
    capacidades: [
      { nome: 'Venda por código de barras ou pesquisa', loja: T, rede: T, enterprise: T },
      { nome: 'Vários meios de pagamento na mesma venda', loja: T, rede: T, enterprise: T },
      { nome: 'Recibo com numeração sequencial', loja: T, rede: T, enterprise: T },
      { nome: 'Sessão de caixa com abertura e fecho conferidos', loja: T, rede: T, enterprise: T },
      { nome: 'Histórico de sessões entre lojas', loja: F, rede: T, enterprise: T },
    ],
  },
  {
    codigo: 'catalogo', nome: 'Catálogo & Stock', familia: 'Loja',
    capacidades: [
      { nome: 'Produtos por categoria', loja: T, rede: T, enterprise: T },
      { nome: 'Stock por armazém, com custo médio ponderado', loja: T, rede: T, enterprise: T },
      { nome: 'Histórico de movimentos', loja: T, rede: T, enterprise: T },
      { nome: 'Alerta abaixo do stock mínimo', loja: T, rede: T, enterprise: T },
      { nome: 'Transferências entre armazéns, com rasto', loja: F, rede: T, enterprise: T },
      { nome: 'Multi-armazém sem limite', loja: F, rede: T, enterprise: T },
    ],
  },
  {
    codigo: 'compras', nome: 'Compras & Fornecedores', familia: 'Cadeia',
    capacidades: [
      { nome: 'Fornecedores e artigos fornecidos', loja: T, rede: T, enterprise: T },
      { nome: 'Encomendas a fornecedor', loja: T, rede: T, enterprise: T },
      { nome: 'Recepção conferida linha a linha', loja: T, rede: T, enterprise: T },
      { nome: 'Painel de necessidades e reposição', loja: F, rede: T, enterprise: T },
      { nome: 'Mercado de fornecedores e sourcing B2B', loja: F, rede: F, enterprise: T, chave: T },
      { nome: 'Portal do fornecedor, com catálogo próprio', loja: F, rede: F, enterprise: T },
    ],
  },
  {
    codigo: 'crm', nome: 'Clientes & Crédito', familia: 'Cadeia',
    capacidades: [
      { nome: 'Ficha do cliente e histórico de compras', loja: T, rede: T, enterprise: T },
      { nome: 'Limite de crédito e saldo em dívida', loja: F, rede: T, enterprise: T },
      { nome: 'Venda a prazo, com conta corrente', loja: F, rede: T, enterprise: T },
    ],
  },
  {
    codigo: 'financeiro', nome: 'Financeiro', familia: 'Gestão',
    capacidades: [
      { nome: 'Indicadores do que está contratado', loja: T, rede: T, enterprise: T },
      { nome: 'Margem por loja e por produto', loja: F, rede: T, enterprise: T },
      { nome: 'Painel financeiro consolidado da rede', loja: F, rede: F, enterprise: T, chave: T },
    ],
  },
  {
    codigo: 'pessoas', nome: 'Pessoas — Recursos Humanos', familia: 'Gestão',
    capacidades: [
      { nome: 'Cadastro de utilizadores e perfis', loja: T, rede: T, enterprise: T },
      { nome: 'Permissões por perfil, verificadas no servidor', loja: T, rede: T, enterprise: T },
      { nome: 'Gestão de recursos humanos da rede', loja: F, rede: F, enterprise: T },
      { nome: 'Permissões granulares por ecrã e por acção', loja: F, rede: F, enterprise: T },
    ],
  },
  {
    codigo: 'auditoria', nome: 'Auditoria', familia: 'Governo',
    capacidades: [
      { nome: 'Registo de criações, alterações e eliminações', loja: T, rede: T, enterprise: T },
      { nome: 'Autor, hora e valores anteriores', loja: T, rede: T, enterprise: T },
      { nome: 'Histórico estendido (ver limites acima)', loja: T, rede: T, enterprise: T },
    ],
  },
];

/** A Mayra é limitada em capacidade e em quantidade. */
export const MAYRA: Capacidade[] = [
  { nome: 'Perguntar e obter resposta com os dados reais', loja: T, rede: T, enterprise: T },
  { nome: 'Explicar um número — de onde vem, como se calcula', loja: T, rede: T, enterprise: T },
  { nome: 'Vê o que o perfil de quem pergunta vê', loja: T, rede: T, enterprise: T },
  { nome: 'Acções de escrita, com confirmação antes de gravar', loja: F, rede: T, enterprise: T },
  { nome: 'Perguntas sem limite mensal prático', loja: F, rede: F, enterprise: T, chave: T },
];

/** Outro sítio de trabalho, ou consumo com custo variável real. */
export const COMPLEMENTOS = [
  {
    nome: 'Loja adicional',
    preco: 1_900,
    descricao: 'Acima das lojas incluídas no plano, por loja.',
    porque: 'Outro balcão, outra caixa, outra equipa.',
  },
  {
    nome: 'Pacote de 5 000 perguntas à Mayra',
    preco: 2_400,
    descricao: 'Acrescenta 5 000 chamadas ao limite mensal do plano.',
    porque: 'Consumo com custo marginal real.',
  },
];

/** O que nunca se factura. */
export const SEMPRE_INCLUIDO = [
  { o: 'Administração completa', porque: 'Utilizadores, perfis, permissões e definições da empresa.' },
  { o: 'Auditoria', porque: 'Registo com valores anterior e novo, sem edição possível.' },
  { o: 'Perguntar à Mayra', porque: 'A camada de leitura vai em todos os planos.' },
  { o: 'Exportar os seus dados', porque: 'Sempre, e em formato aberto. Nunca se cobra a saída.' },
];

export const PERGUNTAS = [
  {
    p: 'Posso mudar de plano a meio do mês?',
    r: 'Sim. Cobra-se apenas a diferença dos dias que faltam. A descer, o valor fica '
      + 'como crédito para o ciclo seguinte.',
  },
  {
    p: 'O que acontece se passar do limite de lojas ou utilizadores?',
    r: 'Avisamos antes do limite, com o escalão que resolve. Ao atingir o limite deixa de '
      + 'poder criar lojas ou utilizadores novos — os que existem continuam a trabalhar.',
  },
  {
    p: 'E se deixar de pagar?',
    r: 'Há aviso, depois só-leitura, depois suspensão. Em nenhum momento se apagam dados, '
      + 'e a exportação completa está sempre disponível.',
  },
  {
    p: 'Os preços incluem IVA?',
    r: 'Não. Acresce IVA à taxa legal em vigor em Moçambique.',
  },
  {
    p: 'Preciso de instalar servidores?',
    r: 'Não. É um serviço na nuvem. Há opção de instalação local para quem tem essa '
      + 'exigência — nesse caso o preço é por proposta.',
  },
];
