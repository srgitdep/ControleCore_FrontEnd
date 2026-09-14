import { useMemo, useState } from 'react';
import { Camera, Search, CheckCircle2, Circle, MapPin, PackageX, History } from 'lucide-react';
import { useInventoryCycleDetail, useCobertura } from '@/features/stock';
import { LeitorCameraContagemModal } from '../LeitorCameraContagemModal';
import { ContagemItemPanel } from './ContagemItemPanel';
import { HistoricoContagemModal } from './HistoricoContagemModal';
import type { InventoryCount, InventoryItemStatus } from '@/features/stock';

const FILTROS: Array<{ key: 'TODOS' | InventoryItemStatus; label: string }> = [
  { key: 'TODOS', label: 'Todos' },
  { key: 'PENDENTE', label: 'Pendentes' },
  { key: 'CONTADO', label: 'Contados' },
  { key: 'ZERO_CONFIRMADO', label: 'Zero' },
  { key: 'FORA_DA_LOCALIZACAO', label: 'Fora da localização' },
];

const STATUS_BADGE: Record<InventoryItemStatus, { label: string; className: string; icon: React.ReactNode }> = {
  PENDENTE: { label: 'Pendente', className: 'bg-rose-100 text-rose-700', icon: <Circle className="h-3 w-3" /> },
  EM_CONTAGEM: { label: 'Em contagem', className: 'bg-amber-100 text-amber-700', icon: <Circle className="h-3 w-3" /> },
  CONTADO: { label: 'Contado', className: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="h-3 w-3" /> },
  ZERO_CONFIRMADO: { label: 'Zero confirmado', className: 'bg-slate-100 text-slate-600', icon: <CheckCircle2 className="h-3 w-3" /> },
  FORA_DA_LOCALIZACAO: { label: 'Fora da localização', className: 'bg-amber-100 text-amber-700', icon: <MapPin className="h-3 w-3" /> },
  RECONTAGEM_PENDENTE: { label: 'Recontagem pendente', className: 'bg-purple-100 text-purple-700', icon: <Circle className="h-3 w-3" /> },
  RECONTADO: { label: 'Recontado', className: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="h-3 w-3" /> },
};

/**
 * A tela de contagem cega em si (§5): indicadores, filtros, lista de itens
 * agrupados por localização, e o painel de registo do item selecionado.
 */
