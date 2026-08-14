/**
 * Deteccção do idioma de uma frase, para a síntese de voz.
 *
 * ## Porque não se usa uma biblioteca
 *
 * A pergunta aqui não é «que língua é esta?» entre as seis mil que existem — é «leio
 * isto com fonética portuguesa ou inglesa?». São duas opções, e a resposta errada
 * torna a frase incompreensível em vez de ligeiramente estranha.
 *
 * Para duas opções, uma contagem de palavras funcionais dá um resultado tão bom como
 * um modelo, sem acrescentar dependência nem peso ao pacote. As palavras funcionais
 * (artigos, preposições, verbos auxiliares) são as mais frequentes de qualquer língua
 * e as que menos se confundem entre estas duas.
 *
 * ## O português é o desempate
 *
 * Em caso de dúvida — frase curta, só números, um código de produto — devolve `pt-PT`.
 * O sistema é usado em Moçambique, e ler «Coca-Cola» ou «50 meticais» com fonética
 * inglesa é pior do que o contrário.
 */

/** Palavras que quase só aparecem em português. */
const MARCADORES_PT = [
  'o', 'a', 'os', 'as', 'um', 'uma', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na',
  'para', 'com', 'que', 'não', 'sim', 'e', 'ou', 'mas', 'quanto', 'quantos', 'quantas',
  'qual', 'quais', 'quando', 'onde', 'como', 'porque', 'este', 'esta', 'isso', 'esse',
  'foi', 'são', 'está', 'estão', 'tem', 'temos', 'há', 'vou', 'quero', 'preciso',
  'hoje', 'ontem', 'amanhã', 'mês', 'ano', 'dia', 'venda', 'vendas', 'stock', 'loja',
  'produto', 'produtos', 'cliente', 'clientes', 'me', 'meu', 'minha', 'nós',
];

/** Palavras que quase só aparecem em inglês. */
const MARCADORES_EN = [
  'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'and', 'or', 'but',
  'is', 'are', 'was', 'were', 'be', 'have', 'has', 'had', 'do', 'does', 'did',
  'how', 'what', 'when', 'where', 'why', 'which', 'who', 'this', 'that', 'these',
  'i', 'you', 'we', 'they', 'my', 'our', 'me', 'show', 'give', 'tell', 'want', 'need',
  'today', 'yesterday', 'tomorrow', 'month', 'year', 'day', 'sales', 'sold', 'store',
  'product', 'products', 'customer', 'customers', 'much', 'many', 'please', 'thanks',
];

/**
 * `'pt-PT'` ou `'en-US'`, para passar ao reconhecimento ou à síntese de voz.
 *
 * Só compara palavras inteiras: um `includes('do')` casaria com «produto» e com
 * «dose», e as palavras funcionais são curtas o suficiente para aparecerem dentro de
 * muitas outras.
 */
export function detectarIdioma(texto: string): 'pt-PT' | 'en-US' {
  const limpo = (texto ?? '').toLowerCase().trim();
  if (limpo.length < 3) return 'pt-PT';

  // Acentos e cedilha são prova quase definitiva de português: nenhuma palavra inglesa
  // comum os tem, e quem escreve «não» ou «março» não está a escrever inglês.
  if (/[áàâãéêíóôõúç]/.test(limpo)) return 'pt-PT';

  const palavras = limpo.split(/[^a-z]+/).filter(Boolean);
  if (palavras.length === 0) return 'pt-PT';

  let pt = 0;
  let en = 0;

  for (const palavra of palavras) {
    // «a», «me» e «do» existem nas duas listas: não contam para nenhum lado, porque
    // pontuar ambas anula-se e pontuar uma só falseia o resultado.
    const ePt = MARCADORES_PT.includes(palavra);
    const eEn = MARCADORES_EN.includes(palavra);

    if (ePt && !eEn) pt += 1;
    else if (eEn && !ePt) en += 1;
  }

  // Empate ou nenhum marcador → português, por omissão. Ver a nota no topo.
  return en > pt ? 'en-US' : 'pt-PT';
}

/**
 * A voz do sistema mais adequada ao idioma.
 *
 * Devolve `undefined` quando não há nenhuma instalada para esse idioma — nesse caso
 * quem chama deixa o browser escolher, o que é melhor do que forçar uma voz errada.
 */
export function escolherVoz(
  idioma: 'pt-PT' | 'en-US',
  vozes: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | undefined {
  const prefixo = idioma.slice(0, 2);

  // Exacta primeiro (`pt-PT` antes de `pt-BR`): a pronúncia difere o suficiente para
  // se notar, e o sistema é de Moçambique, onde a norma é a europeia.
  return (
    vozes.find((v) => v.lang === idioma) ??
    vozes.find((v) => v.lang.startsWith(prefixo))
  );
}
