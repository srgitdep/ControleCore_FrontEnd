import { useState } from 'react';
import { ImageOff, Info, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { CapturaPorFoto } from '@/shared/ui';
import { mensagemDeErro } from '@/shared/utils';
import { portal } from '../api/portal.api';
import type { ArtigoVitrine } from '../api/portal.api';
import { OUTRA, TIPOS_DE_EMBALAGEM, UNIDADES_COMUNS } from '../constants/embalagem';

interface Props {
  /** Nulo cria um artigo novo. */
  artigo: ArtigoVitrine | null;
  onClose: () => void;
  onSuccess: () => void;
}

const hoje = () => new Date().toISOString().slice(0, 10);

/**
 * Criar ou editar um artigo da vitrine.
 *
 * ## O que este formulário pede, e o que deixou de pedir
 *
 * Fica só o que decide se o artigo aparece, se é reconhecido, e se o comprador o escolhe:
 * nome, imagem, como se vende, e o preço. GTIN, mínimo e múltiplo de encomenda, prazo de
 * expedição saíram — são reais e o sourcing usa-os quando existem, mas pedi-los **na
 * criação** custa mais do que vale: um fornecedor a publicar o primeiro artigo desiste
 * diante de um formulário com dez campos técnicos, a maioria dos quais nem sabe responder
 * de cabeça. Continuam editáveis depois, em `VitrinePage → Editar`.
 *
 * O saldo em stock (`quantidadeDisponivel`) **fica**, ao contrário desses — junto da secção
 * «como vende», porque é a mesma pergunta que o fornecedor já está a responder ali: quantas
 * embalagens tem, na mesma unidade de venda que acabou de descrever.
 *
 * ## O preço faz parte deste formulário, e não de um segundo passo
 *
 * Estruturalmente o preço é uma entidade à parte — `PrecoArtigo`, com escalões e histórico,
 * gerido em `PrecosModal`. Mas o primeiro preço de um artigo novo não é uma decisão
 * separada da criação: é a mesma decisão. Publicar sem preço deixa o artigo invisível em
 * todas as comparações sem erro nenhum, e antes disto o fornecedor só descobria ao reparar
 * no aviso da lista.
 *
 * Por isso, ao criar, este formulário chama as duas APIs em sequência — cria o artigo,
 * publica o preço com a mesma data de hoje. Se o preço falhar, o artigo já existe (em
 * rascunho, sem preço): o aviso da lista continua a apanhar esse caso, e o modal de Preços
 * continua lá para completar. Ao editar, o preço não aparece aqui — mudar o preço de um
 * artigo publicado é sempre uma decisão de escalão e vigência, que é o que `PrecosModal`
 * já resolve bem.
 *
 * ## Como se vende: embalagem, quantas embalagens, quanto tem cada uma
 *
 * Três perguntas onde havia duas, e a razão é que a pergunta anterior — «quantidade por
 * embalagem» — confundia duas coisas com o mesmo número num produto como uma caixa de doze
 * garrafas de um litro: doze garrafas, ou um litro? A resposta certa para o sourcing é o
 * produto dos dois — a caixa tem 12 litros — mas pedir isso já multiplicado obrigava o
 * fornecedor a fazer a conta de cabeça e a acertar as unidades sozinho.
 *
 * Separado em três, cada pergunta tem uma resposta óbvia: **que tipo de embalagem** (caixa),
 * **quantas unidades cabem lá dentro** (12), e **quanto mede cada unidade** (1, em litros).
 * O formulário multiplica os dois números — `factorConversao = unidadesPorEmbalagem ×
 * conteudoPorUnidade` — e é esse produto que o backend recebe, exactamente como recebia
 * antes: `unidade-conversao.ts` e `normalizacao-custo.ts` não sabem nem precisam de saber
 * que o número chegou em duas partes.
 *
 * Vender «à unidade» esconde os dois campos: não há embalagem nenhuma a descrever, e a
 * quantidade por embalagem vale 1 por definição.
 *
 * ## A leitura por fotografia é a mesma do lado comprador
 *
 * `CapturaPorFoto` e o serviço que a alimenta (`ExtrairProdutoDeFotoService`) já existiam
 * para o formulário de produto interno. Aqui só muda a chamada de API — `analisar` — e o
 * mapeamento do que volta para os campos deste formulário: o peso lido de uma fotografia
 * preenche o «quanto mede cada unidade», nunca o total já multiplicado, porque a foto não
 * sabe quantas unidades há dentro da caixa.
 */
export function ArtigoFormModal({ artigo, onClose, onSuccess }: Props) {
  const aEditar = artigo !== null;
  const [aGravar, setAGravar] = useState(false);

  const embalagemInicial = interpretarEmbalagem(artigo);

  const [f, setF] = useState({
    referencia: artigo?.referencia ?? '',
    nome: artigo?.nome ?? '',
    descricao: artigo?.descricao ?? '',
    categoria: artigo?.categoria ?? '',
    marca: artigo?.marca ?? '',
    tipoEmbalagem: embalagemInicial.tipoEmbalagem,
    unidadeSelector: embalagemInicial.unidadeSelector,
    unidadeOutra: embalagemInicial.unidadeOutra,
    unidadesPorEmbalagem: embalagemInicial.unidadesPorEmbalagem,
    conteudoPorUnidade: embalagemInicial.conteudoPorUnidade,
    quantidadeDisponivel:
      artigo?.quantidadeDisponivel !== null && artigo?.quantidadeDisponivel !== undefined
        ? String(artigo.quantidadeDisponivel)
        : '',
    imagemUrl: artigo?.imagens?.[0] ?? '',
  });

  const [preco, setPreco] = useState({
    preco: artigo?.precos?.[0]?.preco !== undefined ? String(artigo.precos[0].preco) : '',
  });

  // A unidade efectiva: o que o selector escolheu, ou o texto livre quando é «Outra».
  const unidadeBase = f.unidadeSelector === OUTRA ? f.unidadeOutra : f.unidadeSelector;

  const vendeAUnidade = f.tipoEmbalagem === '';

  const unidades = vendeAUnidade ? 1 : Number(f.unidadesPorEmbalagem);
  const conteudo = vendeAUnidade ? 1 : Number(f.conteudoPorUnidade || '1');
  const unidadesValidas = vendeAUnidade || (Number.isFinite(unidades) && unidades > 0);
  const conteudoValido = vendeAUnidade || (Number.isFinite(conteudo) && conteudo > 0);

  // O número que o backend recebe — o produto das duas perguntas, nunca digitado
  // directamente.
  const factorConversao = unidadesValidas && conteudoValido ? unidades * conteudo : NaN;
  const factorValido = Number.isFinite(factorConversao) && factorConversao > 0;

  /**
   * Aplica o que a fotografia leu.
   *
   * `unidadeMedida` vem no vocabulário do produto interno (UN, KG, G, L, ML, CX, PCT) e
   * precisa de descer para o texto que este selector usa (kg, litro…) — os dois vocabulários
   * existem porque servem perguntas diferentes: ali é uma coluna fechada do `Produto`, aqui
   * é a descrição livre de como o fornecedor embala. `peso` preenche o **conteúdo por
   * unidade**, não a quantidade de embalagens — a foto lê o que está escrito na embalagem
   * («500g»), não quantas embalagens existem numa caixa que ela não mostra.
   */
  const preencherDaFoto = (dados: Record<string, unknown>) => {
    const nome = dados.nome as string | undefined;
    const marca = dados.marca as string | undefined;
    const descricao = dados.descricao as string | undefined;
    const peso = dados.peso as number | undefined;
    const unidadeMedida = dados.unidadeMedida as string | undefined;
    const categoriaSugerida = dados.categoriaSugerida as string | undefined;

    setF((antes) => {
      const nomeCompleto = [marca, nome].filter(Boolean).join(' ').trim();
      const proximo = { ...antes };

      if (nomeCompleto && !antes.nome.trim()) proximo.nome = nomeCompleto;
      if (marca && !antes.marca.trim()) proximo.marca = marca;
      if (descricao && !antes.descricao.trim()) proximo.descricao = descricao;
      if (categoriaSugerida && !antes.categoria.trim()) proximo.categoria = categoriaSugerida;

      if (unidadeMedida && !antes.unidadeSelector) {
        const traduzida = DA_UNIDADE_DE_PRODUTO[unidadeMedida];
        if (traduzida && UNIDADES_COMUNS.some((u) => u.valor === traduzida)) {
          proximo.unidadeSelector = traduzida;
        } else if (traduzida) {
          proximo.unidadeSelector = OUTRA;
          proximo.unidadeOutra = traduzida;
        }
      }

      if (peso !== undefined && (!antes.conteudoPorUnidade || antes.conteudoPorUnidade === '1')) {
        proximo.conteudoPorUnidade = String(peso);
      }

      return proximo;
    });
  };

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!f.referencia.trim() || !f.nome.trim()) {
      toast.error('A referência e o nome são obrigatórios.');
      return;
    }

    if (!vendeAUnidade && !unidadesValidas) {
      toast.error('Quantas unidades tem cada embalagem? Tem de ser maior do que zero.');
      return;
    }

    if (!vendeAUnidade && !conteudoValido) {
      toast.error('Quanto mede cada unidade? Tem de ser maior do que zero.');
      return;
    }

    if (f.unidadeSelector === OUTRA && !f.unidadeOutra.trim()) {
      toast.error('Escreva qual é a unidade base, ou escolha uma da lista.');
      return;
    }

    // O preço só é obrigatório ao criar. Ao editar, mudar o preço passa por `PrecosModal`
    // — que é o único sítio que sabe lidar com escalão e vigência sem sobrescrever nada.
    let precoNumero: number | null = null;
    if (!aEditar) {
      precoNumero = Number(preco.preco);
      if (!Number.isFinite(precoNumero) || precoNumero <= 0) {
        toast.error('O preço tem de ser maior do que zero.');
        return;
      }
    }

    const opcional = (v: string) => (v.trim() ? v.trim() : undefined);
    const numeroOpcional = (v: string) => (v.trim() ? Number(v) : undefined);

    // `unidadeVenda` continua a existir no artigo — é o texto que aparece na vitrine e no
    // preço («Preço por caixa»). Deriva-se do tipo de embalagem escolhido, ou da unidade
    // base quando se vende à unidade.
    const unidadeVenda = vendeAUnidade ? opcional(unidadeBase) : f.tipoEmbalagem;

    const payload = {
      referencia: f.referencia.trim(),
      nome: f.nome.trim(),
      descricao: opcional(f.descricao),
      categoria: opcional(f.categoria),
      marca: opcional(f.marca),
      unidadeVenda,
      factorConversao,
      // A embalagem guarda a descrição legível: «caixa com 12 × 1litro», que é o que o
      // comprador lê na ficha do artigo. `unidadeVenda`/`factorConversao` continuam a ser
      // os números que o sourcing usa para comparar — este texto é só para leitura humana.
      embalagem:
        !vendeAUnidade && unidadeBase.trim()
          ? `${f.tipoEmbalagem} com ${unidades} × ${conteudo}${unidadeBase.trim()}`
          : undefined,
      quantidadeDisponivel: numeroOpcional(f.quantidadeDisponivel),
      imagens: f.imagemUrl.trim() ? [f.imagemUrl.trim()] : [],
    };

    setAGravar(true);
    try {
      if (aEditar) {
        await portal.actualizarArtigo(artigo.id, payload);
        toast.success('Artigo actualizado.');
        onSuccess();
        onClose();
      } else {
        const criado = await portal.criarArtigo(payload);

        try {
          await portal.publicarPreco(criado.id, {
            preco: precoNumero!,
            vigenteDe: new Date(`${hoje()}T00:00:00`).toISOString(),
          });
          toast.success('Artigo e preço publicados.');
        } catch (erroPreco) {
          // O artigo já existe — não desfazer. O aviso da vitrine («sem preço em vigor»)
          // continua a apanhar este caso, e o modal de Preços resolve-o a seguir.
          toast.error(
            mensagemDeErro(
              erroPreco,
              'Artigo criado, mas o preço não foi gravado. Publique-o em «Preços».',
            ),
          );
        }

        onSuccess();
        onClose();
      }
    } catch (erro) {
      toast.error(mensagemDeErro(erro, 'Erro ao gravar o artigo.'));
    } finally {
      setAGravar(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4">
      <form onSubmit={submeter} className="my-4 w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {aEditar ? 'Editar artigo' : 'Novo artigo'}
          </h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-5 px-5 py-5">
          {/* Só ao criar: ao editar, os campos já estão preenchidos, e deixar a IA
              sobrescrever o que alguém corrigiu à mão perderia trabalho feito. */}
          {!aEditar && (
            <CapturaPorFoto
              analisar={portal.extrairArtigoDeFoto}
              onExtraido={preencherDaFoto}
              legenda="Fotografe a embalagem — o nome, a marca e o peso costumam ler-se numa só fotografia. O preço não é lido da imagem."
            />
          )}

          {/* ── Imagem e identificação ─────────────────────────────── */}
          <div className="flex gap-4">
            <PreviaImagem url={f.imagemUrl} />

            <div className="flex-1 space-y-3">
              <Campo
                etiqueta="Nome"
                obrigatorio
                valor={f.nome}
                onChange={(v) => setF({ ...f, nome: v })}
                exemplo="Arroz Agulha 25kg"
              />
              <Campo
                etiqueta="Referência"
                obrigatorio
                valor={f.referencia}
                onChange={(v) => setF({ ...f, referencia: v })}
                exemplo="ARZ-25"
                ajuda="O seu código para este artigo. Único na sua vitrine."
              />
            </div>
          </div>

          <Campo
            etiqueta="Imagem do produto"
            valor={f.imagemUrl}
            onChange={(v) => setF({ ...f, imagemUrl: v })}
            exemplo="https://exemplo.com/arroz-25kg.png"
            ajuda="O URL de uma imagem já publicada algures — no seu site, numa rede social, num serviço de imagens. É o que o comprador vê primeiro na vitrine."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              etiqueta="Categoria"
              valor={f.categoria}
              onChange={(v) => setF({ ...f, categoria: v })}
              exemplo="Mercearia"
            />
            <Campo
              etiqueta="Marca"
              valor={f.marca}
              onChange={(v) => setF({ ...f, marca: v })}
            />
          </div>

          {/* ── Embalagem e conversão ──────────────────────────────── */}
          <section className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
            <h3 className="text-xs font-semibold text-blue-900">Como vende este artigo</h3>
            <p className="mt-1 text-[11px] leading-snug text-blue-800">
              O comprador conta em unidades — quilos, litros, peças. Uma caixa com 12
              garrafas de 1 litro cada tem 12 litros no total: diga os dois números e
              deixe o cálculo para nós.
            </p>

            <div className="mt-3">
              <label className="block text-xs font-medium text-slate-700">Embalagem</label>
              <select
                value={f.tipoEmbalagem}
                onChange={(e) => setF({ ...f, tipoEmbalagem: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                {TIPOS_DE_EMBALAGEM.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.etiqueta}
                  </option>
                ))}
              </select>
            </div>

            {!vendeAUnidade && (
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Campo
                  etiqueta={`Quantas unidades tem cada ${f.tipoEmbalagem || 'embalagem'}`}
                  tipo="number"
                  obrigatorio
                  valor={f.unidadesPorEmbalagem}
                  onChange={(v) => setF({ ...f, unidadesPorEmbalagem: v })}
                  exemplo="12"
                  ajuda="Ex.: 12 garrafas numa caixa."
                />
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Quanto mede cada unidade
                    <span className="ml-0.5 text-red-500">*</span>
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={f.conteudoPorUnidade}
                      onChange={(e) => setF({ ...f, conteudoPorUnidade: e.target.value })}
                      required
                      placeholder="1"
                      className="w-1/2 rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                    />
                    <select
                      value={f.unidadeSelector}
                      onChange={(e) => setF({ ...f, unidadeSelector: e.target.value })}
                      className="w-1/2 rounded-md border border-slate-300 bg-white px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="" disabled>
                        Unidade…
                      </option>
                      {UNIDADES_COMUNS.map((u) => (
                        <option key={u.valor} value={u.valor}>
                          {u.etiqueta}
                        </option>
                      ))}
                      <option value={OUTRA}>Outra…</option>
                    </select>
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-slate-500">
                    Ex.: 1 litro por garrafa.
                  </p>
                </div>

                {f.unidadeSelector === OUTRA && (
                  <div className="sm:col-span-2">
                    <Campo
                      etiqueta="Qual é a unidade"
                      obrigatorio
                      valor={f.unidadeOutra}
                      onChange={(v) => setF({ ...f, unidadeOutra: v })}
                      exemplo="galão"
                    />
                  </div>
                )}
              </div>
            )}

            {vendeAUnidade && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-slate-700">
                  Como se mede este produto
                </label>
                <select
                  value={f.unidadeSelector}
                  onChange={(e) => setF({ ...f, unidadeSelector: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="" disabled>
                    Escolha uma unidade…
                  </option>
                  {UNIDADES_COMUNS.map((u) => (
                    <option key={u.valor} value={u.valor}>
                      {u.etiqueta}
                    </option>
                  ))}
                  <option value={OUTRA}>Outra…</option>
                </select>
                {f.unidadeSelector === OUTRA && (
                  <div className="mt-3">
                    <Campo
                      etiqueta="Qual é a unidade"
                      obrigatorio
                      valor={f.unidadeOutra}
                      onChange={(v) => setF({ ...f, unidadeOutra: v })}
                      exemplo="galão"
                    />
                  </div>
                )}
              </div>
            )}

            {factorValido && unidadeBase.trim() && (
              <p className="mt-3 rounded bg-white px-2.5 py-1.5 text-xs text-slate-700">
                <Info size={11} className="mr-1 inline text-blue-600" />
                {vendeAUnidade ? (
                  <>Vende à unidade — o preço abaixo é o preço por {unidadeBase.trim()}.</>
                ) : (
                  <>
                    1 {f.tipoEmbalagem} = <strong>{unidades} × {conteudo}{unidadeBase.trim()}</strong> ={' '}
                    <strong>{arredondar(factorConversao)} {unidadeBase.trim()}</strong>. Dez{' '}
                    {f.tipoEmbalagem}s entram no stock do comprador como{' '}
                    {arredondar(10 * factorConversao)} {unidadeBase.trim()}.
                  </>
                )}
              </p>
            )}

            <div className="mt-3">
              <Campo
                etiqueta={`Quantas ${vendeAUnidade ? unidadeBase.trim() || 'unidades' : `${f.tipoEmbalagem}s`} tem em stock`}
                tipo="number"
                valor={f.quantidadeDisponivel}
                onChange={(v) => setF({ ...f, quantidadeDisponivel: v })}
                exemplo="200"
                ajuda="Deixe vazio se preferir não publicar. Vazio não é lido como «sem stock» — só falta a informação."
              />
            </div>
          </section>

          {/* ── Preço — só ao criar ────────────────────────────────── */}
          {!aEditar && (
            <section className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
              <h3 className="text-xs font-semibold text-emerald-900">Preço</h3>
              <p className="mt-1 text-[11px] leading-snug text-emerald-800">
                É o que o comprador vê primeiro numa comparação. Um artigo sem preço fica
                invisível em todas as comparações, mesmo publicado.
              </p>

              <div className="mt-3">
                <label className="block text-xs font-medium text-slate-700">
                  Preço por {vendeAUnidade ? unidadeBase.trim() || 'unidade' : f.tipoEmbalagem || 'embalagem'}
                  <span className="ml-0.5 text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={preco.preco}
                  onChange={(e) => setPreco({ preco: e.target.value })}
                  required
                  placeholder="450"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                {!vendeAUnidade && factorValido && Number(preco.preco) > 0 && (
                  <p className="mt-1 text-[11px] text-emerald-700">
                    {(Number(preco.preco) / factorConversao).toFixed(2)} MT por{' '}
                    {unidadeBase.trim() || 'unidade'}.
                  </p>
                )}
                <p className="mt-1 text-[11px] leading-snug text-slate-500">
                  Pode publicar preços diferentes por quantidade e alterá-lo mais tarde em
                  «Preços», na lista de artigos.
                </p>
              </div>
            </section>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700">Descrição</label>
            <textarea
              value={f.descricao}
              onChange={(e) => setF({ ...f, descricao: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] leading-snug text-slate-500">
              Ajuda a encontrar o artigo quando não tem código de barras. Escreva-a como o
              comprador o procuraria.
            </p>
          </div>
        </div>

        <footer className="flex justify-end gap-2 rounded-b-xl border-t border-slate-100 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={aGravar}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {aGravar && <Loader2 size={15} className="animate-spin" />}
            {aEditar ? 'Guardar' : 'Criar'}
          </button>
        </footer>
      </form>
    </div>
  );
}

/**
 * A miniatura da imagem, com o mesmo enquadramento quadrado dos cards da vitrine — o que se
 * vê aqui é o que o comprador vai ver.
 */
function PreviaImagem({ url }: { url: string }) {
  const [falhou, setFalhou] = useState(false);
  const limpo = url.trim();

  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      {limpo && !falhou ? (
        <img
          src={limpo}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFalhou(true)}
          onLoad={() => setFalhou(false)}
        />
      ) : (
        <ImageOff size={20} className="text-slate-300" />
      )}
    </div>
  );
}

/**
 * Recupera os três campos da embalagem a partir do que já estava gravado, ao editar.
 *
 * `factorConversao` chega como um único número — o produto de unidades × conteúdo — e não
 * há forma de o separar sem ambiguidade (12 pode ser «12 × 1» ou «1 × 12», e o resultado
 * seria o mesmo). Por isso, ao editar um artigo antigo, todo o factor entra como
 * «unidades», com conteúdo 1: o valor final do formulário continua correcto, mesmo que a
 * separação não reflicta como o fornecedor pensou nele da primeira vez. Quem editar vê o
 * número certo e pode reparti-lo como preferir.
 */
function interpretarEmbalagem(artigo: ArtigoVitrine | null) {
  if (!artigo) {
    return {
      tipoEmbalagem: '',
      unidadeSelector: '',
      unidadeOutra: '',
      unidadesPorEmbalagem: '1',
      conteudoPorUnidade: '1',
    };
  }

  const unidadeBase = extrairUnidadeBase(artigo.embalagem, artigo.unidadeVenda);
  const naListaComum = UNIDADES_COMUNS.some((u) => u.valor === unidadeBase.toLowerCase());
  const factor = artigo.factorConversao ?? 1;

  if (factor === 1) {
    return {
      tipoEmbalagem: '',
      unidadeSelector: unidadeBase && !naListaComum ? OUTRA : unidadeBase,
      unidadeOutra: unidadeBase && !naListaComum ? unidadeBase : '',
      unidadesPorEmbalagem: '1',
      conteudoPorUnidade: '1',
    };
  }

  const tipo = TIPOS_DE_EMBALAGEM.some((t) => t.valor === (artigo.unidadeVenda ?? '').toLowerCase())
    ? (artigo.unidadeVenda as string).toLowerCase()
    : artigo.unidadeVenda?.trim() || 'caixa';

  return {
    tipoEmbalagem: tipo,
    unidadeSelector: unidadeBase && !naListaComum ? OUTRA : unidadeBase,
    unidadeOutra: unidadeBase && !naListaComum ? unidadeBase : '',
    unidadesPorEmbalagem: String(factor),
    conteudoPorUnidade: '1',
  };
}

/**
 * Recupera a unidade base a partir do que já estava gravado, ao editar.
 *
 * `embalagem` guarda «caixa com 12 × 1litro» quando o factor não é 1; `unidadeVenda` guarda
 * a unidade base directamente quando o artigo se vende à unidade. As duas formas convergem
 * aqui para o mesmo campo do formulário.
 */
function extrairUnidadeBase(
  embalagem: string | null | undefined,
  unidadeVenda: string | null | undefined,
): string {
  // «caixa com 12 × 1litro» → «litro»: os números já vivem noutros campos, só a unidade
  // interessa aqui.
  const daEmbalagem = embalagem?.match(/×\s*[\d.,]*\s*(\D+)$/)?.[1]?.trim();
  return daEmbalagem || unidadeVenda || '';
}

/** Arredonda a duas casas, sem zeros a mais: 12 fica 12, 12.5 fica 12.5. */
function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Traduz a unidade que `ExtrairProdutoDeFotoService` devolve (o vocabulário fechado do
 * `Produto` interno) para o texto livre que este formulário usa.
 *
 * Os dois vocabulários existem por razões diferentes: ali é uma coluna do `Produto`, com
 * unidades que o POS e o inventário reconhecem; aqui é a descrição de como o fornecedor
 * embala, que pode ser «dúzia» ou «rolo» — coisas que o `Produto` nunca teve de nomear.
 */
const DA_UNIDADE_DE_PRODUTO: Record<string, string> = {
  UN: 'unidade',
  KG: 'kg',
  G: 'g',
  L: 'litro',
  ML: 'ml',
  CX: 'unidade',
  PCT: 'unidade',
};

function Campo({
  etiqueta,
  valor,
  onChange,
  tipo = 'text',
  obrigatorio,
  exemplo,
  ajuda,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  tipo?: string;
  obrigatorio?: boolean;
  exemplo?: string;
  ajuda?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700">
        {etiqueta}
        {obrigatorio && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <input
        type={tipo}
        step={tipo === 'number' ? 'any' : undefined}
        min={tipo === 'number' ? '0' : undefined}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        required={obrigatorio}
        placeholder={exemplo}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
      />
      {ajuda && <p className="mt-1 text-[11px] leading-snug text-slate-500">{ajuda}</p>}
    </div>
  );
}
