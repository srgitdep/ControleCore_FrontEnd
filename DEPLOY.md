# Deploy no Vercel

## Configuração

| Campo | Valor |
|-------|-------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

### Variável de ambiente

```
VITE_API_URL=https://srg-controlcore-api.fly.dev/api/v1
```

**Tem de incluir `/api/v1`** — é o prefixo global da API.

As variáveis `VITE_*` são substituídas **no momento do build**, não lidas em runtime.
Alterá-la exige um **novo deploy**; reiniciar não basta.

---

## O que o `vercel.json` faz

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

1. **Backend no Fly.io primeiro** — precisas da URL dele.
2. Configura o Vercel com `VITE_API_URL` a apontar para essa URL + `/api/v1`.
3. **Volta ao Fly** e põe a URL do Vercel em `CORS_ORIGINS`.

O passo 3 esquece-se facilmente, e sem ele o browser bloqueia todos os pedidos.

---

## Verificar depois do deploy

| O que | Como | Esperado |
|-------|------|----------|
| Build | logs do Vercel | sem erros de módulo não encontrado |
| API alcançável | abrir a aplicação | login carrega |
| **Cookies cross-site** | fazer login e recarregar | continua autenticado |
| SPA routing | ir a `/produtos` e recarregar | carrega, não dá 404 |
| CORS | consola do browser | sem erro de CORS |

O teste dos cookies é o mais importante: falha de forma silenciosa — o login parece
funcionar e só o pedido seguinte revela o problema.

Detalhes do backend em `Docs/deploy.md`, no repositório do servidor.
