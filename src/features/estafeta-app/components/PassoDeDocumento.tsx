import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { AlertTriangle, CheckCircle2, Loader2, ScanText } from 'lucide-react';
import { cn, mensagemDeErro } from '@/shared/utils';
import {
  aplicarSugestao,
  cameraDoPasso,
  camposDoPasso,
  errosDoFormulario,
  errosDoServidor,
  ranhurasDoPasso,
} from '../domain/onboarding';
import { useConfirmarDocumento, useEnviarImagem, useLerDocumento } from '../hooks/useOnboarding';
import {
  CAMPOS_DE_DATA,
  ehTipoComDados,
  type CampoDoDocumento,
  type CampoRecusado,
  type DadosDoDocumento,
  type LadoDaImagem,
  type LeituraDeDocumento,
  type MotivoDeRecusaDoCampo,
  type PassoDoOnboarding,
} from '../types/onboarding';
import { CapturaDeDocumento } from './CapturaDeDocumento';

const paraTexto = (dados: DadosDoDocumento | null | undefined): Record<string, string> =>
  Object.fromEntries(Object.entries(dados ?? {}).map(([k, v]) => [k, String(v)]));

/**
 * Um passo do assistente: tirar as fotografias, deixar a IA **sugerir** os dados, corrigi-los e confirmá-los
 * (plano §4.9, F2).
 *
 * ## A leitura é uma sugestão, e quem decide é o estafeta
 *
 * O botão «Ler os dados» preenche só os campos em branco (`aplicarSugestao`): o que a pessoa já escreveu nunca é
 * pisado por uma leitura nova. Um campo que a IA não leu fica por preencher — **escreve-se à mão**; não existe
 * «confirmar com campo vazio». Os dados só ficam quando o servidor os aceita.
 *
 * ## Os erros dizem qual campo
 *
 * A validação de cortesia apanha o evidente antes de enviar; os erros do servidor (documento expirado, data no
 * futuro…) chegam com a lista dos campos e marcam-se um a um — um aviso geral não diria o que corrigir.
 */
