#!/usr/bin/env node
/**
 * Liberta os portos de desenvolvimento deste projecto antes de arrancar.
 *
 * ## O problema que resolve
 *
 * `npm run dev` falhava com `EADDRINUSE` sempre que um servidor de desenvolvimento anterior
 * ficava para trás — o que acontece a cada terminal fechado sem `Ctrl+C`, a cada reinício
 * feito na pressa, e a cada segundo `npm run dev` aberto por distracção. O diagnóstico é
 * sempre o mesmo e leva sempre cinco minutos: descobrir o PID, confirmar que é nosso, matar.
 *
 * Corre como `predev`, pelo que o npm o executa sozinho. Não há nada a decorar.
 *
 * ## Porque não `strictPort: false`
 *
 * Porque o porto **não pode** mudar. A lista de CORS do backend é explícita —
 * `localhost:5273`, `5173`, `3001`, `5174` — e `eRedeLocalDeDesenvolvimento` só autoriza
 * endereços IP privados, não `localhost`. Com o Vite em 5274, a página carregava e **todos**
 * os pedidos à API falhavam em CORS: ecrãs vazios, sem erro visível, e uma tarde a perceber
 * porquê.
 *
 * Entre um erro claro no arranque e uma aplicação meio funcional, o erro claro é melhor. E
 * entre o erro claro e não haver erro nenhum, este script.
 *
 * ## O que NUNCA faz
 *
 * Não mata nada que não seja deste projecto. A verificação é a linha de comando do processo
 * conter o caminho desta pasta — o Vite deste projecto tem-no, o Vite do IndustryCore não, e
 * um serviço qualquer que por acaso esteja no mesmo porto também não.
 *
 * Quando o porto está tomado por algo que não é nosso, **desiste e explica** em vez de
 * matar. Um script de conveniência que mate o Postgres de alguém não é conveniência.
 *
 * ## Uso
 *
 *   node scripts/libertar-porto.mjs             # usa VITE_PORT, ou 5273
 *   node scripts/libertar-porto.mjs 5273 --dry  # só mostra o que faria
 *   node scripts/libertar-porto.mjs --force     # mata mesmo sem provar que é nosso
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { platform } from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const simulacao = args.includes('--dry');

/**
 * Mata o ocupante mesmo quando não se consegue provar que é deste projecto.
 *
 * Existe para o caso residual em que a linha de comando não dá nenhuma pista utilizável —
 * um processo relançado por um supervisor que já morreu, por exemplo. É deliberadamente
 * uma opção e não o comportamento por omissão: quem a escreve assume o que faz.
 */
const forcar = args.includes('--force');
const explicitos = args.filter((a) => /^\d+$/.test(a)).map(Number);

/**
 * O porto por omissão vem do ambiente, e é o mesmo que o servidor vai usar.
 *
 * Sem isto o número ficaria escrito em dois sítios — aqui e na configuração do servidor — e
 * quem mudasse um deixaria o outro atrás: o script libertaria um porto que ninguém usa, e o
 * arranque falharia noutro. Ler a mesma variável garante que os dois concordam sempre.
 *
 * `PORT_DEV` existe para o caso raro de se querer libertar um porto diferente daquele em que
 * o servidor arranca; na prática nunca é preciso.
 */
const portos =
  explicitos.length > 0
    ? explicitos
    : [Number(process.env.PORT_DEV ?? process.env.VITE_PORT ?? 5273)];

if (portos.some((p) => !Number.isInteger(p) || p <= 0 || p > 65535)) {
  console.error('Porto inválido. Uso: node scripts/libertar-porto.mjs [<porto>…] [--dry]');
  process.exit(2);
}

const raiz = path.resolve(process.cwd());
const raizNormalizada = normalizar(raiz);
const eWindows = platform() === 'win32';

/**
 * Caminhos comparáveis entre o que o Node reporta e o que o sistema operativo mostra.
 *
 * O Windows mistura `\` com `/` na mesma linha de comando — o Vite aparece como
 * `node_modules\.bin\\..\vite\bin\vite.js` — e a letra da unidade tanto vem `D:` como `d:`.
 * Sem normalizar, a verificação de pertença ao projecto falharia e o script recusaria matar
 * o seu próprio servidor.
 */
function normalizar(p) {
  return p.replace(/\\/g, '/').replace(/\/+/g, '/').toLowerCase();
}

