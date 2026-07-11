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
  { id: 'rh', label: 'Recursos Humanos' },
  { id: 'vendas', label: 'Vendas' },
  { id: 'clientes', label: 'Clientes / CRM' },
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
  'manage:dashboard'
];
