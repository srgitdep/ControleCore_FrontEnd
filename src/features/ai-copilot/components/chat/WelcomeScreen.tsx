
import { useAuthStore } from '@/features/auth';
import { useCopilotStore } from '../../store/copilotStore';

const getSuggestionsByRole = (role?: string) => {
  if (role === 'STOCK_KEEPER') {
    return [
      { title: 'Prever Rutura', description: 'Prever risco de ruptura de estoque', prompt: 'Prever risco de ruptura de estoque' },
      { title: 'Capital Congelado', description: 'Analisar estoque parado nas lojas', prompt: 'Analisar estoque parado (capital congelado)' },
      { title: 'Movimentos', description: 'Verificar últimos movimentos', prompt: 'Mostrar os últimos movimentos de estoque de hoje' },
      { title: 'Baixo Estoque', description: 'Listar produtos no limite', prompt: 'Quais produtos estão com o estoque abaixo do mínimo?' }
    ];
  }
  
  if (role === 'CASHIER') {
    return [
      { title: 'Meu Turno', description: 'Resumo das minhas vendas', prompt: 'Resumir as minhas vendas de hoje' },
      { title: 'Consultar Preço', description: 'Verificar o preço de produto', prompt: 'Consultar preço de um produto' },
      { title: 'Meus Horários', description: 'Ver minhas marcações de ponto', prompt: 'Mostrar minhas entradas e saídas de hoje' },
      { title: 'Top Vendas', description: 'Produtos mais vendidos', prompt: 'Quais foram os produtos mais vendidos por mim hoje?' }
    ];
  }

  // DEFAULT (ADMIN / MANAGER)
  return [
    { title: 'Auditar Margens', description: 'Analisar produtos com margem de lucro baixa', prompt: 'Analisar produtos com margem de lucro baixa ou negativa' },
    { title: 'Anti-fraude', description: 'Auditoria de ocorrências suspeitas', prompt: 'Auditoria Anti-fraude (Ocorrências suspeitas da semana)' },
    { title: 'Fecho de Caixas', description: 'Resumir fechamentos de todos os turnos', prompt: 'Resumir fechamentos de caixa de hoje' },
    { title: 'Capital Congelado', description: 'Analisar estoque sem saídas', prompt: 'Analisar estoque parado (capital congelado)' },
    { title: 'Marketing + Estoque', description: 'Como escoar itens perto da validade', prompt: 'Marketing + Estoque: Como escoar itens perto da validade?' },
    { title: 'Finanças', description: 'Resumo de quebras de caixa', prompt: 'Finanças: Resumo de quebras de caixa desta semana.' },
    { title: 'RH + Vendas', description: 'Melhor desempenho de caixa', prompt: 'RH + Vendas: Qual operador teve o melhor desempenho hoje?' },
    { title: 'Entregas', description: 'Tempo real de entrega', prompt: 'Compras: Qual é o tempo real de entrega do Fornecedor X?' },
    { title: 'Melhor Preço', description: 'Quem tem o melhor preço histórico?', prompt: 'Compras: Quem tem o melhor preço histórico para o Arroz 5kg?' },
    { title: 'Rascunho Pedido', description: 'Gerar pedido de ruptura', prompt: 'Compras: Crie um rascunho de pedido para os itens críticos de ruptura.' },
    { title: 'Melhores Clientes', description: 'Top 5 clientes do mês', prompt: 'CRM: Quais são os nossos 5 melhores clientes este mês?' },
    { title: 'Histórico Cliente', description: 'Buscar compras do cliente', prompt: 'CRM: Mostre o histórico de compras do cliente NUIT 123456789' }
  ];
};

export function WelcomeScreen() {
  const { user } = useAuthStore();
  const { sendMessage, isLoading } = useCopilotStore();

  return (
    <div className="flex flex-col items-center justify-center flex-1 h-full text-center px-2 py-6">
      <h3 className="text-lg font-bold text-slate-900 mb-1">Olá, {user?.name || 'Gestor'}</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-sm">
        Sou a Mayra. Escolha uma sugestão ou escreva a sua pergunta.
      </p>
      
      {/* Uma coluna, não três.
          O painel da Mayra tem cerca de 380 px: três colunas davam 110 px por cartão, e
          «Analisar produtos com margem de lucro baixa» quebrava em cinco linhas, deixando
          os cartões altos e de alturas diferentes. Em lista, cada sugestão ocupa duas
          linhas e lê-se de uma passagem.

          Sem emoji: nove ícones coloridos competiam entre si e com o texto, e nenhum
          acrescentava informação — «📉» não diz mais do que «Auditar Margens». */}
      <div
        className="w-full max-w-md space-y-2 overflow-y-auto px-1 pb-4 custom-scrollbar"
        style={{ maxHeight: '55vh' }}
      >
        {getSuggestionsByRole(user?.role).map((sug, idx) => (
           <button
             key={idx}
             onClick={() => sendMessage(sug.prompt)}
             disabled={isLoading}
             className="group flex w-full flex-col items-start gap-0.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/40 disabled:opacity-50"
           >
             <span className="text-[13px] font-semibold leading-tight text-slate-800 group-hover:text-blue-700">
               {sug.title}
             </span>
             <span className="text-[11px] leading-snug text-slate-500">{sug.description}</span>
           </button>
        ))}
      </div>
    </div>
  );
}
