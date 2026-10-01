import { Outlet } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { idiomaActivo } from '@/i18n';
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
 *
 * `GoogleOAuthProvider` fica aqui, um único sítio para todas as rotas da
 * loja, em vez de em cada página que usa `<GoogleLogin>`
 * (`Docs/plano_feature_login_google_compra_facil.md`, backend
 * `ControleCore_BackEnd`). Sem `VITE_GOOGLE_CLIENT_ID`, o provider monta na
 * mesma (`clientId=''`) — é o botão em si (`GoogleLoginBotao`) que não se
 * mostra nesse caso, não este layout.
 */
export function LojaPublicaLayout() {
  return (
    // `locale` é a língua do botão «Continuar com a Google», desenhado pela própria Google. O
    // script lê-a uma só vez, quando carrega: quem já escolheu inglês vê o botão em inglês, e
    // quem muda de língua a meio vê-o mudar na carga seguinte. Remontar o provider a cada
    // mudança resolveria isso, mas apagava o que a pessoa já escreveu nos formulários.
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''} locale={idiomaActivo()}>
      <div className="cc-sitio" style={{ background: '#fff', color: 'var(--tinta)', minHeight: '100vh' }}>
        <Outlet />
      </div>
    </GoogleOAuthProvider>
  );
}
