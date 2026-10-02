import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listarClientes,
  obterCliente,
  criarCliente,
  atualizarCliente,
  apagarCliente,
  buscarClientesCRM,
  obterVisao360,
  registarConsentimento,
  adicionarIdentidade,
  removerIdentidade,
  registarClienteNoBalcao,
  guardarPreferencia,
  listarCandidatosFusao,
  resolverCandidatoFusao,
  fundirClientes,
  listarSegmentos,
  listarMembrosSegmento,
  recalcularSegmentos,
  listarAudiencias,
  criarAudiencia,
  listarCampanhas,
  obterCampanha,
  listarEnviosCampanha,
  obterResultadoCampanha,
  criarCampanha,
  enviarCampanha,
  cancelarCampanha,
  verificarEntregas,
  obterOportunidades,
  obterAtencao,
  obterConfiguracao,
  actualizarConfiguracao,
  obterSaldoPontos,
  obterHistoricoPontos,
  resgatarPontos,
  ajustarPontos,
  sugerirMensagens,
  type CanalComunicacao,
  type DimensaoSegmento,
  type FinalidadeConsentimento,
  type TipoIdentidade,
  type EstadoCandidatoFusao,
} from '../api/clientes.api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { formatMoeda, mensagemDeErro } from '@/shared/utils';

export function useClientes(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['clientes', params],
    queryFn: () => listarClientes(params || {}),
    placeholderData: (prev) => prev,
  });
}

export function useCliente(id: string) {
  return useQuery({
    queryKey: ['cliente', id],
    queryFn: () => obterCliente(id),
    enabled: !!id,
  });
}

export function useSearchClientes(search: string) {
  return useQuery({
    queryKey: ['clientes-search', search],
    queryFn: () => buscarClientesCRM(search),
    enabled: search.length >= 2,
    staleTime: 1000 * 60, // 1 minuto
  });
}

export function useCreateCliente() {
  const { t } = useTranslation('crm');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: criarCliente,
    onSuccess: () => {
      toast.success(t('hooks.cliente_registado'));
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['clientes-search'] });
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, t('hooks.erro_registar_cliente')));
    }
  });
}

export function useUpdateCliente() {
  const { t } = useTranslation('crm');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => atualizarCliente(id, data),
    onSuccess: (_, variables) => {
      toast.success(t('hooks.cliente_actualizado'));
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['cliente', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['clientes-search'] });
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, t('hooks.erro_actualizar_cliente')));
    }
  });
}

export function useDeleteCliente() {
  const { t } = useTranslation('crm');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apagarCliente,
    onSuccess: () => {
      toast.success(t('hooks.cliente_eliminado'));
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['clientes-search'] });
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, t('hooks.erro_eliminar_cliente')));
    }
  });
}

export function useVisao360(id: string) {
  return useQuery({
    queryKey: ['cliente-360', id],
    queryFn: () => obterVisao360(id),
    enabled: !!id,
  });
}

export function useRegistarConsentimento(clienteId: string) {
  const { t } = useTranslation('crm');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      finalidade: FinalidadeConsentimento;
      canal: CanalComunicacao;
      concedido: boolean;
    }) => registarConsentimento(clienteId, { ...payload, origem: 'ficha do cliente' }),
    onSuccess: (_, variables) => {
      const canal =
        variables.canal === 'CHAMADA' ? t('hooks.canal_chamada') : variables.canal.toLowerCase();
      toast.success(
        variables.concedido
          ? t('hooks.consentimento_concedido', { canal })
          : t('hooks.consentimento_revogado', { canal }),
      );
      queryClient.invalidateQueries({ queryKey: ['cliente-360', clienteId] });
      // O campo antigo do cliente é espelhado no backend; a lista mostra-o.
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['cliente', clienteId] });
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, t('hooks.erro_consentimento')));
    },
  });
}

