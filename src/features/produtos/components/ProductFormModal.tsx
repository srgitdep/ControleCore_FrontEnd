import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, PackagePlus, Warehouse } from 'lucide-react';
import type { Product } from '../types';
import { useCreateProduct, useUpdateProduct, useCategories } from '../hooks/useCatalog';
import { useArmazens } from '@/features/lojas';
import { stockApi } from '@/features/stock';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/shared/ui';
import { ConversoesDoProduto } from './ConversoesDoProduto';
import { FornecedoresDoProduto } from './FornecedoresDoProduto';
import { CapturaPorFoto } from './CapturaPorFoto';
import type { DadosExtraidosDeFoto } from '../api/catalog.api';

const productSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  codigoBarras: z.string().optional(),
  sku: z.string().optional(),
  imagemUrl: z.string().url('O URL da imagem é inválido').optional().or(z.literal('')),
  categoriaId: z.string().optional(),
  descricao: z.string().optional(),
  precoCusto: z.coerce.number().min(0, 'Preço de custo não pode ser negativo'),
  precoVenda: z.coerce.number().min(0, 'Preço de venda não pode ser negativo'),
  taxaIva: z.coerce.number().min(0).max(100),
  unidadeMedida: z.string().min(1, 'Unidade de medida é obrigatória'),
  peso: z.coerce.number().optional(),
  isWeighable: z.boolean().default(false),

  // ─── Lote e validade ──────────────────────────────────────────────────────
  //
  // `temValidade` torna a data OBRIGATÓRIA na entrada de mercadoria deste produto. É
  // deliberado e é o que faz o controlo existir: sem a exigência, ninguém escreve as
  // datas, a tabela de lotes fica vazia e os alertas nunca disparam.
  temValidade: z.boolean().default(false),
  rastreavelPorLote: z.boolean().default(false),
  diasAvisoValidade: z.coerce.number().min(1, 'O aviso tem de ser de pelo menos 1 dia').optional(),
  isActive: z.boolean().default(true),

  // ─── Stock inicial ────────────────────────────────────────────────────────
  //
  // Só aparece na criação. Ao editar não se mostra: alterar existências por um
  // formulário de catálogo esconderia um movimento de inventário, que tem de ter
  // autor e motivo próprios — para isso há os ajustes na secção Stock (e os mínimos
  // por armazém, que se editam numa tabela própria).
  armazemId: z.string().optional(),
  quantidadeInicial: z.coerce.number().min(0, 'A quantidade não pode ser negativa').optional(),
  stockMinimo: z.coerce.number().min(0, 'O mínimo não pode ser negativo').optional(),
});

/**
 * O schema, com o stock mínimo obrigatório **só na criação**.
 *
 * ## Porque é obrigatório
 *
 * Sem mínimo, um produto nunca entra nos alertas de ruptura nem nas sugestões de
 * compra: ambos comparam o saldo com `minQuantity`, e um mínimo de zero significa «sem
 * mínimo definido», não «alerta quando chegar a zero». O produto ficava invisível para
 * o sistema de reposição, e só se descobria a falta quando o cliente perguntava.
 *
 * Torná-lo obrigatório aqui é mais barato do que descobrir depois quais dos produtos
 * ficaram sem — que era o que acontecia.
 *
 * ## Porque não na edição
 *
 * O mínimo é por armazém, e um produto pode ter três. O formulário de edição mostra-os
 * numa tabela própria (`MinimosPorArmazem`), com uma linha por armazém; exigir um valor
 * único aqui contradiria isso.
 */
const construirSchema = (aCriar: boolean) =>
  productSchema.superRefine((dados, ctx) => {
    if (!aCriar) return;

    if (!dados.armazemId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['armazemId'],
        message: 'Escolha o armazém a que o stock deste produto se refere.',
      });
    }

    // `undefined` e `0` são casos diferentes: o primeiro é «não preenchi», o segundo é
    // «sem mínimo». Ambos são recusados, mas a mensagem distingue-os.
    if (dados.stockMinimo === undefined || dados.stockMinimo === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['stockMinimo'],
        message: 'Indique o stock mínimo.',
      });
    } else if (dados.stockMinimo <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['stockMinimo'],
        message: 'O mínimo tem de ser maior que zero — abaixo dele o produto entra nos alertas.',
      });
    }
  });

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormModalProps {
  productToEdit?: Product;
  onClose: () => void;
}

