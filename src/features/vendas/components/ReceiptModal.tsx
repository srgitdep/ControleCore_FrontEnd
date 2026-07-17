import { useState } from 'react';
import { CheckCircle2, Mail, Share2, X, Printer } from 'lucide-react';
import { api } from '@/api/axios';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReceiptModalProps {
  receiptData: any;
  onClose: () => void;
  viewOnly?: boolean;
}

export function ReceiptModal({ receiptData, onClose, viewOnly = false }: ReceiptModalProps) {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);

  if (!receiptData) return null;

  const { numeroFatura, totalFinal, trocoGlobal, itensPreparados, pagamentosPreparados, subtotalGlobal, descontoGlobal, ivaGlobal, vendaCriada, caixeiro, totalGlobal } = receiptData;

  const _subtotalGlobal = subtotalGlobal || receiptData.subtotal;
  const _totalGlobal = totalGlobal || totalFinal || vendaCriada?.totalFinal || receiptData.totalFinal;
  const _descontoGlobal = descontoGlobal || receiptData.totalDesconto || 0;
  const _ivaGlobal = ivaGlobal || receiptData.totalIva || 0;
  const _pagamentos = pagamentosPreparados || receiptData.pagamentos || [];
  const _trocoGlobal = trocoGlobal || receiptData.troco || (_pagamentos.length > 0 ? _pagamentos.reduce((acc: number, p: any) => acc + (p.troco || 0), 0) : 0);
  const _items = itensPreparados || receiptData.itens || [];
  const invoiceNum = numeroFatura || vendaCriada?.numeroFatura || 'N/A';

  const generatePDFBlob = (): Blob => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.text("Recibo de Compra", 14, 20);
    doc.setFontSize(12);
    doc.text(`Fatura: ${invoiceNum}`, 14, 30);
    doc.text(`Data: ${new Date().toLocaleString('pt-PT')}`, 14, 36);
    if (caixeiro?.name) {
      doc.text(`Operador: ${caixeiro.name}`, 14, 42);
    }
    
    autoTable(doc, {
      startY: 50,
      head: [['Descrição', 'Qtd', 'Preço Unit.', 'Subtotal']],
      body: _items.map((item: any) => [
        item.nomeProduto || item.produto?.nome || 'N/A', 
        item.quantidade?.toString(), 
        `${(item.precoUnitario || item.precoVenda)?.toFixed(2)} MT`, 
        `${(item.subtotal)?.toFixed(2)} MT`
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [37, 99, 235] }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 50;
    
    doc.setFontSize(11);
    doc.text(`Subtotal: ${_subtotalGlobal?.toFixed(2)} MT`, 14, finalY + 10);
    if (_descontoGlobal > 0) {
      doc.text(`Descontos: -${_descontoGlobal?.toFixed(2)} MT`, 14, finalY + 16);
    }
    doc.text(`Total IVA: ${_ivaGlobal?.toFixed(2)} MT`, 14, finalY + (_descontoGlobal > 0 ? 22 : 16));
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    const totalY = finalY + (_descontoGlobal > 0 ? 30 : 24);
    doc.text(`TOTAL FINAL: ${_totalGlobal?.toFixed(2)} MT`, 14, totalY);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const metodosPagamento = _pagamentos.map((p: any) => p.metodo).join(', ');
    const totalEntreguePdf = _pagamentos.reduce((acc: number, p: any) => acc + (p.valorPago || p.valorEntregue || 0), 0);

    doc.text(`Método de Pagamento: ${metodosPagamento || 'N/A'}`, 14, totalY + 12);
    doc.text(`Valor Entregue: ${totalEntreguePdf.toFixed(2)} MT`, 14, totalY + 18);
    doc.text(`Troco: ${_trocoGlobal?.toFixed(2)} MT`, 14, totalY + 24);

    return doc.output('blob');
  };

  const handleSendEmail = async () => {
    if (!email) return;
    setIsSending(true);
    try {
      await api.post(`/vendas/${vendaCriada?.id || receiptData.id}/send-receipt`, { email });
      toast.success('Recibo enviado com sucesso!');
      setShowEmailInput(false);
    } catch (error) {
      toast.error('Erro ao enviar recibo.');
    } finally {
      setIsSending(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        const pdfBlob = generatePDFBlob();
        const file = new File([pdfBlob], `Recibo_${invoiceNum}.pdf`, { type: 'application/pdf' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Recibo de Compra',
            text: `Recibo de compra - Fatura ${invoiceNum}`,
            files: [file]
          });
        } else {
          await navigator.share({
            title: 'Recibo de Compra',
            text: `Recibo de compra - Fatura ${invoiceNum}\nTotal: ${_totalGlobal?.toFixed(2)} MT`,
          });
        }
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      toast.error('Partilha não suportada neste dispositivo.');
    }
  };

  // The receipt layout
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:bg-white print:p-0 print:block">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none">
        
        {/* Scrollable Receipt Area */}
        <div className="flex-1 overflow-y-auto p-6 font-mono text-sm text-slate-800 bg-[#fdfdfc] print:p-0">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold uppercase tracking-widest mb-1">Supermercado SPAR</h2>
            <p className="text-xs text-slate-500">NIF: 123456789</p>
            <p className="text-xs text-slate-500">Maputo, Moçambique</p>
            <div className="border-b-2 border-dashed border-slate-300 my-4"></div>
            <p className="text-xs font-semibold">Talão de Venda</p>
            <p className="text-xs">{new Date().toLocaleString('pt-PT')}</p>
            <p className="text-xs mt-1">Doc: {invoiceNum}</p>
            {caixeiro?.name && <p className="text-xs mt-1">Op: {caixeiro.name}</p>}
          </div>

          <div className="border-b border-dashed border-slate-300 mb-4"></div>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-xs font-bold uppercase text-slate-500 mb-1">
              <span>Qtd x Produto</span>
              <span>Subtotal</span>
            </div>
            {_items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-start text-xs">
                <div className="pr-2">
                  <p className="font-semibold line-clamp-1">{item.nomeProduto || item.produto?.nome}</p>
                  <p className="text-slate-500">{item.quantidade} x {(item.precoUnitario || item.precoVenda)?.toFixed(2)}</p>
                </div>
                <span className="font-semibold whitespace-nowrap">{(item.subtotal)?.toFixed(2)} MT</span>
              </div>
            ))}
          </div>

          <div className="border-b border-dashed border-slate-300 mb-4"></div>

          <div className="space-y-1 mb-4 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>{_subtotalGlobal?.toFixed(2)} MT</span>
            </div>
            {_descontoGlobal > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Descontos:</span>
                <span>-{_descontoGlobal?.toFixed(2)} MT</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Total IVA:</span>
              <span>{_ivaGlobal?.toFixed(2)} MT</span>
            </div>
            <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-slate-200">
              <span>TOTAL FINAL:</span>
              <span>{_totalGlobal?.toFixed(2)} MT</span>
            </div>
          </div>

          <div className="border-b border-dashed border-slate-300 mb-4"></div>

          <div className="space-y-1 text-xs">
            {_pagamentos.map((p: any, idx: number) => (
              <div key={idx} className="flex justify-between text-slate-600">
                <span>{p.metodo}:</span>
                <span>{(p.valorPago || p.valorEntregue)?.toFixed(2)} MT</span>
              </div>
            ))}
            <div className="flex justify-between font-bold mt-1">
              <span>TROCO:</span>
              <span>{_trocoGlobal?.toFixed(2)} MT</span>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-xs font-semibold mb-1">Obrigado pela preferência!</p>
            <p className="text-[10px] text-slate-400">Processado por ControlCore PDV</p>
          </div>
        </div>

        {/* Actions Area (Hidden in print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 print:hidden">
          {!viewOnly && (
            showEmailInput ? (
              <div className="mb-4 flex gap-2 animate-in slide-in-from-bottom-2">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="E-mail do cliente..."
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  onClick={handleSendEmail}
                  disabled={isSending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSending ? 'A enviar...' : 'Enviar'}
                </button>
                <button
                  onClick={() => setShowEmailInput(false)}
                  className="px-3 py-2 text-slate-500 hover:bg-slate-200 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex justify-center gap-4 mb-4">
                <button onClick={() => setShowEmailInput(true)} className="flex flex-col items-center gap-1 text-slate-600 hover:text-blue-600 transition-colors">
                  <div className="p-3 bg-white border border-slate-200 rounded-full shadow-sm"><Mail className="w-5 h-5" /></div>
                  <span className="text-[10px] font-semibold uppercase">Email</span>
                </button>
                <button onClick={handlePrint} className="flex flex-col items-center gap-1 text-slate-600 hover:text-blue-600 transition-colors">
                  <div className="p-3 bg-white border border-slate-200 rounded-full shadow-sm"><Printer className="w-5 h-5" /></div>
                  <span className="text-[10px] font-semibold uppercase">Imprimir</span>
                </button>
                <button onClick={handleShare} className="flex flex-col items-center gap-1 text-slate-600 hover:text-blue-600 transition-colors">
                  <div className="p-3 bg-white border border-slate-200 rounded-full shadow-sm"><Share2 className="w-5 h-5" /></div>
                  <span className="text-[10px] font-semibold uppercase">Partilhar</span>
                </button>
              </div>
            )
          )}
          
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {!viewOnly && <CheckCircle2 className="w-5 h-5" />}
            {viewOnly ? 'Fechar' : 'Nova Venda (Cliente Seguinte)'}
          </button>
        </div>

      </div>
    </div>
  );
}
