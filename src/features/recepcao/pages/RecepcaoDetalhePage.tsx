import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ClipboardCheck, Eye, PackageCheck } from 'lucide-react';
import { Button, Card, Tabs, type TabDefinition } from '@/shared/ui';
import { cn } from '@/shared/utils';
import { COR_ESTADO, ROTULO_ESTADO, type LinhaRecepcao } from '../api/recepcao.api';
import { useRecepcao, useRecepcaoMutations } from '../hooks/useRecepcoes';
import { PainelDoConferente } from '../components/PainelDoConferente';

type Separador = 'conferencia' | 'documento';

const SEPARADORES: TabDefinition<Separador>[] = [
  { id: 'conferencia', label: 'Conferência', icon: ClipboardCheck },
  { id: 'documento', label: 'Documento e divergências', icon: Eye },
];

export function RecepcaoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const [separador, setSeparador] = useState<Separador>('conferencia');

  const { data: sessao, isLoading } = useRecepcao(id);
  const accoes = useRecepcaoMutations(id);

  if (isLoading) return <p className="p-6 text-sm text-slate-400">A carregar…</p>;
  if (!sessao) return <p className="p-6 text-sm text-slate-500">Descarga não encontrada.</p>;

  const porContar = sessao.linhas.filter((l) => !l.contadoEm).length;
  const divergencias = sessao.linhas.flatMap((l) => l.comparacao.divergencias);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          {/*
            Aponta para o separador e não para `/recepcoes`, que agora só redirecciona:
            passar pelo redireccionamento daria um salto a mais e deixaria na barra de
            endereço um URL que já não é o do ecrã.
          */}
          <Link
            to="/compras?tab=recepcoes"
            className="mb-1 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft size={14} /> Descargas
          </Link>

          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-semibold text-slate-900">{sessao.numero}</h2>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                COR_ESTADO[sessao.estado],
              )}
            >
              {ROTULO_ESTADO[sessao.estado]}
            </span>
          </div>

          <p className="text-sm text-slate-500 mt-1">
            {sessao.fornecedor?.nome ?? 'Fornecedor desconhecido'} · {sessao.armazem?.nome}
            {sessao.documentoRef && ` · doc. ${sessao.documentoRef}`}
          </p>
        </div>

        <AccoesDaDescarga sessao={sessao} accoes={accoes} porContar={porContar} />
      </div>

      {sessao.estado === 'AGUARDA_APROVACAO' && (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex gap-3 p-4">
            <AlertTriangle className="shrink-0 text-amber-600" size={20} />
            <div className="text-sm text-amber-900">
              <p className="font-medium">
                {divergencias.length} divergência(s) à espera de decisão.
              </p>
              <p className="mt-1 text-amber-800">
                A mercadoria não entra no stock enquanto ninguém assumir a diferença. Quem
                conferiu não pode aprovar — é o que torna a verificação uma verificação.
              </p>
            </div>
          </div>
        </Card>
      )}

      {sessao.estado === 'REJEITADA' && sessao.motivoRejeicao && (
        <Card className="border-red-200 bg-red-50">
          <p className="p-4 text-sm text-red-900">
            <span className="font-medium">Rejeitada:</span> {sessao.motivoRejeicao}
          </p>
        </Card>
      )}

      <Tabs tabs={SEPARADORES} active={separador} onChange={setSeparador} label="Vistas da descarga" />

      {separador === 'conferencia' ? (
        <PainelDoConferente sessaoId={sessao.id} />
      ) : (
        <TabelaDoDocumento sessao={sessao} />
      )}
    </div>
  );
}

function AccoesDaDescarga({
  sessao,
  accoes,
  porContar,
}: {
  sessao: ReturnType<typeof useRecepcao>['data'] & {};
  accoes: ReturnType<typeof useRecepcaoMutations>;
  porContar: number;
}) {
  const pedirMotivo = (pergunta: string) => {
    const motivo = window.prompt(pergunta);
    return motivo?.trim() ? motivo.trim() : null;
  };

  const emContagem = sessao.estado === 'ABERTA' || sessao.estado === 'EM_CONFERENCIA';
  const podeLancar = sessao.estado === 'CONFERIDA' || sessao.estado === 'APROVADA';

  return (
    <div className="flex gap-2 flex-wrap">
      {emContagem && (
        <Button
          onClick={() => accoes.conferir.mutate()}
          disabled={accoes.conferir.isPending || porContar > 0}
          // Desactivado com linhas por contar, e a razão fica no `title`: uma linha por contar
          // entraria com zero, e a falta apareceria depois como quebra de inventário.
          title={
            porContar > 0
              ? `Faltam contar ${porContar} linha(s). Uma linha por contar entraria com zero.`
              : 'Fechar a conferência'
          }
        >
          Fechar conferência
        </Button>
      )}

      {sessao.estado === 'AGUARDA_APROVACAO' && (
        <>
          <Button onClick={() => accoes.aprovar.mutate()} disabled={accoes.aprovar.isPending}>
            Aprovar divergência
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const motivo = pedirMotivo('Porque está a rejeitar esta descarga?');
              if (motivo) accoes.rejeitar.mutate(motivo);
            }}
          >
            Rejeitar
          </Button>
        </>
      )}

      {podeLancar && (
        <Button
          onClick={() => accoes.lancar.mutate(undefined)}
          disabled={accoes.lancar.isPending}
        >
          <PackageCheck size={16} className="mr-1.5" />
          Lançar no stock
        </Button>
      )}

      {(sessao.estado === 'CONFERIDA' ||
        sessao.estado === 'AGUARDA_APROVACAO' ||
        sessao.estado === 'REJEITADA') && (
        <Button variant="ghost" onClick={() => accoes.reabrir.mutate()}>
          Reabrir para recontar
        </Button>
      )}

      {sessao.estado !== 'STOCK_LANCADO' && sessao.estado !== 'CANCELADA' && (
        <Button
          variant="ghost"
          onClick={() => {
            const motivo = pedirMotivo('Porque está a cancelar esta descarga?');
            if (motivo) accoes.cancelar.mutate(motivo);
          }}
        >
          Cancelar
        </Button>
      )}
    </div>
  );
}

