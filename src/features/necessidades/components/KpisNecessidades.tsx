import { AlertTriangle, ShoppingCart, ClipboardList, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { KpiCard } from '@/shared/ui';
import { formatMoeda } from '@/shared/utils';
import { useKpisNecessidades } from '../hooks/useNecessidades';

interface KpisNecessidadesProps {
  lojaId?: string;
  /** Filtrar a tabela para risco crítico (DT01 8) — não abre relatório automaticamente. */
  onFiltrarRisco: () => void;
  /** Mostrar todas as necessidades activas. */
  onFiltrarTodas: () => void;
}

/**
 * Os quatro indicadores do topo do painel — DT01 8.
 *
 * Dois deles navegam para fora deste ecrã (Requisições em aprovação, Ordens emitidas):
 * «continuar o processo no painel responsável», não replicar esses ecrãs aqui. Os outros
 * dois filtram esta própria tabela.
 */
export function KpisNecessidades({ lojaId, onFiltrarRisco, onFiltrarTodas }: KpisNecessidadesProps) {
  const { t } = useTranslation('necessidades');
  const { data: kpis, isLoading } = useKpisNecessidades(lojaId);
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title={t('kpis.risco_ruptura')}
        value={kpis?.emRiscoRuptura ?? 0}
        icon={AlertTriangle}
        accent="danger"
        isLoading={isLoading}
        onClick={onFiltrarRisco}
      />
      <KpiCard
        title={t('kpis.identificadas')}
        value={kpis?.necessidadesIdentificadas ?? 0}
        description={t('kpis.identificadas_descricao')}
        icon={ShoppingCart}
        accent="warning"
        isLoading={isLoading}
        onClick={onFiltrarTodas}
      />
      <KpiCard
        title={t('kpis.requisicoes_aprovacao')}
        value={kpis?.requisicoesEmAprovacao ?? 0}
        icon={ClipboardList}
        accent="primary"
        isLoading={isLoading}
        onClick={() => navigate('/requisicoes?estado=AGUARDA_APROVACAO')}
      />
      <KpiCard
        title={t('kpis.ordens_emitidas')}
        value={kpis?.ordensCompraEmitidas ?? 0}
        description={kpis ? t('kpis.em_aberto', { valor: formatMoeda(kpis.valorOrdensCompra) }) : undefined}
        icon={FileText}
        accent="success"
        isLoading={isLoading}
        onClick={() => navigate('/compras')}
      />
    </div>
  );
}
