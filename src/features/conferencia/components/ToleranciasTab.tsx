import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2, ShieldAlert, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/shared/utils';
import {
  conferenciaApi,
  ROTULO_DIMENSAO,
  ROTULO_ESCOPO,
} from '../api/conferencia.api';
import type {
  PoliticaTolerancia,
  DimensaoTolerancia,
  EscopoTolerancia,
} from '../api/conferencia.api';

const DIMENSOES: DimensaoTolerancia[] = ['PRECO', 'QUANTIDADE', 'IMPOSTO', 'FRETE', 'TOTAL'];
const ESCOPOS: EscopoTolerancia[] = ['EMPRESA', 'CATEGORIA', 'FORNECEDOR', 'PRODUTO'];

/**
 * As tolerâncias da conferência.
 *
 * ## Sem política, a tolerância é zero
 *
 * É a coisa mais importante deste ecrã, e por isso está lá em cima em vez de numa nota de
 * rodapé. Com tolerância infinita por omissão, um sistema recém-instalado diria «conforme»
 * a facturas com o preço trocado e ninguém daria por isso. Com zero, a primeira factura
 * com um cêntimo de diferença abre um caso — é irritante, e é o que obriga a configurar
 * antes de confiar no resultado.
 *
 * ## A mais específica ganha, e não se somam
 *
 * Uma tolerância definida ao nível do produto substitui a do fornecedor, que substitui a
 * da empresa. Não se combinam: somar percentagens de dois degraus daria uma tolerância que
 * ninguém configurou.
 */
