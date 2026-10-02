import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, Sliders } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { mensagemDeErro } from '@/shared/utils';
import { b2bApi } from '../api/b2b.api';
import type { PesosSourcing } from '../api/b2b.api';

type CampoPercentual = Exclude<
  keyof PesosSourcing,
  'id' | 'empresaId' | 'taxaJuroAnual' | 'custoAdministrativoPorFornecedor' | 'confiancaMinima'
>;

const FACTORES: { campo: CampoPercentual; chave: 'custo' | 'cobertura' | 'prazo' | 'pontualidade' | 'cumprimento' | 'divergencia' | 'conformidade' | 'relacao' }[] = [
  { campo: 'pesoCusto', chave: 'custo' },
  { campo: 'pesoCobertura', chave: 'cobertura' },
  { campo: 'pesoPrazo', chave: 'prazo' },
  { campo: 'pesoPontualidade', chave: 'pontualidade' },
  { campo: 'pesoCumprimento', chave: 'cumprimento' },
  { campo: 'pesoDivergencia', chave: 'divergencia' },
  { campo: 'pesoConformidade', chave: 'conformidade' },
  { campo: 'pesoRelacao', chave: 'relacao' },
];

/**
 * Os pesos que decidem o ranking do sourcing.
 *
 * ## Não têm de somar 100
 *
 * A pontuação normaliza pela soma dos pesos que a empresa definir — ver
 * `pontuacao-fornecedor.ts`. Zerar um factor exclui-o do cálculo; não é preciso compensar
 * subindo outro.
 *
 * ## Porque não há pré-visualização em tempo real
 *
 * Cada corrida de sourcing fica congelada com os pesos que tinha no momento — é o que
 * permite dizer, meses depois, que a decisão de Março usou uma configuração diferente da de
 * hoje. Mudar aqui não altera nenhuma comparação já feita, só as próximas.
 */
export function PesosSourcingPage() {
  const { t } = useTranslation('b2b');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [valores, setValores] = useState<Partial<PesosSourcing> | null>(null);

  const { data: pesos, isLoading } = useQuery({
    queryKey: ['pesos-sourcing'],
    queryFn: () => b2bApi.obterPesos(),
  });

  useEffect(() => {
    if (pesos) setValores(pesos);
  }, [pesos]);

  const guardar = useMutation({
    mutationFn: (payload: Partial<Omit<PesosSourcing, 'id' | 'empresaId'>>) =>
      b2bApi.actualizarPesos(payload),
    onSuccess: (novo) => {
      queryClient.setQueryData(['pesos-sourcing'], novo);
      toast.success(t('pesos.sucesso'));
    },
    onError: (e: unknown) => toast.error(mensagemDeErro(e, t('pesos.erro'))),
  });

  if (isLoading || !valores) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={22} className="animate-spin text-slate-400" />
      </div>
    );
  }

  const alterar = (campo: keyof PesosSourcing, valor: number) => {
    setValores((antes) => ({ ...antes, [campo]: valor }));
  };

  const somaPesos = FACTORES.reduce((soma, f) => soma + (valores[f.campo] ?? 0), 0);

  const submeter = (e: React.FormEvent) => {
    e.preventDefault();
    const { id: _id, empresaId: _empresaId, ...payload } = valores as PesosSourcing;
    guardar.mutate(payload);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <button
          onClick={() => navigate('/requisicoes')}
          className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={13} />
          {t('pesos.voltar')}
        </button>
        <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Sliders size={18} className="text-blue-600" />
          {t('pesos.titulo')}
        </h1>
        <p className="mt-0.5 text-xs text-slate-500">
          {t('pesos.subtitulo')}
        </p>
      </header>

      <form onSubmit={submeter} className="space-y-5 rounded-lg border border-slate-200 bg-white p-5">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">{t('pesos.factores')}</h2>
            <span className="text-xs text-slate-500">{t('pesos.soma_actual', { soma: somaPesos })}</span>
          </div>

          <div className="space-y-4">
            {FACTORES.map(({ campo, chave }) => (
              <div key={campo}>
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor={campo} className="text-sm font-medium text-slate-800">
                    {t(`pesos.factor.${chave}`)}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={valores[campo] ?? 0}
                    onChange={(e) => alterar(campo, Number(e.target.value))}
                    className="w-16 rounded-md border border-slate-300 px-2 py-1 text-right text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <input
                  id={campo}
                  type="range"
                  min={0}
                  max={100}
                  value={valores[campo] ?? 0}
                  onChange={(e) => alterar(campo, Number(e.target.value))}
                  className="mt-1.5 w-full accent-blue-600"
                />
                <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{t(`pesos.factor_ajuda.${chave}`)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-4">
          <h2 className="text-sm font-semibold text-slate-900">{t('pesos.outros')}</h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-slate-700">
                {t('pesos.juro')}
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step="any"
                value={valores.taxaJuroAnual ?? 0}
                onChange={(e) => alterar('taxaJuroAnual', Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <p className="mt-1 text-[11px] leading-snug text-slate-500">
                {t('pesos.juro_ajuda')}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                {t('pesos.custo_admin')}
              </label>
              <input
                type="number"
                min={0}
                step="any"
                value={valores.custoAdministrativoPorFornecedor ?? 0}
                onChange={(e) => alterar('custoAdministrativoPorFornecedor', Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <p className="mt-1 text-[11px] leading-snug text-slate-500">
                {t('pesos.custo_admin_ajuda')}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                {t('pesos.confianca')}
              </label>
              <input
                type="number"
                min={0}
                max={1}
                step="0.01"
                value={valores.confiancaMinima ?? 0}
                onChange={(e) => alterar('confiancaMinima', Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <p className="mt-1 text-[11px] leading-snug text-slate-500">
                {t('pesos.confianca_ajuda')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <button
            type="submit"
            disabled={guardar.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {guardar.isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            {t('pesos.guardar')}
          </button>
        </div>
      </form>
    </div>
  );
}
