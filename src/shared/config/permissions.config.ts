// Só os identificadores: a etiqueta vem do catálogo (`permissoes.recurso.<id>` e
// `permissoes.accao.<id>`, namespace `shell`), para seguir a língua activa.
export const AVAILABLE_RESOURCES = [
  { id: 'dashboard' },
  { id: 'empresa' },
  { id: 'users' },
  { id: 'lojas' },
  { id: 'armazens' },
  { id: 'caixas' },
  { id: 'stock' },
  { id: 'catalogo' },
  { id: 'compras' },
  { id: 'necessidades' },
  { id: 'rh' },
  { id: 'vendas' },
  { id: 'clientes' },
  { id: 'pedidos_commerce' },
  { id: 'promocao' },
] as const;

export const AVAILABLE_ACTIONS = [
  { id: 'read' },
  { id: 'write' },
  { id: 'delete' },
  { id: 'manage' },
] as const;

// Pode-se definir exceções se alguma ação não fizer sentido para um recurso
export const IGNORED_PERMISSIONS = [
  'write:dashboard',
  'delete:dashboard',
  'manage:dashboard',
  // Só existem `read`/`manage` para este recurso na base de dados (migração
  // commerce_permissoes_gestao) — não há um "criar" ou "apagar" pedido pela gestão.
  'write:pedidos_commerce',
  'delete:pedidos_commerce',
  // Só existem `read`/`manage` para este recurso (migração promocao_permissoes) —
  // criar/cancelar passam por `manage`, não há um "write"/"delete" próprios.
  'write:promocao',
  'delete:promocao',
];
