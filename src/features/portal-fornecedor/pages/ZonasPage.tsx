import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2, MapPin, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PROVINCIAS, portal } from '../api/portal.api';
import type { ZonaEntrega } from '../api/portal.api';
import { cn } from '@/shared/utils';

const mt = (v: number) =>
  `${v.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;

/**
 * As zonas onde o fornecedor entrega.
 *
 * ## Sem zonas, fica fora de todas as comparações
 *
 * E é a exclusão mais silenciosa do sistema: o fornecedor não aparece, e não recebe aviso
 * nenhum. O sistema não pode presumir que entrega em Nampula quem só disse que existe — mas
 * também não tem forma de lhe dizer que foi excluído por isso.
 *
 * Este ecrã é o único sítio onde essa consequência é dita. Daí o aviso quando a lista está
 * vazia ocupar o ecrã em vez de ser uma linha discreta.
 *
 * ## A cidade prevalece sobre a província
 *
 * «Nampula, toda a província: 7 dias, 2.000 de entrega» e «Nampula, cidade: 2 dias, sem
 * custo» são duas afirmações verdadeiras. A loja na cidade recebe a segunda. O ecrã
 * agrupa por província para isso ficar legível.
 */
export function ZonasPage() {
  const queryClient = useQueryClient();
  const [aDefinir, setADefinir] = useState<ZonaEntrega | 'nova' | null>(null);

  const { data: zonas, isLoading } = useQuery({
    queryKey: ['portal-zonas'],
    queryFn: portal.listarZonas,
  });

  const recarregar = () => queryClient.invalidateQueries({ queryKey: ['portal-zonas'] });

  const remover = useMutation({
    mutationFn: (zonaId: string) => portal.removerZona(zonaId),
    onSuccess: () => {
      toast.success('Zona removida.');
      recarregar();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao remover.'),
  });

  const activas = zonas?.filter((z) => z.activa) ?? [];
  const porProvincia = agruparPorProvincia(zonas ?? []);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Zonas de entrega</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Onde entrega, em quanto tempo, e a que custo.
          </p>
        </div>
        <button
          onClick={() => setADefinir('nova')}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={15} />
          Declarar zona
        </button>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={22} className="animate-spin text-slate-400" />
        </div>
      ) : activas.length === 0 ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-5 py-8 text-center">
          <AlertTriangle size={24} className="mx-auto text-amber-600" />
          <p className="mt-2 text-sm font-medium text-amber-900">
            Não declarou nenhuma zona de entrega
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-snug text-amber-800">
            Enquanto isso, a sua vitrine fica fora de <strong>todas</strong> as comparações — e
            é uma exclusão silenciosa: não aparece, e não recebe aviso. O sistema não pode
            presumir que entrega numa província que não declarou.
          </p>
          <button
            onClick={() => setADefinir('nova')}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            <Plus size={15} />
            Declarar a primeira zona
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {porProvincia.map(({ provincia, zonas: daProvincia }) => (
            <section key={provincia} className="rounded-lg border border-slate-200 bg-white">
              <p className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700">
                <MapPin size={12} className="text-slate-400" />
                {provincia}
              </p>

              <ul className="divide-y divide-slate-100">
                {daProvincia.map((zona) => (
                  <li key={zona.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                    <span
                      className={cn(
                        'text-sm',
                        zona.activa ? 'text-slate-900' : 'text-slate-400 line-through',
                      )}
                    >
                      {zona.cidade ?? 'Toda a província'}
                    </span>

                    {zona.cidade && (
                      <span
                        className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700"
                        title="Uma zona de cidade prevalece sobre a da província: a loja nesta cidade recebe estas condições."
                      >
                        prevalece
                      </span>
                    )}

                    {!zona.activa && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                        inactiva
                      </span>
                    )}

                    <span className="ml-auto flex flex-wrap items-center gap-x-3 text-[11px] text-slate-500">
                      <span>
                          {zona.prazoDias != null
                          ? `${zona.prazoDias} dias de trânsito`
                          : 'prazo não declarado'}
                      </span>
                      <span>
                        {zona.custoEntrega > 0 ? mt(zona.custoEntrega) : 'entrega incluída'}
                      </span>
                      {zona.valorMinimoEntrega != null && (
                        <span className="font-medium text-slate-600">
                          mín. {mt(zona.valorMinimoEntrega)}
                        </span>
                      )}
                    </span>

                    <div className="flex shrink-0 gap-1.5">
                      <button
                        onClick={() => setADefinir(zona)}
                        className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => remover.mutate(zona.id)}
                        disabled={remover.isPending}
                        className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {aDefinir && (
        <ZonaModal
          zona={aDefinir === 'nova' ? null : aDefinir}
          onClose={() => setADefinir(null)}
          onSuccess={recarregar}
        />
      )}
    </div>
  );
}

function ZonaModal({
  zona,
  onClose,
  onSuccess,
}: {
  zona: ZonaEntrega | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [f, setF] = useState({
    provincia: zona?.provincia ?? (PROVINCIAS[0] as string),
    cidade: zona?.cidade ?? '',
    prazoDias: zona?.prazoDias != null ? String(zona.prazoDias) : '',
    custoEntrega: String(zona?.custoEntrega ?? 0),
    valorMinimoEntrega: zona?.valorMinimoEntrega != null ? String(zona.valorMinimoEntrega) : '',
    activa: zona?.activa ?? true,
  });

  const gravar = useMutation({
    mutationFn: () =>
      portal.definirZona({
        provincia: f.provincia,
        cidade: f.cidade.trim() || undefined,
        prazoDias: f.prazoDias.trim() ? Number(f.prazoDias) : undefined,
        custoEntrega: Number(f.custoEntrega) || 0,
        valorMinimoEntrega: f.valorMinimoEntrega.trim()
          ? Number(f.valorMinimoEntrega)
          : undefined,
        activa: f.activa,
      }),
    onSuccess: () => {
      toast.success('Zona guardada.');
      onSuccess();
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao guardar a zona.'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          gravar.mutate();
        }}
        className="w-full max-w-md rounded-xl bg-white shadow-xl"
      >
        <header className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {zona ? 'Editar zona' : 'Declarar zona de entrega'}
          </h2>
        </header>

        <div className="space-y-4 px-5 py-5">
          <div>
            <label className="block text-xs font-medium text-slate-700">Província *</label>
            <select
              value={f.provincia}
              onChange={(e) => setF({ ...f, provincia: e.target.value })}
              disabled={!!zona}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-slate-50"
            >
              {PROVINCIAS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {/* Lista fixa e não texto livre: a zona é comparada com a cidade da loja do
                comprador, e «Nampula», «nampula » e «Nampuula» são três zonas diferentes
                para a base de dados. Um erro de escrita fá-lo desaparecer das comparações
                daquela província, sem aviso nenhum. */}
            <p className="mt-1 text-[11px] leading-snug text-slate-500">
              Lista fixa de propósito: um erro de escrita aqui fá-lo-ia desaparecer das
              comparações daquela província, sem aviso.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">Cidade</label>
            <input
              value={f.cidade}
              onChange={(e) => setF({ ...f, cidade: e.target.value })}
              disabled={!!zona}
              placeholder="Vazio = toda a província"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none disabled:bg-slate-50"
            />
            <p className="mt-1 text-[11px] leading-snug text-slate-500">
              Uma zona de cidade prevalece sobre a da província. Declare as duas se as
              condições forem diferentes na capital.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Dias de trânsito
              </label>
              <input
                type="number"
                min="0"
                value={f.prazoDias}
                onChange={(e) => setF({ ...f, prazoDias: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <p className="mt-1 text-[11px] leading-snug text-slate-500">
                Somados ao prazo de expedição do artigo.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Custo da entrega</label>
              <input
                type="number"
                step="any"
                min="0"
                value={f.custoEntrega}
                onChange={(e) => setF({ ...f, custoEntrega: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <p className="mt-1 text-[11px] leading-snug text-slate-500">
                Zero = incluída no preço.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">
              Valor mínimo por entrega
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={f.valorMinimoEntrega}
              onChange={(e) => setF({ ...f, valorMinimoEntrega: e.target.value })}
              placeholder="Vazio = sem mínimo"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] leading-snug text-slate-500">
              Por entrega, não por artigo. Uma requisição cuja parte que lhe cabe fique
              abaixo deste valor é assinalada ao comprador.
            </p>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={f.activa}
              onChange={(e) => setF({ ...f, activa: e.target.checked })}
              className="rounded border-slate-300"
            />
            Zona activa — desmarque para suspender temporariamente sem apagar
          </label>
        </div>

        <footer className="flex justify-end gap-2 rounded-b-xl border-t border-slate-100 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={gravar.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {gravar.isPending && <Loader2 size={15} className="animate-spin" />}
            Guardar
          </button>
        </footer>
      </form>
    </div>
  );
}

/** Agrupa por província, com a zona provincial primeiro e as cidades a seguir. */
function agruparPorProvincia(zonas: ZonaEntrega[]) {
  const grupos = new Map<string, ZonaEntrega[]>();

  for (const zona of zonas) {
    const lista = grupos.get(zona.provincia) ?? [];
    lista.push(zona);
    grupos.set(zona.provincia, lista);
  }

  return [...grupos.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'pt'))
    .map(([provincia, lista]) => ({
      provincia,
      // A provincial primeiro: é a regra geral, e as cidades são as excepções que a
      // prevalecem. A ordem inversa faria a excepção parecer a regra.
      zonas: [...lista].sort((a, b) => {
        const cidadeA = a.cidade ?? null;
        const cidadeB = b.cidade ?? null;
        if (cidadeA === null) return -1;
        if (cidadeB === null) return 1;
        return cidadeA.localeCompare(cidadeB, 'pt');
      }),
    }));
}