export function ProductFormModal({ productToEdit, onClose }: ProductFormModalProps) {
  const { mutateAsync: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutateAsync: updateProduct, isPending: isUpdating } = useUpdateProduct();
  const { data: categoriesData } = useCategories();
  const categories = categoriesData || [];

  const isPending = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<z.input<typeof productSchema>, any, ProductFormData>({
    // O mínimo é obrigatório ao criar e não ao editar — ver `construirSchema`.
    resolver: zodResolver(construirSchema(!productToEdit)),
    defaultValues: productToEdit
      ? {
          nome: productToEdit.nome,
          codigoBarras: productToEdit.codigoBarras || '',
          sku: productToEdit.sku || '',
          imagemUrl: productToEdit.imagemUrl || '',
          categoriaId: productToEdit.categoriaId || '',
          descricao: productToEdit.descricao || '',
          precoCusto: productToEdit.precoCusto,
          precoVenda: productToEdit.precoVenda,
          taxaIva: productToEdit.taxaIva,
          unidadeMedida: productToEdit.unidadeMedida,
          peso: productToEdit.peso || 0,
          isWeighable: productToEdit.isWeighable,
          isActive: productToEdit.isActive,
          temValidade: productToEdit.temValidade ?? false,
          rastreavelPorLote: productToEdit.rastreavelPorLote ?? false,
          diasAvisoValidade: productToEdit.diasAvisoValidade ?? undefined,
        }
      : {
          nome: '',
          codigoBarras: '',
          sku: '',
          imagemUrl: '',
          categoriaId: '',
          descricao: '',
          precoCusto: 0,
          precoVenda: 0,
          taxaIva: 17, // default IVA
          unidadeMedida: 'UN',
          peso: 0,
          isWeighable: false,
          isActive: true,
          temValidade: false,
          rastreavelPorLote: false,
          // Sem valor: a omissão do domínio (45 dias) aplica-se quando não está definido, e
          // um zero pré-preenchido mostraria um erro num campo que ninguém tocou.
          diasAvisoValidade: undefined,
          armazemId: '',
          quantidadeInicial: 0,
          // Sem valor inicial: um zero por omissão mostraria um erro de validação num
          // campo que o utilizador ainda não tocou — o mínimo tem de ser maior que
          // zero. Vazio é o estado honesto de «ainda não preenchi».
          stockMinimo: undefined,
        },
  });

  const precoCusto = useWatch({ control, name: 'precoCusto' });
  const precoVenda = useWatch({ control, name: 'precoVenda' });
  // Os campos de validade só aparecem depois de o controlo ser ligado: mostrá-los sempre
  // sugeriria que todo o produto tem prazo, e um saco de cimento não tem.
  const temValidade = useWatch({ control, name: 'temValidade' });
  const unidadeMedida = useWatch({ control, name: 'unidadeMedida' });
  const quantidadeInicial = useWatch({ control, name: 'quantidadeInicial' });

  const { armazens, isLoading: isLoadingArmazens } = useArmazens();

  const valorEntrada = (Number(quantidadeInicial) || 0) * (Number(precoCusto) || 0);

  const [projectedMargin, setProjectedMargin] = useState(0);

  // Auto-calculate margin
  useEffect(() => {
    const custo = Number(precoCusto) || 0;
    const venda = Number(precoVenda) || 0;
    if (venda > 0) {
      const margin = ((venda - custo) / venda) * 100;
      setProjectedMargin(margin);
    } else {
      setProjectedMargin(0);
    }
  }, [precoCusto, precoVenda]);

  // Disable isWeighable if unit is not KG
  useEffect(() => {
    if (unidadeMedida !== 'KG') {
      setValue('isWeighable', false);
    }
  }, [unidadeMedida, setValue]);

  /**
   * Aplica ao formulário o que a IA leu nas fotografias.
   *
   * ## Não sobrescreve o que já está escrito
   *
   * Se a pessoa já escreveu o nome à mão, uma leitura posterior não o substitui: o que
   * alguém escreveu vale mais do que o que a IA adivinhou. Isto importa porque as
   * fotografias podem ser analisadas várias vezes, e à segunda vez o formulário já tem
   * conteúdo.
   *
   * ## O nome junta a marca
   *
   * A IA devolve «Azeite Extra Virgem» e «Oliveira da Serra» em campos separados, mas o
   * catálogo tem um só campo de nome — e é por ele que se procura no ponto de venda.
   * Juntar dá «Oliveira da Serra Azeite Extra Virgem», que é como o produto se identifica
   * na prateleira.
   *
   * `shouldValidate` fica desligado: validar campos que a pessoa ainda não tocou enche o
   * formulário de erros vermelhos por causa dos preços, que a foto nunca preenche.
   */
  const preencherDaFoto = (dados: DadosExtraidosDeFoto) => {
    const vazio = (campo: keyof ProductFormData) => {
      const actual = getValues(campo as any);
      return actual === undefined || actual === null || actual === '' || actual === 0;
    };

    const nomeCompleto = [dados.marca, dados.nome].filter(Boolean).join(' ').trim();
    if (nomeCompleto && vazio('nome')) setValue('nome', nomeCompleto);

    if (dados.codigoBarras && vazio('codigoBarras')) {
      setValue('codigoBarras', dados.codigoBarras);
    }
    if (dados.descricao && vazio('descricao')) setValue('descricao', dados.descricao);
    if (dados.categoriaId && vazio('categoriaId')) setValue('categoriaId', dados.categoriaId);
    if (dados.peso !== undefined && vazio('peso')) setValue('peso', dados.peso);

    // A unidade tem valor por omissão (`UN`), pelo que `vazio` nunca dá verdadeiro. Só se
    // substitui quando a foto diz outra coisa — um produto em litros ou quilos.
    if (dados.unidadeMedida && dados.unidadeMedida !== getValues('unidadeMedida')) {
      setValue('unidadeMedida', dados.unidadeMedida);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      // Strings vazias fora: gravar `""` num campo opcional é diferente de não o
      // gravar, e faria falhar a unicidade do código de barras entre dois produtos
      // sem código.
      const { armazemId, quantidadeInicial, stockMinimo, ...produto } = data;

      const payload = {
        ...produto,
        codigoBarras: produto.codigoBarras?.trim() || undefined,
        sku: produto.sku?.trim() || undefined,
        imagemUrl: produto.imagemUrl?.trim() || undefined,
        categoriaId: produto.categoriaId || undefined,
      };

      if (productToEdit) {
        // A edição nunca leva stock: o backend recusaria os campos desconhecidos
        // (`forbidNonWhitelisted` está ligado no ValidationPipe global), e mesmo que
        // não recusasse, mexer em existências aqui esconderia um movimento.
        await updateProduct({ id: productToEdit.id, data: payload });
      } else {
        await createProduct({
          ...payload,
          // Só se houver armazém escolhido — enviar `armazemId: ''` falharia a
          // validação de UUID no servidor.
          ...(armazemId
            ? {
                armazemId,
                quantidadeInicial: Number(quantidadeInicial) || 0,
                stockMinimo: Number(stockMinimo) || 0,
              }
            : {}),
        });
      }
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <PackagePlus className="h-5 w-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">
              {productToEdit ? 'Editar Produto' : 'Novo Produto'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit as any)} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 space-y-6">

            {/* Só ao criar: ao editar, os campos já estão preenchidos, e deixar a IA
                sobrescrever o que alguém corrigiu à mão perderia trabalho feito. */}
            {!productToEdit && <CapturaPorFoto onExtraido={preencherDaFoto} />}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Produto *</label>
                <input
                  {...register('nome')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Arroz Tio João 5kg"
                />
                {errors.nome && <p className="text-xs text-rose-500 mt-1">{errors.nome.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Código de Barras (EAN)</label>
                <input
                  {...register('codigoBarras')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Deixe vazio para auto-gerar SKU interno"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                <select
                  {...register('categoriaId')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Selecione uma categoria...</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">URL da Imagem (Para visualização no POS)</label>
                <input
                  type="url"
                  {...register('imagemUrl')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://exemplo.com/imagem.png"
                />
                {errors.imagemUrl && <p className="text-xs text-rose-500 mt-1">{errors.imagemUrl.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preço de Custo (MZN) *</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('precoCusto')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.precoCusto && <p className="text-xs text-rose-500 mt-1">{errors.precoCusto.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preço de Venda (MZN) *</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('precoVenda')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.precoVenda && <p className="text-xs text-rose-500 mt-1">{errors.precoVenda.message}</p>}
              </div>

              <div className="md:col-span-2">
                <div className={`p-3 rounded-lg flex items-center justify-between border ${projectedMargin < 15 ? 'bg-rose-50 border-rose-100' : projectedMargin > 30 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                  <span className="text-sm font-medium text-slate-700">Margem de Lucro Projetada:</span>
                  <span className={`text-lg font-bold ${projectedMargin < 15 ? 'text-rose-700' : projectedMargin > 30 ? 'text-emerald-700' : 'text-slate-700'}`}>
                    {projectedMargin.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Taxa IVA (%) *</label>
                <input
                  type="number"
                  {...register('taxaIva')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unidade de Medida *</label>
                <select
                  {...register('unidadeMedida')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="UN">Unidade (UN)</option>
                  <option value="KG">Quilograma (KG)</option>
                  <option value="G">Grama (G)</option>
                  <option value="L">Litro (L)</option>
                  <option value="ML">Mililitro (ML)</option>
                  <option value="CX">Caixa (CX)</option>
                  <option value="PCT">Pacote (PCT)</option>
                </select>
              </div>

              {/* O peso/volume estava no schema e era enviado ao servidor, mas não tinha
                  campo no formulário: não havia como o preencher nem como o corrigir. A
                  leitura por fotografia tornou isso visível — a IA lê «750ml» da
                  embalagem e o valor ia para um campo que ninguém via. */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Peso / Volume
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  {...register('peso')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: 0.75 para 750ml"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Na unidade escolhida acima. Deixe zero se não se aplicar.
                </p>
                {errors.peso && (
                  <p className="text-xs text-rose-500 mt-1">{errors.peso.message}</p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-6 md:col-span-2">
                <input
                  type="checkbox"
                  id="isWeighable"
                  {...register('isWeighable')}
                  disabled={unidadeMedida !== 'KG'}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                />
                <label htmlFor="isWeighable" className={`text-sm font-medium ${unidadeMedida !== 'KG' ? 'text-slate-400' : 'text-slate-700'}`}>
                  Produto Pesável (Balança no PDV)
                  <p className="text-xs font-normal text-slate-500 mt-0.5">
                    Se marcado, o PDV solicitará o peso ou lerá a etiqueta da balança. Requer unidade KG.
                  </p>
                </label>
              </div>

              {/* ─── Lote e validade ──────────────────────────────────────────
                  Fica no bloco das características físicas porque é isso que é: uma
                  propriedade da mercadoria, não uma regra comercial. */}
              <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="temValidade"
                    {...register('temValidade')}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="temValidade" className="text-sm font-medium text-slate-700">
                    Controlar prazo de validade
                    <p className="mt-0.5 text-xs font-normal text-slate-500">
                      A data de validade passa a ser <strong>obrigatória</strong> em cada entrada
                      de mercadoria deste produto. É o que faz os alertas existirem — sem a
                      exigência, as datas não são registadas e não há nada para vigiar.
                    </p>
                  </label>
                </div>

                {temValidade && (
                  <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="diasAvisoValidade"
                        className="mb-1 block text-sm font-medium text-slate-700"
                      >
                        Avisar quantos dias antes?
                      </label>
                      <input
                        type="number"
                        id="diasAvisoValidade"
                        min={1}
                        placeholder="45"
                        {...register('diasAvisoValidade')}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <p className="mt-1 text-xs text-slate-400">
                        Vazio usa 45 dias. O prazo útil de um iogurte não é o de uma conserva.
                      </p>
                      {errors.diasAvisoValidade && (
                        <p className="mt-1 text-xs text-rose-500">
                          {errors.diasAvisoValidade.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-start gap-3 sm:pt-7">
                      <input
                        type="checkbox"
                        id="rastreavelPorLote"
                        {...register('rastreavelPorLote')}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label
                        htmlFor="rastreavelPorLote"
                        className="text-sm font-medium text-slate-700"
                      >
                        Exigir código de lote
                        <p className="mt-0.5 text-xs font-normal text-slate-500">
                          Sem isto, o lote é derivado da própria validade — que já basta para
                          distinguir mercadoria no armazém.
                        </p>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Ao editar: os mínimos por armazém ───────────────────────────
                O ponto de reposição só era gravado na criação — depois disso não
                havia nenhuma via para o alterar, pelo que um produto criado sem
                mínimo ficava fora dos alertas e das sugestões de compra para
                sempre.

                A quantidade **não** se edita aqui: alterar existências por um
                formulário de catálogo esconderia um movimento de inventário, que
                tem de ter autor e motivo próprios. Para isso há os ajustes na
                secção Stock. */}
            {/* ── Ao editar: unidades e conversoes ────────────────────────────
                So na edicao, e nao na criacao: o produto tem de existir para lhe
                declarar factores, e pedi-los antes de haver ficha seria pedir uma
                decisao sobre uma coisa que ainda nao existe.

                Sem este painel, a unica via para declarar «uma caixa tem 24» era o
                Swagger — e comprar a caixa ficava a funcionar no servidor e
                inacessivel a quem trabalha na loja. */}
            {productToEdit && <ConversoesDoProduto produtoId={productToEdit.id} />}

            {/* A quem se compra, com que referência e a que preço. Só na edição, pela
                mesma razão das conversões: a ligação é entre duas fichas que já existem. */}
            {productToEdit && <FornecedoresDoProduto produtoId={productToEdit.id} />}

            {productToEdit && <MinimosPorArmazem produtoId={productToEdit.id} />}

            {/* ── Stock inicial, só na criação ──────────────────────────────── */}
            {!productToEdit && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-700">Stock</h3>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  O armazém e o stock mínimo são obrigatórios: sem mínimo definido, o produto
                  não entra nos alertas de ruptura nem nas sugestões de compra. A quantidade é
                  opcional — deixe a zero se a mercadoria ainda não chegou.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="md:col-span-3">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Armazém <span className="text-rose-500">*</span>
                    </label>
                    <select
                      {...register('armazemId')}
                      disabled={isLoadingArmazens}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                    >
                      <option value="">
                        {isLoadingArmazens ? 'A carregar armazéns...' : 'Escolher armazém...'}
                      </option>
                      {armazens.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.etiqueta}
                        </option>
                      ))}
                    </select>
                    {errors.armazemId && (
                      <p className="mt-1 text-xs text-rose-600">{errors.armazemId.message}</p>
                    )}
                    {!isLoadingArmazens && armazens.length === 0 && (
                      <p className="mt-1 text-xs text-amber-600">
                        Não há armazéns activos. Crie um em Armazéns antes de dar entrada de stock.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      {...register('quantidadeInicial')}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors.quantidadeInicial && (
                      <p className="mt-1 text-xs text-rose-600">{errors.quantidadeInicial.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Stock mínimo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      {...register('stockMinimo')}
                      placeholder="Ex: 10"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors.stockMinimo && (
                      <p className="mt-1 text-xs text-rose-600">{errors.stockMinimo.message}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      Abaixo dele o produto entra nos alertas e nas sugestões de compra.
                    </p>
                  </div>

                  {/* O valor da entrada, à vista: uma quantidade errada num campo
                      numérico é fácil de não ver, um total de milhões não é. */}
                  {valorEntrada > 0 && (
                    <div className="flex items-end md:col-span-1">
                      <div className="w-full rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-xs text-slate-500">Valor da entrada</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {valorEntrada.toLocaleString('pt-MZ', {
                            style: 'currency',
                            currency: 'MZN',
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 mt-auto">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isPending ? 'A guardar...' : 'Guardar Produto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Os pontos de reposição do produto, um por armazém.
 *
 * O mínimo vive em `Stock.minQuantity` — é por armazém, não do produto: o mesmo artigo
 * pode precisar de 50 unidades no ponto de venda e de 5 na reserva.
 *
 * Grava-se separadamente do resto do formulário, por linha, e não no «Guardar
 * Produto»: são registos diferentes (`Stock`, não `Produto`) e endpoints diferentes.
 * Juntá-los faria um botão gravar duas coisas, com a possibilidade de uma passar e a
 * outra falhar sem o utilizador saber qual.
 */
function MinimosPorArmazem({ produtoId }: { produtoId: string }) {
  const queryClient = useQueryClient();
  const [emEdicao, setEmEdicao] = useState<Record<string, string>>({});
  const [aGuardar, setAGuardar] = useState<string | null>(null);

  const { data: posicoes = [], isLoading, error } = useQuery({
    queryKey: ['stock-posicoes', produtoId],
    queryFn: () => stockApi.getPosicoesDoProduto(produtoId),
  });

  const guardar = async (stockId: string, valor: string) => {
    const minimo = Number(valor);

    if (!Number.isFinite(minimo) || minimo < 0) {
      return toast.error('O stock mínimo não pode ser negativo.');
    }

    setAGuardar(stockId);
    try {
      await stockApi.definirMinimo(stockId, minimo);
      toast.success('Stock mínimo actualizado.');

      // Os alertas e a listagem de saldos leem este valor.
      queryClient.invalidateQueries({ queryKey: ['stock-posicoes', produtoId] });
      queryClient.invalidateQueries({ queryKey: ['stocks'] });

      setEmEdicao((antes) => {
        const novo = { ...antes };
        delete novo[stockId];
        return novo;
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao guardar o stock mínimo.');
    } finally {
      setAGuardar(null);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-6 border-t border-slate-100 pt-5">
        <p className="text-sm text-slate-500">A carregar os saldos por armazém...</p>
      </div>
    );
  }

  // Um erro tem de ser visível. Devolver `null` aqui — como estava — fazia a secção
  // desaparecer sem explicação: quem abria o modal via um formulário sem os mínimos e
  // concluía que a funcionalidade não existia. Foi o que aconteceu.
  if (error) {
    return (
      <div className="mt-6 border-t border-slate-100 pt-5">
        <div className="flex items-center gap-2">
          <Warehouse className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-slate-700">Stock por armazém</h3>
        </div>
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Não foi possível carregar os saldos por armazém. Se o servidor foi actualizado
          há pouco, reinicie-o — esta secção usa um endpoint novo.
        </p>
      </div>
    );
  }

  if (posicoes.length === 0) {
    return (
      <div className="mt-6 border-t border-slate-100 pt-5">
        <div className="flex items-center gap-2">
          <Warehouse className="h-4 w-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Stock por armazém</h3>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Este produto não tem posições de stock. Crie um armazém na secção Armazéns.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-slate-100 pt-5">
      <div className="flex items-center gap-2">
        <Warehouse className="h-4 w-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-700">Stock por armazém</h3>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        O ponto de reposição é por armazém. Abaixo dele o produto entra nos alertas e nas
        sugestões de compra. Zero significa «sem mínimo definido».
      </p>

      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Armazém</th>
              <th className="px-3 py-2 text-right font-medium">Saldo</th>
              <th className="w-40 px-3 py-2 font-medium">Mínimo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {posicoes.map((p) => {
              const valor = emEdicao[p.id] ?? String(p.minQuantity);
              const alterado = Number(valor) !== p.minQuantity;
              const emFalta = p.minQuantity > 0 && p.currentQuantity <= p.minQuantity;

              return (
                <tr key={p.id}>
                  <td className="px-3 py-2">
                    <span className="text-slate-800">{p.armazem.nome}</span>
                    {!p.armazem.isActive && (
                      <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                        inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className={emFalta ? 'font-semibold text-amber-600' : 'text-slate-700'}>
                      {p.currentQuantity}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={valor}
                        onChange={(e) => setEmEdicao((antes) => ({ ...antes, [p.id]: e.target.value }))}
                        className="w-20 rounded border border-slate-200 px-2 py-1 text-sm"
                      />
                      {/* O botão só aparece quando há algo a gravar: sem isto, cada
                          linha teria um botão permanentemente activo e seria difícil
                          saber qual alteração ficou por confirmar. */}
                      {alterado && (
                        <button
                          type="button"
                          onClick={() => guardar(p.id, valor)}
                          disabled={aGuardar === p.id}
                          className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {aGuardar === p.id ? '...' : 'Guardar'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
