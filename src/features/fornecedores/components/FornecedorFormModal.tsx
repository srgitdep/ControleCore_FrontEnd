import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { suppliersApi } from '../api/suppliers.api';
import type { Supplier, SupplierPayload } from '../api/suppliers.api';

const VAZIO: SupplierPayload = {
  nome: '',
  nuit: '',
  tipoFornecimento: '',
  email: '',
  telefone: '',
  endereco: '',
  website: '',
};

/**
 * Criação e edição de fornecedor.
 *
 * Extraído da `FornecedoresPage`, que tinha 379 linhas com tabela, modal, pesquisa e
 * estado tudo inline — nada disso era reutilizável, e a secção Compras tinha por isso
 * uma tabela de fornecedores própria, com quatro colunas e sem forma de editar.
 */
export function FornecedorFormModal({
  fornecedor,
  onClose,
  onSaved,
}: {
  /** Ausente ao criar. */
  fornecedor?: Supplier;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<SupplierPayload>(
    fornecedor
      ? {
          nome: fornecedor.nome,
          nuit: fornecedor.nuit ?? '',
          tipoFornecimento: fornecedor.tipoFornecimento ?? '',
          email: fornecedor.email ?? '',
          telefone: fornecedor.telefone ?? '',
          endereco: fornecedor.endereco ?? '',
          website: fornecedor.website ?? '',
        }
      : VAZIO,
  );
  const [isSaving, setIsSaving] = useState(false);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return toast.error('O nome do fornecedor é obrigatório.');

    setIsSaving(true);
    try {
      // Campos vazios omitidos: enviar strings vazias gravaria `""` em vez de deixar o
      // campo por preencher, e um email `""` não é a mesma coisa que sem email.
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => String(v ?? '').trim() !== ''),
      ) as SupplierPayload;

      if (fornecedor) {
        await suppliersApi.updateSupplier(fornecedor.id, payload);
        toast.success('Fornecedor actualizado.');
      } else {
        await suppliersApi.createSupplier(payload);
        toast.success('Fornecedor criado.');
      }

      onSaved();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao guardar fornecedor.');
    } finally {
      setIsSaving(false);
    }
  };

  const campo = (
    rotulo: string,
    chave: keyof SupplierPayload,
    extra?: { tipo?: string; placeholder?: string; obrigatorio?: boolean; autoFocus?: boolean },
  ) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {rotulo}
        {extra?.obrigatorio && <span className="text-rose-500"> *</span>}
      </label>
      <input
        type={extra?.tipo ?? 'text'}
        value={String(form[chave] ?? '')}
        onChange={(e) => setForm({ ...form, [chave]: e.target.value })}
        placeholder={extra?.placeholder}
        autoFocus={extra?.autoFocus}
        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6">
          <h2 className="text-lg font-bold text-slate-900">
            {fornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={guardar} className="space-y-4 overflow-y-auto p-6">
          {campo('Nome', 'nome', { obrigatorio: true, autoFocus: true })}

          {/* Empilhado abaixo de `sm`: dois campos lado a lado num telemóvel dão
              ~150px cada, e "Tipo de fornecimento" não cabe no rótulo nem no valor. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {campo('NUIT', 'nuit')}
            {campo('Tipo de fornecimento', 'tipoFornecimento', { placeholder: 'Ex: Bebidas' })}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {campo('Email', 'email', { tipo: 'email' })}
            {campo('Telefone', 'telefone')}
          </div>

          {campo('Endereço', 'endereco')}
          {campo('Website', 'website')}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!form.nome.trim() || isSaving}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              {fornecedor ? 'Guardar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
