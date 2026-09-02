import { useState } from 'react';
import { Check, Minus, Plus, ScanLine } from 'lucide-react';
import { Button } from '@/shared/ui';
import { cn } from '@/shared/utils';
import type { LinhaParaConferente } from '../api/recepcao.api';
import { useConferencia, useRecepcaoMutations } from '../hooks/useRecepcoes';

/**
 * O ecrã de quem está no cais.
 *
 * ## O que não aparece aqui, e porquê
 *
 * Não há preços. Não há a quantidade que a factura diz. Quem conta com o número esperado à
 * frente conta contra ele em vez de contra a prateleira — e uma diferença que custa dinheiro
 * tende a ser arredondada para o número que fecha. É o §22–23, e não é uma preferência de
 * apresentação: os dados não chegam sequer ao browser, porque a API do conferente não os
 * devolve.
 *
 * ## Botões grandes, contagem rápida
 *
 * O §25 pede +1, +2, +5, +10. A razão é física: quem faz isto tem uma caixa numa mão e o
 * telemóvel na outra, muitas vezes de luvas. Um campo de texto com teclado numérico é
 * utilizável num escritório e não num cais de descarga.
 */
export function PainelDoConferente({ sessaoId }: { sessaoId: string }) {
  const { data: sessao, isLoading } = useConferencia(sessaoId);
  const { contar } = useRecepcaoMutations(sessaoId);

  if (isLoading) return <p className="p-6 text-sm text-slate-400">A carregar…</p>;
  if (!sessao) return null;

  const contadas = sessao.linhas.filter((l) => l.contadoEm).length;
  const total = sessao.linhas.length;
  const podeContar = sessao.estado === 'ABERTA' || sessao.estado === 'EM_CONFERENCIA';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{contadas}</span> de {total} linhas
          contadas
        </p>

        {!podeContar && (
          <span className="text-xs text-amber-600">
            A conferência está fechada. Reabra para recontar.
          </span>
        )}
      </div>

      {sessao.linhas.map((linha) => (
        <LinhaParaContar
          key={linha.id}
          linha={linha}
          activa={podeContar}
          aGravar={contar.isPending}
          aoGravar={(valores) => contar.mutate({ linhaId: linha.id, ...valores })}
        />
      ))}
    </div>
  );
}

const ATALHOS = [1, 2, 5, 10];

function LinhaParaContar({
  linha,
  activa,
  aGravar,
  aoGravar,
}: {
  linha: LinhaParaConferente;
  activa: boolean;
  aGravar: boolean;
  aoGravar: (valores: {
    quantidadeDescarregada: number;
    quantidadeAceite: number;
    quantidadeDanificada: number;
  }) => void;
}) {
  const [descarregada, setDescarregada] = useState(linha.quantidadeDescarregada);
  const [danificada, setDanificada] = useState(linha.quantidadeDanificada);

  // A aceite é derivada e não digitada. Pedir os três números a quem conta obrigaria a fazer
  // a subtracção de cabeça — e é essa subtracção que o servidor recusa quando não fecha.
  const aceite = Math.max(descarregada - danificada, 0);
  const invalida = danificada > descarregada;

  const contada = !!linha.contadoEm;
  const alterada =
    descarregada !== linha.quantidadeDescarregada || danificada !== linha.quantidadeDanificada;

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        contada && !alterada ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-white',
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-medium text-slate-900 truncate">{linha.produto ?? linha.produtoId}</p>

          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
            {linha.codigoBarras && (
              <span className="inline-flex items-center gap-1">
                <ScanLine size={12} />
                {linha.codigoBarras}
              </span>
            )}
            {linha.unidade && <span>Contar em {linha.unidade}</span>}
            {linha.exigeLote && <span className="text-amber-600">exige lote</span>}
            {linha.exigeValidade && <span className="text-amber-600">exige validade</span>}
          </p>

          {contada && (
            <p className="text-[11px] text-slate-400 mt-1">
              Contado por {linha.contadoPor ?? 'alguém'} ·{' '}
              {new Date(linha.contadoEm!).toLocaleTimeString('pt-PT', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>

        {contada && !alterada && <Check className="shrink-0 text-emerald-500" size={20} />}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Contador
          rotulo="Descarregado"
          valor={descarregada}
          activo={activa}
          aoMudar={setDescarregada}
        />
        <Contador
          rotulo="Danificado"
          valor={danificada}
          activo={activa}
          aoMudar={setDanificada}
          discreto
        />
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <p className="text-sm">
          <span className="text-slate-500">Aceite: </span>
          <span
            className={cn('font-semibold', invalida ? 'text-red-600' : 'text-slate-900')}
          >
            {invalida ? '—' : aceite}
          </span>
          {invalida && (
            <span className="ml-2 text-xs text-red-600">
              Danificado não pode ser maior do que o descarregado.
            </span>
          )}
        </p>

        <Button
          size="sm"
          disabled={!activa || invalida || aGravar || (contada && !alterada)}
          onClick={() =>
            aoGravar({
              quantidadeDescarregada: descarregada,
              quantidadeAceite: aceite,
              quantidadeDanificada: danificada,
            })
          }
        >
          {contada ? 'Corrigir' : 'Gravar'}
        </Button>
      </div>
    </div>
  );
}

function Contador({
  rotulo,
  valor,
  activo,
  aoMudar,
  discreto,
}: {
  rotulo: string;
  valor: number;
  activo: boolean;
  aoMudar: (v: number) => void;
  discreto?: boolean;
}) {
  const somar = (delta: number) => aoMudar(Math.max(Number((valor + delta).toFixed(3)), 0));

  return (
    <div>
      <label className={cn('text-xs font-medium', discreto ? 'text-slate-500' : 'text-slate-700')}>
        {rotulo}
      </label>

      <div className="flex items-center gap-2 mt-1">
        <button
          type="button"
          disabled={!activo}
          onClick={() => somar(-1)}
          className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          aria-label={`Menos um em ${rotulo}`}
        >
          <Minus size={16} />
        </button>

        <input
          type="number"
          inputMode="decimal"
          value={valor}
          disabled={!activo}
          onChange={(e) => aoMudar(Math.max(Number(e.target.value) || 0, 0))}
          className="w-20 h-10 text-center text-lg font-semibold rounded-lg border border-slate-200 focus:border-blue-400 focus:outline-none disabled:bg-slate-50"
        />

        <button
          type="button"
          disabled={!activo}
          onClick={() => somar(1)}
          className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          aria-label={`Mais um em ${rotulo}`}
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex gap-1.5 mt-2">
        {ATALHOS.map((n) => (
          <button
            key={n}
            type="button"
            disabled={!activo}
            onClick={() => somar(n)}
            className="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            +{n}
          </button>
        ))}
      </div>
    </div>
  );
}
