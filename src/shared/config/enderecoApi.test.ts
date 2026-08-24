import { describe, it, expect } from 'vitest';
import { mesmoSitio, reduzirParaCaminhoSeOutroSitio } from './enderecoApi';

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
