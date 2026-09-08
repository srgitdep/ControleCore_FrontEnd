import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  ShoppingBag,
  ShoppingCart,
  Truck,
  Sparkles,
  PackageCheck,
  Loader2,
  PackageSearch,
  Send,
  Gavel,
  MessageSquare,
  UserCheck,
  FileSpreadsheet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  purchasesApi,
  EstadoPedidoCompra,
  EstadoAprovacaoOC,
  podeReceberMercadoria,
  podeSubmeter,
  podeDecidir,
  podeEnviar,
  podeConfirmar,
} from '../api/purchases.api';
import type { PurchaseOrder, SugestaoCompra } from '../api/purchases.api';
import { FornecedoresTab } from '@/features/fornecedores';
import { Tabs, type TabDefinition } from '@/shared/ui';
import { usePermissions, useAuth } from '@/features/auth';
import { cn } from '@/shared/utils';
import { RecebimentoModal } from '../components/RecebimentoModal';
import { RececoesModal } from '../components/RececoesModal';
import { SugestaoComprasModal, SugestoesDeCompra } from '../components/SugestaoComprasModal';
import { CriarPedidoModal } from '../components/CriarPedidoModal';
import { AprovacaoModal } from '../components/AprovacaoModal';
import { ConfirmacaoFornecedorModal } from '../components/ConfirmacaoFornecedorModal';
import { AvisosExpedicaoTab } from '../components/AvisosExpedicaoTab';
import { CatalogoTab } from '@/features/catalogo-fornecedor';
import { CriarAvisoModal } from '../components/CriarAvisoModal';

type Aba = 'pedidos' | 'reposicao' | 'expedicoes' | 'catalogo' | 'fornecedores';

const moeda = (valor: number) =>
  valor.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });

/**
 * A secção Compras: pedidos e fornecedores.
 *
 * ## Porque Fornecedores vive aqui
 *
 * Fornecedores estava em dois lugares — uma entrada no menu com CRUD completo, e um
 * separador aqui que era uma tabela de quatro colunas só de leitura. Duas vistas dos
 * mesmos dados, uma delas incompleta, e a incompleta era a que aparecia no contexto em
 * que os fornecedores importam: a fazer uma compra.
 *
 * Fica só aqui, com o CRUD completo mais o desempenho e o histórico.
 *
 * ## O que passou a funcionar
 *
 * O botão «Sugestão de Compras» mostrava um toast que dizia «(Simulação MVP)» sem fazer
 * nenhuma chamada de rede. O botão «Novo Pedido» não tinha `onClick` — criar um pedido
 * pela interface era impossível.
 */
