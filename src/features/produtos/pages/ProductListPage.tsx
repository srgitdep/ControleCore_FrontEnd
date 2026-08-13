import { Navigate } from 'react-router-dom';

/**
 * O catálogo de produtos vive agora dentro da secção Stock, no separador «Catálogo»:
 * Produtos e Stock são a mesma matéria vista de dois ângulos — o que se vende e o que
 * existe — e tê-los como duas entradas de menu obrigava a saltar entre secções para
 * responder a uma pergunta só.
 *
 * A rota `/produtos` mantém-se e redirecciona, por duas razões: `RootRedirectOrLanding`
 * envia os perfis `STOCK_KEEPER` e `USER` para cá depois do login, e há ligações
 * gravadas (respostas antigas da Mayra, favoritos do browser) que apontam para aqui.
 */
export function ProductListPage() {
  return <Navigate to="/stock?tab=produtos" replace />;
}
