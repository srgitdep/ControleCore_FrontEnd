import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Loader2, Plus, X, CalendarClock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { getEmployees } from '../api/hr.api';
import { turnosApi } from '../api/turnos.api';
import type { Turno, EscalaTurno } from '../api/turnos.api';
import { getLojas } from '@/features/lojas';
import type { Employee } from '../types';
import { localeIntl } from '@/i18n';
import { formatData, mensagemDeErro } from '@/shared/utils';

interface Loja {
  id: string;
  nome: string;
}

/**
 * Turnos (horários-modelo por loja, ex. «Manhã 08:00–16:00») e a escala — quem trabalha
 * qual turno, em que dia.
 *
 * ## Um turno por funcionário, por dia
 *
 * O backend recusa uma segunda escala no mesmo dia para o mesmo funcionário; a mensagem
 * de erro já diz isso e é mostrada tal e qual.
 *
 * ## Porque é por dia único e não por semana
 *
 * A rota de gestão (`/rh/turnos/escala`) só aceita um dia de cada vez — é a grelha semanal
 * de leitura (separador «Escalas», `getWeeklySchedule`) que agrega vários dias para
 * consulta. Este ecrã é o de atribuir, e atribui-se um dia de cada vez.
 */
export function TurnosPage() {
  const { t } = useTranslation('rh');
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [funcionarios, setFuncionarios] = useState<Employee[]>([]);
  const [lojaId, setLojaId] = useState('');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));

  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [escalas, setEscalas] = useState<EscalaTurno[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEscalas, setIsLoadingEscalas] = useState(false);

  const [showNovoTurno, setShowNovoTurno] = useState(false);
  const [showAtribuir, setShowAtribuir] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formTurno, setFormTurno] = useState({ nome: '', horaInicio: '08:00', horaFim: '16:00' });
  const [formEscala, setFormEscala] = useState({ turnoId: '', userId: '' });

  useEffect(() => {
    (async () => {
      try {
        const [ls, fs] = await Promise.all([getLojas(), getEmployees()]);
        setLojas(ls);
        setFuncionarios(fs);
        if (ls.length > 0) setLojaId(ls[0].id);
      } catch (error: any) {
        toast.error(mensagemDeErro(error, t('turnos.erro_dados')));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [t]);

  // `turnos` não tem endpoint de listagem próprio — reconstrói-se a partir das escalas do
  // dia mais os que acabaram de ser criados nesta sessão, para o selector de «Atribuir» ter
  // que oferecer. Não é uma limitação desta página: o backend não expõe `GET /rh/turnos`.
  const carregarEscalas = async (loja: string, dia: string) => {
    if (!loja) return;
    setIsLoadingEscalas(true);
    try {
      const dados = await turnosApi.obterEscalas(loja, dia);
      setEscalas(dados);
      setTurnos((antes) => {
        const vistos = new Map(antes.map((turno) => [turno.id, turno]));
        dados.forEach((e) => vistos.set(e.turno.id, e.turno));
        return Array.from(vistos.values());
      });
    } catch (error: any) {
      toast.error(mensagemDeErro(error, t('turnos.erro_escala')));
      setEscalas([]);
    } finally {
      setIsLoadingEscalas(false);
    }
  };

  useEffect(() => {
    if (lojaId) carregarEscalas(lojaId, data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lojaId, data]);

  const turnosDaLoja = turnos.filter((turno) => turno.lojaId === lojaId);

  const criarTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lojaId) return toast.error(t('turnos.escolha_loja'));
    if (!formTurno.nome.trim()) return toast.error(t('turnos.de_nome'));

    setIsSaving(true);
    try {
      const turno = await turnosApi.criar({
        lojaId,
        nome: formTurno.nome.trim(),
        horaInicio: formTurno.horaInicio,
        horaFim: formTurno.horaFim,
      });
      setTurnos((antes) => [...antes, turno]);
      toast.success(t('turnos.criado', { nome: turno.nome }));
      setShowNovoTurno(false);
      setFormTurno({ nome: '', horaInicio: '08:00', horaFim: '16:00' });
    } catch (error: any) {
      toast.error(mensagemDeErro(error, t('turnos.erro_criar')));
    } finally {
      setIsSaving(false);
    }
  };

  const atribuir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEscala.turnoId) return toast.error(t('turnos.escolha_turno'));
    if (!formEscala.userId) return toast.error(t('turnos.escolha_funcionario'));

    setIsSaving(true);
    try {
      await turnosApi.atribuirEscala({
        turnoId: formEscala.turnoId,
        userId: formEscala.userId,
        data,
      });
      toast.success(t('turnos.atribuida'));
      setShowAtribuir(false);
      setFormEscala({ turnoId: '', userId: '' });
      carregarEscalas(lojaId, data);
    } catch (error: any) {
      // «Este funcionário já está alocado a um turno neste dia» chega assim.
      toast.error(mensagemDeErro(error, t('turnos.erro_atribuir')));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-blue-600 p-2.5">
          <Clock className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t('turnos.titulo')}</h2>
          <p className="text-sm text-slate-500">{t('turnos.subtitulo')}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-slate-500">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600 mb-2" />
          {t('acoes.a_carregar')}
        </div>
      ) : lojas.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {t('turnos.sem_lojas')}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('turnos.loja')}</label>
              <select
                value={lojaId}
                onChange={(e) => setLojaId(e.target.value)}
                className="px-4 py-2.5 border rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
              >
                {lojas.map((l) => (
                  <option key={l.id} value={l.id}>{l.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('turnos.dia')}</label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => setShowNovoTurno(true)}
                className="px-3 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
              >
                <Plus size={15} /> {t('turnos.novo_turno')}
              </button>
              <button
                onClick={() => setShowAtribuir(true)}
                disabled={turnosDaLoja.length === 0}
                className="px-3 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
                title={turnosDaLoja.length === 0 ? t('turnos.crie_primeiro') : undefined}
              >
                <CalendarClock size={15} /> {t('turnos.atribuir_escala')}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 text-sm font-semibold text-slate-700">
              {t('turnos.escala_de', {
                data: new Date(data + 'T00:00:00').toLocaleDateString(localeIntl(), {
                  weekday: 'long', day: '2-digit', month: 'long',
                }),
              })}
            </div>

            {isLoadingEscalas ? (
              <div className="p-10 text-center text-slate-500">
                <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600 mb-2" />
                {t('acoes.a_carregar')}
              </div>
            ) : escalas.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                <User className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                {t('turnos.ninguem')}
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {escalas.map((e) => (
                  <li key={e.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{e.user.name}</p>
                      <p className="text-xs text-slate-500">{e.user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-800">{e.turno.nome}</p>
                      <p className="text-xs text-slate-500">
                        {e.turno.horaInicio} – {e.turno.horaFim}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {turnosDaLoja.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('turnos.turnos_da_loja')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {turnosDaLoja.map((turno) => (
                  <span
                    key={turno.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
                  >
                    <Clock size={13} className="text-slate-400" />
                    {turno.nome} · {turno.horaInicio}–{turno.horaFim}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showNovoTurno && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">{t('turnos.novo_turno')}</h2>
              <button
                onClick={() => setShowNovoTurno(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={criarTurno} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('turnos.nome')}</label>
                <input
                  type="text"
                  value={formTurno.nome}
                  onChange={(e) => setFormTurno({ ...formTurno, nome: e.target.value })}
                  placeholder={t('turnos.nome_exemplo')}
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('turnos.inicio')}</label>
                  <input
                    type="time"
                    value={formTurno.horaInicio}
                    onChange={(e) => setFormTurno({ ...formTurno, horaInicio: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('turnos.fim')}</label>
                  <input
                    type="time"
                    value={formTurno.horaFim}
                    onChange={(e) => setFormTurno({ ...formTurno, horaFim: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNovoTurno(false)}
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
                  {t('turnos.criar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAtribuir && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t('turnos.atribuir_escala')}</h2>
                <p className="text-xs text-slate-500">
                  {formatData(new Date(data + 'T00:00:00'))}
                </p>
              </div>
              <button
                onClick={() => setShowAtribuir(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={atribuir} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('turnos.funcionario')}
                </label>
                <select
                  value={formEscala.userId}
                  onChange={(e) => setFormEscala({ ...formEscala, userId: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('acoes.escolher')}</option>
                  {funcionarios.map((f) => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('turnos.turno')}</label>
                <select
                  value={formEscala.turnoId}
                  onChange={(e) => setFormEscala({ ...formEscala, turnoId: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('acoes.escolher')}</option>
                  {turnosDaLoja.map((turno) => (
                    <option key={turno.id} value={turno.id}>
                      {turno.nome} ({turno.horaInicio}–{turno.horaFim})
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                {t('turnos.um_por_dia')}
              </p>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAtribuir(false)}
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
                  {t('turnos.atribuir')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