export function useAdicionarIdentidade(clienteId: string) {
  const { t } = useTranslation('crm');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { tipo: TipoIdentidade; valor: string; principal?: boolean }) =>
      adicionarIdentidade(clienteId, { ...payload, origem: 'ficha do cliente' }),
    onSuccess: () => {
      toast.success(t('hooks.identidade_ligada'));
      queryClient.invalidateQueries({ queryKey: ['cliente-360', clienteId] });
    },
    onError: (error: any) => {
      // Identidade já pertencente a outro cliente devolve 409 com a explicação
      // e o candidato a fusão criado — a mensagem do servidor diz o que fazer.
      toast.error(mensagemDeErro(error, t('hooks.erro_ligar_identidade')));
    },
  });
}

export function useRemoverIdentidade(clienteId: string) {
  const { t } = useTranslation('crm');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removerIdentidade,
    onSuccess: () => {
      toast.success(t('hooks.identidade_desligada'));
      queryClient.invalidateQueries({ queryKey: ['cliente-360', clienteId] });
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, t('hooks.erro_desligar_identidade')));
    },
  });
}

export function useRegistarClienteNoBalcao() {
  const { t } = useTranslation('crm');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registarClienteNoBalcao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['clientes-search'] });
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, t('hooks.erro_registar_cliente')));
    },
  });
}

export function useGuardarPreferencia(clienteId: string) {
  const { t } = useTranslation('crm');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { chave: string; valor: string }) =>
      guardarPreferencia(clienteId, payload),
    onSuccess: () => {
      toast.success(t('hooks.preferencia_guardada'));
      queryClient.invalidateQueries({ queryKey: ['cliente-360', clienteId] });
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, t('hooks.erro_preferencia')));
    },
  });
}

// ──── Fusão de clientes duplicados ────────────────────────────────────────────

export function useCandidatosFusao(estado?: EstadoCandidatoFusao) {
  return useQuery({
    queryKey: ['crm-candidatos-fusao', estado ?? 'todos'],
    queryFn: () => listarCandidatosFusao(estado),
  });
}

export function useResolverCandidatoFusao() {
  const { t } = useTranslation('crm');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string;
      estado: 'CONFIRMADO' | 'REJEITADO';
      principalId?: string;
    }) => resolverCandidatoFusao(id, payload),
    onSuccess: (_, variaveis) => {
      toast.success(
        variaveis.estado === 'CONFIRMADO' ? t('hooks.clientes_fundidos') : t('hooks.candidato_rejeitado'),
      );
      queryClient.invalidateQueries({ queryKey: ['crm-candidatos-fusao'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, t('hooks.erro_decidir_candidato')));
    },
  });
}

export function useFundirClientes() {
  const { t } = useTranslation('crm');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fundirClientes,
    onSuccess: () => {
      toast.success(t('hooks.clientes_fundidos'));
      queryClient.invalidateQueries({ queryKey: ['crm-candidatos-fusao'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, t('hooks.erro_fundir')));
    },
  });
}

// ──── Segmentação ─────────────────────────────────────────────────────────────

export function useSegmentos(dimensao?: DimensaoSegmento) {
  return useQuery({
    queryKey: ['crm-segmentos', dimensao ?? 'todas'],
    queryFn: () => listarSegmentos(dimensao),
  });
}

export function useMembrosSegmento(segmentId: string | null, page: number) {
  return useQuery({
    queryKey: ['crm-segmento-membros', segmentId, page],
    queryFn: () => listarMembrosSegmento(segmentId!, { page, limit: 25 }),
    enabled: !!segmentId,
    placeholderData: (prev) => prev,
  });
}

export function useRecalcularSegmentos() {
  const { t } = useTranslation('crm');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recalcularSegmentos,
    onSuccess: (r) => {
      toast.success(
        t('hooks.segmentos_recalculados', { clientes: r.clientes, entradas: r.entradas, saidas: r.saidas }),
      );
      queryClient.invalidateQueries({ queryKey: ['crm-segmentos'] });
      queryClient.invalidateQueries({ queryKey: ['crm-segmento-membros'] });
      // A ficha de cada cliente mostra os segmentos a que pertence.
      queryClient.invalidateQueries({ queryKey: ['cliente-360'] });
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, t('hooks.erro_recalcular')));
    },
  });
}