export function PurchasesPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = usePermissions();
  // Serve só para avisar, antes de decidir, que a aprovação vai ser uma auto-aprovação.
  // Quem decide mesmo é o backend, que a marca como excepção de segregação de funções.
  const utilizadorId = useAuth().user?.id;

  // As rotas de fornecedor exigem `VER_FORNECEDOR`, as de compras `GERIR_COMPRAS`. Um
  // perfil com uma e não a outra veria o separador falhar com 403 — melhor não o
  // mostrar do que mostrar um erro.
  const podeVerFornecedores = hasPermission('read', 'fornecedor');

  const ABAS: TabDefinition<Aba>[] = [
    { id: 'pedidos', label: 'Pedidos de compra', icon: ShoppingCart },
    // A seguir aos pedidos, e antes dos fornecedores: é o que se consulta para
    // decidir o que encomendar. Estava atrás de um botão que abria um diálogo — uma
    // lista de rupturas que é preciso saber procurar não é uma lista que alguém veja.
    { id: 'reposicao', label: 'A repor', icon: PackageSearch },
    // A seguir ao que se vai encomendar vem o que já vem a caminho. Responde a «o que
    // chega esta semana» — pergunta que antes só tinha resposta abrindo cada ordem uma
    // a uma e adivinhando pela data prevista.
    { id: 'expedicoes', label: 'A caminho', icon: Truck },
    // O catálogo vem antes dos fornecedores porque é sobre o que eles vendem, e a
    // pergunta «a que preço?» faz-se mais vezes do que «quem é este fornecedor?».
    ...(podeVerFornecedores
      ? [
          { id: 'catalogo' as Aba, label: 'Catálogo', icon: FileSpreadsheet },
          { id: 'fornecedores' as Aba, label: 'Fornecedores', icon: Truck },
        ]
      : []),
  ];

  const doUrl = searchParams.get('tab');
  const aba: Aba = ABAS.some((a) => a.id === doUrl) ? (doUrl as Aba) : 'pedidos';

  const [aReceber, setAReceber] = useState<PurchaseOrder | null>(null);
  const [aVerRececoes, setAVerRececoes] = useState<PurchaseOrder | null>(null);
  const [aDecidir, setADecidir] = useState<PurchaseOrder | null>(null);
  const [aConfirmar, setAConfirmar] = useState<PurchaseOrder | null>(null);
  const [aSubmeter, setASubmeter] = useState<string | null>(null);
  const [aExpedir, setAExpedir] = useState<PurchaseOrder | null>(null);
  const [mostrarSugestao, setMostrarSugestao] = useState(false);
  const [aCriar, setACriar] = useState<{
    linhas?: { produtoId: string; nome: string; quantidade: number; custoUnitario: number }[];
    fornecedorId?: string;
  } | null>(null);

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['compras-pedidos'],
    queryFn: () => purchasesApi.getOrders(),
    enabled: aba === 'pedidos',
  });

  const recarregar = () => queryClient.invalidateQueries({ queryKey: ['compras-pedidos'] });

  /** Da sugestão para o pedido: as linhas escolhidas viram um rascunho. */
  const daSugestaoParaPedido = (linhas: SugestaoCompra[]) => {
    if (linhas.length === 0) return;

    // O fornecedor do primeiro; um pedido é a um fornecedor só, e o modal da sugestão
    // já avisa quando as linhas escolhidas são de fornecedores diferentes.
    const fornecedorId = linhas[0].fornecedorSugerido?.id;

    setMostrarSugestao(false);
    setACriar({
      fornecedorId,
      linhas: linhas.map((l) => ({
        produtoId: l.produtoId,
        nome: l.nome,
        quantidade: l.quantidadeSugerida,
        custoUnitario: l.fornecedorSugerido?.custoCompra ?? 0,
      })),
    });
  };

  const enviarAoFornecedor = async (pedido: PurchaseOrder) => {
    setASubmeter(pedido.id);
    try {
      await purchasesApi.sendOrder(pedido.id);
      toast.success('Ordem marcada como enviada. Já podes registar a resposta do fornecedor.');
      queryClient.invalidateQueries({ queryKey: ['pedidos-compra'] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao marcar como enviada.');
    } finally {
      setASubmeter(null);
    }
  };

  const submeterParaAprovacao = async (pedido: PurchaseOrder) => {
    setASubmeter(pedido.id);
    try {
      await purchasesApi.submitOrder(pedido.id);
      toast.success('Pedido submetido. Fica à espera de aprovação e deixa de ser editável.');
      queryClient.invalidateQueries({ queryKey: ['pedidos-compra'] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao submeter o pedido.');
    } finally {
      setASubmeter(null);
    }
  };

  /**
   * O clique na linha leva ao passo seguinte do pedido, seja ele qual for.
   *
   * Antes olhava só para `estado` e mandava um toast informativo quando não era
   * recebível — o que, depois da governação, era o caso de **todos** os pedidos novos:
   * nascem em rascunho, e o ecrã não tinha por onde os fazer avançar.
   */
  const aoClicarNoPedido = (pedido: PurchaseOrder) => {
    if (podeReceberMercadoria(pedido)) {
      setAReceber(pedido);
      return;
    }
    if (podeDecidir(pedido)) {
      setADecidir(pedido);
      return;
    }
    if (podeSubmeter(pedido)) {
      submeterParaAprovacao(pedido);
      return;
    }
    if (podeEnviar(pedido)) {
      enviarAoFornecedor(pedido);
      return;
    }
    if (
      pedido.estado === EstadoPedidoCompra.RECEBIDO ||
      pedido.estadoCumprimento === 'TOTALMENTE_RECEBIDA'
    ) {
      // Um pedido recebido não aceita mais mercadoria, mas as suas recepções
      // interessam — antes, clicar nele só dava um toast a dizer o estado.
      setAVerRececoes(pedido);
      return;
    }
    setAVerRececoes(pedido);
  };

  return (
    <div className="space-y-6">
      {/* O nome e a descrição saíram: o cabeçalho da aplicação já diz «Compras», e os
          separadores abaixo dizem o resto. Sobram as acções, encostadas à direita. */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {aba === 'pedidos' && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setMostrarSugestao(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Sparkles className="h-4 w-4 text-indigo-600" />
              Sugestão de Compras
            </button>
            <button
              onClick={() => setACriar({})}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <ShoppingBag className="h-4 w-4" />
              Novo Pedido
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Tabs
          tabs={ABAS}
          active={aba}
          onChange={(id) => setSearchParams({ tab: id }, { replace: true })}
          label="Compras"
          className="px-4"
        />

        <div className="p-4 sm:p-6">
          {aba === 'reposicao' && (
            <SugestoesDeCompra onCriarPedido={daSugestaoParaPedido} />
          )}

          {aba === 'pedidos' && (
            <ListaDePedidos
              pedidos={pedidos}
              isLoading={isLoading}
              onClicar={aoClicarNoPedido}
              onVerRececoes={setAVerRececoes}
              onSubmeter={submeterParaAprovacao}
              onDecidir={setADecidir}
              onEnviar={enviarAoFornecedor}
              onConfirmar={setAConfirmar}
              onExpedir={setAExpedir}
              aSubmeter={aSubmeter}
            />
          )}
          {aba === 'expedicoes' && <AvisosExpedicaoTab />}
          {aba === 'catalogo' && <CatalogoTab />}
          {aba === 'fornecedores' && <FornecedoresTab />}
        </div>
      </div>

      {aReceber && (
        <RecebimentoModal
          order={aReceber}
          onClose={() => setAReceber(null)}
          onSuccess={recarregar}
        />
      )}

      {aDecidir && (
        <AprovacaoModal
          order={aDecidir}
          utilizadorId={utilizadorId}
          onClose={() => setADecidir(null)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['pedidos-compra'] })}
        />
      )}

      {aExpedir && (
        <CriarAvisoModal
          order={aExpedir}
          onClose={() => setAExpedir(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['pedidos-compra'] });
            queryClient.invalidateQueries({ queryKey: ['avisos-expedicao'] });
          }}
        />
      )}

      {aConfirmar && (
        <ConfirmacaoFornecedorModal
          order={aConfirmar}
          onClose={() => setAConfirmar(null)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['pedidos-compra'] })}
        />
      )}

      {aVerRececoes && (
        <RececoesModal
          order={aVerRececoes}
          onClose={() => setAVerRececoes(null)}
          onSuccess={recarregar}
        />
      )}

      {mostrarSugestao && (
        <SugestaoComprasModal
          onClose={() => setMostrarSugestao(false)}
          onCriarPedido={daSugestaoParaPedido}
        />
      )}

      {aCriar && (
        <CriarPedidoModal
          linhasIniciais={aCriar.linhas}
          fornecedorIdInicial={aCriar.fornecedorId}
          onClose={() => setACriar(null)}
          onCreated={recarregar}
        />
      )}
    </div>
  );
}

