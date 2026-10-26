import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { TFunction } from 'i18next';
import { AlertTriangle, Check, Copy, ShieldPlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui';
import { mensagemDeErro } from '@/shared/utils';
import { useCriarSuperAdmin } from '../hooks/useDashboard';
import type { SuperAdminCriado } from '../types';

function criarSchema(t: TFunction<'painel'>) {
  return z.object({
    name: z.string().trim().min(2, t('super_admins.validacao_nome')),
    email: z.string().trim().email(t('super_admins.validacao_email')),
  });
}

type Formulario = z.infer<ReturnType<typeof criarSchema>>;

interface NovoSuperAdminDialogProps {
  onClose: () => void;
}

/**
 * Dois passos no mesmo diálogo: o formulário e, depois, as credenciais.
 *
 * As credenciais aparecem aqui e não num toast porque a senha só existe nesta resposta — o
 * servidor guarda o hash. Um toast desaparece sozinho; se o e-mail tiver falhado, era a
 * única cópia. O diálogo só fecha quando quem criou decide.
 */
export function NovoSuperAdminDialog({ onClose }: NovoSuperAdminDialogProps) {
  const { t } = useTranslation('painel');
  const schema = useMemo(() => criarSchema(t), [t]);
  const criar = useCriarSuperAdmin();
  const [criado, setCriado] = useState<SuperAdminCriado | null>(null);
  const [copiado, setCopiado] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Formulario>({ resolver: zodResolver(schema) });

  const submeter = (dados: Formulario) =>
    criar.mutate(dados, {
      onSuccess: setCriado,
      onError: (erro) => toast.error(mensagemDeErro(erro, t('super_admins.erro_criar'))),
    });

  const copiar = async () => {
    if (!criado) return;
    try {
      await navigator.clipboard.writeText(
        `${t('super_admins.codigo')}: ${criado.code}\n${t('super_admins.senha')}: ${criado.senhaInicial}`,
      );
      setCopiado(true);
    } catch {
      // Sem contexto seguro (HTTP na rede local) não há clipboard: os valores ficam à vista.
      toast.error(t('super_admins.copiar_indisponivel'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">
            {criado ? t('super_admins.criado_titulo') : t('super_admins.novo')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={criar.isPending}
            aria-label={t('super_admins.fechar')}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {criado ? (
          <div className="space-y-4 p-6">
            <p className="text-sm text-slate-600">
              {t('super_admins.criado_texto', { nome: criado.name, email: criado.email })}
            </p>
            <dl className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">{t('super_admins.codigo')}</dt>
                <dd className="font-semibold text-slate-900">{criado.code}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">{t('super_admins.senha')}</dt>
                <dd className="break-all font-semibold text-slate-900">{criado.senhaInicial}</dd>
              </div>
            </dl>
            {!criado.emailEnviado && (
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
              <Button onClick={onClose}>{t('super_admins.concluir')}</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(submeter)} className="space-y-4 p-6" noValidate>
            <p className="text-sm text-slate-500">{t('super_admins.novo_texto')}</p>
            <div>
              <label htmlFor="sa-nome" className="mb-1 block text-sm font-medium text-slate-700">
                {t('super_admins.nome')}
              </label>
              <input
                id="sa-nome"
                autoFocus
                {...register('name')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
              {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="sa-email" className="mb-1 block text-sm font-medium text-slate-700">
                {t('super_admins.email')}
              </label>
              <input
                id="sa-email"
                type="email"
                autoComplete="off"
                {...register('email')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
              {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
            </div>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose} disabled={criar.isPending}>
                {t('super_admins.cancelar')}
              </Button>
              <Button type="submit" disabled={criar.isPending}>
                <ShieldPlus size={16} />
                {criar.isPending ? t('super_admins.a_criar') : t('super_admins.criar')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
