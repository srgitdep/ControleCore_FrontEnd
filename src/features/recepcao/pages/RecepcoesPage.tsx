import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { BarraDaPagina, Button } from '@/shared/ui';
import { cn } from '@/shared/utils';
import { COR_ESTADO, ROTULO_ESTADO, type EstadoRecepcao } from '../api/recepcao.api';
import { useRecepcoes } from '../hooks/useRecepcoes';
import { AbrirDescargaModal } from '../components/AbrirDescargaModal';

/**
 * As descargas em curso.
 *
 * ## A ordem do filtro
 *
 * Por omissão mostram-se todas, e não só as abertas. Quem chega a este ecrã tanto pode vir
 * abrir uma descarga como ver o que aconteceu à de ontem — e esconder as terminadas obrigaria
 * a descobrir o filtro para responder à segunda pergunta.
 */
const FILTROS: { id: EstadoRecepcao | 'TODAS'; rotulo: string }[] = [
  { id: 'TODAS', rotulo: 'Todas' },
  { id: 'EM_CONFERENCIA', rotulo: 'A contar' },
  { id: 'AGUARDA_APROVACAO', rotulo: 'A aguardar decisão' },
  { id: 'CONFERIDA', rotulo: 'Por lançar' },
  { id: 'STOCK_LANCADO', rotulo: 'Lançadas' },
];

export function RecepcoesPage() {
  const [filtro, setFiltro] = useState<EstadoRecepcao | 'TODAS'>('TODAS');
  const [aAbrir, setAAbrir] = useState(false);

  const { data: sessoes, isLoading } = useRecepcoes(
    filtro === 'TODAS' ? undefined : { estado: filtro },
  );

  const porDecidir = sessoes?.filter((s) => s.estado === 'AGUARDA_APROVACAO').length ?? 0;

  return (
    <div className="space-y-4">
      <BarraDaPagina
        resumo={
          sessoes && (
            <>
              {sessoes.length} descarga(s)
              {porDecidir > 0 && (
                <span className="text-amber-600 font-medium">
                  {' '}
                  · {porDecidir} à espera de decisão
                </span>
              )}
            </>
          )
        }
        acoes={<Button onClick={() => setAAbrir(true)}>Abrir descarga</Button>}
      />

      <div className="flex gap-2 flex-wrap">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-full border transition-colors',
              filtro === f.id
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
            )}
          >
            {f.rotulo}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-slate-400">A carregar…</p>}

      {!isLoading && sessoes?.length === 0 && (
        <div className="text-center py-16 rounded-lg border border-dashed border-slate-200">
          <Truck className="mx-auto mb-3 text-slate-300" size={32} />
          <p className="text-sm text-slate-500">Nenhuma descarga neste filtro.</p>
          <p className="text-xs text-slate-400 mt-1">
            Uma descarga abre-se sobre um pedido de compra, e traz as linhas que faltam receber.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sessoes?.map((sessao) => (
          <Link
            key={sessao.id}
            to={`/recepcoes/${sessao.id}`}
            className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="font-semibold text-slate-900">{sessao.numero}</span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0',
                  COR_ESTADO[sessao.estado],
                )}
              >
                {ROTULO_ESTADO[sessao.estado]}
              </span>
            </div>

            <p className="text-sm text-slate-700 truncate">
              {sessao.fornecedor?.nome ?? 'Fornecedor desconhecido'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {sessao.armazem?.nome} · {sessao._count.linhas} linha(s)
              {sessao.documentoRef && ` · doc. ${sessao.documentoRef}`}
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              Aberta por {sessao.abertaPor?.name ?? '—'} em{' '}
              {new Date(sessao.abertaEm).toLocaleString('pt-PT', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </Link>
        ))}
      </div>

      {aAbrir && <AbrirDescargaModal aoFechar={() => setAAbrir(false)} />}
    </div>
  );
}
