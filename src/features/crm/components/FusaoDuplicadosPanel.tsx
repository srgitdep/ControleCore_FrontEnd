import { useState } from 'react';
import { GitMerge, Search, Loader2, X, AlertTriangle, Check, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useCandidatosFusao,
  useResolverCandidatoFusao,
  useFundirClientes,
  useSearchClientes,
} from '../hooks/useClientes';
import type { CandidatoFusao, EstadoCandidatoFusao, Cliente } from '../api/clientes.api';
import { cn } from '@/shared/utils';

const mt = (v: number) =>
  Number(v).toLocaleString('pt-MZ', { minimumFractionDigits: 2 }) + ' MT';

const ROTULO_ESTADO: Record<EstadoCandidatoFusao, string> = {
  PENDENTE: 'Por decidir',
  CONFIRMADO: 'Fundidos',
  REJEITADO: 'Rejeitado',
};

/**
 * Clientes que parecem ser o mesmo, e a fusão manual.
 *
 * ## De onde vêm os candidatos
 *
 * Nascem sozinhos: ao ligar uma identidade (telefone, email, NUIT...) que já pertence a
 * outro cliente, o sistema não funde — regista o par e devolve o aviso a quem tentou. É
 * aqui que se decide o que fazer com esse par: confirmar (escolhendo qual dos dois fica) ou
 * rejeitar (são pessoas diferentes que partilham, por exemplo, um telefone de família).
 *
 * ## Fundir é irreversível
 *
 * Não há operação de desfazer na API. O aviso no modal de confirmação não é decorativo.
 */
