import { AlertTriangle, Power, PowerOff, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { localeIntl } from '@/i18n';
import { Button } from '@/shared/ui';
import { mensagemDeErro } from '@/shared/utils';
import { useRelatorioExpiracao } from '../hooks/useAssinatura';

interface RelatorioExpiracaoModalProps {
  onClose: () => void;
  /** Abre a gestão da assinatura de uma empresa da lista. */
  onGerir: (empresaId: string) => void;
}

/**
 * Quem ficaria sem acesso se as datas das assinaturas passassem a contar (plano §4.15, D5).
 *
 * Só leitura: a expiração automática ainda não está ligada. É a lista a resolver — prolongar,
 * registar o pagamento ou suspender — antes de ligar, para ninguém ficar sem acesso por
 * surpresa.
 */
export function RelatorioExpiracaoModal({ onClose, onGerir }: RelatorioExpiracaoModalProps) {
  const { t } = useTranslation('empresas');
  const { data, isLoading, isError, error, refetch } = useRelatorioExpiracao(true);
  const data_ = (iso: string) => new Date(iso).toLocaleDateString(localeIntl());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{t('relatorio.titulo')}</h2>
            <p className="text-xs text-slate-500">{t('relatorio.subtitulo')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('acoes.fechar')}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto bg-slate-50/50 p-6">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-20 animate-pulse rounded-xl bg-slate-200" />
              <div className="h-40 animate-pulse rounded-xl bg-slate-200" />
            </div>
          ) : isError || !data ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-rose-100 bg-rose-50 p-6 text-center">
              <p className="text-sm text-rose-700">{mensagemDeErro(error, t('relatorio.erro'))}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                {t('assinatura.tentar_novamente')}
              </Button>
            </div>
          ) : (
            <>
              {/* Antes dos números: «ficariam sem acesso» lê-se de maneira diferente conforme
                  a expiração já esteja a cortar ou só cortaria quando for ligada. */}
              <p
                className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
                  data.expiracaoActiva
                    ? 'border-rose-200 bg-rose-50 text-rose-800'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                {data.expiracaoActiva ? (
                  <Power size={16} className="mt-0.5 shrink-0" />
                ) : (
                  <PowerOff size={16} className="mt-0.5 shrink-0" />
                )}
                <span>
                  <strong>
                    {data.expiracaoActiva ? t('relatorio.interruptor_ligado') : t('relatorio.interruptor_desligado')}
                  </strong>{' '}
                  {data.expiracaoActiva
                    ? t('relatorio.interruptor_ligado_texto')
                    : t('relatorio.interruptor_desligado_texto')}
                </span>
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Numero rotulo={t('relatorio.com_acesso')} valor={data.totais.empresasComAcesso} />
                <Numero rotulo={t('relatorio.em_dia')} valor={data.totais.emDia} />
                <Numero rotulo={t('relatorio.trial_expirado')} valor={data.totais.trialExpirado} destaque />
                <Numero rotulo={t('relatorio.pagamento_em_falta')} valor={data.totais.pagamentoEmFalta} destaque />
              </div>

              {data.afectadas.length === 0 ? (
                <p className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50 p-6 text-center text-sm text-emerald-700">
                  {t('relatorio.ninguem')}
                </p>
              ) : (
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="mb-3 flex items-start gap-2 text-xs text-amber-800">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    {t('relatorio.aviso', { total: data.totais.ficariamSemAcesso })}
                  </p>
                  <ul className="divide-y divide-slate-100">
                    {data.afectadas.map((a) => (
                      <li key={a.empresaId} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{a.empresaNome}</p>
                          <p className="text-xs text-slate-500">
                            {t(`relatorio.situacao.${a.situacao}`, { data: data_(a.fimDoAcesso), dias: a.diasDesdeOFim })}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => onGerir(a.empresaId)}>
                          {t('relatorio.gerir')}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {data.semAssinaturaActiva.length > 0 && (
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="mb-2 text-sm font-semibold text-slate-800">{t('relatorio.sem_assinatura')}</h3>
                  <ul className="flex flex-wrap gap-2">
                    {data.semAssinaturaActiva.map((e) => (
                      <li key={e.id}>
                        <button
                          type="button"
                          onClick={() => onGerir(e.id)}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
                        >
                          {e.nome}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <p className="text-center text-xs text-slate-400">
                {t('relatorio.gerado_em', { data: new Date(data.geradoEm).toLocaleString(localeIntl()) })}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Numero({ rotulo, valor, destaque }: { rotulo: string; valor: number; destaque?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-xs text-slate-500">{rotulo}</p>
      <p className={`text-xl font-bold ${destaque && valor > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{valor}</p>
    </div>
  );
}
