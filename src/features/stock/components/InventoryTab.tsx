import { useState } from 'react';
import {
  ClipboardList,
  Plus,
  ChevronRight,
  CheckCircle,
  Clock,
  Eye,
  Lock,
  AlertTriangle,
  BarChart3,
  Search,
  Package,
  X,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '@/features/auth';
import {
  useInventoryCycles,
  useInventoryCycleDetail,
  useUpdateCycleStatus,
  useCloseCycle,
  useRegisterCountByBarcode,
  inventoryApi,
} from '@/features/stock';
import { Button } from '@/shared/ui';
import { CreateCycleModal } from './CreateCycleModal';
import type { InventoryCycle, InventoryCycleStatus } from '@/features/stock';

// ──â”€ Status badges ────────────────────────────────────────────────────────────â”€
const STATUS_CONFIG: Record<
  InventoryCycleStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  OPEN: {
    label: 'Aberto',
    className: 'bg-blue-100 text-blue-700',
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  COUNTING: {
    label: 'Em Contagem',
    className: 'bg-amber-100 text-amber-700',
    icon: <BarChart3 className="h-3.5 w-3.5" />,
  },
  RECONCILING: {
    label: 'Conciliando',
    className: 'bg-purple-100 text-purple-700',
    icon: <Eye className="h-3.5 w-3.5" />,
  },
  CLOSED: {
    label: 'Fechado',
    className: 'bg-slate-100 text-slate-500',
    icon: <Lock className="h-3.5 w-3.5" />,
  },
};

// ──â”€ Operador: Contagem Cega ──────────────────────────────────────────────────
function OperatorCountView({ activeCycle }: { activeCycle: InventoryCycle }) {
  const [barcode, setBarcode] = useState('');
  const [quantity, setQuantity] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { mutate: registerCount, isPending } = useRegisterCountByBarcode(activeCycle.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    // `!quantity` seria verdadeiro para `"0"`, porque `"0"` é falsy em JavaScript:
    // contar uma prateleira vazia — a maior divergência possível — era impossível.
    if (!barcode.trim() || quantity.trim() === '') return;

    registerCount(
      { codigoBarras: barcode.trim(), physicalQuantity: parseFloat(quantity) },
      {
        onSuccess: () => {
          setSuccessMsg(`Contagem registada para: ${barcode}`);
          setBarcode('');
          setQuantity('');
        },
        onError: (err: any) => {
          setErrorMsg(err?.response?.data?.message ?? 'Erro ao registar contagem.');
        },
      },
    );
  };

  if (activeCycle.status !== 'COUNTING') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 bg-amber-50 rounded-full mb-4">
          <Clock className="h-8 w-8 text-amber-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Ciclo não está em Contagem</h3>
        <p className="text-slate-500 text-sm max-w-sm">
          O ciclo "{activeCycle.name}" está em status{' '}
          <span className="font-medium">{STATUS_CONFIG[activeCycle.status].label}</span>.
          Aguarde o gerente iniciar a contagem.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <div className="inline-flex p-3 bg-blue-100 rounded-2xl mb-3">
          <Package className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Contagem Cega</h3>
        <p className="text-slate-500 text-sm mt-1">
          Ciclo: <span className="font-medium">{activeCycle.name}</span>
        </p>
        {/* Intencionalmente omitimos stock atual — princÍpio da Contagem Cega */}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="inv-barcode"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Código de Barras
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="inv-barcode"
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Bipe ou digite o código de barras"
              autoFocus
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="inv-quantity"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Quantidade Encontrada na Prateleira
          </label>
          <input
            id="inv-quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            min={0}
            step="0.001"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl font-bold text-center"
          />
        </div>

        {successMsg && (
          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-4 py-3 rounded-xl text-sm">
            <CheckCircle className="h-4 w-4 shrink-0" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-2 text-rose-700 bg-rose-50 px-4 py-3 rounded-xl text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        <Button
          type="submit"
          className="w-full py-3 text-base"
          // Ver a nota no `handleSubmit`: `!quantity` bloqueava o botão quando a
          // quantidade era zero.
          disabled={!barcode.trim() || quantity.trim() === '' || isPending}
        >
          {isPending ? 'A registar...' : 'Registar Contagem'}
        </Button>

        <p className="text-center text-xs text-slate-400">
          Conte o que está na prateleira, incluindo zero. O saldo do sistema não é
          mostrado de propósito — é uma contagem cega, para o número não ser influenciado.
        </p>
      </form>
    </div>
  );
}

// ──â”€ Gerente: Painel de Conciliação ──────────────────────────────────────────â”€
function CycleDetailPanel({
  cycleId,
  onBack,
}: {
  cycleId: string;
  onBack: () => void;
}) {
  const { data: cycle, isLoading } = useInventoryCycleDetail(cycleId);
  const { mutate: closeCycle, isPending: isClosing } = useCloseCycle();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateCycleStatus();
  const [closeResult, setCloseResult] = useState<string | null>(null);
  const [mostrarPrevisao, setMostrarPrevisao] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!cycle) return null;

  const handleAdvanceStatus = () => {
    const nextStatus: Record<string, InventoryCycleStatus> = {
      OPEN: 'COUNTING',
      COUNTING: 'RECONCILING',
    };
    const next = nextStatus[cycle.status];
    if (!next) return;

    updateStatus(
      { cycleId, payload: { status: next } },
      {
        // Sem isto, o `BadRequestException("Transição inválida...")` do servidor era
        // engolido: o spinner parava e nada acontecia.
        onError: (err: any) =>
          toast.error(err?.response?.data?.message ?? 'Não foi possível avançar o ciclo.'),
      },
    );
  };

  const handleClose = () => {
    closeCycle(cycleId, {
      onSuccess: (result) => {
        setCloseResult(
          `Ciclo fechado. ${result.summary.totalAdjustments} ajuste(s) de stock gerado(s). ` +
            `Perdas lançadas no financeiro: ${result.summary.totalLosses.toLocaleString('pt-MZ', {
              style: 'currency',
              currency: 'MZN',
            })}.`,
        );
        setMostrarPrevisao(false);
      },
      // O fecho pode falhar por saldo insuficiente, se houve vendas entre a contagem e
      // o fecho. Sem tratamento, o utilizador não sabia o que aconteceu.
      onError: (err: any) =>
        toast.error(err?.response?.data?.message ?? 'Não foi possível fechar o ciclo.'),
    });
  };

  const canAdvance = cycle.status === 'OPEN' || cycle.status === 'COUNTING';
  const canClose = cycle.status === 'RECONCILING';

  // O nome do próximo passo em português. O botão mostrava o valor cru do enum
  // («Avançar para RECONCILING»), o que não diz nada a quem faz o balanço — e as
  // traduções já existiam no `STATUS_CONFIG` logo acima.
  const proximoPasso = cycle.status === 'OPEN' ? 'iniciar a contagem' : 'terminar a contagem';

  return (
    <div className="space-y-6">
      {/* Header do detalhe */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
        >
          <ChevronRight className="h-5 w-5 rotate-180" />
        </button>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800 text-lg">{cycle.name}</h3>
          <p className="text-slate-500 text-sm">{cycle.counts.length} produto(s) contado(s)</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[cycle.status].className}`}
        >
          {STATUS_CONFIG[cycle.status].icon}
          {STATUS_CONFIG[cycle.status].label}
        </span>
      </div>

      {/* Ações de gestão */}
      {cycle.status !== 'CLOSED' && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex flex-wrap items-center justify-between gap-3">
          {/* Cada estado diz qual é o passo seguinte. Antes havia só um botão com o
              nome cru do enum («Avançar para RECONCILING»), e nada explicava que isso
              significa «terminar a contagem e revisar antes de fechar». */}
          <p className="text-sm text-slate-600 max-w-lg">
            {cycle.status === 'OPEN' &&
              'O ciclo está aberto. Inicie a contagem para que se possam registar produtos.'}
            {cycle.status === 'COUNTING' &&
              'Contagem a decorrer. Registe os produtos abaixo e termine quando estiver completa.'}
            {cycle.status === 'RECONCILING' &&
              'Contagem terminada. Reveja as divergências antes de fechar — o fecho ajusta o stock e lança as faltas no financeiro.'}
          </p>

          <div className="flex flex-wrap gap-2">
          {canAdvance && (
            <Button onClick={handleAdvanceStatus} disabled={isUpdating}>
              {isUpdating ? 'A actualizar...' : `Avançar: ${proximoPasso}`}
            </Button>
          )}
          {canClose && (
            <Button variant="outline" onClick={() => setMostrarPrevisao(true)}>
              Ver o que vai mudar
            </Button>
          )}
          {canClose && (
            <Button variant="warning" onClick={handleClose} disabled={isClosing}>
              {isClosing ? 'A fechar...' : 'Fechar ciclo e gerar ajustes'}
            </Button>
          )}
          </div>
        </div>
      )}

      {/* A conta antes de a confirmar: o fecho escreve movimentos de stock e cria
          uma despesa por cada falta, e e irreversivel. O resumo do que ia mudar so
          era conhecido DEPOIS de fechar. */}
      {mostrarPrevisao && (
        <PrevisaoDeFecho cycleId={cycleId} onFechar={() => setMostrarPrevisao(false)} />
      )}

      {closeResult && (
        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-4 py-3 rounded-xl text-sm font-medium">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {closeResult}
        </div>
      )}

      {/* ── Registar contagem, também para quem gere ──────────────────────────
          O formulário de contagem existia, mas só era mostrado a quem **não** era
          gestor (`if (!isManager) return <OperatorCountView/>`) — um ADMIN ou MANAGER
          nunca conseguia registar uma contagem pela interface, apesar de o servidor
          lho permitir (a rota exige `VER_STOCK`, que qualquer gestor tem).
          Era a causa de «inicia mas não tem onde preencher os dados». */}
      {cycle.status === 'COUNTING' && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h4 className="text-sm font-semibold text-slate-800">Registar contagem</h4>
            <p className="text-xs text-slate-500">
              Conte a prateleira e registe aqui, ou peça aos operadores para o fazerem nos
              seus terminais.
            </p>
          </div>
          <OperatorCountView activeCycle={cycle} />
        </div>
      )}

      {/* Tabela de divergências */}
      {cycle.counts.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl">
          <BarChart3 className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhuma contagem registada ainda.</p>
          <p className="text-xs mt-1">
            {cycle.status === 'COUNTING'
              ? 'Registe a primeira contagem acima, ou peça aos operadores para começarem.'
              : 'Avance o ciclo para começar a contagem.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Produto</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Qtd Sistema</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Qtd FÍsica</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Divergência</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Operador
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cycle.counts.map((count) => {
                  const diff = count.difference;
                  const isShortage = diff < 0;
                  const isSurplus = diff > 0;

                  return (
                    <tr
                      key={count.id}
                      className={
                        isShortage
                          ? 'bg-rose-50/50'
                          : isSurplus
                            ? 'bg-emerald-50/50'
                            : ''
                      }
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">
                          {count.stock?.product?.nome ?? '—'}
                        </p>
                        {count.stock?.product?.codigoBarras && (
                          <p className="text-xs text-slate-400">
                            {count.stock.product.codigoBarras}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 tabular-nums">
                        {count.systemQuantity}
                        <span className="ml-1 text-xs text-slate-400">
                          {count.stock?.product?.unidadeMedida ?? 'UN'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-800 font-medium tabular-nums">
                        {count.physicalQuantity}
                        <span className="ml-1 text-xs text-slate-400">
                          {count.stock?.product?.unidadeMedida ?? 'UN'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                            isShortage
                              ? 'bg-rose-100 text-rose-700'
                              : isSurplus
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {diff > 0 ? '+' : ''}
                          {diff}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {count.operator?.name ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ──â”€ Gerente: Lista de Ciclos ──────────────────────────────────────────────────
function ManagerCycleList({
  cycles,
  isLoading,
  onSelectCycle,
  onCreateCycle,
}: {
  cycles: InventoryCycle[];
  isLoading: boolean;
  onSelectCycle: (id: string) => void;
  onCreateCycle: () => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">Ciclos de Inventário</h3>
        <Button onClick={onCreateCycle} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Ciclo
        </Button>
      </div>

      {cycles.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-xl">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 text-sm font-medium">Nenhum ciclo de inventário</p>
          <p className="text-slate-400 text-xs mt-1">
            Crie um novo ciclo para iniciar o balanço de estoque.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {cycles.map((cycle) => {
            const config = STATUS_CONFIG[cycle.status];
            return (
              <button
                key={cycle.id}
                onClick={() => onSelectCycle(cycle.id)}
                className="w-full flex items-center gap-4 px-4 py-4 bg-white border border-slate-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all text-left group"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{cycle.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}
                    >
                      {config.icon}
                      {config.label}
                    </span>
                    <span className="text-xs text-slate-400">
                      {cycle._count?.counts ?? 0} contagem(ns)
                    </span>
                    {cycle.createdBy && (
                      <span className="text-xs text-slate-400 hidden sm:inline">
                        por {cycle.createdBy.name}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-400 transition-colors shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ──â”€ Componente Principal ────────────────────────────────────────────────────â”€
export function InventoryTab() {
  const { user } = useAuth();
  const { data: cycles = [], isLoading } = useInventoryCycles();
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Manager roles — ADMIN e MANAGER têm visão de conciliação
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN';

  // Ciclo ativo para operadores (o único não-fechado)
  const activeCycle = cycles.find((c) => c.status !== 'CLOSED');

  // ── Visão Operador: Contagem Cega ──
  if (!isManager) {
    if (!activeCycle) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 bg-slate-100 rounded-full mb-4">
            <Lock className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            Nenhum Ciclo Ativo
          </h3>
          <p className="text-slate-500 text-sm max-w-sm">
            Não há um ciclo de inventário em andamento. Aguarde o gerente abrir um ciclo.
          </p>
        </div>
      );
    }
    return <OperatorCountView activeCycle={activeCycle} />;
  }

  // ── Visão Gerente ──
  return (
    <div>
      {selectedCycleId ? (
        <CycleDetailPanel
          cycleId={selectedCycleId}
          onBack={() => setSelectedCycleId(null)}
        />
      ) : (
        <ManagerCycleList
          cycles={cycles}
          isLoading={isLoading}
          onSelectCycle={setSelectedCycleId}
          onCreateCycle={() => setShowCreateModal(true)}
        />
      )}

      {showCreateModal && (
        <CreateCycleModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

// ── Previsão do fecho ────────────────────────────────────────────────────────

/**
 * O que o fecho vai fazer, antes de o fazer.
 *
 * O resumo do fecho — quantos ajustes, quanto vale a perda — só era conhecido **depois**
 * de fechar, e o fecho é irreversível: escreve movimentos de stock e cria uma despesa
 * financeira por cada falta. Quem assina um balanço tem de poder ver a conta antes de a
 * confirmar.
 *
 * Responde também à pergunta directa «a contagem bate com o sistema?»: é o número de
 * linhas sem divergência nenhuma.
 */
function PrevisaoDeFecho({ cycleId, onFechar }: { cycleId: string; onFechar: () => void }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory', 'previsao-fecho', cycleId],
    queryFn: () => inventoryApi.preverFecho(cycleId),
  });

  const moeda = (v: number) => v.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h4 className="text-sm font-semibold text-slate-800">O que vai mudar ao fechar</h4>
        <button
          onClick={onFechar}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Fechar previsão"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <p className="px-4 py-8 text-center text-sm text-slate-500">A calcular...</p>
      ) : error || !data ? (
        <p className="px-4 py-8 text-center text-sm text-slate-500">
          Não foi possível calcular a previsão.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4">
            {[
              { rotulo: 'Contado', valor: String(data.resumo.totalContado) },
              {
                rotulo: 'Bate com o sistema',
                valor: String(data.resumo.semDivergencia),
                bom: data.resumo.semDivergencia === data.resumo.totalContado,
              },
              {
                rotulo: 'Faltas',
                valor: `${data.resumo.faltas} · ${moeda(data.resumo.valorFaltas)}`,
                alerta: data.resumo.faltas > 0,
              },
              {
                rotulo: 'Sobras',
                valor: `${data.resumo.sobras} · ${moeda(data.resumo.valorSobras)}`,
                alerta: data.resumo.sobras > 0,
              },
            ].map((m) => (
              <div key={m.rotulo} className="bg-white px-4 py-3">
                <p className="text-xs text-slate-500">{m.rotulo}</p>
                <p
                  className={`mt-0.5 text-sm font-semibold ${
                    m.alerta ? 'text-amber-600' : m.bom ? 'text-emerald-600' : 'text-slate-900'
                  }`}
                >
                  {m.valor}
                </p>
              </div>
            ))}
          </div>

          {data.resumo.comDivergencia === 0 ? (
            <p className="flex items-center gap-2 px-4 py-4 text-sm text-emerald-700">
              <CheckCircle className="h-4 w-4 shrink-0" />
              A contagem bate com o sistema em todas as {data.resumo.totalContado} linhas. O
              fecho não vai gerar ajustes.
            </p>
          ) : (
            <>
              <p className="px-4 pt-3 text-xs text-slate-500">
                Estas {data.resumo.comDivergencia} linhas vão gerar ajustes de stock. As faltas
                entram como despesa no financeiro.
              </p>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">Produto</th>
                      <th className="px-3 py-2 text-right font-medium">Sistema</th>
                      <th className="px-3 py-2 text-right font-medium">Contado</th>
                      <th className="px-3 py-2 text-right font-medium">Diferença</th>
                      <th className="px-3 py-2 text-right font-medium">Valor</th>
                      <th className="px-4 py-2 font-medium">Contado por</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.divergencias.map((d) => (
                      <tr key={d.stockId}>
                        <td className="px-4 py-2">
                          <span className="text-slate-800">{d.produto}</span>
                          {d.armazem && <p className="text-xs text-slate-400">{d.armazem}</p>}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-500">{d.sistema}</td>
                        <td className="px-3 py-2 text-right font-medium text-slate-800">
                          {d.contado}
                        </td>
                        <td
                          className={`px-3 py-2 text-right font-semibold ${
                            d.diferenca < 0 ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {d.diferenca > 0 ? '+' : ''}
                          {d.diferenca}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-600">{moeda(d.valor)}</td>
                        <td className="px-4 py-2 text-xs text-slate-500">
                          {/* Quem contou. Estava na tabela de divergências mas escondido
                              em ecrãs pequenos (`hidden sm:table-cell`) — num tablet, que
                              é onde se faz a contagem, não se via. */}
                          {d.operador ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
