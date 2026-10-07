import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, X } from 'lucide-react';
import { formatMoeda } from '@/shared/utils';
import { METODOS_COBRANCA, MOTIVOS_FALHA } from '../types/operacao';
import type { EntregaPainel, Estafeta, MetodoCobranca, MotivoFalha } from '../types/operacao';

const classeCampo =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none';

interface BaseProps {
  titulo: string;
  aoFechar: () => void;
  children: ReactNode;
}

/** A casca comum dos diálogos: título, fecho e conteúdo. O `Esc` e o clique fora fecham-no. */
function Casca({ titulo, aoFechar, children }: BaseProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}
      onKeyDown={(e) => e.key === 'Escape' && aoFechar()}
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">{titulo}</h2>
          <button type="button" onClick={aoFechar} aria-label="×" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 p-5">{children}</div>
      </div>
    </div>
  );
}

interface RodapeProps {
  aoFechar: () => void;
  confirmar: string;
  desactivado?: boolean;
  aProcessar: boolean;
  perigo?: boolean;
}

function Rodape({ aoFechar, confirmar, desactivado, aProcessar, perigo }: RodapeProps) {
  const { t } = useTranslation('entrega');
  return (
    <div className="flex justify-end gap-2 pt-1">
      <button
        type="button"
        onClick={aoFechar}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        {t('dialogo.cancelar')}
      </button>
      <button
        type="submit"
        disabled={desactivado || aProcessar}
        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
          perigo ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {aProcessar && <Loader2 size={14} className="animate-spin" />}
        {confirmar}
      </button>
    </div>
  );
}

/**
 * Atribuir (ou reatribuir) a entrega. Só aparecem estafetas que a recebem: activos e que servam a
 * loja do pedido (sem lojas = servem todas). O servidor volta a verificar — isto só evita
 * oferecer uma escolha que seria recusada.
 */
