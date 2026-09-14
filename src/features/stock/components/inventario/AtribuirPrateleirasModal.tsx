import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Users2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getUsers } from '@/features/users';
import { useAtribuirPrateleiras } from '@/features/stock';
import type { InventoryCount } from '@/features/stock';

/**
 * Distribuição proativa de prateleiras (§8: "uma sessão pode distribuir
 * prateleiras por vários operadores"). O Gestor escolhe um operador e as
 * localizações que ele vai contar — a partir daí só esse operador consegue
 * iniciar a contagem dessas posições.
 */
export function AtribuirPrateleirasModal({
  cycleId,
  counts,
  onClose,
}: {
  cycleId: string;
  counts: InventoryCount[];
  onClose: () => void;
}) {
  const [operatorId, setOperatorId] = useState('');
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());

  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: getUsers });
  const atribuir = useAtribuirPrateleiras(cycleId);

  const operadores = useMemo(
    () => users.filter((u) => ['STOCK_KEEPER', 'MANAGER', 'ADMIN'].includes(u.role) && u.isActive),
    [users],
  );

  const localizacoesDisponiveis = useMemo(() => {
    const mapa = new Map<string, { id: string; codigo: string; caminho: string; pendentes: number; jaAtribuida: string | null }>();
    for (const c of counts) {
      if (!c.localizacaoEsperada || c.status !== 'PENDENTE') continue;
      const loc = mapa.get(c.localizacaoEsperada.id) ?? {
        id: c.localizacaoEsperada.id,
        codigo: c.localizacaoEsperada.codigo,
        caminho: c.localizacaoEsperada.caminho,
        pendentes: 0,
        jaAtribuida: null,
      };
      loc.pendentes += 1;
      if (c.assignedTo) loc.jaAtribuida = c.assignedTo.name;
      mapa.set(c.localizacaoEsperada.id, loc);
    }
    return [...mapa.values()].sort((a, b) => a.caminho.localeCompare(b.caminho));
  }, [counts]);

  const toggle = (id: string) => {
    setSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!operatorId || selecionadas.size === 0) return;
    atribuir.mutate(
      { operatorId, localizacaoIds: [...selecionadas] },
      {
        onSuccess: (res) => {
          toast.success(`${res.posicoesAtribuidas} posição(ões) distribuída(s).`);
          onClose();
        },
        onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Não foi possível distribuir as prateleiras.'),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Users2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Distribuir prateleiras</h2>
              <p className="text-xs text-slate-500">Só o operador escolhido poderá iniciar a contagem destas posições (§8).</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Operador</label>
            <select
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione um operador</option>
              {operadores.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-medium text-slate-600">Prateleiras (só pendentes)</label>
              <span className="text-[11px] text-slate-400">{selecionadas.size} selecionada(s)</span>
            </div>
            {localizacoesDisponiveis.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-400">
                Sem posições pendentes para distribuir.
              </p>
            ) : (
              <div className="max-h-64 divide-y divide-slate-50 overflow-y-auto rounded-lg border border-slate-200">
                {localizacoesDisponiveis.map((loc) => (
                  <label
                    key={loc.id}
                    className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={selecionadas.has(loc.id)}
                      onChange={() => toggle(loc.id)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-800">{loc.caminho}</p>
                      <p className="text-[11px] text-slate-400">
                        {loc.pendentes} item(ns) pendente(s)
                        {loc.jaAtribuida ? ` · já atribuída a ${loc.jaAtribuida}` : ''}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!operatorId || selecionadas.size === 0 || atribuir.isPending}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {atribuir.isPending ? 'A distribuir...' : 'Distribuir'}
          </button>
        </div>
      </div>
    </div>
  );
}
