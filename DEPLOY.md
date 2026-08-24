# Deploy no Vercel

## Configuração

| Campo | Valor |
|-------|-------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

### Variável de ambiente

```
VITE_API_URL=/api/v1
```

**Caminho relativo, não o endereço do Fly.** É o que faz os pedidos saírem para a
própria origem do Vercel, que depois os encaminha para a API (ver a secção do
`vercel.json`). Sem isto o login não funciona em iOS — explicado mais abaixo.

**Tem de incluir `/api/v1`** — é o prefixo global da API.

As variáveis `VITE_*` são substituídas **no momento do build**, não lidas em runtime.
Alterá-la exige um **novo deploy**; reiniciar não basta.

---

## O que o `vercel.json` faz

### Encaminhamento da API — e porque o iOS obriga a ele

```json
{ "source": "/api/:path*", "destination": "https://srg-controlcore-api.fly.dev/api/:path*" }
```

Os pedidos da aplicação saem para a **própria origem do Vercel**, e é o Vercel que
fala com o Fly pelo lado do servidor. O browser nunca vê o domínio da API.

Isto existe por causa dos cookies. A autenticação vive em cookies HttpOnly
(`accessToken` e `refreshToken`); sem encaminhamento, o frontend está em
`vercel.app` e a API em `fly.dev` — **domínios registáveis diferentes**, logo o
browser trata os cookies como sendo de terceiros.

O Safari no iOS bloqueia cookies de terceiros **por omissão**, através do ITP
(*Intelligent Tracking Prevention*). E no iOS a Apple obriga todos os browsers a
usar o WebKit, pelo que o Chrome e o Firefox no iPhone herdam o mesmo bloqueio —
o limite é o sistema operativo, não o browser.

O sintoma é enganador: o login **é** aceite, o servidor devolve os cookies, e o
Safari descarta-os. O pedido seguinte vai sem autenticação e dá 401. Parece que a
senha está errada, mas o que houve foi a sessão a desaparecer no instante seguinte.
Em Android e no desktop nunca se vê, porque o Chrome ainda aceita estes cookies.

Partilhando origem, os cookies passam a ser *first-party* e o ITP não tem o que
bloquear.

**A ordem das regras é o que faz isto funcionar.** A regra do SPA apanha qualquer
caminho sem extensão, e `/api/v1/auth/login` não tem extensão — se viesse primeiro,
os pedidos da API receberiam o `index.html` em vez de chegarem ao servidor. O
Vercel avalia os rewrites por ordem, portanto a regra da API tem de vir **antes**.

O `Cache-Control: no-store` em `/api/(.*)` impede que respostas da API sejam
guardadas na CDN — sem ele, a resposta de um utilizador poderia ser servida a outro.

### O custo, e o que o remove

Cada pedido passa a dar um salto extra (browser → Vercel → Fly): mais latência, e o
tráfego da API conta para a quota do Vercel. Vale a pena notar que isto trabalha
contra a escolha de pôr o backend em Frankfurt, ao lado do Neon, feita justamente
para cortar latência (ver `fly.toml` no repositório do servidor).

A solução definitiva é servir frontend e API em subdomínios do mesmo domínio
(`app.srg.co.mz` e `api.srg.co.mz`). Sendo o domínio registável o mesmo, os cookies
são *first-party* sem encaminhamento nenhum: o salto extra desaparece e o
`sameSite` pode voltar a `'lax'`, que é mais seguro que o `'none'` hoje necessário.
Quando isso estiver montado, **esta regra de rewrite deve ser removida** e a
`VITE_API_URL` volta a apontar para o endereço da API.


### SPA routing

```json
"source": "/((?!.*\\.).*)"
```

Qualquer caminho **sem extensão de ficheiro** serve o `index.html`, deixando o router
do React resolver. Sem isto, recarregar `/produtos` ou `/rh/salarios` devolve 404: o
Vercel procura um ficheiro nesse caminho.

O lookahead `(?!.*\.)` é o que impede a regra de interceptar ficheiros reais. Testado
contra os 8 caminhos que o build produz:

| Caminho | Resultado |
|---------|-----------|
| `/produtos`, `/rh/salarios`, `/armazens`, `/` | → `index.html` |
| `/favicon.svg`, `/icons.svg` | → ficheiro |
| `/assets/index-*.js`, `/assets/*.png` | → ficheiro |

### Cache

- **`assets/*` indefinidamente** — os nomes incluem hash do conteúdo
  (`index-Dgo5GcQ8.js`), pelo que nunca mudam sem mudar de nome.
- **`index.html` nunca** — é ele que aponta para os assets novos após cada deploy. Se
  fosse cacheado, o browser continuaria a carregar os assets antigos.

---

## Uma nota sobre comentários no `vercel.json`

O JSON não tem sintaxe de comentários, e o Vercel **valida o schema estritamente**:
propriedades desconhecidas fazem o deploy falhar com

```
Invalid request: `headers[0]` should NOT have additional property `//`
```

A convenção `"//": "explicação"`, que funciona em `package.json`, é rejeitada aqui.
Daí este ficheiro existir — as explicações vivem fora do JSON.

---

## Ordem de execução

1. **Backend no Fly.io primeiro** — precisas da URL dele. É ela que entra no
   `destination` do rewrite, em `vercel.json`.
2. Configura o Vercel com `VITE_API_URL=/api/v1` — **caminho relativo**, não a URL
   do Fly. É o rewrite que leva o pedido à API.
3. **Volta ao Fly** e põe a URL do Vercel em `CORS_ORIGINS`.

O passo 3 esquece-se facilmente. Com o encaminhamento activo os pedidos chegam à API
com origem do lado do servidor, pelo que o CORS deixa de ser o que trava o browser —
mas continua a ser necessário para os pedidos que ainda saiam directos (e para
qualquer ambiente de teste que aponte ao Fly sem passar pelo Vercel).

---

## Verificar depois do deploy

| O que | Como | Esperado |
|-------|------|----------|
| Build | logs do Vercel | sem erros de módulo não encontrado |
| API alcançável | abrir a aplicação | login carrega |
| **Login em iPhone** | entrar no Safari **e** no Chrome do iOS | entra e continua autenticado |
| **Cookies** | fazer login e recarregar | continua autenticado |
| Encaminhamento | Rede, no inspector | pedidos vão para o domínio do Vercel, não para `fly.dev` |
| SPA routing | ir a `/produtos` e recarregar | carrega, não dá 404 |

O teste em iPhone é o que não se pode dispensar, e tem de ser **num iPhone real** —
o Chrome ou o Safari em desktop não reproduzem o problema. No iOS todos os browsers
usam o WebKit, e é o WebKit que bloqueia cookies de terceiros; o Chrome de Android e
o de desktop aceitam-nos, pelo que passam o teste mesmo com a configuração errada.

O teste dos cookies falha de forma silenciosa — o login parece funcionar e só o
pedido seguinte revela o problema.

Detalhes do backend em `Docs/deploy.md`, no repositório do servidor.
