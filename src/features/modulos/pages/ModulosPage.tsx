import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Info, Package, Pencil, Plus, Power, RotateCcw, Trash2 } from 'lucide-react';
import { BarraDaPagina, Button, Card, ConfirmDialog } from '@/shared/ui';
import { cn } from '@/shared/utils';
import { modulosApi, type CriarModuloDto, type Modulo } from '../api/modulos.api';

const moeda = (valor: number) =>
  Number(valor).toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });

/**
 * O catálogo de módulos da plataforma.
 *
 * ## Porquê um ecrã próprio, e para o SUPER_ADMIN
 *
 * `Modulo` é global: não tem `empresaId`, e o `codigo` é único em toda a plataforma. É a
 * lista do que o ControlCore vende. Não é configuração de uma empresa, e por isso não
 * pertence à página de Configuração — pertence à administração da plataforma, ao lado de
 * Empresas.
 *
 * ## Retirar de venda contra apagar
 *
 * Desactivar tira o módulo do catálogo de novas subscrições e deixa em vigor as
 * assinaturas que já o incluem. Apagar é definitivo e o servidor só o aceita quando
 * nenhuma assinatura o referencia. As duas acções existem porque respondem a perguntas
 * diferentes: «deixámos de vender isto» e «isto foi criado por erro».
 */
