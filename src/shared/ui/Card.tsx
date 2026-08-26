import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils';

/**
 * O cartão do sistema.
 *
 * ## Porque existe
 *
 * Havia **oito** estilos diferentes de cartão, cada um definido dentro da feature que
 * o usava: raios `xl`, `2xl` e `20px`; bordas `slate-200`, `slate-100`, `gray-100`,
 * coloridas translúcidas e nenhuma; com e sem sombra; ícones em caixa cinzenta, em
 * caixa colorida, nus, em emoji, ou ausentes. Dois componentes chamados `KpiCard` com
 * APIs incompatíveis. Nenhum era reutilizável fora da sua feature.
 *
 * ## O desenho
 *
 * Segue os cartões da página pública: **barra vertical à esquerda**, ícone de traço
 * fino, título em tinta escura, descrição em cinza-azulado. Sem sombra pesada — a
 * separação vem da borda de 1px e da barra, não de profundidade simulada.
 *
 * A barra à esquerda faz mais do que decorar: é onde a cor do estado vive. Um valor em
 * alerta muda a barra e não o fundo, o que mantém o texto legível — colorir o fundo de
 * um cartão inteiro baixa o contraste do que está escrito nele.
 */

const cardVariants = cva(
  // A barra é um `border-l` de 3px, e não um pseudo-elemento: sobrevive a qualquer
  // `overflow` do contentor e não interfere com o cálculo de largura no carrossel.
  'relative rounded-xl border border-l-[3px] bg-white transition-colors',
  {
    variants: {
      /** A cor da barra à esquerda. */
      accent: {
        neutral: 'border-slate-200 border-l-slate-300',
        primary: 'border-slate-200 border-l-blue-600',
        success: 'border-slate-200 border-l-emerald-500',
        warning: 'border-slate-200 border-l-amber-500',
        danger: 'border-slate-200 border-l-rose-500',
      },
      /** `interactive` acrescenta resposta ao rato para cartões que são botões ou ligações. */
      interactive: {
        true: 'cursor-pointer hover:border-slate-300 hover:bg-slate-50/50',
        false: '',
      },
      padding: {
        sm: 'p-4',
        md: 'p-5',
        lg: 'p-6',
      },
    },
    defaultVariants: { accent: 'neutral', interactive: false, padding: 'md' },
  },
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ accent, interactive, padding, className, ...props }: CardProps) {
  return (
    <div className={cn(cardVariants({ accent, interactive, padding }), className)} {...props} />
  );
}

// ── Cartão de indicador ──────────────────────────────────────────────────────

export interface KpiCardProps {
  /** O que se está a medir. */
  title: string;
  /** O número, já formatado — a formatação de moeda e de milhares é de quem chama. */
  value: string | number;
  icon?: React.ElementType;
  /** Uma linha de contexto: «comparado ao mês passado», «acima do mínimo». */
  description?: string;
  /**
   * Variação em percentagem. `undefined` esconde o indicador — que é diferente de
   * zero, e zero significa «sem variação», não «não se sabe».
   */
  trend?: number;
  accent?: VariantProps<typeof cardVariants>['accent'];
  isLoading?: boolean;
  className?: string;
  /**
   * O que fazer quando se carrega no cartão.
   *
   * Um indicador que anuncia «4 produtos com stock baixo» e não leva a lado nenhum
   * obriga a procurar quais são. Com isto definido, o cartão passa a ser um `button`
   * a sério — navegável por teclado e anunciado como botão por um leitor de ecrã.
   */
  onClick?: () => void;
}

/**
 * Um indicador: título, número, e opcionalmente a variação e uma linha de contexto.
 *
 * Substitui os dois `KpiCard` que existiam — o de `features/dashboard` (props `title`,
 * `trend: number`, `trendLabel`) e o local do Financeiro (props `label`, `accent`,
 * `trend: 'up' | 'down'`, `sub`). As APIs divergiam no nome e no tipo do mesmo campo.
 */
export function KpiCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  accent = 'neutral',
  isLoading = false,
  className,
  onClick,
}: KpiCardProps) {
  if (isLoading) {
    return (
      <Card accent={accent} className={cn('animate-pulse', className)}>
        <div className="h-4 w-24 rounded bg-slate-100" />
        <div className="mt-3 h-8 w-32 rounded bg-slate-100" />
        <div className="mt-3 h-3 w-20 rounded bg-slate-100" />
      </Card>
    );
  }

  const conteudo = (
    <Card accent={accent} interactive={!!onClick} className={cn('flex flex-col', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-slate-600">{title}</p>
        {Icon && <Icon size={18} strokeWidth={1.5} className="shrink-0 text-slate-400" />}
      </div>

      {/* `tabular-nums` para os dígitos não dançarem quando o valor muda em tempo
          real — os painéis actualizam por websocket. */}
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-3xl">
        {value}
      </p>

      {(trend !== undefined || description) && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {trend !== undefined && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                trend > 0
                  ? 'bg-emerald-50 text-emerald-700'
                  : trend < 0
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-slate-100 text-slate-500',
              )}
            >
              {trend > 0 ? '+' : ''}
              {trend.toFixed(1)}%
            </span>
          )}
          {description && <span className="text-xs text-slate-400">{description}</span>}
        </div>
      )}
    </Card>
  );

  if (!onClick) return conteudo;

  // Um `<button>` a sério, e não um `div` com `onClick`: dá navegação por teclado e
  // faz um leitor de ecrã anunciá-lo como botão. `text-left` porque o conteúdo do
  // cartão é alinhado à esquerda e o `button` centra por omissão.
  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      {conteudo}
    </button>
  );
}

// ── Cartão de funcionalidade ─────────────────────────────────────────────────

export interface FeatureCardProps {
  title: string;
  description: string;
  icon?: React.ElementType;
  accent?: VariantProps<typeof cardVariants>['accent'];
  onClick?: () => void;
  className?: string;
}

/**
 * Ícone, título e descrição — o cartão da imagem de referência.
 *
 * Serve os ecrãs de escolha (sugestões da Mayra, atalhos de secção) onde antes havia
 * cartões com emoji e três tamanhos de texto diferentes.
 */
export function FeatureCard({
  title,
  description,
  icon: Icon,
  accent = 'primary',
  onClick,
  className,
}: FeatureCardProps) {
  return (
    <Card
      accent={accent}
      interactive={!!onClick}
      className={cn('text-left', className)}
      onClick={onClick}
      // Um cartão clicável tem de ser alcançável pelo teclado. Sem isto, quem navega
      // por tabulação passa por cima dele sem o ver.
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {Icon && <Icon size={20} strokeWidth={1.5} className="text-slate-500" />}
      <h3 className="mt-3 text-base font-bold leading-snug tracking-tight text-slate-900">
        {title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{description}</p>
    </Card>
  );
}
