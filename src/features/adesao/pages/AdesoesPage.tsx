import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { mensagemDeErro } from '@/shared/utils';
import { api } from '@/shared/config';
import {
  adesoes,
  EstadoPedidoAdesao,
  type PedidoAdesao,
} from '../api/adesao.api';

/**
 * A fila de pedidos de adesão, e as duas decisões.
 *
 * ## Só o SUPER_ADMIN chega aqui
 *
 * O `PermissoesGuard` do backend dá bypass total a SUPER_ADMIN **e a ADMIN** — e é por isso
 * que as rotas de adesão levam também o `RolesGuard`, que compara o role exactamente. Sem
 * ele, o ADMIN de um cliente qualquer poderia criar outras empresas na plataforma.
 *
 * Este ecrã não repete essa verificação para autorizar nada: quem autoriza é o servidor. O
 * que o frontend faz é não mostrar a entrada de menu a quem não pode usá-la, porque um item
 * que dá sempre 403 é pior do que um item que não existe.
 *
 * ## As decisões pedem confirmação, e é a única coisa que este ecrã protege
 *
 * Aprovar cria uma empresa, um administrador com senha, e uma assinatura facturável, e manda
 * o e-mail. Recusar manda o motivo. Nenhuma das duas se desfaz — não há «desaprovar», porque
 * desfazer uma aprovação é apagar uma empresa, que é outra operação com outras consequências.
 *
 * Daí a confirmação explícita antes de chamar, e daí o botão de aprovar exigir que os módulos
 * estejam escolhidos antes de ficar activo.
 */
interface ModuloDoCatalogo {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  precoMensal: string | number;
}

export function AdesoesPage() {
  const [filtro, setFiltro] = useState<EstadoPedidoAdesao | 'TODOS'>('PENDENTE');
  const [aberto, setAberto] = useState<PedidoAdesao | null>(null);

  const { data: pedidos, isLoading } = useQuery({
    queryKey: ['adesoes', filtro],
    queryFn: () => adesoes.listar(filtro === 'TODOS' ? undefined : filtro),
  });

  const contagens = useMemo(() => {
    const lista = pedidos ?? [];
    return {
      pendentes: lista.filter((p) => p.estado === 'PENDENTE').length,
      total: lista.length,
    };
  }, [pedidos]);

  return (
    <div className="p-6">
      <header className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900">Pedidos de adesão</h1>
        <p className="mt-1 text-sm text-slate-500">
          Empresas que pediram para ser clientes. Aprovar cria a empresa, o administrador e a
          assinatura, e envia o código de acesso por e-mail.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {(['PENDENTE', 'APROVADO', 'RECUSADO', 'TODOS'] as const).map((e) => (
          <button
            key={e}
            onClick={() => setFiltro(e)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              filtro === e
                ? 'bg-slate-900 text-white'
                : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {e === 'TODOS' ? 'Todos' : etiquetaEstado(e)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-500">
          <Loader2 size={15} className="animate-spin" />
          A carregar a fila…
        </div>
      ) : contagens.total === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <Clock size={22} className="mx-auto text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">
            {filtro === 'PENDENTE'
              ? 'Nenhum pedido à espera de decisão.'
              : 'Nenhum pedido neste estado.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {(pedidos ?? []).map((pedido) => (
            <LinhaPedido key={pedido.id} pedido={pedido} onAbrir={() => setAberto(pedido)} />
          ))}
        </div>
      )}

      {aberto ? (
        <PainelDecisao pedido={aberto} onFechar={() => setAberto(null)} />
      ) : null}
    </div>
  );
}

function LinhaPedido({
  pedido,
  onAbrir,
}: {
  pedido: PedidoAdesao;
  onAbrir: () => void;
}) {
  return (
    <button
      onClick={onAbrir}
      className="flex w-full items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-slate-300"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-slate-900">
            {pedido.empresaNome}
          </span>
          <Selo estado={pedido.estado} />
        </div>

        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Building2 size={11} className="text-slate-400" />
            NUIT {pedido.empresaNuit}
          </span>
          <span className="inline-flex items-center gap-1">
            <User size={11} className="text-slate-400" />
            {pedido.gestorNome}
          </span>
          {pedido.cidade ? (
            <span className="inline-flex items-center gap-1">
              <MapPin size={11} className="text-slate-400" />
              {pedido.cidade}
            </span>
          ) : null}
        </div>

        {pedido.observacoes ? (
          <p className="mt-2 line-clamp-2 text-xs leading-snug text-slate-600">
            {pedido.observacoes}
          </p>
        ) : null}
      </div>

      <div className="shrink-0 text-right">
        <p className="text-[11px] text-slate-400">{dataCurta(pedido.createdAt)}</p>
        <p className="mt-0.5 text-[11px] font-mono uppercase text-slate-400">
          {pedido.id.slice(0, 8)}
        </p>
      </div>
    </button>
  );
}

