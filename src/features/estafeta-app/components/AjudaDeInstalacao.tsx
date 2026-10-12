import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Share, X } from 'lucide-react';

const CHAVE_DISPENSADO = 'estafeta.instalar.dispensado';

/** O evento do Chrome/Android que deixa a página oferecer a instalação; não existe no TypeScript DOM. */
interface PedidoDeInstalacao extends Event {
  prompt: () => Promise<void>;
}

function jaInstalada(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
}

function eIos(): boolean {
  // iPadOS 13+ diz-se «Macintosh»; distingue-se pelo toque.
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1);
}

function foiDispensado(): boolean {
  try {
    return localStorage.getItem(CHAVE_DISPENSADO) === '1';
  } catch {
    return false;
  }
}

/**
 * Convida o estafeta a instalar a aplicação. Existe porque os dois sistemas fazem isto de maneira diferente:
 * o Android/Chrome oferece um botão (`beforeinstallprompt`); o iPhone **não tem** esse evento — a única via é
 * «Partilhar → Adicionar ao ecrã principal», e sem instalar o iOS apaga o armazenamento da página ao fim de 7 dias
 * sem uso e não deixa receber avisos. Instalada (modo `standalone`) ou dispensada, não aparece.
 */
export function AjudaDeInstalacao() {
  const { t } = useTranslation('estafeta');
  const [pedido, setPedido] = useState<PedidoDeInstalacao | null>(null);
  const [dispensado, setDispensado] = useState(foiDispensado);
  const ios = eIos();

  useEffect(() => {
    const aoPedir = (e: Event) => {
      e.preventDefault();
      setPedido(e as PedidoDeInstalacao);
    };
    window.addEventListener('beforeinstallprompt', aoPedir);
    return () => window.removeEventListener('beforeinstallprompt', aoPedir);
  }, []);

  if (dispensado || jaInstalada() || (!pedido && !ios)) return null;

  const dispensar = () => {
    try {
      localStorage.setItem(CHAVE_DISPENSADO, '1');
    } catch {
      // Sem armazenamento: dispensa-se só até recarregar.
    }
    setDispensado(true);
  };

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
      {ios ? <Share size={18} className="mt-0.5 shrink-0" /> : <Download size={18} className="mt-0.5 shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{t('instalar.titulo')}</p>
        <p className="mt-0.5 text-xs text-blue-800">{ios ? t('instalar.ios') : t('instalar.android')}</p>
        {pedido && (
          <button
            type="button"
            onClick={() => void pedido.prompt().then(() => setPedido(null))}
            className="mt-2 h-10 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white"
          >
            {t('instalar.botao')}
          </button>
        )}
      </div>
      <button type="button" onClick={dispensar} aria-label={t('instalar.dispensar')} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-blue-700">
        <X size={16} />
      </button>
    </div>
  );
}