export function ToleranciasTab() {
  const queryClient = useQueryClient();
  const [aCriar, setACriar] = useState(false);

  const { data: politicas = [], isLoading } = useQuery({
    queryKey: ['tolerancias'],
    queryFn: () => conferenciaApi.listarTolerancias(),
  });

  const { data: hierarquia = [] } = useQuery({
    queryKey: ['tolerancias-hierarquia'],
    queryFn: () => conferenciaApi.hierarquiaTolerancias(),
    // A ordem de especificidade não muda entre empresas nem com o tempo — não vale a
    // pena pedi-la de novo em cada visita ao separador.
    staleTime: Infinity,
  });

  const apagar = async (p: PoliticaTolerancia) => {
    try {
      await conferenciaApi.apagarTolerancia(p.id);
      toast.success('Tolerância removida. Esta dimensão volta a tolerância zero.');
      queryClient.invalidateQueries({ queryKey: ['tolerancias'] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao remover.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        A carregar tolerâncias...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <ShieldAlert size={18} className="mt-0.5 shrink-0 text-slate-400" />
        <div className="text-sm text-slate-600">
          <p>
            <strong className="text-slate-800">Sem política, a tolerância é zero</strong> — e não
            infinita. Qualquer desvio abre um caso. É deliberado: a omissão de configuração não
            pode resultar em ausência de controlo.
          </p>
          <p className="mt-1.5 text-xs">
            A regra mais específica prevalece, e as políticas <strong>não se combinam</strong>:
            a de maior especificidade vale inteira, por dimensão.
          </p>
          {hierarquia.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-slate-500">
              {[...hierarquia]
                .sort((a, b) => a.nivel - b.nivel)
                .map((h, i, arr) => (
                  <span key={h.escopo} className="flex items-center gap-1">
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 font-medium',
                        i === arr.length - 1
                          ? 'bg-slate-800 text-white'
                          : 'bg-white text-slate-600',
                      )}
                    >
                      {ROTULO_ESCOPO[h.escopo]}
                    </span>
                    {i < arr.length - 1 && <ChevronRight size={12} className="text-slate-300" />}
                  </span>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setACriar(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus size={16} />
          Definir tolerância
        </button>
      </div>

      {politicas.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm font-medium text-slate-700">Nenhuma tolerância configurada.</p>
          <p className="mt-1 text-sm text-slate-500">
            Todas as dimensões estão em tolerância zero: qualquer diferença entre a factura, a
            ordem e a recepção abre um caso.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Dimensão</th>
                <th className="px-3 py-2.5 font-medium">Âmbito</th>
                <th className="px-3 py-2.5 text-right font-medium">Limite</th>
                <th className="px-3 py-2.5 font-medium">Ao exceder</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {politicas.map((p) => (
                <tr key={p.id} className={cn(!p.activa && 'opacity-50')}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {ROTULO_DIMENSAO[p.dimensao]}
                  </td>
                  <td className="px-3 py-3 text-slate-600">{ROTULO_ESCOPO[p.escopo]}</td>
                  <td className="px-3 py-3 text-right text-slate-700">
                    <Limite politica={p} />
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                        p.accao === 'BLOQUEIO'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-800',
                      )}
                    >
                      {p.accao === 'BLOQUEIO' ? 'Bloqueia' : 'Abre caso'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => apagar(p)}
                      title="Remover"
                      className="p-2 text-slate-400 transition-colors hover:text-rose-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {aCriar && (
        <PoliticaModal
          onClose={() => setACriar(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['tolerancias'] })}
        />
      )}
    </div>
  );
}

/** O limite em palavras, incluindo a assimetria quando existe. */
function Limite({ politica: p }: { politica: PoliticaTolerancia }) {
  const partes: string[] = [];

  if (p.limiteSuperiorPercent != null || p.limiteInferiorPercent != null) {
    // Assimétrico: facturar a mais e a menos não são o mesmo problema, e mostrar um só
    // número esconderia metade da configuração.
    if (p.limiteInferiorPercent != null) partes.push(`−${p.limiteInferiorPercent}%`);
    if (p.limiteSuperiorPercent != null) partes.push(`+${p.limiteSuperiorPercent}%`);
  } else if (p.limitePercent != null) {
    partes.push(`±${p.limitePercent}%`);
  }

  if (p.limiteAbsoluto != null) partes.push(`ou ${p.limiteAbsoluto} MT`);

  return <span>{partes.join(' ') || '—'}</span>;
}

function PoliticaModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [dimensao, setDimensao] = useState<DimensaoTolerancia>('PRECO');
  const [escopo, setEscopo] = useState<EscopoTolerancia>('EMPRESA');
  const [escopoId, setEscopoId] = useState('');
  const [limitePercent, setLimitePercent] = useState('1');
  const [limiteAbsoluto, setLimiteAbsoluto] = useState('');
  const [accao, setAccao] = useState<'EXCEPCAO' | 'BLOQUEIO'>('EXCEPCAO');
  const [isSaving, setIsSaving] = useState(false);

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();

    if (escopo !== 'EMPRESA' && !escopoId.trim()) {
      toast.error(`Indica a que ${ROTULO_ESCOPO[escopo].toLowerCase()} esta tolerância se aplica.`);
      return;
    }
    if (!limitePercent && !limiteAbsoluto) {
      toast.error(
        'Define pelo menos um limite. Para tolerância zero, não crias política nenhuma — a ausência já significa zero.',
      );
      return;
    }

    setIsSaving(true);
    try {
      await conferenciaApi.guardarTolerancia({
        dimensao,
        escopo,
        escopoId: escopo === 'EMPRESA' ? null : escopoId.trim(),
        limitePercent: limitePercent ? Number(limitePercent) : null,
        limiteAbsoluto: limiteAbsoluto ? Number(limiteAbsoluto) : null,
        limiteSuperiorPercent: null,
        limiteInferiorPercent: null,
        accao,
        activa: true,
      });
      toast.success('Tolerância guardada.');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Definir tolerância</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </header>

        <form onSubmit={submeter} className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Dimensão</label>
              <select
                value={dimensao}
                onChange={(e) => setDimensao(e.target.value as DimensaoTolerancia)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                {DIMENSOES.map((d) => (
                  <option key={d} value={d}>
                    {ROTULO_DIMENSAO[d]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Âmbito</label>
              <select
                value={escopo}
                onChange={(e) => setEscopo(e.target.value as EscopoTolerancia)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                {ESCOPOS.map((s) => (
                  <option key={s} value={s}>
                    {ROTULO_ESCOPO[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {escopo !== 'EMPRESA' && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Id do {ROTULO_ESCOPO[escopo].toLowerCase()}
              </label>
              <input
                value={escopoId}
                onChange={(e) => setEscopoId(e.target.value)}
                placeholder="UUID"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm placeholder:text-slate-300 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Limite (%)
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={limitePercent}
                onChange={(e) => setLimitePercent(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                ou valor (MT)
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={limiteAbsoluto}
                onChange={(e) => setLimiteAbsoluto(e.target.value)}
                placeholder="opcional"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-300 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* «ou» e não «e»: basta um dos dois acomodar o desvio. É o que faz sentido na
              prática — deixar passar tanto o cêntimo numa factura grande como os 50 MT
              numa pequena. */}
          <p className="text-xs text-slate-500">
            Basta um dos dois acomodar o desvio para ele passar.
          </p>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Ao exceder</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAccao('EXCEPCAO')}
                className={cn(
                  'rounded-lg border-2 px-3 py-2 text-xs font-medium transition-colors',
                  accao === 'EXCEPCAO'
                    ? 'border-amber-400 bg-amber-50 text-amber-800'
                    : 'border-slate-200 text-slate-600',
                )}
              >
                Abrir caso
                <span className="mt-0.5 block font-normal text-slate-500">
                  a parcela conforme segue
                </span>
              </button>
              <button
                type="button"
                onClick={() => setAccao('BLOQUEIO')}
                className={cn(
                  'rounded-lg border-2 px-3 py-2 text-xs font-medium transition-colors',
                  accao === 'BLOQUEIO'
                    ? 'border-rose-400 bg-rose-50 text-rose-800'
                    : 'border-slate-200 text-slate-600',
                )}
              >
                Bloquear
                <span className="mt-0.5 block font-normal text-slate-500">
                  nada segue
                </span>
              </button>
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
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