export function useAudiencias() {
  return useQuery({ queryKey: ['crm-audiencias'], queryFn: listarAudiencias });
}

export function useCriarAudiencia() {
  const { t } = useTranslation('crm');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: criarAudiencia,
    onSuccess: (a) => {
      toast.success(t('hooks.audiencia_fixada', { nome: a.nome, total: a.total }));
      queryClient.invalidateQueries({ queryKey: ['crm-audiencias'] });
    },
    onError: (error: any) => {
      // Segmento vazio devolve 400 com a explicação.
      toast.error(mensagemDeErro(error, t('hooks.erro_fixar_audiencia')));
    },
  });
}

// ──── Campanhas ───────────────────────────────────────────────────────────────

export function useCampanhas() {
  return useQuery({ queryKey: ['crm-campanhas'], queryFn: listarCampanhas });
}

export function useCampanha(id: string | null) {
  return useQuery({
    queryKey: ['crm-campanha', id],
    queryFn: () => obterCampanha(id!),
    enabled: !!id,
  });
}

export function useEnviosCampanha(id: string | null, page: number) {
  return useQuery({
    queryKey: ['crm-campanha-envios', id, page],
    queryFn: () => listarEnviosCampanha(id!, { page, limit: 25 }),
    enabled: !!id,
    placeholderData: (prev) => prev,
  });
}

export function useResultadoCampanha(id: string | null) {
  return useQuery({
    queryKey: ['crm-campanha-resultado', id],
    queryFn: () => obterResultadoCampanha(id!),
    enabled: !!id,
  });
}

export function useCriarCampanha() {
  const { t } = useTranslation('crm');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: criarCampanha,
    onSuccess: () => {
      toast.success(t('hooks.campanha_criada'));
      queryClient.invalidateQueries({ queryKey: ['crm-campanhas'] });
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, t('hooks.erro_criar_campanha')));
    },
  });
}

export function useEnviarCampanha() {
  const { t } = useTranslation('crm');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: enviarCampanha,
    onSuccess: (r) => {
      // O número que interessa é o que saiu, não o de destinatários: a diferença
      // entre os dois é o que explica o resultado.
      toast.success(
        t('hooks.campanha_enviada', { enviados: r.enviados, destinatarios: r.destinatarios }),
      );
      queryClient.invalidateQueries({ queryKey: ['crm-campanhas'] });
      queryClient.invalidateQueries({ queryKey: ['crm-campanha'] });
      queryClient.invalidateQueries({ queryKey: ['crm-campanha-envios'] });
      queryClient.invalidateQueries({ queryKey: ['crm-campanha-resultado'] });
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, t('hooks.erro_enviar_campanha')));
    },
  });
}

export function useCancelarCampanha() {
  const { t } = useTranslation('crm');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelarCampanha,
    onSuccess: () => {
      toast.success(t('hooks.campanha_cancelada'));
      queryClient.invalidateQueries({ queryKey: ['crm-campanhas'] });
      queryClient.invalidateQueries({ queryKey: ['crm-campanha'] });
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, t('hooks.erro_cancelar_campanha')));
    },
  });
}

// ──── MAYRA ───────────────────────────────────────────────────────────────────

export function useOportunidades() {
  return useQuery({ queryKey: ['crm-mayra-oportunidades'], queryFn: obterOportunidades });
}

export function useSugerirMensagens() {
  const { t } = useTranslation('crm');
  return useMutation({
    mutationFn: sugerirMensagens,
    onError: (error: any) => {
      // A MAYRA pode estar indisponível; o campo de texto continua a funcionar.
      toast.error(
        mensagemDeErro(error, t('hooks.erro_mayra_sugerir')),
      );
    },
  });
}

