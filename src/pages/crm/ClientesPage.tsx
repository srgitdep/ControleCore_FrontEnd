import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  Plus,
  UserSquare,
  TrendingUp,
  Award,
  Calendar,
  Trash2,
  Edit2,
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Mail,
  Phone,
  CreditCard,
} from 'lucide-react';
import {
  listarClientes,
  obterCliente,
  criarCliente,
  atualizarCliente,
  apagarCliente,
  type Cliente,
  type ClienteDetalhe,
} from '@/api/clientes.api';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

// â”€â”€â”€ Debounce hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// â”€â”€â”€ Tab Definition â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type Tab = 'clientes' | 'detalhes';

// â”€â”€â”€ Metric Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-4">
      <div className={cn('p-2.5 rounded-lg', color)}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-slate-900 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// â”€â”€â”€ Create/Edit Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    if (!form.nome.trim()) return toast.error('O nome Ã© obrigatÃ³rio.');
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
            { key: 'nome', label: 'Nome Completo *', type: 'text', placeholder: 'Ex: JoÃ£o Silva' },
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
              {isSaving ? 'A guardarâ€¦' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// â”€â”€â”€ Details Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ClienteDetails({
  clienteId,
  onBack,
}: {
  clienteId: string;
  onBack: () => void;
}) {
  const { data: cliente, isLoading } = useQuery<ClienteDetalhe>({
    queryKey: ['cliente-detalhe', clienteId],
    queryFn: () => obterCliente(clienteId),
  });

  if (isLoading || !cliente) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalCompras = cliente.vendas?.length ?? 0;
  const ticketMedio =
    totalCompras > 0 ? Number(cliente.totalGasto) / totalCompras : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-5 border-b border-slate-100">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-slate-900 truncate">{cliente.nome}</h2>
          <p className="text-sm text-slate-500">Perfil de Cliente</p>
        </div>
        <span
          className={cn(
            'px-2 py-0.5 rounded-full text-xs font-semibold',
            cliente.consentimentoMarketing
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-slate-100 text-slate-500',
          )}
        >
          {cliente.consentimentoMarketing ? 'LGPD: Consente' : 'LGPD: NÃ£o Consente'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
        {/* Contactos */}
        <div className="flex flex-wrap gap-3">
          {cliente.telefone && (
            <span className="flex items-center gap-1.5 text-sm text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <Phone size={14} /> {cliente.telefone}
            </span>
          )}
          {cliente.email && (
            <span className="flex items-center gap-1.5 text-sm text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <Mail size={14} /> {cliente.email}
            </span>
          )}
          {cliente.nuit && (
            <span className="flex items-center gap-1.5 text-sm text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <CreditCard size={14} /> NUIT: {cliente.nuit}
            </span>
          )}
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            icon={TrendingUp}
            label="Total Gasto"
            value={`${Number(cliente.totalGasto).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT`}
            color="bg-emerald-500"
          />
          <MetricCard
            icon={Award}
            label="Pontos de Fidelidade"
            value={cliente.pontos.toLocaleString()}
            sub="1 ponto por cada 100 MT"
            color="bg-amber-500"
          />
          <MetricCard
            icon={ShoppingBag}
            label="Total de Compras"
            value={totalCompras.toString()}
            color="bg-blue-500"
          />
          <MetricCard
            icon={Calendar}
            label="Ticket MÃ©dio"
            value={`${ticketMedio.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT`}
            sub={
              cliente.dataUltimaCompra
                ? `Ãšltima: ${new Date(cliente.dataUltimaCompra).toLocaleDateString('pt-PT')}`
                : 'Sem compras ainda'
            }
            color="bg-violet-500"
          />
        </div>

        {/* HistÃ³rico de Compras */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Ãšltimas Compras</h3>
          {cliente.vendas?.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 rounded-xl border border-slate-200">
              Nenhuma compra registada.
            </div>
          ) : (
            <div className="space-y-2">
              {cliente.vendas?.map((venda) => (
                <div
                  key={venda.id}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{venda.numeroFatura}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(venda.createdAt).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {' Â· '}
                      {venda.itens?.length ?? 0} itens
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-bold text-slate-900">
                      {venda.totalFinal.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT
                    </p>
                    <span
                      className={cn(
                        'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                        venda.estado === 'CONCLUIDA'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700',
                      )}
                    >
                      {venda.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function ClientesPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('clientes');
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const debouncedSearch = useDebounce(search, 500);

  // Reset page when search changes
  useEffect(() => setPage(1), [debouncedSearch]);

  const { data, isLoading } = useQuery({
    queryKey: ['clientes', page, debouncedSearch],
    queryFn: () => listarClientes({ page, limit: 15, search: debouncedSearch || undefined }),
    placeholderData: (prev) => prev,
  });

  const clientes = data?.data ?? [];
  const lastPage = data?.lastPage ?? 1;
  const total = data?.total ?? 0;

  const { mutate: criar, isPending: isCreating } = useMutation({
    mutationFn: (payload: any) =>
      editingCliente
        ? atualizarCliente(editingCliente.id, payload)
        : criarCliente(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] });
      toast.success(editingCliente ? 'Cliente atualizado!' : 'Cliente criado!');
      setShowModal(false);
      setEditingCliente(null);
    },
    onError: () => toast.error('Erro ao guardar cliente.'),
  });

  const { mutate: apagar } = useMutation({
    mutationFn: apagarCliente,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente removido.');
    },
    onError: () => toast.error('Erro ao remover cliente.'),
  });

  const handleSelectCliente = (id: string) => {
    setSelectedClienteId(id);
    setActiveTab('detalhes');
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'detalhes', label: 'Detalhes', icon: UserSquare },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border-b border-slate-200 px-6 pt-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-slate-500">GestÃ£o de Clientes e FidelizaÃ§Ã£o</p>
          </div>
          <button
            onClick={() => { setEditingCliente(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            <Plus size={16} />
            Novo Cliente
          </button>
        </div>

        {/* â”€â”€ Tabs (Anatomia conforme imagem referÃªncia) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

      {/* â”€â”€ Tab Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                  placeholder="Pesquisar por nome, email, telefone ou NUITâ€¦"
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
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        {['Nome', 'Contacto', 'NUIT', 'Pontos', 'Total Gasto', 'Ãšltima Compra', ''].map((h) => (
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
                            {c.telefone || c.email || 'â€”'}
                          </td>
                          <td className="px-4 py-3 text-slate-500">{c.nuit || 'â€”'}</td>
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
                              : 'â€”'}
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
                                onClick={() => {
                                  if (confirm(`Apagar "${c.nome}"?`)) apagar(c.id);
                                }}
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
                </div>
              )}

              {/* Pagination */}
              {lastPage > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-500">
                    PÃ¡gina {page} de {lastPage} Â· {total} clientes
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

        {/* Tab: Detalhes */}
        {activeTab === 'detalhes' && selectedClienteId && (
          <ClienteDetails
            clienteId={selectedClienteId}
            onBack={() => setActiveTab('clientes')}
          />
        )}
      </div>

      {/* â”€â”€ Modal Create/Edit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showModal && (
        <ClienteModal
          cliente={editingCliente}
          onClose={() => { setShowModal(false); setEditingCliente(null); }}
          onSave={criar}
          isSaving={isCreating}
        />
      )}
    </div>
  );
}
