import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { getWeeklySchedule } from '../api/hr.api';
import type { Shift } from '../types';

// Gera os 7 dias da semana a partir de uma data base (segunda-feira)
function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // getDay(): 0=Dom, 1=Seg ... ajusta para começar na segunda
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

const WEEKDAY_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function ShiftManagementPage() {
  const [monday, setMonday] = useState<Date>(() => getMondayOf(new Date()));
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weekDays = getWeekDays(monday);
  const sunday = weekDays[6];
  const dataInicial = formatDate(monday);
  const dataFinal = formatDate(sunday);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getWeeklySchedule(dataInicial, dataFinal)
      .then((res) => setShifts(res.escalas ?? []))
      .catch(() => setError('Erro ao carregar a escala semanal.'))
      .finally(() => setIsLoading(false));
  }, [dataInicial, dataFinal]);

  const navigateWeek = (direction: number) => {
    const next = new Date(monday);
    next.setDate(monday.getDate() + direction * 7);
    setMonday(next);
  };

  // Agrupa os turnos por data para lookup rápido
  const shiftsByDate = weekDays.reduce<Record<string, Shift[]>>((acc, day) => {
    const key = formatDate(day);
    acc[key] = shifts.filter((s) => s.data === key);
    return acc;
  }, {});

  const today = formatDate(new Date());

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Gestão de Escalas</h1>
            <p className="text-sm text-slate-500">
              Semana de{' '}
              {monday.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })} a{' '}
              {sunday.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Navegação de semana */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setMonday(getMondayOf(new Date())); }}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={() => navigateWeek(1)}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            aria-label="Próxima semana"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {/* Grade semanal */}
      <div className="grid grid-cols-7 gap-3">
        {weekDays.map((day, idx) => {
          const key = formatDate(day);
          const isToday = key === today;
          const dayShifts = shiftsByDate[key] ?? [];

          return (
            <div
              key={key}
              className={`rounded-xl border flex flex-col min-h-[220px] overflow-hidden transition-shadow ${
                isToday
                  ? 'border-indigo-400 shadow-md shadow-indigo-100'
                  : 'border-slate-200'
              }`}
            >
              {/* Cabeçalho do dia */}
              <div
                className={`px-3 py-2.5 text-center ${
                  isToday ? 'bg-indigo-600' : 'bg-slate-50'
                }`}
              >
                <p className={`text-xs font-semibold ${isToday ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {WEEKDAY_SHORT[idx]}
                </p>
                <p className={`text-lg font-bold leading-tight ${isToday ? 'text-white' : 'text-slate-700'}`}>
                  {day.getDate()}
                </p>
              </div>

              {/* Escalas do dia */}
              <div className="flex-1 p-2 space-y-1.5 bg-white">
                {isLoading ? (
                  <div className="space-y-1.5 animate-pulse">
                    <div className="h-10 bg-slate-100 rounded-lg" />
                    <div className="h-10 bg-slate-100 rounded-lg" />
                  </div>
                ) : dayShifts.length === 0 ? (
                  <p className="text-xs text-slate-300 text-center pt-4">—</p>
                ) : (
                  dayShifts.map((shift, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-indigo-50 border border-indigo-100 px-2.5 py-2 hover:bg-indigo-100 transition-colors"
                    >
                      <p className="text-xs font-semibold text-indigo-800 truncate leading-tight">
                        {shift.funcionario}
                      </p>
                      <p className="text-[10px] text-indigo-500 font-medium truncate">
                        {shift.turno}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-2.5 h-2.5 text-indigo-400" />
                        <span className="text-[10px] text-indigo-400">
                          {shift.horaInicio}–{shift.horaFim}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      {!isLoading && shifts.length > 0 && (
        <p className="text-xs text-slate-400 text-right">
          {shifts.length} escalas planeadas nesta semana
        </p>
      )}
    </div>
  );
}
