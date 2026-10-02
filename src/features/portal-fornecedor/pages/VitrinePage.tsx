import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Barcode,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  ImageOff,
  Info,
  LayoutGrid,
  List,
  Loader2,
  Package,
  PackageX,
  Plus,
  Search,
  Tag,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { ESTADOS_ARTIGO, EstadoArtigoVitrine, portal } from '../api/portal.api';
import type { ArtigoVitrine } from '../api/portal.api';
import { ArtigoFormModal } from '../components/ArtigoFormModal';
import { PrecosModal } from '../components/PrecosModal';
import { localeIntl } from '@/i18n';
import { cn, formatMoeda, mensagemDeErro } from '@/shared/utils';

const CHAVE_MODO = 'controlcore.portal.vitrine.modo';

/** O modo de visualização lembrado por browser — a mesma conveniência que o resto do
 *  sistema dá a filtros e a abas, e sem custar uma coluna na base de dados: é preferência
 *  de ecrã, não dado de negócio. */
function lerModoGuardado(): 'grelha' | 'lista' {
  try {
    const guardado = localStorage.getItem(CHAVE_MODO);
    return guardado === 'lista' ? 'lista' : 'grelha';
  } catch {
    return 'grelha';
  }
}

/**
 * A vitrine: os artigos que o fornecedor publica e os preços deles.
 *
 * ## Dois modos de ver a mesma lista
 *
 * **Grelha** — cards com imagem, nome e preço em destaque. É a mesma leitura que o
 * comprador tem no POS ao vender, e é isso que este modo existe para mostrar: o fornecedor
 * vê a vitrine como ela compete visualmente, não como uma tabela técnica.
 *
 * **Lista** — uma linha por artigo, com o factor de conversão e o aviso de GTIN em
 * destaque, e um detalhe expansível com os campos técnicos. É o modo para gerir muitos
 * artigos de uma vez: scanear cinquenta linhas é mais rápido do que scanear cinquenta
 * cards.
 *
 * Nenhum dos dois substitui o outro — um fornecedor com três artigos quer ver os cards que
 * vai mostrar; um com trezentos quer a lista para os encontrar depressa.
 */
