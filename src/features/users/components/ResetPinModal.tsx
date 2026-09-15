import { useState } from 'react';
import { X, KeyRound, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUserPin } from '../api/users.api';
import type { UserDetail } from '../types';

interface Props {
  user: UserDetail;
  onClose: () => void;
}

/** Redefine o PIN de 4 a 6 dígitos usado para entrar rapidamente no caixa/POS. */
export function ResetPinModal({ user, onClose }: Props) {
  const [pin, setPin] = useState('');
  const [confirmarPin, setConfirmarPin] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (novoPin: string) => updateUserPin(user.id, novoPin),
    onSuccess: () => {
      toast.success(`PIN de ${user.name} redefinido.`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao redefinir o PIN.');
    },
  });

  const submeter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[0-9]{4,6}$/.test(pin)) {
      return toast.error('O PIN deve ter entre 4 e 6 dígitos numéricos.');
    }
    if (pin !== confirmarPin) {
      return toast.error('Os PINs não coincidem.');
    }
    mutation.mutate(pin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Redefinir PIN</h2>
            <p className="text-xs text-slate-500">{user.name}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submeter} className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Novo PIN</label>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
              placeholder="4 a 6 dígitos"
              className="w-full rounded-xl border px-4 py-2.5 text-center text-lg tracking-widest focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Confirmar PIN</label>
            <input
              type="password"
              inputMode="numeric"
              value={confirmarPin}
              onChange={(e) => setConfirmarPin(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
              className="w-full rounded-xl border px-4 py-2.5 text-center text-lg tracking-widest focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            Usado para entrar rapidamente no caixa. Comunique o novo PIN a {user.name} por um
            canal separado deste ecrã.
          </p>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
