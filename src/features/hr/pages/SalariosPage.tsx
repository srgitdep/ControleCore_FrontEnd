import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Wallet, Search, Loader2, X, CalendarOff, Receipt, AlertTriangle, TrendingDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getEmployees } from '../api/hr.api';
import {
  processarSalario, getRecibos, marcarAusencia, TIPOS_AUSENCIA,
} from '../api/salarios.api';
import type { Employee } from '../types';
import type { ReciboVencimento, TipoAusencia } from '../api/salarios.api';
import { cn, formatMoeda, mensagemDeErro } from '@/shared/utils';

const MESES = [
  'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
] as const;

/** Mês anterior ao corrente: o mês actual não pode ser processado por ainda não ter terminado. */
function mesAnterior() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return { mes: d.getMonth() + 1, ano: d.getFullYear() };
}

export function SalariosPage() {
  const { t } = useTranslation('rh');
  const [funcionarios, setFuncionarios] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [selecionado, setSelecionado] = useState<Employee | null>(null);
  const [recibos, setRecibos] = useState<ReciboVencimento[]>([]);
  const [isLoadingRecibos, setIsLoadingRecibos] = useState(false);

  const [showProcessar, setShowProcessar] = useState(false);
  const [showAusencia, setShowAusencia] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const inicial = mesAnterior();
  const [form, setForm] = useState({ mes: inicial.mes, ano: inicial.ano, valorBonus: '' });
  const [ausencia, setAusencia] = useState<{ data: string; tipo: TipoAusencia; observacoes: string }>({
    data: new Date().toISOString().slice(0, 10),
    tipo: 'FERIAS',
    observacoes: '',
  });

  useEffect(() => {
    (async () => {
      try {
        setFuncionarios(await getEmployees());
      } catch (error: any) {
        toast.error(mensagemDeErro(error, t('salarios.erro_funcionarios')));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [t]);

  const abrirFuncionario = async (f: Employee) => {
    setSelecionado(f);
    setIsLoadingRecibos(true);
    try {
      setRecibos(await getRecibos(f.id));
    } catch (error: any) {
      toast.error(mensagemDeErro(error, t('salarios.erro_recibos')));
      setRecibos([]);
    } finally {
      setIsLoadingRecibos(false);
    }
  };

  const recarregarRecibos = async (userId: string) => {
    try {
      setRecibos(await getRecibos(userId));
    } catch {
      /* a listagem recarrega na próxima abertura */
    }
  };

  const submeterProcessamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selecionado) return;

    setIsSaving(true);
    try {
      const bonus = form.valorBonus.trim() === '' ? undefined : Number(form.valorBonus);
      const recibo = await processarSalario({
        userId: selecionado.id,
        mesRef: form.mes,
        anoRef: form.ano,
        ...(bonus !== undefined && { valorBonus: bonus }),
      });

      toast.success(t('salarios.processado', { valor: formatMoeda(recibo.totalLiquido) }));
      setShowProcessar(false);
      setForm({ ...form, valorBonus: '' });
      recarregarRecibos(selecionado.id);
    } catch (error: any) {
      // O backend recusa mês não terminado, salário já processado e funcionário sem
      // contrato activo, cada um com mensagem própria — vale mostrá-la.
      toast.error(mensagemDeErro(error, t('salarios.erro_processar')));
    } finally {
      setIsSaving(false);
    }
  };

  const submeterAusencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selecionado) return;

    setIsSaving(true);
    try {
      await marcarAusencia({
        userId: selecionado.id,
        data: ausencia.data,
        tipo: ausencia.tipo,
        ...(ausencia.observacoes.trim() && { observacoes: ausencia.observacoes }),
      });

      toast.success(
        t('salarios.ausencia_marcada', { tipo: t(`ausencia.${ausencia.tipo}`), data: ausencia.data }),
      );
      setShowAusencia(false);
      setAusencia({ ...ausencia, observacoes: '' });
    } catch (error: any) {
      toast.error(mensagemDeErro(error, t('salarios.erro_ausencia')));
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
    // Ver a nota em `EmployeeListPage`: sem `max-w` nem padding próprios, e com `<h2>`,
    // por passar a ser um separador dentro do RH.
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-emerald-600 p-2.5">
          <Wallet className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t('salarios.titulo')}</h2>
          <p className="text-sm text-slate-500">
            {t('salarios.subtitulo')}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-blue-600" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">{t('salarios.como_calculado')}</p>
          <p className="text-xs mt-0.5">
            {t('salarios.expl_1')} <strong>{t('salarios.expl_escalados')}</strong>{' '}
            {t('salarios.expl_2')} <strong>{t('salarios.expl_nao_descontam')}</strong>{' '}
            {t('salarios.expl_3')}
          </p>
        </div>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('salarios.pesquisar')}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        {/* Funcionários */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 text-sm font-semibold text-slate-700">
            {t('salarios.funcionarios')}
          </div>
          {isLoading ? (
            <div className="p-10 text-center text-slate-500">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600 mb-2" />
              {t('acoes.a_carregar')}
            </div>
          ) : filtrados.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              {termo ? t('salarios.nada_corresponde', { termo: searchTerm }) : t('salarios.sem_funcionarios')}
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

        {/* Recibos do selecionado */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {!selecionado ? (
            <div className="p-12 text-center text-slate-500">
              <Receipt className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              {t('salarios.escolha_funcionario')}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50/50 border-b border-slate-100">
                <div>
                  <p className="font-semibold text-slate-900">{selecionado.nome}</p>
                  <p className="text-xs text-slate-500">{t('salarios.n_recibos', { count: recibos.length })}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAusencia(true)}
                    className="px-3 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
                  >
                    <CalendarOff size={15} /> {t('salarios.marcar_ausencia')}
                  </button>
                  <button
                    onClick={() => setShowProcessar(true)}
                    className="px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 flex items-center gap-1.5"
                  >
                    <Wallet size={15} /> {t('salarios.processar_salario')}
                  </button>
                </div>
              </div>

              {isLoadingRecibos ? (
                <div className="p-10 text-center text-slate-500">
                  <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600 mb-2" />
                  {t('salarios.a_carregar_recibos')}
                </div>
              ) : recibos.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  <Receipt className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                  {t('salarios.sem_recibos')}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="text-left font-medium px-4 py-2.5">{t('salarios.col_mes')}</th>
                        <th className="text-right font-medium px-4 py-2.5">{t('salarios.col_base')}</th>
                        <th className="text-right font-medium px-4 py-2.5">{t('salarios.col_faltas')}</th>
                        <th className="text-right font-medium px-4 py-2.5">{t('salarios.col_descontos')}</th>
                        <th className="text-right font-medium px-4 py-2.5">{t('salarios.col_bonus')}</th>
                        <th className="text-right font-medium px-4 py-2.5">{t('salarios.col_liquido')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recibos.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 text-slate-900">
                            {t(`meses.${MESES[r.mesRef - 1]}`)} {r.anoRef}
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{formatMoeda(r.salarioBase)}</td>
                          <td className="px-4 py-2.5 text-right">
                            {r.diasFalta > 0 ? (
                              <span className="text-rose-600 font-medium">{r.diasFalta}</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                            {r.minutosAtraso > 0 && (
                              <span className="block text-[11px] text-amber-600">
                                {t('salarios.min_atraso', { n: r.minutosAtraso })}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {r.valorDescontos > 0 ? (
                              <span className="text-rose-600 inline-flex items-center gap-1">
                                <TrendingDown size={12} /> {formatMoeda(r.valorDescontos)}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-600">
                            {r.valorBonus > 0 ? formatMoeda(r.valorBonus) : <span className="text-slate-400">—</span>}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                            {formatMoeda(r.totalLiquido)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Processar salário */}
      {showProcessar && selecionado && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t('salarios.modal_processar')}</h2>
                <p className="text-xs text-slate-500">{selecionado.nome}</p>
              </div>
              <button
                onClick={() => setShowProcessar(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submeterProcessamento} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('salarios.mes')}</label>
                  <select
                    value={form.mes}
                    onChange={(e) => setForm({ ...form, mes: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {MESES.map((m, i) => (
                      <option key={m} value={i + 1}>{t(`meses.${m}`)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('salarios.ano')}</label>
                  <input
                    type="number"
                    value={form.ano}
                    onChange={(e) => setForm({ ...form, ano: Number(e.target.value) })}
                    min={2000}
                    className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('salarios.bonus')} <span className="text-slate-400 font-normal">{t('salarios.opcional')}</span>
                </label>
                <input
                  type="number"
                  value={form.valorBonus}
                  onChange={(e) => setForm({ ...form, valorBonus: e.target.value })}
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  {t('salarios.bonus_ajuda')}
                </p>
              </div>

              <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                {t('salarios.aviso_processar')}
              </p>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowProcessar(false)}
                  className="px-5 py-2.5 text-slate-600 font-medium rounded-xl hover:bg-slate-100"
                >
                  {t('acoes.cancelar')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving && <Loader2 size={16} className="animate-spin" />}
                  {t('salarios.processar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Marcar ausência */}
      {showAusencia && selecionado && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t('salarios.modal_ausencia')}</h2>
                <p className="text-xs text-slate-500">{selecionado.nome}</p>
              </div>
              <button
                onClick={() => setShowAusencia(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submeterAusencia} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('salarios.dia')}</label>
                <input
                  type="date"
                  value={ausencia.data}
                  onChange={(e) => setAusencia({ ...ausencia, data: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('salarios.tipo')}</label>
                <select
                  value={ausencia.tipo}
                  onChange={(e) => setAusencia({ ...ausencia, tipo: e.target.value as TipoAusencia })}
                  className="w-full px-4 py-2.5 border rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                >
                  {TIPOS_AUSENCIA.map((tipo) => (
                    <option key={tipo} value={tipo}>{t(`ausencia.${tipo}`)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('salarios.observacoes')} <span className="text-slate-400 font-normal">{t('salarios.opcional')}</span>
                </label>
                <input
                  type="text"
                  value={ausencia.observacoes}
                  onChange={(e) => setAusencia({ ...ausencia, observacoes: e.target.value })}
                  placeholder={t('salarios.observacoes_exemplo')}
                  maxLength={255}
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                {t('salarios.aviso_ausencia')}
              </p>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAusencia(false)}
                  className="px-5 py-2.5 text-slate-600 font-medium rounded-xl hover:bg-slate-100"
                >
                  {t('acoes.cancelar')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving && <Loader2 size={16} className="animate-spin" />}
                  {t('salarios.marcar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
