/**
 * O URL da fotografia a mostrar para um produto.
 *
 * Um upload real grava-se na galeria (`imagens`, com URL assinado calculado pelo servidor);
 * `imagemUrl` é só o link colado à mão, o comportamento antigo. Ler apenas `imagemUrl` faz
 * desaparecer todas as fotos carregadas — por isso qualquer ecrã que mostre um produto
 * deve passar por aqui. A principal é a que o servidor devolve primeiro na lista.
 */
export function urlImagemProduto(
  produto:
    | { imagemUrl?: string | null; imagens?: { url: string | null; isPrincipal?: boolean }[] }
    | null
    | undefined,
): string | undefined {
  if (!produto) return undefined;
  const galeria = produto.imagens ?? [];
  const principal = galeria.find((i) => i.isPrincipal && i.url) ?? galeria.find((i) => i.url);
  return principal?.url || produto.imagemUrl || undefined;
}