/** Os PIDs a escutar num porto. */
function quemEscuta(porto) {
  try {
    if (eWindows) {
      const saida = execFileSync(
        'netstat',
        ['-ano', '-p', 'TCP'],
        { encoding: 'utf8', windowsHide: true },
      );

      const pids = new Set();
      for (const linha of saida.split(/\r?\n/)) {
        // `TCP    0.0.0.0:5273    0.0.0.0:0    LISTENING    26728`
        // Também `[::]:5273`. O `:porto` tem de estar no endereço **local**, que é a
        // segunda coluna — procurá-lo na linha inteira apanharia uma ligação de saída
        // para esse porto noutra máquina.
        const campos = linha.trim().split(/\s+/);
        if (campos.length < 5 || campos[3] !== 'LISTENING') continue;
        if (!campos[1].endsWith(`:${porto}`)) continue;
        const pid = Number(campos[4]);
        if (Number.isInteger(pid) && pid > 0) pids.add(pid);
      }
      return [...pids];
    }

    const saida = execFileSync(
      'lsof',
      ['-nP', `-iTCP:${porto}`, '-sTCP:LISTEN', '-t'],
      { encoding: 'utf8' },
    );
    return saida
      .split(/\s+/)
      .map(Number)
      .filter((p) => Number.isInteger(p) && p > 0);
  } catch {
    // `netstat` sem resultados, ou `lsof` ausente/sem correspondência. Nos dois casos a
    // conclusão útil é a mesma: não se encontrou ninguém.
    return [];
  }
}

/** A linha de comando de um PID, ou string vazia se não se conseguir ler. */
function linhaDeComando(pid) {
  try {
    if (eWindows) {
      // PowerShell e não `wmic`: o `wmic` está descontinuado e já não vem instalado nas
      // versões recentes do Windows.
      const saida = execFileSync(
        'powershell.exe',
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          `(Get-CimInstance Win32_Process -Filter "ProcessId=${pid}" -ErrorAction SilentlyContinue).CommandLine`,
        ],
        { encoding: 'utf8', windowsHide: true },
      );
      return saida.trim();
    }

    return execFileSync('ps', ['-p', String(pid), '-o', 'command='], {
      encoding: 'utf8',
    }).trim();
  } catch {
    return '';
  }
}

/**
 * Se um processo pertence a este projecto.
 *
 * ## Duas formas de o provar, e a segunda é a que faltava
 *
 * **Caminho absoluto na linha de comando.** É o caso do que os supervisores lançam: o
 * `nest` e o `vite` aparecem com o caminho completo, e a comparação directa resolve.
 *
 * **Caminho relativo que aponta para dentro daqui.** É o caso de quem arranca à mão —
 * `node dist/src/main` — e era o falso positivo: a linha de comando não contém o caminho
 * da pasta, e o script recusava matar o seu próprio servidor, a pedir ao utilizador para o
 * fechar à mão.
 *
 * A segunda prova é discriminante e não uma suposição: `dist/src/main` resolvido contra
 * esta pasta tem de apontar para um ficheiro que **existe aqui**. O `dist/main` do
 * IndustryCore resolvido contra esta pasta não existe, e continua a ser recusado — que é
 * exactamente o comportamento que se quer.
 */
function eDesteProjecto(cmd) {
  if (!cmd || cmd.length === 0) return false;
  if (normalizar(cmd).includes(raizNormalizada)) return true;
  return argumentosDeCaminho(cmd).some(apontaParaDentroDoProjecto);
}

/** Os argumentos da linha de comando que se parecem com caminhos. */
function argumentosDeCaminho(cmd) {
  const tokens = cmd.match(/"[^"]+"|\S+/g) ?? [];

  return tokens
    // O primeiro token é o executável (`node.exe`), que nunca é do projecto.
    .slice(1)
    .map((t) => t.replace(/^"|"$/g, ''))
    .filter((t) => !t.startsWith('-'))
    .filter((t) => /[/\\]/.test(t) || /\.(js|mjs|cjs)$/.test(t));
}

function apontaParaDentroDoProjecto(rel) {
  // Os absolutos já foram cobertos pela comparação directa; aqui só interessam os
  // relativos, que é o que um arranque à mão produz.
  if (path.isAbsolute(rel)) return false;

  const alvo = path.resolve(raiz, rel);

  // Um `../` que saia do projecto não conta como nosso, por muito que exista.
  if (!normalizar(alvo).startsWith(raizNormalizada + '/')) return false;

  // O Node aceita `dist/src/main` para `main.js`; a verificação tem de aceitar o mesmo.
  return [alvo, alvo + '.js', alvo + '.mjs', alvo + '.cjs'].some((c) => {
    try {
      return fs.existsSync(c);
    } catch {
      return false;
    }
  });
}

/**
 * Os supervisores de desenvolvimento deste projecto que ficaram para trás.
 *
 * Matar quem segura o porto não basta: um `vite` ou um `nest --watch` esquecido volta a
 * arrancar sozinho na alteração seguinte e rouba o porto outra vez — foi exactamente o que
 * aconteceu com dois `nest --watch` a competir pelo 3100.
 *
 * Corre **antes** de o novo servidor arrancar, pelo que não há nenhum supervisor legítimo
 * para poupar.
 */
