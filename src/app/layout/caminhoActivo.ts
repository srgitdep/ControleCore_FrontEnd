/**
 * O caminho do menu que corresponde à página aberta: o **mais específico** que a contém, por segmentos.
 *
 * Com `startsWith` simples, `/compras/necessidades` acendia «Compras» (`/compras`) e «Necessidades» ao mesmo tempo;
 * e `/stock-x` acenderia `/stock`. Aqui só conta um prefixo que acabe num `/` (ou seja igual), e entre vários ganha
 * o mais comprido — a entrada mais próxima da página.
 */
export function caminhoActivo(pathname: string, caminhos: string[]): string | undefined {
  let melhor: string | undefined;
  for (const c of caminhos) {
    const contem = pathname === c || pathname.startsWith(c.endsWith('/') ? c : `${c}/`);
    if (contem && (melhor === undefined || c.length > melhor.length)) melhor = c;
  }
  return melhor;
}
