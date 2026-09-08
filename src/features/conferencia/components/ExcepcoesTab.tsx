import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2, ShieldCheck, X, Scale } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/shared/utils';
import {
  conferenciaApi,
  EstadoExcepcao,
  ROTULO_TIPO,
  ROTULO_ESTADO_EXCEPCAO,
  TRANSICOES_EXCEPCAO,
  EXIGE_DECISAO,
} from '../api/conferencia.api';
import type { CasoExcepcao } from '../api/conferencia.api';

const mt = (v: number) =>
  `${v.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;

/** Os estados que ainda pedem trabalho. É o filtro por omissão. */
const POR_TRATAR: EstadoExcepcao[] = [
  'ABERTA',
  'ATRIBUIDA',
  'EM_ANALISE',
  'AGUARDA_FORNECEDOR',
  'ESCALADA',
];

/**
 * O Centro de Excepções.
 *
 * ## Um caso não é um alerta
 *
 * Um alerta é lido e esquecido; um caso tem responsável, prazo, decisão e histórico. Uma
 * factura com 300 meticais a mais que ninguém contestou porque o aviso passou despercebido
 * é dinheiro perdido de forma indistinguível de fraude.
 *
 * ## A ordem da lista é por gravidade e valor, e não por data
 *
 * Quem tem tempo para um caso deve pegar no que custa mais, e não no que chegou primeiro.
 * A ordenação vem do servidor; aqui só não se estraga.
 */
export function ExcepcoesTab() {
  const queryClient = useQueryClient();
  const [filtro, setFiltro] = useState<EstadoExcepcao | 'POR_TRATAR' | 'TODAS'>('POR_TRATAR');
  const [aTratar, setATratar] = useState<CasoExcepcao | null>(null);

  const { data: casos = [], isLoading } = useQuery({
    queryKey: ['excepcoes', filtro],
    queryFn: () =>
      conferenciaApi.listarExcepcoes(
        filtro === 'POR_TRATAR' || filtro === 'TODAS' ? undefined : { estado: filtro },
      ),
  });

  const visiveis =
    filtro === 'POR_TRATAR' ? casos.filter((c) => POR_TRATAR.includes(c.estado)) : casos;

  const emAberto = casos.filter((c) => POR_TRATAR.includes(c.estado));
  const valorEmAberto = emAberto.reduce((s, c) => s + (c.valor ?? 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        A carregar casos...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {emAberto.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle size={18} className="shrink-0 text-amber-600" />
          <p className="text-sm text-amber-900">
            <strong>{emAberto.length}</strong>{' '}
            {emAberto.length === 1 ? 'caso por tratar' : 'casos por tratar'}, num total de{' '}
            <strong>{mt(valorEmAberto)}</strong> em causa.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {(['POR_TRATAR', 'TODAS', 'RESOLVIDA', 'DISPENSADA', 'ENCERRADA'] as const).map((f) => (
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
            {f === 'POR_TRATAR'
              ? 'Por tratar'
              : f === 'TODAS'
                ? 'Todos'
                : ROTULO_ESTADO_EXCEPCAO[f]}
          </button>
        ))}
      </div>

      {visiveis.length === 0 ? (
        <div className="py-16 text-center">
          <ShieldCheck className="mx-auto mb-3 h-12 w-12 text-emerald-300" />
          <p className="text-sm font-medium text-slate-700">
            {filtro === 'POR_TRATAR' ? 'Nenhum caso por tratar.' : 'Nenhum caso neste estado.'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Os casos aparecem aqui quando uma conferência encontra divergências acima da
            tolerância configurada.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Caso</th>
                <th className="px-3 py-2.5 font-medium">Tipo</th>
                <th className="px-3 py-2.5 font-medium">O que aconteceu</th>
                <th className="hidden px-3 py-2.5 text-right font-medium md:table-cell">Valor</th>
                <th className="hidden px-3 py-2.5 font-medium sm:table-cell">Responsável</th>
                <th className="px-3 py-2.5 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visiveis.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setATratar(c)}
                  className="cursor-pointer hover:bg-slate-50/60"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-slate-600">#{c.numero}</span>
                    <GravidadePonto gravidade={c.gravidade} />
                  </td>
                  <td className="px-3 py-3 font-medium text-slate-900">{ROTULO_TIPO[c.tipo]}</td>
                  <td className="max-w-md px-3 py-3 text-slate-600">
                    <p className="line-clamp-2">{c.descricao}</p>
                  </td>
                  <td className="hidden px-3 py-3 text-right text-slate-700 md:table-cell">
                    {c.valor != null ? mt(c.valor) : '—'}
                  </td>
                  <td className="hidden px-3 py-3 text-slate-500 sm:table-cell">
                    {c.responsavel?.name ?? '—'}
                  </td>
                  <td className="px-3 py-3">
                    <EstadoCaso estado={c.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {aTratar && (
        <TratarCasoModal
          caso={aTratar}
          onClose={() => setATratar(null)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['excepcoes'] })}
        />
      )}
    </div>
  );
}

function GravidadePonto({ gravidade }: { gravidade: CasoExcepcao['gravidade'] }) {
  const cores = { ALTA: 'bg-rose-500', MEDIA: 'bg-amber-500', BAIXA: 'bg-slate-300' };
  const titulos = { ALTA: 'Gravidade alta', MEDIA: 'Gravidade média', BAIXA: 'Gravidade baixa' };

  return (
    <span
      title={titulos[gravidade]}
      className={cn('ml-2 inline-block h-2 w-2 rounded-full align-middle', cores[gravidade])}
    />
  );
}

function EstadoCaso({ estado }: { estado: EstadoExcepcao }) {
  const cores: Record<EstadoExcepcao, string> = {
    ABERTA: 'bg-rose-100 text-rose-700',
    ATRIBUIDA: 'bg-blue-100 text-blue-700',
    EM_ANALISE: 'bg-blue-100 text-blue-700',
    AGUARDA_FORNECEDOR: 'bg-amber-100 text-amber-800',
    ESCALADA: 'bg-purple-100 text-purple-700',
    RESOLVIDA: 'bg-emerald-100 text-emerald-700',
    // Dispensada não é resolvida, e a cor di-lo: fechou-se sem resolver.
    DISPENSADA: 'bg-slate-100 text-slate-600',
    REJEITADA: 'bg-slate-100 text-slate-600',
    ENCERRADA: 'bg-slate-100 text-slate-500',
  };

  return (
    <span
      className={cn(
        'whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        cores[estado],
      )}
    >
      {ROTULO_ESTADO_EXCEPCAO[estado]}
    </span>
  );
}

function TratarCasoModal({
  caso,
  onClose,
  onSuccess,
}: {
  caso: CasoExcepcao;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [estado, setEstado] = useState<EstadoExcepcao | ''>('');
  const [decisao, setDecisao] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const possiveis = TRANSICOES_EXCEPCAO[caso.estado];
  const exigeMotivo = estado !== '' && EXIGE_DECISAO.includes(estado);

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estado) return;

    if (exigeMotivo && decisao.trim().length < 5) {
      toast.error(
        estado === 'DISPENSADA'
          ? 'Dispensar exige escrever porquê — fica registado como dispensa, não como resolução.'
          : 'Esta decisão exige um motivo escrito.',
      );
      return;
    }

    setIsSaving(true);
    try {
      await conferenciaApi.actualizarExcepcao(caso.id, {
        estado,
        decisao: decisao.trim() || undefined,
      });
      toast.success('Caso actualizado.');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao actualizar o caso.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Caso #{caso.numero} · {ROTULO_TIPO[caso.tipo]}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Aberto em {new Date(caso.createdAt).toLocaleDateString('pt-MZ')}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </header>

        <form onSubmit={submeter} className="space-y-5 px-5 py-4">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-700">{caso.descricao}</p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
              {caso.valor != null && (
                <span>
                  Valor em causa: <strong className="text-slate-700">{mt(caso.valor)}</strong>
                </span>
              )}
              {caso.nivelResolvido && (
                // Sem isto, a pergunta «porque é que esta divergência de 4% passou e
                // aquela de 2% não» não tem resposta sem reconstruir a configuração
                // que existia naquele dia.
                <span>
                  Tolerância decidida ao nível{' '}
                  <strong className="text-slate-700">{caso.nivelResolvido}</strong>
                </span>
              )}
            </div>
          </div>

          {caso.decisao && (
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-medium text-slate-500">Decisão anterior</p>
              <p className="mt-1 text-sm text-slate-700">{caso.decisao}</p>
              {caso.decididoPor && (
                <p className="mt-1 text-xs text-slate-400">
                  {caso.decididoPor.name}
                  {caso.decididoEm &&
                    ` · ${new Date(caso.decididoEm).toLocaleDateString('pt-MZ')}`}
                </p>
              )}
            </div>
          )}

          {possiveis.length === 0 ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              Este caso está encerrado e não reabre. Se apareceu informação nova, confere a
              factura outra vez — isso substitui a avaliação e abre casos novos.
            </p>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Passar a
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as EstadoExcepcao)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                >
                  <option value="">Escolhe...</option>
                  {possiveis.map((p) => (
                    <option key={p} value={p}>
                      {ROTULO_ESTADO_EXCEPCAO[p]}
                    </option>
                  ))}
                </select>
              </div>

              {estado === 'DISPENSADA' && (
                <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <Scale size={16} className="mt-0.5 shrink-0" />
                  <p>
                    Dispensar é fechar o caso <strong>sem</strong> o resolver — legítimo para o
                    desvio que custa mais a discutir do que a pagar. Fica registado como
                    dispensa e não como resolução: são coisas diferentes, e a auditoria
                    precisa de as distinguir.
                  </p>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Decisão {exigeMotivo && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  value={decisao}
                  onChange={(e) => setDecisao(e.target.value)}
                  rows={3}
                  placeholder="Fornecedor emitiu nota de crédito da diferença."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-300 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              Fechar
            </button>
            {possiveis.length > 0 && (
              <button
                type="submit"
                disabled={!estado || isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {isSaving && <Loader2 size={14} className="animate-spin" />}
                Guardar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
