import { Outlet } from 'react-router-dom';
import { BarraDoSitio, RodapeDoSitio } from '@/features/landing';
import '@/features/landing/site.css';

/**
 * O chrome de qualquer página pública do sítio: a mesma barra e o mesmo rodapé da
 * landing, como layout de rota reutilizável.
 *
 * ## Porque não existia antes
 *
 * A `LandingPage` e a `PrecosPage` compõem `BarraDoSitio`/`RodapeDoSitio` cada uma por
 * si, e o `/mercado` nem isso — escreve o seu próprio cabeçalho. Três páginas públicas,
 * três formas de o fazer. O Compra Fácil é a quarta, e criar mais uma cópia manual
 * teria sido a quarta forma. Isto não migra as três anteriores — cada uma continua
 * como está, para não ser um refactor não pedido — mas existe para qualquer página
 * pública nova não repetir a composição.
 */
export function PublicLayout() {
  return (
    <div className="cc-sitio" style={{ background: '#fff', color: 'var(--tinta)' }}>
      <BarraDoSitio />
      <main>
        <Outlet />
      </main>
      <RodapeDoSitio />
    </div>
  );
}
