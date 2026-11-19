import { useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApagarPerfil, useRenomearPerfil } from '../hooks/usePerfis';
import type { PerfilDeAcesso } from '../api/permissoes.api';

interface Props {
  perfil: PerfilDeAcesso;
  onApagado: () => void;
}

/** Renomear e apagar um perfil da empresa. Os de sistema não chegam aqui. */
export function AccoesDoPerfil({ perfil, onApagado }: Props) {
  const { t } = useTranslation('shell');
  const renomear = useRenomearPerfil();
  const apagar = useApagarPerfil();
  const [aRenomear, setARenomear] = useState(false);
  const [nome, setNome] = useState(perfil.nome);

  const guardarNome = () => {
    const novo = nome.trim();
    if (!novo || novo === perfil.nome) {
      setARenomear(false);
      return;
    }
    renomear.mutate({ id: perfil.id, nome: novo }, { onSuccess: () => setARenomear(false) });
  };

  const aoApagar = () => {
    // O servidor recusa um perfil em uso e diz a quantos utilizadores; a confirmação aqui
    // é para o caso em que ninguém o usa e o apagar é definitivo.
    if (!window.confirm(t('permissoes.gerir.confirmar_apagar', { nome: perfil.nome }))) return;
    apagar.mutate(perfil.id, { onSuccess: onApagado });
  };

  if (aRenomear) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          maxLength={60}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') guardarNome();
            if (e.key === 'Escape') setARenomear(false);
          }}
          className="w-44 rounded-md border border-slate-300 px-2 py-1 text-sm"
          aria-label={t('permissoes.gerir.nome')}
        />
        <button type="button" onClick={guardarNome} disabled={renomear.isPending} className="rounded p-1 text-emerald-600 hover:bg-emerald-50" aria-label={t('permissoes.gerir.guardar_nome')}>
          <Check size={16} />
        </button>
        <button type="button" onClick={() => setARenomear(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label={t('permissoes.gerir.fechar')}>
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => {
          setNome(perfil.nome);
          setARenomear(true);
        }}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
      >
        <Pencil size={13} />
        {t('permissoes.gerir.renomear')}
      </button>
      <button
        type="button"
        onClick={aoApagar}
        disabled={apagar.isPending}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60"
      >
        <Trash2 size={13} />
        {t('permissoes.gerir.apagar')}
      </button>
    </div>
  );
}
