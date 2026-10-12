import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Banknote, Bike, Globe2, MapPin, PackageCheck, TrendingUp, Truck, Users } from 'lucide-react';
import { Tabs, type TabDefinition } from '@/shared/ui';
import { useAuth } from '@/features/auth';
import type { Role } from '@/features/auth';
import { PedidosCommercePage } from '@/features/compra-facil-gestao';
import { AcertosPage, EntregasPage, EstafetasDaPlataformaPage, EstafetasPage, ZonasEntregaPage } from '@/features/entrega-gestao';
import { ProcuraPage, ProcuraSistemaPage } from '@/features/procura-online';

type AbaECommerce =
  | 'pedidos'
  | 'entregas'
  | 'estafetas'
  | 'estafetas_plataforma'
  | 'acertos'
  | 'zonas'
  | 'procura'
  | 'procura_sistema';

interface DefinicaoDaAba {
  id: AbaECommerce;
  icon: React.ElementType;
  roles: Role[];
}

/**
 * Os separadores, pela ordem do fluxo: o pedido chega, entrega-se, quem entrega, o dinheiro
 * que ele traz, e só depois a configuração e a análise.
 *
 * Os `roles` são os que tinham as rotas planas que isto substitui — o que cada um via no
 * menu, vê agora como separador. A autorização fina continua a ser do servidor.
 */
const ABAS: DefinicaoDaAba[] = [
  { id: 'pedidos', icon: PackageCheck, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER', 'STOCK_KEEPER'] },
  { id: 'entregas', icon: Truck, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER', 'STOCK_KEEPER'] },
  { id: 'estafetas', icon: Bike, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  // Os estafetas que não são de nenhuma empresa (plano §4.9): só o Super Admin os vê, e o servidor também o exige.
  { id: 'estafetas_plataforma', icon: Users, roles: ['SUPER_ADMIN'] },
  // Sem CASHIER nem STOCK_KEEPER: quem mexe no dinheiro do caixa de outros é gestão.
  { id: 'acertos', icon: Banknote, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { id: 'zonas', icon: MapPin, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { id: 'procura', icon: TrendingUp, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  // A visão entre empresas: só o Super Admin (o servidor também o exige).
  { id: 'procura_sistema', icon: Globe2, roles: ['SUPER_ADMIN'] },
];

/**
 * E-Commerce: a operação da loja online (Compra Fácil) num só sítio.
 *
 * Eram sete entradas soltas no menu lateral — pedidos, entregas, estafetas, acertos, zonas e
 * procura (mais a da plataforma) — todas sobre a mesma coisa: o que se vende online e como
 * chega ao cliente. Ficam como separadores, no mesmo padrão do RH, e as rotas antigas
 * redireccionam para o separador respectivo (há notificações e ligações gravadas que apontam
 * para elas).
 */
export function ECommercePage() {
  const { t } = useTranslation('shell');
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasRole } = useAuth();

  const abasVisiveis = ABAS.filter((a) => hasRole(a.roles));
  const ABAS_UI: TabDefinition<AbaECommerce>[] = abasVisiveis.map((a) => ({
    id: a.id,
    label: t(`ecommerce.abas.${a.id}`),
    icon: a.icon,
  }));

  // Um `?tab=` que o papel não vê (ou inventado) cai no primeiro separador permitido, em vez
  // de mostrar um ecrã vazio.
  const doUrl = searchParams.get('tab');
  const aba = ABAS_UI.find((a) => a.id === doUrl)?.id ?? ABAS_UI[0]?.id;

  if (!aba) return null;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Tabs
          tabs={ABAS_UI}
          active={aba}
          onChange={(id) => setSearchParams({ tab: id }, { replace: true })}
          label={t('ecommerce.abas.etiqueta')}
          className="px-4"
        />

        {/* Montagem condicional e não `hidden`: cada separador busca os seus dados (e alguns
            abrem ligações em tempo real) ao montar; todos montados seria pagar isso por todos
            de cada vez que se abre a secção. */}
        <div className="p-4 sm:p-6">
          {aba === 'pedidos' && <PedidosCommercePage />}
          {aba === 'entregas' && <EntregasPage />}
          {aba === 'estafetas' && <EstafetasPage />}
          {aba === 'estafetas_plataforma' && <EstafetasDaPlataformaPage />}
          {aba === 'acertos' && <AcertosPage />}
          {aba === 'zonas' && <ZonasEntregaPage />}
          {aba === 'procura' && <ProcuraPage />}
          {aba === 'procura_sistema' && <ProcuraSistemaPage />}
        </div>
      </div>
    </div>
  );
}
