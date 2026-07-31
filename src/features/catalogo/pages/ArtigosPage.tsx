import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Package, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useActivarArtigo,
  useArtigos,
  useCriarArtigo,
  useFamilias,
  useMarcas,
  useUnidadesCatalogo,
} from '../hooks/useCatalogo';
import type { TipoArtigo } from '../types';

function mensagemErro(erro: unknown): string {
  const data = (erro as { response?: { data?: { mensagem?: string; message?: string } } })
    ?.response?.data;
  return data?.mensagem ?? data?.message ?? 'Não foi possível guardar o artigo.';
}

const TIPOS: TipoArtigo[] = [
  'MERCADORIA',
  'CONSUMIVEL_LOJA',
  'EMBALAGEM',
  'SERVICO',
  'ACTIVO_BAIXO_VALOR',
];

function corEstado(estado: string) {
  if (estado === 'ACTIVO') return 'bg-emerald-50 text-emerald-700';
  if (estado === 'SUSPENSO') return 'bg-slate-100 text-slate-600';
  return 'bg-amber-50 text-amber-700';
}

export function ArtigosPage() {
  const artigos = useArtigos();
  const unidades = useUnidadesCatalogo();
  const familias = useFamilias();
  const marcas = useMarcas();
  const criar = useCriarArtigo();
  const activar = useActivarArtigo();
  const [aberto, setAberto] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [tipo, setTipo] = useState<TipoArtigo>('MERCADORIA');
  const [unidadeBaseId, setUnidadeBaseId] = useState('');
  const [familiaId, setFamiliaId] = useState('');
  const [marcaId, setMarcaId] = useState('');

  const submeter = async (evento: FormEvent) => {
    evento.preventDefault();
    try {
      await criar.mutateAsync({
        codigo,
        nome,
        codigoBarras: codigoBarras || undefined,
        tipo,
        unidadeBaseId,
        familiaId: familiaId || undefined,
        marcaId: marcaId || undefined,
      });
      toast.success('Artigo criado em rascunho.');
      setAberto(false);
      setCodigo('');
      setNome('');
      setCodigoBarras('');
      setFamiliaId('');
      setMarcaId('');
    } catch (erro) {
      toast.error(mensagemErro(erro));
    }
  };

  const activarArtigo = async (id: string) => {
    try {
      const resultado = await activar.mutateAsync(id);
      toast.success('Artigo activado.');
      for (const aviso of resultado.avisos ?? []) {
        toast(aviso, { icon: 'ℹ️' });
      }
    } catch (erro) {
      toast.error(mensagemErro(erro));
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Package className="h-6 w-6 text-emerald-600" />
            Catálogo de artigos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sem preço nem custo — definição, família e activação.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/catalogo"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Saúde
          </Link>
          <Link
            to="/catalogo/familias"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Famílias
          </Link>
          <Link
            to="/catalogo/marcas"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Marcas
          </Link>
          <Link
            to="/catalogo/sortidos"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Sortido
          </Link>
          <Link
            to="/catalogo/unidades"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Unidades
          </Link>
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" /> Novo artigo
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
          <label className="text-sm">
            Código de barras
            <input
              value={codigoBarras}
              onChange={(e) => setCodigoBarras(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Tipo
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoArtigo)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Família
            <select
              value={familiaId}
              onChange={(e) => setFamiliaId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">Opcional em rascunho…</option>
              {(familias.data ?? []).map((f) => (
                <option key={f.id} value={f.id}>
                  {'—'.repeat(Math.max(0, f.nivel - 1))} {f.codigo} — {f.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Marca
            <select
              value={marcaId}
              onChange={(e) => setMarcaId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">Opcional…</option>
              {(marcas.data ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.codigo} — {m.nome}
                  {m.marcaPropria ? ' (própria)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Unidade base (stock)
            <select
              required
              value={unidadeBaseId}
              onChange={(e) => setUnidadeBaseId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">Seleccione…</option>
              {(unidades.data ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.codigo} — {u.nome}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={criar.isPending}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {criar.isPending ? 'A guardar…' : 'Criar artigo'}
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
              <th className="px-4 py-3 font-medium">Família</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Unidade</th>
              <th className="px-4 py-3 font-medium">Acção</th>
            </tr>
          </thead>
          <tbody>
            {artigos.isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-slate-500">
                  A carregar…
                </td>
              </tr>
            )}
            {(artigos.data ?? []).map((artigo) => (
              <tr key={artigo.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-mono text-xs">{artigo.codigo}</td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  <Link
                    to={`/catalogo/artigos/${artigo.id}`}
                    className="hover:text-emerald-700 hover:underline"
                  >
                    {artigo.nome}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {artigo.familia?.nome ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${corEstado(artigo.estado)}`}>
                    {artigo.estado}
                  </span>
                </td>
                <td className="px-4 py-3">{artigo.unidadeBase?.codigo ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/catalogo/artigos/${artigo.id}`}
                      className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      Abrir
                    </Link>
                    {(artigo.estado === 'RASCUNHO' || artigo.estado === 'SUSPENSO') && (
                    <button
                      type="button"
                      disabled={activar.isPending}
                      onClick={() => void activarArtigo(artigo.id)}
                      className="rounded-md border border-emerald-200 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                    >
                      Activar
                    </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!artigos.isLoading && (artigos.data?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-slate-500">
                  Ainda não há artigos no catálogo novo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
