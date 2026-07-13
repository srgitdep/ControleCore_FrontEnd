import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, MonitorSmartphone, Receipt, Download, Mail, RefreshCcw, CheckCircle, TicketPercent, DollarSign, X, Lock } from 'lucide-react';
import { useProducts, useCategories } from '@/hooks/useCatalog';
import { usePosStore } from '@/store/posStore';
import { useSocket } from '@/hooks/useSocket';
import { processarVenda, enviarRecibo } from '@/api/vendas.api';
import { createAuditLog } from '@/api/auditoria.api';
import { obterMinhaSessao, obterCaixasDisponiveis, abrirSessao, fecharSessao } from '@/api/caixas.api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Product } from '@/types/catalog.types';
import { CaixasHistoricoPage } from './CaixasHistoricoPage';

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
    cartItems, addItem, removeItem, updateQuantity, clearCart
  } = usePosStore();

  const total = cartItems.reduce((acc, item) => acc + (item.precoVenda * item.cartQuantity), 0);

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
  const [pagamentos, setPagamentos] = useState<{metodo: string, valorEntregue: number}[]>([]);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<typeof PAYMENT_METHODS[number]['id']>('NUMERARIO');
  const [currentAmountPaid, setCurrentAmountPaid] = useState<number>(0);
  
  // Abas do painel principal (Catálogo vs Histórico)
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'HISTORY'>('CATALOG');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [vendaResult, setVendaResult] = useState<any>(null);
  const [customerEmail, setCustomerEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Estado da Sessão de Caixa
  const [hasSession, setHasSession] = useState<boolean>(true);
  const [showOpenSessionModal, setShowOpenSessionModal] = useState<boolean>(false);
  const [caixas, setCaixas] = useState<any[]>([]);
  const [selectedCaixaId, setSelectedCaixaId] = useState<string>('');
  const [saldoInicial, setSaldoInicial] = useState<number>(0);
  const [isOpeningSession, setIsOpeningSession] = useState(false);

  // Estado para Fechar Sessão
  const [showCloseSessionModal, setShowCloseSessionModal] = useState<boolean>(false);
  const [saldoDeclarado, setSaldoDeclarado] = useState<number>(0);
  const [observacoesClose, setObservacoesClose] = useState('');
  const [isClosingSession, setIsClosingSession] = useState(false);
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

  // Verifica a sessão ao montar
  useEffect(() => {
    obterMinhaSessao().then(sessao => {
      if (!sessao) {
        setHasSession(false);
        setShowOpenSessionModal(true);
        obterCaixasDisponiveis().then(data => {
          setCaixas(data);
          if (data.length > 0) setSelectedCaixaId(data[0].id);
        });
      } else {
        setCurrentSessaoId(sessao.id);
      }
    });
  }, []);

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

  // ─── Barcode Listener ───────────────────────────────────────────────────
  const barcodeBuffer = useRef('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || showSuccessModal) {
        return;
      }

      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 0) {
          const barcode = barcodeBuffer.current;
          barcodeBuffer.current = ''; 
          
          const foundProduct = products.find(p => p.codigoBarras === barcode);
          if (foundProduct) {
            addItem(foundProduct);
          } else {
            toast.error('Produto não encontrado.');
          }
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
  }, [products, addItem, showSuccessModal]);

  // ─── Actions ─────────────────────────────────────────────────────────────
  const handleOpenSession = async () => {
    if (!selectedCaixaId) return toast.error('Selecione um caixa.');
    setIsOpeningSession(true);
    try {
      const sessao = await abrirSessao(selectedCaixaId, saldoInicial);
      setCurrentSessaoId(sessao.id);
      
      toast.custom((t) => (
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

      setHasSession(true);
      setShowOpenSessionModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao abrir caixa.');
    } finally {
      setIsOpeningSession(false);
    }
  };

  const handleCloseSession = async () => {
    if (!currentSessaoId) return;
    setIsClosingSession(true);
    try {
      const result = await fecharSessao(currentSessaoId, { 
        saldoDeclarado, 
        observacoes: observacoesClose 
      });
      
      toast.custom((t) => (
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao fechar caixa.');
    } finally {
      setIsClosingSession(false);
    }
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

      setIsProcessing(true);
      try {
        const payload = {
          itens: cartItems.map(item => ({
            produtoId: item.id,
            quantidade: item.cartQuantity,
          })),
          pagamentos: pagamentos
        };

      const venda = await processarVenda(payload);
      
      // Audit log frontend call
      createAuditLog({
        action: 'SALE_COMPLETED',
        entityName: 'Venda',
        entityId: venda.id || 'N/A',
        details: { total, method: paymentMethod }
      }).catch(() => {});

      setVendaResult(venda);
      setShowSuccessModal(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao processar venda.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendEmail = async () => {
    if (!customerEmail || !vendaResult?.id) return;
    setIsSendingEmail(true);
    try {
      await enviarRecibo(vendaResult.id, customerEmail);
      toast.success('Recibo enviado com sucesso!');
      setCustomerEmail('');
    } catch (error: any) {
      toast.error('Falha ao enviar recibo por email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDownloadReceipt = () => {
    const doc = new jsPDF();
    const invoiceNum = vendaResult?.numeroFatura || 'N/A';
    
    // Header
    doc.setFontSize(22);
    doc.text("Recibo de Compra", 14, 20);
    doc.setFontSize(12);
    doc.text(`Fatura: ${invoiceNum}`, 14, 30);
    doc.text(`Data: ${new Date().toLocaleString('pt-PT')}`, 14, 36);
    
    autoTable(doc, {
      startY: 45,
      head: [['Descrição', 'Qtd', 'Preço Unit.', 'Subtotal']],
      body: cartItems.map(item => [
        item.nome, 
        item.cartQuantity.toString(), 
        `${item.precoVenda.toFixed(2)} MT`, 
        `${(item.precoVenda * item.cartQuantity).toFixed(2)} MT`
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [37, 99, 235] }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 45;
    
    doc.setFontSize(11);
    doc.text(`Subtotal: ${total.toFixed(2)} MT`, 14, finalY + 10);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL FINAL: ${total.toFixed(2)} MT`, 14, finalY + 18);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Método de Pagamento: ${paymentMethod}`, 14, finalY + 30);
    doc.text(`Valor Entregue: ${amountPaid.toFixed(2)} MT`, 14, finalY + 36);
    doc.text(`Troco: ${(amountPaid - total).toFixed(2)} MT`, 14, finalY + 42);

    doc.save(`Recibo_${invoiceNum}.pdf`);
  };

  const handleNewSale = () => {
    clearCart();
    setPagamentos([]);
    setCurrentAmountPaid(0);
    setPaymentMethod('NUMERARIO');
    setCustomerEmail('');
    setVendaResult(null);
    setShowSuccessModal(false);
  };

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">
      
      {/* ─── Main Content (Catalog) ─── */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Search Header */}
        <div className="bg-white p-4 shadow-sm z-10">
          <div className="relative max-w-2xl mx-auto flex items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
              <button 
                onClick={() => setActiveTab('CATALOG')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'CATALOG' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Catálogo
              </button>
              <button 
                onClick={() => setActiveTab('HISTORY')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'HISTORY' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Histórico
              </button>
            </div>
            {activeTab === 'CATALOG' && (
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
            )}
          </div>
        </div>

        {activeTab === 'CATALOG' ? (
          <>
            {/* Categories */}
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
            <div className="flex-1 overflow-y-auto p-6">
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
                      onAdd={() => addItem(product)} 
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
            <CaixasHistoricoPage />
          </div>
        )}
      </div>

      {/* ─── Cart Sidebar ─── */}
      <div className="w-[420px] bg-white shadow-2xl flex flex-col z-20 border-l border-gray-200 shrink-0">
        {/* Cart Header */}
        <div className="p-5 border-b border-gray-100 bg-white flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-blue-600" /> Carrinho
          </h2>
          <div className="flex items-center gap-2">
            {hasSession && (
              <button 
                onClick={() => setShowCloseSessionModal(true)}
                className="bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                title="Fechar Turno / Sessão"
              >
                <Lock className="w-3.5 h-3.5" />
                Fechar Caixa
              </button>
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
                        onClick={() => updateQuantity(item.id, item.cartQuantity - 1)}
                        className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-bold w-6 text-center text-gray-800">{item.cartQuantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.cartQuantity + 1)}
                        className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
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

        {/* Payment Section */}
        <div className="p-5 bg-white border-t border-gray-200 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
          
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
            disabled={cartItems.length === 0 || pagamentos.reduce((acc, p) => acc + p.valorEntregue, 0) < total || isProcessing}
            onClick={handleCheckout}
            className="w-full bg-blue-600 text-white font-black text-lg py-4 rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-600/20 active:scale-[0.98] flex justify-center items-center gap-2"
          >
            {isProcessing ? (
              <RefreshCcw className="w-5 h-5 animate-spin" />
            ) : (
              <>Finalizar Compra</>
            )}
          </button>
        </div>
      </div>

      {/* ─── Success Modal ─── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <CheckCircle className="w-10 h-10" />
            </div>
            
            <h2 className="text-2xl font-black text-slate-800 text-center mb-1">Venda Concluída!</h2>
            <p className="text-slate-500 text-center text-sm font-medium mb-6">Fatura {vendaResult?.numeroFatura} processada.</p>
            
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Enviar Recibo (Opcional)</label>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="E-mail do cliente"
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                />
                <button 
                  onClick={handleSendEmail}
                  disabled={isSendingEmail || !customerEmail}
                  className="bg-blue-600 text-white px-5 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center transition-colors shadow-sm"
                  title="Enviar Email"
                >
                  {isSendingEmail ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleDownloadReceipt}
                className="flex items-center justify-center gap-2 border-2 border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                <Download className="w-5 h-5" /> PDF
              </button>
              <button 
                onClick={handleNewSale}
                className="bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition-colors shadow-md"
              >
                Nova Venda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Open Session Modal ─── */}
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
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Selecione o Caixa</label>
                <select 
                  value={selectedCaixaId}
                  onChange={(e) => setSelectedCaixaId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                >
                  <option value="" disabled>Escolha um caixa...</option>
                  {caixas.map(c => (
                    <option key={c.id} value={c.id}>{c.nome} ({c.loja?.nome})</option>
                  ))}
                </select>
                {caixas.length === 0 && (
                  <p className="text-xs text-red-500 mt-2">Atenção: Não existem caixas configurados no sistema. Vá ao menu Lojas para criar um.</p>
                )}
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
              disabled={isOpeningSession || !selectedCaixaId}
              onClick={handleOpenSession}
              className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
            >
              {isOpeningSession ? <RefreshCcw className="w-5 h-5 animate-spin" /> : 'Confirmar Abertura'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Close Session Modal ─── */}
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
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Valor Físico (Gaveta) MT</label>
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
              disabled={isClosingSession}
              onClick={handleCloseSession}
              className="w-full bg-rose-600 text-white font-black py-4 rounded-xl hover:bg-rose-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-rose-600/20"
            >
              {isClosingSession ? <RefreshCcw className="w-5 h-5 animate-spin" /> : 'Encerrar Caixa'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente Interno: ProductCard ────────────────────────────────────────
function ProductCard({ product, onAdd }: { product: Product, onAdd: () => void }) {
  return (
    <button 
      onClick={onAdd}
      className="group bg-white rounded-2xl p-3 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1 relative text-left w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      
      <div className="relative bg-gray-50 rounded-xl aspect-square mb-3 overflow-hidden flex items-center justify-center p-4">
        
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