function supervisoresEsquecidos() {
  const PADROES = [
    '/vite/bin/vite.js',
    '/@nestjs/cli/bin/nest.js',
    '/dist/src/main',
    '/dist/main',
  ];

  try {
    if (eWindows) {
      const saida = execFileSync(
        'powershell.exe',
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId)|$($_.CommandLine)\" }",
        ],
        { encoding: 'utf8', windowsHide: true, maxBuffer: 8 * 1024 * 1024 },
      );

      return saida
        .split(/\r?\n/)
        .map((l) => {
          const i = l.indexOf('|');
          return i === -1 ? null : { pid: Number(l.slice(0, i)), cmd: l.slice(i + 1) };
        })
        .filter((x) => x && Number.isInteger(x.pid))
        .filter((x) => eDesteProjecto(x.cmd))
        .filter((x) => PADROES.some((p) => normalizar(x.cmd).includes(p)));
    }

    const saida = execFileSync('ps', ['-eo', 'pid=,command='], {
      encoding: 'utf8',
      maxBuffer: 8 * 1024 * 1024,
    });

    return saida
      .split('\n')
      .map((l) => {
        const m = /^\s*(\d+)\s+(.*)$/.exec(l);
        return m ? { pid: Number(m[1]), cmd: m[2] } : null;
      })
      .filter(Boolean)
      .filter((x) => eDesteProjecto(x.cmd))
      .filter((x) => PADROES.some((p) => normalizar(x.cmd).includes(p)));
  } catch {
    return [];
  }
}

function matar(pid) {
  try {
    process.kill(pid, 'SIGKILL');
    return true;
  } catch {
    // Já morreu entre a leitura e o sinal, ou não temos permissão. Nos dois casos não há
    // nada a fazer aqui — o arranque a seguir dirá se o porto continua tomado.
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════

// Nunca a si próprio nem ao npm que o lançou.
const proprios = new Set([process.pid, process.ppid].filter(Boolean));

const paraMatar = new Map(); // pid → motivo
let recusado = false;

for (const porto of portos) {
  for (const pid of quemEscuta(porto)) {
    if (proprios.has(pid)) continue;

    const cmd = linhaDeComando(pid);

    if (!eDesteProjecto(cmd) && !forcar) {
      console.error(
        `\n✗  O porto ${porto} está tomado por um processo que NÃO é deste projecto:\n` +
          `   PID ${pid}${cmd ? `  ${cmd.slice(0, 140)}` : '  (linha de comando ilegível)'}\n\n` +
          '   Não o mato: pode ser outro serviço seu. Feche-o à mão, ou force com\n' +
          '   npm run porto:libertar -- --force  (se souber que é seu), ou mude o porto com\n' +
          `   VITE_PORT — mas note que a lista de CORS do backend tem de conhecer o porto novo.\n`,
      );
      recusado = true;
      continue;
    }

    paraMatar.set(pid, `segurava o porto ${porto}`);
  }
}

for (const { pid, cmd } of supervisoresEsquecidos()) {
  if (proprios.has(pid) || paraMatar.has(pid)) continue;
  paraMatar.set(pid, `supervisor esquecido — ${resumo(cmd)}`);
}

function resumo(cmd) {
  // As aspas e o espaço final que o Windows põe na linha de comando impediam a expressão de
  // casar, e a mensagem ficava com noventa caracteres de caminho onde devia estar «vite.js».
  const limpo = cmd.trim().replace(/["']/g, '').replace(/\s+$/, '');
  const m = /([^/\\]+\.js|main)$/.exec(limpo);
  if (m) return m[1];

  // Sem correspondência, o último segmento do caminho diz mais do que os primeiros sessenta
  // caracteres — que em Windows são quase todos a unidade e as pastas do projecto.
  const segmentos = limpo.split(/[/\\]/).filter(Boolean);
  return segmentos.length > 0 ? segmentos[segmentos.length - 1] : limpo.slice(0, 60);
}

if (paraMatar.size === 0) {
  if (!recusado) console.log(`✓  Portos livres: ${portos.join(', ')}`);
  process.exit(recusado ? 1 : 0);
}

for (const [pid, motivo] of paraMatar) {
  if (simulacao) {
    console.log(`○  mataria PID ${pid} — ${motivo}`);
    continue;
  }
  const ok = matar(pid);
  console.log(`${ok ? '✓' : '·'}  PID ${pid} — ${motivo}${ok ? '' : ' (já não existia)'}`);
}

if (simulacao) process.exit(recusado ? 1 : 0);

// O sistema operativo leva um instante a libertar o socket depois de o processo morrer.
// Sem esta pausa, o Vite arranca demasiado cedo e volta a ver `EADDRINUSE` — o que faria
// este script parecer não funcionar de forma intermitente, que é pior do que não existir.
await new Promise((r) => setTimeout(r, 600));

const aindaTomados = portos.filter((p) => quemEscuta(p).length > 0);

if (aindaTomados.length > 0) {
  console.error(`\n✗  Ainda tomados: ${aindaTomados.join(', ')}. Verifique à mão.\n`);
  process.exit(1);
}

console.log(`✓  Portos livres: ${portos.join(', ')}`);
process.exit(recusado ? 1 : 0);