export function PassoDeDocumento({ passo }: { passo: PassoDoOnboarding }) {
  const { t } = useTranslation('estafeta');
  const { tipo } = passo;
  const comDados = ehTipoComDados(tipo);

  const enviar = useEnviarImagem();
  const ler = useLerDocumento();
  const confirmar = useConfirmarDocumento();

  const [dados, setDados] = useState<Record<string, string>>(() => paraTexto(passo.dados));
  const [erros, setErros] = useState<Partial<Record<CampoDoDocumento, MotivoDeRecusaDoCampo>>>({});
  const [aEnviar, setAEnviar] = useState<LadoDaImagem | null>(null);
  const [leitura, setLeitura] = useState<LeituraDeDocumento | null>(null);

  // Os dados confirmados no servidor (ao abrir, ou depois de confirmar) entram no formulário. Só chegam com o
  // documento confirmado, pelo que não pisam uma edição em curso.
  useEffect(() => {
    if (passo.dados) setDados(paraTexto(passo.dados));
  }, [passo.dados]);

  const imagemDoLado = (lado: LadoDaImagem) => passo.imagens.find((i) => i.lado === lado);

  const aoEscolher = (lado: LadoDaImagem, ficheiro: File) => {
    setAEnviar(lado);
    // Uma fotografia nova torna a leitura anterior obsoleta.
    setLeitura(null);
    enviar.mutate({ tipo, lado, ficheiro }, { onSettled: () => setAEnviar(null) });
  };

  const aoLer = () => {
    ler.mutate(tipo, {
      onSuccess: (resultado) => {
        setLeitura(resultado);
        setDados((actual) => paraTexto(aplicarSugestao(actual as DadosDoDocumento, resultado.dados)));
        setErros({});
      },
    });
  };

  const aoConfirmar = () => {
    const locais = errosDoFormulario(tipo, dados as DadosDoDocumento);
    setErros(locais);
    if (Object.keys(locais).length > 0) return;

    confirmar.mutate(
      { tipo, dados: dados as DadosDoDocumento },
      {
        onSuccess: () => toast.success(t('onboarding.mensagens.confirmado')),
        onError: (erro) => {
          const doServidor = (erro as { response?: { data?: { erros?: CampoRecusado[] } } }).response?.data?.erros;
          const marcados = errosDoServidor(tipo, doServidor);
          if (Object.keys(marcados).length > 0) setErros(marcados);
          else toast.error(mensagemDeErro(erro, t('onboarding.mensagens.erro_confirmar')));
        },
      },
    );
  };

  const imagensCompletas = passo.imagensEmFalta.length === 0;
  const campos = camposDoPasso(tipo);

  return (
    <section className="space-y-4" aria-labelledby={`passo-${tipo}`}>
      <div>
        <h2 id={`passo-${tipo}`} className="text-lg font-bold text-slate-900">
          {t(`onboarding.passos.${tipo}.titulo`)}
        </h2>
        <p className="mt-1 text-sm text-slate-600">{t(`onboarding.passos.${tipo}.ajuda`)}</p>
      </div>

      <div className="space-y-3">
        {ranhurasDoPasso(tipo).map(({ lado, obrigatoria }) => (
          <CapturaDeDocumento
            key={lado}
            lado={lado}
            obrigatoria={obrigatoria}
            camera={cameraDoPasso(tipo)}
            imagem={imagemDoLado(lado)}
            aEnviar={aEnviar === lado}
            aoEscolher={(f) => aoEscolher(lado, f)}
          />
        ))}
      </div>

      {comDados && imagensCompletas && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
          <button
            type="button"
            onClick={aoLer}
            disabled={ler.isPending || aEnviar !== null}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white active:bg-slate-800 disabled:opacity-50"
          >
            {ler.isPending ? <Loader2 size={16} className="animate-spin" /> : <ScanText size={16} />}
            {ler.isPending ? t('onboarding.ler.a_ler') : t('onboarding.ler.botao')}
          </button>

          {leitura && (
            <p
              role="status"
              className={cn(
                'flex items-start gap-2 rounded-xl p-3 text-sm',
                leitura.indisponivel || leitura.semResultado ? 'bg-amber-50 text-amber-900' : 'bg-blue-50 text-blue-900',
              )}
            >
              {leitura.indisponivel || leitura.semResultado ? (
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              ) : (
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              )}
              {leitura.indisponivel
                ? t('onboarding.ler.indisponivel')
                : leitura.semResultado
                  ? t('onboarding.ler.sem_resultado')
                  : t('onboarding.ler.sugestao')}
            </p>
          )}

          <form
            className="space-y-3"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              aoConfirmar();
            }}
          >
            {campos.map((campo) => {
              const motivo = erros[campo];
              const ehData = CAMPOS_DE_DATA.includes(campo);
              const id = `campo-${tipo}-${campo}`;
              return (
                <div key={campo}>
                  <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
                    {t(`onboarding.campos.${campo}`)}
                  </label>
                  <input
                    id={id}
                    type={ehData ? 'date' : 'text'}
                    inputMode={campo === 'nuit' || campo === 'anoVeiculo' ? 'numeric' : undefined}
                    autoComplete="off"
                    value={dados[campo] ?? ''}
                    onChange={(e) => {
                      setDados((d) => ({ ...d, [campo]: e.target.value }));
                      if (motivo) setErros((x) => ({ ...x, [campo]: undefined }));
                    }}
                    aria-invalid={motivo ? true : undefined}
                    aria-describedby={motivo ? `${id}-erro` : undefined}
                    className={cn(
                      'min-h-12 w-full rounded-xl border bg-white px-3 text-base text-slate-900',
                      motivo ? 'border-red-400' : 'border-slate-300',
                    )}
                  />
                  {motivo && (
                    <p id={`${id}-erro`} className="mt-1 text-xs font-medium text-red-600" role="alert">
                      {t(`onboarding.erros.${motivo}`)}
                    </p>
                  )}
                </div>
              );
            })}

            <button
              type="submit"
              disabled={confirmar.isPending || aEnviar !== null}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white active:bg-emerald-700 disabled:opacity-50"
            >
              {confirmar.isPending && <Loader2 size={16} className="animate-spin" />}
              {passo.dados && !passo.faltaConfirmar ? t('onboarding.reconfirmar') : t('onboarding.confirmar')}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
