import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/shared/ui';
import { cn } from '@/shared/utils';
import {
  COR_ESTADO_CONTRATO,
  ROTULO_ESTADO_CONTRATO,
  contratosApi,
  type Contrato,
} from '../api/contratos.api';

const moeda = (valor: number) =>
  valor.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });

const dataCurta = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * Os contratos de um colaborador: o que está em vigor e os que já cá estiveram.
 *
 * ## Porque o histórico e não só o actual
 *
 * O contrato activo responde «quanto ganha». O histórico responde «quanto ganhava», e é
 * essa a pergunta de uma auditoria, de um recálculo de retroactivos ou de uma discussão
 * sobre um recibo antigo. Uma renovação cria um contrato novo em vez de reescrever o
 * anterior justamente para essa resposta continuar a existir.
 */
export function ContratosDoColaborador({
  userId,
  nome,
}: {
  userId: string;
  nome?: string;
}) {
  const queryClient = useQueryClient();
  const [aCriar, setACriar] = useState(false);

  const { data: contratos, isLoading } = useQuery({
    queryKey: ['contratos', userId],
    queryFn: () => contratosApi.historico(userId),
  });

  const criar = useMutation({
    mutationFn: contratosApi.criar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos', userId] });
      // O perfil 360 mostra o salário base, que vem do contrato em vigor.
      queryClient.invalidateQueries({ queryKey: ['employee-360', userId] });
      setACriar(false);
      toast.success('Contrato registado.');
    },
    onError: (erro: any) =>
      toast.error(erro?.response?.data?.message || 'Não foi possível registar o contrato.'),
  });

  const emVigor = (contratos ?? []).find((c) => c.estado === 'ATIVO');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Contratos</h3>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            O salário base do contrato em vigor é de onde o processamento de vencimento parte.
            Sem contrato registado, o salário processado é zero.
          </p>
        </div>

        <Button size="sm" onClick={() => setACriar(true)}>
          <Plus size={14} className="mr-1.5" />
          {emVigor ? 'Renovar' : 'Registar contrato'}
        </Button>
      </div>

      {isLoading && <p className="text-sm text-slate-400">A carregar…</p>}

      {!isLoading && (contratos ?? []).length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Sem contrato registado.</p>
          <p className="mt-0.5 text-amber-800">
            O perfil mostra o salário base a nulo e o processamento de vencimento não tem de
            que partir.
          </p>
        </div>
      )}

      {(contratos ?? []).length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[30rem] text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Cargo</th>
                <th className="px-3 py-2 text-right font-medium">Salário base</th>
                <th className="px-3 py-2 text-left font-medium">Período</th>
                <th className="px-3 py-2 text-left font-medium">Estado</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {contratos!.map((c) => (
                <LinhaDeContrato key={c.id} contrato={c} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {aCriar && (
        <ModalDeContrato
          userId={userId}
          nome={nome}
          anterior={emVigor}
          aGravar={criar.isPending}
          aoFechar={() => setACriar(false)}
          aoCriar={(payload) => criar.mutate(payload)}
        />
      )}
    </div>
  );
}

function LinhaDeContrato({ contrato }: { contrato: Contrato }) {
  return (
    <tr className={cn(contrato.estado !== 'ATIVO' && 'text-slate-400')}>
      <td className="px-3 py-2 font-medium text-slate-900">{contrato.cargo}</td>
      <td className="px-3 py-2 text-right font-semibold text-slate-900">
        {moeda(Number(contrato.salarioBase))}
      </td>
      <td className="px-3 py-2 text-slate-600">
        {dataCurta(contrato.dataInicio)}
        {contrato.dataFim ? ` — ${dataCurta(contrato.dataFim)}` : ' — sem termo'}
      </td>
      <td className="px-3 py-2">
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[11px] font-medium',
            COR_ESTADO_CONTRATO[contrato.estado],
          )}
        >
          {ROTULO_ESTADO_CONTRATO[contrato.estado]}
        </span>
      </td>
    </tr>
  );
}

function ModalDeContrato({
  userId,
  nome,
  anterior,
  aGravar,
  aoCriar,
  aoFechar,
}: {
  userId: string;
  nome?: string;
  anterior?: Contrato;
  aGravar: boolean;
  aoCriar: (payload: {
    userId: string;
    cargo: string;
    salarioBase: number;
    dataInicio: string;
    dataFim?: string;
    observacoes?: string;
  }) => void;
  aoFechar: () => void;
}) {
  // Numa renovação, o cargo e o salário do contrato anterior são o ponto de partida
  // natural: o que muda é normalmente um dos dois, não os dois e as datas.
  const [cargo, setCargo] = useState(anterior?.cargo ?? '');
  const [salario, setSalario] = useState(anterior ? String(anterior.salarioBase) : '');
  const [dataInicio, setDataInicio] = useState(() => new Date().toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const valido = !!cargo.trim() && salario !== '' && Number(salario) >= 0 && !!dataInicio;
  const fimAntesDoInicio = !!dataFim && dataFim < dataInicio;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="font-semibold text-slate-900">
            {anterior ? 'Renovar contrato' : 'Registar contrato'}
          </h3>
          {nome && <p className="mt-0.5 text-xs text-slate-500">{nome}</p>}
        </div>

        <div className="space-y-4 p-5">
          {anterior && (
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              O contrato em vigor não é sobrescrito: fica no histórico com as suas datas, e é
              o que permite responder mais tarde quanto esta pessoa ganhava e quando.
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700">Cargo</label>
            <input
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Operador de caixa"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Salário base (MT)</label>
            <input
              type="number"
              step="any"
              min="0"
              value={salario}
              onChange={(e) => setSalario(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-right text-sm focus:border-blue-400 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-400">
              O valor mensal bruto. O valor/dia e o valor/hora do processamento saem daqui e
              dos dias escalados no mês.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Início</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Fim <span className="text-slate-400">(opcional)</span>
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
            </div>
          </div>

          {fimAntesDoInicio && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              A data de fim é anterior à de início.
            </p>
          )}

          {!dataFim && !fimAntesDoInicio && (
            <p className="text-xs text-slate-400">Sem data de fim, o contrato é sem termo.</p>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700">
              Observações <span className="text-slate-400">(opcional)</span>
            </label>
            <input
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Renovação anual, subida de escalão"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <Button variant="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button
            disabled={!valido || fimAntesDoInicio || aGravar}
            onClick={() =>
              aoCriar({
                userId,
                cargo: cargo.trim(),
                salarioBase: Number(salario),
                dataInicio,
                dataFim: dataFim || undefined,
                observacoes: observacoes.trim() || undefined,
              })
            }
          >
            {anterior ? 'Renovar' : 'Registar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
