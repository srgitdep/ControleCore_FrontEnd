import { useMemo, useState } from 'react';
import { Check, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { BarraDoSitio, RodapeDoSitio } from '@/features/landing/components/Cromo';
import { TabelaDeCapacidades, TituloDeSeccao } from '@/features/landing/components/TabelaDeCapacidades';
import {
  COMPLEMENTOS, ESCALOES_UTILIZADOR, MAYRA, MODULOS, PERGUNTAS, PLANOS, SEMPRE_INCLUIDO,
  precoPorUtilizadorExtra,
  type Limite,
} from '@/features/landing/precos.dados';
import { useCopy } from '@/shared/hooks/useCopy';
import { formatInteiro, formatMoedaInteira } from '@/shared/utils';

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
 * 4. **Formato da língua activa** — `18 500 MT` em português, `MT 18,500` em inglês,
 *    pelos formatadores partilhados, como no resto do sistema.
 */

/**
 * O texto do valor de um limite. «Sem limite» é `null` nos dados; as perguntas à Mayra
 * levam a unidade «/ mês» e o histórico concorda em número («1 ano», «3 anos»).
 */
function valorDoLimite(t: TFunction<'precos'>, l: Limite): string {
  if (l.valor === null) return t('limite_valor.sem_limite');
  if (l.codigo === 'mayra') return t('limite_valor.por_mes', { n: formatInteiro(l.valor) });
  if (l.codigo === 'historico') return t('limite_valor.anos', { count: l.valor });
  return formatInteiro(l.valor);
}

export function PrecosPage() {
  const { t } = useTranslation('precos');
  const COPY = useCopy();
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
              {t('cabecalho.titulo_antes')}
              <span className="cc-realce">{t('cabecalho.titulo_realce')}</span>
              {t('cabecalho.titulo_depois')}
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
              {t('cabecalho.sub_antes')}
              <strong style={{ color: 'var(--tinta)' }}>{t('cabecalho.sub_negrito')}</strong>
              {t('cabecalho.sub_depois')}
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
                    <Star size={11} strokeWidth={3} /> {t('cartao.mais_escolhido')}
                  </span>
                )}

                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--tinta)' }}>
                  {t(`plano.${p.codigo}.nome`)}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--tinta-tenue)' }}>{t(`plano.${p.codigo}.ambito`)}</p>

                <p style={{ margin: '18px 0 0', minHeight: '3.2em', fontSize: 14.5, fontWeight: 500, lineHeight: 1.5, color: 'var(--tinta-suave)' }}>
                  «{t(`plano.${p.codigo}.frase`)}»
                </p>

                <div style={{ marginTop: 22, borderTop: '1px solid var(--fundo-alt)', paddingTop: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: 'var(--tinta)' }}>
                      {formatMoedaInteira(anual ? p.anual : p.mensal)}
                    </span>
                    <span style={{ fontSize: 13.5, color: 'var(--tinta-tenue)' }}>{anual ? t('cartao.por_ano') : t('cartao.por_mes')}</span>
                  </div>
                  {anual && (
                    <p style={{ margin: '4px 0 0', fontSize: 12.5, fontWeight: 700, color: '#059669' }}>
                      {t('cartao.dois_meses_gratis')}
                    </p>
                  )}
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--tinta-tenue)' }}>{t('cartao.iva')}</p>
                </div>

                <ul style={{ listStyle: 'none', margin: '22px 0 0', padding: 0, display: 'grid', gap: 10, flex: 1 }}>
                  {p.limites.map((l) => (
                    <li key={l.codigo} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, fontSize: 13.5 }}>
                      <span style={{ color: 'var(--tinta-suave)' }}>{t(`limite.${l.codigo}`)}</span>
                      <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--tinta)' }}>{valorDoLimite(t, l)}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#pedir"
                  className={p.destacado ? 'cc-botao cc-botao--cheio' : 'cc-botao cc-botao--contorno'}
                  style={{ marginTop: 26, width: '100%' }}
                >
                  {t('cartao.pedir_demo')}
                </a>
              </article>
            ))}
          </div>

          <p style={{ margin: '24px 0 0', textAlign: 'center', fontSize: 13, color: 'var(--tinta-tenue)' }}>
            {t('cartao.nota_sem_cartao')}
          </p>
        </section>

        <Calculadora utilizadores={utilizadores} onMudar={setUtilizadores} anual={anual} />

        {/* ── Capacidades ──────────────────────────────────────────────── */}
        <section className="cc-secao">
          <div className="cc-caixa">
            <TituloDeSeccao
              texto={t('capacidades.titulo')}
              subtexto={t('capacidades.subtexto')}
            />

            <div style={{ marginTop: 40, display: 'grid', gap: 40 }}>
              {MODULOS.map((m) => (
                <div key={m.codigo}>
                  <div style={{ marginBottom: 12, display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--tinta)' }}>
                      {t(`modulo.${m.codigo}`)}
                    </h3>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--tinta-tenue)' }}>
                      {t(`familia.${m.familia}`)}
                    </span>
                  </div>
                  <TabelaDeCapacidades capacidades={m.capacidades} />
                </div>
              ))}

              <div>
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--tinta)' }}>
                    {t('mayra.titulo')}
                  </h3>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--tinta-tenue)' }}>
                    {t('mayra.familia')}
                  </span>
                </div>
                <TabelaDeCapacidades capacidades={MAYRA} />
                <p style={{ margin: '14px 0 0', maxWidth: '60ch', fontSize: 13, lineHeight: 1.6, color: 'var(--tinta-suave)' }}>
                  {t('mayra.nota_antes')}
                  <strong style={{ color: 'var(--tinta)' }}>{t('mayra.nota_negrito')}</strong>
                  {t('mayra.nota_depois')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Sempre incluído ──────────────────────────────────────────── */}
        <section className="cc-secao" style={{ background: 'var(--fundo-alt)', borderBlock: '1px solid var(--linha)' }}>
          <div className="cc-caixa">
            <TituloDeSeccao
              texto={t('sempre.titulo')}
              subtexto={t('sempre.subtexto')}
            />
            <ul style={{ listStyle: 'none', margin: '40px 0 0', padding: 0, display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
              {SEMPRE_INCLUIDO.map((i) => (
                <li key={i} style={{ display: 'flex', gap: 12 }}>
                  <Check size={17} strokeWidth={2.5} style={{ marginTop: 2, flexShrink: 0, color: '#059669' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: 'var(--tinta)' }}>{t(`sempre.${i}.titulo`)}</p>
                    <p style={{ margin: '3px 0 0', fontSize: 13, lineHeight: 1.55, color: 'var(--tinta-suave)' }}>{t(`sempre.${i}.porque`)}</p>
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
              texto={t('complementos.titulo')}
              subtexto={t('complementos.subtexto')}
            />
            <div style={{ marginTop: 40, display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {COMPLEMENTOS.map((c) => (
                <article key={c.codigo} className="cc-cartao">
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--tinta)' }}>
                      {t(`complemento.${c.codigo}.nome`)}
                    </h3>
                    <span style={{ whiteSpace: 'nowrap', fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--tinta)' }}>
                      {formatMoedaInteira(c.preco)}<span style={{ fontSize: 12, fontWeight: 500, color: 'var(--tinta-tenue)' }}>{t('complementos.por_mes')}</span>
                    </span>
                  </div>
                  <p style={{ margin: '10px 0 0', fontSize: 13.5, lineHeight: 1.55, color: 'var(--tinta-suave)' }}>{t(`complemento.${c.codigo}.descricao`)}</p>
                  <p style={{ margin: '8px 0 0', fontSize: 12.5, fontStyle: 'italic', color: 'var(--tinta-tenue)' }}>{t(`complemento.${c.codigo}.porque`)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Perguntas ────────────────────────────────────────────────── */}
        <section className="cc-secao" style={{ background: 'var(--fundo-alt)', borderBlock: '1px solid var(--linha)' }}>
          <div className="cc-caixa">
            <TituloDeSeccao texto={t('perguntas.titulo')} />
            <div style={{ margin: '40px auto 0', maxWidth: 720, borderTop: '1px solid var(--linha)', borderBottom: '1px solid var(--linha)' }}>
              {PERGUNTAS.map((q, i) => (
                <div key={q} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--linha)' }}>
                  <button
                    type="button"
                    onClick={() => setAberto(aberto === q ? null : q)}
                    aria-expanded={aberto === q}
                    style={{
                      display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                      padding: '18px 0', background: 'none', border: 0, cursor: 'pointer', textAlign: 'left', font: 'inherit',
                    }}
                  >
                    <span style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--tinta)' }}>{t(`pergunta.${q}.p`)}</span>
                    <span style={{ flexShrink: 0, fontSize: 20, color: 'var(--tinta-tenue)' }}>{aberto === q ? '−' : '+'}</span>
                  </button>
                  {aberto === q && (
                    <p style={{ maxWidth: '60ch', margin: '0 0 18px', fontSize: 14, lineHeight: 1.6, color: 'var(--tinta-suave)' }}>{t(`pergunta.${q}.r`)}</p>
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
              {t('fecho.titulo')}
            </h2>
            <p style={{ margin: '18px auto 0', maxWidth: '50ch', fontSize: 15.5, lineHeight: 1.6, color: '#9fb3cf' }}>
              {t('fecho.texto')}
            </p>
            <a
              href={`mailto:${COPY.MARCA.EMAIL}?subject=${encodeURIComponent(t('fecho.assunto_email'))}`}
              className="cc-botao cc-botao--claro"
              style={{ marginTop: 28 }}
            >
              {t('cartao.pedir_demo')}
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
  const { t } = useTranslation('precos');
  return (
    <div
      role="radiogroup"
      aria-label={t('ciclo.aria')}
      style={{
        marginTop: 32, display: 'inline-flex', alignItems: 'center',
        borderRadius: 999, border: '1px solid var(--linha)', background: 'var(--fundo-alt)', padding: 4,
      }}
    >
      {[
        { valor: false, etiqueta: t('ciclo.mensal') },
        { valor: true, etiqueta: t('ciclo.anual') },
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
              {t('ciclo.dois_meses_chip')}
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
  const { t } = useTranslation('precos');
  const totais = useMemo(
    () =>
      PLANOS.map((p) => {
        const extra = Math.max(0, utilizadores - p.utilizadores);
        const porExtra = precoPorUtilizadorExtra(utilizadores);
        const meses = anual ? 12 : 1;
        const base = anual ? p.anual : p.mensal;
        return {
          codigo: p.codigo,
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
              {t('calculadora.titulo')}
            </h2>
            <p style={{ margin: '4px 0 0', maxWidth: 420, fontSize: 13.5, lineHeight: 1.55, color: 'var(--tinta-suave)' }}>
              {t('calculadora.texto', {
                p1: formatMoedaInteira(ESCALOES_UTILIZADOR[0].preco), a1: ESCALOES_UTILIZADOR[0].ate,
                p2: formatMoedaInteira(ESCALOES_UTILIZADOR[1].preco), a2: ESCALOES_UTILIZADOR[1].ate,
                p3: formatMoedaInteira(ESCALOES_UTILIZADOR[2].preco),
              })}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <input
              type="range"
              min={1}
              max={100}
              value={utilizadores}
              onChange={(e) => onMudar(Number(e.target.value))}
              aria-label={t('calculadora.aria_utilizadores')}
              style={{ width: 190, accentColor: 'var(--azul-fundo)' }}
            />
            <output style={{ width: 64, textAlign: 'right', fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--tinta)' }}>
              {utilizadores}
            </output>
          </div>
        </div>

        <div style={{ marginTop: 28, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {totais.map((x) => (
            <div key={x.codigo} style={{ borderRadius: 16, background: '#fff', padding: 20 }}>
              <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--tinta-tenue)' }}>
                {t(`plano.${x.codigo}.nome`)}
              </p>
              <p style={{ margin: '8px 0 0', fontSize: 25, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: 'var(--tinta)' }}>
                {formatMoedaInteira(x.total)}
              </p>
              <p style={{ margin: 0, fontSize: 11.5, color: 'var(--tinta-tenue)' }}>{anual ? t('calculadora.por_ano') : t('calculadora.por_mes')}</p>
              <p style={{ margin: '8px 0 0', fontSize: 12.5, color: 'var(--tinta-suave)' }}>
                {x.extra === 0
                  ? t('calculadora.todos_incluidos')
                  : t('calculadora.extra', { n: x.extra, preco: formatMoedaInteira(x.porExtra) })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
