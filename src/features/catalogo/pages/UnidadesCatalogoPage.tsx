import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Ruler } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useConversoesCatalogo,
  useCriarConversaoCatalogo,
  useCriarUnidadeCatalogo,
  useUnidadesCatalogo,
} from '../hooks/useCatalogo';
import type { TipoUnidadeMedida } from '../types';

function mensagemErro(erro: unknown): string {
  const data = (erro as { response?: { data?: { mensagem?: string; message?: string } } })
    ?.response?.data;
  return data?.mensagem ?? data?.message ?? 'Operação falhou.';
}

export function UnidadesCatalogoPage() {
  const unidades = useUnidadesCatalogo();
  const conversoes = useConversoesCatalogo();
  const criarUnidade = useCriarUnidadeCatalogo();
  const criarConversao = useCriarConversaoCatalogo();

  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [simbolo, setSimbolo] = useState('');
  const [tipo, setTipo] = useState<TipoUnidadeMedida>('DISCRETA');
  const [deId, setDeId] = useState('');
  const [paraId, setParaId] = useState('');
  const [factor, setFactor] = useState('24');

  const submeterUnidade = async (evento: FormEvent) => {
    evento.preventDefault();
    try {
      await criarUnidade.mutateAsync({ codigo, nome, simbolo, tipo });
      toast.success('Unidade criada.');
      setCodigo('');
      setNome('');
      setSimbolo('');
    } catch (erro) {
      toast.error(mensagemErro(erro));
    }
  };

  const submeterConversao = async (evento: FormEvent) => {
    evento.preventDefault();
    try {
      await criarConversao.mutateAsync({ deId, paraId, factor });
      toast.success('Conversão definida.');
    } catch (erro) {
      toast.error(mensagemErro(erro));
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Ruler className="h-6 w-6 text-emerald-600" />
          Unidades e conversões
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          CAT-15 / CAT-16 — fecha K7. Simulador rápido em{' '}
          <Link to="/unidades" className="text-emerald-700 underline">
            /unidades
          </Link>
          .
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={submeterUnidade}
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
        >
          <h2 className="font-semibold text-slate-900">Nova unidade</h2>
          <input
            required
            placeholder="Código (CX)"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="Símbolo"
            value={simbolo}
            onChange={(e) => setSimbolo(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoUnidadeMedida)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="DISCRETA">Discreta</option>
            <option value="CONTINUA">Contínua</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
          >
            Criar unidade
          </button>
        </form>

        <form
          onSubmit={submeterConversao}
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
        >
          <h2 className="font-semibold text-slate-900">Nova conversão global</h2>
          <select
            required
            value={deId}
            onChange={(e) => setDeId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">De…</option>
            {(unidades.data ?? []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.codigo}
              </option>
            ))}
          </select>
          <select
            required
            value={paraId}
            onChange={(e) => setParaId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Para…</option>
            {(unidades.data ?? []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.codigo}
              </option>
            ))}
          </select>
          <input
            required
            type="number"
            step="any"
            min="0"
            placeholder="Factor"
            value={factor}
            onChange={(e) => setFactor(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white"
          >
            Definir conversão
          </button>
        </form>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-semibold">Unidades</h2>
          <ul className="space-y-1 text-sm">
            {(unidades.data ?? []).map((u) => (
              <li key={u.id} className="flex justify-between border-b border-slate-50 py-1">
                <span>
                  <span className="font-mono font-medium">{u.codigo}</span> {u.nome}
                </span>
                <span className="text-slate-400">{u.tipo}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-semibold">Conversões</h2>
          <ul className="space-y-1 text-sm">
            {(conversoes.data ?? []).map((c) => (
              <li key={c.id} className="border-b border-slate-50 py-1 font-mono text-xs">
                1 {c.de.codigo} = {c.factor} {c.para.codigo}
                {c.artigoId ? ' (artigo)' : ' (global)'}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
