import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, RefreshCcw, CheckCircle, X, Lock, Store, History, ScanLine, ArrowLeft, ChevronUp } from 'lucide-react';
import { useProducts, useCategories, catalogApi } from '@/features/produtos';
import { usePosStore, getStockDisponivel } from '@/features/vendas';
import type { CartResult } from '@/features/vendas';
import { useSocket, useBreakpoint } from '@/shared/hooks';
import { useProcessarVenda } from '@/features/vendas';
import { useMinhaSessao, useCaixasDisponiveis, useAbrirSessao, useFecharSessao, useRegistrarSangria, useRegistrarReforco } from '@/features/vendas';
import toast from 'react-hot-toast';
import type { Product } from '@/features/produtos';
import { CaixasHistoricoPage } from './CaixasHistoricoPage';
import { ReceiptModal } from '../components/ReceiptModal';
import { LeitorCameraModal } from '../components/LeitorCameraModal';
import { cn } from '@/shared/utils';

const PAYMENT_METHODS = [
  { id: 'NUMERARIO', label: 'Dinheiro', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsFeCw1djwQQKwWwfUumIzkWdxlA_jwAhf1ZkyObf0mA&s=10' },
  { id: 'CARTAO', label: 'Cartão', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQ0ko6JsLO520Wgror8-itm1AxkriH7hIXYlGTtxAUxA&s=10' },
  { id: 'MPESA', label: 'M-Pesa', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuVGSOSpXTlLYNFnoBgJbrad3KiF3UhfJwh6NZvmDcMA&s=10' },
  { id: 'EMOLA', label: 'e-Mola', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTWArdpolsdD7Hcb0-MsWf4R2PtrceSQTA5HF3wpIkfNw&s=10' }
] as const;

// Hook de Debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function POSPage() {
  useSocket();

  const {
    searchTerm, setSearchTerm,
    selectedCategoryId, setSelectedCategory,
    cartItems, addItem, removeItem, updateQuantity, clearCart,
    descontoGlobal, getTotal
  } = usePosStore();

  // O store é a fonte única do total: aplica descontos de linha e desconto global,
  // que este ecrã antes ignorava ao recalcular por si.
  const total = getTotal();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: categoriesData } = useCategories();
  const { data: productsData, isLoading: isLoadingProducts } = useProducts({ 
    search: debouncedSearchTerm, 
    categoryId: selectedCategoryId || undefined,
    limit: 50
  });

  const products = productsData?.data || [];
  const categories = categoriesData || [];

  // Estado de Checkout
  const [pagamentos, setPagamentos] = useState<{metodo: any, valorEntregue: number}[]>([]);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<typeof PAYMENT_METHODS[number]['id']>('NUMERARIO');
  const [currentAmountPaid, setCurrentAmountPaid] = useState<number>(0);
  
  // Abas do painel principal (Catálogo vs Histórico)
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'HISTORY'>('CATALOG');

  const [receiptData, setReceiptData] = useState<any>(null);

  // Estado da Sessão de Caixa
  const [hasSession, setHasSession] = useState<boolean>(true);
  const [showOpenSessionModal, setShowOpenSessionModal] = useState<boolean>(false);
  const [caixas, setCaixas] = useState<any[]>([]);
  const [selectedCaixaId, setSelectedCaixaId] = useState<string>('');
  const [saldoInicial, setSaldoInicial] = useState<number>(0);


  // Estado para Fechar Sessão
  const [showCloseSessionModal, setShowCloseSessionModal] = useState<boolean>(false);
  const [showSangriaModal, setShowSangriaModal] = useState<boolean>(false);
  const [showReforcoModal, setShowReforcoModal] = useState<boolean>(false);
  const [movimentoValor, setMovimentoValor] = useState<number>(0);
  const [movimentoMotivo, setMovimentoMotivo] = useState<string>('');
  const [saldoDeclarado, setSaldoDeclarado] = useState<number>(0);
  const [observacoesClose, setObservacoesClose] = useState('');

  const [currentSessaoId, setCurrentSessaoId] = useState<string | null>(null);

  // Esc key handler para fechar o modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showOpenSessionModal) {
        setShowOpenSessionModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showOpenSessionModal]);

  const { data: minhaSessao, isLoading: isSessaoLoading } = useMinhaSessao();
  const { data: caixasDisponiveis } = useCaixasDisponiveis();

  const abrirSessaoMutation = useAbrirSessao();
  const fecharSessaoMutation = useFecharSessao();
  const sangriaMutation = useRegistrarSangria();
  const reforcoMutation = useRegistrarReforco();
  const processarVendaMutation = useProcessarVenda();

  // Verifica a sessão ao montar
  useEffect(() => {
    if (!isSessaoLoading) {
      if (!minhaSessao) {
        setHasSession(false);
        setShowOpenSessionModal(true);
        setCaixas(caixasDisponiveis || []);
        if (caixasDisponiveis && caixasDisponiveis.length > 0) {
          setSelectedCaixaId(caixasDisponiveis[0].id);
        } else {
          setSelectedCaixaId('');
        }
      } else {
        setHasSession(true);
        setCurrentSessaoId(minhaSessao.id);
      }
    }
  }, [minhaSessao, isSessaoLoading, caixasDisponiveis]);

  // Sincroniza o valor a pagar com o total por defeito
  useEffect(() => {
    const totalEntregue = pagamentos.reduce((acc, p) => acc + p.valorEntregue, 0);
    const restante = total - totalEntregue;
    if (restante > 0) {
      setCurrentAmountPaid(restante);
    } else {
      setCurrentAmountPaid(0);
    }
  }, [total, pagamentos]);

  // Declarado antes do ouvinte de teclado, que o consulta para se calar enquanto o
  // leitor da câmara está aberto.
  const [leitorAberto, setLeitorAberto] = useState(false);

  /**
   * O carrinho como painel de baixo, no telemóvel.
   *
   * No computador o carrinho é a coluna da direita e está sempre à vista. Num ecrã de
   * 375 px não cabem 420 px de carrinho e a grelha de produtos ao mesmo tempo, pelo que
   * o carrinho passa a subir de baixo quando o operador o quer ver.
   */
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);

  /** `lg` é onde o carrinho volta a ser coluna fixa e este estado deixa de contar. */
  const ecraGrande = useBreakpoint('lg');

  // ──â”€ Barcode Listener ──────────────────────────────────────────────────â”€
  const barcodeBuffer = useRef('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Com o leitor da câmara aberto, este ouvinte fica calado: senão, escrever a
      // quantidade no painel acrescentaria produtos ao carrinho a cada `Enter`.
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        receiptData ||
        leitorAberto
      ) {
        return;
      }

      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 0) {
          const barcode = barcodeBuffer.current;
          barcodeBuffer.current = '';

          // Procura-se no servidor, não na lista da grelha: essa está filtrada pela
          // pesquisa e limitada a 50 linhas, pelo que um código válido de um produto
          // fora dessa fatia dava «produto não encontrado» — com uma pesquisa activa,
          // falhava quase sempre.
          catalogApi
            .getProductByBarcode(barcode)
            .then((foundProduct) => {
              if (!foundProduct) {
                toast.error('Produto não encontrado.');
                return;
              }

              const r = addItem(foundProduct);
              if (!r.ok) {
                toast.error(
                  r.disponivel > 0
                    ? `${r.nome}: apenas ${r.disponivel} em stock.`
                    : `${r.nome} está esgotado.`,
                );
              }
            })
            .catch(() => {
              toast.error('Não foi possível consultar o produto. Verifique a ligação.');
            });
        }
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          barcodeBuffer.current = '';
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // `products` saiu das dependências: a busca é feita no servidor e já não depende da
    // lista da grelha.
  }, [addItem, receiptData, leitorAberto]);

  // ─── Leitura pela câmara ──────────────────────────────────────────────────

  /**
   * Se este dispositivo tem alguma câmara.
   *
   * `mediaDevices` existe em todos os browsers modernos, incluindo os de máquinas sem
   * câmara nenhuma — pelo que a sua presença não basta. `enumerateDevices` responde pela
   * lista real. Antes de dada a permissão os nomes vêm vazios, mas o `kind` já diz que o
   * dispositivo existe, que é tudo o que aqui se pergunta.
   */
  const [temCamara, setTemCamara] = useState(false);

  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return;

    navigator.mediaDevices
      .enumerateDevices()
      .then((dispositivos) => {
        setTemCamara(dispositivos.some((d) => d.kind === 'videoinput'));
      })
      .catch(() => setTemCamara(false));
  }, []);

  /**
   * Acrescenta ao carrinho o produto lido, na quantidade indicada.
   *
   * Devolve a mensagem de erro, ou `null` se entrou. O leitor usa isso para decidir se
   * limpa o painel: com stock insuficiente, o produto fica à vista para o operador
   * corrigir a quantidade em vez de reler o código.
   */
  const adicionarLido = (produto: Product, quantidade: number): string | null => {
    const r = addItem(produto, quantidade);

    if (!r.ok) {
      const mensagem =
        r.disponivel > 0
          ? `${r.nome}: apenas ${r.disponivel} em stock.`
          : `${r.nome} está esgotado.`;
      toast.error(mensagem);
      return mensagem;
    }

    toast.success(`${quantidade}× ${produto.nome}`);
    return null;
  };

  // ──â”€ Actions ────────────────────────────────────────────────────────────â”€

  /** Avisa o operador quando o carrinho recusa a alteração por falta de stock. */
  const avisarSeRecusado = (resultado: CartResult) => {
    if (!resultado.ok) {
      toast.error(
        resultado.disponivel > 0
          ? `${resultado.nome}: apenas ${resultado.disponivel} em stock.`
          : `${resultado.nome} está esgotado.`,
      );
    }
    return resultado.ok;
  };

  const handleOpenSession = async () => {
    if (!selectedCaixaId) return toast.error('Selecione um caixa.');
    abrirSessaoMutation.mutate(
      { caixaId: selectedCaixaId, saldoInicial },
      {
        onSuccess: (sessao) => {
          setCurrentSessaoId(sessao.id);
          setHasSession(true);
          setShowOpenSessionModal(false);
          toast.custom(() => (
            <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-emerald-500 max-w-sm w-full">
              <div className="flex gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
                <div>
                  <p className="font-bold text-slate-800">Sessão Iniciada</p>
                  <p className="text-sm text-slate-500">Caixa pronto a operar.</p>
                  <div className="mt-2 bg-slate-50 p-2 rounded text-xs font-mono text-slate-600">
                    Data: {new Date().toLocaleString('pt-PT')}<br/>
                    Fundo de Maneio: {saldoInicial.toFixed(2)} MT
                  </div>
                </div>
              </div>
            </div>
          ), { duration: 5000 });
        }
      }
    );
  };

  const handleCloseSession = async () => {
    if (!currentSessaoId) return;
    fecharSessaoMutation.mutate(
      { sessaoId: currentSessaoId, payload: { saldoDeclarado, observacoes: observacoesClose } },
      {
        onSuccess: (result) => {
          toast.custom(() => (
            <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-blue-500 max-w-sm w-full">
              <div className="flex gap-3">
                <CheckCircle className="w-6 h-6 text-blue-500 shrink-0" />
                <div>
                  <p className="font-bold text-slate-800">Sessão Fechada</p>
                  <p className="text-sm text-slate-500">O seu turno foi encerrado.</p>
                  <div className="mt-2 bg-slate-50 p-2 rounded text-xs font-mono text-slate-600 space-y-1">
                    <p>Data: {new Date(result.dataFecho).toLocaleString('pt-PT')}</p>
                    <p>Total Faturado: <span className="font-bold">{(result.saldoFinalCalculado - result.saldoInicial).toFixed(2)} MT</span></p>
                    <p>Saldo Gaveta: <span className="font-bold text-slate-900">{result.saldoFinalCalculado.toFixed(2)} MT</span></p>
                    <p>Saldo Declarado: <span className="font-bold">{result.saldoFinalDeclarado.toFixed(2)} MT</span></p>
                    <p>Quebra/Sobras: <span className={`font-bold ${result.quebra < 0 ? 'text-rose-600' : result.quebra > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>{result.quebra.toFixed(2)} MT</span></p>
                  </div>
                </div>
              </div>
            </div>
          ), { duration: 10000 });
    
          setHasSession(false);
          setShowCloseSessionModal(false);
          setCurrentSessaoId(null);
          setSaldoDeclarado(0);
          setObservacoesClose('');
          // Force user to open a new one if they want
          setShowOpenSessionModal(true);
        }
      }
    );
  };

  const handleSangria = async () => {
    if (!currentSessaoId || movimentoValor <= 0 || !movimentoMotivo) {
      toast.error('Preencha o valor e motivo corretamente.');
      return;
    }
    sangriaMutation.mutate(
      { sessaoId: currentSessaoId, payload: { valor: movimentoValor, motivo: movimentoMotivo } },
      {
        onSuccess: () => {
          setShowSangriaModal(false);
          setMovimentoValor(0);
          setMovimentoMotivo('');
        }
      }
    );
  };

  const handleReforco = async () => {
    if (!currentSessaoId || movimentoValor <= 0 || !movimentoMotivo) {
      toast.error('Preencha o valor e motivo corretamente.');
      return;
    }
    reforcoMutation.mutate(
      { sessaoId: currentSessaoId, payload: { valor: movimentoValor, motivo: movimentoMotivo } },
      {
        onSuccess: () => {
          setShowReforcoModal(false);
          setMovimentoValor(0);
          setMovimentoMotivo('');
        }
      }
    );
  };

  const handleCheckout = async () => {
    if (!hasSession) {
      toast.error('Não tem nenhuma sessão de caixa aberta.');
      setShowOpenSessionModal(true);
      return;
    }
    if (cartItems.length === 0) return;
    const totalEntregue = pagamentos.reduce((acc, p) => acc + p.valorEntregue, 0);
    if (totalEntregue < total) {
      toast.error('O valor entregue total não pode ser inferior ao total.');
      return;
    }

    const payload = {
      itens: cartItems.map(item => ({
        produtoId: item.id,
        quantidade: item.cartQuantity,
        desconto: item.desconto,
      })),
      pagamentos: pagamentos,
      descontoGlobal,
    };

    processarVendaMutation.mutate(payload, {
      onSuccess: (venda) => {
        setReceiptData(venda);
      }
    });
  };

  const handleNewSale = () => {
    clearCart();
    setPagamentos([]);
    setCurrentAmountPaid(0);
    setCurrentPaymentMethod('NUMERARIO');
  };

  const handleCloseReceipt = () => {
    setReceiptData(null);
    handleNewSale();
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      {/* No telemóvel o cabeçalho é comprimido: com o tamanho de computador sobravam
          menos de 200 px dos 667 para os produtos, e não cabia uma linha inteira. O
          subtítulo desaparece — a barra de navegação já diz «Ponto de Venda». */}
      <div className="bg-white border-b border-slate-200 px-4 pt-3 pb-0 shrink-0 sm:px-6 sm:pt-5">
        <div className="flex items-center justify-between gap-2 mb-2 sm:mb-4">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900 sm:text-2xl">Vendas</h1>
            <p className="hidden text-sm text-slate-500 sm:block">Ponto de Venda e Gestão de Caixas</p>
          </div>
          <div className="flex items-center gap-3">
            {hasSession ? (
              <>
                {/* `whitespace-nowrap`: sem isto quebrava em «Sessão / Aberta» e o
                    cabeçalho crescia uma linha no telemóvel. */}
                <span className="whitespace-nowrap rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 sm:px-3 sm:text-sm">
                  Sessão Aberta
                </span>
              </>
            ) : (
              <button 
                onClick={() => setShowOpenSessionModal(true)}
                className="bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                Abrir Sessão
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-1 relative">
          <button
            onClick={() => setActiveTab('CATALOG')}
            className={cn(
              // `whitespace-nowrap`: «Ponto de Venda» quebrava em duas linhas e os
              // separadores ficavam com o dobro da altura.
              'flex items-center gap-2 whitespace-nowrap px-3 py-2.5 text-sm font-medium border-b-2 transition-all duration-150 -mb-px sm:px-4 sm:py-3',
              activeTab === 'CATALOG'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            <Store size={16} />
            Ponto de Venda
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={cn(
              // `whitespace-nowrap`: «Ponto de Venda» quebrava em duas linhas e os
              // separadores ficavam com o dobro da altura.
              'flex items-center gap-2 whitespace-nowrap px-3 py-2.5 text-sm font-medium border-b-2 transition-all duration-150 -mb-px sm:px-4 sm:py-3',
              activeTab === 'HISTORY'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            <History size={16} />
            Histórico de Sessões
          </button>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-200" />
        </div>
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────────â”€ */}
      <div className="flex-1 overflow-hidden relative">
        {/* Tab: Ponto de Venda */}
        {activeTab === 'CATALOG' && (
          // `relative` ancora o carrinho, que abaixo de `lg` é posicionado por cima.
          <div className="relative flex h-full w-full overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden relative">
              
              {/* Search Header */}
              <div className="bg-white p-4 shadow-sm z-10 border-b border-gray-100">
                <div className="relative max-w-2xl mx-auto flex items-center gap-4">
                  <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input 
                      type="text" 
                      placeholder="Pesquisar produtos (Nome, SKU, Cód. Barras)..." 
                      className="w-full pl-12 pr-4 py-3 bg-gray-100/80 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Ler com a câmara. Só aparece onde há câmara: num posto de caixa
                      fixo, um botão que abre e falha é pior do que botão nenhum. */}
                  {temCamara && (
                    <button
                      onClick={() => setLeitorAberto(true)}
                      className="flex shrink-0 items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm shadow-blue-200 transition-colors hover:bg-blue-700"
                      title="Ler código de barras com a câmara"
                    >
                      <ScanLine className="h-5 w-5" />
                      <span className="hidden sm:inline">Ler código</span>
                    </button>
                  )}
              </div>
            </div>
            <div className="bg-white border-b border-gray-100 px-6 py-3 flex gap-3 overflow-x-auto hide-scrollbar shrink-0">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-6 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-all ${
                  selectedCategoryId === null 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todas
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-all ${
                    selectedCategoryId === cat.id 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.nome}
                </button>
              ))}
            </div>

            {/* Product Grid */}
            {/* `pb-24` no telemóvel: a barra do carrinho é sobreposta e taparia a última
                linha de produtos, que ficaria inalcançável no fim da lista. */}
            <div className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 lg:pb-6">
              {isLoadingProducts ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 auto-rows-max">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAdd={() => avisarSeRecusado(addItem(product))}
                    />
                  ))}
                </div>
              )}
            </div>
            </div>

            {/* ──â”€ Cart Sidebar ──â”€
                No computador é a coluna da direita, sempre visível. No telemóvel passa a
                painel que sobe de baixo: 420 px fixos não cabem num ecrã de 375 px, e
                deixavam a grelha de produtos e o botão de leitura fora do ecrã.

                Fica montado nos dois casos — só muda de sítio. Desmontá-lo perderia o
                estado do pagamento a cada vez que o operador voltasse aos produtos. */}
            <div
              className={cn(
                'bg-white shadow-2xl flex flex-col z-20 border-gray-200',
                'lg:w-[420px] lg:border-l lg:shrink-0 lg:relative lg:translate-y-0',
                // Abaixo de lg: painel sobreposto, com transição para o gesto ser legível.
                'absolute inset-x-0 bottom-0 top-0 transition-transform duration-300 lg:transition-none',
                carrinhoAberto ? 'translate-y-0' : 'translate-y-full lg:translate-y-0',
              )}
              // Escondido dos leitores de ecrã quando fechado no telemóvel, para o foco
              // não entrar num painel que não se vê.
              aria-hidden={!carrinhoAberto && !ecraGrande}
            >
        {/* Cart Header */}
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-white p-3 sm:p-5">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 shrink-0">
            {/* Voltar aos produtos, no telemóvel. No computador não é preciso: o
                carrinho e a grelha estão lado a lado. */}
            <button
              onClick={() => setCarrinhoAberto(false)}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden"
              aria-label="Voltar aos produtos"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            <span className="hidden sm:inline">Carrinho</span>
          </h2>
          {/* Deslizável no telemóvel: os três botões de sessão mais o contador não cabem
              em 375 px, e sem isto o «Fechar» ficava cortado no bordo do ecrã. */}
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto hide-scrollbar">
            {hasSession && (
              <>
                <button 
                  onClick={() => setShowSangriaModal(true)}
                  className="bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700 text-xs font-bold px-3 h-11 shrink-0 rounded-lg flex items-center gap-1 transition-colors sm:h-auto sm:py-1.5"
                  title="Sangria (Retirar da Gaveta)"
                >
                  <Minus className="w-3.5 h-3.5" />
                  Sangria
                </button>
                <button 
                  onClick={() => setShowReforcoModal(true)}
                  className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 text-xs font-bold px-3 h-11 shrink-0 rounded-lg flex items-center gap-1 transition-colors sm:h-auto sm:py-1.5"
                  title="Reforço (Colocar na Gaveta)"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Reforço
                </button>
                <button 
                  onClick={() => setShowCloseSessionModal(true)}
                  className="bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 text-xs font-bold px-3 h-11 shrink-0 rounded-lg flex items-center gap-1 transition-colors sm:h-auto sm:py-1.5"
                  title="Fechar Turno / Sessão"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Fechar
                </button>
              </>
            )}
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center">
              {cartItems.length} Itens
            </span>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {cartItems.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="font-medium text-gray-500">O carrinho está vazio.</p>
              <p className="text-sm mt-1">Adicione produtos para iniciar a venda.</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="flex gap-3 bg-white border border-gray-100 p-3 rounded-2xl shadow-sm relative group">
                <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                  {item.imagemUrl ? (
                    <img src={item.imagemUrl} alt={item.nome} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-medium">Sem Img</div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h4 className="text-sm font-bold text-gray-800 line-clamp-1 pr-6">{item.nome}</h4>
                  <p className="text-blue-600 font-extrabold text-sm">{item.precoVenda.toFixed(2)} MT</p>
                  
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200">
                      <button 
                        onClick={() => avisarSeRecusado(updateQuantity(item.id, item.cartQuantity - 1))}
                        className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-bold w-6 text-center text-gray-800">{item.cartQuantity}</span>
                      <button
                        onClick={() => avisarSeRecusado(updateQuantity(item.id, item.cartQuantity + 1))}
                        disabled={item.stockDisponivel !== undefined && item.cartQuantity >= item.stockDisponivel}
                        title={
                          item.stockDisponivel !== undefined && item.cartQuantity >= item.stockDisponivel
                            ? `Apenas ${item.stockDisponivel} em stock`
                            : undefined
                        }
                        className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-gray-600"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    {item.stockDisponivel !== undefined && item.cartQuantity >= item.stockDisponivel && (
                      <span className="text-[10px] font-semibold text-amber-600">
                        Máx. em stock
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => removeItem(item.id)}
                  className="absolute top-3 right-3 text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Payment Section
            `overflow-y-auto` e `shrink-0` ausente: num ecrã de 667 px a secção de
            pagamento não cabe inteira, e sem scroll próprio o botão «Finalizar Compra»
            ficava abaixo do bordo do ecrã, inalcançável — a venda não se podia fechar. */}
        <div className="max-h-[65%] shrink-0 overflow-y-auto border-t border-gray-200 bg-white p-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] sm:p-5 lg:max-h-none">
          
          <div className="mb-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Método de Pagamento</p>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {PAYMENT_METHODS.map(pm => (
                <button
                  key={pm.id}
                  onClick={() => setCurrentPaymentMethod(pm.id as any)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border-2 transition-all ${
                    currentPaymentMethod === pm.id 
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20' 
                      : 'border-gray-100 hover:border-gray-300 bg-white'
                  }`}
                >
                  <img src={pm.img} alt={pm.label} className="h-7 w-auto object-contain mb-1.5 rounded" />
                  <span className={`text-[10px] font-bold ${currentPaymentMethod === pm.id ? 'text-blue-700' : 'text-gray-600'}`}>{pm.label}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="flex-1 bg-blue-50 border border-blue-100 rounded-xl p-2 flex items-center">
                <span className="text-sm font-bold text-blue-500 mr-2 uppercase">Valor</span>
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={currentAmountPaid || ''}
                  onChange={(e) => setCurrentAmountPaid(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent text-lg font-black text-blue-700 focus:outline-none appearance-none text-right"
                  placeholder="0.00"
                />
                <span className="text-xs font-bold text-blue-400 ml-1">MT</span>
              </div>
              <button
                onClick={() => {
                  if (currentAmountPaid > 0) {
                    setPagamentos([...pagamentos, { metodo: currentPaymentMethod, valorEntregue: currentAmountPaid }]);
                    setCurrentAmountPaid(0);
                  }
                }}
                disabled={currentAmountPaid <= 0}
                className="bg-slate-800 text-white px-4 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-slate-700"
              >
                Adicionar
              </button>
            </div>
          </div>

          {/* Lista de Pagamentos Adicionados */}
          {pagamentos.length > 0 && (
            <div className="mb-4 space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
              {pagamentos.map((pag, idx) => {
                const pmInfo = PAYMENT_METHODS.find(p => p.id === pag.metodo);
                return (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <img src={pmInfo?.img} className="w-5 h-5 object-contain rounded" />
                      <span className="font-semibold text-slate-700">{pmInfo?.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{pag.valorEntregue.toFixed(2)} MT</span>
                      <button 
                        onClick={() => setPagamentos(pagamentos.filter((_, i) => i !== idx))}
                        className="text-rose-400 hover:text-rose-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-3 mb-5">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-3 flex flex-col justify-center">
              <span className="text-[11px] font-bold text-gray-400 uppercase mb-1">Total a Pagar</span>
              <span className="text-xl font-black text-gray-900">{total.toFixed(2)} MT</span>
            </div>
            <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-2xl p-3 flex flex-col justify-center">
              <span className="text-[11px] font-bold text-emerald-600 uppercase mb-1">Total Recebido</span>
              <span className="text-xl font-black text-emerald-700">
                {pagamentos.reduce((acc, p) => acc + p.valorEntregue, 0).toFixed(2)} MT
              </span>
            </div>
          </div>

          <button 
            disabled={cartItems.length === 0 || pagamentos.reduce((acc, p) => acc + p.valorEntregue, 0) < total || processarVendaMutation.isPending}
            onClick={handleCheckout}
            className="w-full bg-blue-600 text-white font-black text-lg py-4 rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-600/20 active:scale-[0.98] flex justify-center items-center gap-2"
          >
            {processarVendaMutation.isPending ? (
              <RefreshCcw className="w-5 h-5 animate-spin" />
            ) : (
              <>Finalizar Compra</>
            )}
          </button>
        </div>
      </div>

      {/* ─── Barra do carrinho, no telemóvel ───────────────────────────────────
          Com o carrinho fechado não haveria nada a indicar o que já foi lido nem como
          chegar ao pagamento. Mostra a conta e abre o painel.

          Só no separador de vendas: no histórico de sessões não há carrinho. */}
      {activeTab === 'CATALOG' && !carrinhoAberto && (
        <button
          onClick={() => setCarrinhoAberto(true)}
          className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-blue-700 bg-blue-600 px-5 py-4 text-white shadow-2xl lg:hidden"
        >
          <span className="flex items-center gap-2 font-semibold">
            <ShoppingCart className="h-5 w-5" />
            {cartItems.length} {cartItems.length === 1 ? 'artigo' : 'artigos'}
          </span>
          <span className="flex items-center gap-2 font-black">
            {total.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
            <ChevronUp className="h-5 w-5" />
          </span>
        </button>
      )}

      {/* ──â”€ Receipt Modal ──â”€ */}
      {receiptData && (
        <ReceiptModal receiptData={receiptData} onClose={handleCloseReceipt} />
      )}

      {/* ─── Leitor de código de barras pela câmara ─── */}
      {leitorAberto && (
        <LeitorCameraModal
          onConfirmar={adicionarLido}
          onFechar={() => setLeitorAberto(false)}
        />
      )}
          </div>
        )}

        {/* Tab: Histórico de Sessões */}
        {activeTab === 'HISTORY' && (
          <div className="h-full w-full overflow-y-auto bg-gray-50 p-6 custom-scrollbar">
            <CaixasHistoricoPage />
          </div>
        )}
      </div>

      {/* ──â”€ Open Session Modal ──â”€ */}
      {showOpenSessionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 relative">
            
            {/* Close Button */}
            <button 
              onClick={() => setShowOpenSessionModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-black text-slate-800 text-center mb-1">Abrir Sessão de Caixa</h2>
            <p className="text-slate-500 text-center text-sm font-medium mb-6">É obrigatório abrir uma sessão para começar a vender.</p>
            
            {caixas.length === 0 ? (
              <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200 text-sm mb-6">
                <p className="font-semibold mb-1">Nenhum caixa disponível</p>
                <p>Contacte o Gestor de Loja para adicionar um terminal de caixa antes de abrir uma sessão.</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Selecione o Caixa</label>
                    <select
                      value={selectedCaixaId}
                      onChange={e => setSelectedCaixaId(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                    >
                      {caixas.map(c => (
                        <option key={c.id} value={c.id}>{c.nome} ({c.loja?.nome})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fundo de Maneio / Troco Inicial (MT)</label>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      value={saldoInicial || ''}
                      onChange={e => setSaldoInicial(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <button 
                  disabled={abrirSessaoMutation.isPending || !selectedCaixaId}
                  onClick={handleOpenSession}
                  className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                >
                  {abrirSessaoMutation.isPending ? <RefreshCcw className="w-5 h-5 animate-spin" /> : 'Confirmar Abertura'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ──â”€ Close Session Modal ──â”€ */}
      {showCloseSessionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 relative">
            
            <button 
              onClick={() => setShowCloseSessionModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-black text-slate-800 text-center mb-1">Fechar Turno</h2>
            <p className="text-slate-500 text-center text-sm font-medium mb-6">Declare o valor em dinheiro existente na gaveta.</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Valor FÍsico (Gaveta) MT</label>
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={saldoDeclarado || ''}
                  onChange={e => setSaldoDeclarado(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm font-bold text-slate-800"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Observações (Opcional)</label>
                <textarea 
                  value={observacoesClose}
                  onChange={e => setObservacoesClose(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm font-medium resize-none h-20"
                  placeholder="Justificação de quebras/sobras..."
                />
              </div>
            </div>

            <button 
              disabled={fecharSessaoMutation.isPending}
              onClick={handleCloseSession}
              className="w-full bg-rose-600 text-white font-black py-4 rounded-xl hover:bg-rose-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-rose-600/20"
            >
              {fecharSessaoMutation.isPending ? <RefreshCcw className="w-5 h-5 animate-spin" /> : 'Encerrar Caixa'}
            </button>
          </div>
        </div>
      )}

      {/* â–ªï¸â–ªï¸â–ªï¸ Sangria Modal â–ªï¸â–ªï¸â–ªï¸ */}
        {showSangriaModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 relative">
              <button 
                onClick={() => setShowSangriaModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-black text-slate-800 text-center mb-1">Registrar Sangria</h2>
              <p className="text-slate-500 text-center text-sm font-medium mb-6">Retirada de valor do caixa.</p>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Valor MT</label>
                  <input 
                    type="number" min="0" step="0.01"
                    value={movimentoValor || ''}
                    onChange={e => setMovimentoValor(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-bold text-slate-800"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Motivo</label>
                  <textarea 
                    value={movimentoMotivo}
                    onChange={e => setMovimentoMotivo(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-700 min-h-[100px]"
                    placeholder="Ex: Pagamento a fornecedor..."
                  />
                </div>
              </div>
              <button onClick={handleSangria} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-orange-600/20 active:scale-[0.98]">
                Confirmar Sangria
              </button>
            </div>
          </div>
        )}

        {/* â–ªï¸â–ªï¸â–ªï¸ Reforço Modal â–ªï¸â–ªï¸â–ªï¸ */}
        {showReforcoModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 relative">
              <button 
                onClick={() => setShowReforcoModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-black text-slate-800 text-center mb-1">Registrar Reforço</h2>
              <p className="text-slate-500 text-center text-sm font-medium mb-6">Entrada de valor (ex: trocos) no caixa.</p>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Valor MT</label>
                  <input 
                    type="number" min="0" step="0.01"
                    value={movimentoValor || ''}
                    onChange={e => setMovimentoValor(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-800"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Motivo</label>
                  <textarea 
                    value={movimentoMotivo}
                    onChange={e => setMovimentoMotivo(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-700 min-h-[100px]"
                    placeholder="Ex: Reforço de moedas para troco..."
                  />
                </div>
              </div>
              <button onClick={handleReforco} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]">
                Confirmar Reforço
              </button>
            </div>
          </div>
        )}
      </div>
  );
}

// ──â”€ Componente Interno: ProductCard ────────────────────────────────────────
function ProductCard({ product, onAdd }: { product: Product, onAdd: () => void }) {
  const disponivel = getStockDisponivel(product);
  const esgotado = disponivel !== undefined && disponivel <= 0;

  return (
    <button
      onClick={onAdd}
      disabled={esgotado}
      className={cn(
        'group bg-white rounded-2xl p-3 border border-gray-100 shadow-sm transition-all duration-300 flex flex-col h-full relative text-left w-full focus:outline-none focus:ring-2 focus:ring-blue-500',
        esgotado
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:shadow-xl transform hover:-translate-y-1',
      )}
    >

      <div className="relative bg-gray-50 rounded-xl aspect-square mb-3 overflow-hidden flex items-center justify-center p-4">

        {esgotado && (
          <span className="absolute top-2 left-2 z-10 rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Esgotado
          </span>
        )}
        {!esgotado && disponivel !== undefined && disponivel <= 5 && (
          <span className="absolute top-2 left-2 z-10 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Restam {disponivel}
          </span>
        )}

        {product.imagemUrl ? (
          <img 
            src={product.imagemUrl} 
            alt={product.nome} 
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" 
          />
        ) : (
          <span className="text-gray-400 text-[10px] font-medium text-center uppercase tracking-wide">Sem Imagem</span>
        )}
      </div>

      <div className="flex-1 flex flex-col relative pb-8">
        <h3 className="text-sm font-bold text-gray-800 mb-1 line-clamp-2 leading-snug pr-2">{product.nome}</h3>
        <p className="text-[11px] text-gray-400 font-medium mb-2">Ref: {product.codigoBarras || 'N/A'}</p>
        
        <div className="mt-auto">
          <div className="flex items-baseline gap-1">
            <p className="text-lg font-black text-gray-900">
              {product.precoVenda.toFixed(2)}
            </p>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">MT</span>
          </div>
        </div>
        
        {/* Plus Button inside Card */}
        <div 
          className="absolute bottom-0 right-0 w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 group-hover:shadow-md"
          title="Adicionar ao carrinho"
        >
          <Plus className="w-5 h-5" />
        </div>
      </div>
    </button>
  );
}
