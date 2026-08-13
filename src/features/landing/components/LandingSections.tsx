import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle, ArrowRight, BarChart3, Boxes, Check, ClipboardList,
  Clock, Coins, Package, ScanLine, ShieldCheck, ShoppingCart,
  Sparkles, Store, TrendingDown, Users, Wallet, Warehouse,
  type LucideIcon,
} from 'lucide-react';

import { COPY } from '@/shared/constants/copywriting';
import { LANDING_IMAGES } from '../constants/landingImages';

/**
 * As secções da landing page.
 *
 * Só estrutura e estilo — o texto todo vive em `shared/constants/copywriting.ts`,
 * e a razão de cada frase está documentada lá. Quem quiser mudar uma palavra não
 * precisa de abrir este ficheiro.
 */

/**
 * Do nome do ícone ao componente.
 *
 * O copy guarda `'AlertTriangle'`, não o componente: um ficheiro de texto que
 * importa de `lucide-react` deixa de ser um ficheiro de texto, e quem edita copy
 * passa a precisar de saber que ícones existem. O preço é este mapa — e uma chave
 * errada cai no `Boxes` em vez de rebentar a página.
 */
const ICONES: Record<string, LucideIcon> = {
  AlertTriangle, BarChart3, Boxes, ClipboardList, Clock, Coins, Package,
  ScanLine, ShieldCheck, ShoppingCart, Store, TrendingDown, Users, Wallet, Warehouse,
};

const Icone = ({ nome, ...props }: { nome: string } & React.ComponentProps<LucideIcon>) => {
  const Componente = ICONES[nome] ?? Boxes;
  return <Componente {...props} />;
};

// ── Herói ────────────────────────────────────────────────────────────────────

