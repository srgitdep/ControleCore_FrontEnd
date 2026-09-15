import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  UserSquare,
  PieChart,
  Megaphone,
  Sparkles,
  SlidersHorizontal,
  GitMerge,
  Trash2,
  Edit2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  useClientes,
  useCreateCliente,
  useUpdateCliente,
  useDeleteCliente,
} from '../hooks/useClientes';
import type { Cliente } from '../api/clientes.api';
import { Visao360Panel } from '../components/Visao360Panel';
import { SegmentosPanel } from '../components/SegmentosPanel';
import { CampanhasPanel } from '../components/CampanhasPanel';
import { AnalisePanel } from '../components/AnalisePanel';
import { ConfiguracaoPanel } from '../components/ConfiguracaoPanel';
import { FusaoDuplicadosPanel } from '../components/FusaoDuplicadosPanel';
import { cn } from '@/shared/utils';
import toast from 'react-hot-toast';
import { TableScroll, ConfirmDialog } from '@/shared/ui';
import { usePermissions } from '@/features/auth';

// ──â”€ Debounce hook ────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ──â”€ Tab Definition ──────────────────────────────────────────────────────────â”€
type Tab = 'clientes' | 'analise' | 'segmentos' | 'campanhas' | 'duplicados' | 'definicoes' | 'detalhes';

// ──â”€ Create/Edit Modal ────────────────────────────────────────────────────────
interface ClienteModalProps {
  cliente?: Cliente | null;
  onClose: () => void;
  onSave: (data: any) => void;
  isSaving: boolean;
}

