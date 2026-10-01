import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Info, Loader2, Pencil, User, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { portal } from '../api/portal.api';
import type { OrganizacaoFornecedor } from '../api/portal.api';
import { usePortalStore } from '../store/usePortalStore';
import { mensagemDeErro } from '@/shared/utils';

/**
 * Os dados da empresa fornecedora e do responsável — e onde os editar.
 *
 * ## Duas identidades, uma página
 *
 * A **organização** (`FornecedorOrganizacao`) é a empresa: razão social, sede, contacto,
 * website. É o que aparece no cabeçalho do portal e na ficha pública do mercado.
 *
 * O **perfil** (`UtilizadorFornecedor`) é a pessoa que está a usar esta conta: nome,
 * telefone, cargo. Uma organização pode ter mais do que uma conta — `principal` é quem a
 * administra — e cada uma tem o seu próprio perfil.
 *
 * Confundi-las é o erro que este ecrã existe para corrigir: antes do cabeçalho mostrar
 * `fornecedor.nome` — o nome do **responsável** — onde o comprador espera o nome da
 * **empresa**. As duas secções desta página ficam lado a lado, com etiquetas que dizem
 * qual é qual, para o fornecedor nunca confundir uma edição com a outra.
 *
 * ## Sem NUIT nem e-mail editáveis, e é deliberado
 *
 * O NUIT é a chave de deduplicação entre organizações — mudá-lo sem verificação podia
 * fundir duas organizações por engano, e uma correcção passa por suporte. O e-mail é o
 * identificador de login — mudá-lo é uma operação de segurança (é para lá que vai a
 * recuperação de senha) e merece um fluxo próprio, não um campo deste formulário. Os dois
 * aparecem como texto, não como campo, para não parecerem esquecidos.
 */
