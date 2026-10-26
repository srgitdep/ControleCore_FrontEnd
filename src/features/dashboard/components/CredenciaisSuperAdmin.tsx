import { useState } from 'react';
import { AlertTriangle, Check, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui';

interface CredenciaisSuperAdminProps {
  texto: string;
  code: string;
  senha: string;
  emailEnviado: boolean;
  onConcluir: () => void;
}

/**
 * O código e a senha de um Super Admin, mostrados uma única vez — na criação e na reposição
 * da senha. Não é um toast porque a senha só existe nesta resposta: se o e-mail falhou, é a
 * única cópia, e só desaparece quando quem a vê decide.
 */
export function CredenciaisSuperAdmin({
  texto,
  code,
  senha,
  emailEnviado,
  onConcluir,
}: CredenciaisSuperAdminProps) {
  const { t } = useTranslation('painel');
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(
        `${t('super_admins.codigo')}: ${code}\n${t('super_admins.senha')}: ${senha}`,
      );
      setCopiado(true);
    } catch {
      // Sem contexto seguro (HTTP na rede local) não há clipboard: os valores ficam à vista.
      toast.error(t('super_admins.copiar_indisponivel'));
    }
  };

  return (
    <div className="space-y-4 p-6">
      <p className="text-sm text-slate-600">{texto}</p>
      <dl className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">{t('super_admins.codigo')}</dt>
          <dd className="font-semibold text-slate-900">{code}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">{t('super_admins.senha')}</dt>
          <dd className="break-all font-semibold text-slate-900">{senha}</dd>
        </div>
      </dl>
      {!emailEnviado && (
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {t('super_admins.email_falhou')}
        </p>
      )}
      <p className="text-xs text-slate-500">{t('super_admins.senha_unica')}</p>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={copiar}>
          {copiado ? <Check size={16} /> : <Copy size={16} />}
          {copiado ? t('super_admins.copiado') : t('super_admins.copiar')}
        </Button>
        <Button onClick={onConcluir}>{t('super_admins.concluir')}</Button>
      </div>
    </div>
  );
}
