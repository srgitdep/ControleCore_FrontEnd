import { useState } from 'react';
import { ChevronDown, ChevronRight, MapPin, Plus, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui';
import { useLocalizacaoMutations, useLocalizacoes } from '../hooks/useLocalizacoes';
import type { NoLocalizacao } from '../api/localizacoes.api';

interface LocalizacoesPanelProps {
  armazemId: string;
  armazemNome: string;
}

/**
 * As posições físicas de um armazém.
 *
 * ## Uma árvore, e não um formulário de seis campos
 *
 * O §15 desenha seis níveis fixos. Um formulário com «zona / corredor / estante / prateleira
 * / posição» obrigaria toda a gente a preencher cinco campos para uma arrecadação com duas
 * prateleiras — e campos que não se aplicam preenchem-se com lixo ou ficam vazios, e a
 * hierarquia deixa de significar nada.
 *
 * Aqui cada nível é criado dentro do anterior. Quem precisa de um nível cria um; quem precisa
 * de seis cria seis.
 *
 * ## Desactivar, não apagar
 *
 * O servidor recusa desactivar uma posição que ainda tem mercadoria, contando o que está
 * abaixo dela. A mensagem diz quantas unidades — é accionável, ao contrário de «não é
 * possível».
 */
export function LocalizacoesPanel({ armazemId, armazemNome }: LocalizacoesPanelProps) {
  const { t } = useTranslation('armazens');
  const [incluirInactivas, setIncluirInactivas] = useState(false);
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [aCriarEm, setACriarEm] = useState<{ paiId: string | null; caminho: string } | null>(null);

  const { data, isLoading } = useLocalizacoes(armazemId, incluirInactivas);
  const mutacoes = useLocalizacaoMutations(armazemId);

  const alternar = (id: string) =>
    setExpandidos((antes) => {
      const seguinte = new Set(antes);
      if (seguinte.has(id)) seguinte.delete(id);
      else seguinte.add(id);
      return seguinte;
    });

  const arvore = data?.arvore ?? [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <MapPin className="h-4 w-4 text-slate-400" />
          <span>
            {t('posicoes.contagem', { count: data?.total ?? 0, armazem: armazemNome })}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={incluirInactivas}
              onChange={(e) => setIncluirInactivas(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300"
            />
            {t('posicoes.mostrar_desactivadas')}
          </label>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setACriarEm({ paiId: null, caminho: armazemNome })}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('posicoes.nova_zona')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-sm text-slate-400">{t('posicoes.a_carregar')}</p>
      ) : arvore.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
          <MapPin className="mx-auto mb-2 h-6 w-6 text-slate-300" />
          <p className="text-sm text-slate-600">{t('posicoes.vazio_titulo')}</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-400">
            {t('posicoes.vazio_ajuda')}
          </p>
        </div>
      ) : (
        <ul className="space-y-0.5">
          {arvore.map((no) => (
            <NoDaArvore
              key={no.id}
              no={no}
              nivel={0}
              expandidos={expandidos}
              alternar={alternar}
              onCriarDentro={(pai) => setACriarEm({ paiId: pai.id, caminho: pai.caminho })}
              onDesactivar={(id) => mutacoes.desactivar.mutate(id)}
              aDecorrer={mutacoes.aDecorrer}
            />
          ))}
        </ul>
      )}

      {aCriarEm && (
        <FormularioNovaLocalizacao
          dentroDe={aCriarEm}
          aDecorrer={mutacoes.aDecorrer}
          onCancelar={() => setACriarEm(null)}
          onGravar={(payload) =>
            mutacoes.criar.mutate(
              { ...payload, paiId: aCriarEm.paiId ?? undefined },
              {
                onSuccess: () => {
                  // Abre o pai para a posição nova ficar visível: criar algo que não aparece
                  // faz parecer que não funcionou.
                  if (aCriarEm.paiId) alternar(aCriarEm.paiId);
                  setACriarEm(null);
                },
              },
            )
          }
        />
      )}
    </div>
  );
}

// ── Um nó ────────────────────────────────────────────────────────────────────

