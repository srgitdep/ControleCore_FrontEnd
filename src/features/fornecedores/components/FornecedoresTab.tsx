import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Truck, Plus, Search, Edit2, Loader2, Mail, Phone, Globe, MapPin, Ban, CheckCircle2,
  BarChart3, Landmark, Store, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { suppliersApi } from '../api/suppliers.api';
import type { Supplier, LinhaDeFornecedor } from '../api/suppliers.api';
import { FornecedorFormModal } from './FornecedorFormModal';
import { FornecedorDetailsModal } from './FornecedorDetailsModal';
import { ContasBancariasModal } from './ContasBancariasModal';
import { ConfirmDialog } from '@/shared/ui';
import { cn, mensagemDeErro } from '@/shared/utils';

/**
 * A lista de fornecedores, sem cabeçalho de página.
 *
 * ## Porque existe
 *
 * Fornecedores estava em dois lugares: uma entrada no menu com CRUD completo, e um
 * separador dentro de Compras que era uma tabela de quatro colunas só de leitura — sem
 * criar, sem editar, sem suspender. Duas vistas dos mesmos dados, uma delas incompleta.
 *
 * Fica só nas Compras, que é onde os fornecedores importam: encomenda-se a um
 * fornecedor, e a pergunta «a quem compro isto?» faz-se no contexto de uma compra.
 *
 * ## Duas famílias de linha, e não uma lista de `Supplier`
 *
 * Antes, esta lista só mostrava `Fornecedor` — a relação comercial com esta empresa. Uma
 * organização que se auto-registou pelo portal e nunca vendeu aqui não tinha essa relação,
 * e por isso era invisível: um fornecedor real, com vitrine publicada, que não aparecia em
 * lado nenhum dentro de Compras.
 *
 * `GET /b2b/qualificacao/fornecedores` devolve as duas famílias juntas — cada linha diz
 * `tipo: RELACAO | SEM_RELACAO` — e este componente trata-as de forma diferente: as com
 * relação têm as acções todas (editar, suspender, desempenho, contas bancárias); as sem
 * relação só têm «Ver vitrine», porque é o único acto que faz sentido sobre uma empresa que
 * ainda não se comprou nada.
 *
 * A comparação de preços e condições entre estas organizações — «quem me dá o melhor
 * orçamento?» — não é feita aqui. É a Mayra, com a tool `source_requisition`: corre o
 * sourcing sobre uma requisição real, pontua cada candidato por oito factores e devolve o
 * ranking com os motivos. Esta lista é só para descobrir quem existe; a decisão de compra
 * acontece na requisição.
 */