export function PerfilPage() {
  const { t } = useTranslation('portal');
  const queryClient = useQueryClient();
  const carregarSessao = usePortalStore((s) => s.carregar);

  const { data: organizacao, isLoading } = useQuery({
    queryKey: ['portal-organizacao'],
    queryFn: portal.obterOrganizacao,
  });

  const recarregar = () => {
    queryClient.invalidateQueries({ queryKey: ['portal-organizacao'] });
    // O cabeçalho lê o nome da organização e o nome do responsável do store, não desta
    // query — uma edição aqui só aparece lá depois de `carregar()` de novo.
    void carregarSessao();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={22} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-base font-semibold text-slate-900">{t('perfil.titulo')}</h1>
        <p className="mt-0.5 text-xs text-slate-500">
          {t('perfil.subtitulo')}
        </p>
      </header>

      {organizacao && <SeccaoOrganizacao organizacao={organizacao} onGravado={recarregar} />}
      <SeccaoPerfil onGravado={recarregar} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// A organização
// ═══════════════════════════════════════════════════════════════════════════════

function SeccaoOrganizacao({
  organizacao,
  onGravado,
}: {
  organizacao: OrganizacaoFornecedor;
  onGravado: () => void;
}) {
  const { t } = useTranslation('portal');
  const [aEditar, setAEditar] = useState(false);
  const [f, setF] = useState(camposDaOrganizacao(organizacao));

  // O formulário volta a espelhar o que veio do servidor sempre que a leitura muda — depois
  // de gravar, por exemplo. Sem isto, cancelar uma segunda edição mostraria os valores da
  // primeira em vez dos que estão realmente gravados.
  useEffect(() => {
    if (!aEditar) setF(camposDaOrganizacao(organizacao));
  }, [organizacao, aEditar]);

  const gravar = useMutation({
    mutationFn: (payload: Parameters<typeof portal.actualizarOrganizacao>[0]) =>
      portal.actualizarOrganizacao(payload),
    onSuccess: () => {
      toast.success(t('perfil.empresa_actualizada'));
      setAEditar(false);
      onGravado();
    },
    onError: (e: any) => toast.error(mensagemDeErro(e, t('perfil.erro_gravar_empresa'))),
  });

  const submeter = (e: React.FormEvent) => {
    e.preventDefault();

    if (!f.razaoSocial.trim()) {
      toast.error(t('comum.razao_social_obrigatoria'));
      return;
    }

    gravar.mutate({
      razaoSocial: f.razaoSocial.trim(),
      nomeComercial: f.nomeComercial.trim() || undefined,
      sede: f.sede.trim() || undefined,
      email: f.email.trim() || undefined,
      telefone: f.telefone.trim() || undefined,
      website: f.website.trim() || undefined,
      logoUrl: f.logoUrl.trim() || undefined,
    });
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Building2 size={15} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900">{t('comum.a_empresa')}</h2>
        </div>
        {!aEditar && (
          <button
            onClick={() => setAEditar(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Pencil size={12} />
            {t('comum.editar')}
          </button>
        )}
      </header>

      {aEditar ? (
        <form onSubmit={submeter} className="space-y-4 px-5 py-4">
          <div className="flex gap-4">
            <PreviaLogo url={f.logoUrl} />
            <div className="flex-1">
              <Campo
                etiqueta={t('perfil.logomarca')}
                valor={f.logoUrl}
                onChange={(v) => setF({ ...f, logoUrl: v })}
                exemplo={t('perfil.logo_exemplo')}
                ajuda={t('perfil.logo_ajuda')}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              etiqueta={t('comum.razao_social')}
              obrigatorio
              valor={f.razaoSocial}
              onChange={(v) => setF({ ...f, razaoSocial: v })}
            />
            <Campo
              etiqueta={t('comum.nome_comercial')}
              valor={f.nomeComercial}
              onChange={(v) => setF({ ...f, nomeComercial: v })}
              ajuda={t('perfil.nome_comercial_ajuda')}
            />
          </div>

          <Campo etiqueta={t('comum.sede')} valor={f.sede} onChange={(v) => setF({ ...f, sede: v })} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              etiqueta={t('comum.email_empresa')}
              tipo="email"
              valor={f.email}
              onChange={(v) => setF({ ...f, email: v })}
              ajuda={t('perfil.email_empresa_ajuda')}
            />
            <Campo
              etiqueta={t('comum.telefone')}
              valor={f.telefone}
              onChange={(v) => setF({ ...f, telefone: v })}
            />
          </div>

          <Campo etiqueta={t('comum.website')} valor={f.website} onChange={(v) => setF({ ...f, website: v })} />

          <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
            <Info size={13} className="mt-0.5 shrink-0 text-slate-400" />
            <p className="text-[11px] leading-snug text-slate-600">
              {t('perfil.nuit_nota_antes')}
              <strong>{organizacao.nuit ?? t('perfil.nuit_nao_indicado')}</strong>
              {t('perfil.nuit_nota_depois')}
            </p>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setAEditar(false)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <X size={12} />
              {t('comum.cancelar')}
            </button>
            <button
              type="submit"
              disabled={gravar.isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {gravar.isPending && <Loader2 size={12} className="animate-spin" />}
              {t('comum.guardar')}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 px-5 py-4">
          {organizacao.logoUrl && (
            <div className="flex items-center gap-3">
              <PreviaLogo url={organizacao.logoUrl} />
              <p className="text-xs text-slate-500">{t('perfil.logomarca_actual')}</p>
            </div>
          )}
          <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
            <Dado etiqueta={t('comum.razao_social')} valor={organizacao.razaoSocial} />
            <Dado etiqueta={t('comum.nome_comercial')} valor={organizacao.nomeComercial} />
            <Dado etiqueta={t('comum.nuit')} valor={organizacao.nuit} />
            <Dado etiqueta={t('comum.sede')} valor={organizacao.sede} />
            <Dado etiqueta={t('comum.email_empresa')} valor={organizacao.email} />
            <Dado etiqueta={t('comum.telefone')} valor={organizacao.telefone} />
            <Dado etiqueta={t('comum.website')} valor={organizacao.website} />
          </div>
        </div>
      )}
    </section>
  );
}

function camposDaOrganizacao(organizacao: OrganizacaoFornecedor) {
  return {
    razaoSocial: organizacao.razaoSocial,
    nomeComercial: organizacao.nomeComercial ?? '',
    sede: organizacao.sede ?? '',
    email: organizacao.email ?? '',
    telefone: organizacao.telefone ?? '',
    website: organizacao.website ?? '',
    logoUrl: organizacao.logoUrl ?? '',
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// O responsável
// ═══════════════════════════════════════════════════════════════════════════════

function SeccaoPerfil({ onGravado }: { onGravado: () => void }) {
  const { t } = useTranslation('portal');
  const fornecedor = usePortalStore((s) => s.fornecedor);
  const [aEditar, setAEditar] = useState(false);
  const [f, setF] = useState({
    nome: fornecedor?.nome ?? '',
    telefone: fornecedor?.telefone ?? '',
    cargo: fornecedor?.cargo ?? '',
  });

  useEffect(() => {
    if (!aEditar && fornecedor) {
      setF({ nome: fornecedor.nome, telefone: fornecedor.telefone ?? '', cargo: fornecedor.cargo ?? '' });
    }
  }, [fornecedor, aEditar]);

  const gravar = useMutation({
    mutationFn: (payload: Parameters<typeof portal.actualizarPerfil>[0]) =>
      portal.actualizarPerfil(payload),
    onSuccess: () => {
      toast.success(t('perfil.dados_actualizados'));
      setAEditar(false);
      onGravado();
    },
    onError: (e: any) => toast.error(mensagemDeErro(e, t('perfil.erro_gravar_perfil'))),
  });

  const submeter = (e: React.FormEvent) => {
    e.preventDefault();

    if (!f.nome.trim()) {
      toast.error(t('perfil.nome_obrigatorio'));
      return;
    }

    gravar.mutate({
      nome: f.nome.trim(),
      telefone: f.telefone.trim() || undefined,
      cargo: f.cargo.trim() || undefined,
    });
  };

  if (!fornecedor) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <User size={15} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900">{t('perfil.o_responsavel')}</h2>
        </div>
        {!aEditar && (
          <button
            onClick={() => setAEditar(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Pencil size={12} />
            {t('comum.editar')}
          </button>
        )}
      </header>

      {aEditar ? (
        <form onSubmit={submeter} className="space-y-4 px-5 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              etiqueta={t('comum.nome')}
              obrigatorio
              valor={f.nome}
              onChange={(v) => setF({ ...f, nome: v })}
            />
            <Campo etiqueta={t('comum.cargo')} valor={f.cargo} onChange={(v) => setF({ ...f, cargo: v })} />
          </div>

          <Campo
            etiqueta={t('comum.telefone')}
            valor={f.telefone}
            onChange={(v) => setF({ ...f, telefone: v })}
          />

          <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
            <Info size={13} className="mt-0.5 shrink-0 text-slate-400" />
            <p className="text-[11px] leading-snug text-slate-600">
              {t('perfil.login_nota_1')}
              <strong>{fornecedor.email}</strong>
              {t('perfil.login_nota_2')}
              <strong>{fornecedor.codigo ?? '—'}</strong>
              {t('perfil.login_nota_3')}
            </p>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setAEditar(false)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <X size={12} />
              {t('comum.cancelar')}
            </button>
            <button
              type="submit"
              disabled={gravar.isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {gravar.isPending && <Loader2 size={12} className="animate-spin" />}
              {t('comum.guardar')}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid gap-x-6 gap-y-2.5 px-5 py-4 sm:grid-cols-2">
          <Dado etiqueta={t('comum.nome')} valor={fornecedor.nome} />
          <Dado etiqueta={t('comum.cargo')} valor={fornecedor.cargo} />
          <Dado etiqueta={t('comum.telefone')} valor={fornecedor.telefone} />
          <Dado etiqueta={t('perfil.email_login')} valor={fornecedor.email} />
          <Dado etiqueta={t('perfil.codigo_acesso')} valor={fornecedor.codigo} />
        </div>
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Peças
// ═══════════════════════════════════════════════════════════════════════════════

function Dado({ etiqueta, valor }: { etiqueta: string; valor?: string | null }) {
  const { t } = useTranslation('portal');
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{etiqueta}</p>
      <p className={valor ? 'mt-0.5 text-sm text-slate-800' : 'mt-0.5 text-sm text-slate-400'}>
        {valor || t('comum.nao_indicado')}
      </p>
    </div>
  );
}

function Campo({
  etiqueta,
  valor,
  onChange,
  tipo = 'text',
  obrigatorio,
  exemplo,
  ajuda,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  tipo?: string;
  obrigatorio?: boolean;
  exemplo?: string;
  ajuda?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700">
        {etiqueta}
        {obrigatorio && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <input
        type={tipo}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        required={obrigatorio}
        placeholder={exemplo}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
      />
      {ajuda && <p className="mt-1 text-[11px] leading-snug text-slate-500">{ajuda}</p>}
    </div>
  );
}

/**
 * A miniatura da logomarca, com o mesmo padrão de `ArtigoFormModal → PreviaImagem`: mostra
 * a imagem se o URL carregar, ou um ícone neutro se estiver vazio ou falhar.
 */
function PreviaLogo({ url }: { url: string }) {
  const [falhou, setFalhou] = useState(false);
  const limpo = url.trim();

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      {limpo && !falhou ? (
        <img
          src={limpo}
          alt=""
          className="h-full w-full object-contain"
          onError={() => setFalhou(true)}
          onLoad={() => setFalhou(false)}
        />
      ) : (
        <Building2 size={20} className="text-slate-300" />
      )}
    </div>
  );
}
