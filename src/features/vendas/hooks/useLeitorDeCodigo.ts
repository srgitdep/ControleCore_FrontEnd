import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Leitura de códigos de barras pela câmara do telemóvel.
 *
 * ## Duas vias, e porquê
 *
 * A `BarcodeDetector` é nativa do browser: rápida, sem peso no pacote, e implementada
 * pelo próprio sistema operativo. Mas só existe no Chrome e no Edge em Android — no
 * Safari do iPhone não existe, e um operador com iPhone ficaria sem leitor.
 *
 * Daí a reserva: quando a nativa não está disponível, importa-se o `@zxing/browser` em
 * tempo de execução. O `import()` dinâmico mantém-no fora do pacote principal — quem
 * usa Android nunca o descarrega.
 *
 * ## O que não faz
 *
 * Não decide o que acontece depois de ler. Devolve o código e quem chama trata do
 * resto: encontrar o produto, pedir a quantidade, acrescentar ao carrinho. Um hook que
 * também mexesse no carrinho não serviria para o inventário, onde o mesmo gesto tem
 * outro fim.
 */

export type EstadoLeitor = 'inactivo' | 'a-pedir-permissao' | 'a-ler' | 'sem-camara' | 'sem-permissao' | 'erro';

/** Uma leitura anterior, para comparar com a que chega. */
export interface UltimaLeitura {
  codigo: string;
  quando: number;
}

/**
 * Se um código lido deve ser entregue, ou descartado por repetição.
 *
 * Uma função à parte, e pura, porque é aqui que está a regra que pode falhar em silêncio
 * — e testá-la dentro do hook exigiria simular câmara, vídeo e detector para verificar
 * uma comparação de dois campos.
 *
 * A pausa é **por código**, não global: ler outro produto imediatamente a seguir tem de
 * passar, ou o operador esperaria a pausa inteira entre artigos diferentes.
 */
export function deveEntregarLeitura(
  codigo: string,
  anterior: UltimaLeitura | null,
  agora: number,
  pausa: number,
): boolean {
  if (!codigo.trim()) return false;
  if (!anterior || anterior.codigo !== codigo.trim()) return true;
  return agora - anterior.quando >= pausa;
}

/** Formatos de código de barras usados no retalho. */
const FORMATOS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf'] as const;

/**
 * Espera que o vídeo tenha dimensões reais — não apenas que esteja a reproduzir.
 *
 * O ZXing dimensiona o seu canvas de captura uma única vez, a partir de
 * `videoWidth`/`videoHeight`, e considera o vídeo pronto quando `readyState > 2`. No
 * Safari esse estado chega **antes** de as dimensões existirem: o canvas fica 0×0 e
 * nunca há pixéis para descodificar. A câmara mostra imagem e o leitor nada encontra.
 *
 * `loadedmetadata` é o evento que garante as dimensões, mas pode já ter passado quando
 * chegamos aqui — daí verificar primeiro. O limite de tempo evita ficar à espera para
 * sempre de uma câmara que não arranca; ao expirar, deixa-se seguir em frente, porque
 * uma tentativa que falha é melhor do que um ecrã parado sem explicação.
 */
async function esperarDimensoesDoVideo(
  video: HTMLVideoElement,
  stream: MediaStream,
  limiteMs = 4000,
): Promise<void> {
  // O stream tem de estar ligado para os metadados chegarem. O ZXing volta a fazer
  // isto adiante, e atribuir o mesmo stream duas vezes não tem efeito.
  if (video.srcObject !== stream) video.srcObject = stream;

  // O Safari só preenche as dimensões depois de a reprodução começar.
  try {
    await video.play();
  } catch {
    // Sem reprodução automática as dimensões ainda podem chegar; a espera abaixo
    // decide. Falhar aqui não é motivo para desistir.
  }

  if (video.videoWidth > 0 && video.videoHeight > 0) return;

  await new Promise<void>((resolve) => {
    let terminado = false;
    const concluir = () => {
      if (terminado) return;
      terminado = true;
      clearTimeout(cronometro);
      video.removeEventListener('loadedmetadata', aoCarregar);
      video.removeEventListener('resize', aoCarregar);
      resolve();
    };

    const aoCarregar = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) concluir();
    };

    const cronometro = setTimeout(concluir, limiteMs);
    video.addEventListener('loadedmetadata', aoCarregar);
    // `resize` cobre o caso em que os metadados chegam com 0×0 e são corrigidos depois,
    // que acontece ao rodar o aparelho durante o arranque da câmara.
    video.addEventListener('resize', aoCarregar);
  });
}