export function FornecedoresTab() {
  const { t } = useTranslation('fornecedores');
  const queryClient = useQueryClient();
  const [pesquisa, setPesquisa] = useState('');

  const [aEditar, setAEditar] = useState<{ fornecedor?: Supplier } | null>(null);
  const [aVer, setAVer] = useState<Supplier | null>(null);
  const [aAlternar, setAAlternar] = useState<Supplier | null>(null);
  const [aVerContas, setAVerContas] = useState<Supplier | null>(null);
  const [aGuardar, setAGuardar] = useState(false);

  const { data: linhas = [], isLoading } = useQuery({
    queryKey: ['fornecedores-da-empresa'],
    queryFn: () => suppliersApi.getFornecedoresDaEmpresa(),
  });

  const recarregar = () =>
    queryClient.invalidateQueries({ queryKey: ['fornecedores-da-empresa'] });

  const alternarEstado = async () => {
    if (!aAlternar) return;
    const activo = aAlternar.isActive;

    setAGuardar(true);
    try {
      // Suspender em vez de apagar: um fornecedor suspenso não aceita pedidos novos
      // mas o histórico de compras mantém-se intacto — e é esse histórico que sustenta
      // as medidas de prazo e pontualidade.
      await suppliersApi.updateSupplier(aAlternar.id, { isActive: !activo });
      toast.success(activo ? t('lista.suspenso_ok') : t('lista.reactivado_ok'));
      recarregar();
      setAAlternar(null);
    } catch (error: any) {
      toast.error(
        mensagemDeErro(error, activo ? t('lista.erro_suspender') : t('lista.erro_reactivar')),
      );
    } finally {
      setAGuardar(false);
    }
  };

  const termo = pesquisa.trim().toLowerCase();

  const campoDePesquisa = (linha: LinhaDeFornecedor): (string | null | undefined)[] =>
    linha.tipo === 'RELACAO'
      ? [linha.fornecedor.nome, linha.fornecedor.nuit, linha.fornecedor.email, linha.fornecedor.telefone]
      : [linha.razaoSocial, linha.nomeComercial, linha.nuit, linha.email, linha.telefone];

  const filtradas = termo
    ? linhas.filter((l) =>
        campoDePesquisa(l)
          .filter(Boolean)
          .some((campo) => String(campo).toLowerCase().includes(termo)),
      )
    : linhas;

  const comRelacao = linhas.filter((l): l is Extract<LinhaDeFornecedor, { tipo: 'RELACAO' }> => l.tipo === 'RELACAO');
  const activos = comRelacao.filter((l) => l.fornecedor.isActive).length;
  const semRelacao = linhas.length - comRelacao.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder={t('lista.pesquisar_ph')}
            className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden whitespace-nowrap text-xs text-slate-500 sm:inline">
            {t('lista.resumo', { relacao: comRelacao.length, activos })}
            {semRelacao > 0 && ` · ${t('lista.resumo_plataforma', { n: semRelacao })}`}
          </span>
          <button
            onClick={() => setAEditar({})}
            className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={16} /> {t('lista.novo')}
          </button>
        </div>
      </div>

      {semRelacao > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
          <Sparkles size={14} className="mt-0.5 shrink-0 text-blue-600" />
          <p className="text-xs leading-snug text-blue-900">
            <strong>{t('lista.banner_titulo', { count: semRelacao })}</strong>{' '}
            {t('lista.banner_texto', { count: semRelacao })}
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-600" />
            {t('lista.a_carregar')}
          </div>
        ) : filtradas.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Truck className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            {termo ? t('lista.vazio_pesquisa', { pesquisa }) : t('lista.vazio')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">{t('lista.col_fornecedor')}</th>
                  <th className="hidden px-4 py-3 text-left font-medium md:table-cell">{t('lista.col_contactos')}</th>
                  <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">{t('lista.col_nuit')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('lista.col_estado')}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtradas.map((linha) =>
                  linha.tipo === 'RELACAO' ? (
                    <LinhaComRelacao
                      key={linha.fornecedor.id}
                      fornecedor={linha.fornecedor}
                      onVer={() => setAVer(linha.fornecedor)}
                      onVerContas={() => setAVerContas(linha.fornecedor)}
                      onEditar={() => setAEditar({ fornecedor: linha.fornecedor })}
                      onAlternar={() => setAAlternar(linha.fornecedor)}
                    />
                  ) : (
                    <LinhaSemRelacao key={linha.organizacaoId} linha={linha} />
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        {t('lista.nota_antes')} <strong>{t('lista.nota_suspenso')}</strong> {t('lista.nota_depois')}
      </p>

      {aEditar && (
        <FornecedorFormModal
          fornecedor={aEditar.fornecedor}
          onClose={() => setAEditar(null)}
          onSaved={recarregar}
        />
      )}

      {aVer && <FornecedorDetailsModal fornecedor={aVer} onClose={() => setAVer(null)} />}

      {aVerContas?.organizacaoId && (
        <ContasBancariasModal
          organizacaoId={aVerContas.organizacaoId}
          nomeFornecedor={aVerContas.nome}
          onClose={() => setAVerContas(null)}
        />
      )}

      <ConfirmDialog
        isOpen={aAlternar !== null}
        title={aAlternar?.isActive ? t('lista.titulo_suspender') : t('lista.titulo_reactivar')}
        message={
          aAlternar
            ? aAlternar.isActive
              ? t('lista.msg_suspender', { nome: aAlternar.nome })
              : t('lista.msg_reactivar', { nome: aAlternar.nome })
            : ''
        }
        confirmText={aAlternar?.isActive ? t('acao.suspender') : t('acao.reactivar')}
        variant={aAlternar?.isActive ? 'warning' : 'info'}
        isLoading={aGuardar}
        onConfirm={alternarEstado}
        onCancel={() => setAAlternar(null)}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Peças
// ═══════════════════════════════════════════════════════════════════════════════

function LinhaComRelacao({
  fornecedor: f,
  onVer,
  onVerContas,
  onEditar,
  onAlternar,
}: {
  fornecedor: Supplier;
  onVer: () => void;
  onVerContas: () => void;
  onEditar: () => void;
  onAlternar: () => void;
}) {
  const { t } = useTranslation('fornecedores');

  return (
    <tr className={cn('hover:bg-slate-50', !f.isActive && 'opacity-60')}>
      <td className="px-4 py-3">
        <button
          onClick={onVer}
          className="text-left font-medium text-slate-900 hover:text-blue-600 hover:underline"
          title={t('lista.ver_desempenho')}
        >
          {f.nome}
        </button>
        {f.tipoFornecimento && <p className="text-xs text-slate-500">{f.tipoFornecimento}</p>}
        {f.endereco && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
            <MapPin size={11} /> {f.endereco}
          </p>
        )}
      </td>
      <td className="hidden px-4 py-3 text-slate-600 md:table-cell">
        {f.email && (
          <p className="flex items-center gap-1.5 text-xs">
            <Mail size={12} className="text-slate-400" /> {f.email}
          </p>
        )}
        {f.telefone && (
          <p className="flex items-center gap-1.5 text-xs">
            <Phone size={12} className="text-slate-400" /> {f.telefone}
          </p>
        )}
        {f.website && (
          <p className="flex items-center gap-1.5 text-xs">
            <Globe size={12} className="text-slate-400" /> {f.website}
          </p>
        )}
        {!f.email && !f.telefone && !f.website && <span className="text-xs text-slate-400">—</span>}
      </td>
      <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">{f.nuit || '—'}</td>
      <td className="px-4 py-3">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold',
            f.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600',
          )}
        >
          {f.isActive ? <CheckCircle2 size={12} /> : <Ban size={12} />}
          {f.isActive ? t('estado.activo') : t('estado.suspenso')}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          {f.organizacaoId ? (
            <Link
              to={`/fornecedores/${f.organizacaoId}/vitrine`}
              title={t('lista.ver_vitrine')}
              className="p-2 text-slate-400 transition-colors hover:text-blue-600"
            >
              <Store size={16} />
            </Link>
          ) : (
            <span
              title={t('lista.sem_org_vitrine')}
              className="p-2 text-slate-200"
            >
              <Store size={16} />
            </span>
          )}
          <button
            onClick={onVer}
            title={t('lista.desempenho_historico')}
            className="p-2 text-slate-400 transition-colors hover:text-blue-600"
          >
            <BarChart3 size={16} />
          </button>
          <button
            onClick={onVerContas}
            disabled={!f.organizacaoId}
            title={
              f.organizacaoId
                ? t('contas.titulo')
                : t('lista.sem_org')
            }
            className="p-2 text-slate-400 transition-colors hover:text-amber-600 disabled:opacity-30 disabled:hover:text-slate-400"
          >
            <Landmark size={16} />
          </button>
          <button
            onClick={onEditar}
            title={t('acao.editar')}
            className="p-2 text-slate-400 transition-colors hover:text-blue-600"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={onAlternar}
            title={f.isActive ? t('acao.suspender') : t('acao.reactivar')}
            className={cn(
              'p-2 transition-colors',
              f.isActive ? 'text-slate-400 hover:text-rose-500' : 'text-slate-400 hover:text-emerald-600',
            )}
          >
            {f.isActive ? <Ban size={16} /> : <CheckCircle2 size={16} />}
          </button>
        </div>
      </td>
    </tr>
  );
}

