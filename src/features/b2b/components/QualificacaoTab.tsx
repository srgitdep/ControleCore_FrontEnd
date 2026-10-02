import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Landmark,
  Loader2,
  ShieldCheck,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  DOCUMENTOS_BLOQUEANTES,
  eTipoDocumento,
  qualificacaoApi,
} from '../api/qualificacao.api';
import type { OrganizacaoNaFila } from '../api/qualificacao.api';
import { ContasBancariasModal } from '@/features/fornecedores';
import { cn, formatData, mensagemDeErro } from '@/shared/utils';

/**
 * A fila de verificação documental dos fornecedores.
 *
 * ## Porque este ecrã tem de existir
 *
 * Um fornecedor auto-registado **não tem relação com nenhuma empresa** — a relação nasce na
 * adjudicação. Não aparece em `/fornecedores`, que é o único sítio onde alguém vê
 * fornecedores.
 *
 * Sem esta fila, ele submete o alvará e fica à espera para sempre: ninguém sabe que existe.
 * O registo público produziria fornecedores invisíveis, e a funcionalidade não teria oferta.
 *
 * ## Verificar não é aprovar a compra
 *
 * Aqui diz-se «este alvará é válido». Se se compra a este fornecedor é `estadoRelacao`, que é
 * de cada empresa e vive no separador Fornecedores. São duas perguntas diferentes, e este
 * ecrã não faz a segunda.
 */
