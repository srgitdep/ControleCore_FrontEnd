import { useRef, useState } from 'react';
import { Camera, X, Sparkles, Loader2, AlertTriangle, Check, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * O que qualquer leitura por fotografia devolve, para este componente ser genérico.
 *
 * `dados` fica como `Record<string, unknown>` de propósito: o que se lê de um produto de
 * retalho (nome, marca, código de barras) e o que se lê de um artigo de fornecedor (mais o
 * conteúdo por embalagem) não são o mesmo conjunto de campos, e este componente não precisa
 * de saber qual dos dois está a lidar — só de mostrar quantos vieram e o que foi recusado.
 */
export interface RespostaExtracaoPorFoto {
  dados: Record<string, unknown>;
  recusados: { campo: string; motivo: string }[];
  semResultado: boolean;
}

interface Foto {
  ficheiro: File;
  /** URL local para a pré-visualização; libertado ao remover. */
  previa: string;
}

/**
 * Preenche um formulário a partir de fotografias de um produto ou artigo.
 *
 * ## Porque é genérico e não vive em `features/produtos`
 *
 * Nasceu ali, para o formulário de produto do lado comprador. Quando o portal do
 * fornecedor precisou da mesma coisa — ler nome, marca, peso e unidade da fotografia de um
 * artigo — a escolha era duplicar as ~250 linhas de UI (pré-visualizações, limite de
 * imagens, mensagens de recusa) ou generalizar a única coisa que os dois formulários fazem
 * de forma diferente: **como perguntar ao servidor**.
 *
 * `analisar` é essa diferença — cada quem-chama passa a sua própria chamada de API (uma
 * fala com `/produtos/extrair-de-foto`, a outra com
 * `/portal-fornecedor/artigos/extrair-de-foto`) — e o resto, que é a parte que pode ter
 * bugs subtis (libertar URLs de pré-visualização, limite de tamanho, mensagens de recusa),
 * existe num só sítio.
 *
 * ## Várias fotografias, de propósito
 *
 * A informação está repartida pela embalagem: o nome e a marca na frente, o código de
 * barras quase sempre na face de trás, o peso às vezes na lateral. Com uma fotografia só,
 * metade dos campos ficava vazia por razões de embalagem — não de leitura.
 *
 * ## Nada é gravado aqui
 *
 * O resultado entra no formulário como sugestão, e a pessoa confirma antes de gravar. É a
 * diferença entre uma ferramenta de apoio e uma que enche o catálogo de dados que ninguém
 * viu.
 */
export function CapturaPorFoto({
  analisar,
  onExtraido,
  legenda,
}: {
  /** A chamada que sabe falar com o endpoint certo. */
  analisar: (imagens: File[]) => Promise<RespostaExtracaoPorFoto>;
  /** Chamado com os campos lidos. Só inclui o que passou a validação do lado do servidor. */
  onExtraido: (dados: Record<string, unknown>) => void;
  /** Substitui o texto de ajuda por omissão, quando o que se lê difere (preço nunca incluído). */
  legenda?: string;
}) {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [aAnalisar, setAAnalisar] = useState(false);
  const [recusados, setRecusados] = useState<{ campo: string; motivo: string }[]>([]);

  const inputCamara = useRef<HTMLInputElement>(null);
  const inputFicheiro = useRef<HTMLInputElement>(null);

  const MAX = 4;

  const acrescentar = (lista: FileList | null) => {
    if (!lista?.length) return;

    const espaco = MAX - fotos.length;
    if (espaco <= 0) {
      toast.error(`Máximo de ${MAX} fotografias.`);
      return;
    }

    const novas = Array.from(lista)
      .slice(0, espaco)
      .filter((f) => {
        if (!f.type.startsWith('image/')) {
          toast.error(`"${f.name}" não é uma imagem.`);
          return false;
        }
        if (f.size > 5 * 1024 * 1024) {
          toast.error(`"${f.name}" excede 5 MB.`);
          return false;
        }
        return true;
      })
      .map((ficheiro) => ({ ficheiro, previa: URL.createObjectURL(ficheiro) }));

    setFotos((antes) => [...antes, ...novas]);
    setRecusados([]);
  };

  const remover = (indice: number) => {
    setFotos((antes) => {
      // Liberta a URL local: sem isto, cada fotografia removida deixa memória presa até
      // recarregar a página.
      URL.revokeObjectURL(antes[indice].previa);
      return antes.filter((_, i) => i !== indice);
    });
  };

  const executar = async () => {
    if (fotos.length === 0) return;

    setAAnalisar(true);
    setRecusados([]);

    try {
      const r = await analisar(fotos.map((f) => f.ficheiro));

      if (r.semResultado) {
        toast.error(
          'Não foi possível ler dados nestas fotografias. Tente com mais luz, ou aproxime o rótulo.',
        );
        setRecusados(r.recusados ?? []);
        return;
      }

      onExtraido(r.dados);
      setRecusados(r.recusados ?? []);

      const lidos = Object.keys(r.dados).length;
      toast.success(`${lidos} ${lidos === 1 ? 'campo preenchido' : 'campos preenchidos'}.`);
    } catch (erro: any) {
      const mensagem = erro?.response?.data?.message;
      toast.error(
        typeof mensagem === 'string'
          ? mensagem
          : 'Falha ao analisar as fotografias. Verifique a ligação.',
      );
    } finally {
      setAAnalisar(false);
    }
  };

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
      <div className="mb-3 flex items-start gap-2">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">
            Preencher a partir de fotografias
          </p>
          <p className="text-xs text-slate-600">
            {legenda ??
              'Fotografe a frente e a face de trás — o código de barras costuma estar atrás. Os preços não são lidos da imagem.'}
          </p>
        </div>
      </div>

      {/* Pré-visualizações */}
      {fotos.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {fotos.map((f, i) => (
            <div key={f.previa} className="relative">
              <img
                src={f.previa}
                alt={`Fotografia ${i + 1}`}
                className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
              />
              <button
                type="button"
                onClick={() => remover(i)}
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm"
                aria-label={`Remover fotografia ${i + 1}`}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* `capture="environment"` abre a câmara de trás directamente no telemóvel, sem
          passar pelo selector de ficheiros. Num computador o atributo é ignorado e o
          browser abre o explorador — daí haver também o botão de galeria. */}
      <input
        ref={inputCamara}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          acrescentar(e.target.files);
          // Limpa o valor para a mesma fotografia poder ser escolhida outra vez: sem
          // isto, o `change` não dispara na segunda tentativa.
          e.target.value = '';
        }}
      />
      <input
        ref={inputFicheiro}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          acrescentar(e.target.files);
          e.target.value = '';
        }}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputCamara.current?.click()}
          disabled={fotos.length >= MAX || aAnalisar}
          className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
        >
          {fotos.length === 0 ? <Camera size={16} /> : <Plus size={16} />}
          {fotos.length === 0 ? 'Tirar fotografia' : 'Outra fotografia'}
        </button>

        <button
          type="button"
          onClick={() => inputFicheiro.current?.click()}
          disabled={fotos.length >= MAX || aAnalisar}
          className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
        >
          Escolher da galeria
        </button>

        {fotos.length > 0 && (
          <button
            type="button"
            onClick={executar}
            disabled={aAnalisar}
            className="ml-auto flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {aAnalisar ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                A ler {fotos.length === 1 ? 'a fotografia' : `as ${fotos.length} fotografias`}...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Ler dados
              </>
            )}
          </button>
        )}
      </div>

      {/* O que a IA leu mas não passou a validação.
          Mostra-se de propósito: sem isto, um código de barras recusado por ter o dígito
          de controlo errado era indistinguível de um código que a IA não viu, e ninguém
          saberia que valia a pena tirar outra fotografia — ou usar o leitor. */}
      {recusados.length > 0 && (
        <div className="mt-3 rounded-lg bg-amber-50 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
            <AlertTriangle size={13} />
            Não aproveitado
          </p>
          <ul className="mt-1 space-y-0.5">
            {recusados.map((r, i) => (
              <li key={i} className="text-xs text-amber-800">
                <strong>{r.campo}</strong>: {r.motivo}
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs text-amber-700">
            Escreva estes campos à mão, ou tente outra fotografia mais nítida.
          </p>
        </div>
      )}

      {fotos.length >= MAX && (
        <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          <Check size={12} /> Máximo de {MAX} fotografias.
        </p>
      )}
    </div>
  );
}
