import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useContaClienteStore } from '../store/useContaClienteStore';

/**
 * Confirma a sessão da conta de cliente contra o servidor a cada montagem das rotas
 * do Compra Fácil — mesmo padrão do `PortalLayout` para o fornecedor.
 *
 * O estado inicial vem do `sessionStorage` (um palpite optimista); sem esta
 * confirmação, um cookie expirado desenharia as páginas como se houvesse sessão e
 * cada acção seguinte falharia com 401, uma a uma.
 */
export function CompraFacilSessao() {
  const { autenticado, carregar } = useContaClienteStore();

  useEffect(() => {
    if (autenticado) void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Outlet />;
}
