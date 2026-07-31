import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Calculator, Ruler } from 'lucide-react';
import { converterUnidade } from '../api/plataforma.api';
import { useUnidades } from '../hooks/usePlataforma';

function mensagemDeErro(erro: unknown): string {
  const resposta = (erro as { response?: { data?: { mensagem?: string; message?: string } } })
    ?.response?.data;
  return (
    resposta?.mensagem ??
    resposta?.message ??
    'Não foi possível converter. Verifique as unidades indicadas.'
  );
}

export function UnidadesPage() {
  const unidades = useUnidades();
  const [de, setDe] = useState('CX');
  const [para, setPara] = useState('UN');
  const [quantidade, setQuantidade] = useState('10');
  const [artigoId, setArtigoId] = useState('');

  const conversao = useMutation({
    mutationFn: () =>
      converterUnidade({
        de,
        para,
        quantidade,
        artigoId: artigoId.trim() || undefined,
      }),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Ruler className="h-6 w-6 text-emerald-600" />
          Unidades e conversão
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          O cálculo é da plataforma e a tabela é do catálogo. Um factor em falta
          bloqueia — nunca vale 1 em silêncio.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
          <Calculator className="h-4 w-4" /> Simulador
        </h2>

        <div className="grid gap-3 sm:grid-cols-4">
          <label className="text-sm text-slate-600">
            Quantidade
            <input
              value={quantidade}
              onChange={(evento) => setQuantidade(evento.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900"
              inputMode="decimal"
            />
          </label>
          <label className="text-sm text-slate-600">
            De
            <input
              value={de}
              onChange={(evento) => setDe(evento.target.value.toUpperCase())}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 font-mono text-slate-900"
              list="unidades-disponiveis"
            />
          </label>
          <label className="text-sm text-slate-600">
            Para
            <input
              value={para}
              onChange={(evento) => setPara(evento.target.value.toUpperCase())}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 font-mono text-slate-900"
              list="unidades-disponiveis"
            />
          </label>
          <label className="text-sm text-slate-600">
            Artigo <span className="text-slate-400">(opcional)</span>
            <input
              value={artigoId}
              onChange={(evento) => setArtigoId(evento.target.value)}
              placeholder="ID do artigo"
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900"
            />
          </label>
        </div>

        <datalist id="unidades-disponiveis">
          {unidades.data?.map((unidade) => (
            <option key={unidade.codigo} value={unidade.codigo}>
              {unidade.nome}
            </option>
          ))}
        </datalist>

        <button
          type="button"
          onClick={() => conversao.mutate()}
          disabled={conversao.isPending}
          className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {conversao.isPending ? 'A converter…' : 'Converter'}
        </button>

        {conversao.data && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-emerald-50 px-4 py-3 text-emerald-900">
            <span className="font-mono text-lg">
              {conversao.data.quantidade} {conversao.data.de}
            </span>
            <ArrowRight className="h-4 w-4" />
            <span className="font-mono text-lg font-bold">
              {conversao.data.resultado} {conversao.data.para}
            </span>
            <span className="text-sm text-emerald-700">
              factor {conversao.data.factor}
            </span>
          </div>
        )}

        {conversao.isError && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {mensagemDeErro(conversao.error)}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-slate-900">Unidades disponíveis</h2>
        {unidades.isLoading ? (
          <p className="text-sm text-slate-500">A carregar…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Código</th>
                  <th className="py-2 pr-4">Nome</th>
                  <th className="py-2 pr-4">Tipo</th>
                  <th className="py-2">Casas decimais</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unidades.data?.map((unidade) => (
                  <tr key={unidade.codigo}>
                    <td className="py-2 pr-4 font-mono text-slate-800">
                      {unidade.codigo}
                    </td>
                    <td className="py-2 pr-4 text-slate-700">
                      {unidade.nome} <span className="text-slate-400">({unidade.simbolo})</span>
                    </td>
                    <td className="py-2 pr-4 text-slate-600">
                      {unidade.tipo === 'DISCRETA' ? 'Discreta' : 'Contínua'}
                    </td>
                    <td className="py-2 text-slate-600">{unidade.casasDecimais}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
