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

/** O que decide o endereço do WebSocket. Tudo injectado, para a função ser pura. */
export interface ContextoDoSocket {
  /** `VITE_API_URL`. Em produção é um caminho relativo (`/api/v1`). */
  apiUrl?: string;
  /** `VITE_SOCKET_URL`: o endereço directo da API, quando o REST vai por caminho. */
  socketUrl?: string;
  /** `window.location.origin`. */
  origem: string;
  /** `window.location.protocol`. */
  protocolo: string;
  /** `window.location.hostname`. */
  anfitriao: string;
  /** `VITE_API_PORT`. */
  porta: string;
  /** `import.meta.env.PROD`. */
  producao: boolean;
}

export interface EnderecoDoSocket {
  /** O endereço a passar ao Socket.io. */
  endereco: string;
  /**
   * Preenchido quando o endereço escolhido é o último recurso e há razão para crer que
   * não vai funcionar. Serve para dizer ao utilizador o que falta configurar, em vez de
   * o deixar a olhar para «A ligar…» sem explicação.
   */
  avisoDeConfiguracao: string | null;
}

/**
 * Onde o Socket.io se deve ligar.
 *
 * ## Porquê uma função à parte
 *
 * O endereço do WebSocket **não** segue a mesma regra do REST, e essa diferença já
 * custou a funcionalidade de voz da Mayra em produção.
 *
 * Os pedidos REST saem por caminho relativo (`/api/v1`) de propósito: o `vercel.json`
 * encaminha-os para a API, e assim os cookies contam como *first-party* — sem isso o
 * login não sobrevive num iPhone. Mas **os `rewrites` do Vercel não encaminham
 * WebSockets**. Um socket apontado à origem da página nunca chega à API: fica pendurado
 * no handshake, e o ecrã da voz mostra «A ligar…» indefinidamente.
 *
 * `VITE_SOCKET_URL` existe exactamente para esse caso — dá o endereço directo da API
 * quando o REST vai por caminho relativo. O `useSocket` já a lia; o hook da voz era uma
 * cópia mais antiga da mesma lógica e ignorava-a, pelo que definir a variável não
 * chegava para reparar a voz. Com a decisão num sítio só, as duas não podem voltar a
 * divergir.
 */
export function resolverEnderecoDoSocket(ctx: ContextoDoSocket): EnderecoDoSocket {
  // 1. O endereço directo manda sempre: foi posto lá precisamente para isto.
  if (ctx.socketUrl) {
    return { endereco: ctx.socketUrl.replace(/\/$/, ''), avisoDeConfiguracao: null };
  }

  if (ctx.apiUrl) {
    // 2. Caminho relativo: não há daqui como chegar à API. Em produção sabe-se que a
    //    origem não encaminha WebSockets, e o socket vai falhar — o aviso diz porquê.
    if (ctx.apiUrl.startsWith('/')) {
      return {
        endereco: ctx.origem,
        avisoDeConfiguracao: ctx.producao
          ? 'VITE_API_URL é um caminho relativo e VITE_SOCKET_URL não está definida. ' +
            'Os rewrites do Vercel não encaminham WebSockets: defina VITE_SOCKET_URL ' +
            'com o endereço directo da API e volte a publicar.'
          : null,
      };
    }

    // 3. Endereço absoluto: tira-se o prefixo da API para sobrar o domínio, que é o que
    //    o Socket.io quer. A remoção é ancorada ao fim de propósito — um `replace('/api')`
    //    não ancorado apanharia o `//api` de `https://api.exemplo.com` e produziria um
    //    endereço corrompido.
    return {
      endereco: ctx.apiUrl.replace(/\/$/, '').replace(/\/api(\/v\d+)?$/, ''),
      avisoDeConfiguracao: null,
    };
  }

  // 4. Sem variáveis: deduz-se do anfitrião que serve a página, e não de `localhost`. É
  //    o que permite abrir o sistema no telemóvel contra o computador da mesma rede.
  return {
    endereco: `${ctx.protocolo}//${ctx.anfitriao}:${ctx.porta}`,
    avisoDeConfiguracao: null,
  };
}
