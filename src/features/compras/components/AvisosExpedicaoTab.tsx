import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Truck,
  Loader2,
  X,
  PackageCheck,
  MapPin,
  Phone,
  ClipboardSignature,
  ChevronRight,
  Ban,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/shared/utils';
import { avisosApi, ROTULO_ESTADO_AVISO, TRANSICOES_AVISO } from '../api/avisos.api';
import type { AvisoExpedicao, EstadoAviso } from '../api/avisos.api';

/** Os avisos que ainda esperam alguma coisa. É o filtro por omissão. */
const A_CAMINHO: EstadoAviso[] = ['SUBMETIDO', 'EM_TRANSITO', 'CHEGADO'];

/**
 * O que vem a caminho.
 *
 * ## Para que serve este ecrã
 *
 * Responde a «o que é que chega esta semana, e de quem». Antes, essa pergunta só tinha
 * resposta abrindo cada ordem de compra uma a uma e adivinhando pela data prevista.
 *
 * ## Nada aqui mexe em stock
 *
 * Nem marcar como chegado, nem registar a prova de entrega. Quem assina à porta assinou
 * que um camião encostou — a mercadoria entra na recepção, depois de contada.
 */
export function AvisosExpedicaoTab() {
  const queryClient = useQueryClient();
  const [filtro, setFiltro] = useState<'A_CAMINHO' | 'TODOS' | EstadoAviso>('A_CAMINHO');
  const [aVer, setAVer] = useState<AvisoExpedicao | null>(null);

  const { data: avisos = [], isLoading } = useQuery({
    queryKey: ['avisos-expedicao'],
    queryFn: () => avisosApi.listar(),
  });

  const visiveis =
    filtro === 'A_CAMINHO'
      ? avisos.filter((a) => A_CAMINHO.includes(a.estado))
      : filtro === 'TODOS'
        ? avisos
        : avisos.filter((a) => a.estado === filtro);

  const recarregar = () => queryClient.invalidateQueries({ queryKey: ['avisos-expedicao'] });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        A carregar expedições...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {(['A_CAMINHO', 'TODOS', 'RECEPCIONADO', 'CANCELADO'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              filtro === f
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            {f === 'A_CAMINHO'
              ? 'A caminho'
              : f === 'TODOS'
                ? 'Todos'
                : ROTULO_ESTADO_AVISO[f]}
          </button>
        ))}
      </div>

      {visiveis.length === 0 ? (
        <div className="py-16 text-center">
          <Truck className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="text-sm font-medium text-slate-700">
            {filtro === 'A_CAMINHO' ? 'Nada a caminho.' : 'Nenhuma expedição neste estado.'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Regista o que o fornecedor declara ter expedido a partir da ordem de compra, no
            separador Pedidos.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Guia</th>
                <th className="px-3 py-2.5 font-medium">Fornecedor</th>
                <th className="hidden px-3 py-2.5 font-medium md:table-cell">Transporte</th>
                <th className="hidden px-3 py-2.5 font-medium sm:table-cell">Chegada prevista</th>
                <th className="hidden px-3 py-2.5 text-right font-medium md:table-cell">Linhas</th>
                <th className="px-3 py-2.5 font-medium">Estado</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visiveis.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => setAVer(a)}
                  className="cursor-pointer hover:bg-slate-50/60"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-900">
                      {a.numeroFornecedor ?? `#${a.id.slice(0, 8)}`}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-700">{a.fornecedor?.nome ?? '—'}</td>
                  <td className="hidden px-3 py-3 text-slate-600 md:table-cell">
                    {a.transportador ?? '—'}
                    {a.matricula && (
                      <span className="ml-1.5 font-mono text-xs text-slate-400">
                        {a.matricula}
                      </span>
                    )}
                  </td>
                  <td className="hidden px-3 py-3 text-slate-500 sm:table-cell">
                    {a.dataPrevistaChegada
                      ? new Date(a.dataPrevistaChegada).toLocaleDateString('pt-MZ')
                      : '—'}
                  </td>
                  <td className="hidden px-3 py-3 text-right text-slate-500 md:table-cell">
                    {a._count?.linhas ?? a.linhas?.length ?? '—'}
                  </td>
                  <td className="px-3 py-3">
                    <EstadoAvisoBadge estado={a.estado} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChevronRight size={16} className="inline text-slate-300" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {aVer && (
        <AvisoModal aviso={aVer} onClose={() => setAVer(null)} onSuccess={recarregar} />
      )}
    </div>
  );
}

function EstadoAvisoBadge({ estado }: { estado: EstadoAviso }) {
  const cores: Record<EstadoAviso, string> = {
    RASCUNHO: 'bg-slate-100 text-slate-700',
    SUBMETIDO: 'bg-blue-100 text-blue-700',
    EM_TRANSITO: 'bg-indigo-100 text-indigo-700',
    CHEGADO: 'bg-amber-100 text-amber-800',
    RECEPCIONADO: 'bg-emerald-100 text-emerald-700',
    CANCELADO: 'bg-rose-100 text-rose-700',
  };

  return (
    <span
      className={cn(
        'whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        cores[estado],
      )}
    >
      {ROTULO_ESTADO_AVISO[estado]}
    </span>
  );
}

function AvisoModal({
  aviso,
  onClose,
  onSuccess,
}: {
  aviso: AvisoExpedicao;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [aGuardar, setAGuardar] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [aCancelar, setACancelar] = useState(false);
  const [entrega, setEntrega] = useState({ recebidoPorNome: '', provaUrl: '', observacoes: '' });

  const { data: completo } = useQuery({
    queryKey: ['aviso', aviso.id],
    queryFn: () => avisosApi.obter(aviso.id),
    initialData: aviso.linhas ? aviso : undefined,
  });

  const actual = completo ?? aviso;
  const seguintes = TRANSICOES_AVISO[actual.estado].filter((e) => e !== 'CANCELADO');
  const podeEntregar = actual.estado === 'CHEGADO' || actual.estado === 'RECEPCIONADO';

  const avancar = async (estado: EstadoAviso) => {
    setAGuardar(true);
    try {
      await avisosApi.mudarEstado(aviso.id, { estado });
      toast.success(`Marcado como ${ROTULO_ESTADO_AVISO[estado].toLowerCase()}.`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao actualizar.');
    } finally {
      setAGuardar(false);
    }
  };

  const cancelar = async () => {
    if (motivo.trim().length < 5) {
      toast.error('O cancelamento exige um motivo — liberta saldo da ordem.');
      return;
    }
    setAGuardar(true);
    try {
      await avisosApi.mudarEstado(aviso.id, { estado: 'CANCELADO', motivo: motivo.trim() });
      toast.success('Aviso cancelado. O saldo volta à ordem de compra.');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao cancelar.');
    } finally {
      setAGuardar(false);
    }
  };

  const guardarEntrega = async () => {
    if (entrega.recebidoPorNome.trim().length < 3) {
      toast.error('Indica quem recebeu a carga — uma prova sem nome não prova nada.');
      return;
    }
    setAGuardar(true);
    try {
      await avisosApi.registarEntrega(aviso.id, {
        recebidoPorNome: entrega.recebidoPorNome.trim(),
        provaUrl: entrega.provaUrl.trim() || undefined,
        observacoes: entrega.observacoes.trim() || undefined,
      });
      toast.success('Prova de entrega registada. O stock não muda — isso é a recepção.');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao registar a entrega.');
    } finally {
      setAGuardar(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Truck size={16} className="text-slate-400" />
              {actual.numeroFornecedor ?? `Aviso #${actual.id.slice(0, 8)}`}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">{actual.fornecedor?.nome}</p>
          </div>
          <div className="flex items-center gap-3">
            <EstadoAvisoBadge estado={actual.estado} />
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="space-y-5 px-5 py-4">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-slate-500">Transportador</dt>
              <dd className="text-slate-800">{actual.transportador ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Viatura</dt>
              <dd className="font-mono text-slate-800">{actual.matricula ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Motorista</dt>
              <dd className="text-slate-800">
                {actual.motorista ?? '—'}
                {actual.contactoMotorista && (
                  <a
                    href={`tel:${actual.contactoMotorista}`}
                    className="ml-1.5 inline-flex text-blue-600 hover:underline"
                    title={actual.contactoMotorista}
                  >
                    <Phone size={12} />
                  </a>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Origem</dt>
              <dd className="flex items-center gap-1 text-slate-800">
                {actual.origem ? (
                  <>
                    <MapPin size={11} className="text-slate-400" />
                    {actual.origem}
                  </>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Chegada prevista</dt>
              <dd className="text-slate-800">
                {actual.dataPrevistaChegada
                  ? new Date(actual.dataPrevistaChegada).toLocaleDateString('pt-MZ')
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Chegou</dt>
              <dd className="text-slate-800">
                {actual.dataChegada
                  ? new Date(actual.dataChegada).toLocaleDateString('pt-MZ')
                  : '—'}
              </dd>
            </div>
          </dl>

          {actual.linhas && actual.linhas.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Produto</th>
                    <th className="px-3 py-2 text-right font-medium">Declarado</th>
                    <th className="px-3 py-2 font-medium">Lote</th>
                    <th className="px-3 py-2 font-medium">Validade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {actual.linhas.map((l) => (
                    <tr key={l.id}>
                      <td className="px-3 py-2 font-mono text-xs text-slate-600">
                        {l.produtoId.slice(0, 8)}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">{l.quantidade}</td>
                      <td className="px-3 py-2 text-slate-600">{l.lote ?? '—'}</td>
                      <td className="px-3 py-2 text-slate-600">
                        {l.validade ? new Date(l.validade).toLocaleDateString('pt-MZ') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* O lote e a validade vêm do fornecedor e são informativos: quem decide o
                  que entra em stock é a recepção, depois de olhar para a caixa. */}
              <p className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Lote e validade como o fornecedor os declarou. Quem decide o que entra em stock
                é a recepção.
              </p>
            </div>
          )}

          {actual.entregueEm && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="flex items-center gap-2 text-xs font-medium text-emerald-900">
                <ClipboardSignature size={14} />
                Prova de entrega
              </p>
              <p className="mt-1 text-sm text-emerald-800">
                Recebido por {actual.recebidoPorNome} ·{' '}
                {new Date(actual.entregueEm).toLocaleString('pt-MZ')}
              </p>
              {actual.observacoesEntrega && (
                <p className="mt-1 text-xs text-emerald-700">{actual.observacoesEntrega}</p>
              )}
            </div>
          )}

          {podeEntregar && !actual.entregueEm && (
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-medium text-slate-800">Registar prova de entrega</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Demonstra que a carga chegou. <strong>Não actualiza stock</strong> — quem assina
                à porta assinou que um camião encostou.
              </p>
              <div className="mt-3 space-y-2">
                <input
                  value={entrega.recebidoPorNome}
                  onChange={(e) => setEntrega({ ...entrega, recebidoPorNome: e.target.value })}
                  placeholder="Quem recebeu a carga"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-300 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <input
                  value={entrega.provaUrl}
                  onChange={(e) => setEntrega({ ...entrega, provaUrl: e.target.value })}
                  placeholder="Fotografia ou assinatura (link)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-300 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <button
                  onClick={guardarEntrega}
                  disabled={aGuardar}
                  className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Registar entrega
                </button>
              </div>
            </div>
          )}

          {aCancelar && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
              <p className="text-xs text-rose-800">
                Cancelar liberta o saldo desta declaração, e a ordem volta a poder receber
                avisos pelas mesmas quantidades. Sem motivo escrito, ninguém percebe meses
                depois porque é que a mercadoria não veio.
              </p>
              <input
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Fornecedor cancelou a expedição."
                className="mt-2 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm placeholder:text-rose-300 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Fechar
          </button>

          {TRANSICOES_AVISO[actual.estado].includes('CANCELADO') &&
            (aCancelar ? (
              <button
                onClick={cancelar}
                disabled={aGuardar}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {aGuardar && <Loader2 size={14} className="animate-spin" />}
                Confirmar cancelamento
              </button>
            ) : (
              <button
                onClick={() => setACancelar(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                <Ban size={14} /> Cancelar aviso
              </button>
            ))}

          {seguintes.map((e) => (
            <button
              key={e}
              onClick={() => avancar(e)}
              disabled={aGuardar}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {aGuardar ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <PackageCheck size={14} />
              )}
              Marcar como {ROTULO_ESTADO_AVISO[e].toLowerCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
