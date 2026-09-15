import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, Truck, ClipboardList, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils';
import { usePesquisaGlobal } from '../hooks/usePesquisaGlobal';
import { LABEL_POR_TIPO, ROTA_POR_TIPO, type ResultadoPesquisa, type TipoResultadoPesquisa } from '../types/pesquisa.types';

const ICONE_POR_TIPO: Record<TipoResultadoPesquisa, React.ElementType> = {
  PRODUTO: Package,
  FORNECEDOR: Truck,
  REQUISICAO: ClipboardList,
  SOURCING: FileText,
  ORDEM_COMPRA: FileText,
};

/**
 * A pesquisa global do cabeçalho — DT01 §7.1.
 *
 * "Ao seleccionar um resultado, o sistema abre a entidade correspondente. Esta
 * pesquisa não altera os filtros da tabela de necessidades" — por isso vive no
 * `Header`, fora de qualquer página com filtros próprios, e nunca escreve em nenhum
 * estado que não seja o seu.
 */
export function PesquisaGlobal() {
  const [termo, setTermo] = useState('');
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: resultados, isFetching } = usePesquisaGlobal(termo);

  useEffect(() => {
    const aoClicarFora = (evento: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(evento.target as Node)) {
        setAberto(false);
      }
    };
    document.addEventListener('mousedown', aoClicarFora);
    return () => document.removeEventListener('mousedown', aoClicarFora);
  }, []);

  const seleccionar = (resultado: ResultadoPesquisa) => {
    navigate(ROTA_POR_TIPO[resultado.tipo]);
    setAberto(false);
    setTermo('');
  };

  const categorias: { tipo: TipoResultadoPesquisa; itens: ResultadoPesquisa[] }[] = resultados
    ? (
        [
          { tipo: 'PRODUTO', itens: resultados.produtos },
          { tipo: 'FORNECEDOR', itens: resultados.fornecedores },
          { tipo: 'REQUISICAO', itens: resultados.requisicoes },
          { tipo: 'SOURCING', itens: resultados.sourcing },
          { tipo: 'ORDEM_COMPRA', itens: resultados.ordensCompra },
        ] as const
      ).filter((c) => c.itens.length > 0)
    : [];

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={termo}
          onChange={(e) => {
            setTermo(e.target.value);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          placeholder="Pesquisar produtos, fornecedores, requisições, ordens de compra... Ctrl+K"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-slate-400 focus:bg-white focus:outline-none"
        />
        {isFetching && (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
        )}
      </div>

      {aberto && termo.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {resultados?.total === 0 && !isFetching && (
            <p className="px-4 py-6 text-center text-sm text-slate-400">Sem resultados para "{termo}".</p>
          )}

          {categorias.map(({ tipo, itens }) => {
            const Icone = ICONE_POR_TIPO[tipo];
            return (
              <div key={tipo} className="border-b border-slate-100 py-1.5 last:border-0">
                <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {LABEL_POR_TIPO[tipo]}
                </p>
                {itens.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => seleccionar(item)}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm hover:bg-slate-50',
                    )}
                  >
                    <Icone size={15} className="shrink-0 text-slate-400" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-slate-800">{item.titulo}</span>
                      {item.subtitulo && (
                        <span className="block truncate text-xs text-slate-400">{item.subtitulo}</span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