// ── A lista de pedidos ───────────────────────────────────────────────────────

function ListaDePedidos({
  pedidos,
  isLoading,
  onClicar,
  onVerRececoes,
  onSubmeter,
  onDecidir,
  onEnviar,
  onConfirmar,
  onExpedir,
  aSubmeter,
}: {
  pedidos: PurchaseOrder[];
  isLoading: boolean;
  onClicar: (p: PurchaseOrder) => void;
  onVerRececoes: (p: PurchaseOrder) => void;
  onSubmeter: (p: PurchaseOrder) => void;
  onDecidir: (p: PurchaseOrder) => void;
  onEnviar: (p: PurchaseOrder) => void;
  onConfirmar: (p: PurchaseOrder) => void;
  onExpedir: (p: PurchaseOrder) => void;
  /** O id do pedido a ser submetido, para desactivar só esse botão. */
  aSubmeter: string | null;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        A carregar pedidos...
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="py-16 text-center">
        <ShoppingCart className="mx-auto mb-3 h-12 w-12 text-slate-300" />
        <p className="text-sm font-medium text-slate-700">Ainda não há pedidos de compra.</p>
        <p className="mt-1 text-sm text-slate-500">
          Use a sugestão de compras para saber o que repor, ou crie um pedido directamente.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-2.5 font-medium">Pedido</th>
            <th className="px-3 py-2.5 font-medium">Fornecedor</th>
            <th className="hidden px-3 py-2.5 font-medium sm:table-cell">Data</th>
            <th className="hidden px-3 py-2.5 text-right font-medium md:table-cell">Linhas</th>
            <th className="hidden px-3 py-2.5 text-right font-medium md:table-cell">Valor</th>
            <th className="px-3 py-2.5 font-medium">Estado</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {pedidos.map((p) => {
            // O total sai dos itens, que a listagem não inclui — mostra-se «—» em vez
            // de zero, que se leria como um pedido sem valor.
            const total = p.itens?.reduce(
              (soma, i) => soma + i.quantidadePedida * i.custoUnitario - (i.desconto ?? 0),
              0,
            );

            // Passa a olhar para os eixos e não para a projecção.
            //
            // `estado` perde informação: uma ordem por aprovar e uma rejeitada aparecem
            // as duas como RASCUNHO. Com a regra antiga, um pedido novo — que nasce em
            // rascunho — nunca mostrava o botão de dar entrada, e não havia por onde o
            // fazer avançar. As compras ficavam bloqueadas.
            const recebivel = podeReceberMercadoria(p);
            const submetivel = podeSubmeter(p);
            const decidivel = podeDecidir(p);
            const confirmavel = podeConfirmar(p);
            const enviavel = podeEnviar(p);

            return (
              <tr key={p.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <button
                    onClick={() => onClicar(p)}
                    className="font-mono text-xs text-slate-600 hover:text-blue-600 hover:underline"
                  >
                    #{p.id.slice(0, 8)}
                  </button>
                </td>
                <td className="px-3 py-3 font-medium text-slate-900">
                  {p.fornecedor?.nome ?? '—'}
                </td>
                <td className="hidden px-3 py-3 text-slate-500 sm:table-cell">
                  {new Date(p.dataPedido).toLocaleDateString('pt-MZ', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="hidden px-3 py-3 text-right text-slate-500 md:table-cell">
                  {p.itens?.length ?? '—'}
                </td>
                <td className="hidden px-3 py-3 text-right text-slate-700 md:table-cell">
                  {total !== undefined ? moeda(total) : '—'}
                </td>
                <td className="px-3 py-3">
                  <EstadoBadge pedido={p} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {submetivel && (
                      <button
                        onClick={() => onSubmeter(p)}
                        disabled={aSubmeter === p.id}
                        title="Submeter para aprovação"
                        className="p-2 text-slate-400 transition-colors hover:text-indigo-600 disabled:opacity-40"
                      >
                        {aSubmeter === p.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Send size={16} />
                        )}
                      </button>
                    )}
                    {decidivel && (
                      <button
                        onClick={() => onDecidir(p)}
                        title="Aprovar ou rejeitar"
                        className="p-2 text-amber-500 transition-colors hover:text-amber-700"
                      >
                        <Gavel size={16} />
                      </button>
                    )}
                    {recebivel && (
                      <button
                        onClick={() => onExpedir(p)}
                        title="Registar o que o fornecedor expediu"
                        className="p-2 text-slate-400 transition-colors hover:text-indigo-600"
                      >
                        <Truck size={16} />
                      </button>
                    )}
                    {enviavel && (
                      <button
                        onClick={() => onEnviar(p)}
                        disabled={aSubmeter === p.id}
                        title="Marcar como enviada ao fornecedor"
                        className="p-2 text-blue-500 transition-colors hover:text-blue-700 disabled:opacity-40"
                      >
                        {aSubmeter === p.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Send size={16} />
                        )}
                      </button>
                    )}
                    {confirmavel && (
                      <button
                        onClick={() => onConfirmar(p)}
                        title="Registar resposta do fornecedor"
                        className="p-2 text-slate-400 transition-colors hover:text-blue-600"
                      >
                        <MessageSquare size={16} />
                      </button>
                    )}
                    {recebivel && (
                      <button
                        onClick={() => onClicar(p)}
                        title="Dar entrada de mercadoria"
                        className="p-2 text-slate-400 transition-colors hover:text-emerald-600"
                      >
                        <PackageCheck size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => onVerRececoes(p)}
                      title="Ver recepções"
                      className="p-2 text-slate-400 transition-colors hover:text-blue-600"
                    >
                      <Truck size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * O estado do pedido, em palavras que dizem o que fazer a seguir.
 *
 * ## Porque não mostra `estado`
 *
 * A projecção junta coisas que precisam de acções diferentes. «Por aprovar», «rejeitada» e
 * «por submeter» aparecem lá as três como RASCUNHO — e quem olha para a lista não fica a
 * saber se tem de carregar num botão, se tem de esperar por alguém, ou se tem de corrigir
 * o pedido.
 *
 * Os eixos respondem a isso. Ordens anteriores à governação não os têm, e nesse caso
 * mostra-se a projecção, que é o que o ecrã sempre mostrou.
 */
function EstadoBadge({ pedido }: { pedido: PurchaseOrder }) {
  const { rotulo, cor } = rotularEstado(pedido);

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
          cor,
        )}
      >
        {rotulo}
      </span>
      {pedido.sodExcepcao && (
        <span
          title="Aprovada por quem a criou — excepção de segregação de funções"
          className="text-amber-500"
        >
          <UserCheck size={13} />
        </span>
      )}
    </div>
  );
}

function rotularEstado(p: PurchaseOrder): { rotulo: string; cor: string } {
  if (p.cancelamento === 'CANCELADA') {
    return { rotulo: 'Cancelada', cor: 'bg-rose-100 text-rose-700' };
  }

  // Sem eixos, é uma ordem anterior à governação: mostra-se o que sempre se mostrou.
  if (!p.estadoAprovacao) {
    const cores: Record<string, string> = {
      RASCUNHO: 'bg-slate-100 text-slate-700',
      ENVIADO: 'bg-blue-100 text-blue-700',
      PENDENTE: 'bg-amber-100 text-amber-800',
      PARCIAL: 'bg-amber-100 text-amber-800',
      RECEBIDO: 'bg-emerald-100 text-emerald-700',
      CANCELADO: 'bg-rose-100 text-rose-700',
    };
    return { rotulo: p.estado, cor: cores[p.estado] ?? 'bg-slate-100 text-slate-700' };
  }

  // A aprovação vem primeiro: enquanto não estiver resolvida, o resto não acontece.
  if (p.estadoAprovacao === EstadoAprovacaoOC.RASCUNHO) {
    return { rotulo: 'Por submeter', cor: 'bg-slate-100 text-slate-700' };
  }
  if (p.estadoAprovacao === EstadoAprovacaoOC.AGUARDA_APROVACAO) {
    return { rotulo: 'Por aprovar', cor: 'bg-amber-100 text-amber-800' };
  }
  if (p.estadoAprovacao === EstadoAprovacaoOC.REJEITADA) {
    return { rotulo: 'Rejeitada', cor: 'bg-rose-100 text-rose-700' };
  }

  // Aprovada. O que interessa agora é o que já veio, e só depois o que foi combinado.
  if (p.estadoCumprimento === 'TOTALMENTE_RECEBIDA' || p.estadoCumprimento === 'ENCERRADA') {
    return { rotulo: 'Recebida', cor: 'bg-emerald-100 text-emerald-700' };
  }
  if (p.estadoCumprimento === 'PARCIALMENTE_RECEBIDA') {
    return { rotulo: 'Parcial', cor: 'bg-amber-100 text-amber-800' };
  }

  if (p.estadoComercial === 'PARCIALMENTE_CONFIRMADA') {
    return { rotulo: 'Confirmada em parte', cor: 'bg-amber-100 text-amber-800' };
  }
  if (p.estadoComercial === 'RECUSADA') {
    return { rotulo: 'Recusada pelo fornecedor', cor: 'bg-rose-100 text-rose-700' };
  }
  if (p.estadoComercial === 'ACEITE' || p.estadoComercial === 'ACEITE_COM_ALTERACOES') {
    return { rotulo: 'A aguardar entrega', cor: 'bg-blue-100 text-blue-700' };
  }
  if (p.estadoComercial === 'ENVIADA' || p.estadoComercial === 'AGUARDA_RESPOSTA') {
    return { rotulo: 'Sem resposta', cor: 'bg-blue-100 text-blue-700' };
  }

  // Aprovada e ainda por enviar. O rótulo diz o passo que falta, e não o estado em que
  // está — «Aprovada» sozinho não diz a ninguém que ainda há uma acção pendente.
  if (p.estadoComercial === 'NAO_ENVIADA') {
    return { rotulo: 'Por enviar', cor: 'bg-emerald-100 text-emerald-700' };
  }

  return { rotulo: 'Aprovada', cor: 'bg-emerald-100 text-emerald-700' };
}
