import { useState } from 'react';
import { X, PackagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRegistarProdutoInesperado } from '@/features/stock';

/**
 * "+ Produto encontrado" (§5): um produto achado na contagem que não fazia
 * parte do perímetro do ciclo — não tinha StockLocalizacao, por isso
 * `criarCicloComPerimetro` nunca o carregou. Fica rastreado como ocorrência
 * a investigar (PRODUTO_INESPERADO), fora da cobertura obrigatória.
 */
export function RegistarProdutoInesperadoModal({
  cycleId,
  armazemId,
  localizacoesDoArmazem,
  onClose,
}: {
  cycleId: string;
  armazemId: string;
  localizacoesDoArmazem: Array<{ id: string; codigo: string; nome: string | null; caminho: string }>;
  onClose: () => void;
}) {
  const [codigoBarras, setCodigoBarras] = useState('');
  const [localizacaoRealId, setLocalizacaoRealId] = useState('');
  const [quantidade, setQuantidade] = useState('');

  const registar = useRegistarProdutoInesperado(cycleId);

  const podeSubmeter = codigoBarras.trim() !== '' && localizacaoRealId !== '' && quantidade.trim() !== '';

  const handleSubmit = () => {
    const n = parseFloat(quantidade);
    if (!Number.isFinite(n) || !localizacaoRealId) return;

    registar.mutate(
      { codigoBarras: codigoBarras.trim(), armazemId, localizacaoRealId, physicalQuantity: n },
      {
        onSuccess: () => {
          toast.success('Produto inesperado registado — fica na lista para o Gestor investigar.');
          onClose();
        },
        onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Não foi possível registar o produto.'),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2">
              <PackagePlus className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Produto encontrado</h2>
              <p className="text-xs text-slate-500">Não estava previsto neste inventário — fica registado para investigação.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Código de barras</label>
            <input
              value={codigoBarras}
              onChange={(e) => setCodigoBarras(e.target.value)}
              placeholder="Digite ou escaneie o código"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Onde foi encontrado?</label>
            <select
              value={localizacaoRealId}
              onChange={(e) => setLocalizacaoRealId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione a localização</option>
              {localizacoesDoArmazem.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.caminho}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Quantidade encontrada</label>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-center text-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!podeSubmeter || registar.isPending}
            className="w-full rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {registar.isPending ? 'A registar...' : 'Registar como inesperado'}
          </button>
        </div>
      </div>
    </div>
  );
}
