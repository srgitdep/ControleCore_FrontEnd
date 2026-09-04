import { useState } from 'react';
import { Palette, X } from 'lucide-react';
import { Button } from '@/shared/ui';
import { cn } from '@/shared/utils';
import { useEmpresaDetails, useUpdateBranding } from '../hooks/useEmpresas';
import type { BrandingPayload, Empresa, TemaBranding } from '../types';

/** Os valores que a tabela usa por omissão, para o ecrã mostrar o mesmo que o servidor. */
const OMISSOES: Required<
  Pick<
    BrandingPayload,
    | 'corPrimaria'
    | 'corSecundaria'
    | 'corAcento'
    | 'corTexto'
    | 'corFundo'
    | 'tipografiaTitulo'
    | 'tipografiaCorpo'
  >
> = {
  corPrimaria: '#1a73e8',
  corSecundaria: '#fbbc04',
  corAcento: '#34a853',
  corTexto: '#202124',
  corFundo: '#ffffff',
  tipografiaTitulo: 'Inter',
  tipografiaCorpo: 'Roboto',
};

const TEMAS: { valor: TemaBranding; label: string; ajuda: string }[] = [
  { valor: 'AUTO', label: 'Automático', ajuda: 'Segue a preferência do dispositivo' },
  { valor: 'CLARO', label: 'Claro', ajuda: 'Fundo claro sempre' },
  { valor: 'ESCURO', label: 'Escuro', ajuda: 'Fundo escuro sempre' },
];

/**
 * A identidade visual de uma empresa: cores, tipografia, logótipos e tema.
 *
 * ## Porque este ecrã faltava
 *
 * `EmpresaBranding` tem catorze colunas com omissões pensadas, `TemaBranding` é um enum
 * próprio, e `PATCH /empresas/:id/branding` estava implementado. A palavra «branding» não
 * aparecia uma única vez em todo o frontend — a personalização estava inteira e sem porta.
 *
 * ## Só o que muda é enviado
 *
 * O `PATCH` é parcial. Enviar o objecto completo com os valores de omissão preenchidos
 * gravaria como escolha deliberada aquilo que ninguém escolheu — e depois não haveria como
 * distinguir «azul porque é a omissão» de «azul porque é a nossa cor».
 */
