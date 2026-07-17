import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import { resetPasswordApi } from '../api/auth.api';
import { cn } from '@/lib/utils';

const schema = z
  .object({
    newPassword: z.string().min(6, 'A password deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme a nova password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'As passwords não coincidem',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast.error('Token inválido ou em falta. Solicite uma nova recuperação.');
      return;
    }
    try {
      await resetPasswordApi({ token, newPassword: data.newPassword });
      setDone(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Código inválido ou expirado.';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold">CC</span>
          </div>
        </div>

        {!done ? (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Nova Password</h1>
              <p className="text-slate-500 text-sm">Defina a sua nova password de acesso.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Nova password */}
              <div className="space-y-1.5">
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700">
                  Nova Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    id="newPassword"
                    type={showPw ? 'text' : 'password'}
                    autoFocus
                    placeholder="MÍnimo 6 caracteres"
                    {...register('newPassword')}
                    className={cn(
                      'w-full pl-10 pr-12 py-2.5 text-sm rounded-lg border bg-white text-slate-900 placeholder:text-slate-400',
                      'transition-colors outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                      errors.newPassword ? 'border-red-400' : 'border-slate-300',
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-xs text-red-500">{errors.newPassword.message}</p>
                )}
              </div>

              {/* Confirmar password */}
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                  Confirmar Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    id="confirmPassword"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Repita a password"
                    {...register('confirmPassword')}
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border bg-white text-slate-900 placeholder:text-slate-400',
                      'transition-colors outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                      errors.confirmPassword ? 'border-red-400' : 'border-slate-300',
                    )}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : 'Definir Nova Password'}
              </button>
            </form>
          </>
        ) : (
          /* Estado de sucesso */
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Password redefinida!</h2>
            <p className="text-slate-500 text-sm mb-6">
              A sua password foi alterada com sucesso. Pode agora iniciar sessão.
            </p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Ir para o Login
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={14} />
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}
