import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Info, Loader2, Pencil, User, X } from 'lucide-react';
import toast from 'react-hot-toast';
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
        <h1 className="text-base font-semibold text-slate-900">Dados da empresa e do responsável</h1>
        <p className="mt-0.5 text-xs text-slate-500">
          A sua organização e a sua conta. Podem ser diferentes pessoas — uma organização
          pode ter mais do que uma conta de portal.
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
      toast.success('Dados da empresa actualizados.');
      setAEditar(false);
      onGravado();
    },
    onError: (e: any) => toast.error(mensagemDeErro(e, 'Erro ao gravar os dados da empresa.')),
  });

  const submeter = (e: React.FormEvent) => {
    e.preventDefault();

    if (!f.razaoSocial.trim()) {
      toast.error('A razão social é obrigatória.');
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
          <h2 className="text-sm font-semibold text-slate-900">A empresa</h2>
        </div>
        {!aEditar && (
          <button
            onClick={() => setAEditar(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Pencil size={12} />
            Editar
          </button>
        )}
      </header>

      {aEditar ? (
        <form onSubmit={submeter} className="space-y-4 px-5 py-4">
          <div className="flex gap-4">
            <PreviaLogo url={f.logoUrl} />
            <div className="flex-1">
              <Campo
                etiqueta="Logomarca"
                valor={f.logoUrl}
                onChange={(v) => setF({ ...f, logoUrl: v })}
                exemplo="https://exemplo.com/logo.png"
                ajuda="O URL de uma imagem já publicada algures. Aparece no cabeçalho do portal e na ficha pública do mercado."
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              etiqueta="Razão social"
              obrigatorio
              valor={f.razaoSocial}
              onChange={(v) => setF({ ...f, razaoSocial: v })}
            />
            <Campo
              etiqueta="Nome comercial"
              valor={f.nomeComercial}
              onChange={(v) => setF({ ...f, nomeComercial: v })}
              ajuda="Se for diferente. Aparece no cabeçalho e no mercado público."
            />
          </div>

          <Campo etiqueta="Sede" valor={f.sede} onChange={(v) => setF({ ...f, sede: v })} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              etiqueta="E-mail da empresa"
              tipo="email"
              valor={f.email}
              onChange={(v) => setF({ ...f, email: v })}
              ajuda="O de facturação — não o de login."
            />
            <Campo
              etiqueta="Telefone"
              valor={f.telefone}
              onChange={(v) => setF({ ...f, telefone: v })}
            />
          </div>

          <Campo etiqueta="Website" valor={f.website} onChange={(v) => setF({ ...f, website: v })} />

          <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
            <Info size={13} className="mt-0.5 shrink-0 text-slate-400" />
            <p className="text-[11px] leading-snug text-slate-600">
              O NUIT (<strong>{organizacao.nuit ?? 'não indicado'}</strong>) não se edita
              aqui — é a chave que impede cadastros duplicados da mesma empresa. Para
              corrigir um NUIT errado, contacte o suporte.
            </p>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setAEditar(false)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <X size={12} />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={gravar.isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {gravar.isPending && <Loader2 size={12} className="animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 px-5 py-4">
          {organizacao.logoUrl && (
            <div className="flex items-center gap-3">
              <PreviaLogo url={organizacao.logoUrl} />
              <p className="text-xs text-slate-500">Logomarca actual</p>
            </div>
          )}
          <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
            <Dado etiqueta="Razão social" valor={organizacao.razaoSocial} />
            <Dado etiqueta="Nome comercial" valor={organizacao.nomeComercial} />
            <Dado etiqueta="NUIT" valor={organizacao.nuit} />
            <Dado etiqueta="Sede" valor={organizacao.sede} />
            <Dado etiqueta="E-mail da empresa" valor={organizacao.email} />
            <Dado etiqueta="Telefone" valor={organizacao.telefone} />
            <Dado etiqueta="Website" valor={organizacao.website} />
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
      toast.success('Os seus dados foram actualizados.');
      setAEditar(false);
      onGravado();
    },
    onError: (e: any) => toast.error(mensagemDeErro(e, 'Erro ao gravar o seu perfil.')),
  });

  const submeter = (e: React.FormEvent) => {
    e.preventDefault();

    if (!f.nome.trim()) {
      toast.error('O nome é obrigatório.');
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
          <h2 className="text-sm font-semibold text-slate-900">O responsável</h2>
        </div>
        {!aEditar && (
          <button
            onClick={() => setAEditar(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Pencil size={12} />
            Editar
          </button>
        )}
      </header>

      {aEditar ? (
        <form onSubmit={submeter} className="space-y-4 px-5 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              etiqueta="Nome"
              obrigatorio
              valor={f.nome}
              onChange={(v) => setF({ ...f, nome: v })}
            />
            <Campo etiqueta="Cargo" valor={f.cargo} onChange={(v) => setF({ ...f, cargo: v })} />
          </div>

          <Campo
            etiqueta="Telefone"
            valor={f.telefone}
            onChange={(v) => setF({ ...f, telefone: v })}
          />

          <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
            <Info size={13} className="mt-0.5 shrink-0 text-slate-400" />
            <p className="text-[11px] leading-snug text-slate-600">
              O e-mail de login (<strong>{fornecedor.email}</strong>) e o código de acesso (
              <strong>{fornecedor.codigo ?? '—'}</strong>) não se editam aqui. Mudar o
              e-mail de login é uma operação de segurança à parte.
            </p>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setAEditar(false)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <X size={12} />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={gravar.isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {gravar.isPending && <Loader2 size={12} className="animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      ) : (
        <div className="grid gap-x-6 gap-y-2.5 px-5 py-4 sm:grid-cols-2">
          <Dado etiqueta="Nome" valor={fornecedor.nome} />
          <Dado etiqueta="Cargo" valor={fornecedor.cargo} />
          <Dado etiqueta="Telefone" valor={fornecedor.telefone} />
          <Dado etiqueta="E-mail de login" valor={fornecedor.email} />
          <Dado etiqueta="Código de acesso" valor={fornecedor.codigo} />
        </div>
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Peças
// ═══════════════════════════════════════════════════════════════════════════════

function Dado({ etiqueta, valor }: { etiqueta: string; valor?: string | null }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{etiqueta}</p>
      <p className={valor ? 'mt-0.5 text-sm text-slate-800' : 'mt-0.5 text-sm text-slate-400'}>
        {valor || 'Não indicado'}
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
