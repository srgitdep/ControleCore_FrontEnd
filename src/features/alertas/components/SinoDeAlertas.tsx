import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Bell, Check, Info, OctagonAlert } from 'lucide-react';
import { useSocket } from '@/shared/hooks';
import { cn } from '@/shared/utils';
import {
  destinoDoAlerta,
  type Alerta,
  type SeveridadeAlerta,
} from '../api/alertas.api';
import {
  useAlertaMutations,
  useAlertas,
  useAlertasEmTempoReal,
  useContagemAlertas,
} from '../hooks/useAlertas';

/**
 * O sino do cabeçalho.
 *
 * ## O que substitui
 *
 * Havia um sino com um ponto azul fixo. Estava sempre aceso, não abria nada, e não
 * correspondia a nada — o que é pior do que não existir: ensina as pessoas a ignorá-lo, e
 * quando passar a ter significado já ninguém olha.
 */
export function SinoDeAlertas() {
  const [aberto, setAberto] = useState(false);
  const referencia = useRef<HTMLDivElement>(null);

  const socket = useSocket();
  useAlertasEmTempoReal(socket);

  const { data: contagem } = useContagemAlertas();
  // A lista só é pedida quando o painel abre: o sino precisa do número, não do conteúdo.
  const { data: alertas, isLoading } = useAlertas(aberto ? { limite: 15 } : undefined);
  const { marcarLido, marcarTodos } = useAlertaMutations();

  useEffect(() => {
    if (!aberto) return;

    const aoClicarFora = (evento: MouseEvent) => {
      if (!referencia.current?.contains(evento.target as Node)) setAberto(false);
    };

    // `mousedown` e não `click`: com `click`, carregar num alerta fechava o painel antes de a
    // navegação acontecer.
    document.addEventListener('mousedown', aoClicarFora);
    return () => document.removeEventListener('mousedown', aoClicarFora);
  }, [aberto]);

  const porLer = contagem?.total ?? 0;
  const criticos = contagem?.criticos ?? 0;

  return (
    <div className="relative" ref={referencia}>
      <button
        onClick={() => setAberto((v) => !v)}
        className="relative p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        title={porLer > 0 ? `${porLer} alerta(s) por ler` : 'Sem alertas por ler'}
        aria-label="Alertas"
      >
        <Bell size={20} />

        {porLer > 0 && (
          <span
            className={cn(
              'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold',
              'flex items-center justify-center text-white border-2 border-white',
              // Vermelho só quando há críticos. Um contador sempre vermelho perde a
              // capacidade de distinguir «há coisas» de «há coisas a custar dinheiro agora».
              criticos > 0 ? 'bg-red-500' : 'bg-blue-500',
            )}
          >
            {porLer > 99 ? '99+' : porLer}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 mt-2 w-[22rem] sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">
              Alertas
              {porLer > 0 && <span className="ml-2 text-slate-400">({porLer} por ler)</span>}
            </h3>

            {porLer > 0 && (
              <button
                onClick={() => marcarTodos.mutate()}
                disabled={marcarTodos.isPending}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
              >
                Marcar todos como vistos
              </button>
            )}
          </div>

          <div className="max-h-[26rem] overflow-y-auto">
            {isLoading && (
              <p className="px-4 py-8 text-center text-sm text-slate-400">A carregar…</p>
            )}

            {!isLoading && (alertas?.length ?? 0) === 0 && (
              <div className="px-4 py-10 text-center">
                <Check className="mx-auto mb-2 text-emerald-500" size={28} />
                <p className="text-sm text-slate-500">Nada a precisar de atenção.</p>
              </div>
            )}

            {alertas?.map((alerta) => (
              <LinhaDeAlerta
                key={alerta.id}
                alerta={alerta}
                aoAbrir={() => {
                  if (!alerta.lidoEm) marcarLido.mutate(alerta.id);
                  setAberto(false);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const ESTILO: Record<SeveridadeAlerta, { cor: string; fundo: string; Icone: typeof Info }> = {
  CRITICO: { cor: 'text-red-600', fundo: 'bg-red-50', Icone: OctagonAlert },
  AVISO: { cor: 'text-amber-600', fundo: 'bg-amber-50', Icone: AlertTriangle },
  INFO: { cor: 'text-slate-500', fundo: 'bg-slate-50', Icone: Info },
};

function LinhaDeAlerta({ alerta, aoAbrir }: { alerta: Alerta; aoAbrir: () => void }) {
  const { cor, fundo, Icone } = ESTILO[alerta.severidade];
  const destino = destinoDoAlerta(alerta);

  const conteudo = (
    <div
      className={cn(
        'flex gap-3 px-4 py-3 border-b border-slate-50 transition-colors',
        destino && 'hover:bg-slate-50 cursor-pointer',
        // Por ler fica com fundo; lido fica cinzento. A diferença tem de ser visível de
        // relance, senão o painel lê-se todo igual.
        !alerta.lidoEm && fundo,
      )}
    >
      <Icone size={18} className={cn('shrink-0 mt-0.5', cor)} />

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm truncate',
            alerta.lidoEm ? 'text-slate-600' : 'font-semibold text-slate-900',
          )}
        >
          {alerta.titulo}
        </p>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{alerta.mensagem}</p>
        <p className="text-[11px] text-slate-400 mt-1">{quandoFoi(alerta.createdAt)}</p>
      </div>
    </div>
  );

  if (!destino) return conteudo;

  return (
    <Link to={destino} onClick={aoAbrir}>
      {conteudo}
    </Link>
  );
}

/**
 * «Há 3 horas» em vez da data completa.
 *
 * Num alerta o que interessa é se é de agora ou de ontem, e uma data absoluta obriga quem lê a
 * fazer a conta de cabeça.
 */
function quandoFoi(iso: string): string {
  const minutos = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);

  if (minutos < 1) return 'agora mesmo';
  if (minutos < 60) return `há ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;

  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'ontem';
  if (dias < 7) return `há ${dias} dias`;

  return new Date(iso).toLocaleDateString('pt-PT');
}
