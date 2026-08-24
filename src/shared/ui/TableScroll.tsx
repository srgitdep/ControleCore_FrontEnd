import { useEffect, useRef, useState } from 'react';
import { cn } from '@/shared/utils';

/**
 * Envolve uma tabela larga, permitindo deslizá-la na horizontal com indicação de que há
 * mais para ver.
 *
 * ## Porque não basta `overflow-x-auto`
 *
 * Oito tabelas do sistema não tinham `overflow-x-auto` nenhum — em `overflow-hidden`,
 * as colunas eram simplesmente cortadas e não havia forma de as alcançar. Mas mesmo
 * onde existia, faltava o essencial: **nada indicava que havia mais colunas**. Num
 * telemóvel a barra de deslocamento está escondida até se tocar, pelo que uma tabela
 * cortada parece uma tabela completa.
 *
 * Este componente acrescenta um degradê nas margens que só aparece quando há conteúdo
 * escondido desse lado. É o mesmo sinal que as aplicações nativas usam, e desaparece
 * quando se chega ao fim — não é decoração permanente.
 *
 * ## Quando usar isto e quando usar `ResponsiveTable`
 *
 * `ResponsiveTable` troca a tabela por cartões abaixo de `sm`, e é o certo para as
 * listas principais de um ecrã (clientes, utilizadores) onde cada linha é uma entidade.
 *
 * Este serve os casos onde os cartões seriam pior: matrizes de comparação, tabelas com
 * campos editáveis, e tabelas dentro de modais — onde um cartão por linha criaria
 * deslocamento vertical dentro de deslocamento vertical.
 */
export function TableScroll({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [temAntes, setTemAntes] = useState(false);
  const [temDepois, setTemDepois] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const verificar = () => {
      // Margem de 1px: com escalas de zoom não inteiras, `scrollLeft` pode ficar em
      // 0.5 no início, e o degradê apareceria sem haver nada escondido.
      setTemAntes(el.scrollLeft > 1);
      setTemDepois(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };

    verificar();
    el.addEventListener('scroll', verificar, { passive: true });

    // A tabela pode mudar de largura sem a janela mudar: uma coluna que aparece, um
    // filtro que reduz as linhas, dados que chegam depois. Um listener de `resize` da
    // janela não apanharia nada disto.
    const observador = new ResizeObserver(verificar);
    observador.observe(el);
    if (el.firstElementChild) observador.observe(el.firstElementChild);

    return () => {
      el.removeEventListener('scroll', verificar);
      observador.disconnect();
    };
  }, []);

  return (
    <div className={cn('relative', className)}>
      <div ref={ref} className="overflow-x-auto custom-scrollbar">
        {children}
      </div>

      {/* `pointer-events-none` para o degradê não interceptar o toque sobre a última
          coluna — que é justamente a que está debaixo dele. */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white to-transparent transition-opacity duration-200',
          temAntes ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent transition-opacity duration-200',
          temDepois ? 'opacity-100' : 'opacity-0',
        )}
      />
    </div>
  );
}
