import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, AlertTriangle, SlidersHorizontal } from 'lucide-react';
import { Tabs, type TabDefinition } from '@/shared/ui';
import { FacturasTab } from '../components/FacturasTab';
import { ExcepcoesTab } from '../components/ExcepcoesTab';
import { ToleranciasTab } from '../components/ToleranciasTab';

type Aba = 'facturas' | 'excepcoes' | 'tolerancias';

/**
 * Conferência de facturas e Centro de Excepções.
 *
 * ## Porque é uma secção própria e não um separador das Compras
 *
 * Compras já tem três separadores e trata do que se vai comprar. Isto trata do que se vai
 * pagar — outro momento, outras pessoas, e a segregação de funções di-lo pelo nome: quem
 * regista a factura não a pode aprovar. Metê-las no mesmo ecrã convidaria a que fosse a
 * mesma pessoa a fazer as duas coisas.
 *
 * ## A ordem dos separadores é a ordem do trabalho
 *
 * Facturas primeiro, porque é por onde se entra; excepções a seguir, porque é o que a
 * conferência produz; tolerâncias por último, porque configura-se uma vez e revisita-se
 * pouco.
 */
export function ConferenciaPage() {
  const [params, setParams] = useSearchParams();
  const abaInicial = (params.get('tab') as Aba) ?? 'facturas';
  const [aba, setAba] = useState<Aba>(abaInicial);

  const ABAS: TabDefinition<Aba>[] = [
    { id: 'facturas', label: 'Facturas', icon: FileText },
    { id: 'excepcoes', label: 'Excepções', icon: AlertTriangle },
    { id: 'tolerancias', label: 'Tolerâncias', icon: SlidersHorizontal },
  ];

  const mudarAba = (nova: Aba) => {
    setAba(nova);
    // O separador vai para o URL para a página poder ser partilhada e para o voltar
    // atrás do browser fazer o que se espera.
    setParams(nova === 'facturas' ? {} : { tab: nova }, { replace: true });
  };

  return (
    <div className="space-y-6">
      <Tabs tabs={ABAS} active={aba} onChange={mudarAba} label="Secções da conferência" />

      {aba === 'facturas' && <FacturasTab />}
      {aba === 'excepcoes' && <ExcepcoesTab />}
      {aba === 'tolerancias' && <ToleranciasTab />}
    </div>
  );
}
