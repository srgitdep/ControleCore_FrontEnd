import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Barcode,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Package,
  PackageX,
  Plus,
  Search,
  Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AJUDA_ESTADO_ARTIGO,
  ETIQUETA_ESTADO_ARTIGO,
  EstadoArtigoVitrine,
  portal,
} from '../api/portal.api';
import type { ArtigoVitrine } from '../api/portal.api';
import { ArtigoFormModal } from '../components/ArtigoFormModal';
import { PrecosModal } from '../components/PrecosModal';
import { cn } from '@/shared/utils';

const mt = (v: number) =>
  `${v.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;

/**
 * A vitrine: os artigos que o fornecedor publica e os preços deles.
 *
 * ## O que este ecrã tem de conseguir explicar
 *
 * Dois campos decidem se o fornecedor ganha ou perde comparações, e nenhum dos dois é óbvio
 * para quem os preenche:
 *
 * **O factor de conversão.** Vende em caixas de 6 e o comprador conta unidades. Sem o
 * factor, dez caixas entram no stock dele como dez unidades — e o erro não dá mensagem
 * nenhuma, dá stock errado em silêncio. Do lado da comparação, é o que faz 240 por caixa
 * competir de igual com 42 por unidade.
 *
 * **O GTIN.** É o critério mais forte de correspondência que existe. Com código de barras, o
 * artigo é encontrado com certeza; sem ele, por semelhança de nome — que falha quando o
 * fornecedor lhe dá um nome que só ele entende.
 *
 * A lista mostra os dois em destaque, e a ausência do GTIN é assinalada.
 */
export function VitrinePage() {
  const queryClient = useQueryClient();

  const [filtro, setFiltro] = useState<EstadoArtigoVitrine | 'TODOS'>('TODOS');
  const [termo, setTermo] = useState('');
  const [aEditar, setAEditar] = useState<ArtigoVitrine | 'novo' | null>(null);
  const [aPrecificar, setAPrecificar] = useState<ArtigoVitrine | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);

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
        `«${artigo.nome}» — ${ETIQUETA_ESTADO_ARTIGO[artigo.estado]}. ${AJUDA_ESTADO_ARTIGO[artigo.estado]}`,
        { duration: 6000 },
      );
      recarregar();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao mudar o estado.'),
  });

  const semPreco = artigos?.filter((a) => precoVigente(a) === null).length ?? 0;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-slate-900">A minha vitrine</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Publique uma vez. Todos os compradores da plataforma vêem.
          </p>
        </div>
        <button
          onClick={() => setAEditar('novo')}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={15} />
          Novo artigo
        </button>
      </header>

      {/* Um artigo publicado sem preço em vigor desaparece de todas as comparações, e o
          fornecedor não tem como saber — a vitrine mostra-o como publicado. Este aviso é a
          única forma de ele perceber. */}
      {semPreco > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <Info size={14} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-xs leading-snug text-amber-900">
            <strong>
              {semPreco} artigo{semPreco === 1 ? '' : 's'} sem preço em vigor.
            </strong>{' '}
            Um artigo sem preço não aparece em nenhuma comparação, mesmo estando publicado.
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
            placeholder="Nome, referência ou código de barras…"
            className="w-full rounded-md border border-slate-300 py-2 pl-8 pr-3 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(['TODOS', ...Object.keys(ETIQUETA_ESTADO_ARTIGO)] as (EstadoArtigoVitrine | 'TODOS')[]).map(
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
                {estado === 'TODOS' ? 'Todos' : ETIQUETA_ESTADO_ARTIGO[estado]}
              </button>
            ),
          )}
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
              ? 'Nenhum artigo com esses critérios.'
              : 'A vitrine está vazia.'}
          </p>
          {!termo && filtro === 'TODOS' && (
            <button
              onClick={() => setAEditar('novo')}
              className="mt-3 text-sm font-medium text-blue-600 hover:underline"
            >
              Acrescentar o primeiro artigo
            </button>
          )}
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
                    aria-label={aberto ? 'Fechar detalhe' : 'Ver detalhe'}
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
                          title="Sem código de barras, os compradores encontram este artigo por semelhança de nome — que falha quando o nome não é o que eles usam. Com GTIN, é encontrado com certeza."
                        >
                          <Barcode size={9} />
                          sem GTIN
                        </span>
                      )}
                    </div>

                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                      <span className="font-mono">{artigo.referencia}</span>
                      {artigo.unidadeVenda && <span>{artigo.unidadeVenda}</span>}
                      {artigo.factorConversao !== 1 && (
                        <span
                          className="text-slate-600"
                          title="Quantas unidades base entram numa unidade de venda. É o que impede que dez caixas entrem no stock do comprador como dez unidades."
                        >
                          ×{artigo.factorConversao} unidades
                        </span>
                      )}
                      {artigo.prazoExpedicaoDias !== null && (
                        <span>expede em {artigo.prazoExpedicaoDias}d</span>
                      )}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    {vigente ? (
                      <>
                        <p className="text-sm font-semibold text-slate-900">
                          {mt(vigente.preco)}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {artigo.factorConversao !== 1
                            ? `${mt(vigente.preco / artigo.factorConversao)} / unidade`
                            : 'por unidade'}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs font-medium text-amber-600">sem preço</p>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-1.5">
                    <button
                      onClick={() => setAPrecificar(artigo)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Tag size={12} />
                      Preços
                    </button>
                    <button
                      onClick={() => setAEditar(artigo)}
                      className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Editar
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
  return (
    <span
      className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium uppercase', CORES[estado])}
      title={AJUDA_ESTADO_ARTIGO[estado]}
    >
      {ETIQUETA_ESTADO_ARTIGO[estado]}
    </span>
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
}: {
  artigo: ArtigoVitrine;
  temPreco: boolean;
  aMudar: boolean;
  onMudar: (estado: EstadoArtigoVitrine) => void;
}) {
  if (aMudar) {
    return (
      <span className="inline-flex items-center px-2.5 py-1.5">
        <Loader2 size={13} className="animate-spin text-slate-400" />
      </span>
    );
  }

  if (artigo.estado === 'RASCUNHO' || artigo.estado === 'DESCONTINUADO') {
    return (
      <button
        onClick={() => {
          if (!temPreco) {
            toast.error(
              'Este artigo não tem preço em vigor. Publique um preço primeiro — sem ele o ' +
                'artigo não aparece em nenhuma comparação.',
              { duration: 6000 },
            );
            return;
          }
          onMudar('PUBLICADO');
        }}
        className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
      >
        <Eye size={12} />
        Publicar
      </button>
    );
  }

  if (artigo.estado === 'PUBLICADO') {
    return (
      <button
        onClick={() => onMudar('ESGOTADO')}
        className="inline-flex items-center gap-1 rounded-md border border-amber-300 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50"
        title="Marca como sem saldo. Continua visível — o comprador vê que existe e vai voltar."
      >
        <PackageX size={12} />
        Esgotado
      </button>
    );
  }

  return (
    <button
      onClick={() => onMudar('PUBLICADO')}
      className="inline-flex items-center gap-1 rounded-md border border-emerald-300 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
    >
      <EyeOff size={12} />
      Repor
    </button>
  );
}

function Detalhe({ artigo }: { artigo: ArtigoVitrine }) {
  // `string | null | undefined`: os campos opcionais da API são ambos — `?: string | null`
  // permite a chave ausente e o valor nulo, e os dois significam o mesmo aqui («não
  // preenchido»). O filtro abaixo trata-os igual.
  const linhas: [string, string | null | undefined][] = [
    ['Código de barras', artigo.gtin],
    ['Categoria', artigo.categoria],
    ['Marca', artigo.marca],
    ['Embalagem', artigo.embalagem],
    ['Mínimo de encomenda', artigo.moq !== null ? `${artigo.moq}` : null],
    ['Múltiplo de encomenda', artigo.multiplo !== null ? `${artigo.multiplo}` : null],
    [
      'Saldo declarado',
      artigo.quantidadeDisponivel !== null ? `${artigo.quantidadeDisponivel}` : 'não declarado',
    ],
    ['Descrição', artigo.descricao],
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
          <p className="text-xs font-medium text-slate-600">Escalões</p>
          <ul className="mt-1 space-y-0.5">
            {[...artigo.precos]
              .sort((a, b) => a.quantidadeMinima - b.quantidadeMinima)
              .map((p) => (
                <li key={p.id} className="text-xs text-slate-500">
                  a partir de {p.quantidadeMinima} →{' '}
                  <span className="font-medium text-slate-700">{mt(p.preco)}</span>
                  {p.promocional && <span className="ml-1 text-amber-600">(promoção)</span>}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
