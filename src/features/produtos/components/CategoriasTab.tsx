import { useState } from 'react';
import { Tag, Plus, Loader2, X, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../hooks/useCatalog';
import type { Category } from '../types';
import { ConfirmDialog } from '@/shared/ui';

/**
 * As categorias do catálogo — o que agrupa os produtos no POS e nos filtros.
 *
 * Antes só se liam aqui dentro de `ProductFormModal`, num `<select>`: criar uma categoria
 * nova exigia ir à base de dados directamente. O CRUD já existia no backend, só faltava
 * este ecrã.
 */
export function CategoriasTab() {
  const { data: categorias = [], isLoading } = useCategories();
  const [aCriar, setACriar] = useState(false);
  const [aEditar, setAEditar] = useState<Category | null>(null);
  const [aApagar, setAApagar] = useState<Category | null>(null);

  const apagar = useDeleteCategory();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Agrupam os produtos no catálogo, no POS e nos filtros de listagem.
        </p>
        <button
          onClick={() => setACriar(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus size={16} /> Nova categoria
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin text-slate-400" />
        </div>
      ) : categorias.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 py-14 text-center">
          <Tag size={26} className="mx-auto text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">Ainda não há categorias.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {categorias.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                {c.imagemUrl ? (
                  <img src={c.imagemUrl} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-100">
                    <Tag size={14} className="text-slate-400" />
                  </div>
                )}
                <span className="truncate text-sm font-medium text-slate-900">{c.nome}</span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => setAEditar(c)}
                  title="Editar"
                  className="p-1.5 text-slate-400 hover:text-indigo-600"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => setAApagar(c)}
                  title="Apagar"
                  className="p-1.5 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(aCriar || aEditar) && (
        <CategoriaModal categoria={aEditar} onClose={() => { setACriar(false); setAEditar(null); }} />
      )}

      <ConfirmDialog
        isOpen={aApagar !== null}
        title="Apagar categoria"
        message={
          aApagar
            ? `Apagar «${aApagar.nome}»? Se houver produtos nesta categoria, o servidor recusa — mova-os primeiro.`
            : ''
        }
        confirmText="Apagar"
        variant="danger"
        isLoading={apagar.isPending}
        onConfirm={() => {
          if (!aApagar) return;
          apagar.mutate(aApagar.id, { onSettled: () => setAApagar(null) });
        }}
        onCancel={() => setAApagar(null)}
      />
    </div>
  );
}

function CategoriaModal({ categoria, onClose }: { categoria: Category | null; onClose: () => void }) {
  const [nome, setNome] = useState(categoria?.nome ?? '');
  const [imagemUrl, setImagemUrl] = useState(categoria?.imagemUrl ?? '');

  const criar = useCreateCategory();
  const actualizar = useUpdateCategory();
  const isSaving = criar.isPending || actualizar.isPending;

  const submeter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return toast.error('Indique o nome da categoria.');

    const dto = { nome: nome.trim(), imagemUrl: imagemUrl.trim() || undefined };

    if (categoria) {
      actualizar.mutate({ id: categoria.id, dto }, { onSuccess: onClose });
    } else {
      criar.mutate(dto, { onSuccess: onClose });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <form onSubmit={submeter} className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {categoria ? 'Editar categoria' : 'Nova categoria'}
          </h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Bebidas"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Imagem <span className="font-normal text-slate-400">(URL, opcional)</span>
            </label>
            <input
              value={imagemUrl}
              onChange={(e) => setImagemUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <p className="mt-1 text-xs text-slate-400">Usada no botão da categoria no POS.</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSaving && <Loader2 size={14} className="animate-spin" />}
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
