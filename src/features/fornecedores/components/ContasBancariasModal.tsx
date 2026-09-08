import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Loader2,
  Landmark,
  ShieldAlert,
  Check,
  Ban,
  Plus,
  Phone,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/shared/utils';
import { b2bFornecedorApi, ROTULO_ESTADO_CONTA } from '../api/suppliers.api';
import type { ContaBancaria, EstadoContaBancaria } from '../api/suppliers.api';

interface Props {
  organizacaoId: string;
  nomeFornecedor: string;
  onClose: () => void;
}

/**
 * As contas bancárias de um fornecedor, e o controlo que as protege.
 *
 * ## Porque é que este ecrã existe
 *
 * A fraude mais comum em contas a pagar não é uma factura falsa: é um e-mail a dizer
 * «mudámos de banco, paguem para este IBAN». Com um campo de IBAN na ficha do fornecedor,
 * isso é uma edição como outra qualquer — sem segunda pessoa, sem comprovativo, e sem
 * deixar o IBAN anterior visível para alguém reparar que mudou na véspera do pagamento.
 *
 * Aqui cada conta é uma linha com estado próprio. A anterior fica como substituída e
 * **nunca** é apagada: é ela que responde a «para onde é que pagámos em Março».
 *
 * ## Quem pede não aprova, sem excepção
 *
 * É a única separação em bloqueio absoluto, junto com a criação de fornecedor. Numa
 * operação de uma pessoa só, isto significa que a alteração fica à espera de alguém com
 * acesso — e é essa a intenção.
 */
