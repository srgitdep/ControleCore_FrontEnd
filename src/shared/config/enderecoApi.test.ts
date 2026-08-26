import { describe, it, expect } from 'vitest';
import { mesmoSitio, reduzirParaCaminhoSeOutroSitio, resolverEnderecoDoSocket } from './enderecoApi';

/**
 * Estes testes existem por causa de uma falha que só aparecia em iPhone.
 *
 * A autenticação vive em cookies HttpOnly. Com a página em `vercel.app` e a API em
 * `fly.dev`, esses cookies são de terceiros, e o WebKit descarta-os — pelo que o login
 * era aceite e a sessão caía segundos depois. O `vercel.json` passou a encaminhar
 * `/api/*` para a API, o que resolve o problema desde que os pedidos saiam por caminho
 * relativo; mas isso dependia de uma variável configurada à mão no painel do Vercel,
 * que ficou a apontar para `fly.dev`. O sintoma manteve-se sem nada no código a
 * explicá-lo.
 *
 * Daí a redução, e daí estes testes: o caso que falhou em produção está aqui fixado.
 */
describe('mesmoSitio', () => {
  it('reconhece o anfitrião idêntico', () => {
    expect(mesmoSitio('app.srg.co.mz', 'app.srg.co.mz')).toBe(true);
  });

  it('reconhece subdomínios de um domínio próprio', () => {
    // O destino da Opção B: aqui os cookies já são first-party e o pedido deve ir
    // directo, sem o salto pelo encaminhamento.
    expect(mesmoSitio('api.srg.co.mz', 'app.srg.co.mz')).toBe(true);
  });

  it('NÃO trata subdomínios de um alojamento partilhado como o mesmo sítio', () => {
    // O caso que interessa apanhar: `vercel.app` e `fly.dev` são sufixos públicos, e
    // dois subdomínios seus são sítios diferentes para efeitos de cookies.
    expect(mesmoSitio('a.vercel.app', 'b.vercel.app')).toBe(false);
    expect(mesmoSitio('srg-controlcore-api.fly.dev', 'controle-core-front-end.vercel.app')).toBe(false);
  });
});

describe('reduzirParaCaminhoSeOutroSitio', () => {
  const PAGINA = 'controle-core-front-end.vercel.app';

  it('reduz o endereço do Fly a caminho relativo — o caso que quebrou o iOS', () => {
    expect(
      reduzirParaCaminhoSeOutroSitio('https://srg-controlcore-api.fly.dev/api/v1', PAGINA),
    ).toBe('/api/v1');
  });

  it('deixa um caminho relativo intacto', () => {
    expect(reduzirParaCaminhoSeOutroSitio('/api/v1', PAGINA)).toBe('/api/v1');
  });

  it('deixa intacto um endereço do mesmo sítio', () => {
    // Não há nada a ganhar em encaminhar o que já é first-party — só latência.
    expect(
      reduzirParaCaminhoSeOutroSitio('https://api.srg.co.mz/api/v1', 'app.srg.co.mz'),
    ).toBe('https://api.srg.co.mz/api/v1');
  });

  it('devolve um valor inválido como está, em vez de lançar', () => {
    // Uma variável mal preenchida deve degradar-se, não rebentar ao importar o módulo:
    // já houve um ecrã em branco por causa de um `replace` sobre `undefined` aqui.
    expect(reduzirParaCaminhoSeOutroSitio('nao-e-um-url', PAGINA)).toBe('nao-e-um-url');
  });

  it('assume /api/v1 quando o endereço não tem caminho', () => {
    expect(reduzirParaCaminhoSeOutroSitio('https://srg-controlcore-api.fly.dev', PAGINA)).toBe(
      '/api/v1',
    );
  });
});

/**
 * Estes testes existem por causa da voz da Mayra a ficar em «A ligar…» para sempre.
 *
 * O REST sai por caminho relativo para os cookies serem *first-party* no iOS; o
 * WebSocket não pode seguir a mesma regra, porque os `rewrites` do Vercel não
 * encaminham WebSockets. O hook da voz tinha uma cópia própria da lógica que ignorava
 * `VITE_SOCKET_URL`, e o socket ia parar à origem da página, onde ninguém responde.
 */
describe('resolverEnderecoDoSocket', () => {
  const base = {
    origem: 'https://app.vercel.app',
    protocolo: 'https:',
    anfitriao: 'app.vercel.app',
    porta: '3100',
    producao: true,
  };

  it('usa VITE_SOCKET_URL quando existe, mesmo com o REST por caminho relativo', () => {
    // A combinação real de produção: REST por `/api/v1`, socket directo para o Fly.
    const r = resolverEnderecoDoSocket({
      ...base,
      apiUrl: '/api/v1',
      socketUrl: 'https://srg-controlcore-api.fly.dev',
    });
    expect(r.endereco).toBe('https://srg-controlcore-api.fly.dev');
    expect(r.avisoDeConfiguracao).toBeNull();
  });

  it('avisa quando o REST é relativo e não há endereço directo', () => {
    // O caso que partiu a voz. O endereço devolvido continua a ser a origem — há
    // alojamentos que encaminham WebSockets — mas o aviso diz o que falta, para o ecrã
    // não ficar em «A ligar…» sem explicação.
    const r = resolverEnderecoDoSocket({ ...base, apiUrl: '/api/v1' });
    expect(r.endereco).toBe('https://app.vercel.app');
    expect(r.avisoDeConfiguracao).toContain('VITE_SOCKET_URL');
  });

  it('não avisa fora de produção', () => {
    const r = resolverEnderecoDoSocket({ ...base, apiUrl: '/api/v1', producao: false });
    expect(r.avisoDeConfiguracao).toBeNull();
  });

  it('tira o prefixo da API de um endereço absoluto sem corromper o domínio', () => {
    // A remoção tem de ser ancorada ao fim: um `replace('/api', '')` não ancorado
    // apanharia o `//api` de `https://api.exemplo.com` e devolveria `https:/.exemplo.com`.
    expect(
      resolverEnderecoDoSocket({ ...base, apiUrl: 'https://api.exemplo.com/api/v1' }).endereco,
    ).toBe('https://api.exemplo.com');
    expect(
      resolverEnderecoDoSocket({ ...base, apiUrl: 'https://srg.fly.dev/api/v1/' }).endereco,
    ).toBe('https://srg.fly.dev');
    expect(
      resolverEnderecoDoSocket({ ...base, apiUrl: 'https://srg.fly.dev/api' }).endereco,
    ).toBe('https://srg.fly.dev');
  });

  it('sem variáveis, deduz do anfitrião que serve a página', () => {
    // O que permite abrir o sistema no telemóvel: `localhost` fixo apontaria ao próprio
    // telemóvel, que não tem API a correr.
    const r = resolverEnderecoDoSocket({
      origem: 'http://192.168.1.20:5273',
      protocolo: 'http:',
      anfitriao: '192.168.1.20',
      porta: '3100',
      producao: false,
    });
    expect(r.endereco).toBe('http://192.168.1.20:3100');
  });
});
