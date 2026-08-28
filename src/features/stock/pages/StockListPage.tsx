import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  type ColumnDef,
  type VisibilityState,
} from '@tanstack/react-table';
import {
  Package,
  Boxes,
  ArrowRightLeft,
  Plus,
  Minus,
  FileText,
  BarChart3,
  ClipboardList,
  Clock,
  ArrowUp,
  ArrowDown,
  Settings2,
  HeartPulse,
  CalendarClock,
  Timer,
  ShieldQuestion,
  Lock,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStockList, useAllMovements } from '@/features/stock';
import { useSocket, useBreakpoint } from '@/shared/hooks';
import { ResponsiveTable, Button, Tabs, type TabDefinition } from '@/shared/ui';
import { MovementModals } from '../components/MovementModals';
import { InventoryTab } from '../components/InventoryTab';
import { SaudeStockTab } from '../components/SaudeStockTab';
import { ValidadeTab } from '../components/ValidadeTab';
import { ReservasTab } from '../components/ReservasTab';
import { RetencaoModal, type TipoRetencao } from '../components/RetencaoModal';
import { ProductsTab } from '@/features/produtos/components/ProductsTab';
import type { Stock, StockMovement } from '@/features/stock';

// ──â”€ Tab definition ──────────────────────────────────────────────────────────â”€
type StockTab = 'produtos' | 'estoque' | 'reservas' | 'saude' | 'validade' | 'movimentos' | 'inventario';

// «Produtos» é a lista do que se vende (nome, preço, IVA); «Stock» são as quantidades
// por armazém. Vem primeiro o produto: é por onde se começa, e as quantidades só
// existem depois de haver produtos.
const TABS: TabDefinition<StockTab>[] = [
  { id: 'produtos', label: 'Produtos', icon: Boxes },
  { id: 'estoque', label: 'Stock', icon: Package },
  { id: 'reservas', label: 'Reservas', icon: Timer },
  { id: 'saude', label: 'Saúde do stock', icon: HeartPulse },
  { id: 'validade', label: 'Validades', icon: CalendarClock },
  { id: 'movimentos', label: 'Movimentos', icon: BarChart3 },
  { id: 'inventario', label: 'Balanço / Inventário', icon: ClipboardList },
];

// ──â”€ Column helper tipado ──────────────────────────────────────────────────────
const stockColumnHelper = createColumnHelper<Stock>();
const movementColumnHelper = createColumnHelper<StockMovement>();

// ──â”€ Modal state type ────────────────────────────────────────────────────────â”€
type ModalType = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUST_PLUS' | 'ADJUST_MINUS' | null;

interface ModalState {
  isOpen: boolean;
  stockId: string | null;
  type: ModalType;
  /**
   * O produto da linha, para a transferência poder oferecer os armazéns onde ele existe.
   *
   * Sem isto, o modal pedia o **UUID do stock de destino escrito à mão** — ninguém sabe
   * um UUID de cor, pelo que o botão de transferir era decorativo.
   */
  produtoId: string | null;
  /** Nome do armazém de origem, para o modal dizer de onde sai a mercadoria. */
  armazemOrigem: string | null;
}

