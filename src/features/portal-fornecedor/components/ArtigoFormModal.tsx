import { useState } from 'react';
import { Info, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { portal } from '../api/portal.api';
import type { ArtigoVitrine } from '../api/portal.api';

interface Props {
  /** Nulo cria um artigo novo. */
  artigo: ArtigoVitrine | null;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Criar ou editar um artigo da vitrine.
 *
 * ## Os dois campos que decidem comparações
 *
 * **Factor de conversão** e **GTIN**. Nenhum dos dois é óbvio para quem preenche, e ambos
 * têm consequências que não dão erro:
 *
 * - sem o factor, dez caixas de seis entram no stock do comprador como dez unidades. Não
 *   falha validação nenhuma — dá stock errado em silêncio até alguém contar. E do lado da
 *   comparação, é o que faz 240 por caixa competir de igual com 42 por unidade;
 * - sem GTIN, o artigo é encontrado por semelhança de nome, que falha quando o fornecedor
 *   lhe dá um nome que só ele entende.
 *
 * Por isso os dois têm explicação no formulário, e o factor tem uma pré-visualização em
 * palavras — «1 caixa 6 = 6 unidades» — em vez de um número solto.
 */
export function ArtigoFormModal({ artigo, onClose, onSuccess }: Props) {
  const [aGravar, setAGravar] = useState(false);

  const [f, setF] = useState({
    referencia: artigo?.referencia ?? '',
    nome: artigo?.nome ?? '',
    descricao: artigo?.descricao ?? '',
    gtin: artigo?.gtin ?? '',
    categoria: artigo?.categoria ?? '',
    marca: artigo?.marca ?? '',
    unidadeVenda: artigo?.unidadeVenda ?? '',
    factorConversao: String(artigo?.factorConversao ?? 1),
    embalagem: artigo?.embalagem ?? '',
    moq: artigo?.moq !== null && artigo?.moq !== undefined ? String(artigo.moq) : '',
    multiplo:
      artigo?.multiplo !== null && artigo?.multiplo !== undefined ? String(artigo.multiplo) : '',
    prazoExpedicaoDias:
      artigo?.prazoExpedicaoDias !== null && artigo?.prazoExpedicaoDias !== undefined
        ? String(artigo.prazoExpedicaoDias)
        : '',
    quantidadeDisponivel:
      artigo?.quantidadeDisponivel !== null && artigo?.quantidadeDisponivel !== undefined
        ? String(artigo.quantidadeDisponivel)
        : '',
  });

  const factor = Number(f.factorConversao);
  const factorValido = Number.isFinite(factor) && factor > 0;

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!f.referencia.trim() || !f.nome.trim()) {
      toast.error('A referência e o nome são obrigatórios.');
      return;
    }

    if (!factorValido) {
      toast.error('O factor de conversão tem de ser maior do que zero.');
      return;
    }

    // `undefined` e não string vazia: o `ValidationPipe` do backend corre com
    // `forbidNonWhitelisted`, e um campo opcional enviado vazio grava uma string vazia onde
    // devia ficar nulo — que depois aparece no ecrã do comprador como um campo preenchido a
    // branco.
    const opcional = (v: string) => (v.trim() ? v.trim() : undefined);
    const numero = (v: string) => (v.trim() ? Number(v) : undefined);

    const payload = {
      referencia: f.referencia.trim(),
      nome: f.nome.trim(),
      descricao: opcional(f.descricao),
      gtin: opcional(f.gtin),
      categoria: opcional(f.categoria),
      marca: opcional(f.marca),
      unidadeVenda: opcional(f.unidadeVenda),
      factorConversao: factor,
      embalagem: opcional(f.embalagem),
      moq: numero(f.moq),
      multiplo: numero(f.multiplo),
      prazoExpedicaoDias: numero(f.prazoExpedicaoDias),
      quantidadeDisponivel: numero(f.quantidadeDisponivel),
    };

    setAGravar(true);
    try {
      if (artigo) {
        await portal.actualizarArtigo(artigo.id, payload);
        toast.success('Artigo actualizado.');
      } else {
        await portal.criarArtigo(payload);
        toast.success('Artigo criado em rascunho. Publique um preço e depois publique-o.');
      }
      onSuccess();
      onClose();
    } catch (erro: any) {
      toast.error(erro?.response?.data?.message ?? 'Erro ao gravar o artigo.');
    } finally {
      setAGravar(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4">
      <form onSubmit={submeter} className="my-4 w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {artigo ? 'Editar artigo' : 'Novo artigo'}
          </h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-5 px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              etiqueta="Referência"
              obrigatorio
              valor={f.referencia}
              onChange={(v) => setF({ ...f, referencia: v })}
              exemplo="ARZ-25"
              ajuda="O seu código para este artigo. Único na sua vitrine."
            />
            <Campo
              etiqueta="Nome"
              obrigatorio
              valor={f.nome}
              onChange={(v) => setF({ ...f, nome: v })}
              exemplo="Arroz Agulha 25kg"
            />
          </div>

          <Campo
            etiqueta="Código de barras (GTIN)"
            valor={f.gtin}
            onChange={(v) => setF({ ...f, gtin: v })}
            exemplo="6001234567890"
            ajuda="O critério mais forte que existe. Com GTIN, os compradores encontram este artigo com certeza; sem ele, por semelhança de nome — que falha quando o nome que usam não é o seu."
            destaque
          />

          <div className="grid gap-4 sm:grid-cols-3">
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
            <Campo
              etiqueta="Embalagem"
              valor={f.embalagem}
              onChange={(v) => setF({ ...f, embalagem: v })}
              exemplo="Saco"
            />
          </div>

          {/* ── Unidade e conversão ────────────────────────────────── */}
          <section className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
            <h3 className="text-xs font-semibold text-blue-900">Como vende este artigo</h3>
            <p className="mt-1 text-[11px] leading-snug text-blue-800">
              É o campo mais importante do formulário. O comprador conta em unidades; se
              vender em caixas, temos de saber quantas unidades tem cada caixa — sem isso,
              dez caixas entram no stock dele como dez unidades.
            </p>

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Campo
                etiqueta="Unidade de venda"
                valor={f.unidadeVenda}
                onChange={(v) => setF({ ...f, unidadeVenda: v })}
                exemplo="caixa 6"
                ajuda="Como o descreve: «caixa 6», «fardo», «kg», «unidade»."
              />
              <Campo
                etiqueta="Unidades por embalagem"
                tipo="number"
                obrigatorio
                valor={f.factorConversao}
                onChange={(v) => setF({ ...f, factorConversao: v })}
                exemplo="6"
                ajuda="1 se vende à unidade."
              />
            </div>

            {factorValido && (
              <p className="mt-2 rounded bg-white px-2.5 py-1.5 text-xs text-slate-700">
                <Info size={11} className="mr-1 inline text-blue-600" />
                {factor === 1 ? (
                  <>Vende à unidade — o preço que publicar é o preço por unidade.</>
                ) : (
                  <>
                    1 {f.unidadeVenda.trim() || 'embalagem'} = <strong>{factor} unidades</strong>.
                    Um preço de 240 será comparado como {(240 / factor).toFixed(2)} por unidade.
                  </>
                )}
              </p>
            )}
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              etiqueta="Mínimo de encomenda"
              tipo="number"
              valor={f.moq}
              onChange={(v) => setF({ ...f, moq: v })}
              ajuda="Na unidade de venda. Deixe vazio se não exige mínimo."
            />
            <Campo
              etiqueta="Múltiplo de encomenda"
              tipo="number"
              valor={f.multiplo}
              onChange={(v) => setF({ ...f, multiplo: v })}
              ajuda="Se for 6, encomenda-se 6, 12, 18 — nunca 7."
            />
            <Campo
              etiqueta="Dias até expedir"
              tipo="number"
              valor={f.prazoExpedicaoDias}
              onChange={(v) => setF({ ...f, prazoExpedicaoDias: v })}
              ajuda="Entre receber a ordem e a mercadoria sair."
            />
            <Campo
              etiqueta="Saldo disponível"
              tipo="number"
              valor={f.quantidadeDisponivel}
              onChange={(v) => setF({ ...f, quantidadeDisponivel: v })}
              ajuda="Deixe vazio se preferir não publicar. Vazio não prejudica — não é lido como «sem stock»."
            />
          </div>

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
            {artigo ? 'Guardar' : 'Criar'}
          </button>
        </footer>
      </form>
    </div>
  );
}

function Campo({
  etiqueta,
  valor,
  onChange,
  tipo = 'text',
  obrigatorio,
  exemplo,
  ajuda,
  destaque,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  tipo?: string;
  obrigatorio?: boolean;
  exemplo?: string;
  ajuda?: string;
  destaque?: boolean;
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
        className={
          'mt-1 w-full rounded-md border px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none ' +
          (destaque
            ? 'border-blue-300 focus:border-blue-500'
            : 'border-slate-300 focus:border-blue-500')
        }
      />
      {ajuda && <p className="mt-1 text-[11px] leading-snug text-slate-500">{ajuda}</p>}
    </div>
  );
}
