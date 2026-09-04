import './OrgChart.css';

export interface DepartmentNode {
  id: string;
  name: string;
  role: string;
  /**
   * Opcional, porque na base de dados é anulável.
   *
   * Estava tipado como obrigatório e renderizado directamente num `src`: um nó sem
   * fotografia dava um `src` vazio e o browser mostrava o ícone de imagem quebrada. Passa
   * a cair nas iniciais, que é o que o resto da aplicação faz.
   */
  imageUrl?: string | null;
  children?: DepartmentNode[];
}

const OrgNode = ({ node }: { node: DepartmentNode }) => {
  return (
    <li>
      <div className="inline-flex flex-col items-center">
        {node.imageUrl ? (
          <img
            src={node.imageUrl}
            alt={node.name}
            className="w-16 h-16 rounded-full border-4 border-slate-100 shadow-md object-cover z-10 relative"
          />
        ) : (
          <div
            aria-hidden
            className="w-16 h-16 rounded-full border-4 border-slate-100 shadow-md bg-teal-700 text-white flex items-center justify-center text-xl font-bold z-10 relative"
          >
            {node.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="mt-[-1rem] pt-5 pb-2 px-4 bg-teal-600 rounded shadow-lg min-w-[140px]">
          <h3 className="text-white text-sm font-bold truncate">
            {node.name}
          </h3>
          <p className="text-teal-100 text-xs mt-1 truncate italic">
            {node.role}
          </p>
        </div>
      </div>

      {node.children && node.children.length > 0 && (
        <ul>
          {node.children.map(child => (
            <OrgNode key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
};

/**
 * A árvore. Aceita uma raiz ou várias.
 *
 * O servidor devolve um nó quando há um topo único e um **array** quando há vários — uma
 * empresa com dois sócios no topo, ou com nós cujo gerente foi removido. O tipo aceitava
 * só um nó, pelo que o segundo caso quebrava a renderização.
 *
 * `className` existe para o gráfico poder viver dentro de um separador: o fundo escuro e o
 * `min-h-screen` de omissão foram desenhados para uma página inteira.
 */
export const HRChart = ({
  data,
  className = 'p-10 bg-slate-900 min-h-screen',
}: {
  data: DepartmentNode | DepartmentNode[];
  className?: string;
}) => {
  const raizes = Array.isArray(data) ? data : [data];

  return (
    <div className={`${className} flex justify-center overflow-x-auto org-tree`}>
      <ul>
        {raizes.map((raiz) => (
          <OrgNode key={raiz.id} node={raiz} />
        ))}
      </ul>
    </div>
  );
};
