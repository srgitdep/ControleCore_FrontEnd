import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Button } from '@/shared/ui';
import { suppliersApi } from '@/features/fornecedores';
import type { Requisicao } from '../api/requisicoes.api';
import { useRequisicaoMutations } from '../hooks/useRequisicoes';

/**
 * Converter uma requisição aprovada numa ordem de compra.
 *
 * ## A ordem nasce em rascunho
 *
 * A aprovação da requisição autorizou a **necessidade**, não o preço nem o fornecedor. Quem
 * negoceia ainda tem de fechar a ordem — e é por isso que este passo pede o fornecedor: até
 * aqui não havia nenhum.
 *
 * Os custos que vão nas linhas são as estimativas da requisição, que serviram para escolher o
 * escalão de aprovação. Não são preço acordado, e o ecrã di-lo.
 */
export function ConverterEmOrdemModal({
  requisicao,
  aoFechar,
}: {
  requisicao: Requisicao;
  aoFechar: () => void;
}) {
  const { converter } = useRequisicaoMutations(requisicao.id);
  const [fornecedorId, setFornecedorId] = useState('');
  const [dataPrevista, setDataPrevista] = useState('');

  const { data: fornecedores } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => suppliersApi.getSuppliers(),
  });

  // Um fornecedor suspenso daria uma ordem que o próprio `CriarPedidoCompraUseCase` recusa.
  const elegiveis = (fornecedores ?? []).filter((f: any) => f.isActive !== false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div>
            <h3 className="font-semibold text-slate-900">
              Converter {requisicao.numero} em ordem de compra
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {requisicao.itens.length} linha(s) · estimativa{' '}
              {requisicao.valorEstimado.toFixed(2)} MT
            </p>
          </div>
          <button onClick={aoFechar} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="text-sm font-medium text-slate-700">Fornecedor</label>
            <select
              value={fornecedorId}
              onChange={(e) => setFornecedorId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            >
              <option value="">Escolher…</option>
              {elegiveis.map((f: any) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Data prevista de entrega <span className="text-slate-400">(opcional)</span>
            </label>
            <input
              type="date"
              value={dataPrevista}
              onChange={(e) => setDataPrevista(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>

          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            A ordem nasce em <span className="font-medium text-slate-700">rascunho</span>. Os
            custos das linhas são as estimativas que serviram para escolher o escalão de
            aprovação — não são preço acordado, e é isso que falta negociar antes de a enviar.
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <Button variant="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button
            disabled={!fornecedorId || converter.isPending}
            onClick={() =>
              converter.mutate(
                {
                  requisicaoId: requisicao.id,
                  fornecedorId,
                  dataPrevista: dataPrevista || undefined,
                },
                { onSuccess: aoFechar },
              )
            }
          >
            Criar ordem
          </Button>
        </div>
      </div>
    </div>
  );
}
