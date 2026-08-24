import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';

import { useAuth } from '../index';
import { cn } from '@/shared/utils';
import { useBreakpoint } from '@/shared/hooks';
import { COPY } from '@/shared/constants/copywriting';
import { Marca } from '@/features/landing';

import '@/features/landing/site.css';

/**
 * O ecrã de entrada.
 *
 * ## O que mudou, e porquê
 *
 * A versão anterior era um cartão claro à direita e um painel decorativo à
 * esquerda com quatro linhas de funcionalidades. Dois problemas:
 *
 * 1. **Não parecia o sítio.** A landing tem uma identidade — o jogo de azuis, a
 *    marca, a tipografia — e o login não a partilhava. Quem clicava em «Entrar»
 *    aterrava noutro produto.
 * 2. **Dizia «Gestão Industrial Inteligente».** O produto é de retalho. O texto
 *    vinha de quando o ecrã foi copiado de outro projecto, e ninguém reparou porque
 *    estava escrito à mão dentro do JSX, sem passar por sítio nenhum onde se lesse.
 *
 * Agora o painel da esquerda é o **mesmo escuro** das secções invertidas da landing,
 * com a marca em cima, e roda entre as quatro promessas de `COPY.AUTH.SLIDES` — que
 * são as quatro dores da landing ditas em duas linhas. O formulário fica à direita,
 * em branco, porque um campo de texto sobre fundo escuro custa a ler.
 *
 * ## A ligação de volta
 *
 * O `Voltar ao início` existe porque não existia: chegado aqui por engano, o único
 * caminho de regresso era o botão do browser. É a mesma razão do `Link` na marca.
 */

const loginSchema = z.object({
  code: z.string().trim().min(1, 'O código de acesso é obrigatório'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const copy = COPY.AUTH;
  const emEcraLargo = useBreakpoint('sm');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data);
      toast.success(copy.SUCESSO, { duration: 2000 });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      let message = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      if (Array.isArray(message)) message = message[0];
      toast.error(message || copy.ERRO_GENERICO);
    }
  };

  return (
    <div className="cc-sitio cc-entrada">
      <PainelDaMarca />

        {/* ── O formulário ─────────────────────────────────────────────────
            `justify-center` centra verticalmente, o que num monitor é o correcto mas
            num telemóvel deixava a metade de cima vazia e o formulário a meio do ecrã.
            A classe alinha ao topo abaixo de `sm` e centra a partir daí. */}
        <div
          className="cc-entrada-form"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: '#fff',
          }}
        >
          <div style={{ width: '100%', maxWidth: 380 }}>
            {/* A marca repete-se aqui, e só aparece quando o painel escuro
                desaparece — em telemóvel, sem isto, o ecrã não diz onde se está. */}
            <Link
              to="/"
              className="cc-entrada-marca-movel"
              style={{ display: 'none', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 32 }}
            >
              <Marca tamanho={30} />
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--tinta)' }}>
                {COPY.MARCA.NOME}
              </span>
            </Link>

            <h1
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: 'var(--tinta)',
              }}
            >
              {copy.TITULO}
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: 14.5, lineHeight: 1.55, color: 'var(--tinta-suave)' }}>
              {copy.SUBTITULO}
            </p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'grid', gap: 18, marginTop: 30 }}>
              <div style={{ display: 'grid', gap: 7 }}>
                <label htmlFor="code" style={etiquetaCampo}>
                  {copy.CAMPO_CODIGO}
                </label>
                <input
                  id="code"
                  type="text"
                  autoComplete="username"
                  // Só em ecrã largo: num telemóvel, `autoFocus` abre o teclado
                  // virtual ao carregar a página, que tapa metade do ecrã antes de o
                  // utilizador ter visto onde está.
                  autoFocus={emEcraLargo}
                  // `characters` e não `words`: um código de acesso como «S001» não é
                  // uma palavra, e o teclado do telemóvel capitalizaria a primeira
                  // letra do que se escrevesse.
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder={copy.CAMPO_CODIGO_DICA}
                  aria-invalid={!!errors.code}
                  {...register('code')}
                  className={cn('cc-campo', errors.code && 'cc-campo--erro')}
                />
                {errors.code && <p style={erroCampo}>{errors.code.message}</p>}
              </div>

              <div style={{ display: 'grid', gap: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <label htmlFor="password" style={etiquetaCampo}>
                    {copy.CAMPO_SENHA}
                  </label>
                  <Link
                    to="/recuperar-senha"
                    style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--azul-fundo)', textDecoration: 'none' }}
                  >
                    {copy.ESQUECEU}
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder={copy.CAMPO_SENHA_DICA}
                    aria-invalid={!!errors.password}
                    {...register('password')}
                    className={cn('cc-campo', 'cc-campo--com-botao', errors.password && 'cc-campo--erro')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? copy.OCULTAR_SENHA : copy.MOSTRAR_SENHA}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'grid',
                      placeItems: 'center',
                      background: 'none',
                      border: 0,
                      cursor: 'pointer',
                      color: 'var(--tinta-tenue)',
                      padding: 2,
                    }}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.password && <p style={erroCampo}>{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="cc-botao cc-botao--cheio"
                style={{ width: '100%', marginTop: 4, opacity: isSubmitting ? 0.65 : 1 }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="cc-gira" />
                    {copy.A_SUBMETER}
                  </>
                ) : (
                  copy.SUBMETER
                )}
              </button>
            </form>

            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 26,
                fontSize: 13,
                color: 'var(--tinta-tenue)',
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={14} />
              {copy.VOLTAR}
            </Link>
          </div>
        </div>
    </div>
  );
}

