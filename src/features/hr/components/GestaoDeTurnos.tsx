import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Clock, Plus, Store, UserPlus } from 'lucide-react';
import { Button } from '@/shared/ui';
import { getLojas } from '@/features/lojas';
import { getEmployees } from '../api/hr.api';
import { turnosApi, type Turno } from '../api/turnos.api';

/**
 * Os turnos da empresa, e a atribuição de pessoas a eles.
 *
 * ## Porque é um painel e não um passo do calendário
 *
 * Um turno é uma definição — «Manhã, 08:00–16:00, Loja Central» — e vive muito mais tempo
 * do que qualquer semana. A escala é a aplicação dessa definição a um dia e a uma pessoa.
 * Misturá-los num único ecrã de calendário obrigaria a recriar o horário a cada semana,
 * que é precisamente o trabalho que um turno nomeado evita.
 *
 * Por isso: aqui definem-se e atribuem-se; o calendário ao lado mostra o resultado.
 */
export function GestaoDeTurnos({ aoMudar }: { aoMudar?: () => void }) {
  const queryClient = useQueryClient();
  const [lojaFiltro, setLojaFiltro] = useState('');
  const [aCriar, setACriar] = useState(false);
  const [aAtribuir, setAAtribuir] = useState<Turno | null>(null);

  const { data: lojas } = useQuery({ queryKey: ['lojas'], queryFn: () => getLojas() });

  const { data: turnos, isLoading } = useQuery({
    queryKey: ['turnos', lojaFiltro],
    queryFn: () => turnosApi.listar(lojaFiltro || undefined),
  });

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['turnos'] });
    // O calendário semanal e a assiduidade do perfil 360 leem as escalas.
    queryClient.invalidateQueries({ queryKey: ['escala-semanal'] });
    aoMudar?.();
  };

  const aoFalhar = (erro: any) =>
    toast.error(erro?.response?.data?.message || 'Não foi possível concluir a operação.');

  const criar = useMutation({
    mutationFn: turnosApi.criar,
    onSuccess: (t) => {
      invalidar();
      setACriar(false);
      toast.success(`Turno "${t.nome}" criado. Falta atribuir-lhe pessoas.`);
    },
    onError: aoFalhar,
  });

  const atribuir = useMutation({
    mutationFn: turnosApi.atribuir,
    onSuccess: () => {
      invalidar();
      setAAtribuir(null);
      toast.success('Funcionário escalado.');
    },
    onError: aoFalhar,
  });

  const semLojas = (lojas ?? []).length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <Store size={15} className="text-slate-400" />
          <select
            value={lojaFiltro}
            onChange={(e) => setLojaFiltro(e.target.value)}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
          >
            <option value="">Todas as lojas</option>
            {(lojas ?? []).map((l: any) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
        </label>

        <Button onClick={() => setACriar(true)} disabled={semLojas}>
          <Plus size={16} className="mr-1.5" />
          Novo turno
        </Button>
      </div>

      {semLojas && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Um turno pertence a uma loja, e ainda não há lojas registadas. Criam-se em «Lojas &
          Caixas».
        </p>
      )}

      {isLoading && <p className="text-sm text-slate-400">A carregar…</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[32rem] text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Turno</th>
              <th className="px-3 py-2 text-left font-medium">Loja</th>
              <th className="px-3 py-2 text-left font-medium">Horário</th>
              <th className="w-32" />
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {turnos?.map((t) => (
              <tr key={t.id}>
                <td className="px-3 py-2 font-semibold text-slate-900">{t.nome}</td>
                <td className="px-3 py-2 text-slate-600">{t.loja?.nome ?? '—'}</td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 text-slate-700">
                    <Clock size={13} className="text-slate-400" />
                    {t.horaInicio}–{t.horaFim}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => setAAtribuir(t)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    <UserPlus size={13} />
                    Escalar
                  </button>
                </td>
              </tr>
            ))}

            {turnos?.length === 0 && !isLoading && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-sm text-slate-400">
                  Nenhum turno definido. Sem turnos não há escalas — e sem escalas, o
                  processamento de salário não sabe quantos dias cada pessoa devia trabalhar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {aCriar && (
        <ModalNovoTurno
          lojas={lojas ?? []}
          aGravar={criar.isPending}
          aoFechar={() => setACriar(false)}
          aoCriar={(payload) => criar.mutate(payload)}
        />
      )}

      {aAtribuir && (
        <ModalAtribuirEscala
          turno={aAtribuir}
          aGravar={atribuir.isPending}
          aoFechar={() => setAAtribuir(null)}
          aoAtribuir={(userId, data) =>
            atribuir.mutate({ turnoId: aAtribuir.id, userId, data })
          }
        />
      )}
    </div>
  );
}

// ─── Modais ──────────────────────────────────────────────────────────────────

function ModalNovoTurno({
  lojas,
  aGravar,
  aoCriar,
  aoFechar,
}: {
  lojas: { id: string; nome: string }[];
  aGravar: boolean;
  aoCriar: (payload: {
    lojaId: string;
    nome: string;
    horaInicio: string;
    horaFim: string;
  }) => void;
  aoFechar: () => void;
}) {
  const [lojaId, setLojaId] = useState(lojas.length === 1 ? lojas[0].id : '');
  const [nome, setNome] = useState('');
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('16:00');

  const valido = !!lojaId && !!nome.trim() && !!horaInicio && !!horaFim;

  // Um turno que acaba antes de começar atravessa a meia-noite. É legítimo — turno da
  // noite — e o servidor aceita-o, por isso avisa-se em vez de recusar.
  const atravessaMeiaNoite = horaFim <= horaInicio;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="font-semibold text-slate-900">Novo turno</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Um horário com nome. As pessoas atribuem-se depois, dia a dia.
          </p>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="text-sm font-medium text-slate-700">Loja</label>
            <select
              value={lojaId}
              onChange={(e) => setLojaId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            >
              <option value="">Escolher…</option>
              {lojas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Manhã"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Início</label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Fim</label>
              <input
                type="time"
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
            </div>
          </div>

          {atravessaMeiaNoite && (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Este turno acaba no dia seguinte. É aceite — é como se escreve um turno de
              noite.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <Button variant="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button
            disabled={!valido || aGravar}
            onClick={() => aoCriar({ lojaId, nome: nome.trim(), horaInicio, horaFim })}
          >
            Criar
          </Button>
        </div>
      </div>
    </div>
  );
}

function ModalAtribuirEscala({
  turno,
  aGravar,
  aoAtribuir,
  aoFechar,
}: {
  turno: Turno;
  aGravar: boolean;
  aoAtribuir: (userId: string, data: string) => void;
  aoFechar: () => void;
}) {
  const [userId, setUserId] = useState('');
  const [data, setData] = useState(() => new Date().toISOString().split('T')[0]);

  const { data: funcionarios } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: () => getEmployees(),
  });

  const activos = (funcionarios ?? []).filter((f) => f.isActive);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="font-semibold text-slate-900">Escalar em «{turno.nome}»</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {turno.loja?.nome ? `${turno.loja.nome} · ` : ''}
            {turno.horaInicio}–{turno.horaFim}
          </p>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="text-sm font-medium text-slate-700">Funcionário</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            >
              <option value="">Escolher…</option>
              {activos.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Dia</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>

          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Uma pessoa só pode estar num turno por dia. Se já estiver escalada neste dia, o
            servidor recusa e diz qual — não há sobreposição silenciosa.
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <Button variant="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button disabled={!userId || !data || aGravar} onClick={() => aoAtribuir(userId, data)}>
            Escalar
          </Button>
        </div>
      </div>
    </div>
  );
}
