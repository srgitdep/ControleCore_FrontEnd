import { useEffect, useState } from 'react';
import { Check, Loader2, Search, UserPlus, X } from 'lucide-react';
import { useSearchClientes, useRegistarClienteNoBalcao } from '@/features/crm';
import type { CanalComunicacao, Cliente } from '@/features/crm';
import { cn } from '@/shared/utils';

/**
 * Canais que o cliente pode aceitar no balcão.
 *
 * Só os que o sistema sabe entregar. Chamada e push ficam de fora: a primeira
 * não serve campanhas, a segunda exige uma aplicação móvel que não existe.
 */
const CANAIS: Array<{ id: CanalComunicacao; rotulo: string; precisaDe: 'telefone' | 'email' }> = [
  { id: 'WHATSAPP', rotulo: 'WhatsApp', precisaDe: 'telefone' },
  { id: 'SMS', rotulo: 'SMS', precisaDe: 'telefone' },
  { id: 'EMAIL', rotulo: 'E-mail', precisaDe: 'email' },
];

/**
 * Identifica o cliente no balcão, ou regista-o sem sair da venda.
 *
 * Mandar o operador a outro ecrã para criar o cliente significa, na prática, que
 * a venda fica sem cliente — ninguém interrompe uma fila para isso. Por isso o
 * registo acontece aqui, com o mínimo de campos.
 */
