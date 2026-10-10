import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, BarChart3, Bike, MapPin, Package, ShoppingBag, Store, Wallet } from 'lucide-react';
import { cn, formatMoeda } from '@/shared/utils';
import type { RelatorioDaProcura } from '../types/procura';

/** Uma barra proporcional ao maior valor da lista: lê-se de relance, sem eixo nem legenda. */
function BarraRelativa({ valor, maximo, className }: { valor: number; maximo: number; className?: string }) {
  const largura = maximo > 0 ? Math.max(4, Math.round((valor / maximo) * 100)) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100" aria-hidden="true">
      <div className={cn('h-1.5 rounded-full bg-blue-500', className)} style={{ width: `${largura}%` }} />
    </div>
  );
}

function Cartao({ titulo, icone: Icone, children }: { titulo: string; icone: typeof Package; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        <Icone size={14} />
        {titulo}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Indicador({ rotulo, valor, nota }: { rotulo: string; valor: string; nota?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{rotulo}</p>
      <p className="mt-1 text-2xl font-extrabold text-slate-900">{valor}</p>
      {nota && <p className="mt-0.5 text-xs text-slate-400">{nota}</p>}
    </div>
  );
}

const Vazio = ({ texto }: { texto: string }) => <p className="py-6 text-center text-sm text-slate-400">{texto}</p>;

/**
 * O relatório de procura online, igual para a empresa e para o sistema (que só acrescenta a quebra por
 * empresa). Mostra o que se pede, de onde, a que horas e com que frequência — a base do futuro
 * marketing por zona (plano §4.4). **Nunca mostra coordenadas:** a zona é bairro/cidade.
 */
export function PainelDaProcura({ relatorio }: { relatorio: RelatorioDaProcura }) {
  const { t } = useTranslation('procura');
  const { resumo, produtos, zonas, horas, dias, lojas, empresas, navegacao } = relatorio;

  if (resumo.pedidos === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <BarChart3 size={28} className="text-slate-300" />
        <p className="text-sm text-slate-500">{t('vazio', { dias: relatorio.periodo.dias })}</p>
      </div>
    );
  }

  const maxProdutos = Math.max(...produtos.map((p) => p.pedidos), 0);
  const maxZonas = Math.max(...zonas.map((z) => z.pedidos), 0);
  const dadosHoras = horas.map((h) => ({ nome: `${h.hora}h`, pedidos: h.pedidos }));
  const dadosDias = dias.map((d) => ({ nome: t(`dia.d${d.dia}` as 'dia.d0'), pedidos: d.pedidos }));
  const temNavegacao =
    navegacao.pesquisas + navegacao.produtosVistos + navegacao.carrinhosAdicionados + navegacao.checkoutsIniciados > 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador rotulo={t('kpi.pedidos')} valor={String(resumo.pedidos)} nota={t('kpi.pedidos_nota', { concluidos: resumo.concluidos, cancelados: resumo.cancelados })} />
        <Indicador rotulo={t('kpi.valor')} valor={formatMoeda(resumo.valor)} nota={t('kpi.valor_nota', { taxas: formatMoeda(resumo.taxas) })} />
        <Indicador rotulo={t('kpi.ticket')} valor={formatMoeda(resumo.ticketMedio)} />
        <Indicador
          rotulo={t('kpi.entregas')}
          valor={`${resumo.entregas} / ${resumo.levantamentos}`}
          nota={
            resumo.distanciaMediaKm === null
              ? t('kpi.entregas_nota')
              : t('kpi.distancia_nota', { km: resumo.distanciaMediaKm.toLocaleString(undefined, { maximumFractionDigits: 1 }) })
          }
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Cartao titulo={t('produtos.titulo')} icone={Package}>
          {produtos.length === 0 ? (
            <Vazio texto={t('produtos.vazio')} />
          ) : (
            <ul className="space-y-3">
              {produtos.map((p) => (
                <li key={p.produtoId}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium text-slate-800">{p.nome}</span>
                    <span className="shrink-0 text-xs text-slate-500">
                      {t('produtos.linha', { pedidos: p.pedidos, unidades: p.unidades.toLocaleString(), frequencia: p.frequenciaSemanal.toLocaleString() })}
                    </span>
                  </div>
                  <div className="mt-1">
                    <BarraRelativa valor={p.pedidos} maximo={maxProdutos} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Cartao>

        <Cartao titulo={t('zonas.titulo')} icone={MapPin}>
          {zonas.length === 0 ? (
            <Vazio texto={t('zonas.vazio')} />
          ) : (
            <ul className="space-y-3">
              {zonas.map((z, i) => (
                <li key={`${z.cidade}-${z.bairro}-${i}`}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium text-slate-800">
                      {[z.bairro, z.cidade].filter(Boolean).join(', ') || t('zonas.sem_nome')}
                    </span>
                    <span className="shrink-0 text-xs text-slate-500">
                      {t('zonas.linha', { pedidos: z.pedidos, valor: formatMoeda(z.valor) })}
                      {z.distanciaMediaKm !== null && ` · ${z.distanciaMediaKm.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`}
                    </span>
                  </div>
                  <div className="mt-1">
                    <BarraRelativa valor={z.pedidos} maximo={maxZonas} className="bg-emerald-500" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Cartao titulo={t('horas.titulo')} icone={ShoppingBag}>
          <div className="h-48" role="img" aria-label={t('horas.titulo')}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosHoras} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="nome" tick={{ fontSize: 10 }} interval={2} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(v) => [String(v), t('horas.pedidos')]} />
                <Bar dataKey="pedidos" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">{t('horas.nota')}</p>
        </Cartao>

        <Cartao titulo={t('dias.titulo')} icone={ShoppingBag}>
          <div className="h-48" role="img" aria-label={t('dias.titulo')}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosDias} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="nome" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(v) => [String(v), t('horas.pedidos')]} />
                <Bar dataKey="pedidos" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Cartao>
      </div>

      <div className={cn('grid gap-5', empresas ? 'lg:grid-cols-2' : '')}>
        <Cartao titulo={t('lojas.titulo')} icone={Store}>
          <ul className="divide-y divide-slate-100">
            {lojas.map((l) => (
              <li key={l.lojaId} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate font-medium text-slate-800">{l.nome}</span>
                <span className="shrink-0 text-xs text-slate-500">{t('zonas.linha', { pedidos: l.pedidos, valor: formatMoeda(l.valor) })}</span>
              </li>
            ))}
          </ul>
        </Cartao>

        {empresas && (
          <Cartao titulo={t('empresas.titulo')} icone={Wallet}>
            <ul className="divide-y divide-slate-100">
              {empresas.map((e) => (
                <li key={e.empresaId} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0 truncate font-medium text-slate-800">{e.nome}</span>
                  <span className="shrink-0 text-xs text-slate-500">{t('zonas.linha', { pedidos: e.pedidos, valor: formatMoeda(e.valor) })}</span>
                </li>
              ))}
            </ul>
          </Cartao>
        )}
      </div>

      <Cartao titulo={t('navegacao.titulo')} icone={Bike}>
        {temNavegacao ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Indicador rotulo={t('navegacao.pesquisas')} valor={String(navegacao.pesquisas)} />
              <Indicador rotulo={t('navegacao.vistos')} valor={String(navegacao.produtosVistos)} />
              <Indicador rotulo={t('navegacao.carrinho')} valor={String(navegacao.carrinhosAdicionados)} />
              <Indicador rotulo={t('navegacao.checkout')} valor={String(navegacao.checkoutsIniciados)} />
            </div>
            {navegacao.termos.length > 0 && (
              <p className="text-sm text-slate-600">
                <span className="font-medium">{t('navegacao.termos')}: </span>
                {navegacao.termos.map((x) => `${x.termo} (${x.pesquisas})`).join(', ')}
              </p>
            )}
          </div>
        ) : (
          <p className="flex items-start gap-2 text-sm text-slate-500">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
            {t('navegacao.desligada')}
          </p>
        )}
      </Cartao>
    </div>
  );
}
