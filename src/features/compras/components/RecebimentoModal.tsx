import { useEffect, useState } from 'react';
import { X, CheckCircle, Truck, PackageCheck, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { purchasesApi } from '../api/purchases.api';
import type { PurchaseOrder, PurchaseOrderItem } from '../api/purchases.api';
import { useArmazens } from '@/features/lojas';
import { cn } from '@/shared/utils';

const moeda = (valor: number) =>
  valor.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });

// ── Lote e validade de uma linha ─────────────────────────────────────────────

interface CamposDeLoteProps {
  item: PurchaseOrderItem;
  valor: { lote?: string; dataValidade?: string };
  onChange: (campos: { lote?: string; dataValidade?: string }) => void;
}

/**
 * Os campos de lote e validade de uma linha da recepção.
 *
 * ## Porque estão aqui e não num ecrã à parte
 *
 * A entrada de mercadoria é o único momento em que alguém tem estes dados à frente dos
 * olhos: a validade está impressa na embalagem e o lote no documento do fornecedor. Um ecrã
 * posterior de «registar validades» obrigaria a voltar ao armazém com uma lista, e a resposta
 * seria não preencher — a tabela de lotes ficaria vazia e os alertas nunca disparariam.
 *
 * ## Obrigatório só onde o produto o exige
 *
 * Para os restantes, os campos ficam visíveis mas opcionais: um saco de cimento não tem
 * validade, e exigi-la faria a recepção mais lenta sem nada em troca. Marcar o produto com
 * controlo de validade é o que torna o campo obrigatório — e o pedido é recusado sem ele,
 * tanto aqui como no servidor.
 */
function CamposDeLote({ item, valor, onChange }: CamposDeLoteProps) {
  const exigeValidade = item.produto?.temValidade === true;
  const exigeLote = item.produto?.rastreavelPorLote === true;

  const faltaValidade = exigeValidade && !valor.dataValidade;
  const faltaLote = exigeLote && !valor.lote?.trim();

  // Uma validade no passado é aceite pelo servidor — há mercadoria que chega já fora de
  // prazo, e esconder isso seria pior. Mas vale avisar quem escreve, porque a causa mais
  // provável é um engano no ano.
  const jaExpirada =
    !!valor.dataValidade && new Date(valor.dataValidade) < new Date(new Date().toDateString());

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Validade
            {exigeValidade && <span className="ml-1 text-rose-600">obrigatória</span>}
          </span>
          <input
            type="date"
            value={valor.dataValidade ?? ''}
            onChange={(e) => onChange({ dataValidade: e.target.value })}
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-sm',
              faltaValidade ? 'border-rose-400 bg-rose-50' : 'border-slate-200',
            )}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Lote
            {exigeLote ? (
              <span className="ml-1 text-rose-600">obrigatório</span>
            ) : (
              <span className="ml-1 font-normal text-slate-400">opcional</span>
            )}
          </span>
          <input
            type="text"
            placeholder={valor.dataValidade ? 'deriva da validade se vazio' : 'ex: L-2026-114'}
            value={valor.lote ?? ''}
            onChange={(e) => onChange({ lote: e.target.value })}
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-sm',
              faltaLote ? 'border-rose-400 bg-rose-50' : 'border-slate-200',
            )}
          />
        </label>
      </div>

      {faltaValidade && (
        <p className="mt-2 text-xs text-rose-600">
          Este produto é controlado por validade. Sem a data não há alerta possível antes da
          perda.
        </p>
      )}

      {jaExpirada && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          A data indicada já passou. Se a mercadoria chegou fora de prazo, é legítimo — se não,
          verifique o ano.
        </p>
      )}
    </div>
  );
}

