import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Store } from 'lucide-react';
import toast from 'react-hot-toast';
import { getLojas } from '@/features/lojas';
import {
  useActualizarEstadoSortido,
  useArtigos,
  useCriarSortido,
  useSortidos,
} from '../hooks/useCatalogo';
import type { EstadoSortido } from '../types';

function mensagemErro(erro: unknown): string {
  const data = (erro as { response?: { data?: { mensagem?: string; message?: string } } })
    ?.response?.data;
  return data?.mensagem ?? data?.message ?? 'Não foi possível actualizar o sortido.';
}

const ESTADOS_CRIACAO: EstadoSortido[] = ['PROPOSTO', 'APROVADO', 'EM_VENDA'];

export function SortidosPage() {
  const lojas = useQuery({ queryKey: ['lojas'], queryFn: getLojas });
  const artigos = useArtigos();
  const [lojaId, setLojaId] = useState('');
  const sortidos = useSortidos(lojaId || undefined);
  const criar = useCriarSortido();
  const actualizar = useActualizarEstadoSortido();

  const [artigoId, setArtigoId] = useState('');
  const [estado, setEstado] = useState<EstadoSortido>('EM_VENDA');
  const [localizacao, setLocalizacao] = useState('');

  const submeter = async (evento: FormEvent) => {
    evento.preventDefault();
    if (!lojaId) {
      toast.error('Seleccione a loja.');
      return;
    }
    try {
      await criar.mutateAsync({
        artigoId,
        lojaId,
        estado,
        localizacao: localizacao || undefined,
      });
      toast.success('Artigo incluído no sortido.');
      setArtigoId('');
      setLocalizacao('');
    } catch (erro) {
      toast.error(mensagemErro(erro));
    }
  };

  const mudarEstado = async (id: string, novo: EstadoSortido) => {
    try {
      await actualizar.mutateAsync({ id, estado: novo });
      toast.success(`Sortido → ${novo}`);
    } catch (erro) {
      toast.error(mensagemErro(erro));
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Store className="h-6 w-6 text-emerald-600" />
            Sortido por loja
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Quais artigos se vendem em cada loja (CAT-27).
          </p>
        </div>
        <Link
          to="/catalogo/artigos"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Artigos
        </Link>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <label className="text-sm">
          Filtrar / loja alvo
          <select
            value={lojaId}
            onChange={(e) => setLojaId(e.target.value)}
            className="mt-1 w-full max-w-md rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="">Todas as lojas</option>
            {(lojas.data ?? []).map((loja: { id: string; nome: string }) => (
              <option key={loja.id} value={loja.id}>
                {loja.nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      <form
        onSubmit={submeter}
        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className="text-sm lg:col-span-2">
          Artigo
          <select
            required
            value={artigoId}
            onChange={(e) => setArtigoId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="">Seleccione…</option>
            {(artigos.data ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.codigo} — {a.nome} ({a.estado})
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Estado inicial
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoSortido)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            {ESTADOS_CRIACAO.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Localização
          <input
            value={localizacao}
            onChange={(e) => setLocalizacao(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            placeholder="Corredor A"
          />
        </label>
        <div className="sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            disabled={criar.isPending || !lojaId}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {criar.isPending ? 'A guardar…' : 'Incluir no sortido'}
          </button>
          {!lojaId && (
            <span className="ml-3 text-xs text-amber-600">
              Seleccione uma loja acima.
            </span>
          )}
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Artigo</th>
              <th className="px-4 py-3 font-medium">Loja</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Localização</th>
              <th className="px-4 py-3 font-medium">Acção</th>
            </tr>
          </thead>
          <tbody>
            {sortidos.isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-slate-500">
                  A carregar…
                </td>
              </tr>
            )}
            {(sortidos.data ?? []).map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{s.artigo?.nome}</div>
                  <div className="font-mono text-xs text-slate-500">{s.artigo?.codigo}</div>
                </td>
                <td className="px-4 py-3">{s.loja?.nome}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                    {s.estado}
                  </span>
                </td>
                <td className="px-4 py-3">{s.localizacao ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {s.estado !== 'EM_VENDA' && s.estado !== 'RETIRADO' && (
                      <button
                        type="button"
                        onClick={() => void mudarEstado(s.id, 'EM_VENDA')}
                        className="rounded border border-emerald-200 px-2 py-0.5 text-xs text-emerald-700"
                      >
                        Em venda
                      </button>
                    )}
                    {s.estado !== 'RETIRADO' && (
                      <button
                        type="button"
                        onClick={() => void mudarEstado(s.id, 'RETIRADO')}
                        className="rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-600"
                      >
                        Retirar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!sortidos.isLoading && (sortidos.data?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-slate-500">
                  Sem entradas de sortido.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
