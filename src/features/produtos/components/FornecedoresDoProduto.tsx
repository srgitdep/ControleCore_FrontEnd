import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Building2, Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { suppliersApi } from '@/features/fornecedores';
import { catalogApi, type FornecedorDoProduto } from '../api/catalog.api';

/**
 * A quem se compra este produto, com que referência e a que preço.
 *
 * ## Porque este painel faltava
 *
 * A tabela `produto_fornecedores` existia, com `referenciaFornecedor` e `custoCompra`, e
 * os três endpoints de escrita também. Nenhum era chamado por nenhum ecrã — e como o
 * `GET` da lista vem dentro da ficha do produto, que também não era pedida, o mapeamento
 * era **inacessível nas duas direcções**: não se via nem se escrevia.
 *
 * O custo daí é maior do que parece. É deste custo que a sugestão de compras tira o
 * `fornecedorSugerido` e o valor estimado de cada linha; sem fornecedores ligados, a
 * sugestão diz o que repor mas não a quem comprar.
 *
 * ## O custo aqui não é o custo médio
 *
 * `custoCompra` é o preço praticado por **este** fornecedor — o que se usa para comparar
 * propostas e estimar uma encomenda. O custo médio do stock é outra coisa: nasce das
 * entradas efectivas, vive por armazém, e nada aqui o altera. Confundi-los faria uma
 * actualização de tabela de preços reescrever a valorização do que está na prateleira.
 */
