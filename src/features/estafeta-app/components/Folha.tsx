import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

/**
 * Uma folha que sobe do fundo do ecrã — o formato natural no telemóvel, ao alcance do polegar. Fecha com
 * o botão, com um toque fora ou com Esc. Impede o fundo de rolar enquanto está aberta.
 */
export function Folha({
  titulo,
  aoFechar,
  children,
}: {
  titulo: string;
  aoFechar: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const aTecla = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar();
    document.addEventListener('keydown', aTecla);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', aTecla);
      document.body.style.overflow = overflow;
    };
  }, [aoFechar]);

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-slate-900/50" role="dialog" aria-modal="true" aria-label={titulo}>
      <button type="button" aria-label="×" className="absolute inset-0 cursor-default" onClick={aoFechar} tabIndex={-1} />
      <div className="relative mx-auto max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">{titulo}</h2>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="×"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
