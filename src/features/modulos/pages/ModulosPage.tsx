import { useState } from 'react';
import { Blocks, Plus, Loader2, X, Edit2, Trash2, Power } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useModulos,
  useCriarModulo,
  useActualizarModulo,
  useMudarEstadoModulo,
  useApagarModulo,
} from '../hooks/useModulos';
import type { Modulo } from '../api/modulos.api';
import { ConfirmDialog } from '@/shared/ui';
import { cn } from '@/shared/utils';

const mt = (v: number) =>
  `${Number(v).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT`;

/**
 * O catálogo global de módulos: o que existe para uma empresa contratar.
 *
 * ## Página de plataforma, não de uma empresa
 *
 * É o mesmo catálogo que `/empresas` lista para escolher o que uma empresa subscreve —
 * aqui é o CRUD em si, e só faz sentido para quem administra o SaaS.
 */
export function ModulosPage() {
  const [incluirInativos, setIncluirInativos] = useState(false);
  const { data: modulos = [], isLoading } = useModulos(incluirInativos);

  const [aCriar, setACriar] = useState(false);
  const [aEditar, setAEditar] = useState<Modulo | null>(null);
  const [aApagar, setAApagar] = useState<Modulo | null>(null);

  const mudarEstado = useMudarEstadoModulo();
  const apagar = useApagarModulo();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-900 p-2.5">
            <Blocks className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Módulos</h2>
            <p className="text-sm text-slate-500">O catálogo do que as empresas podem contratar</p>
          </div>
        </div>

        <button
          onClick={() => setACriar(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={16} /> Novo módulo
        </button>
      </div>

      <label className="flex w-fit items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={incluirInativos}
          onChange={(e) => setIncluirInativos(e.target.checked)}
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        Mostrar módulos desactivados
      </label>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin text-slate-400" />
        </div>
      ) : modulos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 py-14 text-center">
          <Blocks size={26} className="mx-auto text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">Ainda não há módulos no catálogo.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Módulo</th>
                <th className="px-3 py-2.5 font-medium">Código</th>
                <th className="px-3 py-2.5 text-right font-medium">Preço / mês</th>
                <th className="px-3 py-2.5 font-medium">Estado</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {modulos.map((m) => (
                <tr key={m.id} className={cn('hover:bg-slate-50/60', !m.isAtivo && 'opacity-60')}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{m.nome}</p>
                    {m.descricao && (
                      <p className="mt-0.5 max-w-md text-xs text-slate-500">{m.descricao}</p>
                    )}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-500">{m.codigo}</td>
                  <td className="px-3 py-3 text-right text-slate-700">{mt(m.precoMensal)}</td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                        m.isAtivo
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500',
                      )}
                    >
                      {m.isAtivo ? 'Activo' : 'Desactivado'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => mudarEstado.mutate({ id: m.id, isAtivo: !m.isAtivo })}
                        title={m.isAtivo ? 'Desactivar' : 'Activar'}
                        className={cn(
                          'p-2 transition-colors',
                          m.isAtivo
                            ? 'text-slate-400 hover:text-amber-600'
                            : 'text-slate-400 hover:text-emerald-600',
                        )}
                      >
                        <Power size={15} />
                      </button>
                      <button
                        onClick={() => setAEditar(m)}
                        title="Editar"
                        className="p-2 text-slate-400 transition-colors hover:text-indigo-600"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => setAApagar(m)}
                        title="Apagar"
                        className="p-2 text-slate-400 transition-colors hover:text-rose-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(aCriar || aEditar) && (
        <ModuloModal modulo={aEditar} onClose={() => { setACriar(false); setAEditar(null); }} />
      )}

      <ConfirmDialog
        isOpen={aApagar !== null}
        title="Apagar módulo"
        message={
          aApagar
            ? `Apagar «${aApagar.nome}»? Se houver empresas com este módulo activo, o servidor recusa — desactive-o em vez disso.`
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

function ModuloModal({ modulo, onClose }: { modulo: Modulo | null; onClose: () => void }) {
  const [form, setForm] = useState({
    codigo: modulo?.codigo ?? '',
    nome: modulo?.nome ?? '',
    descricao: modulo?.descricao ?? '',
    precoMensal: modulo ? String(modulo.precoMensal) : '',
    ordem: modulo ? String(modulo.ordem) : '0',
  });

  const criar = useCriarModulo();
  const actualizar = useActualizarModulo();
  const isSaving = criar.isPending || actualizar.isPending;

  const submeter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.codigo.trim()) return toast.error('Indique o código do módulo.');
    if (!form.nome.trim()) return toast.error('Indique o nome do módulo.');
    const preco = Number(form.precoMensal);
    if (!(preco >= 0)) return toast.error('O preço mensal tem de ser um número válido.');

    const dto = {
      codigo: form.codigo.trim(),
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || undefined,
      precoMensal: preco,
      ordem: form.ordem ? Number(form.ordem) : undefined,
    };

    if (modulo) {
      actualizar.mutate({ id: modulo.id, dto }, { onSuccess: onClose });
    } else {
      criar.mutate(dto, { onSuccess: onClose });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6">
          <h2 className="text-lg font-bold text-slate-900">
            {modulo ? 'Editar módulo' : 'Novo módulo'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submeter} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Código</label>
              <input
                type="text"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                placeholder="Ex.: pos"
                disabled={!!modulo}
                className="w-full rounded-xl border px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Ordem</label>
              <input
                type="number"
                value={form.ordem}
                onChange={(e) => setForm({ ...form, ordem: e.target.value })}
                min={0}
                className="w-full rounded-xl border px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nome</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex.: Ponto de Venda"
              className="w-full rounded-xl border px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Descrição <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <textarea
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              rows={2}
              className="w-full rounded-xl border px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Preço mensal (MT)
            </label>
            <input
              type="number"
              value={form.precoMensal}
              onChange={(e) => setForm({ ...form, precoMensal: e.target.value })}
              min={0}
              step="0.01"
              className="w-full rounded-xl border px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
