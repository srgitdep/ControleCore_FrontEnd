import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, CheckCircle2, ImageIcon, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { ImagemDoPasso, LadoDaImagem } from '../types/onboarding';

/**
 * Uma fotografia de um documento: tirar com a câmara, ver o que se enviou e repetir (plano §4.9, F2).
 *
 * ## A câmara e a galeria
 *
 * O botão principal abre a **câmara** (`capture`): um documento fotografado na hora está actual e o telemóvel
 * enquadra-o. A galeria fica como segunda via — quem já tem a fotografia, ou cuja câmara não abre dentro do
 * navegador, não fica preso.
 *
 * ## O que este componente não faz
 *
 * Não comprime nem envia: devolve o ficheiro a quem o chamou (`aoEscolher`), que o comprime no telemóvel e envia
 * (`useEnviarImagem`). A pré-visualização é o URL de 5 minutos que o servidor devolveu — a imagem que **ficou
 * guardada**, não a que o navegador tem em memória, para o estafeta ver o que de facto foi.
 */
export function CapturaDeDocumento({
  lado,
  obrigatoria,
  camera,
  imagem,
  aEnviar,
  aoEscolher,
}: {
  lado: LadoDaImagem;
  obrigatoria: boolean;
  camera: 'environment' | 'user';
  imagem?: ImagemDoPasso;
  aEnviar: boolean;
  aoEscolher: (ficheiro: File) => void;
}) {
  const { t } = useTranslation('estafeta');
  const daCamara = useRef<HTMLInputElement>(null);
  const daGaleria = useRef<HTMLInputElement>(null);

  const escolher = (lista: FileList | null) => {
    const ficheiro = lista?.[0];
    if (ficheiro) aoEscolher(ficheiro);
  };

  const rotulo = t(`onboarding.lado.${lado}`);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border bg-white',
        imagem ? 'border-emerald-200' : 'border-slate-200',
      )}
    >
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          {imagem && <CheckCircle2 size={16} className="shrink-0 text-emerald-600" aria-hidden />}
          {rotulo}
          {!obrigatoria && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
              {t('onboarding.opcional')}
            </span>
          )}
        </span>
        {aEnviar && (
          <span className="flex items-center gap-1.5 text-xs text-slate-500" role="status">
            <Loader2 size={14} className="animate-spin" />
            {t('onboarding.a_enviar')}
          </span>
        )}
      </div>

      {imagem ? (
        <img
          src={imagem.url}
          alt={t('onboarding.imagem_enviada', { lado: rotulo })}
          className="mx-4 mt-3 max-h-56 w-[calc(100%-2rem)] rounded-xl bg-slate-100 object-contain"
        />
      ) : (
        <div className="mx-4 mt-3 flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-300">
          <Camera size={30} aria-hidden />
        </div>
      )}

      <div className="flex gap-2 p-4">
        <button
          type="button"
          disabled={aEnviar}
          onClick={() => daCamara.current?.click()}
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white active:bg-blue-700 disabled:opacity-50"
        >
          {imagem ? <RefreshCw size={16} /> : <Camera size={16} />}
          {imagem ? t('onboarding.repetir') : t('onboarding.fotografar')}
        </button>
        <button
          type="button"
          disabled={aEnviar}
          onClick={() => daGaleria.current?.click()}
          aria-label={t('onboarding.da_galeria')}
          title={t('onboarding.da_galeria')}
          className="flex min-h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 active:bg-slate-200 disabled:opacity-50"
        >
          <ImageIcon size={18} />
        </button>
      </div>

      {/* O `value` volta a vazio depois de cada escolha: sem isto, escolher a MESMA fotografia outra vez (depois de
          uma recusa do servidor) não dispararia o evento e o botão pareceria avariado. */}
      <input
        ref={daCamara}
        type="file"
        accept="image/*"
        capture={camera}
        className="hidden"
        onChange={(e) => {
          escolher(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={daGaleria}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          escolher(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