export function FornecedoresDoProduto({ produtoId }: { produtoId: string }) {
  const queryClient = useQueryClient();
  const [aAcrescentar, setAAcrescentar] = useState(false);
  const [aEditar, setAEditar] = useState<string | null>(null);

  const { data: produto, isLoading } = useQuery({
    queryKey: ['produto-fornecedores', produtoId],
    queryFn: () => catalogApi.getProduct(produtoId),
  });

  const { data: fornecedores } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => suppliersApi.getSuppliers(),
  });

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['produto-fornecedores', produtoId] });
    // A sugestão de compras lê este custo para saber a quem comprar e por quanto.
    queryClient.invalidateQueries({ queryKey: ['sugestoes-compra'] });
  };

  const aoFalhar = (erro: any) =>
    toast.error(erro?.response?.data?.message || 'Não foi possível concluir a operação.');

  const ligar = useMutation({
    mutationFn: (payload: {
      fornecedorId: string;
      referenciaFornecedor?: string;
      custoCompra: number;
    }) => catalogApi.addSupplierToProduct(produtoId, payload),
    onSuccess: () => {
      invalidar();
      setAAcrescentar(false);
      toast.success('Fornecedor ligado ao produto.');
    },
    onError: aoFalhar,
  });

  const actualizar = useMutation({
    mutationFn: ({
      fornecedorId,
      ...payload
    }: {
      fornecedorId: string;
      referenciaFornecedor?: string;
      custoCompra: number;
    }) => catalogApi.updateSupplierOfProduct(produtoId, fornecedorId, payload),
    onSuccess: () => {
      invalidar();
      setAEditar(null);
      toast.success('Referência e custo actualizados.');
    },
    onError: aoFalhar,
  });

  const remover = useMutation({
    mutationFn: (fornecedorId: string) =>
      catalogApi.removeSupplierFromProduct(produtoId, fornecedorId),
    onSuccess: () => {
      invalidar();
      toast.success('Fornecedor desligado deste produto.');
    },
    onError: aoFalhar,
  });

  if (isLoading) return null;

  const ligados = produto?.fornecedores ?? [];
  const jaLigados = new Set(ligados.map((f) => f.fornecedorId));

  // Um fornecedor suspenso daria uma ligação que a ordem de compra depois recusa.
  const disponiveis = (fornecedores ?? []).filter(
    (f: any) => !jaLigados.has(f.id) && f.isActive !== false,
  );

  return (
    <div className="mt-6 border-t border-slate-100 pt-5">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-700">Fornecedores deste produto</h3>
      </div>

      <p className="mt-1 text-xs text-slate-400">
        A referência é o código com que cada fornecedor chama este produto — o que vai na
        encomenda. O custo é o preço que ele pratica, e é dele que a sugestão de compras tira
        a quem comprar e por quanto.
      </p>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Fornecedor</th>
              <th className="px-3 py-2 text-left font-medium">Referência</th>
              <th className="px-3 py-2 text-right font-medium">Custo</th>
              <th className="w-20" />
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {ligados.map((ligacao) =>
              aEditar === ligacao.fornecedorId ? (
                <LinhaEditavel
                  key={ligacao.id}
                  nome={ligacao.fornecedor?.nome ?? '—'}
                  referenciaInicial={ligacao.referenciaFornecedor ?? ''}
                  custoInicial={String(ligacao.custoCompra ?? '')}
                  aGravar={actualizar.isPending}
                  aoCancelar={() => setAEditar(null)}
                  aoGravar={(referencia, custo) =>
                    actualizar.mutate({
                      fornecedorId: ligacao.fornecedorId,
                      referenciaFornecedor: referencia || undefined,
                      custoCompra: custo,
                    })
                  }
                />
              ) : (
                <LinhaLigada
                  key={ligacao.id}
                  ligacao={ligacao}
                  aoEditar={() => setAEditar(ligacao.fornecedorId)}
                  aoRemover={() => remover.mutate(ligacao.fornecedorId)}
                />
              ),
            )}

            {aAcrescentar && (
              <LinhaNova
                disponiveis={disponiveis}
                aGravar={ligar.isPending}
                aoCancelar={() => setAAcrescentar(false)}
                aoGravar={(fornecedorId, referencia, custo) =>
                  ligar.mutate({
                    fornecedorId,
                    referenciaFornecedor: referencia || undefined,
                    custoCompra: custo,
                  })
                }
              />
            )}

            {ligados.length === 0 && !aAcrescentar && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-xs text-slate-400">
                  Nenhum fornecedor ligado. A sugestão de compras não saberá a quem encomendar
                  este produto.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!aAcrescentar && (
        <>
          {disponiveis.length > 0 ? (
            <button
              type="button"
              onClick={() => setAAcrescentar(true)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              <Plus size={13} />
              Ligar fornecedor
            </button>
          ) : (
            <p className="mt-2 text-xs text-slate-400">
              {(fornecedores ?? []).length === 0
                ? 'Ainda não há fornecedores registados. Criam-se no separador Fornecedores das Compras.'
                : 'Todos os fornecedores activos já estão ligados a este produto.'}
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ─── Linhas ──────────────────────────────────────────────────────────────────

function LinhaLigada({
  ligacao,
  aoEditar,
  aoRemover,
}: {
  ligacao: FornecedorDoProduto;
  aoEditar: () => void;
  aoRemover: () => void;
}) {
  return (
    <tr>
      <td className="px-3 py-2 font-medium text-slate-800">{ligacao.fornecedor?.nome ?? '—'}</td>
      <td className="px-3 py-2">
        {ligacao.referenciaFornecedor ? (
          <span className="font-mono text-xs text-slate-600">{ligacao.referenciaFornecedor}</span>
        ) : (
          <span className="text-xs text-slate-300">sem referência</span>
        )}
      </td>
      <td className="px-3 py-2 text-right font-semibold text-slate-900">
        {Number(ligacao.custoCompra).toLocaleString('pt-MZ', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
        <span className="ml-1 text-xs font-normal text-slate-400">MT</span>
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={aoEditar}
            className="text-slate-300 hover:text-indigo-600"
            aria-label={`Editar ${ligacao.fornecedor?.nome ?? 'fornecedor'}`}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={aoRemover}
            className="text-slate-300 hover:text-red-600"
            aria-label={`Desligar ${ligacao.fornecedor?.nome ?? 'fornecedor'}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function LinhaEditavel({
  nome,
  referenciaInicial,
  custoInicial,
  aGravar,
  aoGravar,
  aoCancelar,
}: {
  nome: string;
  referenciaInicial: string;
  custoInicial: string;
  aGravar: boolean;
  aoGravar: (referencia: string, custo: number) => void;
  aoCancelar: () => void;
}) {
  const [referencia, setReferencia] = useState(referenciaInicial);
  const [custo, setCusto] = useState(custoInicial);

  const valido = custo !== '' && Number(custo) >= 0;

  return (
    <tr className="bg-indigo-50/40">
      <td className="px-3 py-2 font-medium text-slate-800">{nome}</td>
      <td className="px-3 py-2">
        <input
          value={referencia}
          onChange={(e) => setReferencia(e.target.value)}
          placeholder="ARZ-25KG"
          className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          step="any"
          min="0"
          value={custo}
          onChange={(e) => setCusto(e.target.value)}
          className="w-24 rounded border border-slate-200 px-2 py-1 text-right text-sm"
        />
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            disabled={!valido || aGravar}
            onClick={() => aoGravar(referencia.trim(), Number(custo))}
            className="text-emerald-600 hover:text-emerald-800 disabled:opacity-30"
            aria-label="Gravar"
          >
            <Check size={15} />
          </button>
          <button
            type="button"
            onClick={aoCancelar}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Cancelar"
          >
            <X size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function LinhaNova({
  disponiveis,
  aGravar,
  aoGravar,
  aoCancelar,
}: {
  disponiveis: { id: string; nome: string }[];
  aGravar: boolean;
  aoGravar: (fornecedorId: string, referencia: string, custo: number) => void;
  aoCancelar: () => void;
}) {
  const [fornecedorId, setFornecedorId] = useState('');
  const [referencia, setReferencia] = useState('');
  const [custo, setCusto] = useState('');

  const valido = !!fornecedorId && custo !== '' && Number(custo) >= 0;

  return (
    <tr className="bg-blue-50/40">
      <td className="px-3 py-2">
        <select
          value={fornecedorId}
          onChange={(e) => setFornecedorId(e.target.value)}
          className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
        >
          <option value="">Escolher fornecedor…</option>
          {disponiveis.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <input
          value={referencia}
          onChange={(e) => setReferencia(e.target.value)}
          placeholder="ARZ-25KG"
          className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          step="any"
          min="0"
          value={custo}
          onChange={(e) => setCusto(e.target.value)}
          placeholder="0.00"
          className="w-24 rounded border border-slate-200 px-2 py-1 text-right text-sm"
        />
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            disabled={!valido || aGravar}
            onClick={() => aoGravar(fornecedorId, referencia.trim(), Number(custo))}
            className="text-emerald-600 hover:text-emerald-800 disabled:opacity-30"
            aria-label="Ligar"
          >
            <Check size={15} />
          </button>
          <button
            type="button"
            onClick={aoCancelar}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Cancelar"
          >
            <X size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}
