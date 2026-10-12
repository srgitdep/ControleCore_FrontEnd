/**
 * Comprimir uma fotografia **no telemóvel**, antes de a enviar (plano §4.9, D8).
 *
 * Uma fotografia de telemóvel pesa 4 a 8 MB, e o onboarding de um estafeta são até dez. Em dados móveis isso é
 * dinheiro e é uma ligação que cai a meio. Reduzida a 1600 px no lado maior e a JPEG de qualidade 0,8, um
 * documento fica com algumas centenas de kilobytes — e ainda se lê, que é o que importa a um BI.
 *
 * O servidor volta a validar e a converter (não confia no cliente); isto só poupa dados.
 */

/** O lado maior da imagem enviada. Um BI lê-se bem a 1600 px; acima disto só se paga o envio. */
export const LADO_MAXIMO_PX = 1600;
export const QUALIDADE_JPEG = 0.8;

/**
 * As dimensões finais: reduz o que passa do limite no lado maior, mantendo a proporção, e **nunca amplia**.
 * Pura — é o que se testa sem navegador.
 */
export function dimensoesFinais(
  largura: number,
  altura: number,
  ladoMaximo: number = LADO_MAXIMO_PX,
): { largura: number; altura: number } {
  const maior = Math.max(largura, altura);
  if (!Number.isFinite(maior) || maior <= 0 || maior <= ladoMaximo) return { largura, altura };

  const escala = ladoMaximo / maior;
  return {
    largura: Math.max(1, Math.round(largura * escala)),
    altura: Math.max(1, Math.round(altura * escala)),
  };
}

async function abrirImagem(ficheiro: File): Promise<{ fonte: CanvasImageSource; largura: number; altura: number; libertar: () => void }> {
  // `imageOrientation: 'from-image'` aplica a rotação do EXIF — sem isto, um BI tirado na vertical seguia deitado.
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(ficheiro, { imageOrientation: 'from-image' });
      return { fonte: bitmap, largura: bitmap.width, altura: bitmap.height, libertar: () => bitmap.close() };
    } catch {
      // Navegador sem a opção: cai no `<img>`, que também orienta pelo EXIF nos navegadores recentes.
    }
  }

  const url = URL.createObjectURL(ficheiro);
  try {
    const imagem = new Image();
    await new Promise<void>((resolver, rejeitar) => {
      imagem.onload = () => resolver();
      imagem.onerror = () => rejeitar(new Error('Não foi possível abrir a imagem.'));
      imagem.src = url;
    });
    return {
      fonte: imagem,
      largura: imagem.naturalWidth,
      altura: imagem.naturalHeight,
      libertar: () => URL.revokeObjectURL(url),
    };
  } catch (erro) {
    URL.revokeObjectURL(url);
    throw erro;
  }
}

/**
 * Reduz e recomprime uma fotografia. Se algo falhar (um formato que o navegador não abre, sem `canvas`) devolve o
 * **original**: o servidor aceita-o até 8 MB e decide — comprimir é uma poupança, nunca uma condição.
 * Também devolve o original se o resultado não for mais pequeno.
 */
export async function comprimirImagem(
  ficheiro: File,
  opcoes: { ladoMaximo?: number; qualidade?: number } = {},
): Promise<File> {
  const { ladoMaximo = LADO_MAXIMO_PX, qualidade = QUALIDADE_JPEG } = opcoes;

  try {
    const aberta = await abrirImagem(ficheiro);
    try {
      const { largura, altura } = dimensoesFinais(aberta.largura, aberta.altura, ladoMaximo);

      const tela = document.createElement('canvas');
      tela.width = largura;
      tela.height = altura;
      const contexto = tela.getContext('2d');
      if (!contexto) return ficheiro;
      contexto.drawImage(aberta.fonte, 0, 0, largura, altura);

      const blob = await new Promise<Blob | null>((resolver) => tela.toBlob(resolver, 'image/jpeg', qualidade));
      if (!blob || blob.size >= ficheiro.size) return ficheiro;

      const nome = ficheiro.name.replace(/\.[^.]+$/, '') || 'fotografia';
      return new File([blob], `${nome}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
    } finally {
      aberta.libertar();
    }
  } catch {
    return ficheiro;
  }
}

/** «850 m» abaixo do quilómetro, «1,2 km» acima (a vírgula é a decimal da língua do sistema). */
export function formatarDistancia(metros: number): string {
  if (!Number.isFinite(metros) || metros < 0) return '—';
  if (metros < 1000) return `${Math.round(metros)} m`;
  return `${(metros / 1000).toFixed(1).replace('.', ',')} km`;
}
