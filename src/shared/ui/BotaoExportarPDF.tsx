import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { cn } from '@/shared/utils';
import { exportarTabelaPDF } from '@/shared/utils/exportarTabelaPDF';
import type { ExportarTabelaPDFOpcoes } from '@/shared/utils/exportarTabelaPDF';

interface BotaoExportarPDFProps extends Omit<ExportarTabelaPDFOpcoes, 'linhas'> {
  /** As linhas a exportar — `null`/`undefined` conta como "ainda a carregar": o botão
   * exporta na mesma (lê o valor mais recente no clique), mas evita gerar um PDF vazio
   * por engano antes dos dados chegarem. */
  linhas: (string | number)[][] | null | undefined;
  className?: string;
}

/**
 * O botão "Exportar PDF" que aparecia, escrito à mão, em cada lista do sistema
 * (Histórico, Empresas, Utilizadores, Caixas) — agora um único componente. Qualquer
 * ecrã com uma lista passa as linhas já formatadas (como o utilizador as vê, não os
 * dados em bruto) e ganha a exportação sem repetir `jsPDF`/`autoTable`.
 */
export function BotaoExportarPDF({ linhas, className, ...opcoes }: BotaoExportarPDFProps) {
  const { t } = useTranslation();
  const [aGerar, setAGerar] = useState(false);

  const aoClicar = () => {
    if (!linhas || linhas.length === 0) {
      toast.error(t('exportar.sem_dados'));
      return;
    }
    setAGerar(true);
    try {
      exportarTabelaPDF({ ...opcoes, linhas });
    } finally {
      setAGerar(false);
    }
  };

  return (
    <button
      type="button"
      onClick={aoClicar}
      disabled={aGerar}
      className={cn(
        'flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60',
        className,
      )}
    >
      {aGerar ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      <span>{aGerar ? t('exportar.a_gerar') : t('exportar.pdf')}</span>
    </button>
  );
}