// ──â”€ Aba: Estoque Atual ──────────────────────────────────────────────────────â”€
function StockCurrentTab() {
  const [page, setPage] = useState(1);

  /**
   * Mostrar as posições a zero.
   *
   * Desligado por omissão. Criar um produto abre uma posição em **todos** os armazéns
   * da empresa, pelo que a maioria fica a zero — e o mesmo produto aparecia várias
   * vezes na lista, o que parecia duplicação de dados. Não era: eram armazéns
   * diferentes, e a tabela não tinha coluna que o dissesse.
   *
   * As posições a zero **com mínimo definido** aparecem sempre, ligado ou desligado:
   * são casos de ruptura, o mais importante de ver.
   */
  const [incluirSemSaldo, setIncluirSemSaldo] = useState(false);

  /**
   * Só o que está abaixo do mínimo — o filtro que o cartão do painel abre.
   *
   * Vive no URL, e não em estado local, por três razões: o painel pode ligá-lo com
   * uma ligação simples, a página recarregada mantém o filtro, e o endereço pode ser
   * partilhado com quem tem de tratar da reposição.
   */
  const [parametros, setParametros] = useSearchParams();
  const apenasStockBaixo = parametros.get('stockBaixo') === 'true';

  const limparFiltroDeStockBaixo = () => {
    const seguintes = new URLSearchParams(parametros);
    seguintes.delete('stockBaixo');
    setParametros(seguintes, { replace: true });
    setPage(1);
  };

  const { data, isLoading } = useStockList({
    page,
    limit: 10,
    incluirSemSaldo,
    // Só vai no pedido quando está ligado: um `false` explícito sujaria o URL e a
    // chave da cache sem mudar o resultado.
    apenasStockBaixo: apenasStockBaixo || undefined,
  });

  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    stockId: null,
    type: null,
    produtoId: null,
    armazemOrigem: null,
  });

  const stocks = data?.data ?? [];
  const totalPages = data?.lastPage ?? 1;

  const openModal = (
    stockId: string,
    type: ModalType,
    produtoId?: string,
    armazemOrigem?: string,
  ) =>
    setModalState({
      isOpen: true,
      stockId,
      type,
      produtoId: produtoId ?? null,
      armazemOrigem: armazemOrigem ?? null,
    });

  const closeModal = () =>
    setModalState({
      isOpen: false,
      stockId: null,
      type: null,
      produtoId: null,
      armazemOrigem: null,
    });

  /**
   * Estado do modal de retenção, separado do de movimentos.
   *
   * Podia ser mais um valor no `ModalType`, mas as duas famílias não são a mesma coisa: os
   * movimentos alteram o saldo físico e aparecem no extracto; as retenções alteram o que o
   * saldo oferece e não aparecem. Um só estado obrigaria cada modal a ignorar os campos do
   * outro, e é assim que um `produtoId` acaba passado a uma operação que não o usa.
   *
   * Guarda a posição inteira e não só o id: o modal mostra o disponível actual, porque
   * comprometer mercadoria é uma decisão que se toma contra um número — e obrigar quem decide
   * a fechar o modal para o ir ver é como se pede um erro.
   */
  const [retencao, setRetencao] = useState<{
    stockId: string | null;
    tipo: TipoRetencao | null;
    posicao: Stock | null;
  }>({ stockId: null, tipo: null, posicao: null });

  const abrirRetencao = (stockId: string, tipo: TipoRetencao, posicao: Stock) =>
    setRetencao({ stockId, tipo, posicao });

  const fecharRetencao = () => setRetencao({ stockId: null, tipo: null, posicao: null });

  const columns = useMemo<ColumnDef<Stock, any>[]>(
    () => [
      stockColumnHelper.accessor('product', {
        id: 'produto',
        header: 'Produto',
        cell: ({ row }) => {
          const stock = row.original;
          return (
            <div className="flex items-center gap-3">
              {stock.product?.imagemUrl ? (
                <img
                  src={stock.product.imagemUrl}
                  alt={stock.product.nome}
                  className="w-10 h-10 rounded-lg bg-slate-100 object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Package className="h-5 w-5 text-slate-400" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">
                  {stock.product?.nome ?? 'Produto Desconhecido'}
                </p>
                <p className="text-xs text-slate-500">
                  Cód: {stock.product?.codigoBarras ?? 'N/A'}
                </p>
              </div>
            </div>
          );
        },
      }),

      // Sem esta coluna, duas linhas do mesmo produto pareciam um registo duplicado —
      // e eram posições em armazéns diferentes. O dado vinha do backend
      // (`include: { armazem: true }`) e era descartado.
      stockColumnHelper.display({
        id: 'armazem',
        header: 'Armazém',
        cell: ({ row }) => {
          const armazem = row.original.armazem;

          if (!armazem) return <span className="text-xs text-slate-400">—</span>;

          const ePontoDeVenda = armazem.tipo?.toUpperCase() === 'VENDA';

          return (
            <div className="min-w-[110px]">
              <p className="text-sm text-slate-700">{armazem.nome}</p>
              {ePontoDeVenda && (
                <p className="text-xs text-blue-600">ponto de venda</p>
              )}
            </div>
          );
        },
      }),

      stockColumnHelper.accessor('currentQuantity', {
        id: 'balanco',
        // «Disponível» e não «Balanço Atual»: desde que a verificação de disponibilidade
        // existe no abate, é este o número que decide se uma venda passa. O físico continua
        // visível na linha de baixo quando os dois divergem.
        header: 'Disponível',
        cell: ({ row }) => {
          const { currentQuantity, product, abaixoDoMinimo, estados } = row.original;
          // A mesma regra do painel, calculada no servidor. Ver `getRowStatus`.
          const isCritical = !!abaixoDoMinimo;
          const unidade = product?.unidadeMedida ?? 'UN';

          // Parte do saldo pode estar comprometida — reservada, em quarentena ou bloqueada.
          // Nesse caso o número grande passa a ser o **disponível**, porque é esse que decide
          // se uma venda passa. Mostrar só o físico faria o ecrã contradizer o POS.
          const comprometido = estados
            ? estados.reservado + estados.quarentena + estados.bloqueado
            : 0;
          const temComprometido = comprometido > 0;

          const detalhe = estados
            ? [
                estados.reservado > 0 ? `${estados.reservado} reservadas` : null,
                estados.quarentena > 0 ? `${estados.quarentena} em quarentena` : null,
                estados.bloqueado > 0 ? `${estados.bloqueado} bloqueadas` : null,
              ]
                .filter(Boolean)
                .join(' · ')
            : '';

          return (
            <div className="flex flex-col items-start gap-1">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                  isCritical ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}
                title={temComprometido ? `${currentQuantity} ${unidade} em armazém` : undefined}
              >
                {temComprometido && estados ? estados.disponivel : currentQuantity}
                <span className="ml-1 text-xs opacity-75">{unidade}</span>
              </span>

              {temComprometido && estados && (
                <span className="text-[11px] leading-tight text-slate-500">
                  {estados.fisico} em armazém · {detalhe}
                </span>
              )}

              {/* Não devia acontecer, e por isso aparece em vez de ficar escondido: uma
                  reserva ou retenção sobreviveu a uma saída de mercadoria. */}
              {estados?.inconsistente && (
                <span className="text-[11px] font-medium leading-tight text-amber-700">
                  Comprometido excede o saldo em armazém — verificar
                </span>
              )}
            </div>
          );
        },
      }),

      stockColumnHelper.accessor('minQuantity', {
        id: 'minimo',
        header: 'MÍnimo',
        cell: ({ getValue }) => (
          <span className="text-slate-500 text-sm">{getValue()}</span>
        ),
      }),

      stockColumnHelper.display({
        id: 'acoes',
        header: 'Ações',
        cell: ({ row }) => {
          const { id, product, armazem } = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <Link
                to={`/stock/${id}`}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Ver Ledger / Histórico"
              >
                <FileText className="h-4 w-4" />
              </Link>

              <div className="w-px h-6 bg-slate-200 mx-1" />

              <Button
                variant="success"
                size="sm"
                onClick={() => openModal(id, 'IN')}
                className="gap-1"
              >
                <Plus className="h-3 w-3" /> IN
              </Button>

              <Button
                variant="warning"
                size="sm"
                onClick={() => openModal(id, 'OUT')}
                className="gap-1"
              >
                <Minus className="h-3 w-3" /> OUT
              </Button>

              <div className="relative group inline-block">
                <Button variant="ghost" size="icon" title="Mais opções">
                  <ArrowRightLeft className="h-4 w-4" />
                </Button>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 shadow-xl rounded-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={() => openModal(id, 'TRANSFER', product?.id, armazem?.nome)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    Transferir para Armazém
                  </button>
                  <div className="h-px bg-slate-100 my-1" />
                  <button
                    onClick={() => openModal(id, 'ADJUST_PLUS')}
                    className="w-full text-left px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 rounded-lg"
                  >
                    Ajuste + (Sobra)
                  </button>
                  <button
                    onClick={() => openModal(id, 'ADJUST_MINUS')}
                    className="w-full text-left px-3 py-2 text-sm text-rose-700 hover:bg-rose-50 rounded-lg"
                  >
                    Ajuste - (Quebra)
                  </button>

                  {/* Retenções: mexem no que o stock oferece sem mexer no que tem. Ficam
                      separadas dos ajustes por uma linha, porque não são movimentos — a
                      mercadoria não sai, e nenhuma destas operações aparece no extracto. */}
                  <div className="h-px bg-slate-100 my-1" />

                  <button
                    onClick={() => abrirRetencao(id, 'RESERVAR', row.original)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-blue-700 hover:bg-blue-50"
                  >
                    <Timer className="h-3.5 w-3.5" />
                    Reservar
                  </button>
                  <button
                    onClick={() => abrirRetencao(id, 'QUARENTENA', row.original)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-amber-700 hover:bg-amber-50"
                  >
                    <ShieldQuestion className="h-3.5 w-3.5" />
                    Reter em quarentena
                  </button>
                  <button
                    onClick={() => abrirRetencao(id, 'BLOQUEIO', row.original)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Bloquear
                  </button>
                </div>
              </div>
            </div>
          );
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Ver a nota em `ProductsTab`: `window.innerWidth` não reage à rotação do
  // aparelho, e é neste ecrã que isso mais se nota — o stock mínimo é a coluna
  // que decide se há de repor, e ficava escondida em paisagem.
  const cabeMinimo = useBreakpoint('sm');

  const columnVisibility: VisibilityState = {
    minimo: cabeMinimo,
  };

  const table = useReactTable({
    data: stocks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { columnVisibility },
    manualPagination: true,
    pageCount: totalPages,
  });

  /**
   * A cor da linha.
   *
   * `abaixoDoMinimo` vem calculado do servidor, pela mesma regra que o indicador do
   * painel usa. Antes decidia-se aqui com `currentQuantity <= minQuantity`, o que
   * pintava de vermelho toda a posição vazia **sem mínimo definido** — porque
   * `0 <= 0` — e a tabela contradizia o número do painel.
   */
  const getRowStatus = (stock: Stock): 'default' | 'critical' | 'warning' => {
    if (stock.abaixoDoMinimo) return 'critical';

    // O aviso só faz sentido havendo mínimo: sem ele, `minQuantity * 1.5` é zero e
    // qualquer posição vazia ficaria amarela.
    if (stock.minQuantity > 0 && stock.currentQuantity <= stock.minQuantity * 1.5) {
      return 'warning';
    }
    return 'default';
  };

  return (
    <>
      {/* Uma lista filtrada tem de dizer que está filtrada. Sem isto, quem chega aqui
          pelo cartão do painel vê uma tabela curta e conclui que perdeu registos. */}
      {apenasStockBaixo && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-900">
            A mostrar só as posições abaixo do mínimo definido.
          </p>
          <button
            type="button"
            onClick={limparFiltroDeStockBaixo}
            className="text-sm font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-700"
          >
            Ver todo o stock
          </button>
        </div>
      )}

      {/* O interruptor das posições a zero. Ver a nota em `incluirSemSaldo`: sem este
          filtro, o mesmo produto aparecia uma vez por armazém — a maioria a zero — e
          parecia duplicação de dados. */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={incluirSemSaldo}
            onChange={(e) => {
              setIncluirSemSaldo(e.target.checked);
              // A contagem de páginas muda com o filtro: sem voltar ao início, a
              // página 4 de uma lista que passou a ter 2 apareceria vazia.
              setPage(1);
            }}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Mostrar produtos sem stock
        </label>

        {!incluirSemSaldo && (
          <p className="text-xs text-slate-400">
            As posições a zero estão escondidas, excepto as que têm mínimo definido.
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <ResponsiveTable
          table={table}
          isLoading={isLoading}
          emptyMessage={
            apenasStockBaixo
              ? 'Nenhum produto abaixo do mínimo definido. Está tudo reposto.'
              : incluirSemSaldo
              ? 'Nenhum stock encontrado.'
              : 'Nenhum produto com stock. Ligue «mostrar produtos sem stock» para ver as posições a zero.'
          }
          getRowStatus={getRowStatus}
        />

        {!isLoading && stocks.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
            <span className="text-slate-500">
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>

      {modalState.isOpen && (
        <MovementModals
          stockId={modalState.stockId}
          type={modalState.type}
          produtoId={modalState.produtoId}
          armazemOrigem={modalState.armazemOrigem}
          onClose={closeModal}
        />
      )}

      {/* Fora do condicional do outro modal, de propósito: são estados independentes, e o
          próprio componente devolve `null` quando não tem `stockId` nem `tipo`. */}
      <RetencaoModal
        stockId={retencao.stockId}
        tipo={retencao.tipo}
        produtoNome={retencao.posicao?.product?.nome ?? null}
        estados={retencao.posicao?.estados}
        unidade={retencao.posicao?.product?.unidadeMedida ?? 'UN'}
        onClose={fecharRetencao}
      />
    </>
  );
}

// ──â”€ Aba: Movimentos ──────────────────────────────────────────────────────────
function MovementsTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAllMovements({ page, limit: 15 });

  const movements = data?.data ?? [];
  const totalPages = data?.lastPage ?? 1;

  const TYPE_STYLES: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
    IN: { label: 'Entrada', icon: <ArrowUp className="h-3 w-3" />, cls: 'bg-emerald-100 text-emerald-700' },
    OUT: { label: 'SaÍda', icon: <ArrowDown className="h-3 w-3" />, cls: 'bg-rose-100 text-rose-700' },
    ADJUSTMENT: { label: 'Ajuste', icon: <Settings2 className="h-3 w-3" />, cls: 'bg-amber-100 text-amber-700' },
  };

  const columns = useMemo<ColumnDef<StockMovement, any>[]>(
    () => [
      movementColumnHelper.accessor('createdAt', {
        header: 'Data/Hora',
        cell: ({ getValue }) => (
          <span className="text-xs text-slate-500 tabular-nums">
            {new Date(getValue()).toLocaleString('pt-MZ', {
              day: '2-digit', month: '2-digit', year: '2-digit',
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
        ),
      }),
      // Sem esta coluna, o histórico geral mostrava «Entrada +1000» sem dizer de que
      // produto — a informação vinha do backend (`stock.product`) e era descartada.
      // Num histórico geral, é a primeira coisa que se quer saber.
      movementColumnHelper.display({
        id: 'produto',
        header: 'Produto',
        cell: ({ row }) => {
          const { stock, stockId } = row.original;
          const produto = stock?.product;

          return (
            <div className="min-w-[140px]">
              {produto ? (
                <Link
                  to={`/stock/${stockId}`}
                  className="text-sm font-medium text-slate-900 hover:text-blue-600 hover:underline"
                >
                  {produto.nome}
                </Link>
              ) : (
                <span className="text-sm text-slate-400">Produto removido</span>
              )}
              {stock?.armazem?.nome && (
                <p className="text-xs text-slate-400">{stock.armazem.nome}</p>
              )}
            </div>
          );
        },
      }),
      movementColumnHelper.accessor('type', {
        header: 'Tipo',
        cell: ({ getValue }) => {
          const type = getValue() as string;
          const config = TYPE_STYLES[type] ?? { label: type, icon: null, cls: 'bg-slate-100 text-slate-600' };
          return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${config.cls}`}>
              {config.icon}
              {config.label}
            </span>
          );
        },
      }),
      movementColumnHelper.accessor('quantity', {
        header: 'Qtd',
        cell: ({ row }) => {
          const { quantity, type } = row.original;
          const signed = type === 'OUT' ? -quantity : quantity;
          return (
            <span className={`font-bold tabular-nums text-sm ${signed < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {signed > 0 ? '+' : ''}{signed}
            </span>
          );
        },
      }),
      movementColumnHelper.accessor('balanceAfter', {
        header: 'Saldo Após',
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm text-slate-700">{getValue()}</span>
        ),
      }),
      // Quem fez o movimento. O backend enviava-o desde sempre, mas o tipo do frontend
      // declarava `user.nome` e o backend devolve `user.name` — pelo que o valor era
      // sempre `undefined`. Um ajuste de stock sem autor não se pode contestar.
      movementColumnHelper.display({
        id: 'operador',
        header: 'Por',
        cell: ({ row }) => {
          const autor = row.original.user;

          return autor?.name ? (
            <span className="text-xs text-slate-600" title={autor.email}>
              {autor.name}
            </span>
          ) : (
            <span className="text-xs text-slate-400">Sistema</span>
          );
        },
      }),
      movementColumnHelper.accessor('reason', {
        header: 'Motivo',
        cell: ({ getValue }) => (
          <span className="text-xs text-slate-500 truncate max-w-[200px] block" title={getValue() ?? ''}>
            {getValue() ?? '—'}
          </span>
        ),
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const table = useReactTable({
    data: movements,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <Clock className="h-4 w-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-600">Histórico de Movimentos</span>
      </div>
      <ResponsiveTable
        table={table}
        isLoading={isLoading}
        emptyMessage="Nenhum movimento registado."
      />
      {!isLoading && movements.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
          <span className="text-slate-500">Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ──â”€ Página Principal ────────────────────────────────────────────────────────â”€
/**
 * A secção Stock, com o catálogo de produtos como primeiro separador.
 *
 * O separador activo vive no URL (`?tab=produtos`) e não apenas no estado local, por
 * três razões: a rota `/produtos` redirecciona para cá e precisa de dizer para onde;
 * um link partilhado abre no separador certo; e o botão «voltar» do browser funciona
 * entre separadores. É a primeira tab-bar do projecto a fazê-lo — as outras oito
 * guardam o estado só em memória.
 */
export function StockListPage() {
  useSocket();
  const [searchParams, setSearchParams] = useSearchParams();

  const doUrl = searchParams.get('tab');
  const activeTab: StockTab = TABS.some((t) => t.id === doUrl) ? (doUrl as StockTab) : 'produtos';

  const mudarTab = (id: StockTab) => {
    // `replace` para não encher o histórico: dez cliques em separadores exigiriam dez
    // «voltar» para sair da página.
    setSearchParams({ tab: id }, { replace: true });
  };

  return (
    <div className="space-y-6">

      {/* ──â”€ Tabs ────────────────────────────────────────────────────────────â”€ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <Tabs tabs={TABS} active={activeTab} onChange={mudarTab} label="Produtos e stock" className="px-4" />

        <div className="p-4 sm:p-6">
          {activeTab === 'produtos' && <ProductsTab />}
          {activeTab === 'estoque' && <StockCurrentTab />}
          {activeTab === 'reservas' && <ReservasTab />}
          {activeTab === 'saude' && <SaudeStockTab />}
          {activeTab === 'validade' && <ValidadeTab />}
          {activeTab === 'movimentos' && <MovementsTab />}
          {activeTab === 'inventario' && <InventoryTab />}
        </div>
      </div>
    </div>
  );
}
