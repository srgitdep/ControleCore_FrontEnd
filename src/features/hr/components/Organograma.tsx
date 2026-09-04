import { useQuery } from '@tanstack/react-query';
import { Loader2, Network } from 'lucide-react';
import { getOrgChart } from '../api/hr.api';
import { HRChart } from './OrgChart/OrgChart';

/**
 * O organograma da empresa.
 *
 * ## O que este ecrã liga, e o que ainda falta
 *
 * O componente da árvore (`HRChart`) já existia no projecto, com o CSS dos conectores
 * feito, e **não era importado por nada**. O endpoint `GET /hr/org-chart` também já
 * existia. Faltava isto: alguém a pedir os dados e a passá-los à árvore.
 *
 * Fica dito com franqueza no estado vazio: não há nenhum endpoint que **crie** nós de
 * organograma. A tabela `department_nodes` só se escreve por SQL, e por isso este ecrã vai
 * mostrar a mensagem de «ainda não configurado» até que essa escrita exista. Preferimos
 * dizê-lo aqui a deixar quem usa a concluir que a funcionalidade está avariada.
 */
export function Organograma() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['org-chart'],
    queryFn: () => getOrgChart(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        A carregar o organograma...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {(error as any)?.response?.data?.message ?? 'Não foi possível carregar o organograma.'}
      </div>
    );
  }

  const vazio = !data || (Array.isArray(data) && data.length === 0);

  if (vazio) {
    return (
      <div className="py-16 text-center">
        <Network className="mx-auto mb-3 h-12 w-12 text-slate-300" />
        <p className="text-sm font-medium text-slate-700">Organograma ainda não configurado.</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
          A hierarquia é guardada numa tabela própria, separada da lista de colaboradores —
          um cargo no organograma pode não corresponder a um utilizador do sistema. Não existe
          ainda no servidor forma de criar esses nós pela aplicação, pelo que este ecrã fica à
          espera dessa escrita.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      {/* Fundo claro e altura ao conteúdo: o `min-h-screen` escuro de omissão do
          componente foi desenhado para uma página inteira, e aqui é um separador. */}
      <HRChart data={data} className="bg-slate-50 py-8" />
    </div>
  );
}
