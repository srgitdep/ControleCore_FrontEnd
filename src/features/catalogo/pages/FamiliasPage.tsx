import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { FolderTree, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useApagarAtributoFamilia,
  useAtributosFamilia,
  useCriarAtributoFamilia,
  useCriarFamilia,
  useFamilias,
} from '../hooks/useCatalogo';
import type { TipoAtributoFamilia } from '../types';

function mensagemErro(erro: unknown): string {
  const data = (erro as { response?: { data?: { mensagem?: string; message?: string } } })
    ?.response?.data;
  return data?.mensagem ?? data?.message ?? 'Não foi possível guardar.';
}

const TIPOS: TipoAtributoFamilia[] = [
  'TEXTO',
  'NUMERICO',
  'LISTA',
  'BOOLEANO',
  'DATA',
];

export function FamiliasPage() {
  const familias = useFamilias();
  const criar = useCriarFamilia();
  const [aberto, setAberto] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [paiId, setPaiId] = useState('');
  const [margemAlvo, setMargemAlvo] = useState('');
  const [diasAviso, setDiasAviso] = useState('');
  const [familiaAtributosId, setFamiliaAtributosId] = useState('');

  const atributos = useAtributosFamilia(familiaAtributosId || undefined);
  const criarAtributo = useCriarAtributoFamilia(familiaAtributosId);
  const apagarAtributo = useApagarAtributoFamilia(familiaAtributosId);

  const [attrCodigo, setAttrCodigo] = useState('');
  const [attrNome, setAttrNome] = useState('');
  const [attrTipo, setAttrTipo] = useState<TipoAtributoFamilia>('TEXTO');
  const [attrLista, setAttrLista] = useState('');
  const [attrObrigatorio, setAttrObrigatorio] = useState(false);

  const submeter = async (evento: FormEvent) => {
    evento.preventDefault();
    try {
      await criar.mutateAsync({
        codigo,
        nome,
        paiId: paiId || null,
        margemAlvoPerc: margemAlvo || null,
        diasAvisoValidade: diasAviso ? Number(diasAviso) : null,
      });
      toast.success('Família criada.');
      setAberto(false);
      setCodigo('');
      setNome('');
      setPaiId('');
      setMargemAlvo('');
      setDiasAviso('');
    } catch (erro) {
      toast.error(mensagemErro(erro));
    }
  };

  const submeterAtributo = async (evento: FormEvent) => {
    evento.preventDefault();
    if (!familiaAtributosId) return;
    try {
      await criarAtributo.mutateAsync({
        codigo: attrCodigo,
        nome: attrNome,
        tipo: attrTipo,
        valoresPermitidos:
          attrTipo === 'LISTA'
            ? attrLista.split(',').map((v) => v.trim()).filter(Boolean)
            : null,
        obrigatorio: attrObrigatorio,
        pesquisavel: true,
      });
      toast.success('Atributo criado.');
      setAttrCodigo('');
      setAttrNome('');
      setAttrLista('');
      setAttrObrigatorio(false);
    } catch (erro) {
      toast.error(mensagemErro(erro));
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <FolderTree className="h-6 w-6 text-emerald-600" />
            Famílias
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Árvore hierárquica e atributos personalizados (CAT-21/25).
          </p>
        </div>
        <div className="flex gap-2">
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
            <Plus className="h-4 w-4" /> Nova família
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
            Família pai
            <select
              value={paiId}
              onChange={(e) => setPaiId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">Raiz (nível 1)</option>
              {(familias.data ?? []).map((f) => (
                <option key={f.id} value={f.id}>
                  {'—'.repeat(Math.max(0, f.nivel - 1))} {f.codigo} — {f.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Margem-alvo %
            <input
              type="number"
              step="0.01"
              value={margemAlvo}
              onChange={(e) => setMargemAlvo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Herdável pelos artigos"
            />
          </label>
          <label className="text-sm">
            Dias aviso validade
            <input
              type="number"
              min="0"
              step="1"
              value={diasAviso}
              onChange={(e) => setDiasAviso(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Herdável na activação"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={criar.isPending}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {criar.isPending ? 'A guardar…' : 'Criar família'}
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
              <th className="px-4 py-3 font-medium">Nível</th>
              <th className="px-4 py-3 font-medium">Pai</th>
              <th className="px-4 py-3 font-medium">Validade</th>
              <th className="px-4 py-3 font-medium">Margem %</th>
              <th className="px-4 py-3 font-medium">Artigos</th>
              <th className="px-4 py-3 font-medium">Atributos</th>
            </tr>
          </thead>
          <tbody>
            {familias.isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-slate-500">
                  A carregar…
                </td>
              </tr>
            )}
            {(familias.data ?? []).map((familia) => (
              <tr key={familia.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-mono text-xs">{familia.codigo}</td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  <span style={{ paddingLeft: `${(familia.nivel - 1) * 12}px` }}>
                    {familia.nome}
                  </span>
                </td>
                <td className="px-4 py-3">{familia.nivel}</td>
                <td className="px-4 py-3 text-slate-600">{familia.pai?.nome ?? '—'}</td>
                <td className="px-4 py-3">{familia.diasAvisoValidade ?? '—'}</td>
                <td className="px-4 py-3">{familia.margemAlvoPerc ?? '—'}</td>
                <td className="px-4 py-3">{familia._count?.artigos ?? 0}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setFamiliaAtributosId(familia.id)}
                    className={`text-xs ${
                      familiaAtributosId === familia.id
                        ? 'font-semibold text-emerald-700'
                        : 'text-slate-600 hover:underline'
                    }`}
                  >
                    Gerir
                  </button>
                </td>
              </tr>
            ))}
            {!familias.isLoading && (familias.data?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-slate-500">
                  Ainda não há famílias.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {familiaAtributosId && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">
              Atributos —{' '}
              {(familias.data ?? []).find((f) => f.id === familiaAtributosId)?.nome ??
                'família'}
            </h2>
            <button
              type="button"
              onClick={() => setFamiliaAtributosId('')}
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              Fechar
            </button>
          </div>

          <form
            onSubmit={submeterAtributo}
            className="grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-2"
          >
            <label className="text-sm">
              Código
              <input
                required
                value={attrCodigo}
                onChange={(e) => setAttrCodigo(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
              />
            </label>
            <label className="text-sm">
              Nome
              <input
                required
                value={attrNome}
                onChange={(e) => setAttrNome(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
              />
            </label>
            <label className="text-sm">
              Tipo
              <select
                value={attrTipo}
                onChange={(e) => setAttrTipo(e.target.value as TipoAtributoFamilia)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            {attrTipo === 'LISTA' && (
              <label className="text-sm">
                Valores (separados por vírgula)
                <input
                  required
                  value={attrLista}
                  onChange={(e) => setAttrLista(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
                  placeholder="Sim, Não"
                />
              </label>
            )}
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={attrObrigatorio}
                onChange={(e) => setAttrObrigatorio(e.target.checked)}
              />
              Obrigatório na ficha do artigo
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={criarAtributo.isPending}
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                Adicionar atributo
              </button>
            </div>
          </form>

          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Código</th>
                <th className="px-3 py-2 font-medium">Nome</th>
                <th className="px-3 py-2 font-medium">Tipo</th>
                <th className="px-3 py-2 font-medium">Obrig.</th>
                <th className="px-3 py-2 font-medium">Acção</th>
              </tr>
            </thead>
            <tbody>
              {(atributos.data ?? []).map((attr) => (
                <tr key={attr.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-mono text-xs">{attr.codigo}</td>
                  <td className="px-3 py-2">{attr.nome}</td>
                  <td className="px-3 py-2">{attr.tipo}</td>
                  <td className="px-3 py-2">{attr.obrigatorio ? 'Sim' : 'Não'}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      disabled={apagarAtributo.isPending}
                      onClick={() => {
                        if (window.confirm(`Apagar atributo ${attr.codigo}?`)) {
                          void apagarAtributo
                            .mutateAsync(attr.id)
                            .then(() => toast.success('Atributo removido.'))
                            .catch((erro) => toast.error(mensagemErro(erro)));
                        }
                      }}
                      className="text-xs text-red-600 hover:underline disabled:opacity-50"
                    >
                      Apagar
                    </button>
                  </td>
                </tr>
              ))}
              {!atributos.isLoading && (atributos.data?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-slate-500">
                    Sem atributos nesta família.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
