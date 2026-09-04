import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Info, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button, Card, ConfirmDialog } from '@/shared/ui';
import { cn } from '@/shared/utils';
import { catalogApi } from '../api/catalog.api';
import type { Category } from '../types';

/**
 * As categorias de produto da empresa.
 *
 * ## Porque este painel faltava
 *
 * O backend tinha o CRUD completo — criar, ler, editar e apagar. O frontend chamava
 * **apenas a listagem**, para preencher o selector da ficha do produto. Não havia forma de
 * criar uma categoria pela aplicação: ou entravam por SQL, ou o campo `categoriaId` de
 * todos os produtos ficava vazio.
 *
 * ## Apagar contra desactivar
 *
 * As duas existem e não são a mesma coisa. Apagar é para uma categoria criada por engano;
 * o servidor recusa-o quando há produtos a apontar para ela, porque apagá-la deixaria o
 * catálogo a referenciar uma linha que já não existe. Desactivar é para uma categoria que
 * cumpriu o seu tempo: sai das escolhas novas e os produtos antigos continuam a lê-la.
 */
export function PainelDeCategorias() {
  const queryClient = useQueryClient();
  const [aEditar, setAEditar] = useState<Category | null>(null);
  const [aCriar, setACriar] = useState(false);
  const [aApagar, setAApagar] = useState<Category | null>(null);

  const { data: categorias, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => catalogApi.getCategories(),
  });

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    // O selector da ficha do produto e a grelha do POS leem daqui.
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const aoFalhar = (erro: any) =>
    toast.error(erro?.response?.data?.message || 'Não foi possível concluir a operação.');

  const criar = useMutation({
    mutationFn: catalogApi.createCategory,
    onSuccess: (c) => {
      invalidar();
      setACriar(false);
      toast.success(`Categoria "${c.nome}" criada.`);
    },
    onError: aoFalhar,
  });

  const actualizar = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Parameters<typeof catalogApi.updateCategory>[1]) =>
      catalogApi.updateCategory(id, payload),
    onSuccess: () => {
      invalidar();
      setAEditar(null);
      toast.success('Categoria actualizada.');
    },
    onError: aoFalhar,
  });

  const apagar = useMutation({
    mutationFn: (id: string) => catalogApi.deleteCategory(id),
    onSuccess: () => {
      invalidar();
      setAApagar(null);
      toast.success('Categoria apagada.');
    },
    onError: (erro: any) => {
      setAApagar(null);
      aoFalhar(erro);
    },
  });

  return (
    <div className="space-y-4">
      <Card className="border-blue-100 bg-blue-50/50">
        <div className="flex gap-3 p-4">
          <Info className="mt-0.5 shrink-0 text-blue-500" size={18} />
          <div className="text-sm text-blue-900">
            <p>
              A categoria é o que agrupa produtos nos botões do POS, nos relatórios por família
              e na análise ABC. Um catálogo sem categorias funciona, mas nenhuma dessas leituras
              consegue distinguir bebidas de detergentes.
            </p>
            <p className="mt-1 text-blue-800">
              Desactivar retira a categoria das escolhas novas e mantém os produtos que já a
              usam. Apagar só é aceite quando nenhum produto lhe aponta.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-end">
        <Button onClick={() => setACriar(true)}>
          <Plus size={16} className="mr-1.5" />
          Nova categoria
        </Button>
      </div>

      {isLoading && <p className="text-sm text-slate-400">A carregar…</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[32rem] text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Nome</th>
              <th className="px-3 py-2 text-left font-medium">Descrição</th>
              <th className="px-3 py-2 text-left font-medium">Estado</th>
              <th className="w-20" />
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {categorias?.map((c) => (
              <tr key={c.id} className={cn(c.isActive === false && 'opacity-50')}>
                <td className="px-3 py-2 font-semibold text-slate-900">{c.nome}</td>
                <td className="px-3 py-2 text-slate-500">
                  {c.descricao || <span className="text-slate-300">—</span>}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-medium',
                      c.isActive === false
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-emerald-100 text-emerald-700',
                    )}
                  >
                    {c.isActive === false ? 'Retirada de uso' : 'Activa'}
                  </span>
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setAEditar(c)}
                      title="Editar"
                      className="text-slate-400 hover:text-indigo-600"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setAApagar(c)}
                      title="Apagar"
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {categorias?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-sm text-slate-400">
                  Nenhuma categoria. Os produtos ficam todos sem família.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(aCriar || aEditar) && (
        <ModalDeCategoria
          categoria={aEditar}
          aGravar={criar.isPending || actualizar.isPending}
          aoFechar={() => {
            setACriar(false);
            setAEditar(null);
          }}
          aoGravar={(payload) =>
            aEditar
              ? actualizar.mutate({ id: aEditar.id, ...payload })
              : criar.mutate({ nome: payload.nome!, descricao: payload.descricao })
          }
        />
      )}

      <ConfirmDialog
        isOpen={!!aApagar}
        title="Apagar categoria"
        message={
          `Apagar "${aApagar?.nome ?? ''}" é definitivo. Se houver produtos nesta categoria, ` +
          'o servidor recusa — nesse caso, edite-a e retire-a de uso em vez de a apagar.'
        }
        confirmText="Apagar"
        variant="danger"
        isLoading={apagar.isPending}
        onConfirm={() => aApagar && apagar.mutate(aApagar.id)}
        onCancel={() => setAApagar(null)}
      />
    </div>
  );
}

function ModalDeCategoria({
  categoria,
  aGravar,
  aoGravar,
  aoFechar,
}: {
  categoria: Category | null;
  aGravar: boolean;
  aoGravar: (payload: {
    nome?: string;
    descricao?: string;
    isActive?: boolean;
  }) => void;
  aoFechar: () => void;
}) {
  const [nome, setNome] = useState(categoria?.nome ?? '');
  const [descricao, setDescricao] = useState(categoria?.descricao ?? '');
  const [activa, setActiva] = useState(categoria?.isActive !== false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="font-semibold text-slate-900">
            {categoria ? `Editar "${categoria.nome}"` : 'Nova categoria'}
          </h3>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="text-sm font-medium text-slate-700">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Bebidas"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Descrição <span className="text-slate-400">(opcional)</span>
            </label>
            <input
              value={descricao ?? ''}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Refrigerantes, sumos e águas"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>

          {/* Só na edição: uma categoria criada inactiva não serviria para nada. */}
          {categoria && (
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={activa}
                onChange={(e) => setActiva(e.target.checked)}
                className="mt-1 rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">
                Disponível para produtos novos
                <span className="block text-xs text-slate-400">
                  Desligar retira-a das escolhas sem mexer nos produtos que já a usam.
                </span>
              </span>
            </label>
          )}
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
                descricao: descricao?.trim() || undefined,
                ...(categoria ? { isActive: activa } : {}),
              })
            }
          >
            {categoria ? 'Gravar' : 'Criar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
