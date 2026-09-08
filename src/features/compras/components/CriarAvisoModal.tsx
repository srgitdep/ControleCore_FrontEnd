import { useState } from 'react';
import { X, Loader2, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { avisosApi } from '../api/avisos.api';
import type { PurchaseOrder } from '../api/purchases.api';

interface Props {
  order: PurchaseOrder;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Registar o que o fornecedor declara ter expedido.
 *
 * ## Uma ordem, vários avisos
 *
 * O fornecedor manda o que tem e o resto depois. Cada envio é um aviso, e cada um consome
 * saldo da ordem — o servidor recusa declarar mais do que foi pedido, contando os avisos
 * anteriores não cancelados.
 *
 * As quantidades começam pelo que **falta avisar**, e não pelo que foi pedido: no segundo
 * aviso de uma ordem, partir do total pedido daria sempre um erro de saldo.
 */
export function CriarAvisoModal({ order, onClose, onSuccess }: Props) {
  const itens = order.itens ?? [];

  const [quantidades, setQuantidades] = useState<Record<string, number>>(
    Object.fromEntries(itens.map((i) => [i.id, i.quantidadePedida])),
  );
  const [lotes, setLotes] = useState<Record<string, string>>({});
  const [dados, setDados] = useState({
    numeroFornecedor: '',
    dataPrevistaChegada: '',
    transportador: '',
    matricula: '',
    motorista: '',
    contactoMotorista: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();

    // Linhas a zero não se declaram: o fornecedor não as mandou, e uma linha vazia só
    // ocupa espaço na conferência.
    const linhas = itens
      .filter((i) => (quantidades[i.id] ?? 0) > 0)
      .map((i) => ({
        itemId: i.id,
        quantidade: quantidades[i.id],
        lote: lotes[i.id]?.trim() || undefined,
      }));

    if (linhas.length === 0) {
      toast.error('Declara pelo menos uma linha com quantidade.');
      return;
    }

    setIsSaving(true);
    try {
      const r = await avisosApi.criar({
        pedidoId: order.id,
        linhas,
        numeroFornecedor: dados.numeroFornecedor.trim() || undefined,
        dataPrevistaChegada: dados.dataPrevistaChegada || undefined,
        transportador: dados.transportador.trim() || undefined,
        matricula: dados.matricula.trim() || undefined,
        motorista: dados.motorista.trim() || undefined,
        contactoMotorista: dados.contactoMotorista.trim() || undefined,
      });

      const falta = r.saldoRestante.reduce((s, l) => s + l.quantidade, 0);
      toast.success(
        falta > 0
          ? `Aviso registado. Ficam ${falta} unidades por avisar nesta ordem.`
          : 'Aviso registado. A ordem fica inteiramente declarada.',
      );

      onSuccess();
      onClose();
    } catch (error: any) {
      // Quando o saldo não bate, o backend devolve a lista de problemas linha a linha —
      // vale mais mostrá-la do que um «erro ao criar», que não diz o que corrigir.
      const problemas = error?.response?.data?.problemas;
      if (Array.isArray(problemas) && problemas.length > 0) {
        toast.error(problemas[0].mensagem, { duration: 8000 });
      } else {
        toast.error(error?.response?.data?.message || 'Erro ao registar o aviso.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Truck size={16} className="text-slate-400" />
              Registar expedição
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {order.fornecedor?.nome} · <span className="font-mono">#{order.id.slice(0, 8)}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </header>

        <form onSubmit={submeter} className="space-y-5 px-5 py-4">
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Produto</th>
                  <th className="px-3 py-2 text-right font-medium">Pedido</th>
                  <th className="px-3 py-2 text-right font-medium">Expediu</th>
                  <th className="px-3 py-2 font-medium">Lote</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itens.map((i) => (
                  <tr key={i.id}>
                    <td className="px-3 py-2 text-slate-700">{i.produto?.nome ?? i.produtoId}</td>
                    <td className="px-3 py-2 text-right text-slate-500">{i.quantidadePedida}</td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        value={quantidades[i.id] ?? 0}
                        onChange={(e) =>
                          setQuantidades((q) => ({ ...q, [i.id]: Number(e.target.value) }))
                        }
                        className="w-24 rounded border border-slate-200 px-2 py-1 text-right text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={lotes[i.id] ?? ''}
                        onChange={(e) => setLotes((l) => ({ ...l, [i.id]: e.target.value }))}
                        placeholder="opcional"
                        className="w-28 rounded border border-slate-200 px-2 py-1 text-sm placeholder:text-slate-300 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              O lote é o que o fornecedor declara. Quem decide o que entra em stock é a
              recepção, depois de olhar para a caixa.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Nº da guia de remessa
              </label>
              <input
                value={dados.numeroFornecedor}
                onChange={(e) => setDados({ ...dados, numeroFornecedor: e.target.value })}
                placeholder="GR-2026-4471"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-300 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <p className="mt-1 text-xs text-slate-500">
                Único por fornecedor — a mesma guia duas vezes consumiria o saldo a dobrar.
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Chegada prevista
              </label>
              <input
                type="date"
                value={dados.dataPrevistaChegada}
                onChange={(e) => setDados({ ...dados, dataPrevistaChegada: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Transporte
            </p>
            {/* Quatro campos e não um sistema de transporte: o que resolve o problema real
                é poder telefonar a alguém quando a carga não aparece. */}
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={dados.transportador}
                onChange={(e) => setDados({ ...dados, transportador: e.target.value })}
                placeholder="Transportador"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-300 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <input
                value={dados.matricula}
                onChange={(e) => setDados({ ...dados, matricula: e.target.value })}
                placeholder="Matrícula"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-300 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <input
                value={dados.motorista}
                onChange={(e) => setDados({ ...dados, motorista: e.target.value })}
                placeholder="Motorista"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-300 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <input
                value={dados.contactoMotorista}
                onChange={(e) => setDados({ ...dados, contactoMotorista: e.target.value })}
                placeholder="Contacto"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-300 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {isSaving && <Loader2 size={14} className="animate-spin" />}
              Registar expedição
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
