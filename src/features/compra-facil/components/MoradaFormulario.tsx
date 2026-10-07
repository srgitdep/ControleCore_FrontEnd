import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Loader2, LocateFixed } from 'lucide-react';
import toast from 'react-hot-toast';
import { MapaEntregaLazy } from '@/shared/ui/mapa/MapaEntregaLazy';
import type { PontoNoMapa } from '@/shared/ui/mapa/MapaEntrega';
import { ligacaoNoMapa, obterMelhorPosicao } from '@/shared/utils/geolocalizacao';
import { PROVINCIAS_MOCAMBIQUE } from '../api/entrega.api';
import type { DadosEndereco, EnderecoCliente } from '../api/entrega.api';

const esquema = z.object({
  rotulo: z.string().max(40),
  linha1: z.string().trim().min(1),
  referencia: z.string().max(200),
  bairro: z.string().max(80),
  cidade: z.string().trim().min(1),
  provincia: z.string().min(1),
  contactoNome: z.string().max(120),
  contactoTelefone: z.string().max(30),
  isPadrao: z.boolean(),
});
type Valores = z.infer<typeof esquema>;

interface MoradaFormularioProps {
  inicial?: EnderecoCliente;
  aGuardar: boolean;
  aoGuardar: (dados: DadosEndereco) => void;
  aoCancelar: () => void;
}

const classeCampo =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none';

/**
 * Criar ou editar uma morada. O pino no mapa é obrigatório: sem ponto não há distância, e
 * sem distância não há taxa. Os campos de texto são o que guia o estafeta quando a rua não
 * tem nome — por isso a «referência» ao lado da morada.
 */
