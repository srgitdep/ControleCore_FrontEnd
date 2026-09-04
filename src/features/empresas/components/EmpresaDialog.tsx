import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Building2, UserCircle, Info, Blocks } from 'lucide-react';
import { useCreateEmpresa, useUpdateEmpresa } from '@/features/empresas';
import { modulosApi } from '@/features/modulos';
import type { Empresa } from '@/features/empresas';
import { cn } from '@/shared/utils';

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

// ────────────────────────────────────────────────────────────────────────────â”€
// Formulário de EDIÇÃO (simples)
// ────────────────────────────────────────────────────────────────────────────â”€
function EditarEmpresaForm({ empresa, onClose }: { empresa: Empresa; onClose: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<EditarFormData>({
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
          <label className="block text-sm font-medium text-slate-700 mb-1">PaÍs</label>
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

// ────────────────────────────────────────────────────────────────────────────â”€
// Formulário de CRIAÇÃO (onboarding completo)
// ────────────────────────────────────────────────────────────────────────────â”€
function CriarEmpresaForm({ onClose }: { onClose: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<CriarFormData>({
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

  /**
   * Os módulos que a nova empresa vai subscrever.
   *
   * Era `modulos: []` fixo no código: todas as empresas criadas pela aplicação nasciam sem
   * módulo nenhum, e a `Assinatura` ficava sem linhas — com valor total zero. O catálogo
   * existia no servidor (`GET /empresas/modulos/catalogo`) e nada o pedia.
   */
  const [modulosEscolhidos, setModulosEscolhidos] = useState<string[]>([]);

  const { data: catalogo, isLoading: aCarregarCatalogo } = useQuery({
    queryKey: ['catalogo-modulos'],
    queryFn: () => modulosApi.catalogoParaSubscricao(),
  });

  const alternarModulo = (id: string) =>
    setModulosEscolhidos((antes) =>
      antes.includes(id) ? antes.filter((m) => m !== id) : [...antes, id],
    );

  const totalMensal = (catalogo ?? [])
    .filter((m) => modulosEscolhidos.includes(m.id))
    .reduce((soma, m) => soma + Number(m.precoMensal), 0);

  const mutation = useCreateEmpresa();
  const onSubmit = handleSubmit((data) => {
    mutation.mutate(
      { ...data, modulos: modulosEscolhidos },
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

      {/* ── Divisor ────────────────────────────────────────────────────â”€ */}
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
            O sistema irá gerar automaticamente um <strong>código de acesso</strong> e uma <strong>senha provisória</strong> para o gestor, que serão enviados para o e-mail indicado assim que a empresa for registada. Um perÍodo de <strong>TRIAL de 14 dias</strong> será ativado automaticamente.
          </p>
        </div>
      </div>

      {/* ── Divisor ────────────────────────────────────────────────────â”€ */}
      <div className="mx-6 border-t border-dashed border-slate-200" />

      {/* ── Secção 3: Módulos a subscrever ─────────────────────────────── */}
      <div className="px-6 pt-4 pb-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
            <Blocks size={14} className="text-violet-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Módulos</h3>
            <p className="text-xs text-slate-500">
              O que esta empresa vai poder usar. Define o valor da assinatura.
            </p>
          </div>
        </div>

        {aCarregarCatalogo ? (
          <p className="text-sm text-slate-400">A carregar o catálogo…</p>
        ) : (catalogo ?? []).length === 0 ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            O catálogo de módulos está vazio. A empresa será criada sem subscrição e a
            assinatura ficará a zero. Módulos criam-se em «Módulos», no menu.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {catalogo!.map((m) => {
                const escolhido = modulosEscolhidos.includes(m.id);

                return (
                  <label
                    key={m.id}
                    className={cn(
                      'flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors',
                      escolhido
                        ? 'border-violet-400 bg-violet-50'
                        : 'border-slate-200 hover:bg-slate-50',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={escolhido}
                      onChange={() => alternarModulo(m.id)}
                      className="mt-0.5 rounded border-slate-300"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-800">{m.nome}</span>
                      {m.descricao && (
                        <span className="block text-xs text-slate-500">{m.descricao}</span>
                      )}
                      <span className="mt-1 block text-xs font-semibold text-slate-600">
                        {Number(m.precoMensal).toLocaleString('pt-MZ', {
                          style: 'currency',
                          currency: 'MZN',
                        })}
                        <span className="font-normal text-slate-400"> /mês</span>
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>

            <p className="mt-3 text-right text-sm text-slate-600">
              {modulosEscolhidos.length} escolhido(s) ·{' '}
              <span className="font-semibold text-slate-900">
                {totalMensal.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}
              </span>{' '}
              por mês
            </p>

            {modulosEscolhidos.length === 0 && (
              <p className="mt-1 text-right text-xs text-amber-700">
                Sem módulos, a empresa entra sem nada subscrito.
              </p>
            )}
          </>
        )}
      </div>

      {/* ── Footer / Botões ──────────────────────────────────────────────â”€ */}
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

// ────────────────────────────────────────────────────────────────────────────â”€
// Componente Principal (escolhe qual formulário renderizar)
// ────────────────────────────────────────────────────────────────────────────â”€
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