export function ContasBancariasModal({ organizacaoId, nomeFornecedor, onClose }: Props) {
  const queryClient = useQueryClient();
  const [aPedir, setAPedir] = useState(false);
  const [aDecidir, setADecidir] = useState<ContaBancaria | null>(null);

  const { data: contas = [], isLoading } = useQuery({
    queryKey: ['contas-bancarias', organizacaoId],
    queryFn: () => b2bFornecedorApi.listarContas(organizacaoId),
  });

  const activa = contas.find((c) => c.estado === 'ACTIVA');
  const pendente = contas.find((c) => c.estado === 'PENDENTE');
  const historico = contas.filter((c) => c.estado !== 'ACTIVA' && c.estado !== 'PENDENTE');

  const recarregar = () =>
    queryClient.invalidateQueries({ queryKey: ['contas-bancarias', organizacaoId] });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Landmark size={16} className="text-slate-400" />
              Contas bancárias
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">{nomeFornecedor}</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-5 px-5 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              A carregar...
            </div>
          ) : (
            <>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Conta em uso
                </p>
                {activa ? (
                  <CartaoConta conta={activa} />
                ) : (
                  <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                    Nenhuma conta aprovada. Não há para onde pagar a este fornecedor.
                  </p>
                )}
              </div>

              {pendente && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-amber-600">
                    Alteração por aprovar
                  </p>
                  <CartaoConta conta={pendente} destaque />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => setADecidir(pendente)}
                      className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
                    >
                      <ShieldAlert size={15} />
                      Verificar e decidir
                    </button>
                  </div>
                </div>
              )}

              {!pendente && (
                <button
                  onClick={() => setAPedir(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                >
                  <Plus size={15} />
                  Pedir alteração de conta
                </button>
              )}

              {historico.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Histórico
                  </p>
                  {/* Nunca se apaga uma conta: é o histórico que responde a «para onde
                      pagámos em Março». */}
                  <div className="space-y-2">
                    {historico.map((c) => (
                      <CartaoConta key={c.id} conta={c} compacto />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {aPedir && (
        <PedirContaModal
          organizacaoId={organizacaoId}
          onClose={() => setAPedir(false)}
          onSuccess={recarregar}
        />
      )}

      {aDecidir && (
        <DecidirContaModal
          conta={aDecidir}
          contaActual={activa ?? null}
          onClose={() => setADecidir(null)}
          onSuccess={recarregar}
        />
      )}
    </div>
  );
}

function CartaoConta({
  conta,
  destaque,
  compacto,
}: {
  conta: ContaBancaria;
  destaque?: boolean;
  compacto?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        destaque ? 'border-amber-300 bg-amber-50' : 'border-slate-200',
        compacto && 'opacity-75',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{conta.banco}</p>
          <p className="mt-0.5 break-all font-mono text-sm text-slate-600">{conta.iban}</p>
          {conta.titular && <p className="mt-0.5 text-xs text-slate-500">{conta.titular}</p>}
        </div>
        <EstadoConta estado={conta.estado} />
      </div>

      <div className="mt-2.5 space-y-0.5 border-t border-slate-200/70 pt-2 text-xs text-slate-500">
        <p>
          Pedida por {conta.solicitadaPor?.name ?? '—'} ·{' '}
          {new Date(conta.solicitadaEm).toLocaleDateString('pt-MZ')}
        </p>
        {conta.decididaPor && (
          <p>
            Decidida por {conta.decididaPor.name}
            {conta.decididaEm && ` · ${new Date(conta.decididaEm).toLocaleDateString('pt-MZ')}`}
          </p>
        )}
        {conta.canalVerificacao && (
          <p className="flex items-start gap-1 text-slate-600">
            <Phone size={11} className="mt-0.5 shrink-0" />
            {conta.canalVerificacao}
          </p>
        )}
        {conta.motivoDecisao && <p className="italic">{conta.motivoDecisao}</p>}
      </div>
    </div>
  );
}

function EstadoConta({ estado }: { estado: EstadoContaBancaria }) {
  const cores: Record<EstadoContaBancaria, string> = {
    ACTIVA: 'bg-emerald-100 text-emerald-700',
    PENDENTE: 'bg-amber-100 text-amber-800',
    RECUSADA: 'bg-rose-100 text-rose-700',
    SUBSTITUIDA: 'bg-slate-100 text-slate-600',
  };

  return (
    <span
      className={cn(
        'shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        cores[estado],
      )}
    >
      {ROTULO_ESTADO_CONTA[estado]}
    </span>
  );
}

function PedirContaModal({
  organizacaoId,
  onClose,
  onSuccess,
}: {
  organizacaoId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [banco, setBanco] = useState('');
  const [iban, setIban] = useState('');
  const [titular, setTitular] = useState('');
  const [comprovativoUrl, setComprovativoUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const r = await b2bFornecedorApi.pedirConta(organizacaoId, {
        banco: banco.trim(),
        iban: iban.trim(),
        titular: titular.trim() || undefined,
        comprovativoUrl: comprovativoUrl.trim() || undefined,
      });

      if (r.avisoIbanJaRecusado) {
        // Repetir um IBAN recusado não é proibido — pode vir agora com o comprovativo
        // que faltava. Mas quem vai aprovar tem de saber.
        toast(r.avisoIbanJaRecusado, { icon: '⚠️', duration: 8000 });
      }

      toast.success('Pedido registado. A conta só passa a valer depois de outra pessoa a aprovar.');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao registar o pedido.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Pedir alteração de conta</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </header>

        <form onSubmit={submeter} className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Banco *</label>
            <input
              required
              value={banco}
              onChange={(e) => setBanco(e.target.value)}
              placeholder="Millennium BIM"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-300 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">IBAN *</label>
            <input
              required
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder="MZ59 0001 0000 0011 8341 9415 7"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm placeholder:text-slate-300 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Titular</label>
            <input
              value={titular}
              onChange={(e) => setTitular(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Comprovativo <span className="text-slate-400">(link)</span>
            </label>
            <input
              value={comprovativoUrl}
              onChange={(e) => setComprovativoUrl(e.target.value)}
              placeholder="Declaração do banco, cheque anulado..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-300 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <p className="mt-1 text-xs text-slate-500">
              Opcional agora, obrigatório para aprovar — quem pede pode estar à espera do
              documento do fornecedor.
            </p>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {isSaving && <Loader2 size={14} className="animate-spin" />}
              Registar pedido
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * A aprovação — o segundo par de olhos.
 *
 * Mostra o IBAN antigo ao lado do novo, porque a fraude que isto trava depende de ninguém
 * reparar que o número mudou.
 */
function DecidirContaModal({
  conta,
  contaActual,
  onClose,
  onSuccess,
}: {
  conta: ContaBancaria;
  contaActual: ContaBancaria | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [canal, setCanal] = useState('');
  const [motivo, setMotivo] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const semComprovativo = !conta.comprovativoUrl;

  const decidir = async (aprovar: boolean) => {
    if (aprovar && canal.trim().length < 10) {
      toast.error(
        'Descreve como confirmaste a alteração por um canal independente do que a pediu.',
      );
      return;
    }
    if (!aprovar && motivo.trim().length < 5) {
      toast.error('A recusa exige um motivo — é o que quem voltar a pedir vai ler.');
      return;
    }

    setIsSaving(true);
    try {
      await b2bFornecedorApi.decidirConta(conta.id, {
        aprovar,
        canalVerificacao: aprovar ? canal.trim() : undefined,
        motivo: motivo.trim() || undefined,
      });
      toast.success(aprovar ? 'Conta aprovada e em uso.' : 'Pedido recusado.');
      onSuccess();
      onClose();
    } catch (error: any) {
      // O 403 da segregação de funções traz a regra na mensagem. Mostrá-la é o que
      // explica a quem tentou porque é que não pode.
      toast.error(error?.response?.data?.message || 'Erro ao decidir.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <ShieldAlert size={16} className="text-amber-500" />
            Verificar alteração de conta
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-4 px-5 py-4">
          {/* O antes e o depois lado a lado. A fraude que isto trava depende de ninguém
              reparar que o número mudou. */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Conta actual</p>
              {contaActual ? (
                <>
                  <p className="mt-1 text-sm font-medium text-slate-800">{contaActual.banco}</p>
                  <p className="mt-0.5 break-all font-mono text-xs text-slate-600">
                    {contaActual.iban}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-slate-500">Nenhuma</p>
              )}
            </div>
            <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-3">
              <p className="text-xs text-amber-700">Passa a ser</p>
              <p className="mt-1 text-sm font-medium text-amber-900">{conta.banco}</p>
              <p className="mt-0.5 break-all font-mono text-xs text-amber-800">{conta.iban}</p>
            </div>
          </div>

          {semComprovativo && (
            <div className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <p>
                <strong>Sem comprovativo de titularidade.</strong> Não é possível aprovar: um
                IBAN sem documento que prove de quem é são as palavras de quem o escreveu.
              </p>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Como confirmaste, por canal independente? <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={canal}
              onChange={(e) => setCanal(e.target.value)}
              rows={2}
              placeholder="Telefonema para o número do contrato, 04/09, atendeu o responsável financeiro."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-300 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <p className="mt-1 text-xs text-slate-500">
              Um pedido que chega por e-mail e é confirmado por resposta ao mesmo e-mail não foi
              confirmado: quem controla a caixa de correio controla os dois lados.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Motivo <span className="text-slate-400">(obrigatório para recusar)</span>
            </label>
            <input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Fechar
          </button>
          <button
            onClick={() => decidir(false)}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
          >
            <Ban size={14} /> Recusar
          </button>
          <button
            onClick={() => decidir(true)}
            disabled={isSaving || semComprovativo}
            title={semComprovativo ? 'Falta o comprovativo de titularidade' : undefined}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Aprovar
          </button>
        </div>
      </div>
    </div>
  );
}
