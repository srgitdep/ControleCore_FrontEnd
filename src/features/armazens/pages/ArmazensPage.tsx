import { useState, useEffect } from 'react';
import { BarraDaPagina } from '@/shared/ui';
import {
  Box, Plus, Search, Edit2, X, Loader2, Store, Ban, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
  getLojas, getArmazensByLoja, createArmazem, updateArmazem, deleteArmazem, TIPOS_ARMAZEM,
} from '@/features/lojas';
import type { Armazem } from '@/features/lojas';
import { cn, mensagemDeErro } from '@/shared/utils';
import { ArmazemDetailsModal } from '../components/ArmazemDetailsModal';
import { rotuloTipoArmazem } from '../utils/rotuloTipoArmazem';

/** O armazém deste tipo é o ponto de venda da loja — só pode existir um. */
const TIPO_VENDA = 'VENDA';

interface LojaComArmazens {
  id: string;
  nome: string;
  armazens: Armazem[];
}

export function ArmazensPage() {
  const { t } = useTranslation('armazens');
  const [lojas, setLojas] = useState<LojaComArmazens[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ lojaId: '', nome: '', tipo: 'Reserva' });

  /** O armazém cujo conteúdo se está a ver. O nome da loja vai junto porque o nome
   *  do armazém sozinho é ambíguo entre lojas ("Reserva" existe em várias). */
  const [aVer, setAVer] = useState<{ armazem: Armazem; lojaNome: string } | null>(null);

  const carregar = async () => {
    setIsLoading(true);
    try {
      const listaLojas = await getLojas();
      const comArmazens = await Promise.all(
        (listaLojas ?? []).map(async (loja: any) => ({
          id: loja.id,
          nome: loja.nome,
          // A loja pode já trazer os armazéns; se não, busca-os.
          armazens: loja.armazens ?? (await getArmazensByLoja(loja.id)) ?? [],
        })),
      );
      setLojas(comArmazens);
    } catch (error) {
      toast.error(mensagemDeErro(error, t('pagina.erro_carregar')));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const abrirCriacao = (lojaId: string) => {
    setEditingId(null);
    setForm({ lojaId, nome: '', tipo: 'Reserva' });
    setShowModal(true);
  };

  const abrirEdicao = (lojaId: string, a: Armazem) => {
    setEditingId(a.id);
    setForm({ lojaId, nome: a.nome, tipo: a.tipo || 'Reserva' });
    setShowModal(true);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return toast.error(t('pagina.nome_obrigatorio'));

    setIsSaving(true);
    try {
      if (editingId) {
        await updateArmazem(editingId, { nome: form.nome, tipo: form.tipo });
        toast.success(t('pagina.actualizado'));
      } else {
        await createArmazem({ lojaId: form.lojaId, nome: form.nome, tipo: form.tipo });
        toast.success(t('pagina.criado'));
      }
      setShowModal(false);
      carregar();
    } catch (error) {
      // O backend recusa um segundo ponto de venda com mensagem explícita.
      toast.error(mensagemDeErro(error, t('pagina.erro_guardar')));
    } finally {
      setIsSaving(false);
    }
  };

  const desactivar = async (a: Armazem) => {
    if (
      !confirm(
        t('pagina.desactivar_confirmar', { nome: a.nome }),
      )
    )
      return;

    try {
      await deleteArmazem(a.id);
      toast.success(t('pagina.desactivado'));
      carregar();
    } catch (error) {
      toast.error(mensagemDeErro(error, t('pagina.erro_desactivar')));
    }
  };

  const reactivar = async (a: Armazem) => {
    try {
      await updateArmazem(a.id, { isActive: true });
      toast.success(t('pagina.reactivado'));
      carregar();
    } catch (error) {
      toast.error(mensagemDeErro(error, t('pagina.erro_reactivar')));
    }
  };

  const termo = searchTerm.trim().toLowerCase();
  const lojasVisiveis = lojas
    .map((loja) => ({
      ...loja,
      armazens: termo
        ? loja.armazens.filter(
            (a) =>
              a.nome.toLowerCase().includes(termo) ||
              (a.tipo ?? '').toLowerCase().includes(termo) ||
              loja.nome.toLowerCase().includes(termo),
          )
        : loja.armazens,
    }))
    .filter((loja) => !termo || loja.armazens.length > 0 || loja.nome.toLowerCase().includes(termo));

  const total = lojas.reduce((acc, l) => acc + l.armazens.length, 0);

  // Se a loja do formulário aberto já tem um armazém de venda activo. O armazém que se
  // está a editar não conta contra si mesmo: sem esta excepção, abrir um ponto de venda
  // para lhe mudar o nome mostrava o próprio tipo como indisponível.
  const lojaJaTemPontoVenda = lojas
    .find((l) => l.id === form.lojaId)
    ?.armazens.some(
      (a) =>
        a.id !== editingId &&
        a.isActive !== false &&
        a.tipo?.toUpperCase() === TIPO_VENDA,
    ) ?? false;
  const semPontoVenda = lojas.filter(
    (l) => !l.armazens.some((a) => a.isActive !== false && a.tipo?.toUpperCase() === TIPO_VENDA),
  );

  return (
    <div className="space-y-6">
      {/* O nome da secção vive no cabeçalho da aplicação. Aqui fica só a contagem,
          que é dado e não rótulo. */}
      <BarraDaPagina
        resumo={t('resumo.total', {
          armazens: t('resumo.armazens', { count: total }),
          lojas: t('resumo.lojas', { count: lojas.length }),
        })}
      />

      {/* Aviso: loja sem ponto de venda não pode vender */}
      {!isLoading && semPontoVenda.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">
              {t('aviso.sem_ponto_venda', { count: semPontoVenda.length })}
            </p>
            <p className="text-xs mt-0.5">
              {t('aviso.detalhe_1', { lojas: semPontoVenda.map((l) => l.nome).join(', ') })}{' '}
              <em>{t('tipo_armazem.venda')}</em>
              {t('aviso.detalhe_2')}
            </p>
          </div>
        </div>
      )}

      {/* Pesquisa */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('pesquisa.placeholder')}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
      </div>

      {/* Armazéns agrupados por loja */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-3" />
          {t('lista.a_carregar')}
        </div>
      ) : lojasVisiveis.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
          <Box className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          {termo ? t('lista.nada_corresponde', { termo: searchTerm }) : t('lista.sem_lojas')}
        </div>
      ) : (
        <div className="space-y-4">
          {lojasVisiveis.map((loja) => (
            <div
              key={loja.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
            >
              <div className="flex items-center justify-between p-4 bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Store size={18} className="text-slate-400" />
                  <h2 className="font-semibold text-slate-900">{loja.nome}</h2>
                  <span className="text-xs text-slate-500">
                    {t('lista.armazens_da_loja', { n: loja.armazens.length })}
                  </span>
                </div>
                <button
                  onClick={() => abrirCriacao(loja.id)}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                >
                  <Plus size={16} /> {t('lista.adicionar')}
                </button>
              </div>

              {loja.armazens.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  {t('lista.loja_vazia_1')} <em>{t('tipo_armazem.venda')}</em> {t('lista.loja_vazia_2')}
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {loja.armazens.map((a) => {
                    const ePontoVenda = a.tipo?.toUpperCase() === TIPO_VENDA;
                    const inactivo = a.isActive === false;

                    return (
                      <li
                        key={a.id}
                        className={cn(
                          'flex items-center justify-between p-4',
                          inactivo && 'opacity-60',
                        )}
                      >
                        {/* Um `<button>` só nesta zona, e não a envolver o `<li>`
                            inteiro: os três botões de acção à direita ficariam
                            aninhados dentro dele, o que é HTML inválido e faz o
                            clique disparar as duas acções. */}
                        <button
                          type="button"
                          onClick={() => setAVer({ armazem: a, lojaNome: loja.nome })}
                          title={t('lista.ver_produtos_title')}
                          className="flex flex-1 items-center gap-3 rounded-lg p-1 -m-1 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <div
                            className={cn(
                              'p-2 rounded-lg',
                              ePontoVenda
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-emerald-50 text-emerald-600',
                            )}
                          >
                            <Box size={18} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 flex items-center gap-2">
                              {a.nome}
                              {ePontoVenda && (
                                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                                  {t('lista.ponto_venda')}
                                </span>
                              )}
                              {inactivo && (
                                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                                  {t('lista.inactivo')}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500">
                              {t('lista.tipo_linha', { tipo: a.tipo ? rotuloTipoArmazem(t, a.tipo) : '—' })} ·{' '}
                              <span className="text-blue-600">{t('lista.ver_produtos')}</span>
                            </p>
                          </div>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => abrirEdicao(loja.id, a)}
                            title={t('lista.editar')}
                            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          {inactivo ? (
                            <button
                              onClick={() => reactivar(a)}
                              title={t('lista.reactivar')}
                              className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => desactivar(a)}
                              title={t('lista.desactivar')}
                              className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                            >
                              <Ban size={16} />
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500">
        {t('nota.o')} <strong>{t('nota.ponto_venda')}</strong> {t('nota.e_o_armazem_de_tipo')}{' '}
        <em>{t('tipo_armazem.venda')}</em>
        {t('nota.resto')}
      </p>

      {/* O que está dentro do armazém. Chega-se aqui clicando no armazém, que antes
          não fazia nada — saber o que lá estava obrigava a ir à secção Stock, onde as
          posições de todos os armazéns apareciam misturadas e sem filtro. */}
      {aVer && (
        <ArmazemDetailsModal
          armazem={aVer.armazem}
          lojaNome={aVer.lojaNome}
          onClose={() => setAVer(null)}
        />
      )}

      {/* Modal de criação/edição */}
      {showModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? t('formulario.editar_titulo') : t('formulario.novo_titulo')}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardar} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('formulario.nome')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder={t('formulario.nome_placeholder')}
                  autoFocus
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('formulario.tipo')}</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                >
                  {TIPOS_ARMAZEM.map((tipo) => {
                    // "Venda" desactivado quando a loja já tem o seu ponto de venda: o
                    // servidor recusa o segundo, e oferecer a opção só para depois falhar
                    // faz o utilizador preencher o formulário duas vezes para descobrir
                    // uma regra que já se sabia de antemão.
                    const bloqueado = tipo.toUpperCase() === TIPO_VENDA && lojaJaTemPontoVenda;
                    return (
                      <option key={tipo} value={tipo} disabled={bloqueado}>
                        {bloqueado
                          ? t('formulario.ja_existe_nesta_loja', { tipo: rotuloTipoArmazem(t, tipo) })
                          : rotuloTipoArmazem(t, tipo)}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-slate-500 mt-1.5">
                  <strong>{t('tipo_armazem.venda')}</strong> {t('formulario.ajuda_venda')}{' '}
                  <strong>{t('tipo_armazem.reserva')}</strong> {t('formulario.ajuda_reserva')}{' '}
                  <strong>{t('tipo_armazem.quebras')}</strong> {t('formulario.ajuda_quebras')}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-slate-600 font-medium rounded-xl hover:bg-slate-100"
                >
                  {t('formulario.cancelar')}
                </button>
                <button
                  type="submit"
                  disabled={!form.nome.trim() || isSaving}
                  className="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving && <Loader2 size={16} className="animate-spin" />}
                  {editingId ? t('formulario.guardar') : t('formulario.criar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
