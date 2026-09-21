import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import { mensagemDeErro } from '@/shared/utils';
import { useContaClienteStore } from '../store/useContaClienteStore';

export function CriarContaPage() {
  const { lojaId } = useParams<{ lojaId: string }>();
  const navegar = useNavigate();
  const registar = useContaClienteStore((s) => s.registar);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [password, setPassword] = useState('');
  const [aRegistar, setARegistar] = useState(false);

  if (!lojaId) return null;

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setARegistar(true);

    try {
      await registar({ lojaId, nome, email: email.trim(), telefone: telefone.trim() || undefined, password });
      navegar(`/loja/${lojaId}`, { replace: true });
      toast.success('Conta criada.');
    } catch (erro) {
      toast.error(mensagemDeErro(erro, 'Não foi possível criar a conta.'));
    } finally {
      setARegistar(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <header className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
            <Store size={22} className="text-white" />
          </div>
          <h1 className="mt-3 text-lg font-semibold text-slate-900">Criar conta</h1>
          <p className="mt-1 text-sm text-slate-500">Para comprar e acompanhar os seus pedidos.</p>
        </header>

        <form onSubmit={submeter} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <div>
            <label className="block text-xs font-medium text-slate-700">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              autoComplete="name"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">Telefone (opcional)</label>
            <input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              autoComplete="tel"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-400">Mínimo de 8 caracteres.</p>
          </div>

          <button
            type="submit"
            disabled={aRegistar}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {aRegistar && <Loader2 size={15} className="animate-spin" />}
            Criar conta
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          Já tem conta?{' '}
          <Link to={`/loja/${lojaId}/entrar`} className="font-medium text-blue-600 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