export function FusaoDuplicadosPanel() {
  const [filtro, setFiltro] = useState<EstadoCandidatoFusao>('PENDENTE');
  const [aResolver, setAResolver] = useState<{ candidato: CandidatoFusao; aceitar: boolean } | null>(
    null,
  );
  const [aFundirManual, setAFundirManual] = useState(false);

  const { data: candidatos = [], isLoading } = useCandidatosFusao(filtro);
  const resolver = useResolverCandidatoFusao();

  return (
    <div className="space-y-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <GitMerge size={18} className="text-blue-600" />
            Duplicados
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Clientes que partilham um telefone, email ou NUIT — pode ser a mesma pessoa.
          </p>
        </div>
        <button
          onClick={() => setAFundirManual(true)}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <GitMerge size={15} />
          Fundir manualmente
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(['PENDENTE', 'CONFIRMADO', 'REJEITADO'] as const).map((f) => (
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
            {ROTULO_ESTADO[f]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin text-slate-400" />
        </div>
      ) : candidatos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 py-14 text-center">
          <GitMerge size={26} className="mx-auto text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">
            {filtro === 'PENDENTE'
              ? 'Nenhum duplicado por decidir.'
              : `Nenhum candidato em «${ROTULO_ESTADO[filtro]}».`}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {candidatos.map((c) => (
            <li key={c.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                  {Math.round(c.pontuacao * 100)}% de confiança
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(c.createdAt).toLocaleDateString('pt-MZ')}
                </span>
              </div>

              <p className="mt-2 text-xs text-slate-500">{c.motivo}</p>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ClienteResumo cliente={c.clienteA} />
                <ClienteResumo cliente={c.clienteB} />
              </div>

              {c.estado === 'PENDENTE' && (
                <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => setAResolver({ candidato: c, aceitar: false })}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Ban size={13} /> Rejeitar
                  </button>
                  <button
                    onClick={() => setAResolver({ candidato: c, aceitar: true })}
                    className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    <Check size={13} /> Confirmar fusão
                  </button>
                </div>
              )}

              {c.estado !== 'PENDENTE' && (
                <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
                  {c.estado === 'CONFIRMADO' ? 'Fundidos' : 'Rejeitado'}
                  {c.revistoEm && ` em ${new Date(c.revistoEm).toLocaleDateString('pt-MZ')}`}.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {aResolver && (
        <ResolverModal
          candidato={aResolver.candidato}
          aceitar={aResolver.aceitar}
          isSaving={resolver.isPending}
          onConfirmar={(principalId) => {
            resolver.mutate(
              {
                id: aResolver.candidato.id,
                estado: aResolver.aceitar ? 'CONFIRMADO' : 'REJEITADO',
                principalId: aResolver.aceitar ? principalId : undefined,
              },
              { onSuccess: () => setAResolver(null) },
            );
          }}
          onClose={() => setAResolver(null)}
        />
      )}

      {aFundirManual && <FundirManualModal onClose={() => setAFundirManual(false)} />}
    </div>
  );
}

function ClienteResumo({ cliente }: { cliente: CandidatoFusao['clienteA'] }) {
  return (
    <div
      className={cn(
        'rounded-lg border p-3 text-sm',
        cliente.fundidoEmId ? 'border-slate-200 bg-slate-50 opacity-60' : 'border-slate-200',
      )}
    >
      <p className="font-medium text-slate-900">{cliente.nome}</p>
      <dl className="mt-1 space-y-0.5 text-xs text-slate-500">
        {cliente.telefone && <p>{cliente.telefone}</p>}
        {cliente.email && <p>{cliente.email}</p>}
        {cliente.nuit && <p>NUIT {cliente.nuit}</p>}
        <p>
          {cliente.pontos} pts · {mt(cliente.totalGasto)}
        </p>
      </dl>
      {cliente.fundidoEmId && (
        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-700">
          <AlertTriangle size={11} /> Já foi fundido noutro cliente.
        </p>
      )}
    </div>
  );
}

function ResolverModal({
  candidato,
  aceitar,
  isSaving,
  onConfirmar,
  onClose,
}: {
  candidato: CandidatoFusao;
  aceitar: boolean;
  isSaving: boolean;
  onConfirmar: (principalId?: string) => void;
  onClose: () => void;
}) {
  const [principalId, setPrincipalId] = useState<string>(candidato.clienteA.id);
  const jaFundido = candidato.clienteA.fundidoEmId || candidato.clienteB.fundidoEmId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {aceitar ? 'Confirmar fusão' : 'Rejeitar candidato'}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-4 px-5 py-4">
          {jaFundido && aceitar && (
            <p className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              Um dos dois já foi fundido noutro cliente. O servidor vai recusar esta fusão.
            </p>
          )}

          {aceitar ? (
            <>
              <p className="text-sm text-slate-600">
                Escolha qual fica. O outro é absorvido: as suas vendas, pontos e identidades
                passam para o que ficar, e ele desaparece da lista de clientes.
              </p>
              <div className="space-y-2">
                {[candidato.clienteA, candidato.clienteB].map((cliente) => (
                  <label
                    key={cliente.id}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-lg border p-3',
                      principalId === cliente.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200',
                    )}
                  >
                    <input
                      type="radio"
                      name="principal"
                      checked={principalId === cliente.id}
                      onChange={() => setPrincipalId(cliente.id)}
                      className="mt-1"
                    />
                    <div className="text-sm">
                      <p className="font-medium text-slate-900">{cliente.nome}</p>
                      <p className="text-xs text-slate-500">
                        {cliente.telefone || cliente.email || '—'} · {cliente.pontos} pts ·{' '}
                        {mt(cliente.totalGasto)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-600">
              Rejeitar diz que <strong>não</strong> são a mesma pessoa — por exemplo, um
              telefone de família partilhado por duas pessoas diferentes. O par não volta a
              ser sugerido.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirmar(aceitar ? principalId : undefined)}
            disabled={isSaving || (aceitar && !!jaFundido)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50',
              aceitar ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-700',
            )}
          >
            {isSaving && <Loader2 size={14} className="animate-spin" />}
            {aceitar ? 'Fundir' : 'Rejeitar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Fundir dois clientes escolhidos livremente, sem passar por um candidato sugerido. */
function FundirManualModal({ onClose }: { onClose: () => void }) {
  const [pesquisaA, setPesquisaA] = useState('');
  const [pesquisaB, setPesquisaB] = useState('');
  const [principal, setPrincipal] = useState<Cliente | null>(null);
  const [absorvido, setAbsorvido] = useState<Cliente | null>(null);
  const [motivo, setMotivo] = useState('');

  const { data: resultadosA = [] } = useSearchClientes(pesquisaA);
  const { data: resultadosB = [] } = useSearchClientes(pesquisaB);

  const fundir = useFundirClientes();

  const submeter = () => {
    if (!principal || !absorvido) return toast.error('Escolha os dois clientes.');
    if (principal.id === absorvido.id) return toast.error('Escolha dois clientes diferentes.');

    fundir.mutate(
      { principalId: principal.id, absorvidoId: absorvido.id, motivo: motivo.trim() || undefined },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Fundir clientes</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-4 px-5 py-4">
          <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            Irreversível. O absorvido desaparece da lista de clientes.
          </p>

          <ClienteSelector
            label="Fica (principal)"
            pesquisa={pesquisaA}
            onPesquisa={setPesquisaA}
            resultados={resultadosA}
            selecionado={principal}
            onSelecionar={setPrincipal}
          />

          <ClienteSelector
            label="Absorvido"
            pesquisa={pesquisaB}
            onPesquisa={setPesquisaB}
            resultados={resultadosB}
            selecionado={absorvido}
            onSelecionar={setAbsorvido}
          />

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Motivo <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: confirmado por telefone com o cliente"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={submeter}
            disabled={fundir.isPending || !principal || !absorvido}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {fundir.isPending && <Loader2 size={14} className="animate-spin" />}
            Fundir
          </button>
        </div>
      </div>
    </div>
  );
}

function ClienteSelector({
  label,
  pesquisa,
  onPesquisa,
  resultados,
  selecionado,
  onSelecionar,
}: {
  label: string;
  pesquisa: string;
  onPesquisa: (v: string) => void;
  resultados: Cliente[];
  selecionado: Cliente | null;
  onSelecionar: (c: Cliente) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      {selecionado ? (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm">
          <span className="font-medium text-slate-900">{selecionado.nome}</span>
          <button
            onClick={() => onSelecionar(null as unknown as Cliente)}
            className="text-xs text-blue-600 hover:underline"
          >
            trocar
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={pesquisa}
            onChange={(e) => onPesquisa(e.target.value)}
            placeholder="Nome, telefone, email ou NUIT..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          {pesquisa.trim().length >= 2 && resultados.length > 0 && (
            <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
              {resultados.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelecionar(c)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <span className="text-slate-800">{c.nome}</span>
                  <span className="text-xs text-slate-400">
                    {c.telefone || c.email || c.nuit || ''}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