export function BrandingModal({
  empresa,
  onClose,
}: {
  empresa: Empresa;
  onClose: () => void;
}) {
  const { data: detalhes, isLoading } = useEmpresaDetails(empresa.id);
  const gravar = useUpdateBranding();

  const actual = detalhes?.branding;

  const [alteracoes, setAlteracoes] = useState<BrandingPayload>({});

  const valorDe = <K extends keyof BrandingPayload>(campo: K): BrandingPayload[K] =>
    alteracoes[campo] ?? actual?.[campo] ?? (OMISSOES as any)[campo];

  const mudar = <K extends keyof BrandingPayload>(campo: K, valor: BrandingPayload[K]) =>
    setAlteracoes((antes) => ({ ...antes, [campo]: valor }));

  const nadaMudou = Object.keys(alteracoes).length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-slate-100 p-2">
              <Palette className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Identidade visual</h3>
              <p className="mt-0.5 text-xs text-slate-500">{empresa.nome}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <p className="text-sm text-slate-400">A carregar…</p>
          ) : (
            <div className="space-y-6">
              {!actual && (
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  Esta empresa ainda não tem identidade visual definida. Os valores abaixo são
                  as omissões do sistema; gravar cria o registo com o que estiver alterado.
                </p>
              )}

              <section>
                <h4 className="text-sm font-semibold text-slate-700">Cores</h4>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <CampoDeCor
                    rotulo="Primária"
                    ajuda="Botões, ligações e realces"
                    valor={valorDe('corPrimaria')!}
                    aoMudar={(v) => mudar('corPrimaria', v)}
                  />
                  <CampoDeCor
                    rotulo="Secundária"
                    valor={valorDe('corSecundaria')!}
                    aoMudar={(v) => mudar('corSecundaria', v)}
                  />
                  <CampoDeCor
                    rotulo="Acento"
                    ajuda="Confirmações e estados positivos"
                    valor={valorDe('corAcento')!}
                    aoMudar={(v) => mudar('corAcento', v)}
                  />
                  <CampoDeCor
                    rotulo="Texto"
                    valor={valorDe('corTexto')!}
                    aoMudar={(v) => mudar('corTexto', v)}
                  />
                  <CampoDeCor
                    rotulo="Fundo"
                    valor={valorDe('corFundo')!}
                    aoMudar={(v) => mudar('corFundo', v)}
                  />
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-slate-700">Tipografia</h4>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <CampoDeTexto
                    rotulo="Títulos"
                    valor={valorDe('tipografiaTitulo') ?? ''}
                    placeholder="Inter"
                    aoMudar={(v) => mudar('tipografiaTitulo', v)}
                  />
                  <CampoDeTexto
                    rotulo="Corpo"
                    valor={valorDe('tipografiaCorpo') ?? ''}
                    placeholder="Roboto"
                    aoMudar={(v) => mudar('tipografiaCorpo', v)}
                  />
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-slate-700">Logótipos</h4>
                <p className="mt-1 text-xs text-slate-400">
                  Endereços de imagem. O logótipo branco é o que se usa sobre fundos escuros —
                  sem ele, um logótipo escuro desaparece no cabeçalho do tema escuro.
                </p>
                <div className="mt-3 space-y-3">
                  <CampoDeTexto
                    rotulo="Logótipo"
                    valor={valorDe('logoUrl') ?? ''}
                    placeholder="https://…/logo.png"
                    aoMudar={(v) => mudar('logoUrl', v)}
                  />
                  <CampoDeTexto
                    rotulo="Logótipo branco"
                    valor={valorDe('logoBrancoUrl') ?? ''}
                    placeholder="https://…/logo-branco.png"
                    aoMudar={(v) => mudar('logoBrancoUrl', v)}
                  />
                  <CampoDeTexto
                    rotulo="Favicon"
                    valor={valorDe('faviconUrl') ?? ''}
                    placeholder="https://…/favicon.png"
                    aoMudar={(v) => mudar('faviconUrl', v)}
                  />
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-slate-700">Tema</h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  {TEMAS.map((t) => {
                    const escolhido = (valorDe('tema') ?? 'AUTO') === t.valor;

                    return (
                      <button
                        key={t.valor}
                        type="button"
                        onClick={() => mudar('tema', t.valor)}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                          escolhido
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                        )}
                      >
                        <span className="block font-medium">{t.label}</span>
                        <span className="block text-[11px] text-slate-400">{t.ajuda}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-400">
            {nadaMudou ? 'Nada alterado.' : `${Object.keys(alteracoes).length} campo(s) a gravar.`}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              disabled={nadaMudou || gravar.isPending}
              onClick={() =>
                gravar.mutate({ id: empresa.id, payload: alteracoes }, { onSuccess: onClose })
              }
            >
              Gravar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CampoDeCor({
  rotulo,
  ajuda,
  valor,
  aoMudar,
}: {
  rotulo: string;
  ajuda?: string;
  valor: string;
  aoMudar: (valor: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600">{rotulo}</label>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          className="h-9 w-10 shrink-0 cursor-pointer rounded border border-slate-200"
          aria-label={`${rotulo} — selector de cor`}
        />
        {/* O campo de texto ao lado do selector não é redundante: uma cor de marca vem
            num hexadecimal escrito num manual, e escrevê-la é mais fiável do que
            procurá-la no selector. */}
        <input
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-sm focus:border-blue-400 focus:outline-none"
        />
      </div>
      {ajuda && <p className="mt-1 text-[11px] text-slate-400">{ajuda}</p>}
    </div>
  );
}

function CampoDeTexto({
  rotulo,
  valor,
  placeholder,
  aoMudar,
}: {
  rotulo: string;
  valor: string;
  placeholder?: string;
  aoMudar: (valor: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600">{rotulo}</label>
      <input
        value={valor}
        placeholder={placeholder}
        onChange={(e) => aoMudar(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
      />
    </div>
  );
}