export function MoradaFormulario({ inicial, aGuardar, aoGuardar, aoCancelar }: MoradaFormularioProps) {
  const { t } = useTranslation('loja');
  const [ponto, setPonto] = useState<PontoNoMapa | null>(
    inicial ? { latitude: inicial.latitude, longitude: inicial.longitude } : null,
  );
  const [semPonto, setSemPonto] = useState(false);
  const [aLocalizar, setALocalizar] = useState(false);
  const [precisao, setPrecisao] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: {
      rotulo: inicial?.rotulo ?? '',
      linha1: inicial?.linha1 ?? '',
      referencia: inicial?.referencia ?? '',
      bairro: inicial?.bairro ?? '',
      cidade: inicial?.cidade ?? '',
      provincia: inicial?.provincia ?? '',
      contactoNome: inicial?.contactoNome ?? '',
      contactoTelefone: inicial?.contactoTelefone ?? '',
      isPadrao: inicial?.isPadrao ?? false,
    },
  });

  // A câmara e a localização só existem em contexto seguro (HTTPS ou localhost): fora dele
  // o botão nem aparece, em vez de falhar em silêncio ao ser premido.
  const podeLocalizar = typeof window !== 'undefined' && window.isSecureContext && 'geolocation' in navigator;

  // Ouve o GPS alguns segundos e fica com a melhor posição (a primeira costuma ser a rede
  // Wi-Fi ou o IP, com centenas de metros de erro). Cada melhoria aparece logo no mapa.
  const localizar = () => {
    setALocalizar(true);
    obterMelhorPosicao(navigator.geolocation, {
      aoMelhorar: (p) => {
        setPonto({ latitude: p.latitude, longitude: p.longitude });
        setPrecisao(p.precisaoMetros);
        setSemPonto(false);
      },
    })
      .catch(() => toast.error(t('moradas.localizacao_negada')))
      .finally(() => setALocalizar(false));
  };

  const submeter = handleSubmit((v) => {
    if (!ponto) {
      setSemPonto(true);
      return;
    }
    // Opcionais vazios seguem como `undefined`: o servidor não aceita `""` como valor.
    const vazioParaUndefined = (s: string) => (s.trim() === '' ? undefined : s.trim());
    aoGuardar({
      rotulo: vazioParaUndefined(v.rotulo) ?? null,
      linha1: v.linha1,
      referencia: vazioParaUndefined(v.referencia) ?? null,
      bairro: vazioParaUndefined(v.bairro) ?? null,
      cidade: v.cidade,
      provincia: v.provincia,
      latitude: ponto.latitude,
      longitude: ponto.longitude,
      contactoNome: vazioParaUndefined(v.contactoNome) ?? null,
      contactoTelefone: vazioParaUndefined(v.contactoTelefone) ?? null,
      isPadrao: v.isPadrao,
    });
  });

  return (
    <form onSubmit={submeter} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-700">{t('moradas.campo_rotulo')}</label>
          <input {...register('rotulo')} placeholder={t('moradas.rotulo_exemplo')} className={classeCampo} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">{t('moradas.campo_linha1')} *</label>
          <input {...register('linha1')} autoComplete="street-address" className={classeCampo} />
          {errors.linha1 && <p className="mt-1 text-xs text-red-600">{t('moradas.obrigatorio')}</p>}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">{t('moradas.campo_referencia')}</label>
        <input {...register('referencia')} placeholder={t('moradas.referencia_exemplo')} className={classeCampo} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-slate-700">{t('moradas.campo_bairro')}</label>
          <input {...register('bairro')} className={classeCampo} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">{t('moradas.campo_cidade')} *</label>
          <input {...register('cidade')} className={classeCampo} />
          {errors.cidade && <p className="mt-1 text-xs text-red-600">{t('moradas.obrigatorio')}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">{t('moradas.campo_provincia')} *</label>
          <select {...register('provincia')} className={classeCampo}>
            <option value="">{t('moradas.escolher_provincia')}</option>
            {PROVINCIAS_MOCAMBIQUE.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {errors.provincia && <p className="mt-1 text-xs text-red-600">{t('moradas.obrigatorio')}</p>}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <label className="block text-xs font-medium text-slate-700">{t('moradas.pino')} *</label>
          {podeLocalizar && (
            <button
              type="button"
              onClick={localizar}
              disabled={aLocalizar}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {aLocalizar ? <Loader2 size={12} className="animate-spin" /> : <LocateFixed size={12} />}
              {aLocalizar ? t('moradas.a_afinar') : t('moradas.usar_localizacao')}
            </button>
          )}
        </div>
        <p className="mb-2 text-xs text-slate-400">{t('moradas.pino_ajuda')}</p>
        <MapaEntregaLazy
          marcador={ponto}
          precisaoMetros={precisao}
          aoEscolher={(p) => {
            setPonto(p);
            // Marcar à mão substitui o GPS: a margem de erro deixa de se aplicar.
            setPrecisao(null);
            setSemPonto(false);
          }}
        />
        {ponto && (
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
            <span className="font-mono">
              {ponto.latitude.toFixed(5)}, {ponto.longitude.toFixed(5)}
            </span>
            {precisao !== null && (
              <span className={precisao > 100 ? 'text-amber-700' : 'text-emerald-700'}>
                {precisao > 100
                  ? t('moradas.gps_precisao_baixa', { metros: precisao })
                  : t('moradas.gps_precisao', { metros: precisao })}
              </span>
            )}
            <a href={ligacaoNoMapa(ponto.latitude, ponto.longitude)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
              {t('moradas.ver_no_mapa')}
            </a>
          </p>
        )}
        {semPonto && <p className="mt-1 text-xs text-red-600">{t('moradas.pino_obrigatorio')}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-700">{t('moradas.campo_contacto_nome')}</label>
          <input {...register('contactoNome')} className={classeCampo} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">{t('moradas.campo_contacto_telefone')}</label>
          <input {...register('contactoTelefone')} type="tel" className={classeCampo} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" {...register('isPadrao')} className="h-4 w-4 rounded border-slate-300" />
        {t('moradas.tornar_padrao')}
      </label>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={aoCancelar}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {t('moradas.cancelar')}
        </button>
        <button
          type="submit"
          disabled={aGuardar}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {aGuardar && <Loader2 size={14} className="animate-spin" />}
          {t('moradas.guardar')}
        </button>
      </div>
    </form>
  );
}
