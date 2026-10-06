import { useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Loader2, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { LojaTopo } from '../components/LojaTopo';
import { VoltarLink } from '../components/VoltarLink';
import { MoradaFormulario } from '../components/MoradaFormulario';
import { useContaClienteStore } from '../store/useContaClienteStore';
import { useEnderecos, useGuardarEndereco, useRemoverEndereco } from '../hooks/useEntrega';
import type { EnderecoCliente } from '../api/entrega.api';

/**
 * As moradas do cliente. Quando vem do checkout (`state.de`), o «voltar» leva-o de volta
 * a ele, com a morada acabada de criar já seleccionável.
 */
export function MoradasPage() {
  const { lojaId } = useParams<{ lojaId: string }>();
  const { state } = useLocation() as { state: { de?: string } | null };
  const navegar = useNavigate();
  const { autenticado, aCarregar } = useContaClienteStore();
  const { t } = useTranslation('loja');

  const enderecos = useEnderecos(autenticado);
  const guardar = useGuardarEndereco();
  const remover = useRemoverEndereco();

  // `undefined` = a lista; `null` = formulário de morada nova; objecto = a editar.
  const [aEditar, setAEditar] = useState<EnderecoCliente | null | undefined>(undefined);

  if (!lojaId) return null;

  if (aCarregar) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={22} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!autenticado) {
    return <Navigate to={`/loja/${lojaId}/entrar`} state={{ de: `/loja/${lojaId}/moradas` }} replace />;
  }

  const voltarPara = state?.de ?? `/loja/${lojaId}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <LojaTopo lojaId={lojaId} />

      <div className="cc-caixa max-w-3xl py-8">
        <VoltarLink to={voltarPara}>{t('moradas.voltar')}</VoltarLink>

        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold text-slate-900">{t('moradas.titulo')}</h1>
          {aEditar === undefined && (
            <button
              type="button"
              onClick={() => setAEditar(null)}
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
            >
              <Plus size={15} />
              {t('moradas.nova')}
            </button>
          )}
        </div>

        {aEditar !== undefined ? (
          <MoradaFormulario
            inicial={aEditar ?? undefined}
            aGuardar={guardar.isPending}
            aoCancelar={() => setAEditar(undefined)}
            aoGuardar={(dados) =>
              guardar.mutate(
                { id: aEditar?.id, dados },
                {
                  onSuccess: () => {
                    setAEditar(undefined);
                    // Veio do checkout para criar a primeira morada: volta lá de seguida.
                    if (state?.de && !aEditar) navegar(state.de, { replace: true });
                  },
                },
              )
            }
          />
        ) : enderecos.isLoading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : enderecos.isError ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {t('moradas.erro_carregar')}
          </p>
        ) : enderecos.data && enderecos.data.length > 0 ? (
          <ul className="space-y-3">
            {enderecos.data.map((e) => (
              <li key={e.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Home size={14} className="text-slate-400" />
                      {e.rotulo ?? e.linha1}
                      {e.isPadrao && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">
                          {t('moradas.padrao')}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {e.linha1}
                      {e.bairro ? `, ${e.bairro}` : ''}
                    </p>
                    <p className="text-xs text-slate-400">
                      {e.cidade}, {e.provincia}
                    </p>
                    {e.referencia && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin size={11} />
                        {e.referencia}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => setAEditar(e)}
                      aria-label={t('moradas.editar')}
                      className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remover.mutate(e.id)}
                      disabled={remover.isPending}
                      aria-label={t('moradas.remover')}
                      className="rounded-full p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <MapPin size={28} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">{t('moradas.nenhuma')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