function ClienteModal({ cliente, onClose, onSave, isSaving }: ClienteModalProps) {
  const [form, setForm] = useState({
    nome: cliente?.nome ?? '',
    telefone: cliente?.telefone ?? '',
    email: cliente?.email ?? '',
    nuit: cliente?.nuit ?? '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return toast.error('O nome é obrigatório.');
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            {cliente ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {[
            { key: 'nome', label: 'Nome Completo *', type: 'text', placeholder: 'Ex: João Silva' },
            { key: 'telefone', label: 'Telefone', type: 'tel', placeholder: '+258 84 000 0000' },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'cliente@email.com' },
            { key: 'nuit', label: 'NUIT', type: 'text', placeholder: '000000000' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
              <input
                type={type}
                value={(form as any)[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              {isSaving ? 'A guardar…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ──â”€ Main Page ────────────────────────────────────────────────────────────────
export function ClientesPage() {
  const { hasPermission } = usePermissions();
  const podeFundir = hasPermission('manage', 'clientes');
  const [activeTab, setActiveTab] = useState<Tab>('clientes');
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  // O `confirm()` nativo do browser bloqueia a janela e não se estiliza; o
  // projecto já tem um `ConfirmDialog`, e apagar um cliente merece o mesmo
  // cuidado que as outras eliminações da aplicação.
  const [aEliminar, setAEliminar] = useState<Cliente | null>(null);
  const debouncedSearch = useDebounce(search, 500);

  // Reset page when search changes
  useEffect(() => setPage(1), [debouncedSearch]);

  const { data, isLoading } = useClientes({ page, limit: 15, search: debouncedSearch || undefined });

  const clientes = data?.data ?? [];
  const lastPage = data?.lastPage ?? 1;
  const total = data?.total ?? 0;

  const { mutate: criarMutate, isPending: isCreatingMutate } = useCreateCliente();
  const { mutate: atualizarMutate, isPending: isUpdatingMutate } = useUpdateCliente();
  const { mutate: apagar, isPending: isApagando } = useDeleteCliente();

  const isCreating = isCreatingMutate || isUpdatingMutate;

  const criar = (payload: any) => {
    if (editingCliente) {
      atualizarMutate(
        { id: editingCliente.id, data: payload },
        {
          onSuccess: () => {
            setShowModal(false);
            setEditingCliente(null);
          },
        }
      );
    } else {
      criarMutate(payload, {
        onSuccess: () => {
          setShowModal(false);
          setEditingCliente(null);
        },
      });
    }
  };

  const handleSelectCliente = (id: string) => {
    setSelectedClienteId(id);
    setActiveTab('detalhes');
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'analise', label: 'MAYRA', icon: Sparkles },
    { id: 'segmentos', label: 'Segmentos', icon: PieChart },
    { id: 'campanhas', label: 'Campanhas', icon: Megaphone },
    // Quem decide fusões é quem tem `manage` sobre clientes — a mesma permissão que
    // apaga um cliente, e não a de o editar: fundir apaga um dos dois de facto.
    ...(podeFundir ? [{ id: 'duplicados' as Tab, label: 'Duplicados', icon: GitMerge }] : []),
    { id: 'definicoes', label: 'Definições', icon: SlidersHorizontal },
    { id: 'detalhes', label: 'Detalhes', icon: UserSquare },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 pt-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-slate-500">Gestão de Clientes e Fidelização</p>
          </div>
          <button
            onClick={() => { setEditingCliente(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            <Plus size={16} />
            Novo Cliente
          </button>
        </div>

        {/* ── Tabs (Anatomia conforme imagem referência) ──────────────────── */}
        <div className="flex gap-1 relative">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            const isDetalhes = tab.id === 'detalhes';
            const isDisabled = isDetalhes && !selectedClienteId;

            return (
              <button
                key={tab.id}
                disabled={isDisabled}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150 -mb-px',
                  isActive
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700',
                  isDisabled && 'opacity-40 cursor-not-allowed',
                )}
              >
                <Icon size={16} />
                {tab.label}
                {tab.id === 'clientes' && total > 0 && (
                  <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
                    {total}
                  </span>
                )}
              </button>
            );
          })}
          {/* Divider line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-200" />
        </div>
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────────â”€ */}
      <div className="flex-1 overflow-hidden">
        {/* Tab: Clientes */}
        {activeTab === 'clientes' && (
          <div className="flex flex-col h-full">
            {/* Search bar */}
            <div className="p-5 pb-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar por nome, email, telefone ou NUIT…"
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                />
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto px-5 pb-5">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : clientes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-3">
                  <Users size={40} strokeWidth={1} />
                  <p className="text-sm">Nenhum cliente encontrado.</p>
                </div>
              ) : (
                <>
                {/* ── Cartões, em telemóvel ─────────────────────────────────────
                    Sete colunas não cabem num telefone. O cartão inteiro é o alvo de
                    toque para abrir o cliente — a linha da tabela já era clicável, e um
                    alvo de 44px de altura é o mínimo confortável para o polegar. */}
                <div className="space-y-2 sm:hidden">
                  {clientes.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCliente(c.id)}
                      className="rounded-xl border border-l-[3px] border-slate-200 border-l-blue-600 bg-white p-4 active:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{c.nome}</p>
                          <p className="truncate text-xs text-slate-500">
                            {c.telefone || c.email || 'sem contacto'}
                          </p>
                        </div>
                        <span className="shrink-0 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          {c.pontos} pts
                        </span>
                      </div>

                      <div className="mt-3 flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
                        <div>
                          <p className="text-xs text-slate-400">Total gasto</p>
                          <p className="font-semibold tabular-nums text-slate-900">
                            {Number(c.totalGasto).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT
                          </p>
                          {c.dataUltimaCompra && (
                            <p className="mt-0.5 text-xs text-slate-400">
                              Última: {new Date(c.dataUltimaCompra).toLocaleDateString('pt-PT')}
                            </p>
                          )}
                        </div>

                        {/* `stopPropagation` para editar não abrir também a ficha. */}
                        <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => { setEditingCliente(c); setShowModal(true); }}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            aria-label={`Editar ${c.nome}`}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setAEliminar(c)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            aria-label={`Apagar ${c.nome}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Tabela, a partir de sm ────────────────────────────────── */}
                <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white sm:block">
                  <TableScroll>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        {['Nome', 'Contacto', 'NUIT', 'Pontos', 'Total Gasto', 'Última Compra', ''].map((h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {clientes.map((c) => (
                        <tr
                          key={c.id}
                          className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => handleSelectCliente(c.id)}
                        >
                          <td className="px-4 py-3 font-semibold text-slate-900">{c.nome}</td>
                          <td className="px-4 py-3 text-slate-500">
                            {c.telefone || c.email || '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-500">{c.nuit || '—'}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-semibold">
                              {c.pontos} pts
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {Number(c.totalGasto).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs">
                            {c.dataUltimaCompra
                              ? new Date(c.dataUltimaCompra).toLocaleDateString('pt-PT')
                              : '—'}
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                onClick={() => { setEditingCliente(c); setShowModal(true); }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => setAEliminar(c)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </TableScroll>
                </div>
                </>
              )}

              {/* Pagination */}
              {lastPage > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-500">
                    Página {page} de {lastPage} Â· {total} clientes
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                      disabled={page === lastPage}
                      className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Segmentos */}
        {activeTab === 'segmentos' && (
          <SegmentosPanel onVerCliente={handleSelectCliente} />
        )}

        {/* Tab: Analise da MAYRA */}
        {activeTab === 'analise' && <AnalisePanel onVerCliente={handleSelectCliente} />}

        {/* Tab: Campanhas */}
        {activeTab === 'campanhas' && <CampanhasPanel />}

        {/* Tab: Duplicados */}
        {activeTab === 'duplicados' && podeFundir && <FusaoDuplicadosPanel />}

        {/* Tab: Definicoes */}
        {activeTab === 'definicoes' && <ConfiguracaoPanel />}

        {/* Tab: Detalhes */}
        {activeTab === 'detalhes' && selectedClienteId && (
          <Visao360Panel
            clienteId={selectedClienteId}
            onBack={() => setActiveTab('clientes')}
          />
        )}
      </div>

      {/* ── Modal Create/Edit ────────────────────────────────────────────────── */}
      {showModal && (
        <ClienteModal
          cliente={editingCliente}
          onClose={() => { setShowModal(false); setEditingCliente(null); }}
          onSave={criar}
          isSaving={isCreating}
        />
      )}

      <ConfirmDialog
        isOpen={aEliminar !== null}
        title="Apagar cliente"
        message={
          aEliminar
            ? `Apagar "${aEliminar.nome}"? Esta acção não pode ser desfeita.`
            : ''
        }
        confirmText="Apagar"
        variant="danger"
        isLoading={isApagando}
        onConfirm={() => {
          if (!aEliminar) return;
          apagar(aEliminar.id, { onSettled: () => setAEliminar(null) });
        }}
        onCancel={() => setAEliminar(null)}
      />
    </div>
  );
}
