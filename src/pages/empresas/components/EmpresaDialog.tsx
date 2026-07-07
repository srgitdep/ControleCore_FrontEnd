import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Building2, UserCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { createEmpresa, updateEmpresa } from '@/api/empresa.api';
import type { Empresa } from '@/types/empresa.types';

// ── Esquema para CRIAÇÃO (onboarding completo) ────────────────────────────────
const criarEmpresaSchema = z.object({
  // Dados da Empresa
  empresaNome:      z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  empresaNuit:      z.string().min(9, 'O NUIT deve ter pelo menos 9 caracteres'),
  empresaEmail:     z.string().email('E-mail da empresa inválido'),
  empresaTelefone:  z.string().regex(/^\+?[0-9]{9,15}$/, 'Telefone inválido (deve conter 9 a 15 números, sem espaços ou letras)'),
  // Dados do Gestor Principal
  gestorNome:       z.string().min(2, 'O nome do gestor é obrigatório'),
  gestorEmail:      z.string().email('E-mail do gestor inválido'),
});

// ── Esquema para EDIÇÃO (apenas dados base da empresa) ────────────────────────
const editarEmpresaSchema = z.object({
  nome:     z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  nuit:     z.string().min(9, 'O NUIT deve ter pelo menos 9 caracteres'),
  email:    z.string().email('E-mail inválido'),
  telefone: z.string().regex(/^\+?[0-9]{9,15}$/, 'Telefone inválido').optional().or(z.literal('')),
  endereco: z.string().optional(),
  cidade:   z.string().optional(),
  pais:     z.string(),
  moeda:    z.string(),
  isActive: z.boolean(),
});

type CriarFormData  = z.infer<typeof criarEmpresaSchema>;
type EditarFormData = z.infer<typeof editarEmpresaSchema>;

