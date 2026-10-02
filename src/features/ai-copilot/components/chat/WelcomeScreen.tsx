
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth';
import { useCopilotStore } from '../../store/copilotStore';

type TFn = (chave: string) => string;

/**
 * As sugestões por perfil. Cada uma tem título, descrição e a pergunta que se envia à
 * Mayra — as três vêm do catálogo, porque a pergunta também segue a língua activa: enviar
 * uma pergunta em português a quem lê em inglês faria a Mayra responder em português.
 */
const SUGESTOES = {
  stock: ['ruptura', 'capital', 'movimentos', 'baixo'],
  caixa: ['turno', 'preco', 'horarios', 'top'],
  gestao: [
    'margens', 'fraude', 'fecho', 'capital', 'marketing', 'financas',
    'rh_vendas', 'entregas', 'preco', 'rascunho', 'clientes', 'historico',
  ],
} as const;

const getSuggestionsByRole = (role: string | undefined, t: TFn) => {
  const grupo = role === 'STOCK_KEEPER' ? 'stock' : role === 'CASHIER' ? 'caixa' : 'gestao';
  return (SUGESTOES[grupo] as readonly string[]).map((id) => ({
    title: t(`sugestao.${grupo}.${id}.titulo`),
    description: t(`sugestao.${grupo}.${id}.descricao`),
    prompt: t(`sugestao.${grupo}.${id}.pergunta`),
  }));
};

export function WelcomeScreen() {
  const { t } = useTranslation('copiloto');
  const { user } = useAuthStore();
  const { sendMessage, isLoading } = useCopilotStore();

  return (
    <div className="flex flex-col items-center justify-center flex-1 h-full text-center px-2 py-6">
      <h3 className="text-lg font-bold text-slate-900 mb-1">{t('boas_vindas_ecra.ola', { nome: user?.name || t('boas_vindas_ecra.nome_padrao') })}</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-sm">
        {t('boas_vindas_ecra.intro')}
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
        {getSuggestionsByRole(user?.role, (chave) => t(chave as never)).map((sug, idx) => (
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
