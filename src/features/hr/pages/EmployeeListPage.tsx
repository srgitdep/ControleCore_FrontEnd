import { useEffect, useState } from 'react';
import { Users, Search, Shield, UserCheck, UserX, Eye } from 'lucide-react';
import { getEmployees } from '../api/hr.api';
import type { Employee, EmployeeRole } from '../types';
import { EmployeeProfileDrawer } from '../components/EmployeeProfileDrawer';
import { TableScroll } from '@/shared/ui';

const ROLE_LABEL: Record<EmployeeRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrador',
  MANAGER: 'Gestor',
  CASHIER: 'Operador de Caixa',
  STOCK_KEEPER: 'Armazenista',
  USER: 'Funcionário',
};

const ROLE_COLOR: Record<EmployeeRole, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-red-100 text-red-700',
  MANAGER: 'bg-blue-100 text-blue-700',
  CASHIER: 'bg-emerald-100 text-emerald-700',
  STOCK_KEEPER: 'bg-amber-100 text-amber-700',
  USER: 'bg-slate-100 text-slate-600',
};

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[...Array(4)].map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export function EmployeeListPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    getEmployees()
      .then(setEmployees)
      .catch(() => setError('Erro ao carregar a lista de funcionários.'))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = employees.filter(
    (e) =>
      e.nome.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    // Sem padding próprio: esta página passou a ser um separador dentro do RH, e o
    // `AppLayout` já aplica `p-4 sm:p-6`. O `<h1>` passou a `<h2>` pela mesma razão —
    // o título da página é agora «Recursos Humanos», e dois `<h1>` são ambíguos.
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Funcionários</h2>
            <p className="text-sm text-slate-500">
              {isLoading ? 'A carregar...' : `${employees.length} colaboradores activos`}
            </p>
          </div>
        </div>

        {/* Aviso de dados sensíveis ocultos */}
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          Dados sensíveis (salário, BI, NUIT) ocultos por padrão
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Pesquisar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white"
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {/* ── Cartões, em telemóvel ──────────────────────────────────────────────
          Cinco colunas com nome, email e dois badges não cabem em 343px (os 375 de um
          telemóvel menos o padding do layout). Deslizar na horizontal para ler um email
          é pior do que ler o registo inteiro de uma vez. */}
      <div className="space-y-2 sm:hidden">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white" />
          ))
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-400">
            {search ? `Nenhum funcionário encontrado para "${search}"` : 'Sem funcionários registados.'}
          </p>
        ) : (
          filtered.map((emp) => (
            <button
              key={emp.id}
              type="button"
              onClick={() => setSelectedEmployeeId(emp.id)}
              className="flex w-full items-start gap-3 rounded-xl border border-l-[3px] border-slate-200 border-l-indigo-500 bg-white p-4 text-left transition-colors active:bg-slate-50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
                {emp.nome.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-800">{emp.nome}</p>
                {/* `break-all` porque um email longo sem espaços não envolve e alarga
                    o cartão para fora do ecrã. */}
                <p className="break-all text-xs text-slate-500">{emp.email}</p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLOR[emp.cargo]}`}
                  >
                    {ROLE_LABEL[emp.cargo]}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium ${
                      emp.isActive ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {emp.isActive ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                    {emp.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              <Eye className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
            </button>
          ))
        )}
      </div>

      {/* ── Tabela, a partir de sm ─────────────────────────────────────────── */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:block">
        <TableScroll>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Nome
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Email
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Cargo
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Estado
              </th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
            ) : filtered.length === 0 ? (
              <tr>
                {/* Cinco colunas, não quatro: com `colSpan` a menos, a mensagem de
                    lista vazia não ficava centrada na largura da tabela. */}
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                  {search
                    ? `Nenhum funcionário encontrado para "${search}"`
                    : 'Sem funcionários registados.'}
                </td>
              </tr>
            ) : (
              filtered.map((emp) => (
                <tr
                  key={emp.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs shrink-0">
                        {emp.nome.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-800">{emp.nome}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{emp.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLOR[emp.cargo]}`}
                    >
                      {ROLE_LABEL[emp.cargo]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        emp.isActive ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      {emp.isActive ? (
                        <UserCheck className="w-3.5 h-3.5" />
                      ) : (
                        <UserX className="w-3.5 h-3.5" />
                      )}
                      {emp.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedEmployeeId(emp.id)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Ver Visão 360º"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </TableScroll>
      </div>

      <EmployeeProfileDrawer
        employeeId={selectedEmployeeId || ''}
        isOpen={!!selectedEmployeeId}
        onClose={() => setSelectedEmployeeId(null)}
      />
    </div>
  );
}
