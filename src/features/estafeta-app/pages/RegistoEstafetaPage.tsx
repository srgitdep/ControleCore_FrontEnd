import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { AlertTriangle, Bike, CheckCircle2, Loader2, MailWarning } from 'lucide-react';
import { cn, mensagemDeErro } from '@/shared/utils';
import { idiomaActivo } from '@/i18n';
import { normalizarTelemovelMz } from '../domain/onboarding';
import { useRegistar, useVerificarConvite } from '../hooks/useOnboarding';
import { useEstafetaStore } from '../store/useEstafetaStore';
import type { RespostaDoRegisto } from '../types/onboarding';

/**
 * O registo de quem quer trabalhar como estafeta (plano §4.9, F1). **Público**: quem chega aqui ainda não tem conta.
 *
 * - **Com `?convite=`** regista-se na frota própria da empresa que o convidou (o nome dela aparece, para a pessoa ter a
 *   certeza de onde se está a registar). **Sem convite**, na frota da plataforma — que só abre quando a plataforma o
 *   decide: se estiver fechada o servidor responde 403 e a página di-lo, em vez de um erro genérico.
 * - A pessoa **escolhe a senha**. O código `E####` aparece no ecrã no fim (e vai por e-mail, que pode não chegar):
 *   é com ele que entra a seguir.
 * - O consentimento é explícito e diz o que se guarda e para quê — é um dado pessoal sensível (BI, carta, rosto).
 */

const SENHA_MINIMA = 8;

function criarEsquema(t: TFunction<'estafeta'>) {
  return z
    .object({
      nome: z.string().trim().min(2, t('registo.erros.nome')),
      telefone: z.string().refine((v) => normalizarTelemovelMz(v) !== null, t('registo.erros.telefone')),
      email: z.string().trim().email(t('registo.erros.email')),
      senha: z.string().min(SENHA_MINIMA, t('registo.erros.senha_curta')).max(72, t('registo.erros.senha_longa')),
      confirmarSenha: z.string(),
      emergenciaNome: z.string().trim().min(2, t('registo.erros.emergencia_nome')),
      emergenciaTelefone: z
        .string()
        .refine((v) => normalizarTelemovelMz(v) !== null, t('registo.erros.telefone')),
      consentimento: z.literal(true, { error: t('registo.erros.consentimento') }),
    })
    .refine((d) => d.senha === d.confirmarSenha, {
      path: ['confirmarSenha'],
      message: t('registo.erros.senhas_diferentes'),
    });
}

type CamposDoRegisto = z.infer<ReturnType<typeof criarEsquema>>;

function Campo({
  id,
  rotulo,
  erro,
  children,
}: {
  id: string;
  rotulo: string;
  erro?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {rotulo}
      </label>
      {children}
      {erro && (
        <p id={`${id}-erro`} role="alert" className="mt-1 text-xs font-medium text-red-600">
          {erro}
        </p>
      )}
    </div>
  );
}

const classeInput = (invalido: boolean) =>
  cn('min-h-12 w-full rounded-xl border bg-white px-3 text-base text-slate-900', invalido ? 'border-red-400' : 'border-slate-300');