export function Heroi() {
  const semMovimento = useReducedMotion();
  const copy = COPY.HEROI;

  return (
    <section style={{ paddingTop: 'clamp(40px, 6vw, 76px)', paddingBottom: 'clamp(56px, 8vw, 100px)' }}>
      <div className="cc-caixa cc-duas cc-duas--heroi">
        <div>
          <span className="cc-etiqueta">{copy.ETIQUETA}</span>

          <h1
            style={{
              margin: '18px 0 0',
              fontSize: 'var(--titulo-heroi)',
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.035em',
              color: 'var(--tinta)',
            }}
          >
            {copy.TITULO_ANTES}
            <span className="cc-realce">{copy.TITULO_REALCE}</span>
            {copy.TITULO_DEPOIS}
          </h1>

          <p
            style={{
              margin: '22px 0 0',
              maxWidth: '52ch',
              fontSize: 17.5,
              lineHeight: 1.62,
              color: 'var(--tinta-suave)',
            }}
          >
            {copy.SUBTITULO}{' '}
            <strong style={{ color: 'var(--tinta)' }}>{copy.SUBTITULO_FORTE}</strong>
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 32 }}>
            <Link to="/login" className="cc-botao cc-botao--cheio">
              {copy.BOTAO_PRIMARIO}
            </Link>
            <a href="#comecar" className="cc-botao cc-botao--contorno">
              {copy.BOTAO_SECUNDARIO} <ArrowRight size={16} />
            </a>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px 22px',
              margin: '26px 0 0',
              fontSize: 13,
              color: 'var(--tinta-tenue)',
            }}
          >
            {copy.GARANTIAS.map((t) => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Check size={14} style={{ color: 'var(--azul-fundo)' }} />
                {t}
              </span>
            ))}
          </div>
        </div>

        <motion.div
          initial={semMovimento ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <JanelaDoProduto imagem={LANDING_IMAGES.dashboard} alt={copy.ALT_CAPTURA} />
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Moldura de janela em volta de uma captura do produto.
 *
 * A versão anterior punha uma fotografia de banco com cartões de vidro por cima,
 * um deles a mostrar `R$ 2.490,00`. Uma fotografia genérica com números inventados
 * promete um painel e não mostra nenhum.
 *
 * As capturas reais já estavam no repositório, em `assets/HeroPages`. São a prova
 * mais forte que existe: é o produto.
 */
function JanelaDoProduto({ imagem, alt }: { imagem: string; alt: string }) {
  return (
    <div
      style={{
        borderRadius: 18,
        overflow: 'hidden',
        background: 'var(--escuro)',
        border: '1px solid var(--escuro-alt)',
        boxShadow: '0 30px 70px rgb(10 22 40 / 0.22), 0 4px 12px rgb(10 22 40 / 0.12)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '11px 14px',
          background: 'var(--escuro-alt)',
        }}
      >
        {['#f87171', '#fbbf24', 'var(--azul-claro)'].map((c) => (
          <span key={c} style={{ width: 9, height: 9, borderRadius: 999, background: c, opacity: 0.8 }} />
        ))}
      </div>
      <img src={imagem} alt={alt} loading="lazy" style={{ display: 'block', width: '100%', height: 'auto' }} />
    </div>
  );
}

// ── Faixa de contexto ────────────────────────────────────────────────────────

export function FaixaDeContexto() {
  return (
    <section style={{ borderBlock: '1px solid var(--linha)', background: 'var(--fundo-alt)' }}>
      <div
        className="cc-caixa"
        style={{
          display: 'grid',
          gap: 24,
          paddingBlock: 28,
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        }}
      >
        {COPY.FAIXA.map((item) => (
          <div key={item.texto} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <Icone nome={item.icone} size={19} style={{ color: 'var(--azul-fundo)', flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--tinta-suave)' }}>{item.texto}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── O problema ───────────────────────────────────────────────────────────────

export function OProblema() {
  const copy = COPY.PROBLEMA;

  return (
    <section className="cc-secao">
      <div className="cc-caixa">
        <span className="cc-etiqueta">{copy.ETIQUETA}</span>
        <h2 className="cc-titulo" style={{ maxWidth: '22ch' }}>
          {copy.TITULO}
        </h2>
        <p className="cc-subtitulo">{copy.SUBTITULO}</p>

        <div
          style={{
            display: 'grid',
            gap: 20,
            marginTop: 44,
            gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
          }}
        >
          {copy.DORES.map((dor) => (
            <div key={dor.titulo} className="cc-cartao cc-cartao--interativo">
              <span
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 11,
                  background: 'var(--azul-tenue)',
                  border: '1px solid var(--azul-linha)',
                }}
              >
                <Icone nome={dor.icone} size={19} style={{ color: 'var(--azul-fundo)' }} />
              </span>
              <h3
                style={{
                  margin: '18px 0 0',
                  fontSize: 17,
                  fontWeight: 700,
                  letterSpacing: '-0.015em',
                  color: 'var(--tinta)',
                }}
              >
                {dor.titulo}
              </h3>
              <p style={{ margin: '9px 0 0', fontSize: 14.5, lineHeight: 1.6, color: 'var(--tinta-suave)' }}>
                {dor.texto}
              </p>
              <p
                style={{
                  margin: '16px 0 0',
                  paddingTop: 14,
                  borderTop: '1px solid var(--linha)',
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  fontWeight: 600,
                  color: 'var(--azul-fundo)',
                }}
              >
                {dor.resposta}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── A cadeia ─────────────────────────────────────────────────────────────────

/**
 * A cadeia de sete passos, em fundo escuro.
 *
 * O nó activo avança sozinho, e cada nó traz a frase do que ali acontece.
 *
 * Em fundo escuro por uma razão prática: o azul vivo da marca só tem contraste
 * suficiente para ser *linha e ponto* sobre escuro. Sobre branco teria de ser
 * desenhado no tom profundo, e perdia o brilho que faz a cadeia ler-se.
 */
export function CadeiaViva() {
  const copy = COPY.OPERACAO;
  const [activo, setActivo] = useState(0);
  const semMovimento = useReducedMotion();
  const secaoRef = useRef<HTMLElement>(null);
  const [visivel, setVisivel] = useState(false);

  // Só anima quando a secção está no ecrã: um temporizador a correr numa secção
  // que ninguém está a ver é trabalho gasto, e num telemóvel é bateria.
  useEffect(() => {
    const el = secaoRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setVisivel(e.isIntersecting), { threshold: 0.25 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visivel || semMovimento) return;
    const total = copy.NOS.length;
    const t = setInterval(() => setActivo((a) => (a + 1) % total), 2600);
    return () => clearInterval(t);
  }, [visivel, semMovimento, copy.NOS.length]);

  return (
    <section
      id="operacao"
      ref={secaoRef}
      className="cc-secao"
      style={{ background: 'var(--escuro)', color: '#eaf2ff' }}
    >
      <div className="cc-caixa">
        <span className="cc-etiqueta cc-etiqueta--claro">{copy.ETIQUETA}</span>
        <h2 className="cc-titulo" style={{ color: '#f4f8ff', maxWidth: '26ch' }}>
          {copy.TITULO}
        </h2>
        <p className="cc-subtitulo" style={{ color: '#9fb3cf' }}>
          {copy.SUBTITULO}
        </p>

        <div style={{ marginTop: 48 }}>
          <ol
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'grid',
              gap: 10,
              gridTemplateColumns: `repeat(${copy.NOS.length}, minmax(0, 1fr))`,
            }}
          >
            {copy.NOS.map((no, i) => {
              const estaActivo = i === activo;
              return (
                <li key={no.chave}>
                  <button
                    type="button"
                    onMouseEnter={() => setActivo(i)}
                    onFocus={() => setActivo(i)}
                    onClick={() => setActivo(i)}
                    aria-current={estaActivo}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 0,
                      padding: 0,
                      cursor: 'pointer',
                      textAlign: 'left',
                      font: 'inherit',
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        height: 3,
                        borderRadius: 3,
                        background: estaActivo ? 'var(--azul-claro)' : 'rgb(96 165 250 / 0.22)',
                        transition: 'background-color 320ms',
                      }}
                    />
                    <span
                      style={{
                        display: 'block',
                        marginTop: 12,
                        fontSize: 10.5,
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        color: estaActivo ? '#f4f8ff' : '#6b83a6',
                        transition: 'color 320ms',
                      }}
                    >
                      {no.rotulo}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          {/* Altura mínima fixa: sem ela, frases de comprimentos diferentes fazem a
              secção saltar a cada 2,6 segundos. */}
          <p
            aria-live="polite"
            style={{
              margin: '30px 0 0',
              minHeight: 54,
              maxWidth: '46ch',
              fontSize: 17,
              lineHeight: 1.55,
              fontWeight: 600,
              color: '#dce8fa',
            }}
          >
            {copy.NOS[activo].frase}
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Os módulos ───────────────────────────────────────────────────────────────

export function Modulos() {
  const copy = COPY.MODULOS;
  const [activo, setActivo] = useState<string>(copy.LISTA[0].id);
  const modulo = copy.LISTA.find((m) => m.id === activo) ?? copy.LISTA[0];

  return (
    <section id="modulos" className="cc-secao">
      <div className="cc-caixa">
        <span className="cc-etiqueta">{copy.ETIQUETA}</span>
        <h2 className="cc-titulo" style={{ maxWidth: '24ch' }}>
          {copy.TITULO}
        </h2>

        <div className="cc-duas cc-duas--inverso cc-duas--topo" style={{ marginTop: 40 }}>
          <div role="tablist" aria-label={copy.ETIQUETA} style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
            {copy.LISTA.map((m) => {
              const estaActivo = m.id === activo;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={estaActivo}
                  onClick={() => setActivo(m.id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto minmax(0, 1fr)',
                    gap: 13,
                    alignItems: 'start',
                    textAlign: 'left',
                    padding: '15px 16px',
                    borderRadius: 14,
                    cursor: 'pointer',
                    font: 'inherit',
                    background: estaActivo ? 'var(--azul-tenue)' : 'transparent',
                    border: `1px solid ${estaActivo ? 'var(--azul-linha)' : 'transparent'}`,
                    transition: 'background-color 180ms, border-color 180ms',
                  }}
                >
                  <Icone
                    nome={m.icone}
                    size={19}
                    style={{ marginTop: 2, color: estaActivo ? 'var(--azul-fundo)' : 'var(--tinta-tenue)' }}
                  />
                  <span>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 15,
                        fontWeight: 700,
                        letterSpacing: '-0.01em',
                        color: estaActivo ? 'var(--azul-mais-fundo)' : 'var(--tinta)',
                      }}
                    >
                      {m.titulo}
                    </span>
                    {estaActivo && (
                      <span
                        style={{
                          display: 'block',
                          marginTop: 6,
                          fontSize: 13.5,
                          lineHeight: 1.55,
                          color: 'var(--tinta-suave)',
                        }}
                      >
                        {m.descricao}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <div>
            <JanelaDoProduto
              imagem={LANDING_IMAGES[modulo.imagem]}
              alt={`Ecrã de ${modulo.titulo} do ControlCore.`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── A Mayra ──────────────────────────────────────────────────────────────────

export function AMayra() {
  const semMovimento = useReducedMotion();
  const copy = COPY.MAYRA;

  return (
    <section
      id="mayra"
      className="cc-secao"
      style={{ background: 'var(--fundo-alt)', borderBlock: '1px solid var(--linha)' }}
    >
      <div className="cc-caixa cc-duas cc-duas--inverso">
        <div>
          <span className="cc-etiqueta">{copy.ETIQUETA}</span>
          <h2 className="cc-titulo" style={{ maxWidth: '20ch' }}>
            {copy.TITULO}
          </h2>
          <p className="cc-subtitulo">{copy.SUBTITULO}</p>

          <ul style={{ listStyle: 'none', margin: '28px 0 0', padding: 0, display: 'grid', gap: 14 }}>
            {copy.PONTOS.map((p) => (
              <li key={p.titulo} style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', gap: 12 }}>
                <span
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    width: 24,
                    height: 24,
                    marginTop: 1,
                    borderRadius: 999,
                    background: 'var(--azul-fundo)',
                    flexShrink: 0,
                  }}
                >
                  <Check size={13} strokeWidth={3} style={{ color: '#fff' }} />
                </span>
                <span>
                  <strong style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--tinta)' }}>
                    {p.titulo}
                  </strong>
                  <span
                    style={{ display: 'block', marginTop: 3, fontSize: 14, lineHeight: 1.6, color: 'var(--tinta-suave)' }}
                  >
                    {p.texto}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <motion.div
          initial={semMovimento ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <ConversaDaMayra />
        </motion.div>
      </div>
    </section>
  );
}

function ConversaDaMayra() {
  const copy = COPY.MAYRA.CONVERSA;

  return (
    <div
      style={{
        borderRadius: 18,
        overflow: 'hidden',
        background: '#fff',
        border: '1px solid var(--linha)',
        boxShadow: '0 20px 50px rgb(10 22 40 / 0.08)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 18px',
          background: 'var(--escuro)',
        }}
      >
        <span
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 28,
            height: 28,
            borderRadius: 999,
            background: 'var(--azul-fundo)',
          }}
        >
          <Sparkles size={14} style={{ color: '#fff' }} />
        </span>
        <span style={{ fontSize: 14.5, fontWeight: 700, color: '#f4f8ff' }}>Mayra</span>
        <span
          style={{ marginLeft: 'auto', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', color: '#6b83a6' }}
        >
          {copy.ROTULO}
        </span>
      </div>

      <div style={{ padding: 18, display: 'grid', gap: 12 }}>
        <Bolha de="utilizador">{copy.PERGUNTA_1}</Bolha>

        <Bolha de="mayra">
          {copy.RESPOSTA_1}
          <span style={{ display: 'grid', gap: 7, marginTop: 11 }}>
            {copy.PRODUTOS.map((p) => (
              <span
                key={p.nome}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '9px 11px',
                  borderRadius: 9,
                  background: 'var(--azul-tenue)',
                  border: '1px solid var(--azul-linha)',
                  fontSize: 12.5,
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--tinta)' }}>{p.nome}</span>
                <span style={{ color: 'var(--tinta-suave)', whiteSpace: 'nowrap' }}>
                  <strong style={{ color: 'var(--azul-mais-fundo)' }}>{p.actual}</strong> / {p.minimo}
                </span>
              </span>
            ))}
          </span>
        </Bolha>

        <Bolha de="utilizador">{copy.PERGUNTA_2}</Bolha>

        {/* O pedido de confirmação, que é o ponto da secção. */}
        <div
          style={{
            borderRadius: 12,
            border: '1px solid var(--azul-linha)',
            background: 'var(--azul-tenue)',
            padding: 14,
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: 'var(--azul-mais-fundo)',
            }}
          >
            <ShieldCheck size={13} /> {copy.CONFIRMACAO_ROTULO}
          </span>
          <p style={{ margin: '9px 0 0', fontSize: 13.5, lineHeight: 1.55, color: 'var(--tinta)' }}>
            Criar encomenda a <strong>{copy.CONFIRMACAO_FORNECEDOR}</strong> com {copy.CONFIRMACAO_LINHAS},
            no total de <strong>{copy.CONFIRMACAO_TOTAL}</strong>.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 13 }}>
            <span
              style={{
                padding: '7px 15px',
                borderRadius: 8,
                background: 'var(--azul-fundo)',
                color: '#fff',
                fontSize: 12.5,
                fontWeight: 700,
              }}
            >
              {copy.CONFIRMAR}
            </span>
            <span
              style={{
                padding: '7px 15px',
                borderRadius: 8,
                background: '#fff',
                border: '1px solid var(--linha)',
                color: 'var(--tinta-suave)',
                fontSize: 12.5,
                fontWeight: 700,
              }}
            >
              {copy.CANCELAR}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bolha({ de, children }: { de: 'utilizador' | 'mayra'; children: React.ReactNode }) {
  const doUtilizador = de === 'utilizador';
  return (
    <div style={{ display: 'flex', justifyContent: doUtilizador ? 'flex-end' : 'flex-start' }}>
      <div
        style={{
          maxWidth: '86%',
          padding: '11px 14px',
          borderRadius: 14,
          borderBottomRightRadius: doUtilizador ? 4 : 14,
          borderBottomLeftRadius: doUtilizador ? 14 : 4,
          background: doUtilizador ? 'var(--azul-fundo)' : 'var(--fundo-alt)',
          border: doUtilizador ? 'none' : '1px solid var(--linha)',
          color: doUtilizador ? '#fff' : 'var(--tinta)',
          fontSize: 13.5,
          lineHeight: 1.55,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ── A segurança ──────────────────────────────────────────────────────────────

export function Seguranca() {
  const copy = COPY.SEGURANCA;

  return (
    <section className="cc-secao">
      <div className="cc-caixa">
        <span className="cc-etiqueta">{copy.ETIQUETA}</span>
        <h2 className="cc-titulo" style={{ maxWidth: '24ch' }}>
          {copy.TITULO}
        </h2>
        <p className="cc-subtitulo">{copy.SUBTITULO}</p>

        <div
          style={{
            display: 'grid',
            gap: 20,
            marginTop: 44,
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          }}
        >
          {copy.GARANTIAS.map((g) => (
            <div key={g.titulo} className="cc-cartao">
              <Icone nome={g.icone} size={21} style={{ color: 'var(--azul-fundo)' }} />
              <h3
                style={{
                  margin: '15px 0 0',
                  fontSize: 15.5,
                  fontWeight: 700,
                  lineHeight: 1.35,
                  letterSpacing: '-0.01em',
                  color: 'var(--tinta)',
                }}
              >
                {g.titulo}
              </h3>
              <p style={{ margin: '9px 0 0', fontSize: 14, lineHeight: 1.6, color: 'var(--tinta-suave)' }}>
                {g.texto}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Como começa ──────────────────────────────────────────────────────────────

export function ComoComeca() {
  const copy = COPY.COMECAR;

  return (
    <section
      id="comecar"
      className="cc-secao"
      style={{ background: 'var(--fundo-alt)', borderTop: '1px solid var(--linha)' }}
    >
      <div className="cc-caixa">
        <span className="cc-etiqueta">{copy.ETIQUETA}</span>
        <h2 className="cc-titulo" style={{ maxWidth: '22ch' }}>
          {copy.TITULO}
        </h2>
        <p className="cc-subtitulo">{copy.SUBTITULO}</p>

        <ol
          style={{
            listStyle: 'none',
            margin: '44px 0 0',
            padding: 0,
            display: 'grid',
            gap: 20,
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          }}
        >
          {copy.PASSOS.map((p) => (
            <li key={p.numero} className="cc-cartao">
              <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--azul-fundo)' }}>
                {p.numero}
              </span>
              <h3
                style={{
                  margin: '12px 0 0',
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  color: 'var(--tinta)',
                }}
              >
                {p.titulo}
              </h3>
              <p style={{ margin: '9px 0 0', fontSize: 14, lineHeight: 1.6, color: 'var(--tinta-suave)' }}>
                {p.texto}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ── Fecho ────────────────────────────────────────────────────────────────────

export function Fecho() {
  const copy = COPY.FECHO;
  const mailto = `mailto:${COPY.MARCA.EMAIL}?subject=${encodeURIComponent(copy.ASSUNTO_EMAIL)}`;

  return (
    <section className="cc-secao" style={{ background: 'var(--escuro)' }}>
      <div className="cc-caixa" style={{ textAlign: 'center' }}>
        <h2
          style={{
            margin: 0,
            fontSize: 'var(--titulo-secao)',
            fontWeight: 700,
            lineHeight: 1.12,
            letterSpacing: '-0.025em',
            color: '#f4f8ff',
          }}
        >
          {copy.TITULO}
        </h2>
        <p
          style={{
            margin: '18px auto 0',
            maxWidth: '54ch',
            fontSize: 16.5,
            lineHeight: 1.62,
            color: '#9fb3cf',
          }}
        >
          {copy.SUBTITULO}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 32 }}>
          <a href={mailto} className="cc-botao cc-botao--claro">
            {copy.BOTAO_PRIMARIO}
          </a>
          <Link to="/login" className="cc-botao cc-botao--fantasma-claro">
            {copy.BOTAO_SECUNDARIO} <ArrowRight size={16} />
          </Link>
        </div>

        <p style={{ margin: '20px 0 0', fontSize: 13, color: '#6b83a6' }}>
          {COPY.MARCA.EMAIL} · {COPY.MARCA.LOCAL}
        </p>
      </div>
    </section>
  );
}
