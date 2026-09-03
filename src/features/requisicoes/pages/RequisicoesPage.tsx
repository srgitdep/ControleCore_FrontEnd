import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ClipboardList } from 'lucide-react';
import { Button, Card, ConfirmDialog } from '@/shared/ui';
import { cn } from '@/shared/utils';
import {
  COR_ESTADO_REQUISICAO,
  COR_PRIORIDADE,
  ROTULO_ESTADO_REQUISICAO,
  numeroDeLinhas,
  type Requisicao,
} from '../api/requisicoes.api';
import { useEscaloes, useRequisicaoMutations, useRequisicoes } from '../hooks/useRequisicoes';
import { ConverterEmOrdemModal } from '../components/ConverterEmOrdemModal';
import { CriarRequisicaoModal } from '../components/CriarRequisicaoModal';

/**
 * As requisições de compra, como separador da secção Compras.
 *
 * ## Sem barra de página nem separadores próprios
 *
 * Vive dentro dos separadores de Compras. Uma barra de página aqui repetiria a que já está
 * em cima, e separadores dentro de separadores obrigariam quem navega a lembrar-se em qual
 * dos dois níveis estava.
 *
 * Os escalões de aprovação saíram para a Configuração: são uma regra da empresa e não uma
 * operação, e lá ficam ao lado de «quem confere pode aprovar», que é a mesma espécie de
 * decisão.
 */
export function RequisicoesPage() {
  const [aCriar, setACriar] = useState(false);
  const { data: requisicoes } = useRequisicoes();
  const { data: tabela } = useEscaloes();

  const aEsperar = requisicoes?.filter((r) => r.estado === 'SUBMETIDA').length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {requisicoes?.length ?? 0} requisição(ões)
          {aEsperar > 0 && (
            <span className="font-medium text-amber-600"> · {aEsperar} à espera de decisão</span>
          )}
        </p>

        <Button onClick={() => setACriar(true)}>Nova requisição</Button>
      </div>

      {/*
        O aviso dos escalões aparece aqui, e não só onde eles se editam. Um buraco entre
        escalões manifesta-se como uma requisição que fica presa — e ninguém liga as duas
        coisas se o aviso só estiver do outro lado.
      */}
      {(tabela?.problemas.length ?? 0) > 0 && (
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
              <Link
                to="/configuracoes?tab=escaloes"
                className="mt-2 inline-block font-medium text-amber-900 underline"
              >
                Corrigir os escalões
              </Link>
            </div>
          </div>
        </Card>
      )}

      <ListaDeRequisicoes />

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

  // Qual decisão está a ser tomada, ou nenhuma. Um só estado para as duas: são o mesmo
  // diálogo com outro título, e dois booleanos permitiriam abrir os dois ao mesmo tempo.
  const [aDecidir, setADecidir] = useState<'recusar' | 'cancelar' | null>(null);

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
                onClick={() => setADecidir('recusar')}
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
            <Button size="sm" variant="ghost" onClick={() => setADecidir('cancelar')}>
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {aConverter && (
        <ConverterEmOrdemModal requisicao={r} aoFechar={() => setAConverter(false)} />
      )}

      <ConfirmDialog
        isOpen={aDecidir !== null}
        variant={aDecidir === 'recusar' ? 'warning' : 'danger'}
        title={
          aDecidir === 'recusar' ? `Recusar ${r.numero}` : `Cancelar ${r.numero}`
        }
        message={
          aDecidir === 'recusar'
            ? 'A requisição volta a quem a pediu, que a pode corrigir e submeter outra vez.'
            : 'A requisição fica terminada. Não há forma de a reabrir.'
        }
        confirmText={aDecidir === 'recusar' ? 'Recusar' : 'Cancelar requisição'}
        cancelText="Fechar"
        motivo={{
          rotulo: `Porque está a ${aDecidir}?`,
          placeholder:
            aDecidir === 'recusar'
              ? 'O valor está acima do orçamento deste mês'
              : 'A ruptura foi resolvida com stock de outra loja',
          ajuda:
            aDecidir === 'recusar'
              ? `${r.solicitante?.name ?? 'Quem pediu'} vê este texto, e é por ele que sabe o que corrigir.`
              : 'Fica no registo da requisição e em auditoria.',
        }}
        isLoading={accoes.rejeitar.isPending || accoes.cancelar.isPending}
        onCancel={() => setADecidir(null)}
        onConfirm={(motivo) => {
          if (!motivo) return;

          const accao =
            aDecidir === 'recusar' ? accoes.rejeitar : accoes.cancelar;

          accao.mutate(
            { requisicaoId: r.id, motivo },
            { onSuccess: () => setADecidir(null) },
          );
        }}
      />
    </div>
  );
}
