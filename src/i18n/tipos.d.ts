import 'i18next';
import type comum from '../locales/pt/comum.json';
import type loja from '../locales/pt/loja.json';
import type auth from '../locales/pt/auth.json';
import type portal from '../locales/pt/portal.json';
import type mercado from '../locales/pt/mercado.json';
import type site from '../locales/pt/site.json';
import type precos from '../locales/pt/precos.json';
import type adesao from '../locales/pt/adesao.json';
import type pos from '../locales/pt/pos.json';
import type stock from '../locales/pt/stock.json';
import type armazens from '../locales/pt/armazens.json';
import type transferencias from '../locales/pt/transferencias.json';
import type compras from '../locales/pt/compras.json';
import type conferencia from '../locales/pt/conferencia.json';
import type crm from '../locales/pt/crm.json';
import type rh from '../locales/pt/rh.json';
import type financeiro from '../locales/pt/financeiro.json';
import type fornecedores from '../locales/pt/fornecedores.json';
import type b2b from '../locales/pt/b2b.json';
import type catalogo from '../locales/pt/catalogo.json';
import type produtos from '../locales/pt/produtos.json';
import type lojas from '../locales/pt/lojas.json';
import type empresas from '../locales/pt/empresas.json';
import type utilizadores from '../locales/pt/utilizadores.json';
import type modulos from '../locales/pt/modulos.json';
import type necessidades from '../locales/pt/necessidades.json';
import type painel from '../locales/pt/painel.json';
import type historico from '../locales/pt/historico.json';
import type pesquisa from '../locales/pt/pesquisa.json';
import type lojaGestao from '../locales/pt/lojaGestao.json';
import type copiloto from '../locales/pt/copiloto.json';
import type shell from '../locales/pt/shell.json';
import type promocoes from '../locales/pt/promocoes.json';

// As chaves do `t()` passam a ser verificadas pelo `tsc` contra o catálogo português, que
// é a língua de origem: uma chave mal escrita é erro de compilação, e não um texto em
// falta que só se vê no ecrã. Cada namespace novo entra aqui.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'comum';
    resources: {
      comum: typeof comum;
      loja: typeof loja;
      auth: typeof auth;
      portal: typeof portal;
      mercado: typeof mercado;
      site: typeof site;
      precos: typeof precos;
      adesao: typeof adesao;
      pos: typeof pos;
      stock: typeof stock;
      armazens: typeof armazens;
      transferencias: typeof transferencias;
      compras: typeof compras;
      conferencia: typeof conferencia;
      crm: typeof crm;
      rh: typeof rh;
      financeiro: typeof financeiro;
      fornecedores: typeof fornecedores;
      b2b: typeof b2b;
      catalogo: typeof catalogo;
      produtos: typeof produtos;
      lojas: typeof lojas;
      empresas: typeof empresas;
      utilizadores: typeof utilizadores;
      modulos: typeof modulos;
      necessidades: typeof necessidades;
      painel: typeof painel;
      historico: typeof historico;
      pesquisa: typeof pesquisa;
      lojaGestao: typeof lojaGestao;
      copiloto: typeof copiloto;
      shell: typeof shell;
      promocoes: typeof promocoes;
    };
  }
}
