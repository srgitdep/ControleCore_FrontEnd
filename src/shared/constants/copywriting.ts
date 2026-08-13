/**
 * O texto do sítio público, num só lugar.
 *
 * ## Porque está separado dos componentes
 *
 * O copy anterior estava em `features/landing/constants/landingCopywriting.ts`,
 * misturado com os `import` das imagens, e cada componente ia lá buscar a sua
 * fatia. Funcionava — mas o texto da entrada (`LoginPage`) estava escrito à mão
 * dentro do JSX, o que significa duas fontes de verdade: a promessa da landing
 * dizia uma coisa, o painel do login dizia outra, e ninguém notava.
 *
 * Aqui fica tudo o que é **palavra**. Os componentes ficam com estrutura e estilo.
 * Quem quiser mudar uma frase não precisa de abrir um ficheiro de 500 linhas de JSX
 * nem de saber React.
 *
 * ## O que foi corrigido ao mover
 *
 * O texto anterior tinha três problemas que não eram de design:
 *
 * 1. **Moeda errada.** O cartão do herói mostrava `R$ 2.490,00` — real brasileiro,
 *    num sistema cujos valores são em meticais.
 * 2. **Português do Brasil.** «planilhas», «estoque», «PDV», «faturamento»,
 *    «Gerencie». O resto do sistema está em português europeu, e o comprador é
 *    moçambicano.
 * 3. **Certificações inventadas.** `ISO 27001 · CERTIFICADO`, `SOC 2 TYPE II ·
 *    CONFORME`, `GDPR/LGPD · PRONTO`. Nenhuma dessas auditorias existe. Não é
 *    exagero de marketing — é uma declaração falsa sobre uma auditoria que não
 *    houve, e num concurso público basta para desqualificar a proposta. Foram
 *    substituídas por `SEGURANCA`, que descreve o que o código faz de facto.
 *
 * ## A regra que decide o que entra
 *
 * > Cada secção nomeia uma dor concreta e mostra a prova.
 *
 * Quem gere um supermercado não procura «gestão integrada» — procura porque fechou
 * a caixa com uma diferença que ninguém explica. Se uma secção não nomeia dor nem
 * mostra prova, sai. É por isso que não há testemunhos nem logótipos de clientes:
 * enquanto não houver cliente que autorize, a secção não existe. Uma prova
 * inventada é a coisa mais cara que se pode pôr num sítio.
 */
