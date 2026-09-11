import { useEffect, useRef, useState } from 'react';
import { X, Camera, CameraOff, Check, Minus, Plus, ScanLine } from 'lucide-react';
import { useLeitorDeCodigo } from '@/shared/hooks';
import { cn } from '@/shared/utils';
import { useRegisterCountByBarcode } from '../hooks/useInventory';

/**
 * Leitura de códigos de barras pela câmara, para a Contagem Cega.
 *
 * ## A mesma UI/UX do leitor do POS, de propósito
 *
 * É o pedido explícito: bipar às centenas de produtos com o teclado do telemóvel é lento e
 * obriga a olhar para baixo a cada leitura. O leitor do POS (`LeitorCameraModal`) já resolve
 * exactamente este problema para a venda — mira, estados de câmara, entrada manual de
 * reserva — e o inventário precisa da mesma coisa, só que sem produto nem preço: aqui o que
 * se pede depois de ler não é «quantas unidades vendeu», é «quantas encontrou na
 * prateleira», e o destino não é o carrinho, é `POST /contagem-codigo-barras`.
 *
 * ## A câmara não fecha entre leituras
 *
 * Pedido explícito: contar um corredor inteiro sem reabrir a câmara a cada produto. Ao
 * confirmar uma contagem, o painel volta ao estado «à espera de leitura» e o vídeo continua
 * ligado — exactamente o mesmo comportamento do leitor do POS entre artigos.
 *
 * ## Continua cega
 *
 * Este modal nunca mostra o saldo do sistema nem o nome do produto lido — só o código, tal
 * como o formulário que já existia. Mostrar o nome do produto já seria uma pista sobre o
 * que "devia" estar na prateleira, e é precisamente essa influência que a contagem cega
 * evita.
 */
export function LeitorCameraContagemModal({
  cycleId,
  onFechar,
}: {
  cycleId: string;
  onFechar: () => void;
}) {
  const [codigoLido, setCodigoLido] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState('');
  const [modoManual, setModoManual] = useState(false);
  const [codigoManual, setCodigoManual] = useState('');

  /** Contagens confirmadas nesta sessão, para o operador ver o que já registou. */
  const [confirmados, setConfirmados] = useState<{ codigo: string; quantidade: number }[]>([]);

  const campoQuantidade = useRef<HTMLInputElement>(null);

  const { mutate: registerCount, isPending } = useRegisterCountByBarcode(cycleId);

  const aoLer = (codigo: string) => {
    setCodigoLido(codigo);
    setQuantidade('');
    setModoManual(false);
    navigator.vibrate?.(60);
  };

  const { videoRef, estado, detalheDoErro, iniciar, parar } = useLeitorDeCodigo({ aoLer });

  useEffect(() => {
    iniciar();
    return parar;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Foca a quantidade assim que um código é lido — o operador só tem de escrever o
  // número, sem tocar em nenhum campo.
  useEffect(() => {
    if (codigoLido) campoQuantidade.current?.focus();
  }, [codigoLido]);

  const confirmar = () => {
    if (!codigoLido || quantidade.trim() === '') return;
    const n = parseFloat(quantidade);
    if (!Number.isFinite(n) || n < 0) return;

    registerCount(
      { codigoBarras: codigoLido, physicalQuantity: n },
      {
        onSuccess: () => {
          setConfirmados((antes) => [{ codigo: codigoLido, quantidade: n }, ...antes].slice(0, 6));
          setCodigoLido(null);
          setQuantidade('');
        },
        // Um erro (código não encontrado no catálogo, por exemplo) mantém o painel como
        // está — o operador vê a mensagem e decide se corrige o código ou tenta de novo.
      },
    );
  };

  const aCarregar = estado === 'a-pedir-permissao';
  const semCamara = estado === 'sem-camara' || estado === 'sem-permissao' || estado === 'erro';

  useEffect(() => {
    if (semCamara) setModoManual(true);
  }, [semCamara]);

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
          className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"
          aria-label="Fechar leitor"
        >
          <X size={22} />
        </button>
      </div>

      {/* ── A câmara ─────────────────────────────────────────────────────────── */}
      <div className="relative flex-1 overflow-hidden bg-black">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted autoPlay />

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
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 text-center">
            <CameraOff className="h-7 w-7 text-slate-500" />
            <p className="text-sm font-medium text-slate-300">Sem câmara neste dispositivo</p>
            <p className="max-w-xs text-xs text-slate-500">
              {detalheDoErro ??
                'Escreva o código de barras no campo abaixo. Num telemóvel, a leitura pela câmara fica disponível.'}
            </p>
          </div>
        )}

        {confirmados.length > 0 && !codigoLido && (
          <div className="absolute left-3 top-3 max-w-[70%] space-y-1">
            {confirmados.slice(0, 3).map((c, i) => (
              <p
                key={i}
                className="truncate rounded bg-black/50 px-2 py-1 text-xs text-emerald-300 backdrop-blur-sm"
              >
                <Check size={11} className="mr-1 inline" />
                {c.quantidade} × <span className="font-mono">{c.codigo}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      {/* ── O painel de baixo ────────────────────────────────────────────────── */}
      <div className="bg-white px-4 pb-6 pt-4">
        {modoManual ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const c = codigoManual.trim();
              if (!c) return;
              aoLer(c);
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
              {!semCamara && (
                <button
                  type="button"
                  onClick={() => setModoManual(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-3 text-sm font-medium text-slate-600"
                >
                  Voltar à câmara
                </button>
              )}
              <button
                type="submit"
                className="flex-1 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white"
              >
                Continuar
              </button>
            </div>
          </form>
        ) : codigoLido ? (
          // ── O código lido, à espera da quantidade contada ───────────────────
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Código lido
            </p>
            <p className="font-mono text-lg font-semibold text-slate-900">{codigoLido}</p>

            <label className="mt-3 block text-sm font-medium text-slate-700">
              Quantidade encontrada na prateleira
            </label>
            <div className="mt-1.5 flex items-center gap-3">
              <button
                onClick={() => setQuantidade((q) => String(Math.max(0, (Number(q) || 0) - 1)))}
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
                min={0}
                step="any"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                onFocus={(e) => e.target.select()}
                placeholder="0"
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

            <button
              onClick={confirmar}
              disabled={quantidade.trim() === '' || isPending}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 font-semibold text-white active:bg-emerald-700 disabled:opacity-50"
            >
              <Check size={18} />
              {isPending ? 'A registar...' : 'Registar e continuar'}
            </button>
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
              Escrever
            </button>
          </div>
        )}

        {confirmados.length > 0 && !codigoLido && !modoManual && (
          <button
            onClick={onFechar}
            className="mt-4 w-full rounded-lg bg-slate-900 py-3 font-semibold text-white active:bg-slate-800"
          >
            Concluir — {confirmados.length} contagem(ns) registada(s)
          </button>
        )}
      </div>
    </div>
  );
}
