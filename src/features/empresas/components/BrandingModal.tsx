import { useState } from 'react';
import { X, Palette, Loader2 } from 'lucide-react';
import { useUpdateBranding } from '../hooks/useEmpresas';
import type { Empresa, TemaBranding } from '../types';

interface Props {
  empresa: Empresa;
  onClose: () => void;
}

const CAMPOS_COR: { campo: keyof typeof INICIAL; rotulo: string }[] = [
  { campo: 'corPrimaria', rotulo: 'Cor primária' },
  { campo: 'corSecundaria', rotulo: 'Cor secundária' },
  { campo: 'corAcento', rotulo: 'Cor de acento' },
  { campo: 'corTexto', rotulo: 'Cor do texto' },
  { campo: 'corFundo', rotulo: 'Cor de fundo' },
];

const INICIAL = {
  corPrimaria: '',
  corSecundaria: '',
  corAcento: '',
  corTexto: '',
  corFundo: '',
  tipografiaTitulo: '',
  tipografiaCorpo: '',
  logoUrl: '',
  logoBrancoUrl: '',
  faviconUrl: '',
};

/**
 * A identidade visual da empresa: cores, tipografia, logótipo e tema.
 *
 * ## Sem estado inicial conhecido
 *
 * Não há rota para ler o branding actual — só para o escrever — por isso o formulário
 * abre em branco e não pré-preenchido. Um campo deixado vazio não é enviado: só se
 * submete o que foi de facto preenchido, para não apagar acidentalmente um valor já
 * configurado que este ecrã não consegue mostrar.
 *
 * CSS customizado fica de fora de propósito: aceitá-lo por um formulário seria abrir uma
 * porta de XSS armazenado — o CSS entraria directamente na página de qualquer utilizador
 * que a visse.
 */
export function BrandingModal({ empresa, onClose }: Props) {
  const [form, setForm] = useState(INICIAL);
  const [tema, setTema] = useState<TemaBranding>('AUTO');

  const mutation = useUpdateBranding();

  const submeter = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Record<string, string> = {};
    for (const [chave, valor] of Object.entries(form)) {
      if (valor.trim()) payload[chave] = valor.trim();
    }

    mutation.mutate(
      { id: empresa.id, data: { ...payload, tema } },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <form onSubmit={submeter} className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-violet-100 p-2">
              <Palette className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Identidade visual</h2>
              <p className="text-xs text-slate-500">{empresa.nome}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[65vh] space-y-5 overflow-y-auto p-6">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Cores</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {CAMPOS_COR.map(({ campo, rotulo }) => (
                <div key={campo}>
                  <label className="mb-1 block text-xs font-medium text-slate-600">{rotulo}</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={form[campo] || '#ffffff'}
                      onChange={(e) => setForm({ ...form, [campo]: e.target.value })}
                      className="h-8 w-8 shrink-0 cursor-pointer rounded border border-slate-200"
                    />
                    <input
                      type="text"
                      value={form[campo]}
                      onChange={(e) => setForm({ ...form, [campo]: e.target.value })}
                      placeholder="#000000"
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Tipografia</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Títulos</label>
                <input
                  type="text"
                  value={form.tipografiaTitulo}
                  onChange={(e) => setForm({ ...form, tipografiaTitulo: e.target.value })}
                  placeholder="Ex.: Inter"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Corpo</label>
                <input
                  type="text"
                  value={form.tipografiaCorpo}
                  onChange={(e) => setForm({ ...form, tipografiaCorpo: e.target.value })}
                  placeholder="Ex.: Inter"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Imagens</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Logótipo (URL)</label>
                <input
                  type="text"
                  value={form.logoUrl}
                  onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Logótipo em branco (URL) <span className="font-normal text-slate-400">— para fundos escuros</span>
                </label>
                <input
                  type="text"
                  value={form.logoBrancoUrl}
                  onChange={(e) => setForm({ ...form, logoBrancoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Favicon (URL)</label>
                <input
                  type="text"
                  value={form.faviconUrl}
                  onChange={(e) => setForm({ ...form, faviconUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Tema</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['CLARO', 'ESCURO', 'AUTO'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTema(t)}
                  className={`rounded-lg border-2 px-3 py-2 text-xs font-medium transition-colors ${
                    tema === t
                      ? 'border-violet-400 bg-violet-50 text-violet-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t === 'CLARO' ? 'Claro' : t === 'ESCURO' ? 'Escuro' : 'Automático'}
                </button>
              ))}
            </div>
          </div>

          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Só os campos preenchidos são enviados — os que ficarem em branco não alteram o
            que já estiver configurado.
          </p>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 p-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
