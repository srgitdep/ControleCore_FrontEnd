import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Truck, PackageCheck, Loader2, Minus, Plus, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/shared/utils';
import { useArmazens } from '@/features/lojas';
import { conferenciaApi, ROTULO_TIPO } from '../api/conferencia.api';
import type { Factura, ResultadoConferencia } from '../api/conferencia.api';

const mt = (v: number) =>
  `${v.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;

interface SessaoConferenciaModalProps {
  factura: Factura;
  onClose: () => void;
  onFinalizada: () => void;
}

/**
 * A contagem da descarga do camião, produto a produto, em tempo real.
 *
 * ## Sem a quantidade da factura à vista
 *
 * De propósito: a contagem tem de valer como conferência independente do que o fornecedor
 * facturou, e mostrar o número ao lado convidaria a confirmá-lo em vez de o contar. A
 * comparação só aparece depois de finalizar.
 *
 * ## Um produto por linha, um incremento de cada vez
 *
 * Chegam 10 caixas agora, mais 10 daqui a um minuto — cada `+`/`-` é uma chamada ao
 * servidor que soma de forma atómica, para dois conferentes no mesmo camião não se
 * sobrescreverem. O produto que ninguém tocar fica em 0 e conta como não recebido.
 */
export function SessaoConferenciaModal({
  factura,
  onClose,
  onFinalizada,
}: SessaoConferenciaModalProps) {
  const queryClient = useQueryClient();
  const [armazemId, setArmazemId] = useState('');
  const [documentoRef, setDocumentoRef] = useState('');
  const [resultado, setResultado] = useState<ResultadoConferencia | null>(null);
  const [aIncrementar, setAIncrementar] = useState<string | null>(null);

  const { armazens, isLoading: isLoadingArmazens } = useArmazens();

  const { data: sessao, isLoading } = useQuery({
    queryKey: ['sessao-conferencia', factura.id],
    // A primeira vez que se clica em "iniciar conferência" ainda não há sessão — cria-se
    // aqui. Um segundo utilizador a reabrir o mesmo ecrã recebe 400 do `iniciar` (já existe
    // uma em curso) e cai para `obterSessaoConferencia`, que traz a sessão existente.
    queryFn: async () => {
      try {
        return await conferenciaApi.iniciarSessaoConferencia(factura.id);
      } catch {
        return conferenciaApi.obterSessaoConferencia(factura.id);
      }
    },
  });

  // A descrição de cada linha só vem no detalhe completo da factura — a sessão só guarda
  // o `linhaFacturaId`, para não duplicar dados que podem mudar de um lado sem do outro.
  const { data: facturaCompleta } = useQuery({
    queryKey: ['factura', factura.id],
    queryFn: () => conferenciaApi.obterFactura(factura.id),
  });

  const descricaoDaLinha = (linhaFacturaId: string) =>
    facturaCompleta?.linhas?.find((l) => l.id === linhaFacturaId)?.descricao ?? 'Produto';

  const incrementar = useMutation({
    mutationFn: ({ itemId, delta }: { itemId: string; delta: number }) =>
      conferenciaApi.incrementarContagem(sessao!.id, itemId, delta),
    onMutate: async ({ itemId, delta }) => {
      setAIncrementar(itemId);
      await queryClient.cancelQueries({ queryKey: ['sessao-conferencia', factura.id] });
      const anterior = queryClient.getQueryData(['sessao-conferencia', factura.id]);
      queryClient.setQueryData(['sessao-conferencia', factura.id], (s: any) =>
        s
          ? {
              ...s,
              itens: s.itens.map((i: any) =>
                i.id === itemId
                  ? { ...i, quantidadeContada: Math.max(0, i.quantidadeContada + delta) }
                  : i,
              ),
            }
          : s,
      );
      return { anterior };
    },
    onError: (_err, _vars, contexto) => {
      if (contexto?.anterior) {
        queryClient.setQueryData(['sessao-conferencia', factura.id], contexto.anterior);
      }
      toast.error('Não foi possível actualizar a contagem.');
    },
    onSettled: () => {
      setAIncrementar(null);
      queryClient.invalidateQueries({ queryKey: ['sessao-conferencia', factura.id] });
    },
  });

  const finalizar = useMutation({
    mutationFn: () =>
      conferenciaApi.finalizarSessaoConferencia(sessao!.id, {
        armazemId,
        documentoRef: documentoRef.trim() || undefined,
      }),
    onSuccess: (r) => {
      setResultado(r);
      queryClient.invalidateQueries({ queryKey: ['facturas-fornecedor'] });
      queryClient.invalidateQueries({ queryKey: ['excepcoes'] });
      onFinalizada();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao finalizar a conferência.');
    },
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
        <div className="flex items-center gap-2 rounded-xl bg-white px-6 py-4 text-sm text-slate-500 shadow-xl">
          <Loader2 className="h-4 w-4 animate-spin" />
          A carregar a conferência...
        </div>
      </div>
    );
  }

  if (!sessao) return null;

  if (resultado) {
    return (
      <ResultadoContagemModal
        factura={factura}
        resultado={resultado}
        onClose={() => {
          setResultado(null);
          onClose();
        }}
      />
    );
  }

  const totalContado = sessao.itens.reduce((soma, i) => soma + i.quantidadeContada, 0);
  const jaFinalizada = sessao.estado === 'FINALIZADA';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Conferência de recepção</h2>
              <p className="text-sm text-slate-500">
                Factura {factura.numero} · {factura.fornecedor?.nome ?? 'fornecedor n/d'}
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

        <div className="flex-1 overflow-y-auto p-6">
          {!jaFinalizada && (
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
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Guia de transporte
                </label>
                <input
                  type="text"
                  value={documentoRef}
                  onChange={(e) => setDocumentoRef(e.target.value)}
                  placeholder="Ex: GT-2026/045"
                  className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-semibold text-slate-900">Produtos a descarregar</h3>
            <span className="text-xs text-slate-500">
              Vai somando à medida que descarrega — sem quantidade prevista à vista
            </span>
          </div>

          <div className="space-y-2">
            {sessao.itens.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <p className="min-w-0 truncate text-sm font-medium text-slate-900">
                  {descricaoDaLinha(item.linhaFacturaId)}
                </p>

                <div className="flex shrink-0 items-center gap-3">
                  <button
                    onClick={() => incrementar.mutate({ itemId: item.id, delta: -1 })}
                    disabled={jaFinalizada || item.quantidadeContada <= 0 || aIncrementar === item.id}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40"
                    aria-label={`Diminuir contagem de ${descricaoDaLinha(item.linhaFacturaId)}`}
                  >
                    <Minus size={16} />
                  </button>

                  <span className="w-12 text-center text-lg font-semibold tabular-nums text-slate-900">
                    {item.quantidadeContada}
                  </span>

                  <button
                    onClick={() => incrementar.mutate({ itemId: item.id, delta: 1 })}
                    disabled={jaFinalizada}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg border text-white transition-colors disabled:opacity-40',
                      'border-indigo-600 bg-indigo-600 hover:bg-indigo-700',
                    )}
                    aria-label={`Aumentar contagem de ${descricaoDaLinha(item.linhaFacturaId)}`}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
            <PackageCheck className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <p>
              O produto que ficar em 0 é considerado não recebido. Ao finalizar, o sistema
              regista a recepção com o que foi contado e compara contra a factura.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">
            Total contado: <strong className="text-slate-900">{totalContado}</strong>
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={finalizar.isPending}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              {jaFinalizada ? 'Fechar' : 'Continuar depois'}
            </button>
            {!jaFinalizada && (
              <button
                onClick={() => finalizar.mutate()}
                disabled={finalizar.isPending || !armazemId || totalContado === 0}
                title={totalContado === 0 ? 'Conte pelo menos um produto antes de finalizar' : undefined}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {finalizar.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    A finalizar...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Finalizar conferência
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultadoContagemModal({
  factura,
  resultado,
  onClose,
}: {
  factura: Factura;
  resultado: ResultadoConferencia;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Conferência de {factura.numero} finalizada
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-4 px-5 py-4">
          {resultado.conforme ? (
            <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <CheckCircle size={20} className="shrink-0 text-emerald-600" />
              <p className="text-sm text-emerald-900">
                O que foi contado bate com a factura. <strong>{mt(resultado.valorConforme)}</strong>{' '}
                podem seguir para pagamento.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-xs text-emerald-700">Pode seguir</p>
                  <p className="mt-0.5 text-lg font-semibold text-emerald-900">
                    {mt(resultado.valorConforme)}
                  </p>
                </div>
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                  <p className="text-xs text-rose-700">Em disputa</p>
                  <p className="mt-0.5 text-lg font-semibold text-rose-900">
                    {mt(resultado.valorEmDisputa)}
                  </p>
                </div>
              </div>

              <ul className="space-y-2">
                {resultado.divergencias.map((d, i) => (
                  <li key={i} className="rounded-lg border border-slate-200 p-3 text-sm">
                    <p className="font-medium text-slate-800">{ROTULO_TIPO[d.tipo]}</p>
                    <p className="mt-0.5 text-slate-600">{d.descricao}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-100 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
