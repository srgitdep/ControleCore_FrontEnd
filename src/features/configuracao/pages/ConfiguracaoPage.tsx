import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Info, RotateCcw, Ruler, SlidersHorizontal } from 'lucide-react';
import { BarraDaPagina, Button, Card, Tabs, type TabDefinition } from '@/shared/ui';
import { cn } from '@/shared/utils';
import {
  CAMPOS,
  GRUPOS,
  configuracaoApi,
  type CampoConfiguracao,
  type DefinicaoDeCampo,
  type ValoresConfiguracao,
} from '../api/configuracao.api';
import { PainelDeUnidades } from '../components/PainelDeUnidades';

type Separador = 'limiares' | 'unidades';

const SEPARADORES: TabDefinition<Separador>[] = [
  { id: 'limiares', label: 'Limiares', icon: SlidersHorizontal },
  { id: 'unidades', label: 'Unidades de medida', icon: Ruler },
];

export function ConfiguracaoPage() {
  const [separador, setSeparador] = useState<Separador>('limiares');

  return (
    <div className="space-y-4">
      <BarraDaPagina resumo="Os números que decidem o que o sistema classifica e recusa." />

      <Tabs
        tabs={SEPARADORES}
        active={separador}
        onChange={setSeparador}
        label="Secções da configuração"
      />

      {separador === 'limiares' ? <PainelDeLimiares /> : <PainelDeUnidades />}
    </div>
  );
}

function PainelDeLimiares() {
  const queryClient = useQueryClient();

  const { data: configuracao, isLoading } = useQuery({
    queryKey: ['configuracao'],
    queryFn: () => configuracaoApi.obter(),
  });

  const [alteracoes, setAlteracoes] = useState<Partial<ValoresConfiguracao>>({});

  const gravar = useMutation({
    mutationFn: (payload: Partial<ValoresConfiguracao>) => configuracaoApi.actualizar(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracao'] });
      // Estes números decidem o que os painéis classificam. Sem isto, a saúde do stock
      // continuaria a mostrar a leitura antiga até alguém recarregar a página.
      queryClient.invalidateQueries({ queryKey: ['saude-stock'] });
      queryClient.invalidateQueries({ queryKey: ['validade'] });
      setAlteracoes({});
      toast.success('Configuração gravada.');
    },
    onError: (erro: any) => {
      // Os erros de coerência vêm numa lista à parte — e são eles que dizem qual par de
      // limiares está trocado.
      const erros: { campo: string; mensagem: string }[] | undefined = erro?.response?.data?.erros;
      toast.error(erros?.[0]?.mensagem || erro?.response?.data?.message || 'Não foi possível gravar.');
    },
  });

  if (isLoading) return <p className="text-sm text-slate-400">A carregar…</p>;
  if (!configuracao) return null;

  const valorDe = (campo: CampoConfiguracao) => {
    if (campo in alteracoes) return alteracoes[campo];
    return configuracao.definido?.[campo] ?? null;
  };

  const alterar = (campo: CampoConfiguracao, valor: number | boolean | null) =>
    setAlteracoes((atual) => ({ ...atual, [campo]: valor }));

  const temAlteracoes = Object.keys(alteracoes).length > 0;

  return (
    <div className="space-y-4">
      <Card className="border-blue-100 bg-blue-50/50">
        <div className="flex gap-3 p-4">
          <Info className="mt-0.5 shrink-0 text-blue-500" size={18} />
          <p className="text-sm text-blue-900">
            Um campo vazio usa a omissão do sistema, que aparece em cinzento ao lado. Não é
            zero — é o valor que o sistema usa quando ninguém decidiu outro, e muda para toda a
            gente que nunca lhe tocou.
          </p>
        </div>
      </Card>

      {GRUPOS.map((grupo) => (
        <Card key={grupo.id}>
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold text-slate-900">{grupo.titulo}</h3>
            <p className="mt-0.5 text-xs text-slate-500">{grupo.descricao}</p>
          </div>

          <div className="divide-y divide-slate-50">
            {CAMPOS.filter((c) => c.grupo === grupo.id).map((definicao) => (
              <LinhaDeLimiar
                key={definicao.campo}
                definicao={definicao}
                valor={valorDe(definicao.campo)}
                omissao={configuracao.omissoes[definicao.campo]}
                aoMudar={(v) => alterar(definicao.campo, v)}
              />
            ))}
          </div>
        </Card>
      ))}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" disabled={!temAlteracoes} onClick={() => setAlteracoes({})}>
          Descartar
        </Button>
        <Button disabled={!temAlteracoes || gravar.isPending} onClick={() => gravar.mutate(alteracoes)}>
          Gravar alterações
        </Button>
      </div>
    </div>
  );
}

function LinhaDeLimiar({
  definicao,
  valor,
  omissao,
  aoMudar,
}: {
  definicao: DefinicaoDeCampo;
  valor: number | boolean | null | undefined;
  omissao: number | undefined;
  aoMudar: (valor: number | boolean | null) => void;
}) {
  const definido = valor !== null && valor !== undefined;

  return (
    <div className="flex flex-wrap items-start justify-between gap-4 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-800">{definicao.rotulo}</label>

          {!definido && (
            <span className="text-[11px] text-slate-400">
              a usar a omissão
              {definicao.tipo === 'booleano' ? ' (não)' : omissao !== undefined ? `: ${omissao}` : ''}
            </span>
          )}
        </div>

        <p className="mt-0.5 max-w-xl text-xs text-slate-500">{definicao.ajuda}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {definicao.tipo === 'booleano' ? (
          <select
            value={definido ? String(valor) : ''}
            onChange={(e) => aoMudar(e.target.value === '' ? null : e.target.value === 'true')}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm',
              definido ? 'border-slate-300 text-slate-900' : 'border-slate-200 text-slate-400',
            )}
          >
            <option value="">Omissão (não)</option>
            <option value="false">Não</option>
            <option value="true">Sim</option>
          </select>
        ) : (
          <>
            <input
              type="number"
              value={definido ? String(valor) : ''}
              placeholder={omissao !== undefined ? String(omissao) : ''}
              onChange={(e) => aoMudar(e.target.value === '' ? null : Number(e.target.value))}
              className={cn(
                'w-24 rounded-lg border px-3 py-1.5 text-right text-sm',
                definido ? 'border-slate-300 text-slate-900' : 'border-slate-200 text-slate-400',
              )}
            />
            {definicao.unidade && (
              <span className="w-10 text-xs text-slate-400">{definicao.unidade}</span>
            )}
          </>
        )}

        {/* Voltar à omissão é uma acção própria e não «apagar o campo»: sem ela, quem quisesse
            desfazer teria de saber de cor o valor original — que é o que não sabe. */}
        <button
          onClick={() => aoMudar(null)}
          disabled={!definido}
          title="Voltar à omissão do sistema"
          className="p-1.5 text-slate-300 hover:text-slate-600 disabled:opacity-0"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}
