import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { portal } from '../api/portal.api';
import type {
  ArtigoExtraidoDeCatalogo,
  LinhaParaImportar,
  ResultadoLinhaImportacao,
} from '../api/portal.api';
// As mesmas listas que `ArtigoFormModal` usa — um fornecedor não deve ver vocabulários
// diferentes para «como se vende» consoante criou o produto a um ou em lote.
import { UNIDADES_COMUNS, TIPOS_DE_EMBALAGEM } from '../constants/embalagem';
import { mensagemDeErro } from '@/shared/utils';

type Fase = 'upload' | 'revisao' | 'concluido';

const FORMATOS_ACEITES =
  '.pdf,.doc,.docx,.xls,.xlsx,image/*,application/pdf,' +
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document,' +
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const MAX_BYTES = 15 * 1024 * 1024;

/** Uma linha da tabela de revisão — o que a IA leu, mais o que ainda falta para ser válida. */
interface LinhaRevisao extends ArtigoExtraidoDeCatalogo {
  /** Chave estável para a lista React — o índice sozinho falharia ao remover uma linha do meio. */
  chave: string;
  incluir: boolean;
  /** Um documento não traz imagem nenhuma — é sempre adicionada aqui, na revisão. */
  imagemUrl?: string;
}

/**
 * Importar um catálogo inteiro de um documento — PDF, Word, Excel ou fotografia.
 *
 * ## O que este ecrã não é
 *
 * Não é uma segunda forma de criar um artigo. É a mesma forma, para muitos de uma vez: o
 * documento é lido, cada linha aparece numa tabela onde se pode corrigir o que a IA leu
 * mal, desmarcar o que não interessa, e só então tudo é criado — com o mesmo modelo de
 * embalagem (unidades por embalagem × conteúdo por unidade) e o mesmo primeiro preço que
 * `ArtigoFormModal` usa para um artigo só.
 *
 * ## Três fases, não cinco
 *
 * Upload, revisão, confirmação. A leitura do documento é uma chamada só e não um passo à
 * parte que mereça o seu próprio ecrã — o fornecedor vê "a analisar" e chega directamente
 * à tabela.
 *
 * ## Nada se grava antes da confirmação
 *
 * A leitura do documento não cria artigo nenhum — só a tabela deste ecrã. É a mesma
 * disciplina de `CapturaPorFoto`: uma ferramenta de apoio que sugere, não uma que decide
 * pelo fornecedor.
 */
