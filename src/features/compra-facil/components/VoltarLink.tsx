import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface VoltarLinkProps {
  to: string;
  children: ReactNode;
}

/**
 * O link de "voltar" da loja — um único sítio para o ícone e o estilo, depois de
 * várias páginas terem ficado cada uma com a sua versão (`←` em texto, ou nenhum
 * sinal visual), o que o utilizador não reconhecia como um botão de navegação.
 */
export function VoltarLink({ to, children }: VoltarLinkProps) {
  return (
    <Link to={to} className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
      <ArrowLeft size={15} />
      {children}
    </Link>
  );
}
