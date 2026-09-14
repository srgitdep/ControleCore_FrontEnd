import { useState } from 'react';
import { Check, MapPin, AlertTriangle } from 'lucide-react';
import { useIniciarContagem, useRegisterCount, useConfirmarZero, useRegistarForaDaLocalizacao } from '@/features/stock';
import { Button } from '@/shared/ui';
import type { InventoryCount } from '@/features/stock';

/**
 * Registar contagem de UM item (Produto + Localização) — §5: as três ações
 * do painel de contagem (Registar e Concluir | Marcar como não encontrado |
 * Produto noutra localização). Nunca mostra stock teórico: `item.systemQuantity`
 * é sempre `null` neste ponto do fluxo (a cegueira é aplicada pelo backend).
 */
export function ContagemItemPanel({
  cycleId,
  item,
  localizacoesDoArmazem,
  onConcluido,
}: {
  cycleId: string;
  item: InventoryCount;
  /** Para o selector de "produto noutra localização" — localizações do mesmo armazém. */
  localizacoesDoArmazem: Array<{ id: string; codigo: string; descricao: string | null }>;
  onConcluido?: () => void;
}) {
  const [quantidade, setQuantidade] = useState('');
  const [modo, setModo] = useState<'contar' | 'fora'>('contar');
  const [localizacaoRealId, setLocalizacaoRealId] = useState('');

  const iniciarContagem = useIniciarContagem(cycleId);
  const registerCount = useRegisterCount(cycleId);
  const confirmarZero = useConfirmarZero(cycleId);
  const registarFora = useRegistarForaDaLocalizacao(cycleId);

  const produto = item.stock?.product;
  const unidade = produto?.unidadeMedida ?? 'UN';
  const isPending = registerCount.isPending || confirmarZero.isPending || registarFora.isPending;

  const garantirEmContagem = async () => {
    if (item.status === 'PENDENTE') {
      await iniciarContagem.mutateAsync(item.id);
    }
  };

  const handleRegistar = async () => {
    await garantirEmContagem();
    const n = parseFloat(quantidade);
    if (!Number.isFinite(n)) return;

    if (n === 0) {
      confirmarZero.mutate(
        { inventoryCountId: item.id, confirmado: true },
        { onSuccess: () => onConcluido?.() },
      );
      return;
    }

    registerCount.mutate(
      { inventoryCountId: item.id, physicalQuantity: n },
      { onSuccess: () => onConcluido?.() },
    );
  };

  const handleForaDaLocalizacao = async () => {
    const n = parseFloat(quantidade);
    if (!Number.isFinite(n) || !localizacaoRealId) return;
    await garantirEmContagem();
    registarFora.mutate(
      { inventoryCountId: item.id, localizacaoRealId, physicalQuantity: n },
      { onSuccess: () => onConcluido?.() },
    );
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        {produto?.imagemUrl ? (
          <img src={produto.imagemUrl} alt="" className="h-14 w-14 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-300">
            <MapPin className="h-6 w-6" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800 truncate">{produto?.nome ?? '—'}</p>
          {produto?.codigoBarras && <p className="text-xs text-slate-400">{produto.codigoBarras}</p>}
          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3 w-3" />
            Prateleira: <span className="font-medium">{item.localizacaoEsperada?.codigo ?? '—'}</span>
          </p>
        </div>
      </div>

      {modo === 'contar' ? (
        <div className="mt-4 space-y-3">
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
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-center text-2xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {quantidade.trim() === '0' && (
            <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Confirme que verificou toda a localização antes de registar zero.
            </p>
          )}

          <Button
            className="w-full"
            disabled={quantidade.trim() === '' || isPending}
            onClick={handleRegistar}
          >
            <Check className="h-4 w-4" />
            {isPending ? 'A registar...' : 'Registar e Concluir'}
          </Button>

          <button
            type="button"
            onClick={() => setModo('fora')}
            className="w-full rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Produto encontrado noutra localização
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Onde foi encontrado?
            </label>
            <select
              value={localizacaoRealId}
              onChange={(e) => setLocalizacaoRealId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione a localização real</option>
              {localizacoesDoArmazem
                .filter((l) => l.id !== item.localizacaoEsperadaId)
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.codigo}{l.descricao ? ` — ${l.descricao}` : ''}
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
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setModo('contar')}>
              Voltar
            </Button>
            <Button
              variant="warning"
              className="flex-1"
              disabled={!localizacaoRealId || quantidade.trim() === '' || isPending}
              onClick={handleForaDaLocalizacao}
            >
              Confirmar
            </Button>
          </div>
        </div>
      )}

      <p className="mt-3 text-center text-[11px] text-slate-400">
        Unidade: {unidade} — o saldo do sistema não é mostrado de propósito (contagem cega).
      </p>
    </div>
  );
}
