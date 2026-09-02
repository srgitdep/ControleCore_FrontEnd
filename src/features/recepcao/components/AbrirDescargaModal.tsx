import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Button } from '@/shared/ui';
import { useArmazens } from '@/features/lojas';
import { purchasesApi } from '@/features/compras';
import { useRecepcaoMutations } from '../hooks/useRecepcoes';

/**
 * Abrir uma descarga.
 *
 * ## Só pedidos que ainda esperam mercadoria
 *
 * A lista exclui os já recebidos e os cancelados. O servidor recusa-os de qualquer forma, mas
 * oferecê-los aqui faria alguém preencher o resto do formulário para descobrir isso no fim.
 */
export function AbrirDescargaModal({ aoFechar }: { aoFechar: () => void }) {
  const navegar = useNavigate();
  const { abrir } = useRecepcaoMutations(undefined);
  const { armazens } = useArmazens();

  const { data: pedidos } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => purchasesApi.getOrders(),
  });

  const [pedidoId, setPedidoId] = useState('');
  const [armazemId, setArmazemId] = useState('');
  const [documentoRef, setDocumentoRef] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const porReceber = (pedidos ?? []).filter(
    (p: any) => p.estado !== 'RECEBIDO' && p.estado !== 'CANCELADO' && p.estado !== 'REJEITADO',
  );

  const submeter = () => {
    abrir.mutate(
      {
        pedidoId,
        armazemId,
        documentoRef: documentoRef.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
      },
      {
        onSuccess: (sessao) => {
          aoFechar();
          // Levar directamente à contagem: quem abre uma descarga vai contar a seguir, e
          // voltar à lista para reencontrar a linha que acabou de criar é um passo a mais com
          // o camião à espera.
          navegar(`/recepcoes/${sessao.id}`);
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="font-semibold text-slate-900">Abrir descarga</h3>
          <button onClick={aoFechar} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="text-sm font-medium text-slate-700">Pedido de compra</label>
            <select
              value={pedidoId}
              onChange={(e) => setPedidoId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            >
              <option value="">Escolher…</option>
              {porReceber.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.fornecedor?.nome ?? 'Fornecedor'} — {p.itens?.length ?? 0} linha(s) ·{' '}
                  {p.estado}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              A descarga nasce com as linhas que faltam receber deste pedido.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Armazém de destino</label>
            <select
              value={armazemId}
              onChange={(e) => setArmazemId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            >
              <option value="">Escolher…</option>
              {armazens.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.etiqueta}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Nº da factura ou guia <span className="text-slate-400">(opcional)</span>
            </label>
            <input
              value={documentoRef}
              onChange={(e) => setDocumentoRef(e.target.value)}
              placeholder="FAT-4587"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-400">
              Pode ser corrigido durante a descarga. A verificação de documento repetido corre
              no lançamento.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Observações</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <Button variant="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button onClick={submeter} disabled={!pedidoId || !armazemId || abrir.isPending}>
            Abrir e começar a contar
          </Button>
        </div>
      </div>
    </div>
  );
}
