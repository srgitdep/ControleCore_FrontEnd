import { useState } from 'react';
import { AlertTriangle, ClipboardList, Layers } from 'lucide-react';
import { BarraDaPagina, Button, Card, Tabs, type TabDefinition } from '@/shared/ui';
import { cn } from '@/shared/utils';
import {
  COR_ESTADO_REQUISICAO,
  COR_PRIORIDADE,
  ROTULO_ESTADO_REQUISICAO,
  numeroDeLinhas,
  type Requisicao,
} from '../api/requisicoes.api';
import { useEscaloes, useRequisicaoMutations, useRequisicoes } from '../hooks/useRequisicoes';
import { PainelDeEscaloes } from '../components/PainelDeEscaloes';
import { ConverterEmOrdemModal } from '../components/ConverterEmOrdemModal';
import { CriarRequisicaoModal } from '../components/CriarRequisicaoModal';

type Separador = 'pedidos' | 'escaloes';

const SEPARADORES: TabDefinition<Separador>[] = [
  { id: 'pedidos', label: 'Requisições', icon: ClipboardList },
  { id: 'escaloes', label: 'Escalões de aprovação', icon: Layers },
];

export function RequisicoesPage() {
  const [separador, setSeparador] = useState<Separador>('pedidos');
  const [aCriar, setACriar] = useState(false);
  const { data: requisicoes } = useRequisicoes();
  const { data: tabela } = useEscaloes();

  const aEsperar = requisicoes?.filter((r) => r.estado === 'SUBMETIDA').length ?? 0;

  return (
    <div className="space-y-4">
      <BarraDaPagina
        resumo={
          requisicoes && (
            <>
              {requisicoes.length} requisição(ões)
              {aEsperar > 0 && (
                <span className="font-medium text-amber-600">
                  {' '}
                  · {aEsperar} à espera de decisão
                </span>
              )}
            </>
          )
        }
        acoes={
          separador === 'pedidos' ? (
            <Button onClick={() => setACriar(true)}>Nova requisição</Button>
          ) : undefined
        }
      />

      {/*
        Os problemas da tabela de escalões aparecem no separador das requisições, e não só
        no dos escalões. Um buraco entre escalões manifesta-se como uma requisição que fica
        presa — e ninguém liga as duas coisas se o aviso só estiver do outro lado.
      */}
      {(tabela?.problemas.length ?? 0) > 0 && separador === 'pedidos' && (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex gap-3 p-4">
            <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={18} />
            <div className="text-sm text-amber-900">
              <p className="font-medium">A tabela de escalões tem problemas.</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-amber-800">
                {tabela!.problemas.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
              <button
                onClick={() => setSeparador('escaloes')}
                className="mt-2 font-medium text-amber-900 underline"
              >
                Corrigir os escalões
              </button>
            </div>
          </div>
        </Card>
      )}

      <Tabs
        tabs={SEPARADORES}
        active={separador}
        onChange={setSeparador}
        label="Secções das requisições"
      />

      {separador === 'pedidos' ? <ListaDeRequisicoes /> : <PainelDeEscaloes />}

      {aCriar && <CriarRequisicaoModal aoFechar={() => setACriar(false)} />}
    </div>
  );
}

function ListaDeRequisicoes() {
  const { data: requisicoes, isLoading } = useRequisicoes();
  const accoes = useRequisicaoMutations();

  if (isLoading) return <p className="text-sm text-slate-400">A carregar…</p>;

  if (!requisicoes?.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 py-16 text-center">
        <ClipboardList className="mx-auto mb-3 text-slate-300" size={32} />
        <p className="text-sm text-slate-500">Ainda não há requisições.</p>
        <p className="mt-1 text-xs text-slate-400">
          Uma requisição é onde «preciso disto» vive antes de virar «compra-se a este por
          tanto».
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requisicoes.map((r) => (
        <CartaoDeRequisicao key={r.id} requisicao={r} accoes={accoes} />
      ))}
    </div>
  );
}

function CartaoDeRequisicao({
  requisicao: r,
  accoes,
}: {
  requisicao: Requisicao;
  accoes: ReturnType<typeof useRequisicaoMutations>;
}) {
  const [aConverter, setAConverter] = useState(false);

  const pedirMotivo = (pergunta: string) => {
    const motivo = window.prompt(pergunta);
    return motivo?.trim() ? motivo.trim() : null;
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900">{r.numero}</span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-medium',
                COR_ESTADO_REQUISICAO[r.estado],
              )}
            >
              {ROTULO_ESTADO_REQUISICAO[r.estado]}
            </span>
            <span className={cn('text-xs', COR_PRIORIDADE[r.prioridade])}>{r.prioridade}</span>
          </div>

          <p className="mt-1 text-sm text-slate-700">
            {r.solicitante?.name ?? '—'}
            {r.departamento && ` · ${r.departamento}`}
            {r.armazem && ` · para ${r.armazem.nome}`}
          </p>

          {r.motivo && <p className="mt-1 text-sm text-slate-500 italic">«{r.motivo}»</p>}

          <p className="mt-1 text-xs text-slate-400">
            {numeroDeLinhas(r)} linha(s) · estimativa {r.valorEstimado.toFixed(2)} MT
            {r.escalaoAplicavel && ` · decide ${r.escalaoAplicavel.nome}`}
          </p>

          {r.motivoDecisao && (
            <p className="mt-1 text-xs text-red-600">Decisão: {r.motivoDecisao}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {r.estado === 'RASCUNHO' && (
            <Button size="sm" onClick={() => accoes.submeter.mutate(r.id)}>
              Submeter
            </Button>
          )}

          {r.estado === 'SUBMETIDA' && (
            <>
              <Button size="sm" onClick={() => accoes.aprovar.mutate(r.id)}>
                Aprovar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const motivo = pedirMotivo('Porque está a recusar?');
                  if (motivo) accoes.rejeitar.mutate({ requisicaoId: r.id, motivo });
                }}
              >
                Recusar
              </Button>
            </>
          )}

          {r.estado === 'APROVADA' && (
            <Button size="sm" onClick={() => setAConverter(true)}>
              Converter em ordem
            </Button>
          )}

          {r.estado !== 'CONVERTIDA' && r.estado !== 'CANCELADA' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const motivo = pedirMotivo('Porque está a cancelar?');
                if (motivo) accoes.cancelar.mutate({ requisicaoId: r.id, motivo });
              }}
            >
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {aConverter && (
        <ConverterEmOrdemModal requisicao={r} aoFechar={() => setAConverter(false)} />
      )}
    </div>
  );
}
