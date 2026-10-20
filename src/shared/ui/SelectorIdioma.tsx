import { Languages } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { IDIOMAS, idiomaActivo, mudarIdioma, type Idioma } from '@/i18n';
import { cn } from '@/shared/utils';

/** O nome de cada língua na própria língua: quem não lê português tem de encontrar a sua. */
const NOME_DA_LINGUA: Record<Idioma, string> = { pt: 'Português', en: 'English', zh: '中文' };

interface SelectorIdiomaProps {
  /**
   * Grava a escolha no servidor, quando há sessão — cada ecrã passa a rota do seu tipo de
   * conta (ERP, Compra Fácil, portal). Sem ela, a escolha fica só neste browser.
   */
  aoMudar?: (idioma: Idioma) => Promise<unknown>;
  className?: string;
}

/**
 * Selector de língua, igual em todas as superfícies (ERP, loja, portal, páginas públicas).
 *
 * A língua muda logo, antes de o servidor responder: quem a escolheu quer ver a interface
 * nela. Se a gravação falhar, avisa-se e a escolha fica neste browser — que é o que
 * acontece de qualquer forma a quem não tem sessão.
 */
export function SelectorIdioma({ aoMudar, className }: SelectorIdiomaProps) {
  const { t } = useTranslation();
  const actual = idiomaActivo();

  const mudar = async (novo: Idioma) => {
    if (novo === actual) return;
    // `mudarIdioma` espera pelo catálogo se a língua é carregada sob pedido (`zh`): sem isso
    // o ecrã ficava em português até o ficheiro chegar. Se não chegar, a língua não muda.
    try {
      await mudarIdioma(novo);
    } catch {
      toast.error(t('idioma.erro_ao_carregar'));
      return;
    }
    if (!aoMudar) return;
    try {
      await aoMudar(novo);
    } catch {
      toast.error(t('idioma.erro_ao_gravar'));
    }
  };

  return (
    <label
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100',
        className,
      )}
    >
      <Languages size={16} aria-hidden="true" />
      <select
        value={actual}
        onChange={(e) => void mudar(e.target.value as Idioma)}
        aria-label={t('idioma.rotulo')}
        className="cursor-pointer bg-transparent text-sm font-medium focus:outline-none"
      >
        {IDIOMAS.map((lingua) => (
          <option key={lingua} value={lingua} className="text-slate-900">
            {NOME_DA_LINGUA[lingua]}
          </option>
        ))}
      </select>
    </label>
  );
}
