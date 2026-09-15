import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, PlusCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCriarRegistro } from '../hooks/useFinanceiro';
import { suppliersApi } from '@/features/fornecedores';
import { useSearchClientes } from '@/features/crm';
import { useDebounce } from '@/shared/hooks';
import type { TipoLancamento } from '../types';

interface Props {
  tipo: TipoLancamento;
  onClose: () => void;
}

/**
 * Um lançamento financeiro manual: uma conta a pagar ou a receber que não nasceu de uma
 * venda ou de uma recepção de mercadoria — um aluguer, um serviço avulso, um acerto.
 *
 * Cliente/fornecedor são opcionais: nem todo lançamento tem uma contraparte no cadastro
 * (ex: uma taxa bancária).
 */
export function NovoRegistroModal({ tipo, onClose }: Props) {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [dataVencimento, setDataVencimento] = useState(new Date().toISOString().slice(0, 10));
  const [pesquisaContraparte, setPesquisaContraparte] = useState('');
  const [fornecedorId, setFornecedorId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [nomeContraparte, setNomeContraparte] = useState('');

  const pesquisaAtrasada = useDebounce(pesquisaContraparte, 300);

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => suppliersApi.getSuppliers(),
    enabled: tipo === 'DESPESA',
  });

  const { data: clientesEncontrados = [] } = useSearchClientes(
    tipo === 'RECEITA' ? pesquisaAtrasada : '',
  );

  const criar = useCriarRegistro();

  const fornecedoresFiltrados = fornecedores.filter(
    (f) => f.isActive && f.nome.toLowerCase().includes(pesquisaContraparte.toLowerCase()),
  );

  const submeter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) return toast.error('Descreva o lançamento.');
    const valorNum = Number(valor);
    if (!(valorNum > 0)) return toast.error('O valor tem de ser maior que zero.');
    if (!dataVencimento) return toast.error('Indique a data de vencimento.');

    criar.mutate(
      {
        tipo,
        descricao: descricao.trim(),
        valor: valorNum,
        dataVencimento,
        fornecedorId: tipo === 'DESPESA' ? fornecedorId || undefined : undefined,
        clienteId: tipo === 'RECEITA' ? clienteId || undefined : undefined,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <form onSubmit={submeter} className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <PlusCircle className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {tipo === 'RECEITA' ? 'Nova conta a receber' : 'Nova conta a pagar'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Descrição</label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder={tipo === 'RECEITA' ? 'Ex.: Aluguer de espaço' : 'Ex.: Manutenção do gerador'}
              className="w-full rounded-xl border px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Valor (MT)</label>
              <input
                type="number"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                min={0}
                step="0.01"
                className="w-full rounded-xl border px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Vencimento</label>
              <input
                type="date"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                className="w-full rounded-xl border px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {tipo === 'RECEITA' ? 'Cliente' : 'Fornecedor'}{' '}
              <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            {nomeContraparte ? (
              <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm">
                <span className="font-medium text-slate-900">{nomeContraparte}</span>
                <button
                  type="button"
                  onClick={() => {
                    setNomeContraparte('');
                    setFornecedorId('');
                    setClienteId('');
                  }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  trocar
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={pesquisaContraparte}
                  onChange={(e) => setPesquisaContraparte(e.target.value)}
                  placeholder="Procurar..."
                  className="w-full rounded-xl border px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                />
                {pesquisaContraparte.trim().length >= 2 && (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                    {tipo === 'DESPESA'
                      ? fornecedoresFiltrados.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => {
                              setFornecedorId(f.id);
                              setNomeContraparte(f.nome);
                            }}
                            className="flex w-full items-center px-4 py-2 text-left text-sm hover:bg-slate-50"
                          >
                            {f.nome}
                          </button>
                        ))
                      : clientesEncontrados.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setClienteId(c.id);
                              setNomeContraparte(c.nome);
                            }}
                            className="flex w-full items-center px-4 py-2 text-left text-sm hover:bg-slate-50"
                          >
                            {c.nome}
                          </button>
                        ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 p-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={criar.isPending}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {criar.isPending && <Loader2 size={16} className="animate-spin" />}
            Criar
          </button>
        </div>
      </form>
    </div>
  );
}
