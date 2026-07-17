import { Hammer } from 'lucide-react';

export function EmDesenvolvimentoPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
      <Hammer size={48} className="mb-4 text-blue-500 opacity-50" />
      <h2 className="text-2xl font-bold text-slate-700">Em Desenvolvimento</h2>
      <p className="mt-2 text-center text-sm">
        Esta secção ainda está a ser construída e estará disponível nas próximas fases.
      </p>
    </div>
  );
}
