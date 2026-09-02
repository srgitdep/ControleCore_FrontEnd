import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, ClipboardList, EyeOff } from 'lucide-react';
import { useCreateCycle } from '@/features/stock';
import { useArmazens } from '@/features/lojas';
import { api } from '@/shared/config';
import { Button } from '@/shared/ui';

interface CreateCycleModalProps {
  onClose: () => void;
}

interface NoLocalizacao {
  id: string;
  caminho: string;
  filhos: NoLocalizacao[];
}

/**
 * Abrir um ciclo de contagem.
 *
 * ## O âmbito é o que muda tudo
 *
 * Sem âmbito, um inventário é o armazém inteiro num dia — o que na prática significa fechar a
 * loja, ou não contar. Com âmbito, conta-se o corredor B na terça e o C na quarta, com a loja
 * aberta. É a diferença entre um balanço anual e um inventário rotativo.
 *
 * Dois ciclos em corredores diferentes coexistem; dois que se cruzem são recusados pelo
 * servidor, porque ajustariam o mesmo saldo duas vezes.
 */
export function CreateCycleModal({ onClose }: CreateCycleModalProps) {
  const [name, setName] = useState('');
  const [armazemId, setArmazemId] = useState('');
  const [localizacaoId, setLocalizacaoId] = useState('');
  const [contagemCega, setContagemCega] = useState(true);

  const { mutate: createCycle, isPending, error } = useCreateCycle();
  const { armazens } = useArmazens();

  const { data: arvore } = useQuery({
    queryKey: ['localizacoes', armazemId],
    queryFn: async () => {
      const { data } = await api.get<{ arvore: NoLocalizacao[] }>(
        `/armazens/${armazemId}/localizacoes`,
      );
      return data;
    },
    enabled: !!armazemId,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createCycle(
      {
        name: name.trim(),
        armazemId: armazemId || undefined,
        localizacaoId: localizacaoId || undefined,
        contagemCega,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Novo Ciclo de Inventário</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label
                htmlFor="cycle-name"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Nome do ciclo
              </label>
              <input
                id="cycle-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Corredor B — terça"
                required
                autoFocus
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Fica visível para quem conta.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Armazém <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <select
                value={armazemId}
                onChange={(e) => {
                  setArmazemId(e.target.value);
                  // A localização escolhida pertence ao armazém anterior. Mantê-la daria um
                  // âmbito impossível que o servidor recusaria depois de tudo preenchido.
                  setLocalizacaoId('');
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">A empresa inteira</option>
                {armazens.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.etiqueta}
                  </option>
                ))}
              </select>
            </div>

            {armazemId && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Corredor ou prateleira{' '}
                  <span className="font-normal text-slate-400">(opcional)</span>
                </label>
                <select
                  value={localizacaoId}
                  onChange={(e) => setLocalizacaoId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">O armazém inteiro</option>
                  {achatar(arvore?.arvore ?? []).map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.caminho}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-slate-400">
                  Contar «B / 04» inclui tudo o que está por baixo. É o que permite contar um
                  corredor de cada vez, com a loja aberta.
                </p>
              </div>
            )}

            <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={contagemCega}
                onChange={(e) => setContagemCega(e.target.checked)}
                className="mt-1 rounded border-slate-300"
              />
              <span className="text-sm">
                <span className="flex items-center gap-1.5 font-medium text-slate-800">
                  <EyeOff size={14} />
                  Contagem cega
                </span>
                <span className="block mt-0.5 text-xs text-slate-500">
                  Quem conta não vê o que o sistema espera. Com o número esperado à frente,
                  contar transforma-se em confirmar — e uma contagem que confirma nunca
                  encontra nada.
                </span>
              </span>
            </label>

            {error && (
              <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">
                {(error as any)?.response?.data?.message ??
                  'Erro ao criar ciclo. Tente novamente.'}
              </p>
            )}
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim() || isPending}>
              {isPending ? 'A criar...' : 'Criar ciclo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** A árvore vem aninhada; o selector precisa de uma lista. O caminho já diz a profundidade. */
function achatar(nos: NoLocalizacao[]): NoLocalizacao[] {
  return nos.flatMap((no) => [no, ...achatar(no.filhos ?? [])]);
}
