export const AVAILABLE_RESOURCES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'empresa', label: 'Empresa / Configurações' },
  { id: 'users', label: 'Utilizadores' },
  { id: 'lojas', label: 'Lojas' },
  { id: 'armazens', label: 'Armazéns' },
  { id: 'caixas', label: 'Caixas / POS' },
  { id: 'stock', label: 'Stock' },
  { id: 'catalogo', label: 'Catálogo' },
  { id: 'compras', label: 'Compras' },
  { id: 'necessidades', label: 'Necessidades de Compra' },
  { id: 'rh', label: 'Recursos Humanos' },
  { id: 'vendas', label: 'Vendas' },
  { id: 'clientes', label: 'Clientes / CRM' },
  { id: 'pedidos_commerce', label: 'Pedidos Compra Fácil' },
];

export const AVAILABLE_ACTIONS = [
  { id: 'read', label: 'Visualizar' },
  { id: 'write', label: 'Criar / Editar' },
  { id: 'delete', label: 'Remover' },
  { id: 'manage', label: 'Gerir Tudo' },
];

// Pode-se definir exceções se alguma ação não fizer sentido para um recurso
export const IGNORED_PERMISSIONS = [
  'write:dashboard',
  'delete:dashboard',
  'manage:dashboard',
  // Só existem `read`/`manage` para este recurso na base de dados (migração
  // commerce_permissoes_gestao) — não há um "criar" ou "apagar" pedido pela gestão.
  'write:pedidos_commerce',
  'delete:pedidos_commerce',
];
