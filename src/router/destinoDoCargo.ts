/**
 * O ecrã onde cada cargo aterra depois de entrar.
 *
 * Fora do componente para ter testes: o projecto corre os testes em `node`, sem DOM.
 *
 * ## Porquê existe
 *
 * O login e o primeiro acesso mandavam toda a gente para `/dashboard`, mas o painel só
 * aceita `SUPER_ADMIN`, `ADMIN` e `MANAGER`. Um Operador de Caixa aterrava numa rota que
 * lhe era recusada: via o aviso vermelho «Sem permissão para aceder a esta página» e só
 * **depois** era reencaminhado para o Ponto de Venda. O acesso estava certo — o erro era o
 * caminho até lá, e o aviso dava a entender que lhe faltava alguma permissão.
 *
 * Passam ambos a mandar para `/`, que usa esta função.
 */
export function destinoDoCargo(role: string | undefined): string {
  switch (role) {
    case 'CASHIER':
      return '/vendas';
    case 'STOCK_KEEPER':
    case 'USER':
      return '/produtos';
    default:
      return '/dashboard';
  }
}