export function IdentificarClienteModal({
  onClose,
  onEscolher,
}: {
  onClose: () => void;
  onEscolher: (cliente: Cliente) => void;
}) {
  const [termo, setTermo] = useState('');
  const [procura, setProcura] = useState('');
  const [aRegistar, setARegistar] = useState(false);
  const [novo, setNovo] = useState({ nome: '', telefone: '', email: '' });
  // Nada marcado por omissão: consentimento pré-marcado não é consentimento.
  const [canais, setCanais] = useState<CanalComunicacao[]>([]);

  // A procura só dispara depois de o operador parar de escrever: um pedido por
  // tecla saturaria a rede da loja sem melhorar o resultado.
  useEffect(() => {
    const t = setTimeout(() => setProcura(termo.trim()), 350);
    return () => clearTimeout(t);
  }, [termo]);

  const { data: resultados, isFetching } = useSearchClientes(procura);
  const criar = useRegistarClienteNoBalcao();

  const temTelefone = novo.telefone.trim().length > 0;
  const temEmail = novo.email.trim().length > 0;

  /** Um canal só se pode consentir se houver por onde o usar. */
  const canalUsavel = (precisaDe: 'telefone' | 'email') =>
    precisaDe === 'telefone' ? temTelefone : temEmail;

  const alternarCanal = (id: CanalComunicacao) =>
    setCanais((actuais) =>
      actuais.includes(id) ? actuais.filter((c) => c !== id) : [...actuais, id],
    );

  const registar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novo.nome.trim()) return;

    // Só envia consentimentos de canais que o cliente pode mesmo receber: um
    // consentimento de SMS sem telefone seria um registo falso.
    const consentidos = canais.filter((id) => {
      const canal = CANAIS.find((c) => c.id === id);
      return canal ? canalUsavel(canal.precisaDe) : false;
    });

    criar.mutate(
      {
        nome: novo.nome.trim(),
        telefone: novo.telefone.trim() || undefined,
        email: novo.email.trim() || undefined,
        canaisConsentidos: consentidos.length > 0 ? consentidos : undefined,
      },
      { onSuccess: (cliente) => onEscolher(cliente) },
    );
  };

  // O que o operador escreveu serve de ponto de partida para o registo: se
  // procurou por um número, é o número; se procurou por um nome, é o nome.
  const abrirRegisto = () => {
    const soDigitos = /^[\d\s+()-]+$/.test(procura);
    const eEmail = procura.includes('@');
    setNovo({
      nome: soDigitos || eEmail ? '' : procura,
      telefone: soDigitos ? procura : '',
      email: eEmail ? procura : '',
    });
    setARegistar(true);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 p-4 pt-[6vh] backdrop-blur-sm">
      {/* O formulário de registo não cabe inteiro num telemóvel: sem scroll
          próprio, o botão de guardar ficava abaixo do bordo do ecrã. */}
      <div className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-900">
            {aRegistar ? 'Novo cliente' : 'Identificar cliente'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {aRegistar ? (
          <form onSubmit={registar} className="space-y-4 overflow-y-auto p-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nome *</label>
              <input
                autoFocus
                value={novo.nome}
                onChange={(e) => setNovo((n) => ({ ...n, nome: e.target.value }))}
                placeholder="Ex.: João Silva"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Telefone</label>
              <input
                inputMode="tel"
                value={novo.telefone}
                onChange={(e) => setNovo((n) => ({ ...n, telefone: e.target.value }))}
                placeholder="+258 84 000 0000"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <p className="mt-1.5 text-xs text-slate-400">
                É por aqui que o cliente volta a ser reconhecido na próxima compra.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">E-mail</label>
              <input
                type="email"
                inputMode="email"
                value={novo.email}
                onChange={(e) => setNovo((n) => ({ ...n, email: e.target.value }))}
                placeholder="cliente@email.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Consentimento, recolhido onde o cliente está: em ecrã nenhum
                alguém volta atrás para o marcar. */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-medium text-slate-700">
                Aceita receber promoções?
              </p>
              <p className="mb-2.5 mt-0.5 text-xs text-slate-500">
                Pergunte ao cliente. Sem resposta, não marque nada.
              </p>

              <div className="flex flex-wrap gap-2">
                {CANAIS.map((canal) => {
                  const usavel = canalUsavel(canal.precisaDe);
                  const marcado = canais.includes(canal.id) && usavel;

                  return (
                    <button
                      key={canal.id}
                      type="button"
                      disabled={!usavel}
                      onClick={() => alternarCanal(canal.id)}
                      title={
                        usavel
                          ? undefined
                          : `Preencha o ${canal.precisaDe} para poder usar ${canal.rotulo}.`
                      }
                      className={cn(
                        'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                        marcado
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                        !usavel && 'cursor-not-allowed opacity-40',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-4 w-4 items-center justify-center rounded border',
                          marcado ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300',
                        )}
                      >
                        {marcado && <Check size={11} className="text-white" strokeWidth={3} />}
                      </span>
                      {canal.rotulo}
                    </button>
                  );
                })}
              </div>

              <p className="mt-2.5 text-xs text-slate-400">
                Avisos de conta e cobrança não dependem desta escolha.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setARegistar(false)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={criar.isPending || !novo.nome.trim()}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {criar.isPending ? 'A registar…' : 'Registar e associar'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="p-5 pb-3">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  autoFocus
                  value={termo}
                  onChange={(e) => setTermo(e.target.value)}
                  placeholder="Nome, telefone ou NUIT…"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {isFetching && (
                  <Loader2
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
                  />
                )}
              </div>
            </div>

            <div className="max-h-[45vh] overflow-y-auto px-5 pb-3">
              {procura.length < 2 ? (
                <p className="py-6 text-center text-sm text-slate-400">
                  Escreva pelo menos duas letras para procurar.
                </p>
              ) : resultados && resultados.length > 0 ? (
                <div className="space-y-2">
                  {resultados.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => onEscolher(c)}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-left',
                        'hover:border-blue-300 hover:bg-blue-50/50 active:scale-[0.99]',
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{c.nome}</p>
                        <p className="truncate text-sm text-slate-500">
                          {c.telefone || c.email || c.nuit || 'sem contacto'}
                        </p>
                      </div>
                      {c.pontos > 0 && (
                        <span className="shrink-0 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          {c.pontos} pts
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : !isFetching ? (
                <p className="py-6 text-center text-sm text-slate-400">
                  Nenhum cliente encontrado para “{procura}”.
                </p>
              ) : null}
            </div>

            <div className="border-t border-slate-100 p-4">
              <button
                onClick={abrirRegisto}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-700"
              >
                <UserPlus size={16} />
                Registar cliente novo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
