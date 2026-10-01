import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowLeft, SendHorizonal, ShieldAlert } from 'lucide-react';
import { forgotPasswordApi } from '../api/auth.api';
import { cn } from '@/shared/utils';
import { SelectorIdioma } from '@/shared/ui';

const criarSchema = (t: (chave: 'validacao.email_invalido') => string) =>
  z.object({ email: z.string().email(t('validacao.email_invalido')) });

type FormData = z.infer<ReturnType<typeof criarSchema>>;

export function ForgotPasswordPage() {
  const { t } = useTranslation('auth');
  const schema = useMemo(() => criarSchema(t), [t]);
  const [sent, setSent] = useState(false);
  const [feedback, setFeedback] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await forgotPasswordApi({ email: data.email });
      setFeedback(res.message);
      setSent(true);
    } catch {
      toast.error(t('recuperar.erro'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm">
        <div className="mb-4 flex justify-end">
          <SelectorIdioma />
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold">CC</span>
          </div>
        </div>

        {!sent ? (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-slate-900 mb-1">{t('recuperar.titulo')}</h1>
              <p className="text-slate-500 text-sm">
                {t('recuperar.descricao')}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  {t('recuperar.campo_email')}
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    autoFocus
                    autoComplete="email"
                    placeholder={t('recuperar.placeholder_email')}
                    {...register('email')}
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border bg-white text-slate-900 placeholder:text-slate-400',
                      'transition-colors outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                      errors.email ? 'border-red-400' : 'border-slate-300',
                    )}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <SendHorizonal size={16} />
                    {t('recuperar.submeter')}
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          /* Estado de sucesso */
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Mail size={28} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">{t('recuperar.verifique_email')}</h2>
            <p className="text-slate-500 text-sm">
              {feedback}
            </p>
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-left">
              <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-600" />
              <p className="text-xs text-amber-800">
                {t('recuperar.limite')}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={14} />
            {t('recuperar.voltar_login')}
          </Link>
        </div>
      </div>
    </div>
  );
}
