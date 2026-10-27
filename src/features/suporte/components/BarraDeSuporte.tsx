import { useEffect, useState } from 'react';
import { Eye, Loader2, LogOut, PencilLine } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { localeIntl } from '@/i18n';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { mensagemDeErro } from '@/shared/utils';
import { useModoSuporte } from '../hooks/useSuporte';

/**
 * A faixa fixa do modo suporte (plano §4.15, S3): em que empresa se está, com que poder, até
 * quando, e o caminho de volta. Não tem botão de fechar — o único jeito de a tirar é sair do
 * modo, para ninguém esquecer que está dentro da conta de um cliente.
 *
 * `sticky` e não `fixed`: vive dentro do `main` do `AppLayout`, por baixo do cabeçalho, e no
 * POS (que não faz scroll) fica no mesmo sítio.
 */
export function BarraDeSuporte() {
  const { t } = useTranslation('suporte');
  const suporte = useAuthStore((s) => s.suporte);
  const { sair } = useModoSuporte();
  const [agora, setAgora] = useState(() => Date.now());

  // Meio minuto chega: o texto mostra minutos.
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!suporte) return null;

  const minutos = Math.max(0, Math.ceil((new Date(suporte.expiraEm).getTime() - agora) / 60_000));
  const fim = new Date(suporte.expiraEm).toLocaleTimeString(localeIntl(), {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      role="status"
      className="sticky top-0 z-30 flex shrink-0 flex-col gap-2 bg-indigo-700 px-4 py-2 text-sm text-white sm:flex-row sm:items-center sm:justify-between"
    >
      <span className="flex items-start gap-2 sm:items-center">
        {suporte.escrita ? (
          <PencilLine size={16} className="mt-0.5 shrink-0 sm:mt-0" />
        ) : (
          <Eye size={16} className="mt-0.5 shrink-0 sm:mt-0" />
        )}
        <span>
          <strong>{t('barra.titulo', { empresa: suporte.empresa.nome })}</strong>{' '}
          {suporte.escrita ? t('barra.com_escrita') : t('barra.so_leitura')} ·{' '}
          {t('barra.termina', { hora: fim, count: minutos })}
        </span>
      </span>
      <button
        type="button"
        disabled={sair.isPending}
        onClick={() =>
          sair.mutate(undefined, {
            onError: (e) => toast.error(mensagemDeErro(e, t('barra.erro_sair'))),
          })
        }
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-white/15 px-3 py-1 font-medium hover:bg-white/25 disabled:opacity-60"
      >
        {sair.isPending ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
        {t('barra.sair')}
      </button>
    </div>
  );
}
