import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Info, Pencil, Plus, Power, RotateCcw } from 'lucide-react';
import { api } from '@/shared/config';
import { Button, Card } from '@/shared/ui';
import { cn } from '@/shared/utils';

interface UnidadeMedida {
  id: string;
  codigo: string;
  nome: string;
  simbolo: string;
  tipo: 'DISCRETA' | 'CONTINUA';
  casasDecimais: number;
  isActive: boolean;
}

const unidadesApi = {
  listar: async (incluirInactivas: boolean) => {
    const { data } = await api.get<UnidadeMedida[]>('/unidades', {
      params: incluirInactivas ? { incluirInactivas: true } : undefined,
    });
    return data;
  },
  criar: async (payload: {
    codigo: string;
    nome: string;
    simbolo?: string;
    tipo?: string;
    casasDecimais?: number;
  }) => {
    const { data } = await api.post<UnidadeMedida>('/unidades', payload);
    return data;
  },
  /**
   * Corrige nome, símbolo, tipo e casas decimais — nunca o código.
   *
   * O `PATCH` existia no servidor e nenhum ecrã o chamava: uma unidade criada com o nome
   * mal escrito só se podia corrigir criando outra e desactivando a errada, o que deixava
   * duas linhas para a mesma coisa.
   */
  actualizar: async (
    id: string,
    payload: {
      nome?: string;
      simbolo?: string;
      tipo?: string;
      casasDecimais?: number;
      isActive?: boolean;
    },
  ) => {
    const { data } = await api.patch<UnidadeMedida>(`/unidades/${id}`, payload);
    return data;
  },
  desactivar: async (id: string) => {
    const { data } = await api.delete(`/unidades/${id}`);
    return data;
  },
};

/**
 * As unidades de medida da empresa.
 *
 * ## As conversões não estão aqui
 *
 * Uma caixa de arroz tem 10 sacos e uma de sabão tem 24 barras: «caixa» não tem um conteúdo
 * próprio, tem o conteúdo que cada produto lhe dá. O factor pertence à ficha do produto, e é
 * lá que se declara.
 *
 * Aqui declara-se só que a unidade existe.
 */
