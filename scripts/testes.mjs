/**
 * Arranca o Vitest com a raiz do projecto sempre escrita da mesma maneira.
 *
 * ## Porquê
 *
 * No Windows a mesma pasta pode ser escrita com a letra da unidade em minúscula ou em
 * maiúscula (`d:\…` e `D:\…`), e ambas funcionam em toda a parte — menos aqui. O Node
 * resolve os módulos pelo caminho literal, pelo que `d:/…/node_modules/vitest` e
 * `D:/…/node_modules/vitest` são **dois módulos diferentes**, cada um com o seu estado.
 *
 * Quando o Vitest arranca a partir da forma minúscula, o ficheiro de teste acaba a
 * importar uma dessas cópias enquanto o colector inicializa a outra. O `describe` corre
 * sem runner e **todos** os ficheiros falham na primeira linha, sempre com a mesma
 * mensagem e sem um único teste a correr:
 *
 *     TypeError: Cannot read properties of undefined (reading 'config')
 *
 * Não é um teste partido: é a suite inteira a nunca chegar a arrancar. E depende apenas
 * de como a consola escreveu o `cd` — o que torna a falha intermitente entre máquinas e
 * difícil de atribuir à causa certa.
 *
 * Este arranque normaliza a letra da unidade antes de entregar o trabalho ao Vitest, para
 * que o resultado não dependa de quem escreveu o caminho.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const normalizada = /^[a-z]:/.test(raiz)
  ? raiz[0].toUpperCase() + raiz.slice(1)
  : raiz;

const vitest = path.join(normalizada, 'node_modules', 'vitest', 'vitest.mjs');

const processo = spawn(
  process.execPath,
  [vitest, ...process.argv.slice(2)],
  { cwd: normalizada, stdio: 'inherit' },
);

processo.on('exit', (codigo, sinal) => {
  if (sinal) process.kill(process.pid, sinal);
  else process.exit(codigo ?? 1);
});
