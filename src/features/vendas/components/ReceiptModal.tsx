import { useState } from 'react';
import { CheckCircle2, Mail, Share2, X, Printer } from 'lucide-react';
import { api } from '@/shared/config';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTranslation } from 'react-i18next';
import { formatDataHora, formatMoeda } from '@/shared/utils';
import { formatNumero2 } from '../utils/formatNumero';

// Os valores do recibo podem faltar (venda vista a partir do histórico); sem valor, nada se
// escreve em vez de «NaN MT».
const moeda = (valor?: number | null) => (valor == null ? '' : formatMoeda(valor));

interface ReceiptModalProps {
  receiptData: any;
  onClose: () => void;
  viewOnly?: boolean;
}

export function ReceiptModal({ receiptData, onClose, viewOnly = false }: ReceiptModalProps) {
  const { t } = useTranslation('pos');
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
  const invoiceNum = numeroFatura || vendaCriada?.numeroFatura || t('recibo.nd');

  const generatePDFBlob = (): Blob => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.text(t('recibo.titulo'), 14, 20);
    doc.setFontSize(12);
    doc.text(t('recibo.pdf_fatura', { numero: invoiceNum }), 14, 30);
    doc.text(t('recibo.pdf_data', { data: formatDataHora(new Date()) }), 14, 36);
    if (caixeiro?.name) {
      doc.text(t('recibo.pdf_operador', { nome: caixeiro.name }), 14, 42);
    }
    
    autoTable(doc, {
      startY: 50,
      head: [[t('recibo.pdf_col_descricao'), t('recibo.pdf_col_qtd'), t('recibo.pdf_col_preco'), t('recibo.pdf_col_subtotal')]],
      body: _items.map((item: any) => [
        item.nomeProduto || item.produto?.nome || t('recibo.nd'), 
        item.quantidade?.toString(), 
        moeda(item.precoUnitario || item.precoVenda), 
        moeda(item.subtotal)
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [37, 99, 235] }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 50;
    
    doc.setFontSize(11);
    doc.text(t('recibo.pdf_subtotal', { valor: moeda(_subtotalGlobal) }), 14, finalY + 10);
    if (_descontoGlobal > 0) {
      doc.text(t('recibo.pdf_descontos', { valor: moeda(_descontoGlobal) }), 14, finalY + 16);
    }
    doc.text(t('recibo.pdf_iva', { valor: moeda(_ivaGlobal) }), 14, finalY + (_descontoGlobal > 0 ? 22 : 16));
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    const totalY = finalY + (_descontoGlobal > 0 ? 30 : 24);
    doc.text(t('recibo.pdf_total', { valor: moeda(_totalGlobal) }), 14, totalY);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const metodosPagamento = _pagamentos.map((p: any) => p.metodo).join(', ');
    const totalEntreguePdf = _pagamentos.reduce((acc: number, p: any) => acc + (p.valorPago || p.valorEntregue || 0), 0);

    doc.text(t('recibo.pdf_metodo', { metodos: metodosPagamento || t('recibo.nd') }), 14, totalY + 12);
    doc.text(t('recibo.pdf_entregue', { valor: moeda(totalEntreguePdf) }), 14, totalY + 18);
    doc.text(t('recibo.pdf_troco', { valor: moeda(_trocoGlobal) }), 14, totalY + 24);

    return doc.output('blob');
  };

  const handleSendEmail = async () => {
    if (!email) return;
    setIsSending(true);
    try {
      await api.post(`/vendas/${vendaCriada?.id || receiptData.id}/send-receipt`, { email });
      toast.success(t('recibo.enviado'));
      setShowEmailInput(false);
    } catch (error) {
      toast.error(t('recibo.erro_enviar'));
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
            title: t('recibo.titulo'),
            text: t('recibo.partilha_texto', { numero: invoiceNum }),
            files: [file]
          });
        } else {
          await navigator.share({
            title: t('recibo.titulo'),
            text: `${t('recibo.partilha_texto', { numero: invoiceNum })}\n${t('recibo.partilha_total', { valor: moeda(_totalGlobal) })}`,
          });
        }
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      toast.error(t('recibo.partilha_nao_suportada'));
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
            <p className="text-xs text-slate-500">{t('recibo.localidade')}</p>
            <div className="border-b-2 border-dashed border-slate-300 my-4"></div>
            <p className="text-xs font-semibold">{t('recibo.talao')}</p>
            <p className="text-xs">{formatDataHora(new Date())}</p>
            <p className="text-xs mt-1">{t('recibo.doc', { numero: invoiceNum })}</p>
            {caixeiro?.name && <p className="text-xs mt-1">{t('recibo.op', { nome: caixeiro.name })}</p>}
          </div>

          <div className="border-b border-dashed border-slate-300 mb-4"></div>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-xs font-bold uppercase text-slate-500 mb-1">
              <span>{t('recibo.qtd_produto')}</span>
              <span>{t('recibo.pdf_col_subtotal')}</span>
            </div>
            {_items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-start text-xs">
                <div className="pr-2">
                  <p className="font-semibold line-clamp-1">{item.nomeProduto || item.produto?.nome}</p>
                  <p className="text-slate-500">{item.quantidade} x {formatNumero2(item.precoUnitario || item.precoVenda)}</p>
                </div>
                <span className="font-semibold whitespace-nowrap">{moeda(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="border-b border-dashed border-slate-300 mb-4"></div>

          <div className="space-y-1 mb-4 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>{t('recibo.subtotal')}</span>
              <span>{moeda(_subtotalGlobal)}</span>
            </div>
            {_descontoGlobal > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>{t('recibo.descontos')}</span>
                <span>-{moeda(_descontoGlobal)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>{t('recibo.iva')}</span>
              <span>{moeda(_ivaGlobal)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-slate-200">
              <span>{t('recibo.total_final')}</span>
              <span>{moeda(_totalGlobal)}</span>
            </div>
          </div>

          <div className="border-b border-dashed border-slate-300 mb-4"></div>

          <div className="space-y-1 text-xs">
            {_pagamentos.map((p: any, idx: number) => (
              <div key={idx} className="flex justify-between text-slate-600">
                <span>{p.metodo}:</span>
                <span>{moeda(p.valorPago || p.valorEntregue)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold mt-1">
              <span>{t('recibo.troco')}</span>
              <span>{moeda(_trocoGlobal)}</span>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-xs font-semibold mb-1">{t('recibo.obrigado')}</p>
            <p className="text-[10px] text-slate-400">{t('recibo.processado_por')}</p>
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
                  placeholder={t('recibo.email_placeholder')}
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  onClick={handleSendEmail}
                  disabled={isSending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSending ? t('recibo.a_enviar') : t('recibo.enviar')}
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
                  <span className="text-[10px] font-semibold uppercase">{t('recibo.email')}</span>
                </button>
                <button onClick={handlePrint} className="flex flex-col items-center gap-1 text-slate-600 hover:text-blue-600 transition-colors">
                  <div className="p-3 bg-white border border-slate-200 rounded-full shadow-sm"><Printer className="w-5 h-5" /></div>
                  <span className="text-[10px] font-semibold uppercase">{t('recibo.imprimir')}</span>
                </button>
                <button onClick={handleShare} className="flex flex-col items-center gap-1 text-slate-600 hover:text-blue-600 transition-colors">
                  <div className="p-3 bg-white border border-slate-200 rounded-full shadow-sm"><Share2 className="w-5 h-5" /></div>
                  <span className="text-[10px] font-semibold uppercase">{t('recibo.partilhar')}</span>
                </button>
              </div>
            )
          )}
          
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {!viewOnly && <CheckCircle2 className="w-5 h-5" />}
            {viewOnly ? t('recibo.fechar') : t('recibo.nova_venda')}
          </button>
        </div>

      </div>
    </div>
  );
}