/**
 * Uma organização da plataforma sem relação com esta empresa.
 *
 * Sem estado de activo/suspenso — essa é uma decisão sobre uma relação que ainda não
 * existe — e sem as acções de gestão: não há nada aqui para editar, suspender ou ver
 * desempenho de. O único acto é ver a vitrine.
 */
function LinhaSemRelacao({
  linha,
}: {
  linha: Extract<LinhaDeFornecedor, { tipo: 'SEM_RELACAO' }>;
}) {
  const { t } = useTranslation('fornecedores');

  return (
    <tr className="bg-blue-50/30 hover:bg-blue-50">
      <td className="px-4 py-3">
        <Link
          to={`/fornecedores/${linha.organizacaoId}/vitrine`}
          className="text-left font-medium text-slate-900 hover:text-blue-600 hover:underline"
        >
          {linha.nomeComercial ?? linha.razaoSocial}
        </Link>
        {linha.nomeComercial && linha.nomeComercial !== linha.razaoSocial && (
          <p className="text-xs text-slate-500">{linha.razaoSocial}</p>
        )}
        <p className="mt-0.5 text-xs text-slate-400">
          {t('lista.artigos_publicados', { count: linha.artigosPublicados })}
        </p>
      </td>
      <td className="hidden px-4 py-3 text-slate-600 md:table-cell">
        {linha.email && (
          <p className="flex items-center gap-1.5 text-xs">
            <Mail size={12} className="text-slate-400" /> {linha.email}
          </p>
        )}
        {linha.telefone && (
          <p className="flex items-center gap-1.5 text-xs">
            <Phone size={12} className="text-slate-400" /> {linha.telefone}
          </p>
        )}
        {!linha.email && !linha.telefone && <span className="text-xs text-slate-400">—</span>}
      </td>
      <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">{linha.nuit || '—'}</td>
      <td className="px-4 py-3">
        <span
          title={t('lista.da_plataforma_ajuda')}
          className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700"
        >
          <Sparkles size={12} />
          {t('lista.da_plataforma')}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <Link
            to={`/fornecedores/${linha.organizacaoId}/vitrine`}
            title={t('lista.ver_vitrine')}
            className="p-2 text-slate-400 transition-colors hover:text-blue-600"
          >
            <Store size={16} />
          </Link>
        </div>
      </td>
    </tr>
  );
}