interface EmpresaDialogProps {
  empresa: Empresa | null;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Formulário de EDIÇÃO (simples)
// ─────────────────────────────────────────────────────────────────────────────
function EditarEmpresaForm({ empresa, onClose }: { empresa: Empresa; onClose: () => void }) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EditarFormData>({
    resolver: zodResolver(editarEmpresaSchema),
    defaultValues: {
      nome:     empresa.nome,
      nuit:     empresa.nuit,
      email:    empresa.email,
      telefone: empresa.telefone || '',
      endereco: empresa.endereco || '',
      cidade:   empresa.cidade || '',
      pais:     empresa.pais,
      moeda:    empresa.moeda,
      isActive: empresa.isActive,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: EditarFormData) => updateEmpresa(empresa.id, data),
    onSuccess: () => {
      toast.success('Empresa atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      onClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao atualizar a empresa.';
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });

  return (
    <form id="empresa-form" onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4 p-6 overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Empresa *</label>
          <input {...register('nome')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
          {errors.nome && <p className="text-xs text-rose-500 mt-1">{errors.nome.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">NUIT *</label>
          <input {...register('nuit')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
          {errors.nuit && <p className="text-xs text-rose-500 mt-1">{errors.nuit.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">E-mail *</label>
          <input {...register('email')} type="email" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
          {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
          <input {...register('telefone')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
          <input {...register('endereco')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">País</label>
          <input {...register('pais')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Moeda</label>
          <input {...register('moeda')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
        </div>
        <div className="md:col-span-2 flex items-center gap-2 mt-1">
          <input type="checkbox" id="isActive" {...register('isActive')} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
          <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Empresa Ativa no Sistema</label>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={mutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {mutation.isPending ? 'A guardar...' : 'Guardar Alterações'}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Formulário de CRIAÇÃO (onboarding completo)
// ─────────────────────────────────────────────────────────────────────────────
function CriarEmpresaForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CriarFormData>({
    resolver: zodResolver(criarEmpresaSchema),
    defaultValues: {
      empresaNome:     '',
      empresaNuit:     '',
      empresaEmail:    '',
      empresaTelefone: '',
      gestorNome:      '',
      gestorEmail:     '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: CriarFormData) =>
      createEmpresa({
        ...data,
        modulos: [], // Por agora sem módulos — será expandido na fase de módulos
      }),
    onSuccess: (result) => {
      toast.success(result.message || 'Empresa criada com sucesso! E-mail enviado ao gestor.');
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      onClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao criar a empresa.';
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });

  const fieldClass = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";
  const errorClass = "text-xs text-rose-500 mt-1";

  return (
    <form id="empresa-form" onSubmit={handleSubmit((d) => mutation.mutate(d))} className="overflow-y-auto">
      
      {/* ── Secção 1: Dados da Empresa ─────────────────────────────────── */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Building2 size={14} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Dados da Empresa</h3>
            <p className="text-xs text-slate-500">Informações de identificação da empresa cliente</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nome da Empresa *</label>
            <input {...register('empresaNome')} className={fieldClass} placeholder="Ex: SRG Sistemas Lda" />
            {errors.empresaNome && <p className={errorClass}>{errors.empresaNome.message}</p>}
          </div>
          <div>
            <label className={labelClass}>NUIT *</label>
            <input {...register('empresaNuit')} className={fieldClass} placeholder="Ex: 400000000" />
            {errors.empresaNuit && <p className={errorClass}>{errors.empresaNuit.message}</p>}
          </div>
          <div>
            <label className={labelClass}>E-mail da Empresa *</label>
            <input {...register('empresaEmail')} type="email" className={fieldClass} placeholder="geral@empresa.co.mz" />
            {errors.empresaEmail && <p className={errorClass}>{errors.empresaEmail.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Telefone *</label>
            <input {...register('empresaTelefone')} className={fieldClass} placeholder="+258 84 000 0000" />
            {errors.empresaTelefone && <p className={errorClass}>{errors.empresaTelefone.message}</p>}
          </div>
        </div>
      </div>

      {/* ── Divisor ───────────────────────────────────────────────────── */}
      <div className="mx-6 border-t border-dashed border-slate-200" />

      {/* ── Secção 2: Dados do Gestor Principal ────────────────────────── */}
      <div className="px-6 pt-4 pb-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <UserCircle size={14} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Gestor Principal</h3>
            <p className="text-xs text-slate-500">Utilizador responsável que vai gerir a empresa no sistema</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nome Completo do Gestor *</label>
            <input {...register('gestorNome')} className={fieldClass} placeholder="Ex: António Mambo" />
            {errors.gestorNome && <p className={errorClass}>{errors.gestorNome.message}</p>}
          </div>
          <div>
            <label className={labelClass}>E-mail do Gestor *</label>
            <input {...register('gestorEmail')} type="email" className={fieldClass} placeholder="gestor@empresa.co.mz" />
            {errors.gestorEmail && <p className={errorClass}>{errors.gestorEmail.message}</p>}
          </div>
        </div>

        {/* Nota informativa */}
        <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <Info size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            O sistema irá gerar automaticamente um <strong>código de acesso</strong> e uma <strong>senha provisória</strong> para o gestor, que serão enviados para o e-mail indicado assim que a empresa for registada. Um período de <strong>TRIAL de 14 dias</strong> será ativado automaticamente.
          </p>
        </div>
      </div>

      {/* ── Footer / Botões ─────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={mutation.isPending} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
          {mutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              A registar...
            </>
          ) : (
            'Registar Empresa'
          )}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente Principal (escolhe qual formulário renderizar)
// ─────────────────────────────────────────────────────────────────────────────
export function EmpresaDialog({ empresa, onClose }: EmpresaDialogProps) {
  const isEditing = !!empresa;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {isEditing ? 'Editar Empresa' : 'Registar Nova Empresa'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? 'Atualize os dados de identificação da empresa'
                : 'Preencha os dados da empresa e do gestor responsável'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body — renderiza o formulário correto */}
        {isEditing ? (
          <EditarEmpresaForm empresa={empresa} onClose={onClose} />
        ) : (
          <CriarEmpresaForm onClose={onClose} />
        )}

      </div>
    </div>
  );
}
