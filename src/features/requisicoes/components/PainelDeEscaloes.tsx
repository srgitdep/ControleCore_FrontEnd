import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { api } from '@/shared/config';
import { Button, Card } from '@/shared/ui';
import { useEscaloes, useRequisicaoMutations } from '../hooks/useRequisicoes';

interface LinhaEditavel {
  nome: string;
  valorMinimo: number;
  /** Vazio é «sem tecto». */
  valorMaximo: number | null;
  perfilId: string;
}

/**
 * Quem aprova o quê, a partir de que valor (§87).
 *
 * ## Editado como tabela inteira
 *
 * A coerência é propriedade do conjunto: um escalão isolado está sempre certo, e é a tabela
 * que pode ter buracos — valores que ninguém aprova — e sobreposições. Gravar linha a linha
 * obrigaria a aceitar estados intermédios inválidos, e a empresa ficaria com a tabela partida
 * entre dois pedidos.
 *
 * O servidor valida o conjunto e recusa-o inteiro; este ecrã mostra os mesmos problemas antes
 * de submeter, para não ser preciso tentar para saber.
 */
export function PainelDeEscaloes() {
  const { data: tabela, isLoading } = useEscaloes();
  const { definirEscaloes } = useRequisicaoMutations();

  const { data: perfis } = useQuery({
    queryKey: ['perfis'],
    queryFn: async () => {
      const { data } = await api.get<{ id: string; nome: string }[]>('/perfis');
      return data;
    },
  });

  const [linhas, setLinhas] = useState<LinhaEditavel[]>([]);

  useEffect(() => {
    if (!tabela) return;

    setLinhas(
      tabela.escaloes.map((e) => ({
        nome: e.nome,
        valorMinimo: e.valorMinimo,
        valorMaximo: e.valorMaximo,
        perfilId: e.perfilId,
      })),
    );
  }, [tabela]);

  const problemas = validarLocalmente(linhas);

  const alterar = (i: number, campo: keyof LinhaEditavel, valor: unknown) =>
    setLinhas((atual) =>
      atual.map((linha, indice) => (indice === i ? { ...linha, [campo]: valor } : linha)),
    );

  if (isLoading) return <p className="text-sm text-slate-400">A carregar…</p>;

  return (
    <div className="space-y-4">
      <Card>
        <div className="p-4">
          <p className="text-sm text-slate-600">
            O primeiro escalão tem de começar em zero e o último tem de ficar sem tecto. Sem
            isso, há valores que ninguém pode aprovar — e uma requisição desse valor fica presa
            sem nada a explicar porquê.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            O mínimo é inclusivo e o máximo exclusivo: uma requisição de 10 000 MT cai no
            escalão que começa em 10 000, e não no que acaba lá.
          </p>
        </div>
      </Card>

      {problemas.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex gap-3 p-4">
            <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={18} />
            <ul className="space-y-0.5 text-sm text-amber-900">
              {problemas.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[44rem] text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Nome</th>
              <th className="px-3 py-2 text-right font-medium">De (MT)</th>
              <th className="px-3 py-2 text-right font-medium">Até (MT)</th>
              <th className="px-3 py-2 text-left font-medium">Aprovado por</th>
              <th className="w-10" />
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {linhas.map((linha, i) => (
              <tr key={i}>
                <td className="px-3 py-2">
                  <input
                    value={linha.nome}
                    onChange={(e) => alterar(i, 'nome', e.target.value)}
                    placeholder="Gerente de loja"
                    className="w-full rounded border border-slate-200 px-2 py-1"
                  />
                </td>

                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={linha.valorMinimo}
                    onChange={(e) => alterar(i, 'valorMinimo', Number(e.target.value) || 0)}
                    className="w-28 rounded border border-slate-200 px-2 py-1 text-right"
                  />
                </td>

                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={linha.valorMaximo ?? ''}
                    placeholder="sem tecto"
                    onChange={(e) =>
                      alterar(i, 'valorMaximo', e.target.value === '' ? null : Number(e.target.value))
                    }
                    className="w-28 rounded border border-slate-200 px-2 py-1 text-right"
                  />
                </td>

                <td className="px-3 py-2">
                  <select
                    value={linha.perfilId}
                    onChange={(e) => alterar(i, 'perfilId', e.target.value)}
                    className="w-full rounded border border-slate-200 px-2 py-1"
                  >
                    <option value="">Escolher…</option>
                    {perfis?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="px-2 py-2">
                  <button
                    onClick={() => setLinhas((atual) => atual.filter((_, j) => j !== i))}
                    className="text-slate-400 hover:text-red-600"
                    aria-label="Remover escalão"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}

            {linhas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-400">
                  Sem escalões. Enquanto não houver nenhum, só a regra de que quem pede não
                  aprova se aplica.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() =>
            setLinhas((atual) => [
              ...atual,
              {
                nome: '',
                // O mínimo do novo escalão começa onde o anterior acaba: é o que o torna
                // contínuo por omissão, que é o caso normal.
                valorMinimo: atual.at(-1)?.valorMaximo ?? 0,
                valorMaximo: null,
                perfilId: '',
              },
            ])
          }
        >
          <Plus size={16} className="mr-1.5" />
          Acrescentar escalão
        </Button>

        <Button
          onClick={() => definirEscaloes.mutate(linhas.map((l) => ({ ...l, isActive: true })))}
          disabled={
            definirEscaloes.isPending ||
            problemas.length > 0 ||
            linhas.some((l) => !l.nome.trim() || !l.perfilId)
          }
        >
          Gravar tabela
        </Button>
      </div>
    </div>
  );
}

/**
 * As mesmas verificações que o servidor faz, para não ser preciso tentar para saber.
 *
 * Duplicadas de propósito e não partilhadas: o servidor é quem decide, e uma cópia no cliente
 * que se desactualize dá um aviso errado — nunca uma gravação errada.
 */
function validarLocalmente(linhas: LinhaEditavel[]): string[] {
  if (linhas.length === 0) return [];

  const problemas: string[] = [];
  const ordenadas = [...linhas].sort((a, b) => a.valorMinimo - b.valorMinimo);

  if (ordenadas[0].valorMinimo > 0) {
    problemas.push(
      `Nada cobre valores abaixo de ${ordenadas[0].valorMinimo} MT: as requisições pequenas ficariam sem quem as aprove.`,
    );
  }

  const semTecto = ordenadas.filter((l) => l.valorMaximo === null);

  if (semTecto.length === 0) {
    problemas.push('Nenhum escalão fica sem tecto: uma compra grande ficaria presa.');
  }

  if (semTecto.length > 1) {
    problemas.push(`Há ${semTecto.length} escalões sem tecto. Só um pode ser o último.`);
  }

  for (let i = 0; i < ordenadas.length - 1; i++) {
    const actual = ordenadas[i];
    const seguinte = ordenadas[i + 1];

    if (actual.valorMaximo === null) continue;

    if (actual.valorMaximo < seguinte.valorMinimo) {
      problemas.push(
        `Nada cobre entre ${actual.valorMaximo} e ${seguinte.valorMinimo} MT.`,
      );
    }

    if (actual.valorMaximo > seguinte.valorMinimo) {
      problemas.push(
        `"${actual.nome || 'sem nome'}" e "${seguinte.nome || 'sem nome'}" sobrepõem-se.`,
      );
    }
  }

  return problemas;
}
