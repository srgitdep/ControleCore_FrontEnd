import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, ImagePlus, X, Check } from 'lucide-react';
import { useProducts, useCategories, useUpdateProduct } from '@/hooks/useCatalog';
import { usePosStore } from '@/store/posStore';
import { useSocket } from '@/hooks/useSocket';
import type { Product } from '@/types/catalog.types';

export function POSPage() {
  // Inicializa o WebSockets
  useSocket();

  const { 
    searchTerm, setSearchTerm, 
    selectedCategoryId, setSelectedCategory,
    cartItems, addItem, removeItem, updateQuantity,
    total 
  } = usePosStore();

  const { data: categoriesData } = useCategories();
  const { data: productsData, isLoading: isLoadingProducts } = useProducts({ 
    search: searchTerm, 
    categoryId: selectedCategoryId || undefined,
    limit: 50 // Exemplo de limite
  });

  const products = productsData?.data || [];
  const categories = categoriesData || [];

  // ─── Global Barcode Listener ───────────────────────────────────────────────
  const barcodeBuffer = useRef('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar inputs de texto
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 0) {
          const barcode = barcodeBuffer.current;
          barcodeBuffer.current = ''; // Reset
          
          // Procurar o produto pelo código de barras
          const foundProduct = products.find(p => p.codigoBarras === barcode);
          if (foundProduct) {
            addItem(foundProduct);
          } else {
            // Em produção, talvez queiras fazer uma API call específica aqui
            console.warn('Produto não encontrado pelo código de barras:', barcode);
          }
        }
      } else if (e.key.length === 1) { // Apenas caracteres válidos
        barcodeBuffer.current += e.key;
        
        // Reset do buffer se demorar muito (leitor é rápido)
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          barcodeBuffer.current = '';
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, addItem]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50 overflow-hidden">
      
      {/* ─── Main Content (Catalog) ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header & Search */}
        <div className="bg-white p-4 shadow-sm z-10 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Ponto de Venda</h1>
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input 
              type="text" 
              placeholder="Pesquisar produtos (Nome, SKU, Cód. Barras)..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex gap-3 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
              selectedCategoryId === null 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                selectedCategoryId === cat.id 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.imagemUrl && (
                <img src={cat.imagemUrl} alt={cat.nome} className="w-5 h-5 rounded-full object-cover" />
              )}
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
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
      </div>

      {/* ─── Cart Sidebar ─── */}
      <div className="w-96 bg-white shadow-2xl flex flex-col z-20">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" /> Carrinho
          </h2>
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
            {cartItems.length} Itens
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>O carrinho está vazio.</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="flex gap-3 bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.imagemUrl ? (
                    <img src={item.imagemUrl} alt={item.nome} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Sem Img</div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 line-clamp-1">{item.nome}</h4>
                    <p className="text-blue-600 font-bold text-sm">€{item.precoVenda.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                      <button 
                        onClick={() => updateQuantity(item.id, item.cartQuantity - 1)}
                        className="p-1 hover:bg-white rounded shadow-sm text-gray-600 transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.cartQuantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.cartQuantity + 1)}
                        className="p-1 hover:bg-white rounded shadow-sm text-gray-600 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-600 transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-500 font-medium">Total:</span>
            <span className="text-2xl font-bold text-gray-800">€{total.toFixed(2)}</span>
          </div>
          <button 
            disabled={cartItems.length === 0}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 active:scale-95"
          >
            Finalizar Compra
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente Interno: ProductCard ────────────────────────────────────────
function ProductCard({ product, onAdd }: { product: Product, onAdd: () => void }) {
  // Simulamos um valor de stock temporário visual (idealmente viria populado no endpoint /products ou via join). 
  // Na ausência, deixamos um placeholder visual.
  const tempStock = 100; 

  const [isEditingImage, setIsEditingImage] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState(product.imagemUrl || '');
  const updateProduct = useUpdateProduct();

  const handleSaveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (newImageUrl !== product.imagemUrl) {
      updateProduct.mutate({ id: product.id, data: { imagemUrl: newImageUrl } });
    }
    setIsEditingImage(false);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingImage(false);
    setNewImageUrl(product.imagemUrl || '');
  };

  return (
    <div className="group bg-white rounded-2xl p-3 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1 relative">
      
      {/* Edit Image Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); setIsEditingImage(true); }}
        className="absolute top-2 right-2 bg-white text-gray-400 hover:text-blue-600 p-1.5 rounded-lg shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity z-20"
        title="Editar Imagem"
      >
        <ImagePlus className="h-4 w-4" />
      </button>

      <div className="relative bg-gray-100 rounded-xl aspect-square mb-3 overflow-hidden flex items-center justify-center">
        {/* Etiqueta de Stock estilo Nike */}
        <div className="absolute top-2 left-2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10">
          {tempStock} Stock
        </div>
        
        {isEditingImage ? (
          <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center p-3">
            <p className="text-xs font-bold text-gray-700 mb-2">URL da Imagem</p>
            <input 
              type="text" 
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full text-xs p-2 border border-gray-200 rounded mb-2"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex gap-2">
              <button onClick={handleSaveImage} className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 disabled:opacity-50" disabled={updateProduct.isPending}>
                <Check className="h-3 w-3" />
              </button>
              <button onClick={handleCancelEdit} className="bg-gray-200 text-gray-700 p-1.5 rounded hover:bg-gray-300">
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        ) : product.imagemUrl ? (
          <img 
            src={product.imagemUrl} 
            alt={product.nome} 
            className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500" 
          />
        ) : (
          <span className="text-gray-400 text-xs text-center px-4">Sem Imagem<br/>(Clica no ícone para adicionar)</span>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <h3 className="text-sm font-bold text-gray-800 mb-1 line-clamp-2">{product.nome}</h3>
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">Cód: {product.codigoBarras || 'N/A'}</p>
        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-1 mb-3">
            <p className="text-lg font-extrabold text-gray-900">
              €{product.precoVenda.toFixed(2)}
            </p>
            {product.unidadeMedida && (
              <span className="text-xs font-medium text-gray-500">
                / {product.unidadeMedida}
              </span>
            )}
          </div>
          <button 
            onClick={onAdd}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-900 hover:text-white hover:border-gray-900 font-semibold py-2 rounded-xl transition-colors active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