interface RecebimentoModalProps {
  order: PurchaseOrder;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Entrada de mercadoria de um pedido de compra.
 *
 * ## Três defeitos que esta versão corrige
 *
 * 1. **O armazém era um campo de texto para escrever o UUID à mão**, com o rótulo
 *    «Armazém de Destino (ID)» e o placeholder `Ex: armazem-principal-id`. Se ficasse
 *    vazio, enviava a string literal `'default-armazem-id'` — que o servidor recusa.
 *    Passa a ser um selector dos armazéns activos.
 * 2. **Forçava recepção total.** Enviava `quantidade: item.quantidadePedida` sem campo
 *    editável, pelo que a recepção parcial que o backend suporta era inalcançável pela
 *    interface. Cada linha passa a ter quantidade editável, limitada ao que falta.
 * 3. **Recebia o pedido da listagem, que não inclui `itens`.** A tabela mostrava
 *    sempre «Nenhum item encontrado neste pedido» e o pedido era enviado com
 *    `itens: []`. Passa a buscar o pedido completo com `getOrderById`.
 */
export function RecebimentoModal({ order, onClose, onSuccess }: RecebimentoModalProps) {
  const [loading, setLoading] = useState(false);
  const [armazemId, setArmazemId] = useState('');
  const [documentoRef, setDocumentoRef] = useState('');

  const { armazens, isLoading: isLoadingArmazens } = useArmazens();

  // A listagem de pedidos não traz `itens` — sem isto a recepção iria vazia.
  const [itens, setItens] = useState<PurchaseOrderItem[]>(order.itens ?? []);
  const [isLoadingItens, setIsLoadingItens] = useState(!order.itens?.length);

  const [quantidades, setQuantidades] = useState<Record<string, number>>({});

  /**
   * Lote e validade por linha do pedido.
   *
   * Guardado por `item.id` como as quantidades. Fica no mesmo sítio onde se escreve a
   * quantidade porque é o mesmo momento: quem recebe tem o documento numa mão e a caixa na
   * outra, e a validade está impressa na caixa.
   */
  const [lotes, setLotes] = useState<Record<string, { lote?: string; dataValidade?: string }>>({});

  useEffect(() => {
    if (order.itens?.length) return;

    let activo = true;
    purchasesApi
      .getOrderById(order.id)
      .then((completo) => {
        if (activo) setItens(completo.itens ?? []);
      })
      .catch(() => {
        if (activo) toast.error('Não foi possível carregar as linhas do pedido.');
      })
      .finally(() => {
        if (activo) setIsLoadingItens(false);
      });

    return () => {
      activo = false;
    };
  }, [order.id, order.itens]);

  // Por omissão recebe-se o que falta — o caso mais comum — mas cada linha é editável.
  const emFalta = (item: PurchaseOrderItem) => item.quantidadePedida - item.quantidadeRecebida;
  const quantidadeDe = (item: PurchaseOrderItem) => quantidades[item.id] ?? emFalta(item);

  const loteDe = (item: PurchaseOrderItem) => lotes[item.id] ?? {};

  const porReceber = itens.filter((i) => emFalta(i) > 0);
  const total = porReceber.reduce((soma, i) => soma + quantidadeDe(i) * i.custoUnitario, 0);

  const linhaInvalida = porReceber.find((i) => {
    const q = quantidadeDe(i);
    return q < 0 || q > emFalta(i);
  });

  /**
   * As linhas a que falta a validade ou o lote que o produto exige.
   *
   * Verificado aqui e não só no servidor: o backend recusa a recepção inteira, e a recusa
   * chega com o camião à porta e a mercadoria no chão. Melhor marcar o campo em falta antes
   * de alguém carregar em Confirmar.
   */
  const linhasSemValidade = porReceber.filter(
    (i) => quantidadeDe(i) > 0 && i.produto?.temValidade && !loteDe(i).dataValidade,
  );
  const linhasSemLote = porReceber.filter(
    (i) => quantidadeDe(i) > 0 && i.produto?.rastreavelPorLote && !loteDe(i).lote?.trim(),
  );

  const confirmar = async () => {
    if (!armazemId) return toast.error('Escolha o armazém de destino.');

    const aReceber = porReceber
      .map((i) => ({ item: i, quantidade: quantidadeDe(i) }))
      .filter(({ quantidade }) => quantidade > 0);

    if (aReceber.length === 0) {
      return toast.error('Indique a quantidade recebida de pelo menos um produto.');
    }

    if (linhasSemValidade.length > 0) {
      return toast.error(
        `Falta a data de validade de: ${linhasSemValidade
          .map((i) => i.produto?.nome ?? 'produto')
          .join(', ')}. Sem ela não há alerta possível antes da perda.`,
      );
    }

    if (linhasSemLote.length > 0) {
      return toast.error(
        `Falta o código do lote de: ${linhasSemLote
          .map((i) => i.produto?.nome ?? 'produto')
          .join(', ')}.`,
      );
    }

    setLoading(true);
    try {
      await purchasesApi.receiveOrder(order.id, {
        armazemId,
        documentoRef: documentoRef.trim() || undefined,
        observacoes: 'Recepção registada na secção Compras',
        itens: aReceber.map(({ item, quantidade }) => {
          const { lote, dataValidade } = loteDe(item);
          return {
            produtoId: item.produtoId,
            quantidade,
            custoUnitario: item.custoUnitario,
            // Só vão se preenchidos: uma string vazia falharia a validação `IsDateString`
            // do servidor, e enviar `lote: ''` criaria um lote de código vazio.
            lote: lote?.trim() || undefined,
            dataValidade: dataValidade || undefined,
          };
        }),
      });

      toast.success('Mercadoria recebida. O stock, o custo médio e as contas a pagar foram actualizados.', {
        duration: 4000,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao confirmar a recepção.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Receber mercadoria</h2>
              <p className="text-sm text-slate-500">
                Pedido #{order.id.slice(0, 8)} · {order.fornecedor?.nome ?? 'fornecedor n/d'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Corpo ──────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Armazém de destino <span className="text-rose-500">*</span>
              </label>
              <select
                value={armazemId}
                onChange={(e) => setArmazemId(e.target.value)}
                disabled={isLoadingArmazens}
                className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              >
                <option value="">
                  {isLoadingArmazens ? 'A carregar armazéns...' : 'Escolher armazém...'}
                </option>
                {armazens.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.etiqueta}
                  </option>
                ))}
              </select>
              {!isLoadingArmazens && armazens.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  Não há armazéns activos. Crie um antes de receber mercadoria.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Documento de referência
              </label>
              <input
                type="text"
                value={documentoRef}
                onChange={(e) => setDocumentoRef(e.target.value)}
                placeholder="Ex: FT-2026/001"
                className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-slate-400">
                Factura ou guia de remessa. Ajuda a reconciliar depois.
              </p>
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-semibold text-slate-900">Linhas a receber</h3>
            <span className="text-xs text-slate-500">
              Ajuste as quantidades para uma recepção parcial
            </span>
          </div>

          {isLoadingItens ? (
            <div className="flex items-center justify-center gap-2 py-10 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              A carregar as linhas do pedido...
            </div>
          ) : porReceber.length === 0 ? (
            <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              Todas as linhas deste pedido já foram recebidas.
            </p>
          ) : (
            <>
            {/* ── Mini-formulários, em telemóvel ────────────────────────────────
                Um cartão por linha com o campo de quantidade a toda a largura. Numa
                tabela de cinco colunas dentro de um modal de `max-w-2xl`, o input
                ficava com cerca de 40px — impossível de acertar com o polegar, e é
                onde se escreve o número que conta. */}
            <div className="space-y-2 sm:hidden">
              {porReceber.map((item) => {
                const falta = emFalta(item);
                const quantidade = quantidadeDe(item);
                const excede = quantidade > falta;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'rounded-xl border border-l-[3px] bg-white p-3',
                      excede ? 'border-rose-200 border-l-rose-500' : 'border-slate-200 border-l-slate-300',
                    )}
                  >
                    <p className="font-medium text-slate-900">
                      {item.produto?.nome ?? 'Produto desconhecido'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Falta {falta} · {moeda(item.custoUnitario)} cada
                      {item.quantidadeRecebida > 0 &&
                        ` · já recebido ${item.quantidadeRecebida} de ${item.quantidadePedida}`}
                    </p>

                    <div className="mt-3 flex items-end gap-3">
                      <label className="flex-1">
                        <span className="mb-1 block text-xs font-medium text-slate-600">
                          A receber
                        </span>
                        <input
                          type="number"
                          min="0"
                          max={falta}
                          step="any"
                          value={quantidade}
                          onChange={(e) =>
                            setQuantidades((antes) => ({ ...antes, [item.id]: Number(e.target.value) }))
                          }
                          className={cn(
                            'w-full rounded-lg border px-3 py-2.5 text-base',
                            excede ? 'border-rose-400 bg-rose-50' : 'border-slate-200',
                          )}
                        />
                      </label>
                      <div className="pb-2 text-right">
                        <span className="block text-xs text-slate-400">Subtotal</span>
                        <span className="font-semibold text-slate-900">
                          {moeda(quantidade * item.custoUnitario)}
                        </span>
                      </div>
                    </div>

                    <CamposDeLote
                      item={item}
                      valor={loteDe(item)}
                      onChange={(campos) =>
                        setLotes((antes) => ({
                          ...antes,
                          [item.id]: { ...antes[item.id], ...campos },
                        }))
                      }
                    />
                  </div>
                );
              })}
            </div>

            {/* ── Tabela, a partir de sm ─────────────────────────────────────── */}
            <div className="hidden overflow-hidden rounded-xl border border-slate-200 sm:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Produto</th>
                    <th className="px-3 py-2.5 text-right font-medium">Falta</th>
                    <th className="w-28 px-3 py-2.5 font-medium">A receber</th>
                    <th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">
                      Custo unit.
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {porReceber.map((item) => {
                    const falta = emFalta(item);
                    const quantidade = quantidadeDe(item);
                    const excede = quantidade > falta;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {item.produto?.nome ?? 'Produto desconhecido'}
                          {item.quantidadeRecebida > 0 && (
                            <p className="text-xs text-slate-400">
                              Já recebido: {item.quantidadeRecebida} de {item.quantidadePedida}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-500">{falta}</td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            min="0"
                            max={falta}
                            step="any"
                            value={quantidade}
                            onChange={(e) =>
                              setQuantidades((antes) => ({
                                ...antes,
                                [item.id]: Number(e.target.value),
                              }))
                            }
                            className={cn(
                              'w-full rounded border px-2 py-1 text-sm',
                              excede ? 'border-rose-400 bg-rose-50' : 'border-slate-200',
                            )}
                          />
                        </td>
                        <td className="hidden px-3 py-3 text-right text-slate-600 sm:table-cell">
                          {moeda(item.custoUnitario)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {moeda(quantidade * item.custoUnitario)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Lote e validade, a partir de sm ─────────────────────────────
                Fora da tabela e não numa sexta e sétima coluna: dentro de um modal
                de `max-w-2xl`, sete colunas deixariam cada campo com uns 40px, e é
                aqui que se escreve a data que vai gerar os alertas. */}
            <div className="hidden space-y-2 sm:block">
              {porReceber
                .filter((i) => quantidadeDe(i) > 0)
                .map((item) => (
                  <div
                    key={`lote-${item.id}`}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <p className="text-sm font-medium text-slate-800">
                      {item.produto?.nome ?? 'Produto desconhecido'}
                    </p>
                    <CamposDeLote
                      item={item}
                      valor={loteDe(item)}
                      onChange={(campos) =>
                        setLotes((antes) => ({
                          ...antes,
                          [item.id]: { ...antes[item.id], ...campos },
                        }))
                      }
                    />
                  </div>
                ))}
            </div>
            </>
          )}

          {linhaInvalida && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              Não é possível receber mais do que o que falta em «
              {linhaInvalida.produto?.nome ?? 'uma das linhas'}». Para receber mais, corrija o
              pedido de compra.
            </p>
          )}

          <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
            <PackageCheck className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <p>
              Ao confirmar, o stock do armazém escolhido é aumentado, o custo médio ponderado é
              recalculado e é criada uma conta a pagar a este fornecedor no módulo financeiro.
            </p>
          </div>
        </div>

        {/* ── Rodapé ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">
            Total a receber: <strong className="text-slate-900">{moeda(total)}</strong>
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={confirmar}
              disabled={loading || !armazemId || porReceber.length === 0 || !!linhaInvalida}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  A processar...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Confirmar recepção
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