/**
 * O painel escuro da esquerda.
 *
 * Roda entre os slides a cada 5 segundos. O texto muda com uma transição de
 * opacidade em vez de aparecer de golpe, e a altura é reservada — sem isso, slides
 * de comprimentos diferentes fazem os pontos saltar de posição.
 */
function PainelDaMarca() {
  const slides = COPY.AUTH.SLIDES;
  const [actual, setActual] = useState(0);

  useEffect(() => {
    // `prefers-reduced-motion` desliga a rotação por completo: aqui o movimento não
    // transporta informação que se perca — os quatro slides dizem o mesmo de quatro
    // maneiras, e ficar no primeiro não priva ninguém de nada.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setActual((a) => (a + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <div
      className="cc-entrada-painel"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 40,
        padding: 'clamp(32px, 4vw, 56px)',
        background: 'linear-gradient(160deg, var(--escuro) 0%, var(--escuro-alt) 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Duas manchas de azul e uma grelha de pontos. É o que dá profundidade a um
          fundo liso sem meter uma fotografia que não diz nada. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.16,
          backgroundImage: 'radial-gradient(circle at 1px 1px, #93c5fd 1px, transparent 0)',
          backgroundSize: '30px 30px',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -140,
          right: -140,
          width: 420,
          height: 420,
          borderRadius: 999,
          background: 'rgb(37 99 235 / 0.28)',
          filter: 'blur(90px)',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: -160,
          left: -120,
          width: 400,
          height: 400,
          borderRadius: 999,
          background: 'rgb(96 165 250 / 0.16)',
          filter: 'blur(90px)',
        }}
      />

      <Link
        to="/"
        style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none' }}
      >
        <Marca tamanho={34} />
        <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.025em', color: '#f4f8ff' }}>
          {COPY.MARCA.NOME}
        </span>
      </Link>

      <div style={{ position: 'relative' }}>
        {/* Altura reservada para o slide mais alto. */}
        <div style={{ minHeight: 148 }}>
          {slides.map((s, i) => (
            <div
              key={s.titulo}
              aria-hidden={i !== actual}
              style={{
                display: i === actual ? 'block' : 'none',
                animation: 'cc-aparece 520ms ease-out',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  maxWidth: '20ch',
                  fontSize: 'clamp(26px, 3vw, 34px)',
                  fontWeight: 700,
                  lineHeight: 1.15,
                  letterSpacing: '-0.03em',
                  color: '#f4f8ff',
                }}
              >
                {s.titulo}
              </h2>
              <p
                style={{
                  margin: '14px 0 0',
                  maxWidth: '44ch',
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: '#9fb3cf',
                }}
              >
                {s.descricao}
              </p>
            </div>
          ))}
        </div>

        <div role="tablist" aria-label="Destaques" style={{ display: 'flex', gap: 7, marginTop: 26 }}>
          {slides.map((s, i) => (
            <button
              key={s.titulo}
              type="button"
              role="tab"
              aria-selected={i === actual}
              aria-label={s.titulo}
              onClick={() => setActual(i)}
              style={{
                width: i === actual ? 26 : 8,
                height: 4,
                padding: 0,
                borderRadius: 999,
                border: 0,
                cursor: 'pointer',
                background: i === actual ? 'var(--azul-claro)' : 'rgb(148 197 253 / 0.28)',
                transition: 'width 300ms, background-color 300ms',
              }}
            />
          ))}
        </div>
      </div>

      <p style={{ position: 'relative', margin: 0, fontSize: 12, color: '#617ea6' }}>
        © {new Date().getFullYear()} {COPY.MARCA.EMPRESA}. {COPY.SITIO.RODAPE.DIREITOS}
      </p>
    </div>
  );
}

const etiquetaCampo: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--tinta)',
};

const erroCampo: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  fontWeight: 500,
  color: '#dc2626',
};
