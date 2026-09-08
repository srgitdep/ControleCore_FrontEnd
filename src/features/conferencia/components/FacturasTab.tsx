import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Loader2,
  Scale,
  CheckCircle2,
  Ban,
  X,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/shared/utils';
import { conferenciaApi, EstadoFactura, ROTULO_TIPO } from '../api/conferencia.api';
import type { Factura, ResultadoConferencia } from '../api/conferencia.api';

const mt = (v: number) =>
  `${v.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;

/**
 * Facturas de fornecedor e a sua conferência.
 *
 * ## O percurso
 *
 * Registar → conferir → decidir. Cada passo é deliberado, e o do meio é o que dá sentido
 * aos outros: sem conferência não há valor conforme, e aprovar às cegas é assinar um
 * cheque em branco com passos extra.
 */
export function FacturasTab() {
  const queryClient = useQueryClient();
  const [aVer, setAVer] = useState<Factura | null>(null);
  const [resultado, setResultado] = useState<{ factura: Factura; r: ResultadoConferencia } | null>(
    null,
  );
  const [aConferir, setAConferir] = useState<string | null>(null);

  const { data: facturas = [], isLoading } = useQuery({
    queryKey: ['facturas-fornecedor'],
    queryFn: () => conferenciaApi.listarFacturas(),
  });

  const conferir = async (f: Factura) => {
    setAConferir(f.id);
    try {
      const r = await conferenciaApi.conferir(f.id);
      setResultado({ factura: f, r });
      queryClient.invalidateQueries({ queryKey: ['facturas-fornecedor'] });
      queryClient.invalidateQueries({ queryKey: ['excepcoes'] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao conferir a factura.');
    } finally {
      setAConferir(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        A carregar facturas...
      </div>
    );
  }

  if (facturas.length === 0) {
    return (
      <div className="py-16 text-center">
        <FileText className="mx-auto mb-3 h-12 w-12 text-slate-300" />
        <p className="text-sm font-medium text-slate-700">Ainda não há facturas registadas.</p>
        <p className="mt-1 text-sm text-slate-500">
          Uma factura registada não gera obrigação de pagamento: fica em análise até ser
          conferida contra a ordem e a recepção.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Factura</th>
              <th className="px-3 py-2.5 font-medium">Fornecedor</th>
              <th className="hidden px-3 py-2.5 font-medium sm:table-cell">Emissão</th>
              <th className="px-3 py-2.5 text-right font-medium">Total</th>
              <th className="hidden px-3 py-2.5 text-right font-medium md:table-cell">
                Conforme / Disputa
              </th>
              <th className="px-3 py-2.5 font-medium">Estado</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {facturas.map((f) => (
              <tr key={f.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <button
                    onClick={() => setAVer(f)}
                    className="font-medium text-slate-900 hover:text-blue-600 hover:underline"
                  >
                    {f.numero}
                  </button>
                </td>
                <td className="px-3 py-3 text-slate-700">{f.fornecedor?.nome ?? '—'}</td>
                <td className="hidden px-3 py-3 text-slate-500 sm:table-cell">
                  {new Date(f.dataEmissao).toLocaleDateString('pt-MZ')}
                </td>
                <td className="px-3 py-3 text-right text-slate-700">{mt(f.totalDeclarado)}</td>
                <td className="hidden px-3 py-3 text-right md:table-cell">
                  {f.conferencia ? (
                    <span className="text-xs">
                      <span className="text-emerald-600">{mt(f.conferencia.valorConforme)}</span>
                      {f.conferencia.valorEmDisputa > 0 && (
                        <>
                          {' / '}
                          <span className="text-rose-600">
                            {mt(f.conferencia.valorEmDisputa)}
                          </span>
                        </>
                      )}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">por conferir</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <EstadoBadge estado={f.estado} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {f.estado !== EstadoFactura.APROVADA_PARA_PAGAMENTO &&
                      f.estado !== EstadoFactura.REJEITADA && (
                        <button
                          onClick={() => conferir(f)}
                          disabled={aConferir === f.id}
                          title="Conferir contra ordem e recepção"
                          className="p-2 text-slate-400 transition-colors hover:text-indigo-600 disabled:opacity-40"
                        >
                          {aConferir === f.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Scale size={16} />
                          )}
                        </button>
                      )}
                    {f.conferencia && f.estado !== EstadoFactura.APROVADA_PARA_PAGAMENTO &&
                      f.estado !== EstadoFactura.REJEITADA && (
                        <button
                          onClick={() => setAVer(f)}
                          title="Libertar para pagamento ou rejeitar"
                          className="p-2 text-slate-400 transition-colors hover:text-emerald-600"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {resultado && (
        <ResultadoModal
          factura={resultado.factura}
          resultado={resultado.r}
          onClose={() => setResultado(null)}
        />
      )}

      {aVer && (
        <DecidirFacturaModal
          factura={aVer}
          onClose={() => setAVer(null)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['facturas-fornecedor'] })}
        />
      )}
    </div>
  );
}

function EstadoBadge({ estado }: { estado: Factura['estado'] }) {
  const rotulos: Record<Factura['estado'], string> = {
    RECEBIDA: 'Por conferir',
    CONFORME: 'Conforme',
    COM_DIVERGENCIA: 'Com divergência',
    APROVADA_PARA_PAGAMENTO: 'Aprovada',
    REJEITADA: 'Rejeitada',
  };
  const cores: Record<Factura['estado'], string> = {
    RECEBIDA: 'bg-slate-100 text-slate-700',
    CONFORME: 'bg-blue-100 text-blue-700',
    COM_DIVERGENCIA: 'bg-amber-100 text-amber-800',
    APROVADA_PARA_PAGAMENTO: 'bg-emerald-100 text-emerald-700',
    REJEITADA: 'bg-rose-100 text-rose-700',
  };

  return (
    <span
      className={cn(
        'whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        cores[estado],
      )}
    >
      {rotulos[estado]}
    </span>
  );
}

/**
 * O que a conferência encontrou, logo a seguir a correr.
 *
 * Mostra a separação entre o que segue e o que fica: é o §13 em números, e é a informação
 * que decide o que fazer a seguir.
 */
function ResultadoModal({
  factura,
  resultado,
  onClose,
}: {
  factura: Factura;
  resultado: ResultadoConferencia;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Scale size={16} className="text-slate-400" />
            Conferência de {factura.numero}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-4 px-5 py-4">
          {resultado.conforme ? (
            <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
              <p className="text-sm text-emerald-900">
                Ordem, recepção e factura batem certo. <strong>{mt(resultado.valorConforme)}</strong>{' '}
                podem seguir para pagamento.
              </p>
            </div>
          ) : (
            <>
              {resultado.bloqueada && (
                <div className="flex gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4">
                  <Lock size={20} className="mt-0.5 shrink-0 text-rose-600" />
                  <div className="text-sm text-rose-900">
                    <p className="font-medium">A factura está bloqueada.</p>
                    <p className="mt-1 text-rose-800">
                      Nem a parcela conforme segue enquanto a divergência não for resolvida.
                    </p>
                  </div>
                </div>
              )}

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

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                  {resultado.casosAbertos}{' '}
                  {resultado.casosAbertos === 1 ? 'caso aberto' : 'casos abertos'} no Centro de
                  Excepções
                </p>
                <ul className="space-y-2">
                  {resultado.divergencias.map((d, i) => (
                    <li
                      key={i}
                      className="flex gap-3 rounded-lg border border-slate-200 p-3 text-sm"
                    >
                      <AlertTriangle
                        size={16}
                        className={cn(
                          'mt-0.5 shrink-0',
                          d.bloqueia ? 'text-rose-500' : 'text-amber-500',
                        )}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800">{ROTULO_TIPO[d.tipo]}</p>
                        <p className="mt-0.5 text-slate-600">{d.descricao}</p>
                        {d.nivelResolvido && (
                          <p className="mt-1 text-xs text-slate-400">
                            Tolerância decidida ao nível {d.nivelResolvido}
                          </p>
                        )}
                      </div>
                      <span className="ml-auto shrink-0 text-xs text-slate-500">
                        {mt(d.valor)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
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

/**
 * Libertar para pagamento, ou rejeitar.
 *
 * A obrigação criada no Financeiro é do valor **conforme**, e não do declarado: a parcela
 * em disputa não gera obrigação enquanto a divergência não for resolvida. O ecrã diz o
 * número que vai ser criado, para ninguém aprovar a pensar que aprova outra coisa.
 */
function DecidirFacturaModal({
  factura,
  onClose,
  onSuccess,
}: {
  factura: Factura;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [motivo, setMotivo] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const conferida = !!factura.conferencia;
  const valorALibertar = factura.conferencia?.valorConforme ?? 0;
  const decidida =
    factura.estado === EstadoFactura.APROVADA_PARA_PAGAMENTO ||
    factura.estado === EstadoFactura.REJEITADA;

  const decidir = async (aprovar: boolean) => {
    if (!aprovar && motivo.trim().length < 5) {
      toast.error('A rejeição exige um motivo.');
      return;
    }

    setIsSaving(true);
    try {
      await conferenciaApi.decidirFactura(factura.id, {
        aprovar,
        motivo: motivo.trim() || undefined,
      });
      toast.success(
        aprovar
          ? `${mt(valorALibertar)} libertados para pagamento. A obrigação foi criada no Financeiro.`
          : 'Factura rejeitada. Não gera obrigação nenhuma.',
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      // O 403 da segregação de funções traz a regra na mensagem — vale mais mostrá-la
      // do que um erro genérico que não diz o que fazer.
      toast.error(error?.response?.data?.message || 'Erro ao decidir a factura.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Factura {factura.numero}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{factura.fornecedor?.nome}</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-4 px-5 py-4">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-slate-50 p-4 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Total declarado</dt>
              <dd className="font-medium text-slate-900">{mt(factura.totalDeclarado)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Emissão</dt>
              <dd className="text-slate-700">
                {new Date(factura.dataEmissao).toLocaleDateString('pt-MZ')}
              </dd>
            </div>
          </dl>

          {!conferida ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Esta factura ainda não foi conferida. Confere-a antes de a libertar para
              pagamento — aprovar sem conferir é assinar um cheque em branco.
            </p>
          ) : decidida ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              Já decidida ({factura.estado === 'REJEITADA' ? 'rejeitada' : 'aprovada'}).
              {factura.motivoDecisao && ` ${factura.motivoDecisao}`}
            </p>
          ) : (
            <>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs text-emerald-700">Vai ser criada uma obrigação de</p>
                <p className="mt-0.5 text-xl font-semibold text-emerald-900">
                  {mt(valorALibertar)}
                </p>
                {(factura.conferencia?.valorEmDisputa ?? 0) > 0 && (
                  <p className="mt-2 text-xs text-emerald-800">
                    {mt(factura.conferencia!.valorEmDisputa)} ficam de fora — em disputa, e sem
                    obrigação enquanto as excepções não forem resolvidas.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Motivo <span className="text-slate-400">(obrigatório para rejeitar)</span>
                </label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Fechar
          </button>
          {conferida && !decidida && (
            <>
              <button
                onClick={() => decidir(false)}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
              >
                <Ban size={14} /> Rejeitar
              </button>
              <button
                onClick={() => decidir(true)}
                disabled={isSaving || valorALibertar <= 0}
                title={valorALibertar <= 0 ? 'Não há valor conforme a libertar' : undefined}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {isSaving && <Loader2 size={14} className="animate-spin" />}
                Libertar para pagamento
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
