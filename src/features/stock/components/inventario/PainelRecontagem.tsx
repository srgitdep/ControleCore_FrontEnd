import { useState } from 'react';
import { CheckCircle2, MapPin, ShieldCheck } from 'lucide-react';
import { useRecontagensPendentes, useAtribuirRecontagem, useRegistrarRecontagem } from '@/features/stock';
import { Button } from '@/shared/ui';
import toast from 'react-hot-toast';

/**
 * Recontagem cega (§10): "a segunda pessoa vê apenas produto, foto e
 * localização; nunca stock teórico, primeira contagem ou divergência". O
 * backend já filtra isso na API — este componente também nunca lê nem exibe
 * nenhum campo de teórico, mesmo que viesse por engano.
 */
export function PainelRecontagem({ cycleId }: { cycleId: string }) {
  const { data: pendentes = [], isLoading } = useRecontagensPendentes(cycleId);
  const atribuir = useAtribuirRecontagem(cycleId);
  const registrar = useRegistrarRecontagem(cycleId);
  const [itemEmContagemId, setItemEmContagemId] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (pendentes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 bg-emerald-50 rounded-full mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Sem recontagens pendentes</h3>
        <p className="text-slate-500 text-sm max-w-sm">
          Todas as divergências deste ciclo já foram recontadas ou não excederam a tolerância.
        </p>
      </div>
    );
  }

  const itemEmContagem = pendentes.find((p) => p.inventoryCountId === itemEmContagemId);

  const iniciar = (id: string) => {
    atribuir.mutate(id, {
      onSuccess: () => {
        setItemEmContagemId(id);
        setQuantidade('');
      },
      onError: (err: any) =>
        toast.error(err?.response?.data?.message ?? 'Não foi possível atribuir esta recontagem.'),
    });
  };

  const confirmar = () => {
    if (!itemEmContagemId || quantidade.trim() === '') return;
    const n = parseFloat(quantidade);
    if (!Number.isFinite(n) || n < 0) return;

    registrar.mutate(
      { inventoryCountId: itemEmContagemId, physicalQuantity: n },
      {
        onSuccess: (res) => {
          toast.success(
            res.divergenciaConfirmada
              ? 'Recontagem registada — a divergência foi confirmada e segue para análise.'
              : 'Recontagem registada — o valor bate com o esperado.',
          );
          setItemEmContagemId(null);
          setQuantidade('');
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-purple-100 bg-purple-50/60 px-4 py-3">
        <ShieldCheck className="h-5 w-5 shrink-0 text-purple-500" />
        <p className="text-xs text-purple-700">
          <span className="font-semibold">Recontagem cega.</span> Você vê apenas produto, foto e
          localização — nunca o stock teórico, a primeira contagem ou a divergência.
        </p>
      </div>

      {itemEmContagem ? (
        <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 text-center">
            {itemEmContagem.produto.imagemUrl ? (
              <img
                src={itemEmContagem.produto.imagemUrl}
                alt=""
                className="mx-auto mb-3 h-20 w-20 rounded-xl object-cover"
              />
            ) : (
              <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-xl bg-slate-100 text-slate-300">
                <MapPin className="h-8 w-8" />
              </div>
            )}
            <p className="font-bold text-slate-800">{itemEmContagem.produto.nome}</p>
            {itemEmContagem.produto.codigoBarras && (
              <p className="text-xs text-slate-400">{itemEmContagem.produto.codigoBarras}</p>
            )}
            <p className="mt-1 flex items-center justify-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3" />
              {itemEmContagem.localizacao?.codigo ?? '—'}
            </p>
          </div>

          <label className="mb-1.5 block text-xs font-medium text-slate-600 text-center">
            Quantidade encontrada
          </label>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            placeholder="0"
            autoFocus
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-center text-2xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          <div className="mt-4 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setItemEmContagemId(null)}>
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              disabled={quantidade.trim() === '' || registrar.isPending}
              onClick={confirmar}
            >
              {registrar.isPending ? 'A registar...' : 'Registar Recontagem'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pendentes.map((p) => (
            <button
              key={p.inventoryCountId}
              onClick={() => iniciar(p.inventoryCountId)}
              disabled={atribuir.isPending}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-purple-300 hover:shadow-sm transition-all disabled:opacity-50"
            >
              {p.produto.imagemUrl ? (
                <img src={p.produto.imagemUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-300">
                  <MapPin className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">{p.produto.nome}</p>
                <p className="text-xs text-slate-400">{p.localizacao?.codigo ?? '—'}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