export function RegistoEstafetaPage() {
  const { t } = useTranslation('estafeta');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const convite = params.get('convite')?.trim() || null;

  const verificar = useVerificarConvite(convite);
  const registar = useRegistar();
  const entrarComSessao = useEstafetaStore((s) => s.entrarComSessao);
  const [concluido, setConcluido] = useState<RespostaDoRegisto | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CamposDoRegisto>({ resolver: zodResolver(criarEsquema(t)), mode: 'onBlur' });

  const aoSubmeter = (campos: CamposDoRegisto) => {
    registar.mutate(
      {
        ...(convite ? { convite } : {}),
        nome: campos.nome.trim(),
        telefone: campos.telefone,
        email: campos.email.trim(),
        senha: campos.senha,
        contactoEmergencia: { nome: campos.emergenciaNome.trim(), telefone: campos.emergenciaTelefone },
        idioma: idiomaActivo() === 'en' ? 'en' : 'pt',
      },
      {
        onSuccess: (resposta) => {
          // A sessão já está aberta no servidor (o cookie veio nesta resposta). O ecrã guarda a identidade, mostra o
          // código — que é o que a pessoa vai escrever na próxima entrada — e só depois segue para o assistente.
          entrarComSessao(resposta.utilizador);
          setConcluido(resposta);
        },
      },
    );
  };

  // ── O código de acesso: guardar antes de continuar ─────────────────────────
  if (concluido) {
    return (
      <PaginaRegisto>
        <div className="space-y-4 rounded-2xl border border-emerald-200 bg-white p-6 text-center">
          <CheckCircle2 size={36} className="mx-auto text-emerald-600" aria-hidden />
          <h1 className="text-xl font-bold text-slate-900">{t('registo.sucesso.titulo')}</h1>
          <p className="text-sm text-slate-600">{t('registo.sucesso.codigo_texto')}</p>
          <p className="rounded-xl bg-slate-100 py-4 font-mono text-3xl font-bold tracking-widest text-slate-900" aria-label={t('registo.sucesso.codigo_etiqueta')}>
            {concluido.codigo}
          </p>
          <p className="text-xs text-slate-500">{t('registo.sucesso.guarde')}</p>
          {!concluido.emailEnviado && (
            <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-left text-sm text-amber-900" role="status">
              <MailWarning size={16} className="mt-0.5 shrink-0" />
              {t('registo.sucesso.email_nao_enviado')}
            </p>
          )}
          <button
            type="button"
            onClick={() => navigate('/estafeta/onboarding', { replace: true })}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white"
          >
            {t('registo.sucesso.continuar')}
          </button>
        </div>
      </PaginaRegisto>
    );
  }

  // ── Um convite que não vale ────────────────────────────────────────────────
  if (convite && verificar.isError) {
    return (
      <PaginaRegisto>
        <div className="space-y-3 rounded-2xl bg-red-50 p-5 text-sm text-red-800" role="alert">
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle size={16} className="shrink-0" />
            {t('registo.convite_invalido_titulo')}
          </p>
          <p>{mensagemDeErro(verificar.error, t('registo.convite_invalido'))}</p>
        </div>
      </PaginaRegisto>
    );
  }

  const empresa = verificar.data?.empresaNome;

  return (
    <PaginaRegisto>
      <header className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">{t('registo.titulo')}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {convite ? (verificar.isLoading ? t('registo.a_verificar_convite') : t('registo.na_frota_de', { empresa })) : t('registo.na_plataforma')}
        </p>
      </header>

      <form onSubmit={handleSubmit(aoSubmeter)} noValidate className="space-y-4">
        <Campo id="reg-nome" rotulo={t('registo.campos.nome')} erro={errors.nome?.message}>
          <input id="reg-nome" autoComplete="name" className={classeInput(!!errors.nome)} {...register('nome')} />
        </Campo>

        <Campo id="reg-telefone" rotulo={t('registo.campos.telefone')} erro={errors.telefone?.message}>
          <input
            id="reg-telefone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="84 123 4567"
            className={classeInput(!!errors.telefone)}
            {...register('telefone')}
          />
        </Campo>

        <Campo id="reg-email" rotulo={t('registo.campos.email')} erro={errors.email?.message}>
          <input id="reg-email" type="email" autoComplete="email" className={classeInput(!!errors.email)} {...register('email')} />
        </Campo>

        <Campo id="reg-senha" rotulo={t('registo.campos.senha')} erro={errors.senha?.message}>
          <input id="reg-senha" type="password" autoComplete="new-password" className={classeInput(!!errors.senha)} {...register('senha')} />
        </Campo>

        <Campo id="reg-confirmar" rotulo={t('registo.campos.confirmar_senha')} erro={errors.confirmarSenha?.message}>
          <input
            id="reg-confirmar"
            type="password"
            autoComplete="new-password"
            className={classeInput(!!errors.confirmarSenha)}
            {...register('confirmarSenha')}
          />
        </Campo>

        <fieldset className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
          <legend className="px-1 text-sm font-bold text-slate-800">{t('registo.emergencia_titulo')}</legend>
          <p className="text-xs text-slate-500">{t('registo.emergencia_ajuda')}</p>
          <Campo id="reg-emerg-nome" rotulo={t('registo.campos.emergencia_nome')} erro={errors.emergenciaNome?.message}>
            <input id="reg-emerg-nome" autoComplete="off" className={classeInput(!!errors.emergenciaNome)} {...register('emergenciaNome')} />
          </Campo>
          <Campo id="reg-emerg-tel" rotulo={t('registo.campos.emergencia_telefone')} erro={errors.emergenciaTelefone?.message}>
            <input
              id="reg-emerg-tel"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              placeholder="82 123 4567"
              className={classeInput(!!errors.emergenciaTelefone)}
              {...register('emergenciaTelefone')}
            />
          </Campo>
        </fieldset>

        {/* O consentimento: um dado pessoal sensível, guardado sem prazo. O texto diz isso, sem eufemismos. */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">{t('registo.consentimento_titulo')}</p>
          <p className="mt-1 text-xs text-slate-600">{t('registo.consentimento_texto')}</p>
          <label className="mt-3 flex items-start gap-3 text-sm text-slate-800">
            <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300" {...register('consentimento')} />
            <span>{t('registo.consentimento_aceito')}</span>
          </label>
          {errors.consentimento && (
            <p role="alert" className="mt-1 text-xs font-medium text-red-600">
              {errors.consentimento.message}
            </p>
          )}
        </div>

        {registar.isError && (
          <p className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            {mensagemDeErro(registar.error, t('registo.erro_generico'))}
          </p>
        )}

        <button
          type="submit"
          disabled={registar.isPending || (!!convite && verificar.isLoading)}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white active:bg-blue-700 disabled:opacity-50"
        >
          {registar.isPending && <Loader2 size={16} className="animate-spin" />}
          {registar.isPending ? t('registo.a_registar') : t('registo.botao')}
        </button>

        <p className="text-center text-sm text-slate-500">
          {t('registo.ja_tenho_conta')}{' '}
          <Link to="/login" className="font-semibold text-blue-600">
            {t('registo.entrar')}
          </Link>
        </p>
      </form>
    </PaginaRegisto>
  );
}

function PaginaRegisto({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-lg bg-slate-50 px-4 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="mb-5 flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
          <Bike size={20} />
        </span>
        <span className="text-sm font-bold text-slate-900">ControlCore</span>
      </div>
      {children}
    </div>
  );
}