export function PainelContagem({ cycleId }: { cycleId: string }) {
  const { data: cycle, isLoading } = useInventoryCycleDetail(cycleId);
  const { data: cobertura } = useCobertura(cycleId, { poll: true });
  const [filtro, setFiltro] = useState<'TODOS' | InventoryItemStatus>('TODOS');
  const [busca, setBusca] = useState('');
  const [itemSelecionadoId, setItemSelecionadoId] = useState<string | null>(null);
  const [leitorAberto, setLeitorAberto] = useState(false);
  const [itemHistoricoId, setItemHistoricoId] = useState<string | null>(null);

  // Referência estável: `cycle?.counts ?? []` criaria um array novo a cada
  // render enquanto `cycle` for undefined, invalidando a memoização abaixo.
  const counts = useMemo(() => cycle?.counts ?? [], [cycle]);

  const localizacoesDoArmazem = useMemo(() => {
    const mapa = new Map<string, { id: string; codigo: string; nome: string | null; caminho: string }>();
    for (const c of counts) {
      if (c.localizacaoEsperada) mapa.set(c.localizacaoEsperada.id, c.localizacaoEsperada);
    }
    return [...mapa.values()];
  }, [counts]);

  const indicadores = useMemo(() => {
    const total = counts.length;
    const contados = counts.filter((c) => c.status === 'CONTADO').length;
    const zero = counts.filter((c) => c.status === 'ZERO_CONFIRMADO').length;
    const fora = counts.filter((c) => c.status === 'FORA_DA_LOCALIZACAO').length;
    const pendentes = counts.filter((c) => c.status === 'PENDENTE' || c.status === 'EM_CONTAGEM').length;
    const feitos = contados + zero + fora;
    return { total, contados, zero, fora, pendentes, progresso: total > 0 ? Math.round((feitos / total) * 100) : 0 };
  }, [counts]);

  const itensFiltrados = useMemo(() => {
    return counts
      .filter((c) => filtro === 'TODOS' || c.status === filtro)
      .filter((c) => {
        if (!busca.trim()) return true;
        const termo = busca.trim().toLowerCase();
        return (
          c.stock?.product?.nome?.toLowerCase().includes(termo) ||
          c.stock?.product?.codigoBarras?.toLowerCase().includes(termo) ||
          c.localizacaoEsperada?.codigo?.toLowerCase().includes(termo)
        );
      });
  }, [counts, filtro, busca]);

  const itemSelecionado = counts.find((c) => c.id === itemSelecionadoId) ?? null;
  const itemHistorico = counts.find((c) => c.id === itemHistoricoId) ?? null;

  if (isLoading || !cycle) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Badge Inventário Cego */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
        <PackageX className="h-5 w-5 shrink-0 text-blue-500" />
        <p className="text-xs text-blue-700">
          <span className="font-semibold">Inventário Cego.</span> O sistema não mostra as
          quantidades teóricas. Conte o que existe fisicamente.
        </p>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {[
          { rotulo: 'No inventário', valor: indicadores.total },
          { rotulo: 'Contados', valor: indicadores.contados, cor: 'text-emerald-600' },
          { rotulo: 'Zero confirmado', valor: indicadores.zero },
          { rotulo: 'Fora da localização', valor: indicadores.fora, cor: 'text-amber-600' },
          { rotulo: 'Pendentes', valor: indicadores.pendentes, cor: 'text-rose-600' },
        ].map((m) => (
          <div key={m.rotulo} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="text-[11px] text-slate-500">{m.rotulo}</p>
            <p className={`text-lg font-bold ${m.cor ?? 'text-slate-800'}`}>{m.valor}</p>
          </div>
        ))}
      </div>

      {/* Progresso */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>Progresso de contagem</span>
          <span className="font-semibold text-slate-700">{indicadores.progresso}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${indicadores.progresso}%` }}
          />
        </div>
      </div>

      {(cobertura ? cobertura.pendentes > 0 : indicadores.pendentes > 0) && (
        <p className="text-xs text-amber-600">
          Ainda existem {cobertura?.pendentes ?? indicadores.pendentes} produto(s) por verificar.
          Conclua todos os produtos antes de finalizar o inventário.
        </p>
      )}

      {/* Filtros + busca + câmara */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filtro === f.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar produto..."
              className="rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setLeitorAberto(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
          >
            <Camera size={14} />
            Câmara
          </button>
        </div>
      </div>

      {/* Lista de itens */}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
          <div className="max-h-[520px] overflow-y-auto divide-y divide-slate-50">
            {itensFiltrados.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-400">Nenhum item encontrado.</p>
            ) : (
              itensFiltrados.map((item) => (
                <ItemLinha
                  key={item.id}
                  item={item}
                  selecionado={item.id === itemSelecionadoId}
                  onSelecionar={() => setItemSelecionadoId(item.id)}
                  onVerHistorico={() => setItemHistoricoId(item.id)}
                />
              ))
            )}
          </div>
        </div>

        <div>
          {itemSelecionado ? (
            <ContagemItemPanel
              cycleId={cycleId}
              item={itemSelecionado}
              localizacoesDoArmazem={localizacoesDoArmazem}
              onConcluido={() => setItemSelecionadoId(null)}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400">
              Selecione um produto na lista para registar a contagem.
            </div>
          )}
        </div>
      </div>

      {leitorAberto && (
        <LeitorCameraContagemModal cycleId={cycleId} onFechar={() => setLeitorAberto(false)} />
      )}

      {itemHistorico && (
        <HistoricoContagemModal
          cycleId={cycleId}
          itemId={itemHistorico.id}
          produtoNome={itemHistorico.stock?.product?.nome}
          onClose={() => setItemHistoricoId(null)}
        />
      )}
    </div>
  );
}

function ItemLinha({
  item,
  selecionado,
  onSelecionar,
  onVerHistorico,
}: {
  item: InventoryCount;
  selecionado: boolean;
  onSelecionar: () => void;
  onVerHistorico: () => void;
}) {
  const badge = STATUS_BADGE[item.status];
  const produto = item.stock?.product;
  const jaTemHistorico = item.status !== 'PENDENTE';

  return (
    <div
      className={`flex w-full items-center gap-3 px-4 py-3 transition-colors ${
        selecionado ? 'bg-blue-50' : 'hover:bg-slate-50'
      }`}
    >
      <button onClick={onSelecionar} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.className}`}
        >
          {badge.icon}
          {badge.label}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-800">{produto?.nome ?? '—'}</p>
          <p className="text-[11px] text-slate-400">
            {produto?.codigoBarras ?? '—'} · {item.localizacaoEsperada?.codigo ?? '—'}
          </p>
        </div>
      </button>
      {jaTemHistorico && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVerHistorico();
          }}
          title="Ver histórico de alterações"
          className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <History className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