/**
 * O painel de decisão.
 *
 * Os módulos são escolhidos aqui e não pelo requerente: pedir a alguém que escolha entre
 * onze módulos de um sistema que ainda não viu é pedir-lhe para adivinhar, e a primeira
 * conversa comercial ia desfazer a escolha. O campo «o que precisa resolver» do formulário
 * público é o que informa esta decisão.
 */
function PainelDecisao({
  pedido,
  onFechar,
}: {
  pedido: PedidoAdesao;
  onFechar: () => void;
}) {
  const queryClient = useQueryClient();
  const [modulos, setModulos] = useState<string[]>([]);
  const [motivo, setMotivo] = useState('');
  const [aConfirmar, setAConfirmar] = useState<'APROVAR' | 'RECUSAR' | null>(null);

  const decidivel = pedido.estado === 'PENDENTE';

  const { data: catalogo } = useQuery({
    queryKey: ['modulos-catalogo'],
    queryFn: async () => {
      const { data } = await api.get<ModuloDoCatalogo[]>('/empresas/modulos/catalogo');
      return data;
    },
    // Só faz falta quando há decisão a tomar. Buscar o catálogo para ver um pedido já
    // recusado seria uma chamada por cada abertura de painel, sem nada que a use.
    enabled: decidivel,
  });

  const decisao = useMutation({
    mutationFn: (payload: { decisao: 'APROVAR' | 'RECUSAR'; motivo?: string; modulos?: string[] }) =>
      adesoes.decidir(pedido.id, payload),
    onSuccess: (resposta) => {
      toast.success(resposta.mensagem);
      queryClient.invalidateQueries({ queryKey: ['adesoes'] });
      queryClient.invalidateQueries({ queryKey: ['adesoes-pendentes'] });
      // A lista de empresas muda quando uma aprovação cria uma: sem isto, o ecrã de empresas
      // continuaria a mostrar a lista antiga até alguém recarregar a página.
      if (resposta.empresaId) queryClient.invalidateQueries({ queryKey: ['empresas'] });
      onFechar();
    },
    onError: (erro: any) => {
      toast.error(mensagemDeErro(erro, 'Não foi possível registar a decisão.'));
    },
  });

  const alternarModulo = (id: string) =>
    setModulos((actuais) =>
      actuais.includes(id) ? actuais.filter((m) => m !== id) : [...actuais, id],
    );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4">
      <div className="my-8 w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">{pedido.empresaNome}</h2>
              <Selo estado={pedido.estado} />
            </div>
            <p className="mt-1 font-mono text-xs uppercase text-slate-400">
              Referência {pedido.id.slice(0, 8)}
            </p>
          </div>
          <button
            onClick={onFechar}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <XCircle size={18} />
          </button>
        </header>

        <div className="space-y-5 p-5">
          <section className="grid gap-4 sm:grid-cols-2">
            <Dado etiqueta="NUIT" valor={pedido.empresaNuit} icone={<Building2 size={12} />} />
            <Dado etiqueta="Cidade" valor={pedido.cidade} icone={<MapPin size={12} />} />
            <Dado
              etiqueta="E-mail da empresa"
              valor={pedido.empresaEmail}
              icone={<Mail size={12} />}
            />
            <Dado
              etiqueta="Telefone da empresa"
              valor={pedido.empresaTelefone}
              icone={<Phone size={12} />}
            />
            <Dado etiqueta="Responsável" valor={pedido.gestorNome} icone={<User size={12} />} />
            <Dado etiqueta="Cargo" valor={pedido.gestorCargo} icone={<User size={12} />} />
            <Dado
              etiqueta="E-mail do responsável"
              valor={pedido.gestorEmail}
              icone={<Mail size={12} />}
              destaque
            />
            <Dado
              etiqueta="Telefone do responsável"
              valor={pedido.gestorTelefone}
              icone={<Phone size={12} />}
            />
          </section>

          {pedido.observacoes ? (
            <section className="rounded-lg bg-slate-50 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                O que precisa resolver
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {pedido.observacoes}
              </p>
            </section>
          ) : null}

          {!decidivel ? (
            <section className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-medium text-slate-600">
                {pedido.estado === 'APROVADO' ? 'Aprovado' : 'Recusado'}
                {pedido.decididoPor ? ` por ${pedido.decididoPor.name}` : ''}
                {pedido.decididoEm ? ` · ${dataCurta(pedido.decididoEm)}` : ''}
              </p>
              {pedido.motivoDecisao ? (
                <p className="mt-1 text-sm leading-snug text-slate-700">{pedido.motivoDecisao}</p>
              ) : null}
              {pedido.empresa ? (
                <p className="mt-2 text-xs text-slate-500">
                  Empresa criada: <strong>{pedido.empresa.nome}</strong>
                </p>
              ) : null}
            </section>
          ) : (
            <>
              <section>
                <p className="text-xs font-medium text-slate-700">
                  Módulos a subscrever
                  <span className="ml-0.5 text-rose-500">*</span>
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                  Uma empresa sem módulos subscritos é uma empresa cujo primeiro ecrã recusa
                  tudo. Escolha ao menos um.
                </p>

                <div className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
                  {(catalogo ?? []).map((m) => (
                    <label
                      key={m.id}
                      className={`flex cursor-pointer items-start gap-2 rounded-md border p-2.5 text-xs ${
                        modulos.includes(m.id)
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={modulos.includes(m.id)}
                        onChange={() => alternarModulo(m.id)}
                        className="mt-0.5"
                      />
                      <span className="min-w-0">
                        <span className="block font-medium text-slate-800">{m.nome}</span>
                        {m.descricao ? (
                          <span className="mt-0.5 block leading-snug text-slate-500">
                            {m.descricao}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <label className="block text-xs font-medium text-slate-700">
                  Motivo
                  <span className="ml-1 font-normal text-slate-400">
                    (obrigatório ao recusar — é o que o requerente vai ler)
                  </span>
                </label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={2}
                  maxLength={1000}
                  placeholder="O NUIT indicado não corresponde à empresa nomeada."
                  className="mt-1 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </section>

              {aConfirmar ? (
                <section
                  className={`flex items-start gap-2 rounded-lg border p-3 ${
                    aConfirmar === 'APROVAR'
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-rose-200 bg-rose-50'
                  }`}
                >
                  <AlertTriangle
                    size={14}
                    className={`mt-0.5 shrink-0 ${
                      aConfirmar === 'APROVAR' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs leading-snug ${
                        aConfirmar === 'APROVAR' ? 'text-emerald-900' : 'text-rose-900'
                      }`}
                    >
                      {aConfirmar === 'APROVAR' ? (
                        <>
                          Vai criar a empresa <strong>{pedido.empresaNome}</strong>, o
                          administrador <strong>{pedido.gestorNome}</strong>, e uma assinatura
                          com {modulos.length} módulo(s). O código de acesso e a senha vão para{' '}
                          <strong>{pedido.gestorEmail}</strong>. Não se desfaz.
                        </>
                      ) : (
                        <>
                          Vai enviar o motivo para <strong>{pedido.gestorEmail}</strong>. O
                          pedido não volta à fila — quem corrigir o que estava errado tem de
                          submeter um pedido novo.
                        </>
                      )}
                    </p>

                    <div className="mt-2.5 flex gap-2">
                      <button
                        onClick={() =>
                          decisao.mutate(
                            aConfirmar === 'APROVAR'
                              ? { decisao: 'APROVAR', modulos, motivo: motivo.trim() || undefined }
                              : { decisao: 'RECUSAR', motivo: motivo.trim() },
                          )
                        }
                        disabled={decisao.isPending}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 ${
                          aConfirmar === 'APROVAR'
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'bg-rose-600 hover:bg-rose-700'
                        }`}
                      >
                        {decisao.isPending && <Loader2 size={12} className="animate-spin" />}
                        Confirmar {aConfirmar === 'APROVAR' ? 'aprovação' : 'recusa'}
                      </button>
                      <button
                        onClick={() => setAConfirmar(null)}
                        disabled={decisao.isPending}
                        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Voltar atrás
                      </button>
                    </div>
                  </div>
                </section>
              ) : null}
            </>
          )}
        </div>

        {decidivel && !aConfirmar ? (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 p-4">
            <button
              onClick={() => {
                if (motivo.trim().length < 5) {
                  toast.error('Recusar exige um motivo com ao menos 5 caracteres.');
                  return;
                }
                setAConfirmar('RECUSAR');
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-rose-300 px-3.5 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
            >
              <XCircle size={14} />
              Recusar
            </button>
            <button
              onClick={() => {
                if (modulos.length === 0) {
                  toast.error('Escolha ao menos um módulo antes de aprovar.');
                  return;
                }
                setAConfirmar('APROVAR');
              }}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <CheckCircle2 size={14} />
              Aprovar
            </button>
          </footer>
        ) : null}
      </div>
    </div>
  );
}

function Dado({
  etiqueta,
  valor,
  icone,
  destaque,
}: {
  etiqueta: string;
  valor: string | null;
  icone: React.ReactNode;
  destaque?: boolean;
}) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {icone}
        {etiqueta}
      </p>
      <p
        className={`mt-0.5 break-words text-sm ${
          valor ? (destaque ? 'font-medium text-slate-900' : 'text-slate-700') : 'text-slate-400'
        }`}
      >
        {valor || '—'}
      </p>
    </div>
  );
}

function Selo({ estado }: { estado: EstadoPedidoAdesao }) {
  const estilos: Record<EstadoPedidoAdesao, string> = {
    PENDENTE: 'bg-amber-100 text-amber-800',
    APROVADO: 'bg-emerald-100 text-emerald-800',
    RECUSADO: 'bg-rose-100 text-rose-800',
  };

  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${estilos[estado]}`}
    >
      {etiquetaEstado(estado)}
    </span>
  );
}

function etiquetaEstado(estado: EstadoPedidoAdesao): string {
  if (estado === 'PENDENTE') return 'Pendente';
  if (estado === 'APROVADO') return 'Aprovado';
  return 'Recusado';
}

function dataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
