import { useMemo, useState } from 'react';
import { Check, Star } from 'lucide-react';

import { BarraDoSitio, RodapeDoSitio } from '@/features/landing/components/Cromo';
import { TabelaDeCapacidades, TituloDeSeccao } from '@/features/landing/components/TabelaDeCapacidades';
import {
  COMPLEMENTOS, MAYRA, MODULOS, PERGUNTAS, PLANOS, SEMPRE_INCLUIDO,
  precoPorUtilizadorExtra,
} from '@/features/landing/precos.dados';
import { COPY } from '@/shared/constants/copywriting';

import '@/features/landing/site.css';

/**
 * A página de preços.
 *
 * ## As regras que não se negociam
 *
 * 1. **O preço está visível sem formulário.** Esconder o preço atrás de
 *    «contacte-nos» filtra os curiosos e afasta os compradores sérios.
 * 2. **A tabela de capacidades é completa.** Com `✓` e `–` para as três colunas.
 *    Uma tabela que só mostra o que está incluído esconde o que falta, e o
 *    cliente descobre depois de pagar — a forma mais cara de o perder.
 * 3. **O total calcula-se no ecrã.** Um preço que exige aritmética mental é um
 *    preço que ninguém verifica.
 * 4. **Formato pt-MZ** — `18 500 MT`, com espaço fino, como no resto do sistema.
 */

const EF = ' ';

function moeda(v: number): string {
  return `${Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, EF)}${EF}MT`;
}