export function ImportarCatalogoPage() {
  const navegar = useNavigate();
  const inputFicheiro = useRef<HTMLInputElement>(null);

  const [fase, setFase] = useState<Fase>('upload');
  const [aArrastar, setAArrastar] = useState(false);
  const [ficheiro, setFicheiro] = useState<File | null>(null);
  const [aAnalisar, setAAnalisar] = useState(false);
  const [linhas, setLinhas] = useState<LinhaRevisao[]>([]);
  const [recusadas, setRecusadas] = useState<{ linha: number; motivo: string }[]>([]);
  const [aImportar, setAImportar] = useState(false);
  const [resultado, setResultado] = useState<{
    resultados: ResultadoLinhaImportacao[];
    criados: number;
    falhados: number;
  } | null>(null);
  const [linhaAEditarImagem, setLinhaAEditarImagem] = useState<string | null>(null);

  // ─── Upload ─────────────────────────────────────────────────────────────────

  const escolherFicheiro = (lista: FileList | null) => {
    const f = lista?.[0];
    if (!f) return;

    if (f.size > MAX_BYTES) {
      toast.error(`"${f.name}" excede ${MAX_BYTES / 1024 / 1024} MB.`);
      return;
    }

    setFicheiro(f);
  };

  const analisar = async () => {
    if (!ficheiro) return;

    setAAnalisar(true);
    try {
      const r = await portal.extrairCatalogoDeDocumento(ficheiro);

      if (r.semResultado) {
        toast.error(
          'Não foi possível ler produtos neste documento. Tente um ficheiro mais nítido, ' +
            'ou confirme que tem uma lista de produtos.',
        );
        return;
      }

      setLinhas(
        r.artigos.map((a, i) => ({
          ...a,
          chave: `${i}-${a.nome}`,
          incluir: true,
        })),
      );
      setRecusadas(r.recusadas);
      setFase('revisao');

      toast.success(
        `${r.artigos.length} produto${r.artigos.length === 1 ? '' : 's'} encontrado${r.artigos.length === 1 ? '' : 's'}.`,
      );
    } catch (erro) {
      toast.error(mensagemDeErro(erro, 'Não foi possível analisar o documento.'));
    } finally {
      setAAnalisar(false);
    }
  };

  // ─── Revisão ────────────────────────────────────────────────────────────────

  const actualizarLinha = (chave: string, alteracoes: Partial<LinhaRevisao>) => {
    setLinhas((antes) => antes.map((l) => (l.chave === chave ? { ...l, ...alteracoes } : l)));
  };

  const removerLinha = (chave: string) => {
    setLinhas((antes) => antes.filter((l) => l.chave !== chave));
  };

  const seleccionadas = linhas.filter((l) => l.incluir);
  const comPreco = seleccionadas.filter((l) => l.preco !== undefined && l.preco > 0);
  const semPreco = seleccionadas.length - comPreco.length;

  const confirmarImportacao = async () => {
    if (seleccionadas.length === 0) {
      toast.error('Seleccione ao menos um produto.');
      return;
    }

    if (semPreco > 0) {
      toast.error(
        `${semPreco} produto${semPreco === 1 ? '' : 's'} sem preço. Preencha o preço ou ` +
          'desmarque essa linha antes de continuar.',
      );
      return;
    }

    const payload: LinhaParaImportar[] = seleccionadas.map((l) => ({
      nome: l.nome,
      referencia: l.referencia,
      marca: l.marca,
      categoria: l.categoria,
      tipoEmbalagem: l.tipoEmbalagem,
      unidadesPorEmbalagem: l.unidadesPorEmbalagem || 1,
      conteudoPorUnidade: l.conteudoPorUnidade || 1,
      unidadeMedida: l.unidadeMedida,
      preco: l.preco!,
      moeda: l.moeda,
      quantidadeDisponivel: l.quantidadeDisponivel,
      imagens: l.imagemUrl?.trim() ? [l.imagemUrl.trim()] : undefined,
    }));

    setAImportar(true);
    try {
      const r = await portal.importarLoteDeArtigos(payload);
      setResultado(r);
      setFase('concluido');

      if (r.criados > 0) {
        toast.success(`${r.criados} produto${r.criados === 1 ? '' : 's'} importado${r.criados === 1 ? '' : 's'}.`);
      }
    } catch (erro) {
      toast.error(mensagemDeErro(erro, 'Não foi possível concluir a importação.'));
    } finally {
      setAImportar(false);
    }
  };

  const recomecar = () => {
    setFase('upload');
    setFicheiro(null);
    setLinhas([]);
    setRecusadas([]);
    setResultado(null);
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <button
          onClick={() => navegar('/fornecedor')}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-base font-semibold text-slate-900">Importar catálogo</h1>
          <p className="text-xs text-slate-500">
            Carregue um documento com a sua lista de produtos — nós lemos e organizamos.
          </p>
        </div>
      </header>

      <Passos fase={fase} />

      {fase === 'upload' && (
        <ZonaDeUpload
          ficheiro={ficheiro}
          aArrastar={aArrastar}
          aAnalisar={aAnalisar}
          onArrastar={setAArrastar}
          onEscolher={escolherFicheiro}
          onRemover={() => setFicheiro(null)}
          onAnalisar={analisar}
          inputRef={inputFicheiro}
        />
      )}

      {fase === 'revisao' && (
        <TabelaDeRevisao
          linhas={linhas}
          recusadas={recusadas}
          comPreco={comPreco.length}
          semPreco={semPreco}
          aImportar={aImportar}
          onActualizarLinha={actualizarLinha}
          onRemoverLinha={removerLinha}
          onEditarImagem={setLinhaAEditarImagem}
          onCancelar={recomecar}
          onConfirmar={confirmarImportacao}
        />
      )}

      {fase === 'concluido' && resultado && (
        <ResumoConclusao resultado={resultado} onNovaImportacao={recomecar} onVerVitrine={() => navegar('/fornecedor')} />
      )}

      {linhaAEditarImagem && (
        <ModalImagemLinha
          linha={linhas.find((l) => l.chave === linhaAEditarImagem)!}
          onFechar={() => setLinhaAEditarImagem(null)}
          onGravar={(imagemUrl) => {
            actualizarLinha(linhaAEditarImagem, { imagemUrl });
            setLinhaAEditarImagem(null);
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Peças
// ═══════════════════════════════════════════════════════════════════════════════

function Passos({ fase }: { fase: Fase }) {
  const PASSOS: { chave: Fase; etiqueta: string }[] = [
    { chave: 'upload', etiqueta: 'Carregar' },
    { chave: 'revisao', etiqueta: 'Revisão' },
    { chave: 'concluido', etiqueta: 'Conclusão' },
  ];
  const indiceActual = PASSOS.findIndex((p) => p.chave === fase);

  return (
    <div className="flex items-center gap-2">
      {PASSOS.map((p, i) => (
        <div key={p.chave} className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
              i < indiceActual
                ? 'bg-emerald-100 text-emerald-700'
                : i === indiceActual
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-400'
            }`}
          >
            {i < indiceActual ? <CheckCircle2 size={13} /> : i + 1}
          </div>
          <span
            className={`text-xs font-medium ${i === indiceActual ? 'text-slate-900' : 'text-slate-400'}`}
          >
            {p.etiqueta}
          </span>
          {i < PASSOS.length - 1 && <div className="h-px w-8 bg-slate-200" />}
        </div>
      ))}
    </div>
  );
}

function ZonaDeUpload({
  ficheiro,
  aArrastar,
  aAnalisar,
  onArrastar,
  onEscolher,
  onRemover,
  onAnalisar,
  inputRef,
}: {
  ficheiro: File | null;
  aArrastar: boolean;
  aAnalisar: boolean;
  onArrastar: (v: boolean) => void;
  onEscolher: (lista: FileList | null) => void;
  onRemover: () => void;
  onAnalisar: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
        <Sparkles size={14} className="mt-0.5 shrink-0 text-blue-600" />
        <p className="text-xs leading-snug text-blue-900">
          Carregue a sua lista de preços tal como já a tem — PDF, uma folha de Excel, um
          documento Word ou até uma fotografia das páginas. Nós lemos os produtos, os preços
          e as quantidades, e você revê tudo antes de confirmar.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={FORMATOS_ACEITES}
        className="hidden"
        onChange={(e) => {
          onEscolher(e.target.files);
          e.target.value = '';
        }}
      />

      {!ficheiro ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            onArrastar(true);
          }}
          onDragLeave={() => onArrastar(false)}
          onDrop={(e) => {
            e.preventDefault();
            onArrastar(false);
            onEscolher(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-14 text-center transition-colors ${
            aArrastar ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-slate-400'
          }`}
        >
          <Upload size={28} className={aArrastar ? 'text-blue-500' : 'text-slate-300'} />
          <p className="mt-3 text-sm font-medium text-slate-700">
            Arraste e solte o seu ficheiro aqui
          </p>
          <p className="mt-0.5 text-xs text-slate-500">ou clique para seleccionar</p>
          <p className="mt-3 text-[11px] text-slate-400">
            PDF, Word (.docx), Excel (.xlsx), ou uma fotografia — até {MAX_BYTES / 1024 / 1024} MB
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <IconeDoFicheiro nome={ficheiro.name} tipo={ficheiro.type} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">{ficheiro.name}</p>
            <p className="text-xs text-slate-500">{(ficheiro.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            onClick={onRemover}
            disabled={aAnalisar}
            className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          onClick={onAnalisar}
          disabled={!ficheiro || aAnalisar}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {aAnalisar ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              A analisar…
            </>
          ) : (
            <>
              <Sparkles size={15} />
              Analisar documento
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function IconeDoFicheiro({ nome, tipo }: { nome: string; tipo: string }) {
  const classe = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg';

  if (tipo.startsWith('image/')) {
    return (
      <div className={`${classe} bg-purple-100 text-purple-600`}>
        <ImageIcon size={18} />
      </div>
    );
  }
  if (tipo.includes('spreadsheet') || nome.match(/\.xlsx?$/i)) {
    return (
      <div className={`${classe} bg-emerald-100 text-emerald-600`}>
        <FileSpreadsheet size={18} />
      </div>
    );
  }
  return (
    <div className={`${classe} bg-blue-100 text-blue-600`}>
      <FileText size={18} />
    </div>
  );
}

/**
 * A tabela de revisão.
 *
 * Cada linha é editável directamente na tabela — nome, preço, quantidade, unidade — porque
 * corrigir «1.850,00» que a IA leu como «185000» não deve exigir abrir um segundo formulário
 * por produto. Só a imagem passa pelo modal completo, porque adicionar uma imagem a um
 * produto que ainda não existe é o mesmo fluxo que criar um artigo do zero.
 */
function TabelaDeRevisao({
  linhas,
  recusadas,
  comPreco,
  semPreco,
  aImportar,
  onActualizarLinha,
  onRemoverLinha,
  onEditarImagem,
  onCancelar,
  onConfirmar,
}: {
  linhas: LinhaRevisao[];
  recusadas: { linha: number; motivo: string }[];
  comPreco: number;
  semPreco: number;
  aImportar: boolean;
  onActualizarLinha: (chave: string, alteracoes: Partial<LinhaRevisao>) => void;
  onRemoverLinha: (chave: string) => void;
  onEditarImagem: (chave: string) => void;
  onCancelar: () => void;
  onConfirmar: () => void;
}) {
  const seleccionadas = linhas.filter((l) => l.incluir).length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Contador etiqueta="Produtos lidos" valor={linhas.length} cor="slate" />
        <Contador etiqueta="Seleccionados" valor={seleccionadas} cor="blue" />
        <Contador etiqueta="Com preço" valor={comPreco} cor="emerald" />
        <Contador etiqueta="Sem preço" valor={semPreco} cor={semPreco > 0 ? 'amber' : 'slate'} />
      </div>

      {recusadas.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
            <AlertTriangle size={13} />
            {recusadas.length} linha{recusadas.length === 1 ? '' : 's'} do documento não
            {recusadas.length === 1 ? ' foi lida' : ' foram lidas'}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-amber-800">
            {recusadas
              .slice(0, 3)
              .map((r) => `linha ${r.linha} (${r.motivo})`)
              .join(', ')}
            {recusadas.length > 3 ? `, e mais ${recusadas.length - 3}` : ''}. Acrescente-as à
            mão depois, em «Novo artigo».
          </p>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-left text-[11px] font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-8 px-3 py-2.5"></th>
              <th className="px-3 py-2.5">Produto</th>
              <th className="px-3 py-2.5">Embalagem</th>
              <th className="px-3 py-2.5">Qtd./emb.</th>
              <th className="px-3 py-2.5">Preço (MZN)</th>
              <th className="px-3 py-2.5">Stock</th>
              <th className="w-16 px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {linhas.map((linha) => (
              <LinhaDaTabela
                key={linha.chave}
                linha={linha}
                onActualizar={(alteracoes) => onActualizarLinha(linha.chave, alteracoes)}
                onRemover={() => onRemoverLinha(linha.chave)}
                onEditarImagem={() => onEditarImagem(linha.chave)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={onCancelar}
          disabled={aImportar}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirmar}
          disabled={aImportar || seleccionadas === 0}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {aImportar && <Loader2 size={15} className="animate-spin" />}
          Confirmar importação ({seleccionadas})
        </button>
      </div>
    </div>
  );
}

function Contador({
  etiqueta,
  valor,
  cor,
}: {
  etiqueta: string;
  valor: number;
  cor: 'slate' | 'blue' | 'emerald' | 'amber';
}) {
  const CORES: Record<typeof cor, string> = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <div className={`rounded-lg border px-3 py-2.5 ${CORES[cor]}`}>
      <p className="text-lg font-bold leading-none">{valor}</p>
      <p className="mt-1 text-[11px] font-medium leading-none">{etiqueta}</p>
    </div>
  );
}

function LinhaDaTabela({
  linha,
  onActualizar,
  onRemover,
  onEditarImagem,
}: {
  linha: LinhaRevisao;
  onActualizar: (alteracoes: Partial<LinhaRevisao>) => void;
  onRemover: () => void;
  onEditarImagem: () => void;
}) {
  const vendeAUnidade = !linha.tipoEmbalagem;
  const semPreco = linha.preco === undefined || linha.preco <= 0;

  return (
    <tr className={linha.incluir ? undefined : 'bg-slate-50 opacity-60'}>
      <td className="px-3 py-2">
        <input
          type="checkbox"
          checked={linha.incluir}
          onChange={(e) => onActualizar({ incluir: e.target.checked })}
          className="rounded border-slate-300"
        />
      </td>
      <td className="min-w-[220px] px-3 py-2">
        <input
          value={linha.nome}
          onChange={(e) => onActualizar({ nome: e.target.value })}
          disabled={!linha.incluir}
          className="w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-sm font-medium text-slate-800 hover:border-slate-200 focus:border-blue-400 focus:bg-white focus:outline-none disabled:hover:border-transparent"
        />
        {linha.marca && <p className="px-1.5 text-[11px] text-slate-400">{linha.marca}</p>}
      </td>
      <td className="min-w-[140px] px-3 py-2">
        <select
          value={linha.tipoEmbalagem ?? ''}
          onChange={(e) => onActualizar({ tipoEmbalagem: e.target.value || undefined })}
          disabled={!linha.incluir}
          className="w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-xs hover:border-slate-200 focus:border-blue-400 focus:bg-white focus:outline-none"
        >
          {TIPOS_DE_EMBALAGEM.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.etiqueta}
            </option>
          ))}
        </select>
      </td>
      <td className="min-w-[140px] px-3 py-2">
        {vendeAUnidade ? (
          <select
            value={linha.unidadeMedida ?? ''}
            onChange={(e) => onActualizar({ unidadeMedida: e.target.value || undefined })}
            disabled={!linha.incluir}
            className="w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-xs hover:border-slate-200 focus:border-blue-400 focus:bg-white focus:outline-none"
          >
            <option value="">Unidade…</option>
            {UNIDADES_COMUNS.map((u) => (
              <option key={u.valor} value={u.valor}>
                {u.etiqueta}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="1"
              value={linha.unidadesPorEmbalagem}
              onChange={(e) => onActualizar({ unidadesPorEmbalagem: Number(e.target.value) })}
              disabled={!linha.incluir}
              className="w-14 rounded border border-transparent bg-transparent px-1 py-1 text-xs hover:border-slate-200 focus:border-blue-400 focus:bg-white focus:outline-none"
            />
            <span className="text-[11px] text-slate-400">×</span>
            <input
              type="number"
              min="0"
              step="any"
              value={linha.conteudoPorUnidade}
              onChange={(e) => onActualizar({ conteudoPorUnidade: Number(e.target.value) })}
              disabled={!linha.incluir}
              className="w-14 rounded border border-transparent bg-transparent px-1 py-1 text-xs hover:border-slate-200 focus:border-blue-400 focus:bg-white focus:outline-none"
            />
            <select
              value={linha.unidadeMedida ?? ''}
              onChange={(e) => onActualizar({ unidadeMedida: e.target.value || undefined })}
              disabled={!linha.incluir}
              className="rounded border border-transparent bg-transparent px-1 py-1 text-xs hover:border-slate-200 focus:border-blue-400 focus:bg-white focus:outline-none"
            >
              <option value="">un.</option>
              {UNIDADES_COMUNS.map((u) => (
                <option key={u.valor} value={u.valor}>
                  {u.valor}
                </option>
              ))}
            </select>
          </div>
        )}
      </td>
      <td className="min-w-[110px] px-3 py-2">
        <input
          type="number"
          min="0"
          step="any"
          value={linha.preco ?? ''}
          onChange={(e) => onActualizar({ preco: e.target.value ? Number(e.target.value) : undefined })}
          disabled={!linha.incluir}
          placeholder="—"
          className={`w-full rounded border bg-transparent px-1.5 py-1 text-sm focus:bg-white focus:outline-none ${
            semPreco && linha.incluir
              ? 'border-amber-300 focus:border-amber-400'
              : 'border-transparent hover:border-slate-200 focus:border-blue-400'
          }`}
        />
      </td>
      <td className="min-w-[90px] px-3 py-2">
        <input
          type="number"
          min="0"
          value={linha.quantidadeDisponivel ?? ''}
          onChange={(e) =>
            onActualizar({
              quantidadeDisponivel: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          disabled={!linha.incluir}
          placeholder="—"
          className="w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-sm hover:border-slate-200 focus:border-blue-400 focus:bg-white focus:outline-none"
        />
      </td>
      <td className="px-3 py-2 text-right">
        <button
          onClick={onEditarImagem}
          title={linha.imagemUrl ? 'Mudar a imagem' : 'Adicionar imagem a este produto'}
          className={`mr-1 rounded p-1 hover:bg-slate-100 ${
            linha.imagemUrl ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'
          }`}
        >
          <ImageIcon size={14} />
        </button>
        <button
          onClick={onRemover}
          title="Remover da lista"
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
        >
          <X size={14} />
        </button>
      </td>
    </tr>
  );
}

function ResumoConclusao({
  resultado,
  onNovaImportacao,
  onVerVitrine,
}: {
  resultado: { resultados: ResultadoLinhaImportacao[]; criados: number; falhados: number };
  onNovaImportacao: () => void;
  onVerVitrine: () => void;
}) {
  const falhas = resultado.resultados.filter((r) => !r.sucesso);
  const criadosSemPreco = resultado.resultados.filter((r) => r.sucesso && r.erro);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle2 size={24} className="text-emerald-600" />
      </div>

      <h2 className="mt-3 text-lg font-semibold text-slate-900">
        {resultado.criados} produto{resultado.criados === 1 ? '' : 's'} importado
        {resultado.criados === 1 ? '' : 's'}
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Os novos artigos entraram em rascunho — publique-os na sua vitrine quando estiver
        pronto.
      </p>

      {criadosSemPreco.length > 0 && (
        <div className="mx-auto mt-4 max-w-md rounded-lg border border-amber-200 bg-amber-50 p-3 text-left">
          <p className="text-xs font-medium text-amber-900">
            {criadosSemPreco.length} produto{criadosSemPreco.length === 1 ? '' : 's'} criado
            {criadosSemPreco.length === 1 ? '' : 's'} sem preço
          </p>
          <ul className="mt-1 space-y-0.5">
            {criadosSemPreco.map((l) => (
              <li key={l.artigoId} className="text-[11px] text-amber-800">
                {l.nome}
              </li>
            ))}
          </ul>
        </div>
      )}

      {falhas.length > 0 && (
        <div className="mx-auto mt-3 max-w-md rounded-lg border border-red-200 bg-red-50 p-3 text-left">
          <p className="text-xs font-medium text-red-900">
            {falhas.length} produto{falhas.length === 1 ? '' : 's'} não importado
            {falhas.length === 1 ? '' : 's'}
          </p>
          <ul className="mt-1 space-y-0.5">
            {falhas.map((l, i) => (
              <li key={i} className="text-[11px] text-red-800">
                {l.nome}: {l.erro}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 flex justify-center gap-2">
        <button
          onClick={onNovaImportacao}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Importar outro documento
        </button>
        <button
          onClick={onVerVitrine}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Ver a minha vitrine
        </button>
      </div>
    </div>
  );
}

/**
 * Adiciona (ou muda) a imagem de uma linha, antes de confirmar a importação.
 *
 * Um modal pequeno e não o `ArtigoFormModal` inteiro: a linha já tem tudo o que o
 * documento leu — nome, preço, embalagem — e a única coisa que falta é o URL da imagem,
 * porque nenhum documento traz uma. Abrir o formulário completo repetiria campos já
 * preenchidos na tabela, e criaria a confusão de dois sítios a editar o mesmo produto ao
 * mesmo tempo.
 */
function ModalImagemLinha({
  linha,
  onFechar,
  onGravar,
}: {
  linha: LinhaRevisao;
  onFechar: () => void;
  onGravar: (imagemUrl: string) => void;
}) {
  const [url, setUrl] = useState(linha.imagemUrl ?? '');
  const [falhou, setFalhou] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-900">Imagem — {linha.nome}</h3>
          <button onClick={onFechar} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </header>

        <div className="space-y-3 px-5 py-4">
          <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            {url.trim() && !falhou ? (
              <img
                src={url.trim()}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setFalhou(true)}
                onLoad={() => setFalhou(false)}
              />
            ) : (
              <ImageIcon size={22} className="text-slate-300" />
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">URL da imagem</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://exemplo.com/produto.png"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <footer className="flex justify-end gap-2 rounded-b-xl border-t border-slate-100 bg-slate-50 px-5 py-4">
          <button
            onClick={onFechar}
            className="rounded-md border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-white"
          >
            Cancelar
          </button>
          <button
            onClick={() => onGravar(url)}
            className="rounded-md bg-blue-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700"
          >
            Guardar
          </button>
        </footer>
      </div>
    </div>
  );
}
