import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Clock, FileText, Loader2, Plus, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
  DOCUMENTOS_OBRIGATORIOS,
  TIPOS_DOCUMENTO,
  TipoDocumento,
  portal,
} from '../api/portal.api';
import type { DocumentoFornecedor } from '../api/portal.api';
import { usePortalStore } from '../store/usePortalStore';
import { cn, formatData, mensagemDeErro } from '@/shared/utils';

/**
 * Os documentos de habilitação do fornecedor.
 *
 * ## Quem verifica não é quem submete
 *
 * O fornecedor submete; a plataforma verifica. Se fosse ele a marcar os próprios documentos
 * como válidos, a verificação seria um formulário — carregava qualquer PDF e declarava-se
 * habilitado.
 *
 * Por isso todos os documentos nascem `PENDENTE`, e este ecrã não tem nenhuma acção que mude
 * o estado. O que tem é a distinção clara entre o que **impede** a compra e o que só desconta
 * na pontuação: alvará e quitação fiscal excluem das comparações; INSS e seguro não.
 */
export function DocumentosPage() {
  const { t } = useTranslation('portal');
  const queryClient = useQueryClient();
  const carregar = usePortalStore((s) => s.carregar);
  const [aSubmeter, setASubmeter] = useState(false);

  const { data: documentos, isLoading } = useQuery({
    queryKey: ['portal-documentos'],
    queryFn: portal.listarDocumentos,
  });

  const recarregar = () => {
    queryClient.invalidateQueries({ queryKey: ['portal-documentos'] });
    // O painel de conformidade no topo do layout tem de reflectir o documento novo —
    // continua a dizer «não entregue» até ser relido do servidor.
    void carregar();
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-slate-900">{t('documentos.titulo')}</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            {t('documentos.subtitulo')}
          </p>
        </div>
        <button
          onClick={() => setASubmeter(true)}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={15} />
          {t('documentos.submeter')}
        </button>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={22} className="animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          <Exigencias documentos={documentos ?? []} />

          {documentos && documentos.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-medium text-slate-700">{t('documentos.submetidos')}</h2>
              <ul className="space-y-2">
                {documentos.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex flex-wrap items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
                  >
                    <FileText size={15} className="mt-0.5 shrink-0 text-slate-400" />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">
                          {t(`documento.${doc.tipo}`)}
                          {doc.tipo === 'OUTRO' && doc.descricao ? ` — ${doc.descricao}` : ''}
                        </span>
                        <EtiquetaEstadoDoc estado={doc.estado} />
                      </div>

                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                        {doc.numero && <span className="font-mono">{doc.numero}</span>}
                        {doc.entidadeEmissora && <span>{doc.entidadeEmissora}</span>}
                        {doc.validoAte ? (
                          <span
                            className={
                              new Date(doc.validoAte) < new Date()
                                ? 'font-medium text-red-600'
                                : undefined
                            }
                          >
                            {t('documentos.valido_ate', { data: formatData(doc.validoAte) })}
                          </span>
                        ) : (
                          <span>{t('documentos.sem_validade')}</span>
                        )}
                      </p>

                      {doc.motivoDecisao && (
                        <p
                          className={cn(
                            'mt-1.5 rounded px-2 py-1 text-[11px] leading-snug',
                            doc.estado === 'RECUSADO'
                              ? 'bg-red-50 text-red-800'
                              : 'bg-slate-50 text-slate-600',
                          )}
                        >
                          <strong>
                            {doc.estado === 'RECUSADO' ? t('documentos.motivo_recusa') : t('documentos.nota')}
                          </strong>{' '}
                          {doc.motivoDecisao}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {aSubmeter && (
        <SubmeterModal onClose={() => setASubmeter(false)} onSuccess={recarregar} />
      )}
    </div>
  );
}

/**
 * O que é exigido, separado por consequência.
 *
 * Mostrar as cinco exigências numa lista única faria o fornecedor tratar o alvará — sem o
 * qual não vende nada — como o seguro de responsabilidade, que só lhe custa alguns pontos.
 * A diferença entre as duas é estar ou não no mercado.
 */
function Exigencias({ documentos }: { documentos: DocumentoFornecedor[] }) {
  const { t } = useTranslation('portal');
  const hoje = new Date();

  const vale = (tipo: TipoDocumento) => {
    const doc = documentos.find((d) => d.tipo === tipo);
    if (!doc || doc.estado !== 'VALIDO') return false;
    return !doc.validoAte || new Date(doc.validoAte) >= hoje;
  };

  const estado = (tipo: TipoDocumento) => {
    const doc = documentos.find((d) => d.tipo === tipo);
    if (!doc) return t('documentos.estado_em_falta');
    if (doc.estado === 'PENDENTE') return t('documentos.estado_aguarda');
    if (doc.estado === 'RECUSADO') return t('documentos.estado_recusado');
    if (doc.estado === 'EXPIRADO') return t('documentos.estado_expirado');
    if (doc.validoAte && new Date(doc.validoAte) < hoje) return t('documentos.estado_expirado');
    return t('documentos.estado_valido');
  };

  const RECOMENDAVEIS: TipoDocumento[] = ['INSCRICAO_INSS', 'SEGURO_RESPONSABILIDADE'];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <section className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-amber-900">
          <AlertTriangle size={14} />
          {t('documentos.obrigatorios')}
        </h2>
        <p className="mt-0.5 text-[11px] leading-snug text-amber-800">
          {t('documentos.obrigatorios_ajuda')}
        </p>
        <ul className="mt-2.5 space-y-1.5">
          {DOCUMENTOS_OBRIGATORIOS.map((tipo) => (
            <li key={tipo} className="flex items-center gap-2 text-xs">
              {vale(tipo) ? (
                <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
              ) : (
                <XCircle size={13} className="shrink-0 text-amber-600" />
              )}
              <span className="text-slate-800">{t(`documento.${tipo}`)}</span>
              <span className="ml-auto text-[11px] text-slate-500">{estado(tipo)}</span>
            </li>
          ))}
          {/* A conta bancária não é um documento e não se submete aqui — passa pelo circuito
              de aprovação por segunda pessoa da organização. Listá-la sem acção deixaria o
              fornecedor a procurar um botão que não existe; por isso é dito onde vive. */}
          <li className="flex items-start gap-2 border-t border-amber-200/60 pt-1.5 text-[11px] leading-snug text-amber-800">
            <AlertTriangle size={11} className="mt-0.5 shrink-0" />
            <span>
              {t('documentos.banco_antes')} <strong>{t('documentos.banco_nome')}</strong>{' '}
              {t('documentos.banco_depois')}
            </span>
          </li>
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-800">{t('documentos.recomendados')}</h2>
        <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
          {t('documentos.recomendados_ajuda')}
        </p>
        <ul className="mt-2.5 space-y-1.5">
          {RECOMENDAVEIS.map((tipo) => (
            <li key={tipo} className="flex items-center gap-2 text-xs">
              {vale(tipo) ? (
                <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
              ) : (
                <Clock size={13} className="shrink-0 text-slate-300" />
              )}
              <span className="text-slate-800">{t(`documento.${tipo}`)}</span>
              <span className="ml-auto text-[11px] text-slate-500">{estado(tipo)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2.5 border-t border-slate-100 pt-2 text-[11px] leading-snug text-slate-500">
          {t('documentos.sanitaria_antes')} <strong>{t('documentos.sanitaria_nome')}</strong>{' '}
          {t('documentos.sanitaria_depois')}
        </p>
      </section>
    </div>
  );
}

const CORES_DOC: Record<DocumentoFornecedor['estado'], string> = {
  PENDENTE: 'bg-blue-100 text-blue-700',
  VALIDO: 'bg-emerald-100 text-emerald-700',
  EXPIRADO: 'bg-amber-100 text-amber-700',
  RECUSADO: 'bg-red-100 text-red-700',
};

function EtiquetaEstadoDoc({ estado }: { estado: DocumentoFornecedor['estado'] }) {
  const { t } = useTranslation('portal');
  return (
    <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', CORES_DOC[estado])}>
      {t(`estadoDocumento.${estado}`)}
    </span>
  );
}

function SubmeterModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation('portal');
  const [f, setF] = useState({
    tipo: 'ALVARA' as TipoDocumento,
    descricao: '',
    numero: '',
    entidadeEmissora: '',
    ficheiroUrl: '',
    emitidoEm: '',
    validoAte: '',
  });

  const submeter = useMutation({
    mutationFn: () =>
      portal.submeterDocumento({
        tipo: f.tipo,
        descricao: f.descricao.trim() || undefined,
        numero: f.numero.trim() || undefined,
        entidadeEmissora: f.entidadeEmissora.trim() || undefined,
        ficheiroUrl: f.ficheiroUrl.trim() || undefined,
        emitidoEm: f.emitidoEm ? new Date(`${f.emitidoEm}T00:00:00`).toISOString() : undefined,
        validoAte: f.validoAte ? new Date(`${f.validoAte}T23:59:59`).toISOString() : undefined,
      }),
    onSuccess: () => {
      toast.success(t('documentos.submetido'));
      onSuccess();
      onClose();
    },
    onError: (e: any) => toast.error(mensagemDeErro(e, t('documentos.erro_submeter'))),
  });

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();

    if (f.tipo === 'OUTRO' && !f.descricao.trim()) {
      toast.error(t('documentos.descreva_outro'));
      return;
    }

    submeter.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4">
      <form onSubmit={enviar} className="my-4 w-full max-w-lg rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t('documentos.submeter')}</h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-400">
            <XCircle size={18} />
          </button>
        </header>

        <div className="space-y-4 px-5 py-5">
          <div>
            <label className="block text-xs font-medium text-slate-700">{t('documentos.tipo')}</label>
            <select
              value={f.tipo}
              onChange={(e) => setF({ ...f, tipo: e.target.value as TipoDocumento })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              {TIPOS_DOCUMENTO.map((valor) => (
                <option key={valor} value={valor}>
                  {DOCUMENTOS_OBRIGATORIOS.includes(valor)
                    ? t('documentos.tipo_obrigatorio', { tipo: t(`documento.${valor}`) })
                    : t(`documento.${valor}`)}
                </option>
              ))}
            </select>
          </div>

          {f.tipo === 'OUTRO' && (
            <div>
              <label className="block text-xs font-medium text-slate-700">
                {t('documentos.que_documento')}
              </label>
              <input
                value={f.descricao}
                onChange={(e) => setF({ ...f, descricao: e.target.value })}
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700">{t('documentos.numero')}</label>
              <input
                value={f.numero}
                onChange={(e) => setF({ ...f, numero: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">{t('documentos.entidade_emissora')}</label>
              <input
                value={f.entidadeEmissora}
                onChange={(e) => setF({ ...f, entidadeEmissora: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">{t('documentos.emitido_em')}</label>
              <input
                type="date"
                value={f.emitidoEm}
                onChange={(e) => setF({ ...f, emitidoEm: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">{t('documentos.valido_ate_label')}</label>
              <input
                type="date"
                value={f.validoAte}
                onChange={(e) => setF({ ...f, validoAte: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <p className="mt-1 text-[11px] leading-snug text-slate-500">
                {t('documentos.validade_ajuda')}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">
              {t('documentos.endereco')}
            </label>
            <input
              value={f.ficheiroUrl}
              onChange={(e) => setF({ ...f, ficheiroUrl: e.target.value })}
              placeholder="https://…"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
            />
            {/* O carregamento de ficheiros não está construído. Dizê-lo é melhor do que ter um
                botão de anexo que não funciona — e quem verifica precisa de conseguir ver o
                documento de alguma forma. */}
            <p className="mt-1 text-[11px] leading-snug text-slate-500">
              {t('documentos.endereco_ajuda')}
            </p>
          </div>
        </div>

        <footer className="flex justify-end gap-2 rounded-b-xl border-t border-slate-100 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
          >
            {t('comum.cancelar')}
          </button>
          <button
            type="submit"
            disabled={submeter.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submeter.isPending && <Loader2 size={15} className="animate-spin" />}
            {t('documentos.submeter_btn')}
          </button>
        </footer>
      </form>
    </div>
  );
}
