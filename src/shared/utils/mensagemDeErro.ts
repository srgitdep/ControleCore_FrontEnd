/**
 * A mensagem legível de um erro vindo da API.
 *
 * ## Porque existe
 *
 * O `ValidationPipe` do NestJS devolve `message` como **array** quando falha mais do que
 * uma regra:
 *
 * ```json
 * { "message": ["lojaId should not be empty", "lojaId must be a UUID"] }
 * ```
 *
 * Passar isso a um toast dava, no ecrã do utilizador:
 *
 * ```
 * lojaIdshould not be emptylojaIdmust be a UUID
 * ```
 *
 * — as entradas coladas sem separador, o nome interno do campo à vista, e em inglês. Num
 * telemóvel, onde o toast tem duas linhas, era indecifrável.
 *
 * Havia 52 sítios a ler `error.response.data.message` directamente. Em vez de corrigir
 * cada um, a formatação passa a viver aqui.
 */

/** Junta as entradas numa frase legível, capitalizando cada uma. */
function juntar(entradas: string[]): string {
  const limpas = entradas
    .map((e) => String(e).trim())
    .filter(Boolean)
    .map((e) => e.charAt(0).toUpperCase() + e.slice(1));

  if (limpas.length === 0) return '';
  if (limpas.length === 1) return limpas[0];

  // Uma por linha: num toast estreito, uma frase longa com "e" no meio lê-se pior do que
  // uma lista curta.
  return limpas.join('\n');
}

/**
 * Extrai a mensagem de um erro do Axios, de um `Error`, ou de qualquer coisa.
 *
 * `alternativa` é o que se mostra quando não há nada de útil a dizer — deve ser uma frase
 * do domínio («Não foi possível criar o caixa.»), não um genérico «Erro».
 */
export function mensagemDeErro(erro: unknown, alternativa: string): string {
  const resposta = (erro as { response?: { data?: { message?: unknown } } })?.response;
  const bruta = resposta?.data?.message;

  if (Array.isArray(bruta)) {
    return juntar(bruta as string[]) || alternativa;
  }

  if (typeof bruta === 'string' && bruta.trim()) {
    return bruta.trim();
  }

  // Sem resposta do servidor: rede em baixo, pedido cancelado, ou erro lançado no
  // cliente. A mensagem do `Error` costuma ser técnica («Network Error»), pelo que a
  // alternativa do domínio é preferível — excepto quando não há alternativa nenhuma.
  if (!resposta && erro instanceof Error && !alternativa) {
    return erro.message;
  }

  return alternativa;
}