function NoDaArvore({
  no,
  nivel,
  expandidos,
  alternar,
  onCriarDentro,
  onDesactivar,
  aDecorrer,
}: {
  no: NoLocalizacao;
  nivel: number;
  expandidos: Set<string>;
  alternar: (id: string) => void;
  onCriarDentro: (no: NoLocalizacao) => void;
  onDesactivar: (id: string) => void;
  aDecorrer: boolean;
}) {
  const { t } = useTranslation('armazens');
  const temFilhos = no.filhos.length > 0;
  const aberto = expandidos.has(no.id);

  return (
    <li>
      <div
        className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 ${
          no.isActive ? '' : 'opacity-50'
        }`}
        // A indentação marca a profundidade. Um `padding` inline em vez de classes porque a
        // profundidade é livre e não há um conjunto fechado de níveis para gerar classes.
        style={{ paddingLeft: `${nivel * 1.25 + 0.5}rem` }}
      >
        <button
          type="button"
          onClick={() => temFilhos && alternar(no.id)}
          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded ${
            temFilhos ? 'text-slate-500 hover:bg-slate-200' : 'invisible'
          }`}
          aria-label={aberto ? t('posicoes.fechar') : t('posicoes.abrir')}
        >
          {aberto ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        <span className="min-w-0 flex-1">
          <span className="font-medium text-slate-800">{no.codigo}</span>
          {no.nome && <span className="ml-2 text-sm text-slate-500">{no.nome}</span>}
          {no.tipo && (
            <span className="ml-2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-500">
              {no.tipo}
            </span>
          )}
          {!no.isActive && (
            <span className="ml-2 text-[11px] font-medium text-slate-400">{t('posicoes.desactivada')}</span>
          )}
        </span>

        {/* O caminho completo é o que se lê em voz alta a quem vai buscar a mercadoria. */}
        <span className="hidden text-xs text-slate-400 sm:inline">{no.caminho}</span>

        <span className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onCriarDentro(no)}
            disabled={aDecorrer}
            className="rounded p-1 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
            title={t('posicoes.criar_dentro', { caminho: no.caminho })}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          {no.isActive && (
            <button
              type="button"
              onClick={() => onDesactivar(no.id)}
              disabled={aDecorrer}
              className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-700"
              title={t('posicoes.desactivar')}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </span>
      </div>

      {aberto && temFilhos && (
        <ul className="space-y-0.5">
          {no.filhos.map((filho) => (
            <NoDaArvore
              key={filho.id}
              no={filho}
              nivel={nivel + 1}
              expandidos={expandidos}
              alternar={alternar}
              onCriarDentro={onCriarDentro}
              onDesactivar={onDesactivar}
              aDecorrer={aDecorrer}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// ── Criar ────────────────────────────────────────────────────────────────────

function FormularioNovaLocalizacao({
  dentroDe,
  aDecorrer,
  onCancelar,
  onGravar,
}: {
  dentroDe: { paiId: string | null; caminho: string };
  aDecorrer: boolean;
  onCancelar: () => void;
  onGravar: (payload: { codigo: string; nome?: string; tipo?: string }) => void;
}) {
  const { t } = useTranslation('armazens');
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('');

  // Verificado aqui e no servidor: a barra separa os níveis do caminho, e usá-la dentro de um
  // código tornaria «B / 04» indistinguível de um nó chamado literalmente «B / 04».
  const temBarra = codigo.includes('/');
  const podeGravar = codigo.trim().length > 0 && !temBarra && !aDecorrer;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!podeGravar) return;
        onGravar({
          codigo: codigo.trim(),
          nome: nome.trim() || undefined,
          tipo: tipo.trim() || undefined,
        });
      }}
      className="rounded-xl border border-blue-200 bg-blue-50/50 p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-800">
          {t('posicoes.nova_dentro_1')} <span className="text-blue-700">{dentroDe.caminho}</span>
        </p>
        <button
          type="button"
          onClick={onCancelar}
          className="text-slate-400 hover:text-slate-700"
          aria-label={t('posicoes.cancelar')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">{t('posicoes.codigo')}</span>
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder={t('posicoes.codigo_placeholder')}
            autoFocus
            className={`w-full rounded-lg border px-3 py-2 text-sm uppercase ${
              temBarra ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
            }`}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            {t('posicoes.nome')} <span className="font-normal text-slate-400">{t('posicoes.opcional')}</span>
          </span>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder={t('posicoes.nome_placeholder')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            {t('posicoes.tipo')} <span className="font-normal text-slate-400">{t('posicoes.opcional')}</span>
          </span>
          <input
            type="text"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            placeholder={t('posicoes.tipo_placeholder')}
            list="tipos-de-localizacao"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          {/* Sugestões e não um selector fechado: nem todo o armazém pensa em «corredores», e
              um enum obrigaria a inventar um valor para os que não têm. */}
          <datalist id="tipos-de-localizacao">
            <option value={t('posicoes.sugestao_zona')} />
            <option value={t('posicoes.sugestao_corredor')} />
            <option value={t('posicoes.sugestao_estante')} />
            <option value={t('posicoes.sugestao_prateleira')} />
            <option value={t('posicoes.sugestao_posicao')} />
            <option value={t('posicoes.sugestao_camara')} />
          </datalist>
        </label>
      </div>

      {temBarra && (
        <p className="mt-2 text-xs text-rose-600">
          {t('posicoes.codigo_com_barra')}
        </p>
      )}

      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancelar}>
          {t('posicoes.cancelar')}
        </Button>
        <Button type="submit" size="sm" disabled={!podeGravar}>
          {aDecorrer ? t('posicoes.a_criar') : t('posicoes.criar')}
        </Button>
      </div>
    </form>
  );
}
