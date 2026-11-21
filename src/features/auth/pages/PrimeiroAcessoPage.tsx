import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Lock, Eye, EyeOff, LogOut, ShieldCheck } from 'lucide-react';
import { alterarSenhaApi } from '../api/auth.api';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '@/shared/utils';
import { mensagemDeErro } from '@/shared/utils/mensagemDeErro';
import { SelectorIdioma } from '@/shared/ui';

type ChavesDoSchema =
  | 'primeiro_acesso.validacao.actual_obrigatoria'
  | 'primeiro_acesso.validacao.minimo_6'
  | 'primeiro_acesso.validacao.confirmar'
  | 'primeiro_acesso.validacao.nao_coincidem'
  | 'primeiro_acesso.validacao.igual_a_actual';

const criarSchema = (t: (chave: ChavesDoSchema) => string) =>
  z
    .object({
      senhaActual: z.string().min(1, t('primeiro_acesso.validacao.actual_obrigatoria')),
      novaSenha: z.string().min(6, t('primeiro_acesso.validacao.minimo_6')),
      confirmarSenha: z.string().min(1, t('primeiro_acesso.validacao.confirmar')),
    })
    .refine((d) => d.novaSenha === d.confirmarSenha, {
      message: t('primeiro_acesso.validacao.nao_coincidem'),
      path: ['confirmarSenha'],
    })
    // O servidor também o recusa; aqui poupa-se a viagem e a mensagem aparece junto ao campo.
    .refine((d) => d.novaSenha !== d.senhaActual, {
      message: t('primeiro_acesso.validacao.igual_a_actual'),
      path: ['novaSenha'],
    });

type FormData = z.infer<ReturnType<typeof criarSchema>>;

/**
 * O primeiro acesso: quem entrou com a senha provisória que recebeu por e-mail tem de definir
 * uma sua antes de usar o sistema.
 *
 * Não está dentro do `ProtectedRoute` de propósito — é ele que manda para aqui quem tem
 * `mudarSenha`, e a página dentro do próprio guarda ficava num ciclo. Verifica ela mesma que há
 * sessão. O servidor é quem impede o resto (`auth.guard.mudar_senha`): isto é só o ecrã.
 */
export function PrimeiroAcessoPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const concluirPrimeiroAcesso = useAuthStore((s) => s.concluirPrimeiroAcesso);
  const logout = useAuthStore((s) => s.logout);

  const schema = useMemo(() => criarSchema(t), [t]);
  const [mostrar, setMostrar] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // `/` e não `/dashboard`: a raiz encaminha cada cargo para o ecrã que lhe serve. O
  // painel só aceita SUPER_ADMIN, ADMIN e MANAGER, e um Caixa que acabasse de mudar a
  // senha via o aviso «Sem permissão para aceder a esta página» antes de chegar ao POS.
  if (!user?.mudarSenha) return <Navigate to="/" replace />;

  const onSubmit = async (data: FormData) => {
    try {
      await alterarSenhaApi({ senhaActual: data.senhaActual, novaSenha: data.novaSenha });
      concluirPrimeiroAcesso();
      toast.success(t('primeiro_acesso.sucesso'));
      navigate('/', { replace: true });
    } catch (err: unknown) {
      toast.error(mensagemDeErro(err, t('primeiro_acesso.erro')));
    }
  };

  const campo = (
    id: keyof FormData,
    etiqueta: string,
    dica: string,
    opcoes: { autoFocus?: boolean; autoComplete: string; comOlho?: boolean },
  ) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {etiqueta}
      </label>
      <div className="relative">
        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          id={id}
          type={mostrar ? 'text' : 'password'}
          autoFocus={opcoes.autoFocus}
          autoComplete={opcoes.autoComplete}
          placeholder={dica}
          {...register(id)}
          className={cn(
            'w-full pl-10 py-2.5 text-sm rounded-lg border bg-white text-slate-900 placeholder:text-slate-400',
            opcoes.comOlho ? 'pr-12' : 'pr-4',
            'transition-colors outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            errors[id] ? 'border-red-400' : 'border-slate-300',
          )}
        />
        {opcoes.comOlho && (
          <button
            type="button"
            onClick={() => setMostrar((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            tabIndex={-1}
            aria-label={mostrar ? t('primeiro_acesso.esconder') : t('primeiro_acesso.mostrar')}
          >
            {mostrar ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {errors[id] && <p className="text-xs text-red-500">{errors[id]?.message}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm">
        <div className="mb-4 flex justify-end">
          <SelectorIdioma />
        </div>

        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
            <ShieldCheck size={24} className="text-white" />
          </div>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">{t('primeiro_acesso.titulo')}</h1>
          <p className="text-slate-500 text-sm">{t('primeiro_acesso.descricao', { nome: user.name })}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {campo('senhaActual', t('primeiro_acesso.campo_actual'), t('primeiro_acesso.campo_actual_dica'), {
            autoFocus: true,
            autoComplete: 'current-password',
          })}
          {campo('novaSenha', t('primeiro_acesso.campo_nova'), t('primeiro_acesso.campo_nova_dica'), {
            autoComplete: 'new-password',
            comOlho: true,
          })}
          {campo('confirmarSenha', t('primeiro_acesso.campo_confirmar'), t('primeiro_acesso.campo_confirmar_dica'), {
            autoComplete: 'new-password',
          })}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              t('primeiro_acesso.submeter')
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => void logout().then(() => navigate('/login', { replace: true }))}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors"
          >
            <LogOut size={14} />
            {t('primeiro_acesso.sair')}
          </button>
        </div>
      </div>
    </div>
  );
}
