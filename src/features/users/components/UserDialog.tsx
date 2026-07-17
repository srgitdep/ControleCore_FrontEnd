import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { createUser, updateUser, resendPassword } from '@/features/users';
import { getEmpresas } from '@/features/empresas';
import type { UserDetail } from '@/features/users';
import { useAuth } from '@/features/auth';

const baseSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail invÃ¡lido'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER', 'STOCK_KEEPER', 'USER']),
  empresaId: z.string().optional(),
  isActive: z.boolean(),
});

type UserFormData = z.infer<typeof baseSchema>;

interface UserDialogProps {
  userToEdit: UserDetail | null;
  onClose: () => void;
}

export function UserDialog({ userToEdit, onClose }: UserDialogProps) {
  const { user: currentUser } = useAuth();
  const isEditing = !!userToEdit;
  const queryClient = useQueryClient();

  // SÃ³ carregar empresas se for SUPER_ADMIN
  const { data: empresas } = useQuery({
    queryKey: ['empresas'],
    queryFn: getEmpresas,
    enabled: currentUser?.role === 'SUPER_ADMIN',
  });

  const dynamicSchema = baseSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: userToEdit
      ? {
          name: userToEdit.name,
          email: userToEdit.email,
          role: userToEdit.role,
          empresaId: userToEdit.empresaId || '',
          isActive: userToEdit.isActive,
        }
      : {
          role: 'USER',
          isActive: true,
        },
  });

  const selectedRole = watch('role');

  const mutation = useMutation({
    mutationFn: (data: UserFormData) => {
      // Se for string vazia, converte para undefined para nÃ£o quebrar a FK do Prisma
      const payload = {
        ...data,
        empresaId: data.empresaId === '' ? undefined : data.empresaId,
      };

      return isEditing ? updateUser(userToEdit!.id, payload as any) : createUser(payload as any);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Utilizador atualizado!' : 'Utilizador criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao guardar o utilizador.';
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });

  const resendPasswordMutation = useMutation({
    mutationFn: (userId: string) => resendPassword(userId),
    onSuccess: (data) => toast.success(data.message),
    onError: () => toast.error('Erro ao reenviar senha'),
  });

  const onSubmit = (data: UserFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            {isEditing ? 'Editar Utilizador' : 'Novo Utilizador'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo *</label>
              <input
                {...register('name')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: JoÃ£o Silva"
              />
              {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail *</label>
              <input
                {...register('email')}
                type="email"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="joao@srg.com"
              />
              {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>}
            </div>



            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Perfil de Acesso *</label>
              <select
                {...register('role')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="USER">FuncionÃ¡rio Geral</option>
                <option value="CASHIER">Operador de Caixa</option>
                <option value="STOCK_KEEPER">Armazenista</option>
                <option value="MANAGER">Supervisor / Gerente</option>
                {(currentUser?.role === 'SUPER_ADMIN' || userToEdit?.role === 'ADMIN') && (
                  <option value="ADMIN">Administrador da Empresa</option>
                )}
                {(currentUser?.role === 'SUPER_ADMIN' || userToEdit?.role === 'SUPER_ADMIN') && (
                  <option value="SUPER_ADMIN">Super Administrador (SRG)</option>
                )}
              </select>
            </div>

            {/* Apenas o Super Admin pode atribuir empresas manualmente. O Admin cria sempre para a sua prÃ³pria empresa (forÃ§ado no backend). */}
            {currentUser?.role === 'SUPER_ADMIN' && selectedRole !== 'SUPER_ADMIN' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Associar a Empresa</label>
                <select
                  {...register('empresaId')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">Nenhuma (Global)</option>
                  {empresas?.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.nome}</option>
                  ))}
                </select>
              </div>
            )}
            
          </form>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 mt-auto">
          {isEditing && (
            <button
              type="button"
              onClick={() => resendPasswordMutation.mutate(userToEdit!.id)}
              disabled={resendPasswordMutation.isPending}
              className="mr-auto px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              {resendPasswordMutation.isPending ? 'A enviar...' : 'Reenviar Senha por Email'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="user-form"
            disabled={mutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? 'A guardar...' : 'Guardar Utilizador'}
          </button>
        </div>
      </div>
    </div>
  );
}
