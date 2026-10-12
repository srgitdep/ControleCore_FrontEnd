import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Camera, CheckCircle2, ChevronRight, CircleDashed, Loader2, PartyPopper, User } from 'lucide-react';
import { cn } from '@/shared/utils';
import { PassoDeDocumento } from '../components/PassoDeDocumento';
import { passosCompletos, pedeContactoDeEmergencia, primeiroPassoPorFazer } from '../domain/onboarding';
import { useConcluirOnboarding, useContactoDeEmergencia, useEstadoOnboarding } from '../hooks/useOnboarding';
import type { EstadoDoOnboarding, TipoDeDocumento } from '../types/onboarding';

/** O contacto de emergência: o único contacto que um estafeta criado pelo gestor ainda não deu. */
function ContactoDeEmergenciaForm() {
  const { t } = useTranslation('estafeta');
  const guardar = useContactoDeEmergencia();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');

  const pronto = nome.trim().length > 0 && telefone.trim().length > 0;

  return (
    <form
      className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (pronto) guardar.mutate({ nome: nome.trim(), telefone: telefone.trim() });
      }}
    >
      <h2 className="flex items-center gap-2 text-base font-bold text-amber-900">
        <User size={16} />
        {t('onboarding.contacto.titulo')}
      </h2>
      <p className="text-sm text-amber-900">{t('onboarding.contacto.ajuda')}</p>
      <div>
        <label htmlFor="emerg-nome" className="mb-1 block text-sm font-medium text-slate-700">
          {t('onboarding.contacto.nome')}
        </label>
        <input
          id="emerg-nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          autoComplete="off"
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base"
        />
      </div>
      <div>
        <label htmlFor="emerg-tel" className="mb-1 block text-sm font-medium text-slate-700">
          {t('onboarding.contacto.telefone')}
        </label>
        <input
          id="emerg-tel"
          type="tel"
          inputMode="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          autoComplete="off"
          placeholder="84 123 4567"
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base"
        />
      </div>
      <button
        type="submit"
        disabled={!pronto || guardar.isPending}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 text-sm font-bold text-white disabled:opacity-50"
      >
        {guardar.isPending && <Loader2 size={16} className="animate-spin" />}
        {t('onboarding.contacto.guardar')}
      </button>
    </form>
  );
}

