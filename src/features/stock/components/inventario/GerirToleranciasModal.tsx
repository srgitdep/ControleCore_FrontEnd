import { useState } from 'react';
import { X, Sliders, Plus, Trash2, Package, Tags } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useTolerancias,
  useCriarTolerancia,
  useAtualizarTolerancia,
  useDesativarTolerancia,
} from '@/features/stock';
import { useProducts, useCategories } from '@/features/produtos';
import { Button } from '@/shared/ui';
import type { ToleranciaInventario } from '@/features/stock';

/**
 * Cadastro de Tolerâncias (§10): sem nenhuma tolerância configurada, o motor
 * de reconciliação usa a "omissão segura" — qualquer divergência não-zero
 * dispara recontagem. Esta tela é o que permite ao Gestor afinar isso por
 * produto ou por categoria.
 */
export function GerirToleranciasModal({ onClose }: { onClose: () => void }) {
  const { data: tolerancias = [], isLoading } = useTolerancias();
  const [formularioAberto, setFormularioAberto] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Sliders className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Tolerâncias</h2>
              <p className="text-xs text-slate-500">
                Sem tolerância, qualquer divergência dispara recontagem (§10).
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {formularioAberto ? (
            <NovaToleranciaForm onCancelar={() => setFormularioAberto(false)} onCriada={() => setFormularioAberto(false)} />
          ) : (
            <Button onClick={() => setFormularioAberto(true)} className="mb-4 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Nova tolerância
            </Button>
          )}

          {isLoading ? (
            <p className="py-8 text-center text-sm text-slate-400">A carregar...</p>
          ) : tolerancias.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              Nenhuma tolerância configurada — toda divergência dispara recontagem.
            </p>
          ) : (
            <div className="space-y-2">
              {tolerancias.map((t) => (
                <ToleranciaLinha key={t.id} tolerancia={t} />
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 text-right">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}

function ToleranciaLinha({ tolerancia }: { tolerancia: ToleranciaInventario }) {
  const [editando, setEditando] = useState(false);
  const atualizar = useAtualizarTolerancia();
  const desativar = useDesativarTolerancia();

  const [qtd, setQtd] = useState(tolerancia.toleranciaQtd?.toString() ?? '');
  const [pct, setPct] = useState(tolerancia.toleranciaPct?.toString() ?? '');
  const [valor, setValor] = useState(tolerancia.toleranciaValor?.toString() ?? '');

  const salvar = () => {
    const payload = {
      toleranciaQtd: qtd.trim() === '' ? undefined : parseFloat(qtd),
      toleranciaPct: pct.trim() === '' ? undefined : parseFloat(pct),
      toleranciaValor: valor.trim() === '' ? undefined : parseFloat(valor),
    };
    atualizar.mutate(
      { id: tolerancia.id, payload },
      {
        onSuccess: () => {
          toast.success('Tolerância atualizada.');
          setEditando(false);
        },
        onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Não foi possível atualizar.'),
      },
    );
  };

  const remover = () => {
    desativar.mutate(tolerancia.id, {
      onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Não foi possível desativar.'),
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {tolerancia.produto ? (
            <Package className="h-4 w-4 shrink-0 text-blue-500" />
          ) : (
            <Tags className="h-4 w-4 shrink-0 text-purple-500" />
          )}
          <span className="truncate text-sm font-medium text-slate-800">
            {tolerancia.produto?.nome ?? tolerancia.categoria?.nome ?? '—'}
          </span>
          {tolerancia.criticidade && (
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
              {tolerancia.criticidade}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button onClick={() => setEditando((e) => !e)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 text-xs font-medium px-2">
            {editando ? 'Cancelar' : 'Editar'}
          </button>
          <button onClick={remover} className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {editando ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <LimiteInput label="Quantidade" value={qtd} onChange={setQtd} />
          <LimiteInput label="Percentagem" value={pct} onChange={setPct} />
          <LimiteInput label="Valor (MZN)" value={valor} onChange={setValor} />
          <div className="col-span-3">
            <Button size="sm" className="w-full" onClick={salvar} disabled={atualizar.isPending}>
              {atualizar.isPending ? 'A guardar...' : 'Guardar'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
          {tolerancia.toleranciaQtd != null && <span>Qtd: {tolerancia.toleranciaQtd}</span>}
          {tolerancia.toleranciaPct != null && <span>Pct: {tolerancia.toleranciaPct}%</span>}
          {tolerancia.toleranciaValor != null && <span>Valor: {tolerancia.toleranciaValor} MZN</span>}
        </div>
      )}
    </div>
  );
}

function LimiteInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] text-slate-500">{label}</label>
      <input
        type="number"
        min={0}
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function NovaToleranciaForm({ onCancelar, onCriada }: { onCancelar: () => void; onCriada: () => void }) {
  const [alvo, setAlvo] = useState<'produto' | 'categoria'>('produto');
  const [busca, setBusca] = useState('');
  const [alvoId, setAlvoId] = useState<string | null>(null);
  const [alvoNome, setAlvoNome] = useState('');
  const [qtd, setQtd] = useState('');
  const [pct, setPct] = useState('');
  const [valor, setValor] = useState('');
  const [criticidade, setCriticidade] = useState('');

  const { data: resultadoProdutos } = useProducts(alvo === 'produto' && busca.trim() ? { search: busca.trim(), limit: 8 } : undefined);
  const { data: categorias = [] } = useCategories();
  const criar = useCriarTolerancia();

  const sugestoesProdutos = resultadoProdutos?.data ?? [];
  const sugestoesCategorias = categorias.filter((c: any) => c.nome.toLowerCase().includes(busca.trim().toLowerCase()));

  const submeter = () => {
    if (!alvoId) {
      toast.error('Selecione um produto ou categoria.');
      return;
    }
    if (!qtd.trim() && !pct.trim() && !valor.trim()) {
      toast.error('Informe pelo menos um limite.');
      return;
    }

    criar.mutate(
      {
        productId: alvo === 'produto' ? alvoId : undefined,
        categoriaId: alvo === 'categoria' ? alvoId : undefined,
        toleranciaQtd: qtd.trim() ? parseFloat(qtd) : undefined,
        toleranciaPct: pct.trim() ? parseFloat(pct) : undefined,
        toleranciaValor: valor.trim() ? parseFloat(valor) : undefined,
        criticidade: criticidade.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Tolerância criada.');
          onCriada();
        },
        onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Não foi possível criar a tolerância.'),
      },
    );
  };

  return (
    <div className="mb-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setAlvo('produto'); setAlvoId(null); setAlvoNome(''); setBusca(''); }}
          className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${alvo === 'produto' ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500'}`}
        >
          Por Produto
        </button>
        <button
          type="button"
          onClick={() => { setAlvo('categoria'); setAlvoId(null); setAlvoNome(''); setBusca(''); }}
          className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${alvo === 'categoria' ? 'border-purple-300 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-500'}`}
        >
          Por Categoria
        </button>
      </div>

      {alvoId ? (
        <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
          <span className="font-medium text-slate-800">{alvoNome}</span>
          <button onClick={() => { setAlvoId(null); setAlvoNome(''); }} className="text-xs text-slate-400 hover:text-slate-600">
            Trocar
          </button>
        </div>
      ) : (
        <div>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={alvo === 'produto' ? 'Pesquisar produto...' : 'Pesquisar categoria...'}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {busca.trim() && (
            <div className="mt-1 max-h-32 overflow-y-auto rounded-lg border border-slate-100 bg-white">
              {alvo === 'produto'
                ? sugestoesProdutos.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => { setAlvoId(p.id); setAlvoNome(p.nome); }}
                      className="block w-full px-3 py-2 text-left text-xs hover:bg-slate-50"
                    >
                      {p.nome}
                    </button>
                  ))
                : sugestoesCategorias.map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => { setAlvoId(c.id); setAlvoNome(c.nome); }}
                      className="block w-full px-3 py-2 text-left text-xs hover:bg-slate-50"
                    >
                      {c.nome}
                    </button>
                  ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <LimiteInput label="Quantidade" value={qtd} onChange={setQtd} />
        <LimiteInput label="Percentagem" value={pct} onChange={setPct} />
        <LimiteInput label="Valor (MZN)" value={valor} onChange={setValor} />
      </div>

      <input
        value={criticidade}
        onChange={(e) => setCriticidade(e.target.value)}
        placeholder="Criticidade (opcional, ex: ALTA)"
        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button size="sm" className="flex-1" onClick={submeter} disabled={criar.isPending}>
          {criar.isPending ? 'A criar...' : 'Criar tolerância'}
        </Button>
      </div>
    </div>
  );
}
