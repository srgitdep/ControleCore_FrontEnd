export const AVAILABLE_RESOURCES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'empresa', label: 'Empresa / ConfiguraÃ§Ãµes' },
  { id: 'users', label: 'Utilizadores' },
  { id: 'lojas', label: 'Lojas' },
  { id: 'armazens', label: 'ArmazÃ©ns' },
  { id: 'caixas', label: 'Caixas / POS' },
  { id: 'stock', label: 'Stock' },
  { id: 'catalogo', label: 'CatÃ¡logo' },
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

// Pode-se definir exceÃ§Ãµes se alguma aÃ§Ã£o nÃ£o fizer sentido para um recurso
export const IGNORED_PERMISSIONS = [
  'write:dashboard',
  'delete:dashboard',
  'manage:dashboard'
];
