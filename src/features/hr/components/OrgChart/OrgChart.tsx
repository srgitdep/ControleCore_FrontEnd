import './OrgChart.css';

export interface DepartmentNode {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  children?: DepartmentNode[];
}

const OrgNode = ({ node }: { node: DepartmentNode }) => {
  return (
    <li>
      <div className="inline-flex flex-col items-center">
        <img 
          src={node.imageUrl} 
          alt={node.name} 
          className="w-16 h-16 rounded-full border-4 border-slate-100 shadow-md object-cover z-10 relative" 
        />
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

export const HRChart = ({ data }: { data: DepartmentNode }) => {
  return (
    <div className="p-10 bg-slate-900 min-h-screen flex justify-center overflow-x-auto org-tree">
      <ul>
        <OrgNode node={data} />
      </ul>
    </div>
  );
};
