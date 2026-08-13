import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Truck, Plus, Search, Edit2, Loader2, Mail, Phone, Globe, MapPin, Ban, CheckCircle2,
  BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { suppliersApi } from '../api/suppliers.api';
import type { Supplier } from '../api/suppliers.api';
import { FornecedorFormModal } from './FornecedorFormModal';
import { FornecedorDetailsModal } from './FornecedorDetailsModal';
import { ConfirmDialog } from '@/shared/ui';
import { cn } from '@/shared/utils';

/**
 * A lista de fornecedores, sem cabeçalho de página.
 *
 * ## Porque existe
 *
 * Fornecedores estava em dois lugares: uma entrada no menu com CRUD completo, e um
 * separador dentro de Compras que era uma tabela de quatro colunas só de leitura — sem
 * criar, sem editar, sem suspender. Duas vistas dos mesmos dados, uma delas incompleta.
 *
 * Fica só nas Compras, que é onde os fornecedores importam: encomenda-se a um
 * fornecedor, e a pergunta «a quem compro isto?» faz-se no contexto de uma compra.
 *
 * Passa a usar TanStack Query em vez de `useState` + `useEffect`: a lista de
 * fornecedores é lida por vários pontos desta secção (o selector do modal de pedido,
 * a sugestão de compras) e sem cache seria buscada de novo a cada abertura.
 */
export function FornecedoresTab() {
  const queryClient = useQueryClient();
  const [pesquisa, setPesquisa] = useState('');

  const [aEditar, setAEditar] = useState<{ fornecedor?: Supplier } | null>(null);
  const [aVer, setAVer] = useState<Supplier | null>(null);
  const [aAlternar, setAAlternar] = useState<Supplier | null>(null);
  const [aGuardar, setAGuardar] = useState(false);

  const { data: fornecedores = [], isLoading } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => suppliersApi.getSuppliers(),
  });

  const recarregar = () => queryClient.invalidateQueries({ queryKey: ['fornecedores'] });

  const alternarEstado = async () => {
    if (!aAlternar) return;
    const activo = aAlternar.isActive;

    setAGuardar(true);
    try {
      // Suspender em vez de apagar: um fornecedor suspenso não aceita pedidos novos
      // mas o histórico de compras mantém-se intacto — e é esse histórico que sustenta
      // as medidas de prazo e pontualidade.
      await suppliersApi.updateSupplier(aAlternar.id, { isActive: !activo });
      toast.success(activo ? 'Fornecedor suspenso.' : 'Fornecedor reactivado.');
      recarregar();
      setAAlternar(null);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          `Erro ao ${activo ? 'suspender' : 'reactivar'} o fornecedor.`,
      );
    } finally {
      setAGuardar(false);
    }
  };

  const termo = pesquisa.trim().toLowerCase();
  const filtrados = termo
    ? fornecedores.filter((f) =>
        [f.nome, f.nuit, f.email, f.telefone, f.tipoFornecimento]
          .filter(Boolean)
          .some((campo) => String(campo).toLowerCase().includes(termo)),
      )
    : fornecedores;

  const activos = fornecedores.filter((f) => f.isActive).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar por nome, NUIT, email ou telefone..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden whitespace-nowrap text-xs text-slate-500 sm:inline">
            {fornecedores.length} no total · {activos} activo(s)
          </span>
          <button
            onClick={() => setAEditar({})}
            className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={16} /> Novo Fornecedor
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-600" />
            A carregar fornecedores...
          </div>
        ) : filtrados.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Truck className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            {termo
              ? `Nenhum fornecedor corresponde a "${pesquisa}".`
              : 'Ainda não há fornecedores registados.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Fornecedor</th>
                  <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Contactos</th>
                  <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">NUIT</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrados.map((f) => (
                  <tr key={f.id} className={cn('hover:bg-slate-50', !f.isActive && 'opacity-60')}>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setAVer(f)}
                        className="text-left font-medium text-slate-900 hover:text-blue-600 hover:underline"
                        title="Ver desempenho e histórico"
                      >
                        {f.nome}
                      </button>
                      {f.tipoFornecimento && (
                        <p className="text-xs text-slate-500">{f.tipoFornecimento}</p>
                      )}
                      {f.endereco && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                          <MapPin size={11} /> {f.endereco}
                        </p>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-600 md:table-cell">
                      {f.email && (
                        <p className="flex items-center gap-1.5 text-xs">
                          <Mail size={12} className="text-slate-400" /> {f.email}
                        </p>
                      )}
                      {f.telefone && (
                        <p className="flex items-center gap-1.5 text-xs">
                          <Phone size={12} className="text-slate-400" /> {f.telefone}
                        </p>
                      )}
                      {f.website && (
                        <p className="flex items-center gap-1.5 text-xs">
                          <Globe size={12} className="text-slate-400" /> {f.website}
                        </p>
                      )}
                      {!f.email && !f.telefone && !f.website && (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                      {f.nuit || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold',
                          f.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-200 text-slate-600',
                        )}
                      >
                        {f.isActive ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                        {f.isActive ? 'Activo' : 'Suspenso'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setAVer(f)}
                          title="Desempenho e histórico"
                          className="p-2 text-slate-400 transition-colors hover:text-blue-600"
                        >
                          <BarChart3 size={16} />
                        </button>
                        <button
                          onClick={() => setAEditar({ fornecedor: f })}
                          title="Editar"
                          className="p-2 text-slate-400 transition-colors hover:text-blue-600"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setAAlternar(f)}
                          title={f.isActive ? 'Suspender' : 'Reactivar'}
                          className={cn(
                            'p-2 transition-colors',
                            f.isActive
                              ? 'text-slate-400 hover:text-rose-500'
                              : 'text-slate-400 hover:text-emerald-600',
                          )}
                        >
                          {f.isActive ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Um fornecedor <strong>suspenso</strong> não pode receber pedidos de compra novos, mas o
        histórico mantém-se intacto. Clique no nome para ver o prazo de entrega e a pontualidade.
      </p>

      {aEditar && (
        <FornecedorFormModal
          fornecedor={aEditar.fornecedor}
          onClose={() => setAEditar(null)}
          onSaved={recarregar}
        />
      )}

      {aVer && <FornecedorDetailsModal fornecedor={aVer} onClose={() => setAVer(null)} />}

      <ConfirmDialog
        isOpen={aAlternar !== null}
        title={aAlternar?.isActive ? 'Suspender fornecedor' : 'Reactivar fornecedor'}
        message={
          aAlternar
            ? aAlternar.isActive
              ? `Suspender "${aAlternar.nome}"? Deixa de poder receber pedidos novos, mas o histórico de compras mantém-se.`
              : `Reactivar "${aAlternar.nome}"? Volta a poder receber pedidos de compra.`
            : ''
        }
        confirmText={aAlternar?.isActive ? 'Suspender' : 'Reactivar'}
        variant={aAlternar?.isActive ? 'warning' : 'info'}
        isLoading={aGuardar}
        onConfirm={alternarEstado}
        onCancel={() => setAAlternar(null)}
      />
    </div>
  );
}
