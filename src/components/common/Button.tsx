import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ─── CVA Variants ─────────────────────────────────────────────────────────────
const buttonVariants = cva(
  // Base: inclui transition, font, focus ring e disabled state
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        default:
          'bg-slate-900 text-white hover:bg-slate-700 focus-visible:ring-slate-900',
        outline:
          'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-slate-400',
        ghost:
          'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400',
        destructive:
          'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500',
        success:
          'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500',
        warning:
          'bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-400',
        link:
          'text-blue-600 underline-offset-4 hover:underline p-0 h-auto focus-visible:ring-blue-500',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4',
        lg: 'h-10 px-6 text-base',
        // WCAG 2.5.5: target size mínimo de 44×44px para targets de toque
        // Obrigatório para PDV/POS em ecrãs touch (tablets de caixa)
        touch: 'min-h-[44px] min-w-[44px] px-6 text-base',
        icon: 'h-9 w-9 p-0',
        'icon-touch': 'min-h-[44px] min-w-[44px] p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';

export { buttonVariants };
