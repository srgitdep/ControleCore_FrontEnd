import { useEffect, useRef, useState } from 'react';
import {
  X, Camera, CameraOff, Check, Minus, Plus, ScanLine, AlertTriangle, Keyboard, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLeitorDeCodigo } from '../hooks/useLeitorDeCodigo';
import { catalogApi, type Product } from '@/features/produtos';
import { cn } from '@/shared/utils';

/**
 * Formata em meticais como o resto do POS.
 *
 * Não usa `Intl` com `currency: 'MZN'`: o browser escreve «MTn», símbolo que não aparece
 * em nenhum outro ecrã do sistema — os recibos e o fecho de caixa usam «MT». Um valor
 * escrito de duas formas no mesmo ecrã faz o operador duvidar de qual é o total.
 */
const moeda = (valor: number) =>
  `${valor.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;

/**
 * Leitura de códigos de barras pela câmara, para vender no telemóvel.
 *
 * ## O fluxo
 *
 * Ler → ver o produto → indicar a quantidade → confirmar. Ao ler outro código, o painel
 * troca para o novo produto e a quantidade volta a 1.
 *
 * A câmara **não** para enquanto se escolhe a quantidade. Parar e reabrir a cada
 * produto acrescenta um segundo de arranque por leitura, e numa venda de dez artigos
 * são dez segundos — mais do que o operador ganharia em qualquer outro sítio.
 *
 * ## Porquê um painel e não acrescentar logo ao carrinho
 *
 * Um leitor de supermercado acrescenta uma unidade por leitura porque quem o usa passa
 * cada artigo pelo scanner. Com a câmara de um telemóvel isso não funciona: apontar a
 * uma caixa de doze não é passar doze artigos, e o operador não vai apontar doze vezes.
 * O painel resolve isso — e confirma que o produto lido é o certo, o que um código
 * mal lido não garante.
 */
export function LeitorCameraModal({
  onConfirmar,
  onFechar,
}: {
  /** Chamado ao confirmar. Devolver uma mensagem de erro recusa a confirmação. */
  onConfirmar: (produto: Product, quantidade: number) => string | null;
  onFechar: () => void;
}) {
  /** O produto lido, à espera de quantidade. */
  const [lido, setLido] = useState<Product | null>(null);
  const [quantidade, setQuantidade] = useState('1');

  /** `true` enquanto se procura o código no servidor. */
  const [aProcurar, setAProcurar] = useState(false);

  /** Códigos lidos que não correspondem a produto nenhum. */
  const [codigoDesconhecido, setCodigoDesconhecido] = useState<string | null>(null);

  /** Confirmações desta sessão, para o operador ver o que já leu. */
  const [confirmados, setConfirmados] = useState<{ nome: string; quantidade: number }[]>([]);

  const [modoManual, setModoManual] = useState(false);
  const [codigoManual, setCodigoManual] = useState('');

  const campoQuantidade = useRef<HTMLInputElement>(null);

  /**
   * Identifica a leitura em curso, para uma resposta atrasada não substituir uma leitura
   * mais recente.
   *
   * Sem isto: leem-se dois códigos em sequência rápida, a resposta do primeiro chega
   * depois da do segundo, e o painel mostra o produto errado — com a quantidade que o
   * operador acabou de escrever para o outro.
   */
  const leituraActual = useRef(0);

  const procurar = async (codigo: string) => {
    const estaLeitura = ++leituraActual.current;

    setAProcurar(true);
    setCodigoDesconhecido(null);

    let encontrado: Product | null = null;
    try {
      encontrado = await catalogApi.getProductByBarcode(codigo);
    } catch {
      // Rede fora, ou o servidor a responder mal. Trata-se como não encontrado mas com
      // mensagem própria: dizer «não existe» quando a rede falhou levaria o operador a
      // registar um produto que já tem.
      if (estaLeitura === leituraActual.current) {
        setAProcurar(false);
        toast.error('Não foi possível consultar o produto. Verifique a ligação.');
      }
      return;
    }

    if (estaLeitura !== leituraActual.current) return; // Já há leitura mais recente.

    setAProcurar(false);

    if (!encontrado) {
      setCodigoDesconhecido(codigo);
      setLido(null);
      return;
    }

    setLido(encontrado);
    setQuantidade('1');

    // Sai do modo manual ao encontrar o produto. Sem isto o formulário de escrita
    // continuava à frente do painel de quantidade — o operador via o produto na lista
    // mas não tinha onde indicar quantas unidades nem como confirmar, e a entrada manual
    // ficava sem saída.
    setModoManual(false);

    // Vibra ao reconhecer: num telemóvel ao sol, a confirmação táctil chega antes de o
    // operador conseguir ler o ecrã. Não existe em iOS, e o `?.` cobre isso.
    navigator.vibrate?.(60);
  };

  const { videoRef, estado, detalheDoErro, iniciar, parar } = useLeitorDeCodigo({
    aoLer: procurar,
  });

  useEffect(() => {
    iniciar();
    return parar;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmar = () => {
    if (!lido) return;

    const n = Number(quantidade);
    if (!Number.isFinite(n) || n <= 0) return;

    const erro = onConfirmar(lido, n);
    if (erro) return; // Quem chama mostra a mensagem; o painel fica para corrigir.

    setConfirmados((antes) => [{ nome: lido.nome, quantidade: n }, ...antes].slice(0, 6));
    setLido(null);
    setQuantidade('1');
  };

  const aCarregar = estado === 'a-pedir-permissao';
  const semCamara = estado === 'sem-camara' || estado === 'sem-permissao' || estado === 'erro';

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-slate-900">
      {/* ── Cabeçalho ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <ScanLine className="h-5 w-5 text-blue-400" />
          <span className="font-semibold">Ler código de barras</span>
        </div>
        <button
          onClick={onFechar}
          // 44 px: o mínimo que um dedo acerta sem falhar. Com `p-2` dava 38 px, e este é
          // o botão que o operador usa com o telemóvel numa mão.
          className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"
          aria-label="Fechar leitor"
        >
          <X size={22} />
        </button>
      </div>

      {/* ── A câmara ─────────────────────────────────────────────────────────── */}
      <div className="relative flex-1 overflow-hidden bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {/* A mira. Não recorta nada — o leitor analisa a imagem inteira — mas diz ao
            operador onde apontar, o que na prática melhora a taxa de leitura. */}
        {estado === 'a-ler' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-32 w-4/5 max-w-sm">
              {[
                'left-0 top-0 border-l-4 border-t-4',
                'right-0 top-0 border-r-4 border-t-4',
                'left-0 bottom-0 border-l-4 border-b-4',
                'right-0 bottom-0 border-r-4 border-b-4',
              ].map((pos) => (
                <span key={pos} className={cn('absolute h-8 w-8 border-blue-400', pos)} />
              ))}
              <span className="absolute left-0 right-0 top-1/2 h-0.5 bg-blue-400/70" />
            </div>
          </div>
        )}

        {aCarregar && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-300">
            <Camera className="h-8 w-8 animate-pulse" />
            <p className="text-sm">A pedir acesso à câmara...</p>
          </div>
        )}

        {semCamara && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
            <CameraOff className="h-8 w-8 text-amber-400" />
            <p className="text-sm font-medium text-white">Câmara indisponível</p>
            <p className="text-xs text-slate-400">{detalheDoErro}</p>
            <button
              onClick={() => setModoManual(true)}
              className="mt-2 flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
            >
              <Keyboard size={16} />
              Escrever o código
            </button>
          </div>
        )}

        {/* Já confirmados nesta sessão — para o operador saber onde vai, sem sair da
            câmara para o carrinho. */}
        {confirmados.length > 0 && !lido && (
          <div className="absolute left-3 top-3 max-w-[70%] space-y-1">
            {confirmados.slice(0, 3).map((c, i) => (
              <p
                key={i}
                className="truncate rounded bg-black/50 px-2 py-1 text-xs text-emerald-300 backdrop-blur-sm"
              >
                <Check size={11} className="mr-1 inline" />
                {c.quantidade}× {c.nome}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* ── O painel de baixo ────────────────────────────────────────────────── */}
      <div className="bg-white px-4 pb-6 pt-4">
        {/* Escrever o código à mão: para embalagens rasgadas, códigos gastos, ou quando
            a câmara não está disponível. */}
        {modoManual ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const c = codigoManual.trim();
              if (!c) return;
              procurar(c);
              setCodigoManual('');
            }}
            className="space-y-3"
          >
            <label className="block text-sm font-medium text-slate-700">
              Código de barras
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value)}
                placeholder="Ex: 5601234567890"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-base"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setModoManual(false)}
                className="flex-1 rounded-lg border border-slate-200 py-3 text-sm font-medium text-slate-600"
              >
                Voltar à câmara
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white"
              >
                Procurar
              </button>
            </div>
          </form>
        ) : aProcurar ? (
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <p className="text-sm">Código lido. A procurar o produto...</p>
          </div>
        ) : codigoDesconhecido ? (
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800">Código não reconhecido</p>
              <p className="font-mono text-xs text-slate-500">{codigoDesconhecido}</p>
              <p className="mt-1 text-xs text-slate-500">
                Este código não está associado a nenhum produto. Aponte a outro, ou
                registe o produto no catálogo.
              </p>
            </div>
          </div>
        ) : lido ? (
          // ── O produto lido, à espera de quantidade ──────────────────────────
          <div>
            <div className="flex items-start gap-3">
              {lido.imagemUrl ? (
                <img
                  src={lido.imagemUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-lg bg-slate-100 object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <ScanLine className="h-6 w-6 text-slate-400" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{lido.nome}</p>
                <p className="text-sm text-slate-500">
                  {moeda(lido.precoVenda ?? 0)} · {lido.unidadeMedida ?? 'UN'}
                </p>
              </div>
            </div>

            {/* Botões grandes de propósito: isto usa-se de pé, com uma mão, e o outro
                braço a segurar o produto. */}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => setQuantidade((q) => String(Math.max(1, (Number(q) || 1) - 1)))}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 active:bg-slate-100"
                aria-label="Menos um"
              >
                <Minus size={20} />
              </button>

              <input
                ref={campoQuantidade}
                type="number"
                inputMode="decimal"
                aria-label="Quantidade"
                min="0"
                step="any"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                onFocus={(e) => e.target.select()}
                className="h-12 min-w-0 flex-1 rounded-lg border border-slate-300 text-center text-xl font-bold"
              />

              <button
                onClick={() => setQuantidade((q) => String((Number(q) || 0) + 1))}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 active:bg-slate-100"
                aria-label="Mais um"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                Total:{' '}
                <strong className="text-slate-900">
                  {moeda((Number(quantidade) || 0) * (lido.precoVenda ?? 0))}
                </strong>
              </p>
              <button
                onClick={confirmar}
                disabled={!(Number(quantidade) > 0)}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white active:bg-emerald-700 disabled:opacity-50"
              >
                <Check size={18} />
                Adicionar
              </button>
            </div>
          </div>
        ) : (
          // ── À espera de leitura ─────────────────────────────────────────────
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              {estado === 'a-ler'
                ? 'Aponte a câmara ao código de barras do produto.'
                : 'Leitor inactivo.'}
            </p>
            <button
              onClick={() => setModoManual(true)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600"
            >
              <Keyboard size={14} />
              Escrever
            </button>
          </div>
        )}

        {confirmados.length > 0 && (
          <button
            onClick={onFechar}
            className="mt-4 w-full rounded-lg bg-slate-900 py-3 font-semibold text-white active:bg-slate-800"
          >
            Concluir — {confirmados.reduce((s, c) => s + c.quantidade, 0)} artigo(s) no carrinho
          </button>
        )}
      </div>
    </div>
  );
}
