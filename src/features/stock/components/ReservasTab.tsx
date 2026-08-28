import { useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, createColumnHelper } from '@tanstack/react-table';
import { AlarmClockOff, RotateCcw, Timer } from 'lucide-react';
import { ResponsiveTable, Button, KpiCard } from '@/shared/ui';
import { useReservaMutations, useReservas } from '../hooks/useReservas';
import type { EstadoReserva, ReservaStock } from '../types/stock.types';

const helper = createColumnHelper<ReservaStock>();

const ESTADO_META: Record<EstadoReserva, { label: string; pastilha: string }> = {
  ACTIVA: { label: 'Activa', pastilha: 'bg-blue-50 text-blue-700 border-blue-200' },
  CONSUMIDA: { label: 'Cumprida', pastilha: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  LIBERTADA: { label: 'Libertada', pastilha: 'bg-slate-50 text-slate-600 border-slate-200' },
  EXPIRADA: { label: 'Caducada', pastilha: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const ESTADOS: EstadoReserva[] = ['ACTIVA', 'CONSUMIDA', 'LIBERTADA', 'EXPIRADA'];

/**
 * Reservas de stock: mercadoria comprometida sem ter saído (§14).
 *
 * ## Abre nas activas
 *
 * São as únicas que contam para o disponível — as outras já não retêm nada. Mostrar tudo por
 * omissão faria a lista crescer com o histórico em vez de crescer com o que exige atenção, e
 * a pergunta que este ecrã responde é «o que está comprometido agora».
 *
 * As resolvidas ficam acessíveis por filtro, e valem: permitem medir quanto tempo mercadoria
 * esteve apartada sem sair, que é o sinal de reservas a mais ou de prazos longos demais.
 */
export function ReservasTab() {
  const [estado, setEstado] = useState<EstadoReserva | 'TODAS'>('ACTIVA');

  const { data: reservas, isFetching } = useReservas(
    estado === 'TODAS' ? undefined : { estado },
  );
  const mutacoes = useReservaMutations();

  const activas = (reservas ?? []).filter((r) => r.estado === 'ACTIVA');

  /** Quantas activas já passaram do prazo — o varrimento corre a cada dez minutos. */
  const jaVencidas = activas.filter(
    (r) => r.expiraEm !== null && new Date(r.expiraEm) < new Date(),
  );

  const colunas = useMemo(
    () => [
      helper.accessor((r) => r.stock?.product?.nome ?? '—', {
        id: 'produto',
        header: 'Produto',
        cell: (info) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-800">{info.getValue()}</p>
            <span className="block text-[11px] text-slate-500">
              {info.row.original.stock?.armazem?.nome ?? 'Armazém desconhecido'}
              {info.row.original.referencia && ` · ${info.row.original.referencia}`}
            </span>
          </div>
        ),
      }),
      helper.accessor('quantidade', {
        header: 'Quantidade',
        cell: (info) => (
          <span className="font-semibold tabular-nums text-slate-800">{info.getValue()}</span>
        ),
      }),
      helper.accessor('estado', {
        header: 'Estado',
        cell: (info) => (
          <span
            className={`inline-block rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${
              ESTADO_META[info.getValue()].pastilha
            }`}
          >
            {ESTADO_META[info.getValue()].label}
          </span>
        ),
      }),
      helper.accessor('expiraEm', {
        header: 'Prazo',
        cell: (info) => {
          const iso = info.getValue();
          const reserva = info.row.original;

          if (reserva.estado !== 'ACTIVA') {
            return (
              <span className="text-xs text-slate-400">
                {reserva.resolvidoEm
                  ? `resolvida a ${new Date(reserva.resolvidoEm).toLocaleDateString('pt-PT')}`
                  : '—'}
              </span>
            );
          }

          if (!iso) {
            return <span className="text-xs text-slate-500">sem prazo</span>;
          }

          const prazo = new Date(iso);
          const vencida = prazo < new Date();

          return (
            <span className={`text-xs tabular-nums ${vencida ? 'font-medium text-amber-700' : 'text-slate-600'}`}>
              {prazo.toLocaleString('pt-PT', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
              {/* Vencida mas ainda activa: o varrimento corre de dez em dez minutos, e dizê-lo
                  evita que se conclua que a caducidade não funciona. */}
              {vencida && <span className="block">prazo passado — a aguardar varrimento</span>}
            </span>
          );
        },
      }),
      helper.accessor((r) => r.criadoPor?.name ?? '—', {
        id: 'autor',
        header: 'Reservada por',
        cell: (info) => <span className="text-sm text-slate-600">{info.getValue()}</span>,
      }),
      helper.display({
        id: 'acoes',
        header: '',
        cell: ({ row }) =>
          row.original.estado === 'ACTIVA' ? (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                disabled={mutacoes.aDecorrer}
                onClick={() =>
                  mutacoes.libertar.mutate({
                    reservaId: row.original.id,
                    motivo: 'Libertada a partir da lista de reservas',
                  })
                }
                className="gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Libertar
              </Button>
            </div>
          ) : null,
      }),
    ],
    [mutacoes],
  );

  const table = useReactTable({
    data: reservas ?? [],
    columns: colunas,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard
          title="Reservas activas"
          value={activas.length}
          description="mercadoria comprometida sem ter saído"
          icon={Timer}
          accent="primary"
        />
        <KpiCard
          title="Unidades comprometidas"
          value={Number(activas.reduce((s, r) => s + r.quantidade, 0).toFixed(3))}
          description="fora do stock disponível"
          icon={Timer}
          accent="warning"
        />
        <KpiCard
          title="Com prazo passado"
          value={jaVencidas.length}
          description={
            jaVencidas.length > 0
              ? 'caducam no próximo varrimento'
              : 'nenhuma à espera de caducar'
          }
          icon={AlarmClockOff}
          accent={jaVencidas.length > 0 ? 'warning' : 'neutral'}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(['ACTIVA', ...ESTADOS.filter((e) => e !== 'ACTIVA')] as EstadoReserva[]).map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEstado(e)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                estado === e
                  ? 'border-slate-800 bg-slate-800 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {ESTADO_META[e].label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setEstado('TODAS')}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              estado === 'TODAS'
                ? 'border-slate-800 bg-slate-800 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Todas
          </button>
        </div>

        {/* O varrimento corre no servidor a cada dez minutos. Este botão antecipa-o, para
            quem precisa da mercadoria de volta agora e não dentro de nove minutos. */}
        <Button
          variant="ghost"
          size="sm"
          disabled={mutacoes.aDecorrer}
          onClick={() => mutacoes.expirarAgora.mutate()}
          className="gap-1.5"
        >
          <AlarmClockOff className="h-4 w-4" />
          Caducar as vencidas agora
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <ResponsiveTable
          table={table}
          isLoading={isFetching && !reservas}
          emptyMessage={
            estado === 'ACTIVA'
              ? 'Nenhuma reserva activa — todo o stock em armazém está disponível.'
              : 'Nenhuma reserva neste estado.'
          }
          getRowStatus={(r) =>
            r.estado === 'ACTIVA' && r.expiraEm !== null && new Date(r.expiraEm) < new Date()
              ? 'warning'
              : 'default'
          }
        />
      </div>

      <p className="px-1 text-xs leading-relaxed text-slate-500">
        Reservar não é vender: a mercadoria continua no armazém e continua a valer no
        inventário, mas sai do stock disponível e não pode ser vendida no POS. Nenhuma destas
        operações gera movimento de stock, porque a existência física nunca muda.
      </p>
    </div>
  );
}
