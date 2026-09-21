import { Outlet } from 'react-router-dom';
import '@/features/landing/site.css';

/**
 * O chrome das rotas `/loja/*` — sem a `BarraDoSitio`/`RodapeDoSitio` do
 * `PublicLayout` (pensadas para a landing de marketing).
 *
 * Usava-se `PublicLayout` aqui antes, e isso duplicava o cabeçalho: a
 * `BarraDoSitio` é sticky e fica por cima do `LojaTopo` de cada página da
 * loja, com o seu próprio botão "Entrar" a apontar para `/login` (o login de
 * staff) em vez de `/loja/:lojaId/entrar` — sem qualquer saída para "Criar
 * conta". Um cliente que clicasse nesse "Entrar" (o mais visível, fixo no
 * topo) caía num beco sem saída.
 *
 * Mantém o import de `site.css` e a classe `cc-sitio`: as páginas da loja
 * dependem das suas classes (`cc-caixa`) e variáveis (`--tinta`), definidas
 * aí, não neste layout.
 */
export function LojaPublicaLayout() {
  return (
    <div className="cc-sitio" style={{ background: '#fff', color: 'var(--tinta)', minHeight: '100vh' }}>
      <Outlet />
    </div>
  );
}
