import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeftRight, PackageX, Truck } from 'lucide-react';
import { BarraDaPagina, Button, Card, Tabs, type TabDefinition } from '@/shared/ui';
import { cn } from '@/shared/utils';
import {
  COR_ESTADO_TRANSFERENCIA,
  ROTULO_ESTADO_TRANSFERENCIA,
  transferenciasApi,
  type Transferencia,
} from '../api/transferencias.api';

type Separador = 'lista' | 'transito';

const SEPARADORES: TabDefinition<Separador>[] = [
  { id: 'lista', label: 'Transferências', icon: ArrowLeftRight },
  { id: 'transito', label: 'A caminho', icon: Truck },
];

export function TransferenciasPage() {
  const [separador, setSeparador] = useState<Separador>('lista');

  const { data: transferencias } = useQuery({
    queryKey: ['transferencias'],
    queryFn: () => transferenciasApi.listar(),
  });

  const aCaminho = transferencias?.filter((t) => t.estado === 'EM_TRANSITO').length ?? 0;

  return (
    <div className="space-y-4">
      <BarraDaPagina
        resumo={
          transferencias && (
            <>
              {transferencias.length} transferência(s)
              {aCaminho > 0 && (
                <span className="font-medium text-amber-600"> · {aCaminho} a caminho</span>
              )}
            </>
          )
        }
      />

      <Tabs
        tabs={SEPARADORES}
        active={separador}
        onChange={setSeparador}
        label="Vistas das transferências"
      />

      {separador === 'lista' ? <Lista /> : <PainelEmTransito />}
    </div>
  );
}

