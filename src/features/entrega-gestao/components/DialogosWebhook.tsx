import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Check, Copy, Loader2, X } from 'lucide-react';
import { cn } from '@/shared/utils';
import { EVENTOS_WEBHOOK } from '../types/webhook';
import type { CriarSubscricaoPayload, SubscricaoWebhook } from '../types/webhook';

const classeCampo =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none';

/** A casca dos diálogos desta página (o mesmo aspecto dos de `DialogosEntrega`). `Esc` e clique fora fecham. */
function Casca({
  titulo,
  aoFechar,
  fechoAcidental = true,
  children,
}: {
  titulo: string;
  aoFechar: () => void;
  /** Falso = nem o clique fora nem o `Esc` fecham: só o botão. Para o segredo, que não volta a aparecer. */
  fechoAcidental?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => fechoAcidental && e.target === e.currentTarget && aoFechar()}
      onKeyDown={(e) => fechoAcidental && e.key === 'Escape' && aoFechar()}
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
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

/**
 * Criar ou editar uma subscrição. O URL é verificado pelo servidor (https, público); aqui só se
 * avisa o que vai ser exigido, para o erro não ser surpresa.
 */
export function SubscricaoDialog({
  inicial,
  aProcessar,
  aoConfirmar,
  aoFechar,
}: {
  inicial?: SubscricaoWebhook;
  aProcessar: boolean;
  aoConfirmar: (dados: CriarSubscricaoPayload) => void;
  aoFechar: () => void;
}) {
  const { t } = useTranslation('entrega');
  const [descricao, setDescricao] = useState(inicial?.descricao ?? '');
  const [url, setUrl] = useState(inicial?.url ?? '');
  const [eventos, setEventos] = useState<string[]>(inicial?.eventos ?? []);

  const alternar = (e: string) =>
    setEventos((actuais) => (actuais.includes(e) ? actuais.filter((x) => x !== e) : [...actuais, e]));

  const valido = descricao.trim() !== '' && url.trim() !== '' && eventos.length > 0;

  return (
    <Casca titulo={inicial ? t('webhooks.dialogo.editar') : t('webhooks.dialogo.novo')} aoFechar={aoFechar}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (valido) aoConfirmar({ descricao: descricao.trim(), url: url.trim(), eventos });
        }}
      >
        <div>
          <label className="block text-xs font-medium text-slate-700">{t('webhooks.dialogo.descricao')}</label>
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            maxLength={120}
            className={classeCampo}
            placeholder={t('webhooks.dialogo.descricao_exemplo')}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700">{t('webhooks.dialogo.url')}</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            maxLength={500}
            inputMode="url"
            className={cn(classeCampo, 'font-mono')}
            placeholder="https://erp.exemplo.co.mz/hooks/entregas"
          />
          <p className="mt-1 text-xs text-slate-500">{t('webhooks.dialogo.url_ajuda')}</p>
        </div>

        <fieldset>
          <legend className="text-xs font-medium text-slate-700">{t('webhooks.dialogo.eventos')}</legend>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {EVENTOS_WEBHOOK.map((e) => (
              <label key={e} className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-xs">
                <input
                  type="checkbox"
                  checked={eventos.includes(e)}
                  onChange={() => alternar(e)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span className="font-mono text-slate-700">{e}</span>
              </label>
            ))}
          </div>
          {eventos.length === 0 && <p className="mt-1.5 text-xs text-amber-700">{t('webhooks.dialogo.sem_eventos')}</p>}
        </fieldset>

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
            disabled={!valido || aProcessar}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {aProcessar && <Loader2 size={14} className="animate-spin" />}
            {t('webhooks.dialogo.guardar')}
          </button>
        </div>
      </form>
    </Casca>
  );
}

/**
 * O segredo, mostrado **uma única vez**. O servidor não o volta a devolver: quem fechar este diálogo sem
 * o copiar tem de rodar o segredo. Por isso um clique ao lado ou um `Esc` não o fecham — só o botão
 * «Já guardei o segredo» (ou o ×), que são escolhas deliberadas.
 */
export function SegredoDialog({ segredo, aoFechar }: { segredo: string; aoFechar: () => void }) {
  const { t } = useTranslation('entrega');
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(segredo);
      setCopiado(true);
    } catch {
      // Sem permissão da área de transferência: o texto está seleccionável no campo.
      setCopiado(false);
    }
  };

  return (
    <Casca titulo={t('webhooks.segredo.titulo')} aoFechar={aoFechar} fechoAcidental={false}>
      <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        {t('webhooks.segredo.aviso')}
      </p>
      <div>
        <input
          readOnly
          value={segredo}
          onFocus={(e) => e.currentTarget.select()}
          className={cn(classeCampo, 'font-mono text-xs')}
          aria-label={t('webhooks.segredo.titulo')}
        />
        <button
          type="button"
          onClick={() => void copiar()}
          className="mt-2 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {copiado ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
          {copiado ? t('webhooks.segredo.copiado') : t('webhooks.segredo.copiar')}
        </button>
      </div>
      <p className="text-xs text-slate-500">{t('webhooks.segredo.como_usar')}</p>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={aoFechar}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {t('webhooks.segredo.guardei')}
        </button>
      </div>
    </Casca>
  );
}

/** Pede confirmação antes de uma acção destrutiva (apagar, rodar o segredo). */
export function ConfirmarDialog({
  titulo,
  texto,
  confirmar,
  aProcessar,
  aoConfirmar,
  aoFechar,
}: {
  titulo: string;
  texto: string;
  confirmar: string;
  aProcessar: boolean;
  aoConfirmar: () => void;
  aoFechar: () => void;
}) {
  const { t } = useTranslation('entrega');
  return (
    <Casca titulo={titulo} aoFechar={aoFechar}>
      <p className="text-sm text-slate-700">{texto}</p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={aoFechar}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {t('dialogo.cancelar')}
        </button>
        <button
          type="button"
          onClick={aoConfirmar}
          disabled={aProcessar}
          className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
        >
          {aProcessar && <Loader2 size={14} className="animate-spin" />}
          {confirmar}
        </button>
      </div>
    </Casca>
  );
}
