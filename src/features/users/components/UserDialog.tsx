import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { createUser, updateUser, resendPassword } from '@/features/users';
import { getEmpresas } from '@/features/empresas';
import type { CreateUserPayload, UserDetail } from '@/features/users';
import { useAuth } from '@/features/auth';
import { usePerfis } from '@/features/permissoes';

function criarSchema(t: TFunction<'utilizadores'>) {
  return z.object({
    name: z.string().min(2, t('dialogo.validacao_nome')),
    email: z.string().email(t('dialogo.validacao_email')),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER', 'STOCK_KEEPER', 'USER']),
    empresaId: z.string().optional(),
    /** Vazio = usa o perfil do cargo. */
    perfilId: z.string().optional(),
    isActive: z.boolean(),
  });
}

type UserFormData = z.infer<ReturnType<typeof criarSchema>>;

interface UserDialogProps {
  userToEdit: UserDetail | null;
  onClose: () => void;
}

export function UserDialog({ userToEdit, onClose }: UserDialogProps) {
  const { t } = useTranslation('utilizadores');
  const { user: currentUser } = useAuth();
  const isEditing = !!userToEdit;
  const queryClient = useQueryClient();

  // Só carregar empresas se for SUPER_ADMIN
  const { data: empresas } = useQuery({
    queryKey: ['empresas'],
    queryFn: getEmpresas,
    enabled: currentUser?.role === 'SUPER_ADMIN',
  });

  const dynamicSchema = useMemo(() => criarSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: userToEdit
      ? {
          name: userToEdit.name,
          email: userToEdit.email,
          role: userToEdit.role,
          empresaId: userToEdit.empresaId || '',
          perfilId: userToEdit.perfilId || '',
          isActive: userToEdit.isActive,
        }
      : {
          role: 'USER',
          perfilId: '',
          isActive: true,
        },
  });

  const selectedRole = watch('role');
  const { data: perfis = [], isLoading: isLoadingPerfis } = usePerfis();

  /**
   * Os perfis que a empresa criou em Permissões — os que não vêm da SRG.
   *
   * Só estes justificam o campo: para um Caixa, Gestor ou Armazenista o cargo já escolhe o
   * perfil com o mesmo nome (`perfil-por-cargo.ts` no servidor), e oferecer a escolha era
   * pedir duas vezes a mesma decisão.
   */
  const perfisDaEmpresa = perfis.filter((perfil) => !perfil.isSystem);

  /**
   * «Funcionário Geral» (`USER`) é o único cargo sem perfil de sistema — de propósito: não
   * há um conjunto de permissões óbvio para ele, e dar-lhe um por omissão seria conceder
   * acesso que ninguém decidiu. Sem este campo, ficaria sem permissões nenhumas.
   */
  const cargoSemPerfilProprio = selectedRole === 'USER';

  // O campo aparece só quando acrescenta alguma coisa ao cargo: ou a empresa tem perfis
  // próprios para atribuir, ou o cargo não traz perfil nenhum. Nos restantes casos o cargo
  // decide sozinho, como o ecrã promete em «Define o perfil de permissões por omissão».
  const mostrarPerfil =
    selectedRole !== 'SUPER_ADMIN' &&
    (perfisDaEmpresa.length > 0 ||
      cargoSemPerfilProprio ||
      // Quem já tem um perfil atribuído vê sempre o campo, mesmo que a lista venha vazia
      // (ainda a carregar, ou o perfil entretanto apagado): de outro modo o campo que lho
      // podia tirar desaparecia, e não haveria como o voltar a pôr no perfil do cargo.
      !!userToEdit?.perfilId);

  const mutation = useMutation({
    mutationFn: (data: UserFormData) => {
      // Se for string vazia, converte para undefined para não quebrar a FK do Prisma
      const payload = {
        ...data,
        empresaId: data.empresaId === '' ? undefined : data.empresaId,
        // `null` e não `undefined`: ao editar, é o que retira o perfil próprio e devolve a
        // pessoa ao perfil do cargo. `undefined` desaparecia do JSON e não mudava nada.
        //
        // Com o campo escondido não se envia nada (`undefined`): o campo escondido fica no
        // valor por omissão, e enviá-lo retirava calado o perfil a quem já o tinha — bastava
        // abrir a ficha de alguém com um perfil da empresa e gravar sem lhe tocar.
        perfilId: !mostrarPerfil
          ? undefined
          : data.perfilId === ''
            ? isEditing
              ? null
              : undefined
            : data.perfilId,
      };

      return isEditing
        ? updateUser(userToEdit!.id, payload)
        : createUser(payload as CreateUserPayload);
    },
    onSuccess: () => {
      toast.success(isEditing ? t('dialogo.actualizado') : t('dialogo.criado'));
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || t('dialogo.erro_guardar');
      toast.error(Array.isArray(message) ? message[0] : message);
    },
  });

  const resendPasswordMutation = useMutation({
    mutationFn: (userId: string) => resendPassword(userId),
    onSuccess: (data) => toast.success(data.message),
    onError: () => toast.error(t('dialogo.erro_reenviar')),
  });

  const onSubmit = (data: UserFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            {isEditing ? t('dialogo.titulo_editar') : t('dialogo.titulo_novo')}
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
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('dialogo.nome')}</label>
              <input
                {...register('name')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('dialogo.nome_exemplo')}
              />
              {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('dialogo.email')}</label>
              <input
                {...register('email')}
                type="email"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('dialogo.email_exemplo')}
              />
              {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>}
            </div>



            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('dialogo.cargo')}</label>
              <select
                {...register('role')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="USER">{t('dialogo.perfil_opcao.USER')}</option>
                <option value="CASHIER">{t('dialogo.perfil_opcao.CASHIER')}</option>
                <option value="STOCK_KEEPER">{t('dialogo.perfil_opcao.STOCK_KEEPER')}</option>
                <option value="MANAGER">{t('dialogo.perfil_opcao.MANAGER')}</option>
                {(currentUser?.role === 'SUPER_ADMIN' || userToEdit?.role === 'ADMIN') && (
                  <option value="ADMIN">{t('dialogo.perfil_opcao.ADMIN')}</option>
                )}
                {(currentUser?.role === 'SUPER_ADMIN' || userToEdit?.role === 'SUPER_ADMIN') && (
                  <option value="SUPER_ADMIN">{t('dialogo.perfil_opcao.SUPER_ADMIN')}</option>
                )}
              </select>
              <p className="mt-1 text-xs text-slate-500">{t('dialogo.cargo_ajuda')}</p>
            </div>

            {/* O cargo já traz o perfil de permissões; este campo só aparece quando há algo
                a decidir para lá dele — ver `mostrarPerfil` acima. */}
            {mostrarPerfil && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('dialogo.perfil_permissoes')}
                </label>
                <select
                  {...register('perfilId')}
                  disabled={isLoadingPerfis}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-slate-50"
                >
                  <option value="">{t('dialogo.perfil_do_cargo')}</option>
                  {/* Só os perfis da empresa: os de sistema já são o que o cargo escolhe,
                      e repeti-los na lista dava a entender que eram outra coisa. */}
                  {perfisDaEmpresa.map((perfil) => (
                    <option key={perfil.id} value={perfil.id}>
                      {perfil.nome}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">{t('dialogo.perfil_permissoes_ajuda')}</p>
              </div>
            )}

            {/* Apenas o Super Admin pode atribuir empresas manualmente. O Admin cria sempre para a sua própria empresa (forçado no backend). */}
            {currentUser?.role === 'SUPER_ADMIN' && selectedRole !== 'SUPER_ADMIN' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('dialogo.associar_empresa')}</label>
                <select
                  {...register('empresaId')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">{t('dialogo.nenhuma_global')}</option>
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
              {resendPasswordMutation.isPending ? t('dialogo.a_enviar') : t('dialogo.reenviar_senha')}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {t('acoes.cancelar')}
          </button>
          <button
            type="submit"
            form="user-form"
            disabled={mutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? t('dialogo.a_guardar') : t('dialogo.guardar')}
          </button>
        </div>
      </div>
    </div>
  );
}
