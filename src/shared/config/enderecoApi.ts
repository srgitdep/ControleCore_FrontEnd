/**
 * Como se decide o endereço da API — e porque não é só ler uma variável.
 *
 * A autenticação vive em cookies HttpOnly. Se a página é servida de um sítio e a API
 * responde noutro, esses cookies são **de terceiros**, e o Safari no iOS descarta-os por
 * omissão através do ITP. Como a Apple obriga todos os browsers do iOS a usar o WebKit,
 * o Chrome e o Firefox no iPhone herdam o mesmo bloqueio: o limite é o sistema
 * operativo, não o browser.
 *
 * O sintoma engana: o login **é** aceite, o servidor devolve os cookies, e o browser
 * descarta-os. O pedido seguinte vai sem autenticação, recebe 401, e o interceptor
 * reencaminha para `/login` — a sessão cai poucos segundos depois de entrar.
 *
 * O `vercel.json` encaminha `/api/*` para a API, o que resolve o problema: os pedidos
 * saem para a própria origem e os cookies voltam a ser *first-party*. Mas isso só
 * acontece se o endereço configurado for relativo, e essa variável vive no painel do
 * Vercel — fora deste repositório. Ficou a apontar para o domínio da API depois de o
 * encaminhamento passar a existir, e o iOS continuou a falhar sem nada no código que o
 * explicasse.
 *
 * Daí estas funções: em produção, um endereço que aponte para outro sítio é reduzido ao
 * seu caminho, e o encaminhamento faz o resto. Uma variável mal configurada deixa de
 * poder quebrar o login.
 */

/**
 * Aproxima a pergunta «o browser trata estes dois anfitriões como o mesmo sítio?», que é
 * o que decide se um cookie conta como *first-party*.
 *
 * A resposta exacta exige a Public Suffix List, que não justifica uma dependência aqui.
 * Compara-se o sufixo comum, exigindo pelo menos três etiquetas: `api.srg.co.mz` e
 * `app.srg.co.mz` partilham `srg.co.mz` e são o mesmo sítio, enquanto `a.vercel.app` e
 * `b.vercel.app` partilham apenas `vercel.app` — um sufixo público — e não são.
 *
 * A comparação é deliberadamente conservadora. Errar por defeito custa um salto de rede
 * desnecessário; errar por excesso custaria a sessão.
 */
export function mesmoSitio(a: string, b: string): boolean {
  if (a === b) return true;

  const eA = a.split('.');
  const eB = b.split('.');

  let comuns = 0;
  while (
    comuns < eA.length &&
    comuns < eB.length &&
    eA[eA.length - 1 - comuns] === eB[eB.length - 1 - comuns]
  ) {
    comuns++;
  }

  return comuns >= 3;
}

/**
 * Reduz um endereço absoluto ao seu caminho quando aponta para outro sítio; devolve-o
 * intacto quando já é relativo, quando é do mesmo sítio, ou quando não é um URL válido.
 *
 * O último caso é intencional: uma variável mal preenchida deve degradar-se, não rebentar
 * ao importar o módulo. Já houve um ecrã em branco neste projecto por um `replace` sobre
 * `undefined` no topo de um ficheiro de configuração.
 */
export function reduzirParaCaminhoSeOutroSitio(
  configurado: string,
  hostnameDaPagina: string,
): string {
  if (configurado.startsWith('/')) return configurado;

  try {
    const alvo = new URL(configurado);
    if (mesmoSitio(alvo.hostname, hostnameDaPagina)) return configurado;
    return alvo.pathname.replace(/\/$/, '') || '/api/v1';
  } catch {
    return configurado;
  }
}
