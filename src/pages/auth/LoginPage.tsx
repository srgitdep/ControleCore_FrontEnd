import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn, Lock, UserCircle, BarChart3, Package, Users, Store } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

// ─── Schema de validação (espelha as regras do backend LoginDto) ───────────────
const loginSchema = z.object({
  code: z.string().min(1, 'O código de acesso é obrigatório'),
  password: z.string().min(6, 'A password deve ter pelo menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

// ─── Destaques do sistema (painel da marca) ───────────────────────────────────
const features = [
  { icon: BarChart3, label: 'Gestão de Stock em tempo real' },
  { icon: Store,     label: 'Ponto de Venda integrado' },
  { icon: Users,     label: 'CRM & Programa de Fidelização' },
  { icon: Package,   label: 'Controlo de Compras e Fornecedores' },
];

// ─── Componente ───────────────────────────────────────────────────────────────
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data);
      toast.success('Bem-vindo de volta!', { duration: 2000 });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      let message = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      
      if (Array.isArray(message)) {
        message = message[0];
      }

      toast.error(message || 'Erro ao comunicar com o servidor. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ═══════════════════════════════════════════════════════════════════
          PAINEL DA MARCA (esquerda) — visível apenas em ecrãs grandes
          ════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Fundo gradiente */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900" />

        {/* Padrão de pontos subtil */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(148 163 184) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Círculos decorativos */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />

        {/* Conteúdo do painel */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/50">
              <span className="text-white font-bold text-sm">CC</span>
            </div>
            <div>
              <span className="text-white font-semibold text-lg leading-none block">ControlCore</span>
              <span className="text-slate-400 text-xs">by SRG</span>
            </div>
          </div>

          {/* Texto central */}
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Gestão Industrial<br />
              <span className="text-blue-400">Inteligente</span>
            </h2>
            <p className="text-slate-400 text-base mb-10 leading-relaxed">
              A plataforma SaaS completa para gerir o seu negócio — stock,
              vendas, clientes e muito mais, num único lugar.
            </p>

            {/* Features */}
            <ul className="space-y-4">
              {features.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-900/50 border border-blue-800 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-blue-400" />
                  </div>
                  <span className="text-slate-300 text-sm">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Rodapé do painel */}
          <p className="text-slate-600 text-xs">
            © {new Date().getFullYear()} SRG ControlCore. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          PAINEL DO FORMULÁRIO (direita)
          ════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">

        {/* Logo visível apenas em mobile */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">CC</span>
          </div>
          <span className="text-slate-800 font-semibold text-xl">ControlCore</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Cabeçalho do formulário */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Iniciar Sessão</h1>
            <p className="text-slate-500 text-sm">Aceda ao painel de gestão</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* ─── Campo: Código de Acesso ──────────────────────────── */}
            <div className="space-y-1.5">
              <label
                htmlFor="code"
                className="block text-sm font-medium text-slate-700"
              >
                Código de Acesso
              </label>
              <div className="relative">
                <UserCircle
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  id="code"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  placeholder="Ex: S001"
                  {...register('code')}
                  className={cn(
                    'w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border bg-white text-slate-900 placeholder:text-slate-400',
                    'transition-colors outline-none',
                    'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    errors.code
                      ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                      : 'border-slate-300',
                  )}
                />
              </div>
              {errors.code && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  {errors.code.message}
                </p>
              )}
            </div>

            {/* ─── Campo: Password ──────────────────────────────────── */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Mínimo 6 caracteres"
                  {...register('password')}
                  className={cn(
                    'w-full pl-10 pr-12 py-2.5 text-sm rounded-lg border bg-white text-slate-900 placeholder:text-slate-400',
                    'transition-colors outline-none',
                    'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    errors.password
                      ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                      : 'border-slate-300',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar password' : 'Mostrar password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* ─── Link Esqueceu a senha ────────────────────────────── */}
            <div className="flex justify-end">
              <Link
                to="/recuperar-senha"
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>

            {/* ─── Botão de submissão ───────────────────────────────── */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg',
                'text-sm font-semibold text-white',
                'bg-blue-600 hover:bg-blue-700 active:bg-blue-800',
                'transition-colors shadow-sm',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              )}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  A autenticar...
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Entrar
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
