import { useState } from 'react';
import { MonitorSmartphone, ChevronDown, ChevronUp, Receipt, Download, RefreshCcw, Eye, Ban, X, AlertTriangle, Loader2 } from 'lucide-react';
import { useHistoricoSessoes, anularVenda } from '@/features/vendas';
import toast from 'react-hot-toast';

import jsPDF from 'jspdf';
import { ReceiptModal } from '../components/ReceiptModal';
import { TableScroll } from '@/shared/ui';
import { useTranslation } from 'react-i18next';
import { formatDataHora, formatMoeda, mensagemDeErro } from '@/shared/utils';

export function CaixasHistoricoPage() {
  const { t } = useTranslation('pos');
  // Os estados vêm da API como códigos; um código novo aparece tal como chegou.
  const rotuloEstado = (estado: string) =>
    estado === 'ABERTA' ? t('estado.ABERTA') : estado === 'FECHADA' ? t('estado.FECHADA') : estado;
  const { data, isLoading, refetch } = useHistoricoSessoes();
  const sessoes = data || [];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [vendaParaAnular, setVendaParaAnular] = useState<any>(null);
  const [motivoAnulacao, setMotivoAnulacao] = useState('');
  const [isAnulando, setIsAnulando] = useState(false);

  const confirmarAnulacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendaParaAnular) return;

    setIsAnulando(true);
    try {
      const r = await anularVenda(vendaParaAnular.id, motivoAnulacao);
      toast.success(
        [
          r.message,
          t('anular.stock_devolvido', { n: r.stockDevolvido }),
          r.numerarioDevolvido > 0
            ? t('anular.numerario_devolvido', { valor: formatMoeda(r.numerarioDevolvido) })
            : null,
        ]
          .filter(Boolean)
          .join(' '),
      );
      setVendaParaAnular(null);
      setMotivoAnulacao('');
      refetch();
    } catch (error: any) {
      // O backend recusa venda já anulada, sessão fechada e perfil sem permissão,
      // cada um com mensagem própria.
      toast.error(mensagemDeErro(error, t('anular.erro')));
    } finally {
      setIsAnulando(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDownloadReceipt = (venda: any) => {
    const doc = new jsPDF();
    const invoiceNum = venda.numeroFatura || 'N/A';
    
    doc.setFontSize(22);
    doc.text(t('historico.pdf_titulo'), 14, 20);
    doc.setFontSize(12);
    doc.text(t('recibo.pdf_fatura', { numero: invoiceNum }), 14, 30);
    doc.text(t('recibo.pdf_data', { data: formatDataHora(venda.createdAt) }), 14, 36);
    
    // Na API de histórico, as vendas não trazem os itens por defeito no plano atual, 
    // mas trazem os totais e pagamentos. Vamos mostrar os totais gerais.
    doc.setFontSize(11);
    doc.text(t('historico.pdf_total', { valor: formatMoeda(venda.totalFinal) }), 14, 50);
    
    if (venda.pagamentos && venda.pagamentos.length > 0) {
      const pag = venda.pagamentos[0];
      doc.text(t('historico.pdf_metodo', { metodo: pag.metodo }), 14, 60);
      doc.text(t('historico.pdf_valor_pago', { valor: formatMoeda(pag.valorPago) }), 14, 66);
      doc.text(t('recibo.pdf_troco', { valor: formatMoeda(pag.troco) }), 14, 72);
    }

    doc.save(`Recibo_${invoiceNum}.pdf`);
  };

  return (
    // Este componente é montado dentro do separador «Histórico» do POS, que já tem o
    // seu `<h1>Vendas</h1>` — dois `<h1>` na mesma página são ambíguos para um leitor
    // de ecrã. A rota `/sessoes-historico`, que o mostrava como página autónoma, saiu:
    // era a mesma vista em dois lugares, alcançável só pelo menu.
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <MonitorSmartphone className="w-5 h-5 text-blue-600" />
            {t('historico.titulo')}
          </h2>
          <p className="text-slate-500 mt-1">{t('historico.subtitulo')}</p>
        </div>
        <button 
          onClick={() => refetch()}
          className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
        >
          <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
          {t('historico.atualizar')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center">
            <RefreshCcw className="w-8 h-8 animate-spin mb-4" />
            {t('historico.a_carregar')}
          </div>
        ) : sessoes.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            {t('historico.vazio')}
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
                        {rotuloEstado(sessao.estado)}
                      </span>
                      <h3 className="font-bold text-slate-800 text-lg">
                        {sessao.caixa?.nome} ({sessao.caixa?.loja?.nome})
                      </h3>
                    </div>
                    <p className="text-sm text-slate-500">{t('historico.operador')}{' '}<span className="font-medium text-slate-700">{sessao.operador?.name}</span></p>
                    <div className="flex gap-6 mt-2 text-xs font-mono text-slate-500">
                      <span>{t('historico.abertura', { data: formatDataHora(sessao.dataAbertura) })}</span>
                      {sessao.dataFecho && (
                        <span>{t('historico.fecho', { data: formatDataHora(sessao.dataFecho) })}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase">{t('historico.faturado')}</p>
                      <p className="font-black text-lg text-slate-800">
                        {formatMoeda(sessao.saldoFinalCalculado - sessao.saldoInicial)}
                      </p>
                    </div>
                    {sessao.estado === 'FECHADA' && (
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase">{t('historico.quebra_sobra')}</p>
                        <div className="flex items-center gap-2 justify-end">
                          <p className={`font-black text-lg ${
                            (sessao.diferenca ?? (sessao.saldoFinalDeclarado - sessao.saldoFinalCalculado)) < 0 ? 'text-rose-600' :
                            (sessao.diferenca ?? (sessao.saldoFinalDeclarado - sessao.saldoFinalCalculado)) > 0 ? 'text-emerald-600' : 'text-slate-500'
                          }`}>
                            {formatMoeda(sessao.diferenca ?? (sessao.saldoFinalDeclarado - sessao.saldoFinalCalculado))}
                          </p>
                          {(sessao.diferenca ?? (sessao.saldoFinalDeclarado - sessao.saldoFinalCalculado)) < 0 && (
                            <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider" title={t('historico.quebra_negativa')}>
                              {t('historico.alerta')}
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
                      <Receipt className="w-5 h-5 text-blue-500" />{' '}
                      {t('historico.vendas_associadas', { n: sessao.vendas?.length || 0 })}
                    </h4>
                    
                    {(!sessao.vendas || sessao.vendas.length === 0) ? (
                      <p className="text-sm text-slate-500 italic">{t('historico.sem_vendas')}</p>
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <TableScroll>
                        <table className="w-full text-left text-sm text-slate-600">
                          <thead className="bg-slate-100/50 border-b border-slate-200 text-slate-500 uppercase text-xs font-bold">
                            <tr>
                              <th className="px-4 py-3">{t('historico.col_fatura')}</th>
                              <th className="px-4 py-3">{t('historico.col_data_hora')}</th>
                              <th className="px-4 py-3">{t('historico.col_valor')}</th>
                              <th className="px-4 py-3 text-right">{t('historico.col_acao')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {sessao.vendas.map((venda: any) => {
                              const anulada = venda.estado === 'CANCELADA';
                              // A anulação devolve stock e retira numerário da gaveta, por
                              // isso exige a sessão aberta: uma sessão fechada já teve a
                              // quebra apurada e mexer nela invalidaria o fecho.
                              const podeAnular = !anulada && sessao.estado === 'ABERTA';

                              return (
                              <tr key={venda.id} className={`hover:bg-slate-50 ${anulada ? 'opacity-60' : ''}`}>
                                <td className="px-4 py-3 font-medium text-slate-800">
                                  <span className={anulada ? 'line-through' : ''}>{venda.numeroFatura}</span>
                                  {anulada && (
                                    <span className="ml-2 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700">
                                      {t('historico.anulada')}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs">{formatDataHora(venda.createdAt)}</td>
                                <td className={`px-4 py-3 font-bold ${anulada ? 'text-slate-400' : 'text-blue-600'}`}>{formatMoeda(venda.totalFinal)}</td>
                                <td className="px-4 py-3 text-right flex justify-end gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedReceipt({ ...venda, caixeiro: sessao.operador });
                                    }}
                                    className="text-slate-500 hover:text-emerald-600 p-1 rounded transition-colors"
                                    title={t('historico.ver_recibo')}
                                  >
                                    <Eye size={18} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadReceipt(venda);
                                    }}
                                    className="text-slate-500 hover:text-blue-600 p-1 rounded transition-colors"
                                    title={t('historico.descarregar_recibo')}
                                  >
                                    <Download size={18} />
                                  </button>
                                  {podeAnular && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setVendaParaAnular(venda);
                                      }}
                                      className="text-slate-500 hover:text-rose-600 p-1 rounded transition-colors"
                                      title={t('historico.anular_titulo')}
                                    >
                                      <Ban size={18} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        </TableScroll>
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

      {vendaParaAnular && (
        <div className="fixed inset-0 z-[70] bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-rose-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t('anular.titulo')}</h2>
                <p className="text-xs text-slate-500">
                  {vendaParaAnular.numeroFatura} · {formatMoeda(vendaParaAnular.totalFinal)}
                </p>
              </div>
              <button
                onClick={() => { setVendaParaAnular(null); setMotivoAnulacao(''); }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={confirmarAnulacao} className="p-6 space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                <p className="text-xs text-amber-800">
                  {t('anular.aviso_1')} <strong>{t('anular.aviso_forte')}</strong>{' '}
                  {t('anular.aviso_2')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('anular.motivo')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={motivoAnulacao}
                  onChange={(e) => setMotivoAnulacao(e.target.value)}
                  placeholder={t('anular.motivo_placeholder')}
                  minLength={5}
                  maxLength={255}
                  autoFocus
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-rose-500"
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  {t('anular.motivo_ajuda')}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setVendaParaAnular(null); setMotivoAnulacao(''); }}
                  className="px-5 py-2.5 text-slate-600 font-medium rounded-xl hover:bg-slate-100"
                >
                  {t('anular.cancelar')}
                </button>
                <button
                  type="submit"
                  disabled={motivoAnulacao.trim().length < 5 || isAnulando}
                  className="px-5 py-2.5 bg-rose-600 text-white font-medium rounded-xl hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isAnulando && <Loader2 size={16} className="animate-spin" />}
                  {t('anular.confirmar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
