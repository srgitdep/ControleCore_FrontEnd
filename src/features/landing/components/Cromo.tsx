import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

import { COPY } from '@/shared/constants/copywriting';

/**
 * A barra, a marca e o rodapé do sítio público.
 *
 * Um ficheiro só, para que a landing e qualquer página pública futura partilhem a
 * mesma barra. Estavam em `LandingHeader.tsx` e `LandingFooter.tsx` separados, e
 * duas barras divergem: a primeira vez que se acrescenta um link, uma delas fica
 * atrás.
 */

export function BarraDoSitio() {
  const [aberto, setAberto] = useState(false);
  const [deslocou, setDeslocou] = useState(false);

  // Fundo translúcido e desfoque só a partir dos 40 px. No topo a barra é
  // invisível sobre o herói, que é como deve ser: ali não há nada a separar.
  useEffect(() => {
    const aoDeslocar = () => setDeslocou(window.scrollY > 40);
    aoDeslocar();
    window.addEventListener('scroll', aoDeslocar, { passive: true });
    return () => window.removeEventListener('scroll', aoDeslocar);
  }, []);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: `1px solid ${deslocou ? 'var(--linha)' : 'transparent'}`,
        background: deslocou ? 'rgb(255 255 255 / 0.86)' : 'transparent',
        backdropFilter: deslocou ? 'blur(10px)' : 'none',
        transition: 'background-color 240ms, border-color 240ms',
      }}
    >
      <div className="cc-caixa" style={{ display: 'flex', alignItems: 'center', gap: 24, height: 68 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Marca />
          <NomeDaMarca />
        </Link>

        <nav
          aria-label="Principal"
          className="cc-nav-larga"
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 28 }}
        >
          {COPY.SITIO.NAV.map((l) => (
            <a
              key={l.para}
              href={l.para}
              style={{ fontSize: 14, fontWeight: 500, color: 'var(--tinta-suave)', textDecoration: 'none' }}
            >
              {l.texto}
            </a>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          <Link
            to="/login"
            className="cc-botao cc-botao--contorno"
            style={{ height: 40, paddingInline: 16, fontSize: 13.5 }}
          >
            {COPY.SITIO.ENTRAR}
          </Link>
          <a
            href="#comecar"
            className="cc-botao cc-botao--cheio cc-barra-cta"
            style={{ height: 40, paddingInline: 16, fontSize: 13.5 }}
          >
            {COPY.SITIO.DEMONSTRACAO}
          </a>
          <button
            type="button"
            aria-label={aberto ? COPY.SITIO.MENU_FECHAR : COPY.SITIO.MENU_ABRIR}
            aria-expanded={aberto}
            onClick={() => setAberto(!aberto)}
            className="cc-nav-botao"
            style={{
              display: 'none',
              placeItems: 'center',
              background: 'none',
              border: 0,
              cursor: 'pointer',
              color: 'var(--tinta)',
              padding: 6,
            }}
          >
            {aberto ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {aberto && (
        <nav
          aria-label="Principal, em telemóvel"
          style={{
            borderTop: '1px solid var(--linha)',
            background: '#fff',
            padding: '12px 24px 20px',
            display: 'grid',
            gap: 4,
          }}
        >
          {COPY.SITIO.NAV.map((l) => (
            <a
              key={l.para}
              href={l.para}
              onClick={() => setAberto(false)}
              style={{
                padding: '12px 0',
                fontSize: 15.5,
                fontWeight: 600,
                color: 'var(--tinta)',
                textDecoration: 'none',
                borderBottom: '1px solid var(--linha)',
              }}
            >
              {l.texto}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

/**
 * O nome escrito, com a segunda metade no azul profundo.
 *
 * Divide `NOME` por `NOME_DESTAQUE` em vez de guardar as duas metades no copy: se
 * fossem dois campos, mudar o nome da marca obrigaria a acertar a divisão à mão, e
 * o `alt`/`title` em qualquer outro sítio ficaria a dizer outra coisa.
 */
function NomeDaMarca({ tamanho = 19 }: { tamanho?: number }) {
  const { NOME, NOME_DESTAQUE } = COPY.MARCA;
  const corte = NOME.lastIndexOf(NOME_DESTAQUE);
  const inicio = corte > 0 ? NOME.slice(0, corte) : NOME;
  const fim = corte > 0 ? NOME.slice(corte) : '';

  return (
    <span style={{ fontSize: tamanho, fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--tinta)' }}>
      {inicio}
      {fim && <span style={{ color: 'var(--azul-fundo)' }}>{fim}</span>}
    </span>
  );
}

/**
 * O quadrado da marca.
 *
 * Substitui o ícone `Store` do lucide dentro de um quadrado azul. Um ícone de
 * biblioteca não é uma marca — aparece em milhares de sítios. Este é um cubo
 * isométrico a 30°: três faces, que é a leitura mais directa de «núcleo» e serve
 * tanto para stock como para o «Core» do nome.
 *
 * As faces usam o `--azul-claro` e branco translúcido sobre o `--azul-fundo`, o
 * que mantém o jogo de azuis dentro do próprio logótipo.
 */
export function Marca({ tamanho = 32 }: { tamanho?: number }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'grid',
        placeItems: 'center',
        width: tamanho,
        height: tamanho,
        borderRadius: tamanho * 0.28,
        background: 'var(--azul-fundo)',
        flexShrink: 0,
      }}
    >
      <svg width={tamanho * 0.56} height={tamanho * 0.56} viewBox="0 0 24 24" fill="none">
        <path d="M12 3 L21 8 L12 13 L3 8 Z" fill="var(--azul-claro)" />
        <path d="M3 8 L12 13 L12 21 L3 16 Z" fill="#fff" opacity="0.5" />
        <path d="M21 8 L21 16 L12 21 L12 13 Z" fill="#fff" opacity="0.82" />
      </svg>
    </span>
  );
}

/**
 * O rodapé.
 *
 * O rodapé anterior tinha catorze ligações, todas com `href="#"` — blog, carreiras,
 * fórum da comunidade, status do sistema. Nenhuma dessas páginas existe. Uma
 * ligação que não vai a lado nenhum custa mais do que a sua ausência: quem clica
 * aprende que o sítio não é de confiança. Ficam as que funcionam.
 */
export function RodapeDoSitio() {
  const copy = COPY.SITIO.RODAPE;

  return (
    <footer style={{ borderTop: '1px solid var(--linha)', background: 'var(--fundo-alt)' }}>
      {/* `auto-fit minmax(190px)` colapsa numa coluna em telemóvel e o rodapé passava a
          787px — mais um ecrã inteiro só para ligações. A classe põe-o em duas colunas
          abaixo de 700px; ver `site.css`. */}
      <div
        className="cc-caixa cc-rodape-colunas"
        style={{
          display: 'grid',
          gap: 40,
          paddingBlock: 56,
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Marca tamanho={28} />
            <NomeDaMarca tamanho={17} />
          </div>
          <p
            style={{
              margin: '12px 0 0',
              maxWidth: '30ch',
              fontSize: 13,
              lineHeight: 1.6,
              color: 'var(--tinta-suave)',
            }}
          >
            {COPY.MARCA.PROMESSA}
          </p>
        </div>

        {copy.COLUNAS.map((c) => (
          <div key={c.titulo}>
            <p style={tituloColuna}>{c.titulo}</p>
            <ul style={{ listStyle: 'none', margin: '14px 0 0', padding: 0, display: 'grid', gap: 9 }}>
              {c.itens.map((i) => (
                <li key={i.texto}>
                  {/* Uma âncora `/#modulos` passada ao `Link` do router faz uma
                      navegação e não desloca a página. Só as rotas reais vão pelo
                      `Link`. */}
                  {i.para.startsWith('/#') ? (
                    <a href={i.para} style={ligacaoRodape}>
                      {i.texto}
                    </a>
                  ) : (
                    <Link to={i.para} style={ligacaoRodape}>
                      {i.texto}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <p style={tituloColuna}>{copy.CONTACTO_TITULO}</p>
          <ul
            style={{
              listStyle: 'none',
              margin: '14px 0 0',
              padding: 0,
              display: 'grid',
              gap: 9,
              fontSize: 13.5,
              color: 'var(--tinta-suave)',
            }}
          >
            <li>
              <a
                href={`mailto:${COPY.MARCA.EMAIL}`}
                style={{ color: 'var(--azul-fundo)', fontWeight: 600, textDecoration: 'none' }}
              >
                {COPY.MARCA.EMAIL}
              </a>
            </li>
            <li>{COPY.MARCA.LOCAL}</li>
            <li style={{ color: 'var(--tinta-tenue)' }}>{copy.TELEFONE}</li>
            <li style={{ color: 'var(--tinta-tenue)' }}>{copy.NUIT}</li>
          </ul>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--linha)' }}>
        <div
          className="cc-caixa"
          style={{
            paddingBlock: 20,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            justifyContent: 'space-between',
            fontSize: 12,
            color: 'var(--tinta-tenue)',
          }}
        >
          <span>
            © {new Date().getFullYear()} {COPY.MARCA.EMPRESA}. {copy.DIREITOS}
          </span>
          <span>{copy.MOEDA}</span>
        </div>
      </div>
    </footer>
  );
}

const tituloColuna: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--tinta-tenue)',
};

const ligacaoRodape: React.CSSProperties = {
  fontSize: 13.5,
  color: 'var(--tinta-suave)',
  textDecoration: 'none',
};
