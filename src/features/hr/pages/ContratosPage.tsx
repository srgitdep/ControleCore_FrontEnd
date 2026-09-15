import { useState, useEffect } from 'react';
import { FileText, Search, Loader2, X, FileClock } from 'lucide-react';
import toast from 'react-hot-toast';
import { getEmployees } from '../api/hr.api';
import { contratosApi } from '../api/contratos.api';
import type { Employee } from '../types';
import type { Contrato } from '../api/contratos.api';
import { cn } from '@/shared/utils';

const mt = (v: number) =>
  `${v.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;

/**
 * Contratos de trabalho: o cargo e o salário-base que sustentam o processamento de
 * salários — sem contrato activo, `SalariosPage` recusa processar.
 */
export function ContratosPage() {
  const [funcionarios, setFuncionarios] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [selecionado, setSelecionado] = useState<Employee | null>(null);
  const [activo, setActivo] = useState<Contrato | null>(null);
  const [historico, setHistorico] = useState<Contrato[]>([]);
  const [isLoadingContratos, setIsLoadingContratos] = useState(false);

  const [showNovoContrato, setShowNovoContrato] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    cargo: '',
    salarioBase: '',
    dataInicio: new Date().toISOString().slice(0, 10),
    dataFim: '',
    observacoes: '',
  });

  useEffect(() => {
    (async () => {
      try {
        setFuncionarios(await getEmployees());
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Erro ao carregar funcionários.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const abrirFuncionario = async (f: Employee) => {
    setSelecionado(f);
    setIsLoadingContratos(true);
    try {
      const [a, h] = await Promise.all([
        contratosApi.obterAtivo(f.id),
        contratosApi.listarHistorico(f.id),
      ]);
      setActivo(a);
      setHistorico(h);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao carregar contratos.');
      setActivo(null);
      setHistorico([]);
    } finally {
      setIsLoadingContratos(false);
    }
  };

  const recarregar = async (userId: string) => {
    const [a, h] = await Promise.all([
      contratosApi.obterAtivo(userId),
      contratosApi.listarHistorico(userId),
    ]);
    setActivo(a);
    setHistorico(h);
  };

  const abrirNovoContrato = () => {
    setForm({
      cargo: activo?.cargo ?? '',
      salarioBase: activo ? String(activo.salarioBase) : '',
      dataInicio: new Date().toISOString().slice(0, 10),
      dataFim: '',
      observacoes: '',
    });
    setShowNovoContrato(true);
  };

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selecionado) return;

    if (!form.cargo.trim()) return toast.error('Indique o cargo.');
    const salario = Number(form.salarioBase);
    if (!(salario >= 0)) return toast.error('O salário base tem de ser um número válido.');

    setIsSaving(true);
    try {
      await contratosApi.criar({
        userId: selecionado.id,
        cargo: form.cargo.trim(),
        salarioBase: salario,
        dataInicio: form.dataInicio,
        dataFim: form.dataFim || undefined,
        observacoes: form.observacoes.trim() || undefined,
      });

      toast.success(
        activo
          ? `Novo contrato criado. O anterior (${activo.cargo}) ficou terminado.`
          : 'Contrato criado.',
      );
      setShowNovoContrato(false);
      recarregar(selecionado.id);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao criar o contrato.');
    } finally {
      setIsSaving(false);
    }
  };

  const termo = searchTerm.trim().toLowerCase();
  const filtrados = termo
    ? funcionarios.filter((f) =>
        [f.nome, f.email, f.cargo].some((c) => String(c).toLowerCase().includes(termo)),
      )
    : funcionarios;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-indigo-600 p-2.5">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Contratos</h2>
          <p className="text-sm text-slate-500">
            Cargo e salário-base — a base do processamento de salários
          </p>
        </div>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar funcionário..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 text-sm font-semibold text-slate-700">
            Funcionários
          </div>
          {isLoading ? (
            <div className="p-10 text-center text-slate-500">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600 mb-2" />
              A carregar...
            </div>
          ) : filtrados.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              {termo ? `Nada corresponde a "${searchTerm}".` : 'Sem funcionários registados.'}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 max-h-[28rem] overflow-y-auto">
              {filtrados.map((f) => (
                <li key={f.id}>
                  <button
                    onClick={() => abrirFuncionario(f)}
                    className={cn(
                      'w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors',
                      selecionado?.id === f.id && 'bg-blue-50 hover:bg-blue-50',
                    )}
                  >
                    <p className="font-medium text-slate-900">{f.nome}</p>
                    <p className="text-xs text-slate-500">{f.cargo} · {f.email}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {!selecionado ? (
            <div className="p-12 text-center text-slate-500">
              <FileClock className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              Escolha um funcionário para ver o contrato e o histórico.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50/50 border-b border-slate-100">
                <div>
                  <p className="font-semibold text-slate-900">{selecionado.nome}</p>
                  <p className="text-xs text-slate-500">
                    {historico.length} contrato{historico.length === 1 ? '' : 's'}
                  </p>
                </div>
                <button
                  onClick={abrirNovoContrato}
                  className="px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-1.5"
                >
                  <FileText size={15} /> {activo ? 'Renovar contrato' : 'Criar contrato'}
                </button>
              </div>

              {isLoadingContratos ? (
                <div className="p-10 text-center text-slate-500">
                  <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600 mb-2" />
                  A carregar...
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {activo ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          Activo
                        </span>
                        <span className="text-xs text-emerald-700">
                          desde {new Date(activo.dataInicio).toLocaleDateString('pt-MZ')}
                        </span>
                      </div>
                      <p className="mt-2 text-lg font-semibold text-slate-900">{activo.cargo}</p>
                      <p className="text-sm text-slate-600">{mt(activo.salarioBase)} / mês</p>
                      {activo.observacoes && (
                        <p className="mt-2 text-xs text-slate-500">{activo.observacoes}</p>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      Sem contrato activo. O processamento de salários exige um.
                    </div>
                  )}

                  {historico.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Histórico
                      </h3>
                      <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                              <th className="px-3 py-2 font-medium">Cargo</th>
                              <th className="px-3 py-2 text-right font-medium">Salário</th>
                              <th className="px-3 py-2 font-medium">Período</th>
                              <th className="px-3 py-2 font-medium">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {historico.map((c) => (
                              <tr key={c.id}>
                                <td className="px-3 py-2 text-slate-800">{c.cargo}</td>
                                <td className="px-3 py-2 text-right text-slate-600">
                                  {mt(c.salarioBase)}
                                </td>
                                <td className="px-3 py-2 text-slate-500">
                                  {new Date(c.dataInicio).toLocaleDateString('pt-MZ')}
                                  {' – '}
                                  {c.dataFim
                                    ? new Date(c.dataFim).toLocaleDateString('pt-MZ')
                                    : 'actual'}
                                </td>
                                <td className="px-3 py-2">
                                  <span
                                    className={cn(
                                      'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                                      c.estado === 'ATIVO'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-slate-100 text-slate-500',
                                    )}
                                  >
                                    {c.estado === 'ATIVO' ? 'Activo' : 'Terminado'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showNovoContrato && selecionado && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {activo ? 'Renovar contrato' : 'Criar contrato'}
                </h2>
                <p className="text-xs text-slate-500">{selecionado.nome}</p>
              </div>
              <button
                onClick={() => setShowNovoContrato(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submeter} className="p-6 space-y-4">
              {activo && (
                <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-3">
                  Já existe um contrato activo ({activo.cargo}). Criar este termina-o
                  automaticamente, com data de fim hoje.
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                <input
                  type="text"
                  value={form.cargo}
                  onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                  placeholder="Ex.: Caixa"
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Salário base (MT)
                  </label>
                  <input
                    type="number"
                    value={form.salarioBase}
                    onChange={(e) => setForm({ ...form, salarioBase: e.target.value })}
                    min={0}
                    step="0.01"
                    className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Início
                  </label>
                  <input
                    type="date"
                    value={form.dataInicio}
                    onChange={(e) => setForm({ ...form, dataInicio: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Fim previsto <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="date"
                  value={form.dataFim}
                  onChange={(e) => setForm({ ...form, dataFim: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Observações <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNovoContrato(false)}
                  className="px-5 py-2.5 text-slate-600 font-medium rounded-xl hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving && <Loader2 size={16} className="animate-spin" />}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
