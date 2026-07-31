import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Award, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCriarMarca, useMarcas } from '../hooks/useCatalogo';

function mensagemErro(erro: unknown): string {
  const data = (erro as { response?: { data?: { mensagem?: string; message?: string } } })
    ?.response?.data;
  return data?.mensagem ?? data?.message ?? 'Não foi possível guardar a marca.';
}

export function MarcasPage() {
  const marcas = useMarcas();
  const criar = useCriarMarca();
  const [aberto, setAberto] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [marcaPropria, setMarcaPropria] = useState(false);

  const submeter = async (evento: FormEvent) => {
    evento.preventDefault();
    try {
      await criar.mutateAsync({ codigo, nome, marcaPropria });
      toast.success('Marca criada.');
      setAberto(false);
      setCodigo('');
      setNome('');
      setMarcaPropria(false);
    } catch (erro) {
      toast.error(mensagemErro(erro));
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Award className="h-6 w-6 text-emerald-600" />
            Marcas
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Marcas comerciais e marca própria (CAT-24).
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/catalogo"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Saúde
          </Link>
          <Link
            to="/catalogo/artigos"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Artigos
          </Link>
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" /> Nova marca
          </button>
        </div>
      </header>

      {aberto && (
        <form
          onSubmit={submeter}
          className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
        >
          <label className="text-sm">
            Código
            <input
              required
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Nome
            <input
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={marcaPropria}
              onChange={(e) => setMarcaPropria(e.target.checked)}
            />
            Marca própria
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={criar.isPending}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {criar.isPending ? 'A guardar…' : 'Criar marca'}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Artigos</th>
            </tr>
          </thead>
          <tbody>
            {marcas.isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-slate-500">
                  A carregar…
                </td>
              </tr>
            )}
            {(marcas.data ?? []).map((marca) => (
              <tr key={marca.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-mono text-xs">{marca.codigo}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{marca.nome}</td>
                <td className="px-4 py-3">
                  {marca.marcaPropria ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                      Própria
                    </span>
                  ) : (
                    'Comercial'
                  )}
                </td>
                <td className="px-4 py-3">{marca._count?.artigos ?? 0}</td>
              </tr>
            ))}
            {!marcas.isLoading && (marcas.data?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-slate-500">
                  Ainda não há marcas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