export function PainelDeUnidades() {
  const queryClient = useQueryClient();
  const [incluirInactivas, setIncluirInactivas] = useState(false);
  const [aCriar, setACriar] = useState(false);
  const [aEditar, setAEditar] = useState<UnidadeMedida | null>(null);

  const { data: unidades, isLoading } = useQuery({
    queryKey: ['unidades', incluirInactivas],
    queryFn: () => unidadesApi.listar(incluirInactivas),
  });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['unidades'] });

  const aoFalhar = (erro: any) =>
    toast.error(erro?.response?.data?.message || 'Não foi possível concluir a operação.');

  const criar = useMutation({
    mutationFn: unidadesApi.criar,
    onSuccess: (u) => {
      invalidar();
      setACriar(false);
      toast.success(`Unidade ${u.codigo} criada.`);
    },
    onError: aoFalhar,
  });

  const actualizar = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Parameters<typeof unidadesApi.actualizar>[1]) =>
      unidadesApi.actualizar(id, payload),
    onSuccess: () => {
      invalidar();
      // As conversões dos produtos mostram o código e o nome desta unidade.
      queryClient.invalidateQueries({ queryKey: ['conversoes'] });
      setAEditar(null);
      toast.success('Unidade actualizada.');
    },
    onError: aoFalhar,
  });

  const desactivar = useMutation({
    mutationFn: unidadesApi.desactivar,
    onSuccess: () => {
      invalidar();
      toast.success('Unidade retirada de uso. O histórico continua a referenciá-la.');
    },
    onError: aoFalhar,
  });

  return (
    <div className="space-y-4">
      <Card className="border-blue-100 bg-blue-50/50">
        <div className="flex gap-3 p-4">
          <Info className="mt-0.5 shrink-0 text-blue-500" size={18} />
          <div className="text-sm text-blue-900">
            <p>
              As unidades que já cá estão foram criadas a partir do que o catálogo tinha
              escrito. O que falta a um produto para poder ser comprado à caixa é declarar
              quantas unidades base cabem numa — e isso faz-se na ficha do produto, porque uma
              caixa de arroz tem 10 sacos e uma de sabão tem 24 barras.
            </p>
            <p className="mt-1 text-blue-800">
              O código não muda depois de criado: aparece impresso em documentos já emitidos.
              Para o mudar, cria-se outra e desactiva-se esta.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={incluirInactivas}
            onChange={(e) => setIncluirInactivas(e.target.checked)}
            className="rounded border-slate-300"
          />
          Mostrar as retiradas de uso
        </label>

        <Button onClick={() => setACriar(true)}>
          <Plus size={16} className="mr-1.5" />
          Nova unidade
        </Button>
      </div>

      {isLoading && <p className="text-sm text-slate-400">A carregar…</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Código</th>
              <th className="px-3 py-2 text-left font-medium">Nome</th>
              <th className="px-3 py-2 text-left font-medium">Tipo</th>
              <th className="px-3 py-2 text-right font-medium">Casas decimais</th>
              <th className="w-12" />
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {unidades?.map((u) => (
              <tr key={u.id} className={cn(!u.isActive && 'opacity-50')}>
                <td className="px-3 py-2 font-semibold text-slate-900">{u.codigo}</td>
                <td className="px-3 py-2 text-slate-700">{u.nome}</td>
                <td className="px-3 py-2">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-medium',
                      u.tipo === 'CONTINUA'
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-slate-100 text-slate-600',
                    )}
                  >
                    {u.tipo === 'CONTINUA' ? 'Contínua (pesa-se)' : 'Discreta (conta-se)'}
                  </span>
                </td>
                <td className="px-3 py-2 text-right text-slate-600">{u.casasDecimais}</td>
                <td className="px-2 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setAEditar(u)}
                      title="Corrigir nome, símbolo ou tipo"
                      className="text-slate-400 hover:text-indigo-600"
                    >
                      <Pencil size={15} />
                    </button>
                    {u.isActive ? (
                      <button
                        onClick={() => desactivar.mutate(u.id)}
                        title="Retirar de uso"
                        className="text-slate-400 hover:text-red-600"
                      >
                        <Power size={15} />
                      </button>
                    ) : (
                      // Reactivar existia no servidor (`isActive` no PATCH) e não tinha
                      // botão: uma unidade retirada por engano ficava retirada.
                      <button
                        onClick={() => actualizar.mutate({ id: u.id, isActive: true })}
                        title="Voltar a pôr em uso"
                        className="text-slate-400 hover:text-emerald-600"
                      >
                        <RotateCcw size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {unidades?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-400">
                  Nenhuma unidade.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {aCriar && (
        <ModalNovaUnidade
          aoFechar={() => setACriar(false)}
          aoCriar={(payload) => criar.mutate(payload)}
          aGravar={criar.isPending}
        />
      )}

      {aEditar && (
        <ModalEditarUnidade
          unidade={aEditar}
          aoFechar={() => setAEditar(null)}
          aoGravar={(payload) => actualizar.mutate({ id: aEditar.id, ...payload })}
          aGravar={actualizar.isPending}
        />
      )}
    </div>
  );
}

function ModalEditarUnidade({
  unidade,
  aoFechar,
  aoGravar,
  aGravar,
}: {
  unidade: UnidadeMedida;
  aoFechar: () => void;
  aoGravar: (payload: {
    nome?: string;
    simbolo?: string;
    tipo?: string;
    casasDecimais?: number;
  }) => void;
  aGravar: boolean;
}) {
  const [nome, setNome] = useState(unidade.nome);
  const [simbolo, setSimbolo] = useState(unidade.simbolo ?? '');
  const [continua, setContinua] = useState(unidade.tipo === 'CONTINUA');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="font-semibold text-slate-900">Editar unidade {unidade.codigo}</h3>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            O código <span className="font-semibold text-slate-700">{unidade.codigo}</span> não
            se altera: está impresso em documentos já emitidos, e mudá-lo reescreveria o que
            eles dizem. Para outro código, cria-se outra unidade e retira-se esta de uso.
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Símbolo <span className="text-slate-400">(opcional)</span>
            </label>
            <input
              value={simbolo}
              onChange={(e) => setSimbolo(e.target.value)}
              placeholder="kg"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-400">
              O que aparece ao lado do número nos ecrãs e recibos.
            </p>
          </div>

          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={continua}
              onChange={(e) => setContinua(e.target.checked)}
              className="mt-1 rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">
              Pesa-se ou mede-se
              <span className="block text-xs text-slate-400">
                Passar de contável a mensurável abre as casas decimais; ao contrário, o
                servidor recusa se houver saldos fraccionados que passariam a ser inválidos.
              </span>
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <Button variant="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button
            disabled={!nome.trim() || aGravar}
            onClick={() =>
              aoGravar({
                nome: nome.trim(),
                simbolo: simbolo.trim() || undefined,
                tipo: continua ? 'CONTINUA' : 'DISCRETA',
                casasDecimais: continua ? Math.max(unidade.casasDecimais, 3) : 0,
              })
            }
          >
            Gravar
          </Button>
        </div>
      </div>
    </div>
  );
}

function ModalNovaUnidade({
  aoFechar,
  aoCriar,
  aGravar,
}: {
  aoFechar: () => void;
  aoCriar: (payload: {
    codigo: string;
    nome: string;
    simbolo?: string;
    tipo?: string;
    casasDecimais?: number;
  }) => void;
  aGravar: boolean;
}) {
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [continua, setContinua] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="font-semibold text-slate-900">Nova unidade de medida</h3>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="text-sm font-medium text-slate-700">Código</label>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="CX"
              maxLength={8}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase focus:border-blue-400 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-400">
              Guardado em maiúsculas, e não muda depois de criado.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Caixa"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>

          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={continua}
              onChange={(e) => setContinua(e.target.checked)}
              className="mt-1 rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">
              Pesa-se ou mede-se
              <span className="block text-xs text-slate-400">
                Aceita quantidades fraccionadas, até três casas. Sem isto, meia caixa não é uma
                quantidade que alguém possa receber ou vender — que é o que se quer para
                unidades que se contam.
              </span>
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <Button variant="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button
            disabled={!codigo.trim() || !nome.trim() || aGravar}
            onClick={() =>
              aoCriar({
                codigo: codigo.trim(),
                nome: nome.trim(),
                tipo: continua ? 'CONTINUA' : 'DISCRETA',
                casasDecimais: continua ? 3 : 0,
              })
            }
          >
            Criar
          </Button>
        </div>
      </div>
    </div>
  );
}
