// As colunas da matriz de permissões. As linhas (os recursos, e que acções cada um tem)
// vêm do servidor em `GET /perfis/recursos` — `features/permissoes`. Havia aqui uma lista
// própria de recursos, que tinha divergido dos nomes que os controladores pedem.
//
// A etiqueta vem do catálogo (`permissoes.accao.<id>`, namespace `shell`).
export const AVAILABLE_ACTIONS = [
  { id: 'read' },
  { id: 'write' },
  { id: 'delete' },
  { id: 'manage' },
] as const;
