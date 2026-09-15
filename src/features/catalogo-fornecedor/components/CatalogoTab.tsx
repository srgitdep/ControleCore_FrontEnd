import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileSpreadsheet, Loader2, Upload, ChevronRight, Info, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/shared/utils';
import { suppliersApi } from '@/features/fornecedores';
import { catalogoFornecedorApi, ROTULO_ESTADO_IMPORTACAO } from '../api/catalogo.api';
import type { EstadoImportacao } from '../api/catalogo.api';
import { RevisaoImportacaoModal } from './RevisaoImportacaoModal';
import { MapeamentosModal } from './MapeamentosModal';

/**
 * Importação de catálogos de fornecedor.
 *
 * ## Porque é que o ficheiro é lido no browser
 *
 * O backend recebe o **conteúdo em texto**, e não o ficheiro. É mais simples dos dois
 * lados — sem `multipart`, sem armazenamento temporário — e permite que a leitura falhe
 * cedo, aqui, quando alguém escolhe um `.xlsx` por engano.
 *
 * ## Excel não passa, e o ecrã di-lo
 *
 * `.xlsx` é um ZIP com XML lá dentro; lê-lo precisa de uma biblioteca que ainda não foi
 * decidida. Recusar aqui com uma explicação é melhor do que enviar bytes binários que o
 * servidor vai tentar ler como CSV e devolver mil linhas de lixo.
 */
export function CatalogoTab() {
  const queryClient = useQueryClient();
  const [fornecedorId, setFornecedorId] = useState('');
  const [aImportar, setAImportar] = useState(false);
  const [aRever, setARever] = useState<string | null>(null);
  const [aVerMapeamentos, setAVerMapeamentos] = useState(false);
  const ficheiroRef = useRef<HTMLInputElement>(null);

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => suppliersApi.getSuppliers(),
  });

  const { data: importacoes = [], isLoading } = useQuery({
    queryKey: ['importacoes', fornecedorId],
    queryFn: () => catalogoFornecedorApi.listar(fornecedorId || undefined),
  });

  const escolherFicheiro = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const ficheiro = e.target.files?.[0];
    e.target.value = '';
    if (!ficheiro) return;

    if (!fornecedorId) {
      toast.error('Escolhe primeiro o fornecedor a que este catálogo pertence.');
      return;
    }

    if (/\.(xlsx|xls)$/i.test(ficheiro.name)) {
      toast.error(
        'Ficheiros Excel ainda não são lidos. Grava como CSV (separado por ponto e vírgula) e importa outra vez.',
        { duration: 8000 },
      );
      return;
    }

    setAImportar(true);
    try {
      const conteudo = await ficheiro.text();
      const importacao = await catalogoFornecedorApi.importar({
        fornecedorId,
        conteudo,
        ficheiroNome: ficheiro.name,
      });

      toast.success(
        `${importacao.totalLinhas} linhas lidas: ${importacao.linhasMapeadas} prontas, ` +
          `${importacao.linhasPorRever} por rever.`,
      );

      queryClient.invalidateQueries({ queryKey: ['importacoes'] });
      // Abre logo a revisão: ler o ficheiro sem olhar para o resultado não serve de nada,
      // e obrigar a procurar a linha na lista é um passo a mais sem valor.
      setARever(importacao.id);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao ler o ficheiro.', {
        duration: 8000,
      });
    } finally {
      setAImportar(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <Info size={18} className="mt-0.5 shrink-0 text-slate-400" />
        <div className="text-sm text-slate-600">
          <p>
            Importar <strong className="text-slate-800">não altera o catálogo</strong>: lê o
            ficheiro, propõe as correspondências e deixa tudo em espera. Só depois de rever é
            que se aplica.
          </p>
          <p className="mt-1.5 text-xs">
            Código de barras igual entra pronto. Semelhança de descrição fica sempre por rever,
            mesmo quando é forte — «Coca-Cola 2L» e «Coca-Cola 1L» são o mesmo texto com um
            caracter de diferença e artigos diferentes.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label className="mb-1.5 block text-xs font-medium text-slate-600">Fornecedor</label>
          <select
            value={fornecedorId}
            onChange={(e) => setFornecedorId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="">Todos (só para consultar)</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </div>

        {fornecedorId && (
          <button
            onClick={() => setAVerMapeamentos(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Package size={16} /> Ver catálogo mapeado
          </button>
        )}

        <input
          ref={ficheiroRef}
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          onChange={escolherFicheiro}
          className="hidden"
        />
        <button
          onClick={() => ficheiroRef.current?.click()}
          disabled={aImportar || !fornecedorId}
          title={!fornecedorId ? 'Escolhe primeiro o fornecedor' : undefined}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {aImportar ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Upload size={16} />
          )}
          Importar CSV
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          A carregar importações...
        </div>
      ) : importacoes.length === 0 ? (
        <div className="py-16 text-center">
          <FileSpreadsheet className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="text-sm font-medium text-slate-700">Ainda não há importações.</p>
          <p className="mt-1 text-sm text-slate-500">
            Escolhe um fornecedor e carrega a lista de preços em CSV.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Ficheiro</th>
                <th className="hidden px-3 py-2.5 font-medium sm:table-cell">Data</th>
                <th className="px-3 py-2.5 text-right font-medium">Linhas</th>
                <th className="hidden px-3 py-2.5 text-right font-medium md:table-cell">
                  Prontas / Por rever
                </th>
                <th className="px-3 py-2.5 font-medium">Estado</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {importacoes.map((i) => (
                <tr
                  key={i.id}
                  onClick={() => setARever(i.id)}
                  className="cursor-pointer hover:bg-slate-50/60"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {i.ficheiroNome ?? `#${i.id.slice(0, 8)}`}
                  </td>
                  <td className="hidden px-3 py-3 text-slate-500 sm:table-cell">
                    {new Date(i.criadaEm).toLocaleDateString('pt-MZ')}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-700">{i.totalLinhas}</td>
                  <td className="hidden px-3 py-3 text-right text-xs md:table-cell">
                    <span className="text-emerald-600">{i.linhasMapeadas}</span>
                    {i.linhasPorRever > 0 && (
                      <>
                        {' / '}
                        <span className="text-amber-600">{i.linhasPorRever}</span>
                      </>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <EstadoImportacaoBadge estado={i.estado} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChevronRight size={16} className="inline text-slate-300" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {aRever && (
        <RevisaoImportacaoModal
          importacaoId={aRever}
          onClose={() => setARever(null)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['importacoes'] })}
        />
      )}

      {aVerMapeamentos && fornecedorId && (
        <MapeamentosModal
          fornecedorId={fornecedorId}
          nomeFornecedor={fornecedores.find((f) => f.id === fornecedorId)?.nome ?? ''}
          onClose={() => setAVerMapeamentos(false)}
        />
      )}
    </div>
  );
}

function EstadoImportacaoBadge({ estado }: { estado: EstadoImportacao }) {
  const cores: Record<EstadoImportacao, string> = {
    EM_REVISAO: 'bg-amber-100 text-amber-800',
    APLICADA: 'bg-emerald-100 text-emerald-700',
    REVERTIDA: 'bg-slate-100 text-slate-600',
    CANCELADA: 'bg-slate-100 text-slate-500',
  };

  return (
    <span
      className={cn(
        'whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        cores[estado],
      )}
    >
      {ROTULO_ESTADO_IMPORTACAO[estado]}
    </span>
  );
}