export function useAtencao() {
  return useQuery({ queryKey: ['crm-mayra-atencao'], queryFn: obterAtencao });
}

// ──── Configuração ────────────────────────────────────────────────────────────

export function useConfiguracaoCrm() {
  return useQuery({ queryKey: ['crm-configuracao'], queryFn: obterConfiguracao });
}

export function useActualizarConfiguracao() {
  const { t } = useTranslation('crm');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: actualizarConfiguracao,
    onSuccess: () => {
      toast.success(t('hooks.definicoes_guardadas'));
      queryClient.invalidateQueries({ queryKey: ['crm-configuracao'] });
      // A classificação e as recomendações passam a usar os valores novos.
      queryClient.invalidateQueries({ queryKey: ['crm-segmentos'] });
      queryClient.invalidateQueries({ queryKey: ['crm-mayra-oportunidades'] });
      queryClient.invalidateQueries({ queryKey: ['crm-mayra-atencao'] });
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, t('hooks.erro_definicoes')));
    },
  });
}

// ──── Fidelização ─────────────────────────────────────────────────────────────

export function useSaldoPontos(clienteId?: string) {
  return useQuery({
    queryKey: ['crm-pontos-saldo', clienteId],
    queryFn: () => obterSaldoPontos(clienteId!),
    enabled: !!clienteId,
  });
}

export function useHistoricoPontos(clienteId?: string) {
  return useQuery({
    queryKey: ['crm-pontos-historico', clienteId],
    queryFn: () => obterHistoricoPontos(clienteId!),
    enabled: !!clienteId,
  });
}

/**
 * O saldo muda em vários sítios ao mesmo tempo — a ficha do cliente, o balcão,
 * a lista. Invalidar tudo o que o mostra evita um número desactualizado num
 * ecrã enquanto o outro já tem o certo.
 */
function invalidarPontos(queryClient: ReturnType<typeof useQueryClient>, clienteId: string) {
  queryClient.invalidateQueries({ queryKey: ['crm-pontos-saldo', clienteId] });
  queryClient.invalidateQueries({ queryKey: ['crm-pontos-historico', clienteId] });
  queryClient.invalidateQueries({ queryKey: ['cliente-360', clienteId] });
  queryClient.invalidateQueries({ queryKey: ['clientes'] });
}

export function useResgatarPontos() {
  const { t } = useTranslation('crm');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resgatarPontos,
    onSuccess: (r, variaveis) => {
      toast.success(
        t('hooks.pontos_usados', {
          pontos: r.pontosUsados,
          desconto: formatMoeda(Number(r.descontoEmMeticais)),
        }),
      );
      invalidarPontos(queryClient, variaveis.clienteId);
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, t('hooks.erro_usar_pontos')));
    },
  });
}

export function useAjustarPontos() {
  const { t } = useTranslation('crm');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ajustarPontos,
    onSuccess: (r, variaveis) => {
      toast.success(t('hooks.saldo_ajustado', { anterior: r.saldoAnterior, actual: r.saldoApos }));
      invalidarPontos(queryClient, variaveis.clienteId);
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, t('hooks.erro_ajustar_pontos')));
    },
  });
}

export function useVerificarEntregas() {
  const { t } = useTranslation('crm');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verificarEntregas,
    onSuccess: (r) => {
      if (r.verificadas === 0) {
        toast.success(t('hooks.entregas_nada'));
      } else {
        toast.success(
          t('hooks.entregas_resultado', {
            entregues: r.entregues,
            naoEntregues: r.naoEntregues,
            aindaEmTransito: r.aindaEmTransito,
          }),
        );
      }
      queryClient.invalidateQueries({ queryKey: ['crm-campanha-envios'] });
      queryClient.invalidateQueries({ queryKey: ['crm-campanha-resultado'] });
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, t('hooks.erro_entregas')));
    },
  });
}
