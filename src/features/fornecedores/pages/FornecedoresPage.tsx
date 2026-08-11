import { useState, useEffect } from 'react';
import {
  Truck, Plus, Search, Edit2, X, Loader2, Mail, Phone, Globe, MapPin, Ban, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { suppliersApi } from '@/features/fornecedores';
import type { Supplier, SupplierPayload } from '@/features/fornecedores';
import { cn } from '@/shared/utils';

const VAZIO: SupplierPayload = {
  nome: '',
  nuit: '',
  tipoFornecimento: '',
  email: '',
  telefone: '',
  endereco: '',
  website: '',
};

export function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SupplierPayload>(VAZIO);

  const carregar = async () => {
    setIsLoading(true);
    try {
      setFornecedores(await suppliersApi.getSuppliers());
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao carregar fornecedores.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const abrirCriacao = () => {
    setEditingId(null);
    setForm(VAZIO);
    setShowModal(true);
  };

  const abrirEdicao = (f: Supplier) => {
    setEditingId(f.id);
    setForm({
      nome: f.nome,
      nuit: f.nuit ?? '',
      tipoFornecimento: f.tipoFornecimento ?? '',
      email: f.email ?? '',
      telefone: f.telefone ?? '',
      endereco: f.endereco ?? '',
      website: f.website ?? '',
    });
    setShowModal(true);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return toast.error('O nome do fornecedor é obrigatório.');

    setIsSaving(true);
    try {
      // Campos vazios são omitidos: enviar strings vazias gravaria "" em vez de
      // deixar o campo por preencher.
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => String(v ?? '').trim() !== ''),
      ) as SupplierPayload;

      if (editingId) {
        await suppliersApi.updateSupplier(editingId, payload);
        toast.success('Fornecedor actualizado.');
      } else {
        await suppliersApi.createSupplier(payload);
        toast.success('Fornecedor criado.');
      }
      setShowModal(false);
      carregar();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao guardar fornecedor.');
    } finally {
      setIsSaving(false);
    }
  };

  const alternarEstado = async (f: Supplier) => {
    const acao = f.isActive ? 'suspender' : 'reactivar';
    if (!confirm(`Deseja ${acao} o fornecedor ${f.nome}?`)) return;

    try {
      // Suspender em vez de apagar: um fornecedor suspenso não aceita pedidos novos
      // mas o histórico de compras mantém-se intacto.
      await suppliersApi.updateSupplier(f.id, { isActive: !f.isActive });
      toast.success(f.isActive ? 'Fornecedor suspenso.' : 'Fornecedor reactivado.');
      carregar();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || `Erro ao ${acao} fornecedor.`);
    }
  };

  const termo = searchTerm.trim().toLowerCase();
  const filtrados = termo
    ? fornecedores.filter((f) =>
        [f.nome, f.nuit, f.email, f.telefone, f.tipoFornecimento]
          .filter(Boolean)
          .some((campo) => String(campo).toLowerCase().includes(termo)),
      )
    : fornecedores;

  const activos = fornecedores.filter((f) => f.isActive).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="text-blue-600" size={26} /> Fornecedores
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {fornecedores.length} fornecedor(es) · {activos} activo(s)
          </p>
        </div>
        <button
          onClick={abrirCriacao}
          className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} /> Novo Fornecedor
        </button>
      </div>

      {/* Pesquisa */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar por nome, NUIT, email ou telefone..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
      </div>

      {/* Listagem */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-3" />
            A carregar fornecedores...
          </div>
        ) : filtrados.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Truck className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            {termo
              ? `Nenhum fornecedor corresponde a "${searchTerm}".`
              : 'Ainda não há fornecedores registados.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Fornecedor</th>
                  <th className="text-left font-medium px-4 py-3">Contactos</th>
                  <th className="text-left font-medium px-4 py-3">NUIT</th>
                  <th className="text-left font-medium px-4 py-3">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrados.map((f) => (
                  <tr key={f.id} className={cn('hover:bg-slate-50', !f.isActive && 'opacity-60')}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{f.nome}</p>
                      {f.tipoFornecimento && (
                        <p className="text-xs text-slate-500">{f.tipoFornecimento}</p>
                      )}
                      {f.endereco && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin size={11} /> {f.endereco}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
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
                    <td className="px-4 py-3 text-slate-600">{f.nuit || '—'}</td>
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
                          onClick={() => abrirEdicao(f)}
                          title="Editar"
                          className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => alternarEstado(f)}
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
        histórico de compras mantém-se intacto.
      </p>

      {/* Modal de criação/edição */}
      {showModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardar} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nome <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  autoFocus
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">NUIT</label>
                  <input
                    type="text"
                    value={form.nuit}
                    onChange={(e) => setForm({ ...form, nuit: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tipo de fornecimento
                  </label>
                  <input
                    type="text"
                    value={form.tipoFornecimento}
                    onChange={(e) => setForm({ ...form, tipoFornecimento: e.target.value })}
                    placeholder="Ex: Bebidas"
                    className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                <input
                  type="text"
                  value={form.endereco}
                  onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                <input
                  type="text"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-slate-600 font-medium rounded-xl hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!form.nome.trim() || isSaving}
                  className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving && <Loader2 size={16} className="animate-spin" />}
                  {editingId ? 'Guardar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
