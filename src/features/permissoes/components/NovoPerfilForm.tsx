import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCriarPerfil } from '../hooks/usePerfis';
import type { PerfilDeAcesso } from '../api/permissoes.api';

interface Props {
  perfis: PerfilDeAcesso[];
  onCriado: (perfil: PerfilDeAcesso) => void;
  onFechar: () => void;
}

/**
 * Um perfil novo da empresa. «Copiar de» poupa marcar as caixas uma a uma: quem quer um
 * «Gestor sem financeiro» parte do Gestor e desmarca uma linha.
 */
export function NovoPerfilForm({ perfis, onCriado, onFechar }: Props) {
  const { t } = useTranslation('shell');
  const criar = useCriarPerfil();
  const [nome, setNome] = useState('');
  const [copiarDe, setCopiarDe] = useState('');

  const aoSubmeter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    criar.mutate(
      { nome: nome.trim(), copiarDe: copiarDe || undefined },
      { onSuccess: onCriado },
    );
  };

  return (
    <form onSubmit={aoSubmeter} className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/40 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">{t('permissoes.gerir.novo_titulo')}</p>
        <button type="button" onClick={onFechar} className="text-slate-400 hover:text-slate-600" aria-label={t('permissoes.gerir.fechar')}>
          <X size={16} />
        </button>
      </div>

      <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
        {t('permissoes.gerir.nome')}
        <input
          required
          autoFocus
          maxLength={60}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder={t('permissoes.gerir.nome_exemplo')}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
        {t('permissoes.gerir.copiar_de')}
        <select
          value={copiarDe}
          onChange={(e) => setCopiarDe(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal"
        >
          <option value="">{t('permissoes.gerir.comecar_vazio')}</option>
          {perfis.map((p) => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={criar.isPending || !nome.trim()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {criar.isPending && <Loader2 size={14} className="animate-spin" />}
        {t('permissoes.gerir.criar')}
      </button>
    </form>
  );
}