/**
 * A vista administrativa: as três vias lado a lado, com custos.
 *
 * É aqui que se vê o que a conferência não mostra — o que a factura diz e o que isso custa — e
 * é por isso que está num separador diferente e não na mesma tabela.
 */
function TabelaDoDocumento({
  sessao,
}: {
  sessao: ReturnType<typeof useRecepcao>['data'] & {};
}) {
  const { actualizarLinha } = useRecepcaoMutations(sessao.id);
  const editavel = sessao.estado !== 'STOCK_LANCADO' && sessao.estado !== 'CANCELADA';

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm min-w-[52rem]">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="text-left px-3 py-2 font-medium">Produto</th>
            <th className="text-right px-3 py-2 font-medium">Pedido</th>
            <th className="text-right px-3 py-2 font-medium">Factura</th>
            <th className="text-right px-3 py-2 font-medium">Descarregado</th>
            <th className="text-right px-3 py-2 font-medium">Aceite</th>
            <th className="text-right px-3 py-2 font-medium">Danificado</th>
            <th className="text-right px-3 py-2 font-medium">Custo</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {sessao.linhas.map((linha) => (
            <LinhaDoDocumento
              key={linha.id}
              linha={linha}
              editavel={editavel}
              aoGravar={(payload) => actualizarLinha.mutate({ linhaId: linha.id, ...payload })}
            />
          ))}
        </tbody>
      </table>

      <p className="px-3 py-2 text-xs text-slate-400 border-t border-slate-100">
        Tolerância de divergência em vigor: {sessao.tolerancia}%. Configurável nas definições da
        empresa.
      </p>
    </div>
  );
}

function LinhaDoDocumento({
  linha,
  editavel,
  aoGravar,
}: {
  linha: LinhaRecepcao;
  editavel: boolean;
  aoGravar: (payload: { quantidadeFacturada?: number; custoUnitario?: number }) => void;
}) {
  const [facturada, setFacturada] = useState(linha.quantidadeFacturada);
  const [custo, setCusto] = useState(linha.custoUnitario);

  const alterada = facturada !== linha.quantidadeFacturada || custo !== linha.custoUnitario;
  const temDivergencia = linha.comparacao.divergencias.length > 0;

  return (
    <>
      <tr className={cn(temDivergencia && 'bg-amber-50/50')}>
        <td className="px-3 py-2">
          <p className="font-medium text-slate-800">{linha.produto?.nome ?? linha.produtoId}</p>
          {linha.unidade && (
            <p className="text-xs text-slate-400">
              em {linha.unidade.codigo}
              {linha.factorConversao && linha.factorConversao !== 1 && (
                <> · 1 {linha.unidade.codigo} = {linha.factorConversao} un.</>
              )}
            </p>
          )}
        </td>

        <td className="px-3 py-2 text-right text-slate-500">{linha.quantidadePedida}</td>

        <td className="px-3 py-2 text-right">
          <input
            type="number"
            value={facturada}
            disabled={!editavel}
            onChange={(e) => setFacturada(Number(e.target.value) || 0)}
            onBlur={() => alterada && aoGravar({ quantidadeFacturada: facturada, custoUnitario: custo })}
            className="w-20 text-right rounded border border-slate-200 px-2 py-1 disabled:bg-transparent disabled:border-transparent"
          />
        </td>

        <td className="px-3 py-2 text-right font-medium">{linha.quantidadeDescarregada}</td>
        <td className="px-3 py-2 text-right text-emerald-700">{linha.quantidadeAceite}</td>
        <td
          className={cn(
            'px-3 py-2 text-right',
            linha.quantidadeDanificada > 0 ? 'text-red-600 font-medium' : 'text-slate-400',
          )}
        >
          {linha.quantidadeDanificada}
        </td>

        <td className="px-3 py-2 text-right">
          <input
            type="number"
            value={custo}
            disabled={!editavel}
            onChange={(e) => setCusto(Number(e.target.value) || 0)}
            onBlur={() => alterada && aoGravar({ quantidadeFacturada: facturada, custoUnitario: custo })}
            className="w-24 text-right rounded border border-slate-200 px-2 py-1 disabled:bg-transparent disabled:border-transparent"
          />
        </td>
      </tr>

      {temDivergencia && (
        <tr className="bg-amber-50/50">
          <td colSpan={7} className="px-3 pb-2">
            <ul className="text-xs text-amber-900 space-y-0.5">
              {linha.comparacao.divergencias.map((d, i) => (
                <li key={i} className="flex gap-1.5">
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                  <span>
                    {d.descricao}
                    {!d.exigeAprovacao && (
                      <span className="text-amber-600"> (dentro da tolerância)</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </>
  );
}