export function AtribuirDialog({
  entrega,
  estafetas,
  aProcessar,
  aoConfirmar,
  aoFechar,
}: {
  entrega: EntregaPainel;
  estafetas: Estafeta[];
  aProcessar: boolean;
  aoConfirmar: (estafetaId: string) => void;
  aoFechar: () => void;
}) {
  const { t } = useTranslation('entrega');
  const elegiveis = estafetas.filter(
    (e) => e.isActive && (e.lojas.length === 0 || e.lojas.some((l) => l.id === entrega.lojaId)),
  );
  const [estafetaId, setEstafetaId] = useState(entrega.estafetaId ?? '');

  return (
    <Casca titulo={t('dialogo.atribuir.titulo', { pedido: entrega.pedido.numeroPedido })} aoFechar={aoFechar}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (estafetaId) aoConfirmar(estafetaId);
        }}
      >
        {elegiveis.length === 0 ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{t('dialogo.atribuir.sem_elegiveis')}</p>
        ) : (
          <div>
            <label className="block text-xs font-medium text-slate-700">{t('dialogo.atribuir.estafeta')}</label>
            <select value={estafetaId} onChange={(e) => setEstafetaId(e.target.value)} className={classeCampo} autoFocus>
              <option value="">{t('dialogo.atribuir.escolher')}</option>
              {elegiveis.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome} ({e.codigo}){e._count.entregas > 0 ? ` · ${t('estafetas.em_entrega', { count: e._count.entregas })}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
        <Rodape
          aoFechar={aoFechar}
          confirmar={t('dialogo.atribuir.confirmar')}
          desactivado={!estafetaId || elegiveis.length === 0}
          aProcessar={aProcessar}
        />
      </form>
    </Casca>
  );
}

/**
 * Entregue: como o cliente pagou à porta. M-Pesa e e-Mola exigem a referência — o servidor recusa
 * sem ela, e o campo só se mostra (e se exige) quando faz falta.
 */
export function EntregarDialog({
  entrega,
  aProcessar,
  aoConfirmar,
  aoFechar,
}: {
  entrega: EntregaPainel;
  aProcessar: boolean;
  aoConfirmar: (corpo: { metodoCobrado: MetodoCobranca; referenciaPagamento?: string }) => void;
  aoFechar: () => void;
}) {
  const { t } = useTranslation('entrega');
  const [metodo, setMetodo] = useState<MetodoCobranca>('NUMERARIO');
  const [referencia, setReferencia] = useState('');
  const precisaReferencia = metodo !== 'NUMERARIO';

  return (
    <Casca titulo={t('dialogo.entregar.titulo', { pedido: entrega.pedido.numeroPedido })} aoFechar={aoFechar}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          aoConfirmar({ metodoCobrado: metodo, ...(precisaReferencia ? { referenciaPagamento: referencia.trim() } : {}) });
        }}
      >
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {t('dialogo.entregar.valor', { valor: formatMoeda(entrega.valorACobrar) })}
        </p>
        <div>
          <label className="block text-xs font-medium text-slate-700">{t('dialogo.entregar.metodo')}</label>
          <select value={metodo} onChange={(e) => setMetodo(e.target.value as MetodoCobranca)} className={classeCampo}>
            {METODOS_COBRANCA.map((m) => (
              <option key={m} value={m}>
                {t(`metodo_cobranca.${m}`)}
              </option>
            ))}
          </select>
        </div>
        {precisaReferencia && (
          <div>
            <label className="block text-xs font-medium text-slate-700">{t('dialogo.entregar.referencia')} *</label>
            <input value={referencia} onChange={(e) => setReferencia(e.target.value)} maxLength={80} className={classeCampo} autoFocus />
            <p className="mt-1 text-xs text-slate-400">{t('dialogo.entregar.referencia_ajuda')}</p>
          </div>
        )}
        <Rodape
          aoFechar={aoFechar}
          confirmar={t('dialogo.entregar.confirmar')}
          desactivado={precisaReferencia && referencia.trim() === ''}
          aProcessar={aProcessar}
        />
      </form>
    </Casca>
  );
}

/** Falhada: o motivo vem de uma lista fechada; «outro» exige uma nota. */
export function FalharDialog({
  entrega,
  aProcessar,
  aoConfirmar,
  aoFechar,
}: {
  entrega: EntregaPainel;
  aProcessar: boolean;
  aoConfirmar: (corpo: { motivo: MotivoFalha; nota?: string }) => void;
  aoFechar: () => void;
}) {
  const { t } = useTranslation('entrega');
  const [motivo, setMotivo] = useState<MotivoFalha>('CLIENTE_AUSENTE');
  const [nota, setNota] = useState('');
  const precisaNota = motivo === 'OUTRO';

  return (
    <Casca titulo={t('dialogo.falhar.titulo', { pedido: entrega.pedido.numeroPedido })} aoFechar={aoFechar}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          aoConfirmar({ motivo, ...(nota.trim() ? { nota: nota.trim() } : {}) });
        }}
      >
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{t('dialogo.falhar.aviso')}</p>
        <div>
          <label className="block text-xs font-medium text-slate-700">{t('dialogo.falhar.motivo')}</label>
          <select value={motivo} onChange={(e) => setMotivo(e.target.value as MotivoFalha)} className={classeCampo}>
            {MOTIVOS_FALHA.map((m) => (
              <option key={m} value={m}>
                {t(`motivo_falha.${m}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">
            {t('dialogo.falhar.nota')} {precisaNota && '*'}
          </label>
          <textarea value={nota} onChange={(e) => setNota(e.target.value)} maxLength={300} rows={2} className={classeCampo} />
        </div>
        <Rodape
          aoFechar={aoFechar}
          confirmar={t('dialogo.falhar.confirmar')}
          desactivado={precisaNota && nota.trim() === ''}
          aProcessar={aProcessar}
          perigo
        />
      </form>
    </Casca>
  );
}

/**
 * Devolver: a mercadoria regressou à loja. Diz **o que acontece** antes de o fazer — o stock volta
 * e a venda anula-se, e isso não se desfaz.
 */
export function DevolverDialog({
  entrega,
  aProcessar,
  aoConfirmar,
  aoFechar,
}: {
  entrega: EntregaPainel;
  aProcessar: boolean;
  aoConfirmar: (motivo: string) => void;
  aoFechar: () => void;
}) {
  const { t } = useTranslation('entrega');
  const [motivo, setMotivo] = useState('');

  return (
    <Casca titulo={t('dialogo.devolver.titulo', { pedido: entrega.pedido.numeroPedido })} aoFechar={aoFechar}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          aoConfirmar(motivo.trim());
        }}
      >
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{t('dialogo.devolver.aviso')}</p>
        <div>
          <label className="block text-xs font-medium text-slate-700">{t('dialogo.devolver.motivo')} *</label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            minLength={5}
            maxLength={300}
            rows={2}
            className={classeCampo}
            autoFocus
          />
        </div>
        <Rodape
          aoFechar={aoFechar}
          confirmar={t('dialogo.devolver.confirmar')}
          desactivado={motivo.trim().length < 5}
          aProcessar={aProcessar}
          perigo
        />
      </form>
    </Casca>
  );
}