export function PrecosPage() {
  const [anual, setAnual] = useState(false);
  const [utilizadores, setUtilizadores] = useState(10);
  const [aberto, setAberto] = useState<string | null>(null);

  return (
    <div className="cc-sitio" style={{ background: '#fff', color: 'var(--tinta)' }}>
      <BarraDoSitio />

      <main>
        {/* ── Cabeçalho ─────────────────────────────────────────────────── */}
        <section style={{ paddingTop: 'clamp(40px, 6vw, 76px)', paddingBottom: 12 }}>
          <div className="cc-caixa" style={{ textAlign: 'center' }}>
            <h1
              style={{
                margin: '0 auto',
                maxWidth: '34ch',
                fontSize: 'var(--titulo-heroi)',
                fontWeight: 700,
                lineHeight: 1.08,
                letterSpacing: '-0.035em',
                color: 'var(--tinta)',
              }}
            >
              Três escalões. O preço está aqui,{' '}
              <span className="cc-realce">sem formulário</span>.
            </h1>
            <p
              style={{
                margin: '22px auto 0',
                maxWidth: '56ch',
                fontSize: 17,
                lineHeight: 1.6,
                color: 'var(--tinta-suave)',
              }}
            >
              O que muda entre escalões é o <strong style={{ color: 'var(--tinta)' }}>âmbito</strong>,
              não um sistema diferente por trás. Todos correm no mesmo ControlCore.
            </p>

            <ComutadorDeCiclo anual={anual} onMudar={setAnual} />
          </div>
        </section>

        {/* ── Os três cartões ──────────────────────────────────────────── */}
        <section className="cc-caixa" style={{ paddingBottom: 8 }}>
          <div
            style={{
              display: 'grid',
              gap: 20,
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            }}
          >
            {PLANOS.map((p) => (
              <article
                key={p.codigo}
                className="cc-cartao"
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  borderColor: p.destacado ? 'var(--tinta)' : 'var(--linha)',
                  borderWidth: p.destacado ? 2 : 1,
                  boxShadow: p.destacado ? '0 16px 48px rgb(17 17 17 / 0.1)' : 'none',
                }}
              >
                {p.destacado && (
                  <span
                    style={{
                      position: 'absolute', top: -12, left: 26,
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '4px 12px', borderRadius: 999,
                      background: 'var(--tinta)', color: '#fff',
                      fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                    }}
                  >
                    <Star size={11} strokeWidth={3} /> O mais escolhido
                  </span>
                )}

                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--tinta)' }}>
                  {p.nome}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--tinta-tenue)' }}>{p.ambito}</p>

                <p style={{ margin: '18px 0 0', minHeight: '3.2em', fontSize: 14.5, fontWeight: 500, lineHeight: 1.5, color: 'var(--tinta-suave)' }}>
                  «{p.frase}»
                </p>

                <div style={{ marginTop: 22, borderTop: '1px solid var(--fundo-alt)', paddingTop: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: 'var(--tinta)' }}>
                      {moeda(anual ? p.anual : p.mensal)}
                    </span>
                    <span style={{ fontSize: 13.5, color: 'var(--tinta-tenue)' }}>/{anual ? 'ano' : 'mês'}</span>
                  </div>
                  {anual && (
                    <p style={{ margin: '4px 0 0', fontSize: 12.5, fontWeight: 700, color: '#059669' }}>
                      Dois meses grátis
                    </p>
                  )}
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--tinta-tenue)' }}>Acresce IVA à taxa legal.</p>
                </div>

                <ul style={{ listStyle: 'none', margin: '22px 0 0', padding: 0, display: 'grid', gap: 10, flex: 1 }}>
                  {p.limites.map((l) => (
                    <li key={l.etiqueta} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, fontSize: 13.5 }}>
                      <span style={{ color: 'var(--tinta-suave)' }}>{l.etiqueta}</span>
                      <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--tinta)' }}>{l.valor}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#pedir"
                  className={p.destacado ? 'cc-botao cc-botao--cheio' : 'cc-botao cc-botao--contorno'}
                  style={{ marginTop: 26, width: '100%' }}
                >
                  Pedir demonstração
                </a>
              </article>
            ))}
          </div>

          <p style={{ margin: '24px 0 0', textAlign: 'center', fontSize: 13, color: 'var(--tinta-tenue)' }}>
            Sem cartão para experimentar. Uma conversa de meia hora diz se o sistema serve.
          </p>
        </section>

        <Calculadora utilizadores={utilizadores} onMudar={setUtilizadores} anual={anual} />

        {/* ── Capacidades ──────────────────────────────────────────────── */}
        <section className="cc-secao">
          <div className="cc-caixa">
            <TituloDeSeccao
              texto="O que cada escalão desbloqueia"
              subtexto="A tabela completa, com o que está incluído e o que não está, módulo a módulo."
            />

            <div style={{ marginTop: 40, display: 'grid', gap: 40 }}>
              {MODULOS.map((m) => (
                <div key={m.codigo}>
                  <div style={{ marginBottom: 12, display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--tinta)' }}>
                      {m.nome}
                    </h3>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--tinta-tenue)' }}>
                      {m.familia}
                    </span>
                  </div>
                  <TabelaDeCapacidades capacidades={m.capacidades} />
                </div>
              ))}

              <div>
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--tinta)' }}>
                    A Mayra
                  </h3>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--tinta-tenue)' }}>
                    Copiloto — transversal
                  </span>
                </div>
                <TabelaDeCapacidades capacidades={MAYRA} />
                <p style={{ margin: '14px 0 0', maxWidth: '60ch', fontSize: 13, lineHeight: 1.6, color: 'var(--tinta-suave)' }}>
                  Perguntar vai em <strong style={{ color: 'var(--tinta)' }}>todos</strong> os planos.
                  O que muda é a escrita: uma acção que altera dados precisa de confirmação antes de gravar.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Sempre incluído ──────────────────────────────────────────── */}
        <section className="cc-secao" style={{ background: 'var(--fundo-alt)', borderBlock: '1px solid var(--linha)' }}>
          <div className="cc-caixa">
            <TituloDeSeccao
              texto="Sempre incluído, nunca facturado"
              subtexto="Cobrar pela exportação dos dados é o que faz um cliente hesitar em entrar."
            />
            <ul style={{ listStyle: 'none', margin: '40px 0 0', padding: 0, display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
              {SEMPRE_INCLUIDO.map((i) => (
                <li key={i.o} style={{ display: 'flex', gap: 12 }}>
                  <Check size={17} strokeWidth={2.5} style={{ marginTop: 2, flexShrink: 0, color: '#059669' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: 'var(--tinta)' }}>{i.o}</p>
                    <p style={{ margin: '3px 0 0', fontSize: 13, lineHeight: 1.55, color: 'var(--tinta-suave)' }}>{i.porque}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Complementos ─────────────────────────────────────────────── */}
        <section className="cc-secao">
          <div className="cc-caixa">
            <TituloDeSeccao
              texto="Complementos"
              subtexto="Um complemento não é uma capacidade retida. É outro sítio de trabalho, ou consumo com custo variável real."
            />
            <div style={{ marginTop: 40, display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {COMPLEMENTOS.map((c) => (
                <article key={c.nome} className="cc-cartao">
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--tinta)' }}>
                      {c.nome}
                    </h3>
                    <span style={{ whiteSpace: 'nowrap', fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--tinta)' }}>
                      {moeda(c.preco)}<span style={{ fontSize: 12, fontWeight: 500, color: 'var(--tinta-tenue)' }}>/mês</span>
                    </span>
                  </div>
                  <p style={{ margin: '10px 0 0', fontSize: 13.5, lineHeight: 1.55, color: 'var(--tinta-suave)' }}>{c.descricao}</p>
                  <p style={{ margin: '8px 0 0', fontSize: 12.5, fontStyle: 'italic', color: 'var(--tinta-tenue)' }}>{c.porque}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Perguntas ────────────────────────────────────────────────── */}
        <section className="cc-secao" style={{ background: 'var(--fundo-alt)', borderBlock: '1px solid var(--linha)' }}>
          <div className="cc-caixa">
            <TituloDeSeccao texto="Perguntas frequentes" />
            <div style={{ margin: '40px auto 0', maxWidth: 720, borderTop: '1px solid var(--linha)', borderBottom: '1px solid var(--linha)' }}>
              {PERGUNTAS.map((q, i) => (
                <div key={q.p} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--linha)' }}>
                  <button
                    type="button"
                    onClick={() => setAberto(aberto === q.p ? null : q.p)}
                    aria-expanded={aberto === q.p}
                    style={{
                      display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                      padding: '18px 0', background: 'none', border: 0, cursor: 'pointer', textAlign: 'left', font: 'inherit',
                    }}
                  >
                    <span style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--tinta)' }}>{q.p}</span>
                    <span style={{ flexShrink: 0, fontSize: 20, color: 'var(--tinta-tenue)' }}>{aberto === q.p ? '−' : '+'}</span>
                  </button>
                  {aberto === q.p && (
                    <p style={{ maxWidth: '60ch', margin: '0 0 18px', fontSize: 14, lineHeight: 1.6, color: 'var(--tinta-suave)' }}>{q.r}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Fecho ────────────────────────────────────────────────────── */}
        <section id="pedir" className="cc-secao" style={{ background: 'var(--escuro)' }}>
          <div className="cc-caixa" style={{ textAlign: 'center' }}>
            <h2
              style={{
                margin: '0 auto', maxWidth: '32ch',
                fontSize: 'var(--titulo-secao)', fontWeight: 700, lineHeight: 1.12, letterSpacing: '-0.025em',
                color: '#f4f8ff',
              }}
            >
              Quer ver isto com os dados da sua loja?
            </h2>
            <p style={{ margin: '18px auto 0', maxWidth: '50ch', fontSize: 15.5, lineHeight: 1.6, color: '#9fb3cf' }}>
              Meia hora, sem compromisso. Mostramos a cadeia a fechar com um produto seu.
            </p>
            <a
              href={`mailto:${COPY.MARCA.EMAIL}?subject=${encodeURIComponent('Demonstração do ControlCore')}`}
              className="cc-botao cc-botao--claro"
              style={{ marginTop: 28 }}
            >
              Pedir demonstração
            </a>
          </div>
        </section>
      </main>

      <RodapeDoSitio />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function ComutadorDeCiclo({ anual, onMudar }: { anual: boolean; onMudar: (v: boolean) => void }) {
  return (
    <div
      role="radiogroup"
      aria-label="Ciclo de facturação"
      style={{
        marginTop: 32, display: 'inline-flex', alignItems: 'center',
        borderRadius: 999, border: '1px solid var(--linha)', background: 'var(--fundo-alt)', padding: 4,
      }}
    >
      {[
        { valor: false, etiqueta: 'Mensal' },
        { valor: true, etiqueta: 'Anual' },
      ].map((o) => (
        <button
          key={o.etiqueta}
          type="button"
          role="radio"
          aria-checked={anual === o.valor}
          onClick={() => onMudar(o.valor)}
          style={{
            borderRadius: 999, padding: '9px 20px', fontSize: 13.5, fontWeight: 700, border: 0, cursor: 'pointer', font: 'inherit',
            background: anual === o.valor ? '#fff' : 'transparent',
            color: anual === o.valor ? 'var(--tinta)' : 'var(--tinta-suave)',
            boxShadow: anual === o.valor ? '0 1px 3px rgb(10 22 40 / 0.12)' : 'none',
          }}
        >
          {o.etiqueta}
          {o.valor && (
            <span style={{ marginLeft: 8, borderRadius: 5, background: 'var(--azul-fundo)', padding: '2px 6px', fontSize: 10.5, fontWeight: 700, color: '#fff' }}>
              2 meses grátis
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/**
 * O total calcula-se no ecrã.
 *
 * Mostra os três escalões ao mesmo tempo com o número de utilizadores
 * escolhido — um comparador que obriga a mudar de plano para ver o preço
 * esconde a única coisa que a pessoa está ali a fazer.
 */
function Calculadora({
  utilizadores, onMudar, anual,
}: {
  utilizadores: number;
  onMudar: (v: number) => void;
  anual: boolean;
}) {
  const totais = useMemo(
    () =>
      PLANOS.map((p) => {
        const extra = Math.max(0, utilizadores - p.utilizadores);
        const porExtra = precoPorUtilizadorExtra(utilizadores);
        const meses = anual ? 12 : 1;
        const base = anual ? p.anual : p.mensal;
        return {
          codigo: p.codigo,
          nome: p.nome,
          extra,
          porExtra,
          total: base + extra * porExtra * meses,
        };
      }),
    [utilizadores, anual],
  );

  return (
    <section className="cc-caixa" style={{ marginTop: 8, marginBottom: 8 }}>
      <div style={{ borderRadius: 24, background: 'var(--fundo-alt)', padding: 'clamp(24px, 4vw, 40px)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--tinta)' }}>
              Quantas pessoas vão usar?
            </h2>
            <p style={{ margin: '4px 0 0', maxWidth: 420, fontSize: 13.5, lineHeight: 1.55, color: 'var(--tinta-suave)' }}>
              Acima dos incluídos, o preço por utilizador desce com o volume:
              420 MT até 15, 340 MT até 40, 260 MT acima disso.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <input
              type="range"
              min={1}
              max={100}
              value={utilizadores}
              onChange={(e) => onMudar(Number(e.target.value))}
              aria-label="Número de utilizadores"
              style={{ width: 190, accentColor: 'var(--azul-fundo)' }}
            />
            <output style={{ width: 64, textAlign: 'right', fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--tinta)' }}>
              {utilizadores}
            </output>
          </div>
        </div>

        <div style={{ marginTop: 28, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {totais.map((t) => (
            <div key={t.codigo} style={{ borderRadius: 16, background: '#fff', padding: 20 }}>
              <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--tinta-tenue)' }}>
                {t.nome}
              </p>
              <p style={{ margin: '8px 0 0', fontSize: 25, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: 'var(--tinta)' }}>
                {moeda(t.total)}
              </p>
              <p style={{ margin: 0, fontSize: 11.5, color: 'var(--tinta-tenue)' }}>por {anual ? 'ano' : 'mês'}, sem IVA</p>
              <p style={{ margin: '8px 0 0', fontSize: 12.5, color: 'var(--tinta-suave)' }}>
                {t.extra === 0
                  ? 'Todos os utilizadores incluídos'
                  : `${t.extra} acima do incluído, a ${moeda(t.porExtra)}/mês cada`}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
