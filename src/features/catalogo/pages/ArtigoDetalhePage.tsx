import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Barcode, Package, Tags } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useActivarArtigo,
  useActualizarAtributosArtigo,
  useAdicionarCodigoBarras,
  useArtigo,
  useCodigosBarras,
  useDescontinuarArtigo,
  useRemoverCodigoBarras,
  useSuspenderArtigo,
  useUnidadesCatalogo,
} from '../hooks/useCatalogo';
import type { DefinicaoAtributoEfectiva } from '../types';

function mensagemErro(erro: unknown): string {
  const data = (
    erro as {
      response?: {
        data?: { mensagem?: string; message?: string; detalhes?: unknown };
      };
    }
  )?.response?.data;
  return data?.mensagem ?? data?.message ?? 'Não foi possível executar a operação.';
}

function classeEstado(estado?: string) {
  if (estado === 'ACTIVO') return 'bg-emerald-50 text-emerald-700';
  if (estado === 'SUSPENSO') return 'bg-amber-50 text-amber-700';
  if (estado === 'DESCONTINUADO') return 'bg-slate-200 text-slate-700';
  return 'bg-blue-50 text-blue-700';
}

export function ArtigoDetalhePage() {
  const { id = '' } = useParams();
  const artigo = useArtigo(id);
  const codigos = useCodigosBarras(id);
  const unidades = useUnidadesCatalogo();
  const activar = useActivarArtigo();
  const suspender = useSuspenderArtigo();
  const descontinuar = useDescontinuarArtigo();
  const adicionarCodigo = useAdicionarCodigoBarras(id);
  const removerCodigo = useRemoverCodigoBarras(id);
  const actualizarAtributos = useActualizarAtributosArtigo(id);

  const [codigo, setCodigo] = useState('');
  const [unidadeId, setUnidadeId] = useState('');
  const [factor, setFactor] = useState('1');
  const [principal, setPrincipal] = useState(false);
  const [valoresAttr, setValoresAttr] = useState<Record<string, string>>({});

  useEffect(() => {
    const a = artigo.data;
    if (!a?.atributosDefinicoes) return;
    const iniciais: Record<string, string> = {};
    const actual =
      a.atributos && typeof a.atributos === 'object' && !Array.isArray(a.atributos)
        ? (a.atributos as Record<string, unknown>)
        : {};
    for (const def of a.atributosDefinicoes) {
      const v = actual[def.codigo];
      iniciais[def.codigo] =
        v === undefined || v === null ? '' : String(v);
    }
    setValoresAttr(iniciais);
  }, [artigo.data?.id, artigo.data?.atributos, artigo.data?.atributosDefinicoes]);

  const executarEstado = async (
    nome: string,
    operacao: () => Promise<unknown>,
  ) => {
    try {
      await operacao();
      toast.success(`Artigo ${nome}.`);
    } catch (erro) {
      toast.error(mensagemErro(erro));
    }
  };

  const submeterCodigo = async (evento: FormEvent) => {
    evento.preventDefault();
    try {
      await adicionarCodigo.mutateAsync({
        codigo,
        unidadeId,
        factor,
        principal,
      });
      toast.success('Código de barras adicionado.');
      setCodigo('');
      setFactor('1');
      setPrincipal(false);
    } catch (erro) {
      toast.error(mensagemErro(erro));
    }
  };

  const submeterAtributos = async (evento: FormEvent) => {
    evento.preventDefault();
    const payload: Record<string, unknown> = {};
    for (const [chave, valor] of Object.entries(valoresAttr)) {
      payload[chave] = valor === '' ? null : valor;
    }
    try {
      await actualizarAtributos.mutateAsync(payload);
      toast.success('Atributos guardados.');
    } catch (erro) {
      toast.error(mensagemErro(erro));
    }
  };

  if (artigo.isLoading) {
    return <div className="p-6 text-sm text-slate-500">A carregar artigo…</div>;
  }
  if (!artigo.data) {
    return <div className="p-6 text-sm text-red-600">Artigo não encontrado.</div>;
  }

  const a = artigo.data;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-3">
        <Link
          to="/catalogo/artigos"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar aos artigos
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <Package className="h-6 w-6 text-emerald-600" />
              {a.nome}
            </h1>
            <p className="mt-1 font-mono text-sm text-slate-500">{a.codigo}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${classeEstado(a.estado)}`}
            >
              {a.estado}
            </span>
            {(a.estado === 'RASCUNHO' || a.estado === 'SUSPENSO') && (
              <button
                type="button"
                disabled={activar.isPending}
                onClick={() =>
                  void executarEstado('activado', () => activar.mutateAsync(id))
                }
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Activar
              </button>
            )}
            {a.estado === 'ACTIVO' && (
              <button
                type="button"
                disabled={suspender.isPending}
                onClick={() =>
                  void executarEstado('suspenso', () => suspender.mutateAsync(id))
                }
                className="rounded-lg border border-amber-300 px-3 py-2 text-sm text-amber-700 disabled:opacity-50"
              >
                Suspender
              </button>
            )}
            {(a.estado === 'ACTIVO' || a.estado === 'SUSPENSO') && (
              <button
                type="button"
                disabled={descontinuar.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      'Descontinuar este artigo? A operação falha se existir sortido activo.',
                    )
                  ) {
                    void executarEstado('descontinuado', () =>
                      descontinuar.mutateAsync(id),
                    );
                  }
                }}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:opacity-50"
              >
                Descontinuar
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs uppercase text-slate-400">Família</p>
          <p className="mt-1 font-medium">{a.familia?.nome ?? 'Não definida'}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-400">Marca</p>
          <p className="mt-1 font-medium">{a.marca?.nome ?? 'Não definida'}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-400">Unidade base</p>
          <p className="mt-1 font-medium">
            {a.unidadeBase?.codigo} — {a.unidadeBase?.nome}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-400">Tipo</p>
          <p className="mt-1 font-medium">{a.tipo}</p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Herança da família</h2>
          <p className="mt-1 text-sm text-slate-500">
            Valores efectivos (próprio artigo ou herdados — CAT-22/23).
          </p>
          {a.heranca ? (
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase text-slate-400">Dias aviso validade</dt>
                <dd className="mt-1 font-medium">
                  {a.diasAvisoValidadeEfectivo ?? '—'}
                  {a.heranca.origemDiasAviso && (
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      origem: {a.heranca.origemDiasAviso}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-400">Margem-alvo família %</dt>
                <dd className="mt-1 font-medium">
                  {a.margemAlvoFamiliaPerc ?? '—'}
                  {a.heranca.origemMargemAlvo && (
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      origem: {a.heranca.origemMargemAlvo}
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Sem família — sem herança.</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Completude da ficha</h2>
          <p className="mt-1 text-sm text-slate-500">
            Dimensões aplicáveis neste corte (CAT-43).
          </p>
          {a.saude ? (
            <div className="mt-4 space-y-3">
              <div className="flex items-end justify-between gap-3">
                <span className="text-3xl font-semibold text-slate-900">
                  {a.saude.completudePerc}%
                </span>
                <Link
                  to="/catalogo"
                  className="text-xs text-emerald-700 hover:underline"
                >
                  Ver saúde do catálogo
                </Link>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(100, a.saude.completudePerc)}%` }}
                />
              </div>
              {a.saude.emFalta.length > 0 && (
                <p className="text-sm text-amber-700">
                  Em falta: {a.saude.emFalta.join(', ')}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Sem dados de saúde.</p>
          )}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Tags className="h-5 w-5 text-emerald-600" />
            Atributos da família
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Valores tipados herdados da árvore de famílias (CAT-25).
          </p>
        </div>

        {(a.atributosDefinicoes?.length ?? 0) === 0 ? (
          <p className="text-sm text-slate-500">
            {a.familiaId
              ? 'Esta família ainda não tem atributos definidos.'
              : 'Atribua uma família ao artigo para preencher atributos.'}
          </p>
        ) : (
          <form
            onSubmit={submeterAtributos}
            className="grid gap-3 sm:grid-cols-2"
          >
            {(a.atributosDefinicoes ?? []).map((def: DefinicaoAtributoEfectiva) => (
              <label key={def.codigo} className="text-sm">
                {def.nome}
                {def.obrigatorio ? ' *' : ''}
                <span className="ml-2 text-xs text-slate-400">
                  {def.tipo}
                  {def.origemFamiliaCodigo
                    ? ` · ${def.origemFamiliaCodigo}`
                    : ''}
                </span>
                {def.tipo === 'LISTA' ? (
                  <select
                    required={def.obrigatorio}
                    value={valoresAttr[def.codigo] ?? ''}
                    onChange={(e) =>
                      setValoresAttr((prev) => ({
                        ...prev,
                        [def.codigo]: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <option value="">—</option>
                    {(def.valoresPermitidos ?? []).map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                ) : def.tipo === 'BOOLEANO' ? (
                  <select
                    required={def.obrigatorio}
                    value={valoresAttr[def.codigo] ?? ''}
                    onChange={(e) =>
                      setValoresAttr((prev) => ({
                        ...prev,
                        [def.codigo]: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <option value="">—</option>
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                ) : (
                  <input
                    required={def.obrigatorio}
                    type={
                      def.tipo === 'NUMERICO'
                        ? 'number'
                        : def.tipo === 'DATA'
                          ? 'date'
                          : 'text'
                    }
                    value={valoresAttr[def.codigo] ?? ''}
                    onChange={(e) =>
                      setValoresAttr((prev) => ({
                        ...prev,
                        [def.codigo]: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                )}
              </label>
            ))}
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={actualizarAtributos.isPending}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {actualizarAtributos.isPending
                  ? 'A guardar…'
                  : 'Guardar atributos'}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Barcode className="h-5 w-5 text-emerald-600" />
            Códigos de barras
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Cada código indica a unidade e quantas unidades base representa (CAT-04).
          </p>
        </div>

        <form
          onSubmit={submeterCodigo}
          className="grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-4"
        >
          <label className="text-sm">
            Código
            <input
              required
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Unidade
            <select
              required
              value={unidadeId}
              onChange={(e) => setUnidadeId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <option value="">Seleccione…</option>
              {(unidades.data ?? []).map((unidade) => (
                <option key={unidade.id} value={unidade.id}>
                  {unidade.codigo} — {unidade.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Factor para unidade base
            <input
              required
              type="number"
              min="0.000001"
              step="0.000001"
              value={factor}
              onChange={(e) => setFactor(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
            />
          </label>
          <div className="flex items-end gap-3">
            <label className="mb-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={principal}
                onChange={(e) => setPrincipal(e.target.checked)}
              />
              Principal
            </label>
            <button
              type="submit"
              disabled={adicionarCodigo.isPending}
              className="ml-auto rounded-lg bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              Adicionar
            </button>
          </div>
        </form>

        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Unidade</th>
                <th className="px-4 py-3 font-medium">Factor</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Acção</th>
              </tr>
            </thead>
            <tbody>
              {(codigos.data ?? []).map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono">{item.codigo}</td>
                  <td className="px-4 py-3">{item.unidade?.codigo ?? '—'}</td>
                  <td className="px-4 py-3">{item.factor}</td>
                  <td className="px-4 py-3">
                    {item.principal ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                        Principal
                      </span>
                    ) : (
                      'Adicional'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={removerCodigo.isPending}
                      onClick={() => {
                        if (window.confirm(`Remover o código ${item.codigo}?`)) {
                          void removerCodigo
                            .mutateAsync(item.id)
                            .then(() => toast.success('Código removido.'))
                            .catch((erro) => toast.error(mensagemErro(erro)));
                        }
                      }}
                      className="text-xs text-red-600 hover:underline disabled:opacity-50"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
              {!codigos.isLoading && (codigos.data?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-slate-500">
                    Sem códigos de barras.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
