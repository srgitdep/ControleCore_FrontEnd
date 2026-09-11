import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Barcode,
  Building2,
  CheckCircle2,
  Globe,
  ImageOff,
  LayoutGrid,
  List,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { suppliersApi } from '../api/suppliers.api';
import type { ArtigoDaVitrine, VitrinaDoFornecedor } from '../api/suppliers.api';
import { cn } from '@/shared/utils';

const mt = (v: number) =>
  `${v.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;

const CHAVE_MODO = 'controlcore.compras.vitrina.modo';

function lerModoGuardado(): 'grelha' | 'lista' {
  try {
    const guardado = localStorage.getItem(CHAVE_MODO);
    return guardado === 'lista' ? 'lista' : 'grelha';
  } catch {
    return 'grelha';
  }
}

const ETIQUETA_DOCUMENTO: Record<string, string> = {
  ALVARA: 'Alvará',
  CERTIDAO_QUITACAO_FISCAL: 'Certidão de quitação fiscal',
  INSCRICAO_INSS: 'Inscrição no INSS',
  LICENCA_SANITARIA: 'Licença sanitária',
  SEGURO_RESPONSABILIDADE: 'Seguro de responsabilidade',
  CERTIFICADO_QUALIDADE: 'Certificado de qualidade',
  OUTRO: 'Outro documento',
};

/**
 * A vitrine de um fornecedor, vista de dentro de Compras — a mesma UI/UX da vitrine que o
 * fornecedor gere no seu próprio portal (`VitrinePage`), aqui em modo leitura.
 *
 * ## Porque os cards são visualmente os mesmos
 *
 * O comprador que decide a quem encomendar tem de ver a vitrine tal como o mercado a vê —
 * imagem, nome, preço em destaque — e não uma tabela técnica diferente da que o próprio
 * fornecedor usa para a publicar. Duas leituras visuais diferentes do mesmo catálogo
 * fariam parecer que são coisas distintas quando são a mesma.
 *
 * ## Sem botões de gerir
 *
 * Publicar, esgotar, editar — são acções do fornecedor sobre a sua própria vitrine, e este
 * ecrã não é essa página. Um comprador que clicasse «Publicar» aqui estaria a tentar mudar
 * o catálogo de outra empresa, que é exactamente o que a fronteira de isolamento do backend
 * (`ICatalogoPublicoRepository`) existe para impedir — o servidor nem tem uma rota que
 * aceitasse esse pedido vindo daqui.
 *
 * ## Dados comerciais que a ficha pública do mercado não mostra
 *
 * `FichaFornecedorPage` é para um visitante anónimo, e não mostra e-mail nem telefone da
 * organização. Este ecrã é para um comprador autenticado a decidir uma compra real, e
 * precisa desse contacto — é a mesma razão pela qual a rota do backend (`GET
 * /b2b/qualificacao/:id/vitrine`) é diferente da do mercado, e exige sessão e o módulo B2B.
 */
export function FornecedorVitrinePage() {
  const { organizacaoId } = useParams<{ organizacaoId: string }>();
  const [modo, setModo] = useState<'grelha' | 'lista'>(lerModoGuardado);

  const { data: vitrina, isLoading, isError } = useQuery({
    queryKey: ['fornecedor-vitrina', organizacaoId],
    queryFn: () => suppliersApi.getVitrina(organizacaoId!),
    enabled: !!organizacaoId,
    retry: false,
  });

  const mudarModo = (novo: 'grelha' | 'lista') => {
    setModo(novo);
    try {
      localStorage.setItem(CHAVE_MODO, novo);
    } catch {
      /* preferência de ecrã, sem consequência se não gravar */
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Link
            to="/compras?tab=fornecedores"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={15} />
            Fornecedores
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={22} className="animate-spin text-slate-400" />
          </div>
        ) : isError || !vitrina ? (
          <div className="rounded-lg border border-dashed border-slate-300 py-16 text-center">
            <Building2 size={26} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm text-slate-600">Fornecedor não encontrado.</p>
            <Link
              to="/compras?tab=fornecedores"
              className="mt-3 inline-block text-sm text-blue-600 hover:underline"
            >
              Voltar aos fornecedores
            </Link>
          </div>
        ) : (
          <>
            <CabecalhoDaOrganizacao vitrina={vitrina} />

            <div className="mt-6 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Vitrine
                <span className="ml-1.5 font-normal text-slate-400">
                  ({vitrina.artigos.length} artigo{vitrina.artigos.length === 1 ? '' : 's'})
                </span>
              </h2>

              <div className="flex shrink-0 gap-1 rounded-md border border-slate-300 p-0.5">
                <button
                  onClick={() => mudarModo('grelha')}
                  aria-pressed={modo === 'grelha'}
                  title="Ver em grelha de cards"
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
                  title="Ver em lista"
                  className={cn(
                    'rounded px-2 py-1.5 transition-colors',
                    modo === 'lista' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100',
                  )}
                >
                  <List size={14} />
                </button>
              </div>
            </div>

            <div className="mt-3">
              {vitrina.artigos.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 py-14 text-center">
                  <Package size={26} className="mx-auto text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">
                    Este fornecedor ainda não publicou artigos.
                  </p>
                </div>
              ) : modo === 'grelha' ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {vitrina.artigos.map((artigo) => (
                    <ArtigoCardLeitura key={artigo.id} artigo={artigo} />
                  ))}
                </div>
              ) : (
                <ul className="space-y-2">
                  {vitrina.artigos.map((artigo) => (
                    <LinhaArtigoLeitura key={artigo.id} artigo={artigo} />
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Peças
// ═══════════════════════════════════════════════════════════════════════════════

function CabecalhoDaOrganizacao({ vitrina }: { vitrina: VitrinaDoFornecedor }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
          {vitrina.logoUrl ? (
            <img src={vitrina.logoUrl} alt="" className="h-full w-full object-contain" />
          ) : (
            <Store size={22} className="text-slate-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-slate-900">
            {vitrina.nomeComercial ?? vitrina.razaoSocial}
          </h1>
          {vitrina.nomeComercial && vitrina.nomeComercial !== vitrina.razaoSocial && (
            <p className="text-sm text-slate-500">{vitrina.razaoSocial}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            {vitrina.nuit && (
              <span className="inline-flex items-center gap-1">
                <Building2 size={12} />
                NUIT {vitrina.nuit}
              </span>
            )}
            {vitrina.sede && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} />
                {vitrina.sede}
              </span>
            )}
            {vitrina.email && (
              <a
                href={`mailto:${vitrina.email}`}
                className="inline-flex items-center gap-1 hover:text-blue-600 hover:underline"
              >
                <Mail size={12} />
                {vitrina.email}
              </a>
            )}
            {vitrina.telefone && (
              <span className="inline-flex items-center gap-1">
                <Phone size={12} />
                {vitrina.telefone}
              </span>
            )}
            {vitrina.website && (
              <a
                href={vitrina.website.startsWith('http') ? vitrina.website : `https://${vitrina.website}`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline"
              >
                <Globe size={12} />
                {vitrina.website}
              </a>
            )}
          </div>

          {vitrina.provinciasServidas.length > 0 && (
            <p className="mt-2 flex flex-wrap gap-1.5">
              {vitrina.provinciasServidas.map((provincia) => (
                <span
                  key={provincia}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                >
                  <MapPin size={10} className="text-slate-400" />
                  {provincia}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>

      {vitrina.documentosValidos.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <ShieldCheck size={13} />
            Documentação verificada
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {vitrina.documentosValidos.map((tipo) => (
              <li
                key={tipo}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800"
              >
                <CheckCircle2 size={10} />
                {ETIQUETA_DOCUMENTO[tipo] ?? tipo}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const CORES_ESTADO = {
  publicado: 'bg-emerald-100 text-emerald-700',
  esgotado: 'bg-amber-100 text-amber-700',
} as const;

/**
 * O preço em vigor hoje, no escalão base — a mesma leitura simples que `VitrinePage` faz do
 * lado do fornecedor. A escolha que decide uma comparação real é do backend, com a
 * quantidade da requisição; esta é só para o card mostrar algo.
 */
function precoVigente(artigo: ArtigoDaVitrine) {
  const agora = Date.now();
  const vigentes = artigo.precos.filter((p) => {
    const de = new Date(p.vigenteDe).getTime();
    const ate = p.vigenteAte ? new Date(p.vigenteAte).getTime() : Infinity;
    return de <= agora && ate > agora;
  });
  if (vigentes.length === 0) return null;
  return [...vigentes].sort((a, b) => a.quantidadeMinima - b.quantidadeMinima)[0];
}

/**
 * O card da grelha — visualmente o mesmo `ArtigoCard` da vitrine do fornecedor, sem as
 * acções de gestão do rodapé. Ver a nota da página sobre porque é deliberadamente igual.
 */
function ArtigoCardLeitura({ artigo }: { artigo: ArtigoDaVitrine }) {
  const vigente = precoVigente(artigo);
  const imagemUrl = artigo.imagens?.[0];
  const [falhou, setFalhou] = useState(false);
  const temImagem = !!imagemUrl && !falhou;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="relative mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-slate-50 p-3">
        <span className="absolute left-2 top-2 z-10">
          <span
            className={cn(
              'rounded px-1.5 py-0.5 text-[10px] font-medium uppercase',
              CORES_ESTADO[artigo.esgotado ? 'esgotado' : 'publicado'],
            )}
          >
            {artigo.esgotado ? 'Esgotado' : 'Publicado'}
          </span>
        </span>

        {!artigo.gtin && (
          <span
            className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-md bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white"
            title="Sem código de barras — encontrado por semelhança de nome."
          >
            <Barcode size={8} />
            sem GTIN
          </span>
        )}

        {temImagem ? (
          <img
            src={imagemUrl}
            alt={artigo.nome}
            className="h-full w-full object-contain transition-transform duration-500 hover:scale-105"
            onError={() => setFalhou(true)}
            onLoad={() => setFalhou(false)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-300">
            <ImageOff size={22} />
            <span className="text-[9px] font-medium uppercase tracking-wide">Sem imagem</span>
          </div>
        )}
      </div>

      <div className="flex-1">
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
                <span className="text-lg font-black text-slate-900">{vigente.preco.toFixed(2)}</span>
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  MT
                </span>
              </p>
              {artigo.factorConversao !== 1 && (
                <p className="text-[11px] text-slate-500">
                  {mt(vigente.preco / artigo.factorConversao)} / unidade
                </p>
              )}
            </>
          ) : (
            <p className="text-xs font-semibold text-amber-600">Sem preço em vigor</p>
          )}
        </div>
      </div>
    </div>
  );
}

function LinhaArtigoLeitura({ artigo }: { artigo: ArtigoDaVitrine }) {
  const vigente = precoVigente(artigo);

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-900">{artigo.nome}</span>
          <span
            className={cn(
              'rounded px-1.5 py-0.5 text-[10px] font-medium uppercase',
              CORES_ESTADO[artigo.esgotado ? 'esgotado' : 'publicado'],
            )}
          >
            {artigo.esgotado ? 'Esgotado' : 'Publicado'}
          </span>
          {!artigo.gtin && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              <Barcode size={9} />
              sem GTIN
            </span>
          )}
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
          <span className="font-mono">{artigo.referencia}</span>
          {artigo.unidadeVenda && <span>{artigo.unidadeVenda}</span>}
          {artigo.factorConversao !== 1 && (
            <span className="text-slate-600">×{artigo.factorConversao} unidades</span>
          )}
        </p>
      </div>

      <div className="shrink-0 text-right">
        {vigente ? (
          <>
            <p className="text-sm font-semibold text-slate-900">{mt(vigente.preco)}</p>
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
    </li>
  );
}
