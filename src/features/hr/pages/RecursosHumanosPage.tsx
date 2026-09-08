import { useSearchParams } from 'react-router-dom';
import { Users, CalendarDays, Wallet } from 'lucide-react';
import { Tabs, type TabDefinition } from '@/shared/ui';
import { usePermissions, useAuth } from '@/features/auth';
import { EmployeeListPage } from './EmployeeListPage';
import { ShiftManagementPage } from './ShiftManagementPage';
import { SalariosPage } from './SalariosPage';

type Aba = 'colaboradores' | 'escalas' | 'salarios';

/**
 * Recursos Humanos: colaboradores, escalas e salários.
 *
 * ## O que estava dividido
 *
 * Eram três páginas independentes em três rotas planas, e **`/rh/escalas` era
 * inalcançável pela interface** — não tinha entrada no menu e nenhuma página lhe
 * apontava; só se chegava lá escrevendo o URL. Salários estava no menu como secção
 * própria, ao lado de RH, quando é RH.
 *
 * ## A decisão de permissões
 *
 * O menu dava `/rh` a `SUPER_ADMIN` e `ADMIN`, mas `/rh/salarios` também a `MANAGER` —
 * ou seja, um gestor via Salários e não via os colaboradores. Ao unificar, a entrada
 * fica acessível a `MANAGER` e é o **separador de colaboradores** que se condiciona,
 * para o gestor não perder o acesso que tinha.
 */
export function RecursosHumanosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasRole } = useAuth();
  const { hasPermission } = usePermissions();

  // Os dados dos colaboradores incluem salário, BI e NUIT. Um gestor de loja que só
  // processa vencimentos não tem de os ver.
  const podeVerColaboradores = hasRole(['SUPER_ADMIN', 'ADMIN']) || hasPermission('read', 'user');

  const ABAS: TabDefinition<Aba>[] = [
    ...(podeVerColaboradores
      ? [{ id: 'colaboradores' as Aba, label: 'Colaboradores', icon: Users }]
      : []),
    { id: 'escalas', label: 'Escalas', icon: CalendarDays },
    { id: 'salarios', label: 'Salários', icon: Wallet },
  ];

  const doUrl = searchParams.get('tab');
  const aba: Aba = ABAS.some((a) => a.id === doUrl) ? (doUrl as Aba) : ABAS[0].id;

  return (
    <div className="space-y-6">
      {/* O cabeçalho da aplicação já diz «Recursos Humanos»; os separadores abaixo
          dizem o que a descrição enumerava. */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Tabs
          tabs={ABAS}
          active={aba}
          onChange={(id) => setSearchParams({ tab: id }, { replace: true })}
          label="Recursos humanos"
          className="px-4"
        />

        {/* Montagem condicional e não `hidden`: cada separador busca os seus dados ao
            montar, e mantê-los todos montados faria três pedidos de cada vez que se
            abre a secção. */}
        <div className="p-4 sm:p-6">
          {aba === 'colaboradores' && <EmployeeListPage />}
          {aba === 'escalas' && <ShiftManagementPage />}
          {aba === 'salarios' && <SalariosPage />}
        </div>
      </div>
    </div>
  );
}
