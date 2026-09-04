import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { KeyRound } from 'lucide-react';
import { Button } from '@/shared/ui';
import { setUserPin } from '../api/users.api';
import type { UserDetail } from '../types';

/**
 * Definir o PIN de balcão de um utilizador.
 *
 * ## O que o PIN autoriza, e o que não
 *
 * Não substitui a senha nem abre sessão. Serve para autorizar uma acção pontual na caixa
 * sem a fechar — anular uma linha, aplicar um desconto — e é por isso que são quatro a
 * seis dígitos: digita-se à frente do cliente, em segundos.
 *
 * ## Escreve-se, não se lê
 *
 * O servidor nunca devolve o PIN, e este ecrã também não o mostra depois de gravado. Um
 * PIN esquecido substitui-se; não se recupera. A confirmação por segundo campo existe
 * porque um erro de digitação num campo mascarado só se descobriria no balcão, com o
 * cliente à espera.
 */
export function DefinirPinModal({
  user,
  onClose,
}: {
  user: UserDetail;
  onClose: () => void;
}) {
  const [pin, setPin] = useState('');
  const [confirmacao, setConfirmacao] = useState('');

  const gravar = useMutation({
    mutationFn: () => setUserPin(user.id, pin),
    onSuccess: () => {
      toast.success(`PIN definido para ${user.name}.`);
      onClose();
    },
    // A mensagem do servidor diz o que falhou — comprimento, ou caracteres não numéricos.
    onError: (erro: any) =>
      toast.error(erro?.response?.data?.message || 'Não foi possível definir o PIN.'),
  });

  const soDigitos = /^[0-9]*$/.test(pin);
  const comprimentoOk = pin.length >= 4 && pin.length <= 6;
  const coincide = pin === confirmacao;
  const valido = soDigitos && comprimentoOk && coincide;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white shadow-xl">
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-3">
          <div className="mt-0.5 rounded-lg bg-slate-100 p-2">
            <KeyRound className="h-4 w-4 text-slate-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">PIN de balcão</h3>
            <p className="mt-0.5 text-xs text-slate-500">{user.name}</p>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="text-sm font-medium text-slate-700">PIN</label>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-center text-lg tracking-[0.4em] focus:border-blue-400 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-400">Entre quatro e seis dígitos.</p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Repetir</label>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-center text-lg tracking-[0.4em] focus:border-blue-400 focus:outline-none"
            />
          </div>

          {confirmacao.length > 0 && !coincide && (
            <p className="text-xs text-red-600">Os dois PIN não coincidem.</p>
          )}

          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            O PIN não é a senha de acesso e não abre sessão. Autoriza acções na caixa sem a
            fechar. Não se recupera — se for esquecido, define-se outro aqui.
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={!valido || gravar.isPending} onClick={() => gravar.mutate()}>
            Gravar PIN
          </Button>
        </div>
      </div>
    </div>
  );
}