export function QualificacaoTab() {
  const { t } = useTranslation('b2b');
  const [aberta, setAberta] = useState<OrganizacaoNaFila | null>(null);

  // A conta bancária é o terceiro requisito bloqueante, e não se submete pelo portal:
  // passa pelo circuito de duplo controlo da organização — quem pede não aprova.
  //
  // O `ContasBancariasModal` já existia e já trabalha por `organizacaoId`, mas só era
  // alcançável a partir da lista de relações `Fornecedor`. Um fornecedor auto-registado
  // não tem relação nenhuma, pelo que a conta dele ficava sem forma de ser aprovada — e
  // sem ela é excluído de todas as comparações, para sempre.
  const [contasDe, setContasDe] = useState<OrganizacaoNaFila | null>(null);

  const queryClient = useQueryClient();

  const { data: fila, isLoading } = useQuery({
    queryKey: ['qualificacao-pendentes'],
    queryFn: qualificacaoApi.pendentes,
  });

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold text-slate-900">{t('qual.titulo')}</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {t('qual.subtitulo')}
        </p>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={22} className="animate-spin text-slate-400" />
        </div>
      ) : !fila || fila.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 py-14 text-center">
          <ShieldCheck size={26} className="mx-auto text-slate-300" />
          <p className="mt-2 text-sm text-slate-600">{t('qual.nada')}</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-snug text-slate-500">
            {t('qual.nada_ajuda')}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {fila.map((org) => (
            <li
              key={org.organizacaoId}
              className="flex flex-wrap items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
            >
              <Building2 size={16} className="mt-0.5 shrink-0 text-slate-400" />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">
                    {org.nomeComercial ?? org.razaoSocial}
                  </span>

                  {org.semRelacoes && (
                    <span
                      className="inline-flex items-center gap-1 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700"
                      title={t('qual.auto_registo_ajuda')}
                    >
                      <Sparkles size={9} />
                      {t('qual.auto_registo')}
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                    <Clock size={9} />
                    {t('qual.por_verificar_n', { n: org.documentosPendentes })}
                  </span>
                </div>

                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                  {org.nuit && <span className="font-mono">NUIT {org.nuit}</span>}
                  {org.sede && <span>{org.sede}</span>}
                  <span>{t('qual.artigos_publicados', { n: org.artigosPublicados })}</span>
                  <span
                    className={
                      org.temContaBancariaActiva ? 'text-emerald-600' : 'text-amber-600'
                    }
                  >
                    {org.temContaBancariaActiva ? t('qual.conta_aprovada') : t('qual.sem_conta')}
                  </span>
                </p>

                {org.submissaoMaisAntiga && (
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {t('qual.a_espera_desde')} {formatData(org.submissaoMaisAntiga)} (
                    {diasDesde(org.submissaoMaisAntiga, t)})
                  </p>
                )}
              </div>

              <div className="flex shrink-0 gap-1.5">
                {/* Só quando falta. Uma conta já aprovada não precisa de botão, e mostrá-lo
                    convidaria a abrir o circuito de alteração de IBAN sem motivo — que é
                    exactamente o que o duplo controlo existe para tornar deliberado. */}
                {!org.temContaBancariaActiva && (
                  <button
                    onClick={() => setContasDe(org)}
                    className="inline-flex items-center gap-1 rounded-md border border-amber-300 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50"
                    title={t('qual.conta_ajuda')}
                  >
                    <Landmark size={12} />
                    {t('qual.conta_bancaria')}
                  </button>
                )}
                <button
                  onClick={() => setAberta(org)}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                >
                  {t('qual.verificar')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {aberta && <VerificarModal organizacao={aberta} onClose={() => setAberta(null)} />}

      {contasDe && (
        <ContasBancariasModal
          organizacaoId={contasDe.organizacaoId}
          nomeFornecedor={contasDe.nomeComercial ?? contasDe.razaoSocial}
          onClose={() => {
            setContasDe(null);
            // A fila mostra `temContaBancariaActiva` em cada linha; sem esta invalidação
            // continuaria a dizer «sem conta bancária» depois de a conta ser aprovada.
            queryClient.invalidateQueries({ queryKey: ['qualificacao-pendentes'] });
            queryClient.invalidateQueries({ queryKey: ['qualificacao-estado'] });
          }}
        />
      )}
    </div>
  );
}

function diasDesde(iso: string, t: TFunction<'b2b'>): string {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias === 0) return t('qual.hoje');
  if (dias === 1) return t('qual.ha_1_dia');
  return t('qual.ha_n_dias', { n: dias });
}

/**
 * Verificar os documentos de uma organização.
 *
 * ## A conformidade é relida depois de cada decisão
 *
 * O backend devolve-a na resposta da própria verificação. Sem isso, o operador aprova o
 * alvará, vê a lista actualizar-se, e não fica a saber que o fornecedor continua fora das
 * comparações por não ter conta bancária aprovada — e o fornecedor espera sem saber do quê.
 */
function VerificarModal({
  organizacao,
  onClose,
}: {
  organizacao: OrganizacaoNaFila;
  onClose: () => void;
}) {
  const { t } = useTranslation('b2b');
  const queryClient = useQueryClient();
  const [aRecusar, setARecusar] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['qualificacao-estado', organizacao.organizacaoId],
    queryFn: () => qualificacaoApi.estado(organizacao.organizacaoId),
  });

  const decidir = useMutation({
    mutationFn: ({
      documentoId,
      decisao,
      motivo,
    }: {
      documentoId: string;
      decisao: 'VALIDO' | 'RECUSADO';
      motivo?: string;
    }) => qualificacaoApi.verificar(organizacao.organizacaoId, documentoId, { decisao, motivo }),
    onSuccess: (resultado) => {
      toast.success(
        resultado.conformidade.conforme
          ? t('qual.verificado_ok')
          : t('qual.verificado_resumo', { resumo: resultado.conformidade.resumo }),
        { duration: 7000 },
      );
      setARecusar(null);
      setMotivo('');
      queryClient.invalidateQueries({ queryKey: ['qualificacao-estado'] });
      queryClient.invalidateQueries({ queryKey: ['qualificacao-pendentes'] });
    },
    onError: (e: unknown) => toast.error(mensagemDeErro(e, t('qual.erro_decisao'))),
  });

  const recusar = (documentoId: string) => {
    if (motivo.trim().length < 5) {
      toast.error(t('qual.erro_motivo'));
      return;
    }
    decidir.mutate({ documentoId, decisao: 'RECUSADO', motivo: motivo.trim() });
  };

  const pendentes = data?.documentos.filter((d) => d.estado === 'PENDENTE') ?? [];
  const decididos = data?.documentos.filter((d) => d.estado !== 'PENDENTE') ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4">
      <div className="my-4 w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <header className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {organizacao.nomeComercial ?? organizacao.razaoSocial}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {organizacao.razaoSocial}
              {organizacao.nuit ? ` · NUIT ${organizacao.nuit}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-5 px-5 py-5">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={20} className="animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              {data && <ResumoConformidade conformidade={data.conformidade} />}

              {pendentes.length > 0 && (
                <section>
                  <h3 className="text-sm font-medium text-slate-800">{t('qual.sec_por_verificar')}</h3>
                  <ul className="mt-2 space-y-2">
                    {pendentes.map((doc) => (
                      <li key={doc.id} className="rounded-lg border border-blue-200 bg-blue-50/40 p-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-900">
                              <FileText size={14} className="text-slate-400" />
                              {eTipoDocumento(doc.tipo) ? t(`qual.documento.${doc.tipo}`) : doc.tipo}
                              {doc.tipo === 'OUTRO' && doc.descricao ? ` — ${doc.descricao}` : ''}
                              {DOCUMENTOS_BLOQUEANTES.includes(doc.tipo) && (
                                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                                  {t('qual.obrigatorio')}
                                </span>
                              )}
                            </p>

                            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                              {doc.numero && <span className="font-mono">{doc.numero}</span>}
                              {doc.entidadeEmissora && <span>{doc.entidadeEmissora}</span>}
                              {doc.emitidoEm && (
                                <span>
                                  {t('qual.emitido')} {formatData(doc.emitidoEm)}
                                </span>
                              )}
                              {doc.validoAte ? (
                                <span
                                  className={
                                    new Date(doc.validoAte) < new Date()
                                      ? 'font-medium text-red-600'
                                      : undefined
                                  }
                                >
                                  {t('qual.valido_ate')} {formatData(doc.validoAte)}
                                  {new Date(doc.validoAte) < new Date() && ` — ${t('qual.ja_expirou')}`}
                                </span>
                              ) : (
                                <span>{t('qual.sem_validade')}</span>
                              )}
                            </p>

                            {doc.ficheiroUrl && (
                              <a
                                href={doc.ficheiroUrl}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                              >
                                <ExternalLink size={11} />
                                {t('qual.abrir_documento')}
                              </a>
                            )}
                          </div>

                          {aRecusar !== doc.id && (
                            <div className="flex shrink-0 gap-1.5">
                              <button
                                onClick={() =>
                                  decidir.mutate({ documentoId: doc.id, decisao: 'VALIDO' })
                                }
                                disabled={decidir.isPending}
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                <CheckCircle2 size={12} />
                                {t('qual.valido')}
                              </button>
                              <button
                                onClick={() => {
                                  setARecusar(doc.id);
                                  setMotivo('');
                                }}
                                className="inline-flex items-center gap-1 rounded-md border border-red-300 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                              >
                                <XCircle size={12} />
                                {t('qual.recusar')}
                              </button>
                            </div>
                          )}
                        </div>

                        {aRecusar === doc.id && (
                          <div className="mt-3 border-t border-blue-200 pt-3">
                            <label className="block text-xs font-medium text-slate-700">
                              {t('qual.motivo_recusa')}
                            </label>
                            <textarea
                              value={motivo}
                              onChange={(e) => setMotivo(e.target.value)}
                              rows={2}
                              autoFocus
                              placeholder={t('qual.motivo_ph')}
                              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                            />
                            <p className="mt-1 text-[11px] leading-snug text-slate-500">
                              {t('qual.motivo_ajuda')}
                            </p>
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => recusar(doc.id)}
                                disabled={decidir.isPending}
                                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                {t('qual.confirmar_recusa')}
                              </button>
                              <button
                                onClick={() => setARecusar(null)}
                                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                              >
                                {t('acao.cancelar')}
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {decididos.length > 0 && (
                <section>
                  <h3 className="text-sm font-medium text-slate-800">{t('qual.sec_decididos')}</h3>
                  <ul className="mt-2 space-y-1.5">
                    {decididos.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex flex-wrap items-center gap-2 rounded border border-slate-200 px-3 py-2 text-xs"
                      >
                        <span className="text-slate-800">
                          {eTipoDocumento(doc.tipo) ? t(`qual.documento.${doc.tipo}`) : doc.tipo}
                        </span>
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[10px] font-medium',
                            doc.estado === 'VALIDO'
                              ? 'bg-emerald-100 text-emerald-700'
                              : doc.estado === 'EXPIRADO'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700',
                          )}
                        >
                          {t(`qual.estado_doc.${doc.estado as 'VALIDO' | 'EXPIRADO' | 'RECUSADO' | 'PENDENTE'}`)}
                        </span>
                        {doc.motivoDecisao && (
                          <span className="min-w-0 text-slate-500">— {doc.motivoDecisao}</span>
                        )}
                        {doc.verificadoEm && (
                          <span className="ml-auto text-[11px] text-slate-400">
                            {formatData(doc.verificadoEm)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>

        <footer className="flex justify-end rounded-b-xl border-t border-slate-100 bg-slate-50 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
          >
            {t('acao.fechar')}
          </button>
        </footer>
      </div>
    </div>
  );
}

function ResumoConformidade({
  conformidade,
}: {
  conformidade: { conforme: boolean; resumo: string; faltas: { bloqueante: boolean; mensagem: string }[] };
}) {
  const { t } = useTranslation('b2b');
  const bloqueantes = conformidade.faltas.filter((f) => f.bloqueante);

  return (
    <div
      className={cn(
        'rounded-lg border px-4 py-3',
        conformidade.conforme
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-amber-300 bg-amber-50',
      )}
    >
      <div className="flex items-start gap-2">
        {conformidade.conforme ? (
          <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />
        ) : (
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" />
        )}
        <div>
          <p
            className={cn(
              'text-sm font-medium',
              conformidade.conforme ? 'text-emerald-900' : 'text-amber-900',
            )}
          >
            {conformidade.conforme
              ? t('qual.habilitado')
              : t('qual.fora_comparacoes')}
          </p>
          {bloqueantes.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {bloqueantes.map((f, i) => (
                <li key={i} className="text-xs leading-snug text-amber-800">
                  • {f.mensagem}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
