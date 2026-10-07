import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Bike, Check, Copy, KeyRound, Loader2, Pencil, Plus, Power, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/shared/utils';
import { Can } from '@/features/auth';
import { useConfiguracaoEntrega } from '../hooks/useEntregaGestao';
import {
  useActualizarEstafeta,
  useCriarEstafeta,
  useEstafetas,
  useReporSenhaEstafeta,
} from '../hooks/useOperacao';
import type { CredenciaisEstafeta, Estafeta } from '../types/operacao';

const classeCampo =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none';

/**
 * As credenciais de um estafeta, **mostradas uma só vez**. O servidor só guarda o hash da senha:
 * se a janela se fechar sem a anotar, não há como a ver outra vez — a saída é «repor senha».
 */
function CredenciaisUmaVez({
  nome,
  credenciais,
  aoFechar,
}: {
  nome: string;
  credenciais: CredenciaisEstafeta;
  aoFechar: () => void;
}) {
  const { t } = useTranslation('entrega');
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    const texto = `${t('estafetas.credenciais.codigo')}: ${credenciais.codigo}\n${t('estafetas.credenciais.senha')}: ${credenciais.senha}`;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
    } catch {
      // Sem permissão de área de transferência (HTTP, browser antigo): a pessoa copia à mão.
      toast.error(t('estafetas.credenciais.copiar_falhou'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h2 className="text-base font-bold text-slate-900">{t('estafetas.credenciais.titulo', { nome })}</h2>
        <p className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {t('estafetas.credenciais.aviso')}
        </p>

        <dl className="mt-4 space-y-3">
          <div>
            <dt className="text-xs font-medium text-slate-500">{t('estafetas.credenciais.codigo')}</dt>
            <dd className="mt-1 rounded-lg bg-slate-100 px-3 py-2 font-mono text-lg font-bold tracking-wider text-slate-900">{credenciais.codigo}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">{t('estafetas.credenciais.senha')}</dt>
            <dd className="mt-1 rounded-lg bg-slate-100 px-3 py-2 font-mono text-lg font-bold tracking-wider text-slate-900">{credenciais.senha}</dd>
          </div>
        </dl>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => void copiar()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {copiado ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            {copiado ? t('estafetas.credenciais.copiado') : t('estafetas.credenciais.copiar')}
          </button>
          <button type="button" onClick={aoFechar} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            {t('estafetas.credenciais.fechar')}
          </button>
        </div>
      </div>
    </div>
  );
}

interface FormularioProps {
  estafeta?: Estafeta;
  lojas: { id: string; nome: string }[];
  aProcessar: boolean;
  aoGuardar: (dados: { nome: string; telefone: string; email?: string; veiculo?: string; matricula?: string; lojaIds: string[] }) => void;
  aoFechar: () => void;
}

function FormularioEstafeta({ estafeta, lojas, aProcessar, aoGuardar, aoFechar }: FormularioProps) {
  const { t } = useTranslation('entrega');
  const [nome, setNome] = useState(estafeta?.nome ?? '');
  const [telefone, setTelefone] = useState(estafeta?.telefone ?? '');
  const [email, setEmail] = useState(estafeta?.email ?? '');
  const [veiculo, setVeiculo] = useState(estafeta?.veiculo ?? '');
  const [matricula, setMatricula] = useState(estafeta?.matricula ?? '');
  const [lojaIds, setLojaIds] = useState<string[]>(estafeta?.lojas.map((l) => l.id) ?? []);

  const alternarLoja = (id: string) =>
    setLojaIds((actuais) => (actuais.includes(id) ? actuais.filter((x) => x !== id) : [...actuais, id]));

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <form
        className="w-full max-w-lg space-y-4 overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
        style={{ maxHeight: '90vh' }}
        onSubmit={(e) => {
          e.preventDefault();
          aoGuardar({
            nome: nome.trim(),
            telefone: telefone.trim(),
            ...(email.trim() ? { email: email.trim() } : {}),
            ...(veiculo.trim() ? { veiculo: veiculo.trim() } : {}),
            ...(matricula.trim() ? { matricula: matricula.trim() } : {}),
            lojaIds,
          });
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">{estafeta ? t('estafetas.editar') : t('estafetas.novo')}</h2>
          <button type="button" onClick={aoFechar} aria-label="×" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-700">{t('estafetas.nome')} *</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={120} className={classeCampo} autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">{t('estafetas.telefone')} *</label>
            <input value={telefone} onChange={(e) => setTelefone(e.target.value)} required maxLength={30} type="tel" className={classeCampo} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">{t('estafetas.email')}</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={classeCampo} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">{t('estafetas.veiculo')}</label>
            <input value={veiculo} onChange={(e) => setVeiculo(e.target.value)} maxLength={40} placeholder="MOTA" className={classeCampo} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">{t('estafetas.matricula')}</label>
            <input value={matricula} onChange={(e) => setMatricula(e.target.value)} maxLength={20} className={classeCampo} />
          </div>
        </div>

        <fieldset>
          <legend className="text-xs font-medium text-slate-700">{t('estafetas.lojas')}</legend>
          <p className="text-xs text-slate-400">{t('estafetas.lojas_ajuda')}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {lojas.map((l) => (
              <label
                key={l.id}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium',
                  lojaIds.includes(l.id) ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-300 text-slate-600',
                )}
              >
                <input type="checkbox" checked={lojaIds.includes(l.id)} onChange={() => alternarLoja(l.id)} className="sr-only" />
                {l.nome}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={aoFechar} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            {t('dialogo.cancelar')}
          </button>
          <button
            type="submit"
            disabled={aProcessar || nome.trim() === '' || telefone.trim() === ''}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {aProcessar && <Loader2 size={14} className="animate-spin" />}
            {t('estafetas.guardar')}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Quem faz as entregas (US-05). O servidor gera o código `E####` e a senha inicial; o gestor
 * entrega-os ao estafeta e **vê-os uma só vez**. «Em entrega» não é um estado guardado: deriva-se
 * das entregas em curso, para nunca ficar desalinhado do painel.
 */
export function EstafetasPage() {
  const { t } = useTranslation('entrega');
  const [inactivos, setInactivos] = useState(false);
  const estafetas = useEstafetas(inactivos);
  const configuracao = useConfiguracaoEntrega();
  const criar = useCriarEstafeta();
  const actualizar = useActualizarEstafeta();
  const reporSenha = useReporSenhaEstafeta();

  // `undefined` = fechado; `null` = novo; objecto = a editar.
  const [aEditar, setAEditar] = useState<Estafeta | null | undefined>(undefined);
  const [credenciais, setCredenciais] = useState<{ nome: string; dados: CredenciaisEstafeta } | null>(null);
  const lojas = configuracao.data?.lojas ?? [];

  const guardar: FormularioProps['aoGuardar'] = (dados) => {
    if (aEditar) {
      actualizar.mutate({ id: aEditar.id, payload: dados }, { onSuccess: () => setAEditar(undefined) });
      return;
    }
    criar.mutate(dados, {
      onSuccess: (resposta) => {
        setAEditar(undefined);
        setCredenciais({ nome: resposta.estafeta.nome, dados: resposta.credenciais });
      },
    });
  };

  const repor = (e: Estafeta) => {
    if (!window.confirm(t('estafetas.repor_confirmar', { nome: e.nome }))) return;
    reporSenha.mutate(e.id, { onSuccess: (r) => setCredenciais({ nome: e.nome, dados: r.credenciais }) });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Bike size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t('estafetas.titulo')}</h1>
            <p className="text-sm text-slate-500">{t('estafetas.subtitulo')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={inactivos} onChange={(e) => setInactivos(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            {t('estafetas.mostrar_inactivos')}
          </label>
          <Can action="manage" resource="estafetas">
            <button
              type="button"
              onClick={() => setAEditar(null)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={14} />
              {t('estafetas.novo')}
            </button>
          </Can>
        </div>
      </header>

      {estafetas.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : estafetas.isError ? (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle size={16} />
          {t('estafetas.erro')}
        </p>
      ) : estafetas.data && estafetas.data.length > 0 ? (
        <ul className="space-y-2.5">
          {estafetas.data.map((e) => (
            <li key={e.id} className={cn('rounded-xl border bg-white p-4', e.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60')}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                    {e.nome}
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">{e.codigo}</span>
                    {!e.isActive && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">{t('estafetas.inactivo')}</span>}
                    {e.isActive && e._count.entregas > 0 && (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-700">
                        {t('estafetas.em_entrega', { count: e._count.entregas })}
                      </span>
                    )}
                    {e.isActive && e._count.entregas === 0 && e.estado === 'INDISPONIVEL' && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">{t('estafetas.indisponivel')}</span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {[e.telefone, e.veiculo, e.matricula].filter(Boolean).join(' · ')}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {e.lojas.length === 0 ? t('estafetas.lojas_todas') : e.lojas.map((l) => l.nome).join(', ')}
                  </p>
                </div>

                <Can action="manage" resource="estafetas">
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    <button type="button" onClick={() => setAEditar(e)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      <Pencil size={12} />
                      {t('estafetas.editar_curto')}
                    </button>
                    {e.isActive && (
                      <>
                        <button
                          type="button"
                          disabled={actualizar.isPending}
                          onClick={() =>
                            actualizar.mutate({ id: e.id, payload: { estado: e.estado === 'INDISPONIVEL' ? 'DISPONIVEL' : 'INDISPONIVEL' } })
                          }
                          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          {e.estado === 'INDISPONIVEL' ? t('estafetas.marcar_disponivel') : t('estafetas.marcar_indisponivel')}
                        </button>
                        <button
                          type="button"
                          disabled={reporSenha.isPending}
                          onClick={() => repor(e)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          <KeyRound size={12} />
                          {t('estafetas.repor_senha')}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      disabled={actualizar.isPending}
                      onClick={() => actualizar.mutate({ id: e.id, payload: { isActive: !e.isActive } })}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50',
                        e.isActive ? 'border-rose-300 text-rose-700 hover:bg-rose-50' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50',
                      )}
                    >
                      <Power size={12} />
                      {e.isActive ? t('estafetas.desactivar') : t('estafetas.reactivar')}
                    </button>
                  </div>
                </Can>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">{t('estafetas.vazio')}</p>
      )}

      {aEditar !== undefined && (
        <FormularioEstafeta
          key={aEditar?.id ?? 'novo'}
          estafeta={aEditar ?? undefined}
          lojas={lojas}
          aProcessar={criar.isPending || actualizar.isPending}
          aoGuardar={guardar}
          aoFechar={() => setAEditar(undefined)}
        />
      )}

      {credenciais && (
        <CredenciaisUmaVez nome={credenciais.nome} credenciais={credenciais.dados} aoFechar={() => setCredenciais(null)} />
      )}
    </div>
  );
}
