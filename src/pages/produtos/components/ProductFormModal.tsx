import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, PackagePlus } from 'lucide-react';
import type { Product } from '@/types/catalog.types';
import { useCreateProduct, useUpdateProduct, useCategories } from '@/hooks/useCatalog';
import { Button } from '@/components/common/Button';

const productSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  codigoBarras: z.string().optional(),
  sku: z.string().optional(),
  imagemUrl: z.string().url('O URL da imagem Ã© invÃ¡lido').optional().or(z.literal('')),
  categoriaId: z.string().optional(),
  descricao: z.string().optional(),
  precoCusto: z.coerce.number().min(0, 'PreÃ§o de custo nÃ£o pode ser negativo'),
  precoVenda: z.coerce.number().min(0, 'PreÃ§o de venda nÃ£o pode ser negativo'),
  taxaIva: z.coerce.number().min(0).max(100),
  unidadeMedida: z.string().min(1, 'Unidade de medida Ã© obrigatÃ³ria'),
  peso: z.coerce.number().optional(),
  isWeighable: z.boolean().default(false),
  isActive: z.boolean().default(true),
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
    formState: { errors },
  } = useForm<z.input<typeof productSchema>, any, ProductFormData>({
    resolver: zodResolver(productSchema),
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
        },
  });

  const precoCusto = useWatch({ control, name: 'precoCusto' });
  const precoVenda = useWatch({ control, name: 'precoVenda' });
  const unidadeMedida = useWatch({ control, name: 'unidadeMedida' });

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

  const onSubmit = async (data: ProductFormData) => {
    try {
      // Cleanup optional string fields if empty
      const payload = {
        ...data,
        codigoBarras: data.codigoBarras?.trim() || undefined,
        sku: data.sku?.trim() || undefined,
        imagemUrl: data.imagemUrl?.trim() || undefined,
        categoriaId: data.categoriaId || undefined,
      };

      if (productToEdit) {
        await updateProduct({ id: productToEdit.id, data: payload });
      } else {
        await createProduct(payload);
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Produto *</label>
                <input
                  {...register('nome')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Arroz Tio JoÃ£o 5kg"
                />
                {errors.nome && <p className="text-xs text-rose-500 mt-1">{errors.nome.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CÃ³digo de Barras (EAN)</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">URL da Imagem (Para visualizaÃ§Ã£o no POS)</label>
                <input
                  type="url"
                  {...register('imagemUrl')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://exemplo.com/imagem.png"
                />
                {errors.imagemUrl && <p className="text-xs text-rose-500 mt-1">{errors.imagemUrl.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">PreÃ§o de Custo (MZN) *</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('precoCusto')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.precoCusto && <p className="text-xs text-rose-500 mt-1">{errors.precoCusto.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">PreÃ§o de Venda (MZN) *</label>
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
                  <option value="L">Litro (L)</option>
                  <option value="CX">Caixa (CX)</option>
                  <option value="PACK">Pack</option>
                </select>
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
                  Produto PesÃ¡vel (BalanÃ§a no PDV)
                  <p className="text-xs font-normal text-slate-500 mt-0.5">
                    Se marcado, o PDV solicitarÃ¡ o peso ou lerÃ¡ a etiqueta da balanÃ§a. Requer unidade KG.
                  </p>
                </label>
              </div>
            </div>
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
