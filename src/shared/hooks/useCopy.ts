import { useTranslation } from 'react-i18next';

import type ptSite from '@/locales/pt/site.json';

/**
 * O texto do sítio público, na língua activa.
 *
 * ## Porque está separado dos componentes
 *
 * O copy anterior estava misturado com os `import` das imagens, e o texto da entrada
 * (`LoginPage`) estava escrito à mão dentro do JSX — duas fontes de verdade: a promessa da
 * landing dizia uma coisa, o painel do login dizia outra, e ninguém notava. Aqui fica tudo
 * o que é **palavra** (em `locales/<língua>/site.json`); os componentes ficam com estrutura
 * e estilo.
 *
 * ## Porque devolve a árvore inteira e não um `t('chave')` por frase
 *
 * O copy tem arrays de objectos (módulos, dores, passos) que os componentes percorrem com
 * `.map`. Com `t(..., { returnObjects: true })` perdia-se o tipo; devolver o bundle do
 * namespace mantém a forma e o autocompletar do `COPY` original, e o `tsc` continua a
 * apanhar uma chave mal escrita. O inglês tem de ter a mesma forma — o teste de paridade
 * (`i18n/paridade.test.ts`) compara as chaves e o comprimento dos arrays.
 *
 * `useTranslation('site')` está aqui só para o componente re-renderizar quando a língua
 * muda: o bundle em si é lido directamente do i18next.
 *
 * ## O que foi corrigido ao mover (decisões que o texto deve continuar a respeitar)
 *
 * 1. **Moeda.** O cartão do herói mostrava `R$ 2.490,00` — real brasileiro, num sistema
 *    cujos valores são em meticais.
 * 2. **Português do Brasil.** «planilhas», «estoque», «PDV», «faturamento». O comprador é
 *    moçambicano e o resto do sistema está em português europeu.
 * 3. **Certificações inventadas.** `ISO 27001 · CERTIFICADO`, `SOC 2 TYPE II · CONFORME`,
 *    `GDPR/LGPD · PRONTO`. Nenhuma dessas auditorias existe. Não é exagero de marketing — é
 *    uma declaração falsa sobre uma auditoria que não houve, e num concurso público basta
 *    para desqualificar a proposta. Foram substituídas por `SEGURANCA`, que descreve o que
 *    o código faz de facto. Isto vale nas duas línguas.
 *
 * ## A regra que decide o que entra
 *
 * > Cada secção nomeia uma dor concreta e mostra a prova.
 *
 * Quem gere um supermercado não procura «gestão integrada» — procura porque fechou a caixa
 * com uma diferença que ninguém explica. Se uma secção não nomeia dor nem mostra prova, sai.
 * Por isso não há testemunhos nem logótipos de clientes: enquanto não houver cliente que
 * autorize, a secção não existe. Uma prova inventada é a coisa mais cara que se pode pôr
 * num sítio.
 *
 * ## Notas por campo (o porquê que estava junto às chaves)
 *
 * - `SITIO.NAV` — a ligação para `/loja` é o único link do site público para o Compra
 *   Fácil; sem ele, um cliente final só chega lá escrevendo o URL de cor.
 * - `SITIO.RODAPE.TELEFONE` / `NUIT` — «a confirmar» está assim de propósito. Inventar um
 *   NUIT ou um telefone é pior do que deixar o espaço à vista: um número errado num rodapé
 *   é uma chamada perdida e uma desconfiança ganha.
 * - `HEROI.TITULO_*` — o título nomeia o trabalho que desaparece, não a categoria («o ERP
 *   inteligente que impulsiona as suas operações» é o que todos dizem, e por isso não diz
 *   nada).
 * - `HEROI.BOTAO_CRIAR_CONTA` é o principal; `BOTAO_PRIMARIO` é a ligação secundária de
 *   quem já é cliente (o nome ficou porque está usado noutro sítio). Uma landing page existe
 *   para quem ainda não tem conta.
 * - `FAIXA` — não são números de resultado (não há clientes que os autorizem), são âmbitos:
 *   o que o sistema cobre, verificável contra o próprio produto.
 * - `OPERACAO` — os módulos não são sete produtos, são sete pontos do mesmo movimento.
 * - `MODULOS` — o texto anterior descrevia funcionalidades que o sistema não tem
 *   («contingência offline automática», «emissão fiscal NFC-e», «programas de
 *   recompensa»). Prometer o que não existe transfere o problema para a demonstração, onde
 *   custa a venda inteira: cada descrição corresponde a comportamento implementado.
 * - `MAYRA` — o que distingue a Mayra de uma caixa de conversa é a confirmação antes de
 *   escrever; vender IA sem explicar isto assusta exactamente o comprador que decide. A
 *   conversa desenhada é exemplo, e `CONVERSA.ROTULO` di-lo.
 * - `SEGURANCA` — cada item é um comportamento que existe no código e que se pode
 *   demonstrar num ecrã; é a única versão que sobrevive a alguém perguntar «mostre-me».
 * - `COMECAR` — está onde normalmente vão os testemunhos e responde à pergunta que vem
 *   logo a seguir ao interesse: «e agora, quanto tempo até funcionar?».
 * - `FECHO.BOTAO_SECUNDARIO` — era «Já tenho conta» e levava ao login; passou a levar ao
 *   registo e o texto tinha de acompanhar.
 * - `OUTROS` — texto que estava solto no JSX (aria-labels, o preçário da landing, a frase
 *   de confirmação da Mayra). `VALOR_MENSAL` existe porque o metical
 *   escreve-se `6 500 MT` em português e `MT 6,500` em inglês (o número vem de `formatInteiro`).
 */
export function useCopy(): typeof ptSite {
  const { i18n } = useTranslation('site');
  const lingua = (i18n.resolvedLanguage ?? 'pt') as string;
  return i18n.getResourceBundle(lingua, 'site') as typeof ptSite;
}
