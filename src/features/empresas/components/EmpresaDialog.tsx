import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Building2, UserCircle, Info } from 'lucide-react';
import { useCreateEmpresa, useUpdateEmpresa } from '@/features/empresas';
import type { Empresa } from '@/features/empresas';

// ── Esquema para CRIAÇÃO (onboarding completo) ────────────────────────────────
const criarEmpresaSchema = (t: TFunction<'empresas'>) => z.object({
  // Dados da Empresa
  empresaNome:      z.string().min(2, t('form.validacao.nome_curto')),
  empresaNuit:      z.string().min(9, t('form.validacao.nuit_curto')),
  empresaEmail:     z.string().email(t('form.validacao.email_empresa')),
  empresaTelefone:  z.string().regex(/^\+?[0-9]{9,15}$/, t('form.validacao.telefone_longo')),
  // Dados do Gestor Principal
  gestorNome:       z.string().min(2, t('form.validacao.gestor_nome')),
  gestorEmail:      z.string().email(t('form.validacao.email_gestor')),
});

// ── Esquema para EDIÇÃO (apenas dados base da empresa) ────────────────────────
const editarEmpresaSchema = (t: TFunction<'empresas'>) => z.object({
  nome:     z.string().min(2, t('form.validacao.nome_curto')),
  nuit:     z.string().min(9, t('form.validacao.nuit_curto')),
  email:    z.string().email(t('form.validacao.email')),
  telefone: z.string().regex(/^\+?[0-9]{9,15}$/, t('form.validacao.telefone')).optional().or(z.literal('')),
  endereco: z.string().optional(),
  cidade:   z.string().optional(),
  pais:     z.string(),
  moeda:    z.string(),
  isActive: z.boolean(),
});

type CriarFormData  = z.infer<ReturnType<typeof criarEmpresaSchema>>;
type EditarFormData = z.infer<ReturnType<typeof editarEmpresaSchema>>;

interface EmpresaDialogProps {
  empresa: Empresa | null;
  onClose: () => void;
}