export function ModulosPage() {
  const queryClient = useQueryClient();
  const [incluirInativos, setIncluirInativos] = useState(true);
  const [aCriar, setACriar] = useState(false);
  const [aEditar, setAEditar] = useState<Modulo | null>(null);
  const [aApagar, setAApagar] = useState<Modulo | null>(null);

  const { data: modulos, isLoading } = useQuery({
    queryKey: ['modulos', incluirInativos],
    queryFn: () => modulosApi.listar(incluirInativos),
  });

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['modulos'] });
    // O onboarding oferece o catálogo à venda; um módulo novo ou retirado muda a oferta.
    queryClient.invalidateQueries({ queryKey: ['catalogo-modulos'] });
  };

  const aoFalhar = (erro: any) =>
    toast.error(erro?.response?.data?.message || 'Não foi possível concluir a operação.');

  const criar = useMutation({
    mutationFn: modulosApi.criar,
    onSuccess: (m) => {
      invalidar();
      setACriar(false);
      toast.success(`Módulo "${m.nome}" criado.`);
    },
    onError: aoFalhar,
  });

  const actualizar = useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & Partial<CriarModuloDto>) =>
      modulosApi.actualizar(id, dto),
    onSuccess: () => {
      invalidar();
      setAEditar(null);
      toast.success('Módulo actualizado.');
    },
    onError: aoFalhar,
  });

  const alterarEstado = useMutation({
    mutationFn: ({ id, isAtivo }: { id: string; isAtivo: boolean }) =>
      modulosApi.alterarEstado(id, isAtivo),
    onSuccess: (_, v) => {
      invalidar();
      toast.success(
        v.isAtivo
          ? 'Módulo de volta ao catálogo.'
          : 'Módulo retirado de venda. As assinaturas em vigor continuam.',
      );
    },
    onError: aoFalhar,
  });

  const apagar = useMutation({
    mutationFn: (id: string) => modulosApi.apagar(id),
    onSuccess: () => {
      invalidar();
      setAApagar(null);
      toast.success('Módulo apagado.');
    },
    onError: (erro: any) => {
      setAApagar(null);
      aoFalhar(erro);
    },
  });

  const aVenda = (modulos ?? []).filter((m) => m.isAtivo).length;

  return (
    <div className="space-y-4">
      <BarraDaPagina
        resumo={
          modulos
            ? `${modulos.length} módulo(s) no catálogo · ${aVenda} à venda`
            : undefined
        }
        acoes={
          <Button onClick={() => setACriar(true)}>
            <Plus size={16} className="mr-1.5" />
            Novo módulo
          </Button>
        }
      />

      <Card className="border-blue-100 bg-blue-50/50">
        <div className="flex gap-3 p-4">
          <Info className="mt-0.5 shrink-0 text-blue-500" size={18} />
          <div className="text-sm text-blue-900">
            <p>
              Este catálogo é da plataforma, não de uma empresa: o código de cada módulo é
              único em todo o ControlCore, e é o que as assinaturas referenciam.
            </p>
            <p className="mt-1 text-blue-800">
              Retirar de venda mantém as assinaturas em vigor. Apagar é definitivo, e o
              servidor recusa se alguma assinatura incluir o módulo.
            </p>
          </div>
        </div>
      </Card>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={incluirInativos}
          onChange={(e) => setIncluirInativos(e.target.checked)}
          className="rounded border-slate-300"
        />
        Mostrar os retirados de venda
      </label>

      {isLoading && <p className="text-sm text-slate-400">A carregar…</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[42rem] text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Código</th>
              <th className="px-3 py-2 text-left font-medium">Módulo</th>
              <th className="px-3 py-2 text-right font-medium">Preço / mês</th>
              <th className="px-3 py-2 text-right font-medium">Ordem</th>
              <th className="px-3 py-2 text-left font-medium">Estado</th>
              <th className="w-24" />
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {modulos?.map((m) => (
              <tr key={m.id} className={cn(!m.isAtivo && 'opacity-50')}>
                <td className="px-3 py-2 font-mono text-xs font-semibold text-slate-700">
                  {m.codigo}
                </td>
                <td className="px-3 py-2">
                  <span className="font-medium text-slate-900">{m.nome}</span>
                  {m.descricao && (
                    <span className="block text-xs text-slate-400">{m.descricao}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-semibold text-slate-900">
                  {moeda(m.precoMensal)}
                </td>
                <td className="px-3 py-2 text-right text-slate-500">{m.ordem}</td>
                <td className="px-3 py-2">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-medium',
                      m.isAtivo
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    {m.isAtivo ? 'À venda' : 'Retirado'}
                  </span>
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setAEditar(m)}
                      title="Editar"
                      className="text-slate-400 hover:text-indigo-600"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => alterarEstado.mutate({ id: m.id, isAtivo: !m.isAtivo })}
                      title={m.isAtivo ? 'Retirar de venda' : 'Voltar a pôr à venda'}
                      className={cn(
                        'text-slate-400',
                        m.isAtivo ? 'hover:text-amber-600' : 'hover:text-emerald-600',
                      )}
                    >
                      {m.isAtivo ? <Power size={15} /> : <RotateCcw size={15} />}
                    </button>
                    <button
                      onClick={() => setAApagar(m)}
                      title="Apagar"
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {modulos?.length === 0 && !isLoading && (
              <tr>
                <td colSpan={6} className="px-3 py-12 text-center">
                  <Package className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                  <p className="text-sm font-medium text-slate-700">Catálogo vazio.</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Sem módulos, o onboarding de uma empresa não tem nada para subscrever e a
                    assinatura nasce a zero.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(aCriar || aEditar) && (
        <ModalDeModulo
          modulo={aEditar}
          aGravar={criar.isPending || actualizar.isPending}
          aoFechar={() => {
            setACriar(false);
            setAEditar(null);
          }}
          aoGravar={(dto) =>
            aEditar
              ? actualizar.mutate({ id: aEditar.id, ...dto })
              : criar.mutate(dto as CriarModuloDto)
          }
        />
      )}

      <ConfirmDialog
        isOpen={!!aApagar}
        title="Apagar módulo"
        message={
          `Apagar "${aApagar?.nome ?? ''}" é definitivo. Se alguma assinatura o incluir, o ` +
          'servidor recusa — nesse caso retire-o de venda em vez de o apagar.'
        }
        confirmText="Apagar"
        variant="danger"
        isLoading={apagar.isPending}
        onConfirm={() => aApagar && apagar.mutate(aApagar.id)}
        onCancel={() => setAApagar(null)}
      />
    </div>
  );
}

function ModalDeModulo({
  modulo,
  aGravar,
  aoGravar,
  aoFechar,
}: {
  modulo: Modulo | null;
  aGravar: boolean;
  aoGravar: (dto: Partial<CriarModuloDto>) => void;
  aoFechar: () => void;
}) {
  const [codigo, setCodigo] = useState(modulo?.codigo ?? '');
  const [nome, setNome] = useState(modulo?.nome ?? '');
  const [descricao, setDescricao] = useState(modulo?.descricao ?? '');
  const [preco, setPreco] = useState(modulo ? String(modulo.precoMensal) : '');
  const [ordem, setOrdem] = useState(modulo ? String(modulo.ordem) : '0');

  const valido = !!nome.trim() && preco !== '' && Number(preco) >= 0 && (!!modulo || !!codigo.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="font-semibold text-slate-900">
            {modulo ? `Editar ${modulo.codigo}` : 'Novo módulo'}
          </h3>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="text-sm font-medium text-slate-700">Código</label>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/\s/g, '_'))}
              disabled={!!modulo}
              placeholder="STOCK"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm uppercase focus:border-blue-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
            />
            <p className="mt-1 text-xs text-slate-400">
              {modulo
                ? 'O código não se altera: é o que as assinaturas já emitidas referenciam.'
                : 'Único em toda a plataforma. É por ele que as assinaturas referenciam o módulo.'}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Gestão de Stock"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Descrição <span className="text-slate-400">(opcional)</span>
            </label>
            <input
              value={descricao ?? ''}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Armazéns, inventário, lotes e validades"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Preço / mês (MT)</label>
              <input
                type="number"
                step="any"
                min="0"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-right text-sm focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Ordem</label>
              <input
                type="number"
                min="0"
                value={ordem}
                onChange={(e) => setOrdem(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-right text-sm focus:border-blue-400 focus:outline-none"
              />
              <p className="mt-1 text-xs text-slate-400">Posição no catálogo.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <Button variant="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button
            disabled={!valido || aGravar}
            onClick={() =>
              aoGravar({
                // Numa edição o código não vai no corpo: está desactivado no ecrã, e
                // enviá-lo igual seria pedir ao servidor para validar unicidade contra si
                // mesmo.
                ...(modulo ? {} : { codigo: codigo.trim() }),
                nome: nome.trim(),
                descricao: descricao?.trim() || undefined,
                precoMensal: Number(preco),
                ordem: Number(ordem) || 0,
              })
            }
          >
            {modulo ? 'Gravar' : 'Criar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
