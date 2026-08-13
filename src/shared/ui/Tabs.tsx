import { cn } from '@/shared/utils';

/**
 * A barra de separadores das secções.
 *
 * ## Porque existe
 *
 * Havia oito barras de separadores no projecto, cada uma escrita à mão — no POS, nas
 * Compras, nas Lojas, no Stock, no CRM, no Financeiro, no drawer de colaborador e no
 * modal de loja. Em duas variantes de cor (`border-blue-600` e `border-slate-900`),
 * consoante quem a copiou primeiro.
 *
 * Esta tarefa acrescenta quatro (Produtos no Stock, Fornecedores nas Compras, as três
 * do RH, o histórico no POS). Sem um componente comum ficariam doze cópias, e a
 * décima terceira herdaria os defeitos de uma delas.
 *
 * ## O que as versões escritas à mão não faziam
 *
 * Nenhuma das oito tinha `role="tablist"` nem `aria-selected`: para um leitor de ecrã
 * eram botões soltos, sem indicação de qual estava activo. E nenhuma respondia às
 * setas do teclado — a navegação entre separadores obrigava a percorrer todos com Tab.
 */

export interface TabDefinition<T extends string> {
  id: T;
  label: string;
  icon?: React.ElementType;
  /** Contagem ou aviso à direita do rótulo. */
  badge?: string | number;
}

interface TabsProps<T extends string> {
  tabs: TabDefinition<T>[];
  active: T;
  onChange: (id: T) => void;
  /** Rótulo do grupo, para leitores de ecrã. */
  label: string;
  className?: string;
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  label,
  className,
}: TabsProps<T>) {
  // Setas para andar entre separadores, Home e End para os extremos — o que o padrão
  // ARIA de tablist prevê e que nenhuma das versões copiadas à mão fazia.
  const aoTeclado = (evento: React.KeyboardEvent, indice: number) => {
    const ultimo = tabs.length - 1;

    const destino =
      evento.key === 'ArrowRight' || evento.key === 'ArrowDown'
        ? indice === ultimo ? 0 : indice + 1
        : evento.key === 'ArrowLeft' || evento.key === 'ArrowUp'
          ? indice === 0 ? ultimo : indice - 1
          : evento.key === 'Home'
            ? 0
            : evento.key === 'End'
              ? ultimo
              : null;

    if (destino === null) return;

    evento.preventDefault();
    onChange(tabs[destino].id);
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      // `overflow-x-auto` porque cinco separadores com ícone não cabem num telemóvel;
      // sem isto, os últimos ficavam inalcançáveis.
      className={cn('relative flex gap-1 overflow-x-auto border-b border-slate-200', className)}
    >
      {tabs.map((tab, indice) => {
        const activo = tab.id === active;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activo}
            // Só o separador activo entra na ordem de tabulação: o teclado navega
            // entre eles com as setas, e não com Tab. Sem isto, um grupo de cinco
            // separadores obrigava a cinco Tabs para passar à frente.
            tabIndex={activo ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => aoTeclado(e, indice)}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3.5 -mb-px',
              'text-sm font-medium transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-t',
              activo
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
            )}
          >
            {Icon && <Icon size={16} className="flex-shrink-0" />}
            {tab.label}
            {tab.badge !== undefined && tab.badge !== '' && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                  activo ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600',
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