// ────────────────────────────────────────────────────────────────────────────â”€
// Formulário de EDIÇÃO (simples)
// ────────────────────────────────────────────────────────────────────────────â”€
function EditarEmpresaForm({ empresa, onClose }: { empresa: Empresa; onClose: () => void }) {
  const { t } = useTranslation('empresas');
  const schema = useMemo(() => editarEmpresaSchema(t), [t]);
  const { register, handleSubmit, formState: { errors } } = useForm<EditarFormData>({
    resolver: zodResolver(schema),
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

  const mutation = useUpdateEmpresa();
  const onSubmit = handleSubmit((data) => {
    mutation.mutate(
      { id: empresa.id, data },
      { onSuccess: onClose }
    );
  });

  return (
    <form id="empresa-form" onSubmit={onSubmit} className="space-y-4 p-6 overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.nome')}</label>
          <input {...register('nome')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
          {errors.nome && <p className="text-xs text-rose-500 mt-1">{errors.nome.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.nuit')}</label>
          <input {...register('nuit')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
          {errors.nuit && <p className="text-xs text-rose-500 mt-1">{errors.nuit.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.email')}</label>
          <input {...register('email')} type="email" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
          {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.telefone')}</label>
          <input {...register('telefone')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.endereco')}</label>
          <input {...register('endereco')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.pais')}</label>
          <input {...register('pais')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.moeda')}</label>
          <input {...register('moeda')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
        </div>
        <div className="md:col-span-2 flex items-center gap-2 mt-1">
          <input type="checkbox" id="isActive" {...register('isActive')} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
          <label htmlFor="isActive" className="text-sm font-medium text-slate-700">{t('form.ativa')}</label>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
          {t('acoes.cancelar')}
        </button>
        <button type="submit" disabled={mutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {mutation.isPending ? t('form.a_guardar') : t('form.guardar_alteracoes')}
        </button>
      </div>
    </form>
  );
}

// ────────────────────────────────────────────────────────────────────────────â”€
// Formulário de CRIAÇÃO (onboarding completo)
// ────────────────────────────────────────────────────────────────────────────â”€
function CriarEmpresaForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('empresas');
  const schema = useMemo(() => criarEmpresaSchema(t), [t]);
  const { register, handleSubmit, formState: { errors } } = useForm<CriarFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      empresaNome:     '',
      empresaNuit:     '',
      empresaEmail:    '',
      empresaTelefone: '',
      gestorNome:      '',
      gestorEmail:     '',
    },
  });

  const mutation = useCreateEmpresa();
  const onSubmit = handleSubmit((data) => {
    mutation.mutate(
      { ...data, modulos: [] },
      { onSuccess: onClose }
    );
  });

  const fieldClass = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";
  const errorClass = "text-xs text-rose-500 mt-1";

  return (
    <form id="empresa-form" onSubmit={onSubmit} className="overflow-y-auto">
      
      {/* ── Secção 1: Dados da Empresa ──────────────────────────────────â”€ */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Building2 size={14} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">{t('form.dados_empresa')}</h3>
            <p className="text-xs text-slate-500">{t('form.dados_empresa_ajuda')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t('form.nome')}</label>
            <input {...register('empresaNome')} className={fieldClass} placeholder={t('form.nome_exemplo')} />
            {errors.empresaNome && <p className={errorClass}>{errors.empresaNome.message}</p>}
          </div>
          <div>
            <label className={labelClass}>{t('form.nuit')}</label>
            <input {...register('empresaNuit')} className={fieldClass} placeholder={t('form.nuit_exemplo')} />
            {errors.empresaNuit && <p className={errorClass}>{errors.empresaNuit.message}</p>}
          </div>
          <div>
            <label className={labelClass}>{t('form.email_empresa')}</label>
            <input {...register('empresaEmail')} type="email" className={fieldClass} placeholder="geral@empresa.co.mz" />
            {errors.empresaEmail && <p className={errorClass}>{errors.empresaEmail.message}</p>}
          </div>
          <div>
            <label className={labelClass}>{t('form.telefone_obrig')}</label>
            <input {...register('empresaTelefone')} className={fieldClass} placeholder="+258 84 000 0000" />
            {errors.empresaTelefone && <p className={errorClass}>{errors.empresaTelefone.message}</p>}
          </div>
        </div>
      </div>

      {/* ── Divisor ────────────────────────────────────────────────────â”€ */}
      <div className="mx-6 border-t border-dashed border-slate-200" />

      {/* ── Secção 2: Dados do Gestor Principal ────────────────────────── */}
      <div className="px-6 pt-4 pb-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <UserCircle size={14} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">{t('form.dados_gestor')}</h3>
            <p className="text-xs text-slate-500">{t('form.dados_gestor_ajuda')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t('form.gestor_nome')}</label>
            <input {...register('gestorNome')} className={fieldClass} placeholder={t('form.gestor_nome_exemplo')} />
            {errors.gestorNome && <p className={errorClass}>{errors.gestorNome.message}</p>}
          </div>
          <div>
            <label className={labelClass}>{t('form.gestor_email')}</label>
            <input {...register('gestorEmail')} type="email" className={fieldClass} placeholder="gestor@empresa.co.mz" />
            {errors.gestorEmail && <p className={errorClass}>{errors.gestorEmail.message}</p>}
          </div>
        </div>

        {/* Nota informativa */}
        <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <Info size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            {t('form.nota_antes')} <strong>{t('form.nota_codigo')}</strong> {t('form.nota_e')} <strong>{t('form.nota_senha')}</strong> {t('form.nota_meio')} <strong>{t('form.nota_trial')}</strong> {t('form.nota_depois')}
          </p>
        </div>
      </div>

      {/* ── Footer / Botões ──────────────────────────────────────────────â”€ */}
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
          {t('acoes.cancelar')}
        </button>
        <button type="submit" disabled={mutation.isPending} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
          {mutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t('form.a_registar')}
            </>
          ) : (
            t('form.registar')
          )}
        </button>
      </div>
    </form>
  );
}

// ────────────────────────────────────────────────────────────────────────────â”€
// Componente Principal (escolhe qual formulário renderizar)
// ────────────────────────────────────────────────────────────────────────────â”€
export function EmpresaDialog({ empresa, onClose }: EmpresaDialogProps) {
  const { t } = useTranslation('empresas');
  const isEditing = !!empresa;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {isEditing ? t('form.titulo_editar') : t('form.titulo_registar')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? t('form.sub_editar')
                : t('form.sub_registar')}
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