export function VitrinePage() {
  const { t } = useTranslation('portal');
  const navegar = useNavigate();
  const queryClient = useQueryClient();

  const [modo, setModo] = useState<'grelha' | 'lista'>(lerModoGuardado);
  const [filtro, setFiltro] = useState<EstadoArtigoVitrine | 'TODOS'>('TODOS');
  const [termo, setTermo] = useState('');
  const [aEditar, setAEditar] = useState<ArtigoVitrine | 'novo' | null>(null);
  const [aPrecificar, setAPrecificar] = useState<ArtigoVitrine | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);

  const mudarModo = (novo: 'grelha' | 'lista') => {
    setModo(novo);
    try {
      localStorage.setItem(CHAVE_MODO, novo);
    } catch {
      // Preferência de ecrã, sem consequência se não gravar — uma aba privada, por exemplo.
    }
  };

  const { data: artigos, isLoading } = useQuery({
    queryKey: ['portal-artigos', filtro, termo],
    queryFn: () =>
      portal.listarArtigos({
        estado: filtro === 'TODOS' ? undefined : filtro,
        termo: termo.trim() || undefined,
      }),
  });

  const recarregar = () => queryClient.invalidateQueries({ queryKey: ['portal-artigos'] });

  const mudarEstado = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoArtigoVitrine }) =>
      portal.mudarEstadoArtigo(id, estado),
    onSuccess: (artigo) => {
      toast.success(
        t('vitrine.estado_mudado', {
          nome: artigo.nome,
          estado: t(`estadoArtigo.${artigo.estado}`),
          ajuda: t(`ajudaEstadoArtigo.${artigo.estado}`),
        }),
        { duration: 6000 },
      );
      recarregar();
    },
    onError: (e: any) => toast.error(mensagemDeErro(e, t('vitrine.erro_mudar_estado'))),
  });

  const semPreco = artigos?.filter((a) => precoVigente(a) === null).length ?? 0;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-slate-900">{t('vitrine.titulo')}</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            {t('vitrine.subtitulo')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navegar('/fornecedor/importar')}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Upload size={15} />
            {t('vitrine.importar_catalogo')}
          </button>
          <button
            onClick={() => setAEditar('novo')}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={15} />
            {t('vitrine.novo_artigo')}
          </button>
        </div>
      </header>

      {/* Um artigo publicado sem preço em vigor desaparece de todas as comparações, e o
          fornecedor não tem como saber — a vitrine mostra-o como publicado. Este aviso é a
          única forma de ele perceber. */}
      {semPreco > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <Info size={14} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-xs leading-snug text-amber-900">
            <strong>
              {t('vitrine.sem_preco_aviso', { count: semPreco })}
            </strong>{' '}
            {t('vitrine.sem_preco_aviso_detalhe')}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder={t('vitrine.pesquisar')}
            className="w-full rounded-md border border-slate-300 py-2 pl-8 pr-3 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(['TODOS', ...ESTADOS_ARTIGO] as (EstadoArtigoVitrine | 'TODOS')[]).map(
            (estado) => (
              <button
                key={estado}
                onClick={() => setFiltro(estado)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  filtro === estado
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
              >
                {estado === 'TODOS' ? t('vitrine.todos') : t(`estadoArtigo.${estado}`)}
              </button>
            ),
          )}
        </div>

        {/* O par de botões, e não um `<select>`: são só duas opções e visíveis as duas ao
            mesmo tempo é mais rápido de reconhecer do que abrir um menu para ver a outra. */}
        <div className="ml-auto flex shrink-0 gap-1 rounded-md border border-slate-300 p-0.5">
          <button
            onClick={() => mudarModo('grelha')}
            aria-pressed={modo === 'grelha'}
            title={t('vitrine.ver_grelha')}
            className={cn(
              'rounded px-2 py-1.5 transition-colors',
              modo === 'grelha' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100',
            )}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => mudarModo('lista')}
            aria-pressed={modo === 'lista'}
            title={t('vitrine.ver_lista')}
            className={cn(
              'rounded px-2 py-1.5 transition-colors',
              modo === 'lista' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100',
            )}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={22} className="animate-spin text-slate-400" />
        </div>
      ) : !artigos || artigos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 py-14 text-center">
          <Package size={26} className="mx-auto text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">
            {termo || filtro !== 'TODOS'
              ? t('vitrine.nenhum_artigo')
              : t('vitrine.vazia')}
          </p>
          {!termo && filtro === 'TODOS' && (
            <button
              onClick={() => setAEditar('novo')}
              className="mt-3 text-sm font-medium text-blue-600 hover:underline"
            >
              {t('vitrine.acrescentar_primeiro')}
            </button>
          )}
        </div>
      ) : modo === 'grelha' ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {artigos.map((artigo) => (
            <ArtigoCard
              key={artigo.id}
              artigo={artigo}
              aMudar={mudarEstado.isPending && mudarEstado.variables?.id === artigo.id}
              onEditar={() => setAEditar(artigo)}
              onPrecificar={() => setAPrecificar(artigo)}
              onMudarEstado={(estado) => mudarEstado.mutate({ id: artigo.id, estado })}
            />
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {artigos.map((artigo) => {
            const vigente = precoVigente(artigo);
            const aberto = expandido === artigo.id;

            return (
              <li key={artigo.id} className="rounded-lg border border-slate-200 bg-white">
                <div className="flex flex-wrap items-start gap-3 px-4 py-3">
                  <button
                    onClick={() => setExpandido(aberto ? null : artigo.id)}
                    className="mt-0.5 shrink-0 text-slate-400 hover:text-slate-600"
                    aria-label={aberto ? t('vitrine.fechar_detalhe') : t('vitrine.ver_detalhe')}
                  >
                    {aberto ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{artigo.nome}</span>
                      <EtiquetaEstado estado={artigo.estado} />
                      {!artigo.gtin && (
                        <span
                          className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700"
                          title={t('vitrine.sem_gtin_ajuda_lista')}
                        >
                          <Barcode size={9} />
                          {t('vitrine.sem_gtin')}
                        </span>
                      )}
                    </div>

                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                      <span className="font-mono">{artigo.referencia}</span>
                      {artigo.unidadeVenda && <span>{artigo.unidadeVenda}</span>}
                      {artigo.factorConversao !== 1 && (
                        <span
                          className="text-slate-600"
                          title={t('vitrine.factor_ajuda')}
                        >
                          {t('vitrine.factor_unidades', { factor: artigo.factorConversao })}
                        </span>
                      )}
                      {artigo.prazoExpedicaoDias !== null && (
                        <span>{t('vitrine.expede_em', { dias: artigo.prazoExpedicaoDias })}</span>
                      )}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    {vigente ? (
                      <>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatMoeda(vigente.preco)}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {artigo.factorConversao !== 1
                            ? t('vitrine.valor_por_unidade', {
                                valor: formatMoeda(vigente.preco / artigo.factorConversao),
                              })
                            : t('vitrine.por_unidade')}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs font-medium text-amber-600">{t('vitrine.sem_preco')}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-1.5">
                    <button
                      onClick={() => setAPrecificar(artigo)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Tag size={12} />
                      {t('vitrine.precos')}
                    </button>
                    <button
                      onClick={() => setAEditar(artigo)}
                      className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {t('vitrine.editar')}
                    </button>
                    <BotaoEstado
                      artigo={artigo}
                      temPreco={vigente !== null}
                      aMudar={mudarEstado.isPending && mudarEstado.variables?.id === artigo.id}
                      onMudar={(estado) => mudarEstado.mutate({ id: artigo.id, estado })}
                    />
                  </div>
                </div>

                {aberto && <Detalhe artigo={artigo} />}
              </li>
            );
          })}
        </ul>
      )}

      {aEditar && (
        <ArtigoFormModal
          artigo={aEditar === 'novo' ? null : aEditar}
          onClose={() => setAEditar(null)}
          onSuccess={recarregar}
        />
      )}

      {aPrecificar && (
        <PrecosModal
          artigo={aPrecificar}
          onClose={() => setAPrecificar(null)}
          onSuccess={recarregar}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Peças
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * O preço em vigor hoje, no escalão base.
 *
 * Calculado aqui só para o ecrã mostrar algo — a escolha que decide uma comparação é feita
 * no backend, em `preco-escalao.ts`, com a quantidade real da requisição e a regra de
 * desempate. Esta é a leitura simples: o escalão de menor quantidade, em vigor agora.
 */
function precoVigente(artigo: ArtigoVitrine) {
  const agora = Date.now();

  const vigentes = artigo.precos.filter((p) => {
    const de = new Date(p.vigenteDe).getTime();
    const ate = p.vigenteAte ? new Date(p.vigenteAte).getTime() : Infinity;
    return de <= agora && ate > agora;
  });

  if (vigentes.length === 0) return null;

  return [...vigentes].sort((a, b) => a.quantidadeMinima - b.quantidadeMinima)[0];
}

const CORES: Record<EstadoArtigoVitrine, string> = {
  RASCUNHO: 'bg-slate-100 text-slate-600',
  PUBLICADO: 'bg-emerald-100 text-emerald-700',
  ESGOTADO: 'bg-amber-100 text-amber-700',
  DESCONTINUADO: 'bg-slate-100 text-slate-400',
};

function EtiquetaEstado({ estado }: { estado: EstadoArtigoVitrine }) {
  const { t } = useTranslation('portal');

  return (
    <span
      className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium uppercase', CORES[estado])}
      title={t(`ajudaEstadoArtigo.${estado}`)}
    >
      {t(`estadoArtigo.${estado}`)}
    </span>
  );
}

/**
 * O card da grelha — a mesma leitura visual do `ProductCard` do POS: imagem quadrada,
 * nome, referência, preço em destaque. É deliberadamente a mesma composição, porque é
 * assim que o comprador vê produtos ao vender, e o fornecedor deve ver a sua vitrine como
 * ela compete visualmente, não como uma tabela técnica.
 *
 * Difere do POS em três pontos que são deste lado e não daquele: o estado (RASCUNHO,
 * ESGOTADO…) substitui o «restam N» do stock, o card não é clicável para vender — abre em
 * Editar — e leva as acções de gestão no rodapé, porque quem olha para isto é quem publica,
 * não quem compra.
 */
function ArtigoCard({
  artigo,
  aMudar,
  onEditar,
  onPrecificar,
  onMudarEstado,
}: {
  artigo: ArtigoVitrine;
  aMudar: boolean;
  onEditar: () => void;
  onPrecificar: () => void;
  onMudarEstado: (estado: EstadoArtigoVitrine) => void;
}) {
  const { t } = useTranslation('portal');
  const vigente = precoVigente(artigo);
  const imagemUrl = artigo.imagens?.[0];
  // Sem isto, um URL que falhe a carregar (link partido, servidor a recusar, CORS) deixa o
  // browser desenhar o ícone nativo de imagem quebrada com o texto `alt` — o nome do
  // artigo — por cima do espaço da imagem, sobreposto ao selo de estado. `falhou` troca
  // isso pelo mesmo placeholder «sem imagem» que já se usa quando não há URL nenhum.
  const [falhou, setFalhou] = useState(false);
  const temImagem = !!imagemUrl && !falhou;

  return (
    <div className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={onEditar}
        className="relative mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-slate-50 p-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="absolute left-2 top-2 z-10">
          <EtiquetaEstado estado={artigo.estado} />
        </span>

        {!artigo.gtin && (
          <span
            className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-md bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white"
            title={t('vitrine.sem_gtin_ajuda_card')}
          >
            <Barcode size={8} />
            {t('vitrine.sem_gtin')}
          </span>
        )}

        {temImagem ? (
          <img
            src={imagemUrl}
            alt={artigo.nome}
            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
            onError={() => setFalhou(true)}
            onLoad={() => setFalhou(false)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-300">
            <ImageOff size={22} />
            <span className="text-[9px] font-medium uppercase tracking-wide">
              {t('vitrine.sem_imagem')}
            </span>
          </div>
        )}
      </button>

      <button type="button" onClick={onEditar} className="flex-1 text-left">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-800">
          {artigo.nome}
        </h3>
        <p className="mt-1 font-mono text-[11px] font-medium text-slate-400">
          {artigo.referencia}
        </p>

        <div className="mt-2">
          {vigente ? (
            <>
              <p className="flex items-baseline gap-1">
                <span className="text-lg font-black text-slate-900">
                  {vigente.preco.toLocaleString(localeIntl(), {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  MT
                </span>
              </p>
              {artigo.factorConversao !== 1 && (
                <p className="text-[11px] text-slate-500">
                  {t('vitrine.valor_por_unidade', {
                    valor: formatMoeda(vigente.preco / artigo.factorConversao),
                  })}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs font-semibold text-amber-600">{t('vitrine.sem_preco_vigor')}</p>
          )}
        </div>
      </button>

      <div className="mt-3 flex gap-1.5 border-t border-slate-100 pt-2.5">
        <button
          onClick={onPrecificar}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-300 px-2 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
        >
          <Tag size={11} />
          {t('vitrine.precos')}
        </button>
        {aMudar ? (
          <span className="inline-flex items-center px-2">
            <Loader2 size={13} className="animate-spin text-slate-400" />
          </span>
        ) : (
          <BotaoEstado
            artigo={artigo}
            temPreco={vigente !== null}
            aMudar={false}
            onMudar={onMudarEstado}
            compacto
          />
        )}
      </div>
    </div>
  );
}

/**
 * Publicar, esgotar ou voltar a rascunho.
 *
 * Publicar sem preço é recusado no ecrã. O backend aceita — um artigo publicado sem preço é
 * um estado legítimo, e ele não tem como saber a intenção — mas o resultado é um artigo que
 * não aparece em comparação nenhuma. Avisar aqui é a diferença entre um fornecedor que
 * corrige e um que espera por vendas que não chegam.
 */
function BotaoEstado({
  artigo,
  temPreco,
  aMudar,
  onMudar,
  compacto,
}: {
  artigo: ArtigoVitrine;
  temPreco: boolean;
  aMudar: boolean;
  onMudar: (estado: EstadoArtigoVitrine) => void;
  /** Card da grelha: texto mais curto, para caber ao lado do botão de Preços. */
  compacto?: boolean;
}) {
  const { t } = useTranslation('portal');

  if (aMudar) {
    return (
      <span className="inline-flex items-center px-2.5 py-1.5">
        <Loader2 size={13} className="animate-spin text-slate-400" />
      </span>
    );
  }

  const base = compacto
    ? 'inline-flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium'
    : 'inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium';

  if (artigo.estado === 'RASCUNHO' || artigo.estado === 'DESCONTINUADO') {
    return (
      <button
        onClick={() => {
          if (!temPreco) {
            toast.error(t('vitrine.erro_publicar_sem_preco'), { duration: 6000 });
            return;
          }
          onMudar('PUBLICADO');
        }}
        className={cn(base, 'bg-emerald-600 text-white hover:bg-emerald-700')}
      >
        <Eye size={compacto ? 11 : 12} />
        {t('vitrine.publicar')}
      </button>
    );
  }

  if (artigo.estado === 'PUBLICADO') {
    return (
      <button
        onClick={() => onMudar('ESGOTADO')}
        className={cn(base, 'border border-amber-300 text-amber-700 hover:bg-amber-50')}
        title={t('vitrine.esgotado_ajuda')}
      >
        <PackageX size={compacto ? 11 : 12} />
        {t('estadoArtigo.ESGOTADO')}
      </button>
    );
  }

  return (
    <button
      onClick={() => onMudar('PUBLICADO')}
      className={cn(base, 'border border-emerald-300 text-emerald-700 hover:bg-emerald-50')}
    >
      <EyeOff size={compacto ? 11 : 12} />
      {t('vitrine.repor')}
    </button>
  );
}

function Detalhe({ artigo }: { artigo: ArtigoVitrine }) {
  const { t } = useTranslation('portal');

  // `string | null | undefined`: os campos opcionais da API são ambos — `?: string | null`
  // permite a chave ausente e o valor nulo, e os dois significam o mesmo aqui («não
  // preenchido»). O filtro abaixo trata-os igual.
  const linhas: [string, string | null | undefined][] = [
    [t('vitrine.det_codigo_barras'), artigo.gtin],
    [t('vitrine.det_categoria'), artigo.categoria],
    [t('vitrine.det_marca'), artigo.marca],
    [t('vitrine.det_embalagem'), artigo.embalagem],
    [t('vitrine.det_minimo'), artigo.moq !== null ? `${artigo.moq}` : null],
    [t('vitrine.det_multiplo'), artigo.multiplo !== null ? `${artigo.multiplo}` : null],
    [
      t('vitrine.det_saldo'),
      artigo.quantidadeDisponivel !== null
        ? `${artigo.quantidadeDisponivel}`
        : t('vitrine.det_nao_declarado'),
    ],
    [t('vitrine.det_descricao'), artigo.descricao],
  ];

  return (
    <div className="border-t border-slate-100 px-4 py-3">
      <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {linhas
          .filter(([, valor]) => !!valor)
          .map(([etiqueta, valor]) => (
            <div key={etiqueta} className="flex gap-2 text-xs">
              <dt className="shrink-0 text-slate-500">{etiqueta}:</dt>
              <dd className="min-w-0 text-slate-800">{valor}</dd>
            </div>
          ))}
      </dl>

      {artigo.precos.length > 1 && (
        <div className="mt-3 border-t border-slate-100 pt-2.5">
          <p className="text-xs font-medium text-slate-600">{t('vitrine.escaloes')}</p>
          <ul className="mt-1 space-y-0.5">
            {[...artigo.precos]
              .sort((a, b) => a.quantidadeMinima - b.quantidadeMinima)
              .map((p) => (
                <li key={p.id} className="text-xs text-slate-500">
                  {t('vitrine.a_partir_de', { quantidade: p.quantidadeMinima })} →{' '}
                  <span className="font-medium text-slate-700">{formatMoeda(p.preco)}</span>
                  {p.promocional && (
                    <span className="ml-1 text-amber-600">{t('vitrine.promocao')}</span>
                  )}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