/** A lista de passos, com o estado de cada um — toca-se num para saltar para ele. */
function Passos({
  estado,
  activo,
  aoEscolher,
}: {
  estado: EstadoDoOnboarding;
  activo: TipoDeDocumento | null;
  aoEscolher: (tipo: TipoDeDocumento) => void;
}) {
  const { t } = useTranslation('estafeta');

  return (
    <ol className="space-y-2" aria-label={t('onboarding.passos_etiqueta')}>
      {estado.passos.map((p) => {
        const completo = p.estado === 'COMPLETO';
        return (
          <li key={p.tipo}>
            <button
              type="button"
              onClick={() => aoEscolher(p.tipo)}
              aria-current={activo === p.tipo ? 'step' : undefined}
              className={cn(
                'flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 text-left',
                activo === p.tipo ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white',
              )}
            >
              {completo ? (
                <CheckCircle2 size={20} className="shrink-0 text-emerald-600" aria-hidden />
              ) : p.estado === 'IMAGENS_ENVIADAS' ? (
                <Camera size={20} className="shrink-0 text-amber-500" aria-hidden />
              ) : (
                <CircleDashed size={20} className="shrink-0 text-slate-300" aria-hidden />
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-900">{t(`onboarding.passos.${p.tipo}.titulo`)}</span>
                <span className="block text-xs text-slate-500">
                  {completo
                    ? t('onboarding.estado.COMPLETO')
                    : p.faltaConfirmar && p.estado === 'IMAGENS_ENVIADAS' && p.imagensEmFalta.length === 0
                      ? t('onboarding.estado.falta_confirmar')
                      : t(`onboarding.estado.${p.estado}`)}
                </span>
              </span>
              <ChevronRight size={16} className="shrink-0 text-slate-300" aria-hidden />
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * O assistente de onboarding do estafeta (plano §4.9, F2): contacto de emergência, cinco passos de documentos e a
 * conclusão. **Retoma onde a pessoa ficou** — abre no primeiro passo por completar —, porque oito fotografias num
 * telemóvel com a rede a falhar não se fazem de uma vez.
 *
 * Funciona em ecrã pequeno (é o único em que se usa) e não depende de nada que só exista com ligação estável: cada
 * fotografia sobe sozinha e fica guardada.
 */
export function OnboardingPage() {
  const { t } = useTranslation('estafeta');
  const estado = useEstadoOnboarding();
  const concluir = useConcluirOnboarding();
  const [escolhido, setEscolhido] = useState<TipoDeDocumento | null>(null);

  // O passo activo: o que a pessoa tocou, ou o primeiro por fazer. Quando um passo fica completo, avança.
  const dados = estado.data;
  const porFazer = dados ? primeiroPassoPorFazer(dados.passos) : null;
  const activo = escolhido ?? porFazer;

  useEffect(() => {
    // Passo completo → segue para o próximo por fazer (sem pisar uma escolha explícita noutro passo incompleto).
    if (!dados || !escolhido) return;
    const passoEscolhido = dados.passos.find((p) => p.tipo === escolhido);
    if (passoEscolhido?.estado === 'COMPLETO') setEscolhido(null);
  }, [dados, escolhido]);

  if (estado.isLoading) {
    return (
      <div className="space-y-3" aria-busy>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-200/70" />
        ))}
      </div>
    );
  }

  if (estado.isError || !dados) {
    return (
      <div className="space-y-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
        <p className="flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          {t('onboarding.erro_carregar')}
        </p>
        <button
          type="button"
          onClick={() => void estado.refetch()}
          className="min-h-11 rounded-xl bg-white px-4 text-sm font-semibold text-red-700 shadow-sm"
        >
          {t('tentar_de_novo')}
        </button>
      </div>
    );
  }

  const feitos = passosCompletos(dados.passos);
  const passoActivo = dados.passos.find((p) => p.tipo === activo) ?? null;
  const jaConcluido = dados.onboardingCompletoEm !== null;

  // Tudo feito e já fechado: só resta ir trabalhar.
  if (dados.completo && jaConcluido) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <PartyPopper size={36} className="text-emerald-600" aria-hidden />
        <h1 className="text-xl font-bold text-emerald-900">{t('onboarding.concluido.titulo')}</h1>
        <p className="text-sm text-emerald-900">{t('onboarding.concluido.texto')}</p>
        <Link
          to="/estafeta"
          className="mt-2 flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white"
        >
          {t('onboarding.concluido.ir')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-bold text-slate-900">{t('onboarding.titulo')}</h1>
        <p className="mt-1 text-sm text-slate-600">{t('onboarding.subtitulo')}</p>
        <div className="mt-3">
          <div
            className="h-2 overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={dados.passos.length}
            aria-valuenow={feitos}
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${(feitos / dados.passos.length) * 100}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">{t('onboarding.progresso', { feitos, total: dados.passos.length })}</p>
        </div>
      </header>

      {pedeContactoDeEmergencia(dados.contactosEmFalta) && <ContactoDeEmergenciaForm />}

      <Passos estado={dados} activo={activo} aoEscolher={setEscolhido} />

      {passoActivo && <PassoDeDocumento key={passoActivo.tipo} passo={passoActivo} />}

      {/* O fecho. O botão só aparece quando tudo está feito — e o servidor volta a verificar tudo. */}
      {dados.completo && !jaConcluido && (
        <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
            <CheckCircle2 size={16} />
            {t('onboarding.concluir.pronto')}
          </p>
          <button
            type="button"
            onClick={() => concluir.mutate()}
            disabled={concluir.isPending}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white active:bg-emerald-700 disabled:opacity-50"
          >
            {concluir.isPending && <Loader2 size={16} className="animate-spin" />}
            {t('onboarding.concluir.botao')}
          </button>
        </div>
      )}
    </div>
  );
}