interface OpcoesLeitor {
  /** Chamada a cada código lido. Ver a nota sobre repetições. */
  aoLer: (codigo: string) => void;
  /**
   * Tempo mínimo entre leituras do **mesmo** código, em milissegundos.
   *
   * A câmara analisa 4 a 10 imagens por segundo, e um código parado à frente da lente
   * é lido em todas elas. Sem esta pausa, apontar durante um segundo dava seis leituras
   * do mesmo produto.
   */
  pausaEntreRepeticoes?: number;
}

export function useLeitorDeCodigo({ aoLer, pausaEntreRepeticoes = 1500 }: OpcoesLeitor) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pararRef = useRef<(() => void) | null>(null);

  const [estado, setEstado] = useState<EstadoLeitor>('inactivo');
  const [detalheDoErro, setDetalheDoErro] = useState<string | null>(null);

  /** Último código lido e quando, para não repetir. */
  const ultimaLeitura = useRef<UltimaLeitura | null>(null);

  // Numa `ref` porque os laços de análise são criados uma vez e capturariam a primeira
  // versão do callback — que teria o carrinho vazio para sempre.
  const aoLerRef = useRef(aoLer);
  useEffect(() => {
    aoLerRef.current = aoLer;
  }, [aoLer]);

  const entregarCodigo = useCallback(
    (codigo: string) => {
      const limpo = codigo.trim();
      const agora = Date.now();

      if (!deveEntregarLeitura(limpo, ultimaLeitura.current, agora, pausaEntreRepeticoes)) {
        return;
      }

      ultimaLeitura.current = { codigo: limpo, quando: agora };
      aoLerRef.current(limpo);
    },
    [pausaEntreRepeticoes],
  );

  const parar = useCallback(() => {
    pararRef.current?.();
    pararRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    if (videoRef.current) videoRef.current.srcObject = null;

    setEstado('inactivo');
    ultimaLeitura.current = null;
  }, []);

  const iniciar = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setEstado('sem-camara');
      setDetalheDoErro('Este dispositivo ou navegador não dá acesso à câmara.');
      return;
    }

    setEstado('a-pedir-permissao');
    setDetalheDoErro(null);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          // A câmara de trás, que é a que aponta para o produto. `ideal` e não `exact`:
          // com `exact`, um portátil sem câmara traseira falharia em vez de usar a que
          // tem — e o operador pode estar num portátil com webcam.
          facingMode: { ideal: 'environment' },
          // Resolução moderada de propósito: um código de barras não precisa de 4K, e
          // analisar imagens grandes gasta bateria e atrasa a detecção.
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (erro: any) {
      // `NotAllowedError` é o utilizador a recusar; o resto é hardware ou o browser.
      // A distinção importa porque a solução é diferente: uma resolve-se nas
      // permissões do site, a outra não se resolve.
      if (erro?.name === 'NotAllowedError' || erro?.name === 'SecurityError') {
        setEstado('sem-permissao');
        setDetalheDoErro('Autorize o acesso à câmara nas permissões do navegador.');
      } else {
        setEstado('sem-camara');
        setDetalheDoErro(erro?.message ?? 'Não foi possível abrir a câmara.');
      }
      return;
    }

    streamRef.current = stream;

    const video = videoRef.current;
    if (!video) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    // `playsInline` evita que o iOS abra o vídeo em ecrã cheio por cima da aplicação,
    // e sem `muted` o Safari recusa a reprodução automática.
    video.playsInline = true;
    video.muted = true;

    const Detector = (window as any).BarcodeDetector;

    // Só a via nativa precisa de o vídeo estar a correr antes de analisar fotogramas.
    // Na via da biblioteca é o ZXing que liga o stream e espera pelo `canplay`, pelo
    // que atribuí-lo aqui sabotava-o: no iOS o evento já tinha passado quando o ZXing
    // começava a escutá-lo, e a leitura morria após o tempo limite de 5 s sem nada no
    // ecrã. O `catch` vazio que aqui estava escondia também a razão.
    if (Detector) {
      video.srcObject = stream;
      try {
        await video.play();
      } catch {
        setEstado('erro');
        setDetalheDoErro(
          'O navegador não deixou iniciar a pré-visualização da câmara. Escreva o código à mão.',
        );
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
    }

    setEstado('a-ler');

    if (Detector) {
      // ─── Via nativa ─────────────────────────────────────────────────────────
      let activo = true;
      pararRef.current = () => {
        activo = false;
      };

      let detector: any;
      try {
        detector = new Detector({ formats: FORMATOS });
      } catch {
        // Alguns browsers têm a classe mas não os formatos pedidos; sem formatos, o
        // construtor aceita todos os que suporta.
        detector = new Detector();
      }

      const analisar = async () => {
        if (!activo || !videoRef.current) return;

        try {
          const encontrados = await detector.detect(videoRef.current);
          if (encontrados?.length > 0) entregarCodigo(encontrados[0].rawValue);
        } catch {
          // Uma imagem que falha a análise não é um erro do leitor — o vídeo pode estar
          // entre fotogramas. Ignora-se e tenta-se a seguinte.
        }

        if (activo) {
          // `requestAnimationFrame` seguiria a taxa do ecrã (60 vezes por segundo), o
          // que é desperdício: 8 análises por segundo detectam tão bem e poupam bateria.
          setTimeout(analisar, 125);
        }
      };

      analisar();
      return;
    }

    // ─── Via biblioteca, para quem não tem a nativa ───────────────────────────
    // É por aqui que passa o iPhone: o Safari não implementa `BarcodeDetector`, em
    // nenhuma versão, e no iOS todos os browsers usam o WebKit — portanto o Chrome e o
    // Firefox no iPhone caem aqui também.
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const { BarcodeFormat, DecodeHintType } = await import('@zxing/library');

      // Sem `hints`, o ZXing tenta **todos** os formatos que conhece, incluindo QR,
      // Data Matrix e Aztec. Cada imagem passa por dezenas de descodificadores 2D que
      // nunca vão encontrar nada numa etiqueta de mercearia, e o tempo gasto neles é
      // tempo em que o fotograma nítido já passou. Restringir aos formatos do retalho
      // é o que faz a leitura acontecer num telemóvel à mão livre.
      //
      // `TRY_HARDER` autoriza o ZXing a insistir em cada imagem — mais trabalho por
      // fotograma, mas é o que apanha um código ligeiramente inclinado ou desfocado,
      // que é a norma quando se aponta um telemóvel a um produto.
      const hints = new Map<number, unknown>();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.ITF,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      // 500 ms por omissão são duas tentativas por segundo: com a mão a tremer, quase
      // nenhuma cai num instante em que a imagem está nítida. A 100 ms são dez, e o
      // custo é aceitável porque a lista de formatos acima já cortou o trabalho inútil.
      const leitor = new BrowserMultiFormatReader(hints as never, {
        delayBetweenScanAttempts: 100,
        delayBetweenScanSuccess: 800,
      });

      // `decodeFromStream`, e não `decodeFromVideoElement`: entregamos o stream e é o
      // ZXing que o liga ao elemento e espera que a reprodução comece.
      //
      // Mas antes há uma espera que o ZXing não faz por nós, e é ela que faltava para
      // o iOS ler. O ZXing cria o canvas de captura **uma vez**, no início, com
      // `videoWidth`/`videoHeight` do elemento nesse instante. Considera o vídeo pronto
      // quando `readyState > 2` — critério que no Safari se cumpre **antes** de as
      // dimensões estarem preenchidas. O canvas nascia 0×0, e um canvas sem área não
      // tem pixéis para analisar: a câmara mostrava imagem e o leitor nunca encontrava
      // nada. Era exactamente o sintoma «abre mas não lê».
      await esperarDimensoesDoVideo(video, stream);

      const controles = await leitor.decodeFromStream(stream, video, (resultado) => {
        if (resultado) entregarCodigo(resultado.getText());
      });

      pararRef.current = () => controles.stop();
    } catch {
      setEstado('erro');
      setDetalheDoErro(
        'Não foi possível iniciar o leitor neste navegador. Escreva o código à mão.',
      );
    }
  }, [entregarCodigo]);

  // Largar a câmara ao desmontar. Sem isto, a luz fica acesa e a câmara ocupada até
  // fechar o separador — e nenhuma outra aplicação a consegue usar.
  useEffect(() => parar, [parar]);

  return {
    videoRef,
    estado,
    detalheDoErro,
    iniciar,
    parar,
    /** `true` quando o browser tem leitor nativo — útil para diagnóstico. */
    temLeitorNativo: typeof window !== 'undefined' && 'BarcodeDetector' in window,
  };
}
