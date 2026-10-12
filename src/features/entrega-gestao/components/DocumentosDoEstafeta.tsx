import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck, X } from 'lucide-react';
import { cn } from '@/shared/utils';
import { useConferirDocumentos, useDocumentosDoEstafeta } from '../hooks/useOperacao';
import type { DadosDoDocumento, DocumentoParaGestao } from '../types/operacao';

/** `numeroDoDocumento` → «numero do documento». Os campos vêm do servidor tal e qual; não vale um catálogo por campo. */
const etiquetaDoCampo = (campo: string) =>
  campo
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());

/** Os campos em que o estafeta mudou o que a IA tinha lido — é onde um olho humano deve parar. */
function camposCorrigidos(dados: DadosDoDocumento | null, lidos: DadosDoDocumento | null): Set<string> {
  if (!dados || !lidos) return new Set();
  return new Set(Object.keys(dados).filter((k) => lidos[k] !== undefined && String(lidos[k]) !== String(dados[k])));
}

function CartaoDeDocumento({ documento }: { documento: DocumentoParaGestao }) {
  const { t } = useTranslation('entrega');
  const corrigidos = camposCorrigidos(documento.dados, documento.dadosLidos);

  return (
    <section className="rounded-xl border border-slate-200 p-3">
      <h3 className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-900">
        {t(`documentos.tipo.${documento.tipo}`)}
        {documento.imagensSubstituidas > 0 && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            {t('documentos.substituidas', { count: documento.imagensSubstituidas })}
          </span>
        )}
      </h3>

      {documento.imagens.length === 0 ? (
        <p className="mt-2 text-xs text-amber-700">{t('documentos.sem_imagem')}</p>
      ) : (
        <ul className="mt-2 grid grid-cols-2 gap-2">
          {documento.imagens.map((i) => (
            <li key={i.id}>
              {/* Abre em separado: o URL vale 5 minutos e a fotografia, ao tamanho real, é o que se vem conferir. */}
              <a href={i.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <img src={i.url} alt={t(`documentos.lado.${i.lado}`)} loading="lazy" className="h-32 w-full object-cover" />
              </a>
              <p className="mt-0.5 text-[11px] text-slate-500">{t(`documentos.lado.${i.lado}`)}</p>
            </li>
          ))}
        </ul>
      )}

      {documento.dados && (
        <dl className="mt-3 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
          {Object.entries(documento.dados).map(([campo, valor]) => (
            <div key={campo} className="min-w-0">
              <dt className="text-[11px] text-slate-500">{etiquetaDoCampo(campo)}</dt>
              <dd className={cn('break-words text-sm text-slate-900', corrigidos.has(campo) && 'font-semibold text-amber-800')}>
                {String(valor)}
                {corrigidos.has(campo) && <span className="ml-1.5 text-[10px] font-bold uppercase">{t('documentos.corrigido')}</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {!documento.confirmadoEm && documento.tipo !== 'FOTO_VEICULO' && documento.tipo !== 'FOTO_ROSTO' && (
        <p className="mt-2 text-xs text-amber-700">{t('documentos.nao_confirmado')}</p>
      )}
    </section>
  );
}

/**
 * Os documentos de um estafeta, para a gestão (plano §4.9, F4). Cada abertura fica na auditoria do servidor (quem viu),
 * pelo que só se abre a pedido — nunca em segundo plano. `ambito` escolhe a rota: a frota própria vê os seus, o Super
 * Admin os da plataforma.
 *
 * Os campos corrigidos pelo estafeta (diferentes do que a IA leu) destacam-se: uma correcção legítima é comum, mas é
 * também o sítio onde um número falsificado apareceria.
 */
export function DocumentosDoEstafeta({
  estafetaId,
  ambito,
  podeConferir,
  aoFechar,
}: {
  estafetaId: string;
  ambito: 'EMPRESA' | 'PLATAFORMA';
  podeConferir: boolean;
  aoFechar: () => void;
}) {
  const { t } = useTranslation('entrega');
  const consulta = useDocumentosDoEstafeta(estafetaId, ambito);
  const conferir = useConferirDocumentos(ambito);
  const dados = consulta.data;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="documentos-titulo">
      <div className="w-full max-w-2xl space-y-4 overflow-y-auto rounded-xl bg-white p-5 shadow-xl" style={{ maxHeight: '90vh' }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="documentos-titulo" className="text-base font-bold text-slate-900">
              {t('documentos.titulo')}
            </h2>
            {dados && (
              <p className="mt-0.5 text-xs text-slate-500">
                {dados.estafeta.nome} · <span className="font-mono">{dados.estafeta.codigo}</span>
              </p>
            )}
          </div>
          <button type="button" onClick={aoFechar} aria-label={t('dialogo.cancelar')} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {consulta.isLoading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : consulta.isError || !dados ? (
          <p className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle size={16} />
            {t('documentos.erro')}
          </p>
        ) : (
          <>
            <p className="text-xs text-slate-500">{t('documentos.aviso_auditoria')}</p>

            <dl className="grid gap-x-4 gap-y-1.5 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[11px] text-slate-500">{t('estafetas.telefone')}</dt>
                <dd className="text-slate-900">{dados.estafeta.telefone}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-slate-500">{t('estafetas.email')}</dt>
                <dd className="break-all text-slate-900">{dados.estafeta.email ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-slate-500">{t('documentos.emergencia')}</dt>
                <dd className="text-slate-900">
                  {[dados.estafeta.contactoEmergenciaNome, dados.estafeta.contactoEmergenciaTelefone].filter(Boolean).join(' · ') || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-slate-500">{t('estafetas.veiculo')}</dt>
                <dd className="text-slate-900">{[dados.estafeta.veiculo, dados.estafeta.matricula].filter(Boolean).join(' · ') || '—'}</dd>
              </div>
            </dl>

            {dados.documentos.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">{t('documentos.vazio')}</p>
            ) : (
              <div className="space-y-3">
                {dados.documentos.map((d) => (
                  <CartaoDeDocumento key={d.tipo} documento={d} />
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
              {dados.estafeta.documentosConferidosEm ? (
                <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <CheckCircle2 size={14} />
                  {t('documentos.conferido_em', { data: new Date(dados.estafeta.documentosConferidosEm).toLocaleDateString() })}
                </p>
              ) : (
                <p className="text-xs text-slate-500">{t('documentos.por_conferir')}</p>
              )}
              {podeConferir && !dados.estafeta.documentosConferidosEm && (
                <button
                  type="button"
                  disabled={conferir.isPending}
                  onClick={() => conferir.mutate(estafetaId, { onSuccess: aoFechar })}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {conferir.isPending ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  {t('documentos.conferir')}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