function Lista() {
  const queryClient = useQueryClient();

  const { data: transferencias, isLoading } = useQuery({
    queryKey: ['transferencias'],
    queryFn: () => transferenciasApi.listar(),
  });

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['transferencias'] });
    queryClient.invalidateQueries({ queryKey: ['stocks'] });
    queryClient.invalidateQueries({ queryKey: ['alertas'] });
  };

  const aoFalhar = (erro: any) =>
    toast.error(erro?.response?.data?.message || 'Não foi possível concluir a operação.');

  const aprovar = useMutation({
    mutationFn: (id: string) => transferenciasApi.aprovar(id),
    onSuccess: () => {
      invalidar();
      toast.success('Aprovada. A mercadoria ainda não saiu.');
    },
    onError: aoFalhar,
  });

  const cancelar = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      transferenciasApi.cancelar(id, motivo),
    onSuccess: () => {
      invalidar();
      toast.success('Transferência cancelada.');
    },
    onError: aoFalhar,
  });

  if (isLoading) return <p className="text-sm text-slate-400">A carregar…</p>;

  if (!transferencias?.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 py-16 text-center">
        <ArrowLeftRight className="mx-auto mb-3 text-slate-300" size={32} />
        <p className="text-sm text-slate-500">Nenhuma transferência.</p>
        <p className="mt-1 text-xs text-slate-400">
          Entre duas arrecadações da mesma loja continue a usar a transferência directa, no
          ecrã do stock. Isto é para a mercadoria que atravessa uma estrada.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transferencias.map((t) => (
        <div key={t.id} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-900">{t.numero}</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-medium',
                    COR_ESTADO_TRANSFERENCIA[t.estado as keyof typeof COR_ESTADO_TRANSFERENCIA],
                  )}
                >
                  {
                    ROTULO_ESTADO_TRANSFERENCIA[
                      t.estado as keyof typeof ROTULO_ESTADO_TRANSFERENCIA
                    ]
                  }
                </span>
              </div>

              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-700">
                {t.origem?.nome}
                <ArrowLeftRight size={14} className="text-slate-400" />
                {t.destino?.nome}
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                {t._count?.itens ?? t.itens?.length ?? 0} linha(s)
                {t.motivo && ` · ${t.motivo}`}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {t.estado === 'SOLICITADA' && (
                <Button size="sm" onClick={() => aprovar.mutate(t.id)}>
                  Aprovar
                </Button>
              )}

              {(t.estado === 'APROVADA' || t.estado === 'EM_TRANSITO') && (
                <ExpedirOuReceber transferenciaId={t.id} estado={t.estado} />
              )}

              {t.estado !== 'RECEBIDA' && t.estado !== 'CANCELADA' && t.estado !== 'EM_TRANSITO' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const motivo = window.prompt('Porque está a cancelar?');
                    if (motivo?.trim()) cancelar.mutate({ id: t.id, motivo: motivo.trim() });
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Expedir e receber num só componente porque a interacção é a mesma: confirmar quantidades
 * linha a linha. O que muda é o que se compara contra — o pedido na expedição, o expedido na
 * recepção — e é o servidor que valida ambos.
 */
function ExpedirOuReceber({
  transferenciaId,
  estado,
}: {
  transferenciaId: string;
  estado: string;
}) {
  const queryClient = useQueryClient();
  const [aberto, setAberto] = useState(false);

  const { data: transferencia } = useQuery({
    queryKey: ['transferencia', transferenciaId],
    queryFn: () => transferenciasApi.obter(transferenciaId),
    enabled: aberto,
  });

  const [quantidades, setQuantidades] = useState<Record<string, number>>({});

  const expedir = estado === 'APROVADA';

  const accao = useMutation({
    mutationFn: (itens: { itemId: string; quantidade: number }[]) =>
      expedir
        ? transferenciasApi.expedir(transferenciaId, itens)
        : transferenciasApi.receber(transferenciaId, itens),
    onSuccess: (t: Transferencia) => {
      queryClient.invalidateQueries({ queryKey: ['transferencias'] });
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      setAberto(false);

      if (!expedir && t.perdas.length > 0) {
        const total = t.perdas.reduce((s, p) => s + p.perdida, 0);
        toast.error(`Recebida, mas ${total} unidades não chegaram. A perda ficou registada.`);
      } else {
        toast.success(expedir ? 'Mercadoria expedida.' : 'Mercadoria recebida.');
      }
    },
    onError: (erro: any) =>
      toast.error(erro?.response?.data?.message || 'Não foi possível concluir a operação.'),
  });

  if (!aberto) {
    return (
      <Button size="sm" onClick={() => setAberto(true)}>
        {expedir ? 'Expedir' : 'Receber'}
      </Button>
    );
  }

  const linhas = (transferencia?.itens ?? []).filter(
    (i) => expedir || i.quantidadeExpedida > 0,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="font-semibold text-slate-900">
            {expedir ? 'Expedir mercadoria' : 'Receber mercadoria'}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {expedir
              ? 'A partir daqui a mercadoria não está em nenhum armazém, e a transferência já não pode ser cancelada.'
              : 'O que não chegar fica registado como perda em trânsito — é a única forma de a distinguir de uma quebra no armazém.'}
          </p>
        </div>

        <div className="max-h-96 space-y-2 overflow-y-auto p-5">
          {linhas.map((item) => {
            const maximo = expedir ? item.quantidadeSolicitada : item.quantidadeExpedida;
            const valor = quantidades[item.id] ?? maximo;

            return (
              <div key={item.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-800">
                    {item.produto?.nome ?? item.produtoId}
                  </p>
                  <p className="text-xs text-slate-400">
                    {expedir ? 'Pedido' : 'Expedido'}: {maximo}
                    {item.lote && ` · lote ${item.lote.codigo}`}
                  </p>
                </div>

                <input
                  type="number"
                  value={valor}
                  max={maximo}
                  min={0}
                  onChange={(e) =>
                    setQuantidades((q) => ({ ...q, [item.id]: Number(e.target.value) || 0 }))
                  }
                  className="w-24 rounded border border-slate-200 px-2 py-1 text-right"
                />
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <Button variant="ghost" onClick={() => setAberto(false)}>
            Cancelar
          </Button>
          <Button
            disabled={accao.isPending || linhas.length === 0}
            onClick={() =>
              accao.mutate(
                linhas.map((item) => ({
                  itemId: item.id,
                  quantidade:
                    quantidades[item.id] ??
                    (expedir ? item.quantidadeSolicitada : item.quantidadeExpedida),
                })),
              )
            }
          >
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * O que está a caminho.
 *
 * Não conta como disponível em lado nenhum — é o §36 — mas quem decide uma compra tem de saber
 * que existe, senão encomenda ao fornecedor o que já vem no caminho da outra loja.
 */
function PainelEmTransito() {
  const { data: emTransito, isLoading } = useQuery({
    queryKey: ['transferencias', 'em-transito'],
    queryFn: () => transferenciasApi.emTransito(),
  });

  if (isLoading) return <p className="text-sm text-slate-400">A carregar…</p>;

  if (!emTransito?.length) {
    return (
      <Card>
        <div className="py-12 text-center">
          <PackageX className="mx-auto mb-3 text-slate-300" size={28} />
          <p className="text-sm text-slate-500">Nada em trânsito.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full min-w-[38rem] text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Produto</th>
            <th className="px-3 py-2 text-left font-medium">Destino</th>
            <th className="px-3 py-2 text-right font-medium">Quantidade</th>
            <th className="px-3 py-2 text-left font-medium">Transferências</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {emTransito.map((linha) => (
            <tr key={`${linha.produtoId}:${linha.destinoId}`}>
              <td className="px-3 py-2 font-medium text-slate-800">{linha.produto}</td>
              <td className="px-3 py-2 text-slate-600">{linha.destino}</td>
              <td className="px-3 py-2 text-right font-semibold">
                {linha.quantidade} {linha.unidade}
              </td>
              <td className="px-3 py-2 text-xs text-slate-500">
                {linha.transferencias.map((t) => `${t.numero} (de ${t.origem})`).join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
