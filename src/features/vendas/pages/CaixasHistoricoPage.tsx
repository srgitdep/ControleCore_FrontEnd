import { useState } from 'react';
import { MonitorSmartphone, ChevronDown, ChevronUp, Receipt, Download, RefreshCcw, Eye } from 'lucide-react';
import { useHistoricoSessoes } from '@/features/vendas';

import jsPDF from 'jspdf';
import { ReceiptModal } from '../components/ReceiptModal';

export function CaixasHistoricoPage() {
  const { data, isLoading, refetch } = useHistoricoSessoes();
  const sessoes = data || [];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDownloadReceipt = (venda: any) => {
    const doc = new jsPDF();
    const invoiceNum = venda.numeroFatura || 'N/A';
    
    doc.setFontSize(22);
    doc.text("Recibo de Compra (Via Histórico)", 14, 20);
    doc.setFontSize(12);
    doc.text(`Fatura: ${invoiceNum}`, 14, 30);
    doc.text(`Data: ${new Date(venda.createdAt).toLocaleString('pt-PT')}`, 14, 36);
    
    // Na API de histórico, as vendas não trazem os itens por defeito no plano atual, 
    // mas trazem os totais e pagamentos. Vamos mostrar os totais gerais.
    doc.setFontSize(11);
    doc.text(`Total Faturado: ${venda.totalFinal.toFixed(2)} MT`, 14, 50);
    
    if (venda.pagamentos && venda.pagamentos.length > 0) {
      const pag = venda.pagamentos[0];
      doc.text(`Método: ${pag.metodo}`, 14, 60);
      doc.text(`Valor Pago: ${pag.valorPago.toFixed(2)} MT`, 14, 66);
      doc.text(`Troco: ${pag.troco.toFixed(2)} MT`, 14, 72);
    }

    doc.save(`Recibo_${invoiceNum}.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MonitorSmartphone className="w-6 h-6 text-blue-600" />
            Histórico de Sessões de Caixa
          </h1>
          <p className="text-slate-500 mt-1">Consulte os turnos fechados e vendas associadas a cada sessão.</p>
        </div>
        <button 
          onClick={() => refetch()}
          className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
        >
          <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center">
            <RefreshCcw className="w-8 h-8 animate-spin mb-4" />
            A carregar histórico...
          </div>
        ) : sessoes.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            Nenhuma sessão encontrada.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sessoes.map((sessao: any) => (
              <div key={sessao.id} className="group">
                <div 
                  onClick={() => toggleExpand(sessao.id)}
                  className="p-5 cursor-pointer hover:bg-slate-50 transition-colors flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        sessao.estado === 'ABERTA' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {sessao.estado}
                      </span>
                      <h3 className="font-bold text-slate-800 text-lg">
                        {sessao.caixa?.nome} ({sessao.caixa?.loja?.nome})
                      </h3>
                    </div>
                    <p className="text-sm text-slate-500">Operador: <span className="font-medium text-slate-700">{sessao.operador?.name}</span></p>
                    <div className="flex gap-6 mt-2 text-xs font-mono text-slate-500">
                      <span>Abertura: {new Date(sessao.dataAbertura).toLocaleString('pt-PT')}</span>
                      {sessao.dataFecho && (
                        <span>Fecho: {new Date(sessao.dataFecho).toLocaleString('pt-PT')}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase">Faturado</p>
                      <p className="font-black text-lg text-slate-800">
                        {(sessao.saldoFinalCalculado - sessao.saldoInicial).toFixed(2)} MT
                      </p>
                    </div>
                    {sessao.estado === 'FECHADA' && (
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase">Quebra/Sobra</p>
                        <div className="flex items-center gap-2 justify-end">
                          <p className={`font-black text-lg ${
                            (sessao.diferenca ?? (sessao.saldoFinalDeclarado - sessao.saldoFinalCalculado)) < 0 ? 'text-rose-600' :
                            (sessao.diferenca ?? (sessao.saldoFinalDeclarado - sessao.saldoFinalCalculado)) > 0 ? 'text-emerald-600' : 'text-slate-500'
                          }`}>
                            {(sessao.diferenca ?? (sessao.saldoFinalDeclarado - sessao.saldoFinalCalculado)).toFixed(2)} MT
                          </p>
                          {(sessao.diferenca ?? (sessao.saldoFinalDeclarado - sessao.saldoFinalCalculado)) < 0 && (
                            <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider" title="Quebra Negativa de Caixa">
                              Alerta
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="text-slate-400">
                      {expandedId === sessao.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                    </div>
                  </div>
                </div>

                {/* Vendas Associadas (Expanded View) */}
                {expandedId === sessao.id && (
                  <div className="bg-slate-50 p-6 border-t border-slate-100">
                    <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-blue-500" /> Vendas Associadas ({sessao.vendas?.length || 0})
                    </h4>
                    
                    {(!sessao.vendas || sessao.vendas.length === 0) ? (
                      <p className="text-sm text-slate-500 italic">Nenhuma venda registada nesta sessão.</p>
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-sm text-slate-600">
                          <thead className="bg-slate-100/50 border-b border-slate-200 text-slate-500 uppercase text-xs font-bold">
                            <tr>
                              <th className="px-4 py-3">Fatura / Recibo</th>
                              <th className="px-4 py-3">Data Hora</th>
                              <th className="px-4 py-3">Valor</th>
                              <th className="px-4 py-3 text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {sessao.vendas.map((venda: any) => (
                              <tr key={venda.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium text-slate-800">{venda.numeroFatura}</td>
                                <td className="px-4 py-3 font-mono text-xs">{new Date(venda.createdAt).toLocaleString('pt-PT')}</td>
                                <td className="px-4 py-3 font-bold text-blue-600">{venda.totalFinal.toFixed(2)} MT</td>
                                <td className="px-4 py-3 text-right flex justify-end gap-2">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedReceipt({ ...venda, caixeiro: sessao.operador });
                                    }}
                                    className="text-slate-500 hover:text-emerald-600 p-1 rounded transition-colors"
                                    title="Visualizar Recibo"
                                  >
                                    <Eye size={18} />
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadReceipt(venda);
                                    }}
                                    className="text-slate-500 hover:text-blue-600 p-1 rounded transition-colors"
                                    title="Descarregar Recibo Resumido"
                                  >
                                    <Download size={18} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedReceipt && (
        <ReceiptModal 
          receiptData={selectedReceipt} 
          onClose={() => setSelectedReceipt(null)} 
          viewOnly={true} 
        />
      )}
    </div>
  );
}