export const COPY = {
  // ── A marca ───────────────────────────────────────────────────────────────
  MARCA: {
    NOME: 'ControlCore',
    /** Parte do nome que fica no azul profundo. */
    NOME_DESTAQUE: 'Core',
    PROMESSA: 'Da caixa ao balanço, sem ninguém copiar nada de uma folha para a outra.',
    EMAIL: 'itdep@srg.co.mz',
    LOCAL: 'Maputo, Moçambique',
    EMPRESA: 'SRG',
  },

  // ── Barra e rodapé ────────────────────────────────────────────────────────
  SITIO: {
    NAV: [
      { para: '/#modulos', texto: 'Módulos' },
      { para: '/#operacao', texto: 'A operação' },
      { para: '/#mayra', texto: 'A Mayra' },
      { para: '/#comecar', texto: 'Como começa' },
    ],
    ENTRAR: 'Entrar',
    DEMONSTRACAO: 'Pedir demonstração',
    MENU_ABRIR: 'Abrir menu',
    MENU_FECHAR: 'Fechar menu',

    RODAPE: {
      COLUNAS: [
        {
          titulo: 'Produto',
          itens: [
            { texto: 'Módulos', para: '/#modulos' },
            { texto: 'A operação', para: '/#operacao' },
            { texto: 'A Mayra', para: '/#mayra' },
            { texto: 'Como começa', para: '/#comecar' },
          ],
        },
        {
          titulo: 'Acesso',
          itens: [
            { texto: 'Entrar', para: '/login' },
            { texto: 'Recuperar senha', para: '/recuperar-senha' },
          ],
        },
      ],
      CONTACTO_TITULO: 'Contacto',
      /* «A confirmar» está assim de propósito. Inventar um NUIT ou um telefone é
       * pior do que deixar o espaço à vista: um número errado num rodapé é uma
       * chamada perdida e uma desconfiança ganha. */
      TELEFONE: 'Telefone a confirmar',
      NUIT: 'NUIT a confirmar',
      DIREITOS: 'Todos os direitos reservados.',
      MOEDA: 'Valores em meticais (MZN).',
    },
  },

  // ── Herói ─────────────────────────────────────────────────────────────────
  HEROI: {
    ETIQUETA: 'ERP de retalho · Moçambique',
    /* O título nomeia o trabalho que desaparece, não a categoria. «O ERP
     * inteligente que impulsiona suas operações» — o texto anterior — é o que
     * todos dizem, e por isso não diz nada. */
    TITULO_ANTES: 'Da caixa ao ',
    TITULO_REALCE: 'balanço',
    TITULO_DEPOIS: ', sem folhas de cálculo pelo meio.',
    SUBTITULO:
      'Cada venda no balcão abate o stock do armazém certo, actualiza o custo médio, entra na conta do cliente e aparece no painel da direcção.',
    SUBTITULO_FORTE: 'Sem ninguém copiar nada.',
    BOTAO_PRIMARIO: 'Entrar no sistema',
    BOTAO_SECUNDARIO: 'Pedir demonstração',
    GARANTIAS: ['Multi-loja e multi-armazém', 'Funciona no telemóvel', 'Instalação assistida'],
    ALT_CAPTURA: 'Painel de gestão do ControlCore, com os indicadores de vendas, margem e stock.',
  },

  // ── Faixa de contexto ─────────────────────────────────────────────────────
  /* Não são números de resultado — não há clientes que os autorizem. São
   * âmbitos: o que o sistema cobre, verificável contra o próprio produto. */
  FAIXA: [
    { icone: 'Store', texto: 'Várias lojas, um só painel' },
    { icone: 'Warehouse', texto: 'Custo médio por armazém' },
    { icone: 'ScanLine', texto: 'Caixa com código de barras' },
    { icone: 'ShieldCheck', texto: 'Tudo o que muda fica registado' },
  ],

  // ── O problema ────────────────────────────────────────────────────────────
  PROBLEMA: {
    ETIQUETA: 'O que dói primeiro',
    TITULO: 'Quatro perguntas que uma folha de cálculo não responde',
    SUBTITULO:
      'Não é falta de trabalho — é falta de um sítio onde o trabalho de todos se encontre. Enquanto os dados vivem em ficheiros separados, cada resposta exige alguém a reconciliar à mão.',
    DORES: [
      {
        icone: 'AlertTriangle',
        titulo: 'A caixa fechou com diferença',
        texto:
          'O operador contou, o valor não bate, e ninguém sabe se foi troco, sangria ou venda anulada. A conversa acaba em suspeita.',
        resposta: 'Cada movimento da sessão fica registado com hora e autor — o fecho explica-se a si mesmo.',
      },
      {
        icone: 'TrendingDown',
        titulo: 'Faltou numa loja, sobrou na outra',
        texto:
          'O stock existe, mas no armazém errado. Descobre-se quando o cliente pergunta e o produto não está na prateleira.',
        resposta: 'O stock é por armazém, com transferências registadas — vê-se onde está antes de comprar mais.',
      },
      {
        icone: 'Coins',
        titulo: 'A margem é um palpite',
        texto:
          'O preço de compra mudou três vezes este trimestre. Qual foi o custo real do que se vendeu hoje? Ninguém arrisca dizer.',
        resposta: 'Custo médio ponderado recalculado a cada recepção — a margem sai da conta, não do palpite.',
      },
      {
        icone: 'ClipboardList',
        titulo: 'O fornecedor diz que entregou',
        texto:
          'A guia está assinada, a factura chegou, mas a quantidade que entrou no armazém foi outra. A discussão fica sem documento.',
        resposta: 'Recepção conferida linha a linha contra a encomenda, com o que ficou pendente à vista.',
      },
    ],
  },

  // ── A cadeia ──────────────────────────────────────────────────────────────
  /* A secção central: os módulos não são sete produtos, são sete pontos do mesmo
   * movimento. */
  OPERACAO: {
    ETIQUETA: 'A operação, de ponta a ponta',
    TITULO: 'Sete módulos, um só movimento',
    SUBTITULO:
      'Não são sete programas que trocam ficheiros ao fim do dia. É a mesma informação a percorrer a cadeia — cada passo já sabe o que aconteceu no anterior.',
    NOS: [
      { chave: 'compra', rotulo: 'COMPRA', frase: 'A encomenda sai com o preço acordado e o prazo combinado.' },
      { chave: 'recepcao', rotulo: 'RECEPÇÃO', frase: 'Confere-se linha a linha. O que falta fica pendente, não esquecido.' },
      { chave: 'armazem', rotulo: 'ARMAZÉM', frase: 'Entra no armazém certo e o custo médio recalcula-se na hora.' },
      { chave: 'loja', rotulo: 'LOJA', frase: 'A transferência entre armazéns deixa rasto dos dois lados.' },
      { chave: 'caixa', rotulo: 'CAIXA', frase: 'A venda abate o stock e fecha a sessão com o valor que se contou.' },
      { chave: 'cliente', rotulo: 'CLIENTE', frase: 'A compra entra no histórico e no limite de crédito de quem comprou.' },
      { chave: 'painel', rotulo: 'PAINEL', frase: 'A direcção vê a margem do dia sem pedir o relatório a ninguém.' },
    ],
  },

  // ── Os módulos ────────────────────────────────────────────────────────────
  /* O texto anterior descrevia funcionalidades que o sistema não tem —
   * «contingência offline automática», «emissão fiscal NFC-e» (documento fiscal
   * brasileiro), «contagem de inventário por ciclo», «programas de recompensa».
   * Prometer o que não existe transfere o problema para a demonstração, onde custa
   * a venda inteira. Cada descrição aqui corresponde a comportamento implementado. */
  MODULOS: {
    ETIQUETA: 'Os módulos',
    TITULO: 'O que está lá dentro, em capturas do próprio sistema',
    LISTA: [
      {
        id: 'painel',
        icone: 'BarChart3',
        imagem: 'dashboard',
        titulo: 'Painel e indicadores',
        descricao:
          'Vendas do dia, margem bruta, produtos em risco de ruptura e o estado das caixas abertas — por loja ou no conjunto.',
      },
      {
        id: 'caixa',
        icone: 'ShoppingCart',
        imagem: 'pos',
        titulo: 'Frente de caixa',
        descricao:
          'Venda por código de barras ou pesquisa, vários meios de pagamento na mesma venda, recibo com numeração sequencial e sessão de caixa com abertura e fecho conferidos.',
      },
      {
        id: 'catalogo',
        icone: 'Package',
        imagem: 'produtos',
        titulo: 'Catálogo e stock',
        descricao:
          'Produtos por categoria, stock por armazém com custo médio ponderado, histórico de cada movimento e alerta quando desce do mínimo.',
      },
      {
        id: 'crm',
        icone: 'Users',
        imagem: 'crm',
        titulo: 'Clientes e crédito',
        descricao:
          'Ficha do cliente com histórico de compras, limite de crédito definido e saldo em dívida a par de cada venda a prazo.',
      },
      {
        id: 'caixas',
        icone: 'Wallet',
        imagem: 'sessoesCaixa',
        titulo: 'Sessões de caixa',
        descricao:
          'Cada turno de caixa com o valor de abertura, as vendas, as sangrias e a diferença ao fecho — assinado por quem contou.',
      },
      {
        id: 'auditoria',
        icone: 'ShieldCheck',
        imagem: 'auditLog',
        titulo: 'Auditoria',
        descricao:
          'Todas as criações, alterações e eliminações ficam registadas com autor, hora e o que mudou. Não se apaga.',
      },
    ],
  },

  // ── A Mayra ───────────────────────────────────────────────────────────────
  /* O que distingue a Mayra de uma caixa de conversa é a confirmação antes de
   * escrever — e é isso que a secção mostra. Vender IA sem explicar isto assusta
   * exactamente o comprador que decide. */
  MAYRA: {
    ETIQUETA: 'O copiloto',
    TITULO: 'Pergunte à Mayra em português',
    SUBTITULO:
      '«Quanto vendemos hoje na loja do centro?», «Que produtos estão abaixo do mínimo?», «Cria um produto novo com este preço». Ela lê os dados da sua empresa — e só os da sua empresa.',
    PONTOS: [
      {
        titulo: 'Nunca escreve sem confirmar',
        texto: 'Consultar é imediato. Criar, alterar ou apagar mostra primeiro o que vai fazer e espera pelo seu sim.',
      },
      {
        titulo: 'Vê o que o seu perfil vê',
        texto: 'Um operador de caixa não obtém pela Mayra aquilo a que não teria acesso no ecrã.',
      },
      {
        titulo: 'Deixa rasto',
        texto: 'O que a Mayra altera entra no registo de auditoria como qualquer outra alteração, com o autor do pedido.',
      },
    ],

    /** A conversa desenhada. É exemplo, e o rótulo di-lo. */
    CONVERSA: {
      ROTULO: 'EXEMPLO',
      PERGUNTA_1: 'Quais os produtos abaixo do stock mínimo na loja do centro?',
      RESPOSTA_1: 'Três produtos, todos no Armazém Principal:',
      PRODUTOS: [
        { nome: 'Arroz Agulha 5 kg', actual: '4', minimo: '20' },
        { nome: 'Óleo Alimentar 1 L', actual: '11', minimo: '30' },
        { nome: 'Açúcar Branco 1 kg', actual: '18', minimo: '25' },
      ],
      PERGUNTA_2: 'Cria uma encomenda ao fornecedor habitual para repor.',
      CONFIRMACAO_ROTULO: 'PRECISA DA SUA CONFIRMAÇÃO',
      CONFIRMACAO_FORNECEDOR: 'Distribuidora Central',
      CONFIRMACAO_LINHAS: '3 linhas',
      CONFIRMACAO_TOTAL: '18 400,00 MZN',
      CONFIRMAR: 'Confirmar',
      CANCELAR: 'Cancelar',
    },
  },

  // ── Segurança ─────────────────────────────────────────────────────────────
  /* Substitui os quatro selos de certificação inventados. Cada item é um
   * comportamento que existe no código e que se pode demonstrar num ecrã. É menos
   * vistoso do que quatro selos — e é a única versão que sobrevive a alguém
   * perguntar «mostre-me». */
  SEGURANCA: {
    ETIQUETA: 'Segurança',
    TITULO: 'O que é verdade sobre a segurança',
    SUBTITULO:
      'Sem selos de certificação: o ControlCore não tem ISO 27001 nem SOC 2, e dizer o contrário num sítio é uma declaração falsa sobre uma auditoria que não houve. O que se segue é o que o sistema faz — e que se pode verificar.',
    GARANTIAS: [
      {
        icone: 'Boxes',
        titulo: 'Os dados de cada empresa ficam separados',
        texto:
          'Toda a consulta é filtrada pela empresa de quem a faz. Duas empresas na mesma instalação não se vêem uma à outra.',
      },
      {
        icone: 'ShieldCheck',
        titulo: 'Nada se altera sem deixar registo',
        texto:
          'Criações, alterações e eliminações são gravadas com o autor, a hora e os valores anteriores. O registo não é editável.',
      },
      {
        icone: 'Users',
        titulo: 'Cada perfil vê o que lhe compete',
        texto: 'As permissões são por perfil e verificadas no servidor, não apenas escondidas no ecrã.',
      },
      {
        icone: 'Clock',
        titulo: 'As senhas não são guardadas',
        texto:
          'Fica apenas o hash. A recuperação envia dados novos por email, e a senha antiga só deixa de valer quando o email sai.',
      },
    ],
  },

  // ── Como começa ───────────────────────────────────────────────────────────
  /* Está no lugar onde normalmente vão os testemunhos, e responde à pergunta que
   * vem imediatamente depois do interesse: «e agora, quanto tempo até funcionar?». */
  COMECAR: {
    ETIQUETA: 'Como começa',
    TITULO: 'Por uma loja, não pela empresa toda',
    SUBTITULO:
      'Trocar o sistema de gestão de uma rede num só fim de semana é como se perdem operações. O caminho é o contrário: provar numa loja e alargar.',
    PASSOS: [
      {
        numero: '01',
        titulo: 'Conversa de meia hora',
        texto:
          'Quantas lojas, quantos armazéns, quantas caixas. Sai daqui a saber se o sistema serve — inclusive se a resposta for não.',
      },
      {
        numero: '02',
        titulo: 'Catálogo carregado',
        texto:
          'Os produtos, os preços e o stock actual entram a partir dos ficheiros que já tem. Não se escreve tudo de novo à mão.',
      },
      {
        numero: '03',
        titulo: 'Uma loja primeiro',
        texto:
          'Começa-se por uma loja e uma caixa, em paralelo com o que já usa. Só se alarga quando o fecho do dia bater.',
      },
      {
        numero: '04',
        titulo: 'A operação inteira',
        texto:
          'As restantes lojas entram com o processo já provado, e a equipa formada por quem esteve na primeira.',
      },
    ],
  },

  // ── Fecho ─────────────────────────────────────────────────────────────────
  FECHO: {
    TITULO: 'Comece pela pergunta que hoje fica sem resposta',
    SUBTITULO:
      'Traga o fecho de caixa de ontem, ou a última contagem de stock. Meia hora basta para ver se o ControlCore responde — e para dizer se não.',
    BOTAO_PRIMARIO: 'Pedir demonstração',
    BOTAO_SECUNDARIO: 'Já tenho conta',
    ASSUNTO_EMAIL: 'Demonstração do ControlCore',
  },

  // ── Entrada ───────────────────────────────────────────────────────────────
  /* Estava escrito à mão dentro do JSX da `LoginPage`, e dizia «Gestão Industrial
   * Inteligente» — o produto não é industrial, é de retalho. Vinha da altura em que
   * o ecrã foi copiado de outro projecto, e ninguém reparou porque o texto não
   * estava em lugar nenhum onde se lesse. */
  AUTH: {
    TITULO: 'Entrar no ControlCore',
    SUBTITULO: 'Use o código de acesso que a sua empresa lhe atribuiu.',
    CAMPO_CODIGO: 'Código de acesso',
    CAMPO_CODIGO_DICA: 'Ex: S001',
    CAMPO_SENHA: 'Senha',
    CAMPO_SENHA_DICA: 'Mínimo 6 caracteres',
    ESQUECEU: 'Esqueceu a senha?',
    SUBMETER: 'Entrar',
    A_SUBMETER: 'A autenticar...',
    VOLTAR: 'Voltar ao início',
    SUCESSO: 'Bem-vindo de volta!',
    ERRO_GENERICO: 'Não foi possível comunicar com o servidor. Tente novamente.',
    MOSTRAR_SENHA: 'Mostrar senha',
    OCULTAR_SENHA: 'Ocultar senha',

    /* O painel da esquerda roda entre estas quatro. São as mesmas quatro dores da
     * landing, ditas em duas linhas: quem chega ao login vindo do sítio reconhece a
     * promessa, e quem chega directo fica com ela. */
    SLIDES: [
      {
        titulo: 'O fecho de caixa explica-se',
        descricao: 'Cada venda, sangria e anulação da sessão fica registada com hora e autor. A diferença ao fecho tem sempre uma linha que a justifica.',
      },
      {
        titulo: 'O stock é por armazém',
        descricao: 'Sabe-se o que existe em cada armazém e em cada loja, com o rasto de todas as transferências entre eles.',
      },
      {
        titulo: 'A margem sai da conta',
        descricao: 'O custo médio ponderado recalcula-se a cada recepção. A margem do dia é um número, não um palpite.',
      },
      {
        titulo: 'A Mayra responde em português',
        descricao: 'Pergunte pelas vendas, pelo stock ou pelos clientes. Antes de alterar qualquer coisa, ela pede a sua confirmação.',
      },
    ],
  },
} as const;
