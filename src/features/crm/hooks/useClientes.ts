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
  sugerirMensagens,
  type CanalComunicacao,
  type DimensaoSegmento,
  type FinalidadeConsentimento,
  type TipoIdentidade,
} from '../api/clientes.api';
import toast from 'react-hot-toast';

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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: criarCliente,
    onSuccess: () => {
      toast.success('Cliente registado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['clientes-search'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao registar cliente.');
    }
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => atualizarCliente(id, data),
    onSuccess: (_, variables) => {
      toast.success('Cliente atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['cliente', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['clientes-search'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar cliente.');
    }
  });
}

export function useDeleteCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apagarCliente,
    onSuccess: () => {
      toast.success('Cliente eliminado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['clientes-search'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao eliminar cliente.');
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      finalidade: FinalidadeConsentimento;
      canal: CanalComunicacao;
      concedido: boolean;
    }) => registarConsentimento(clienteId, { ...payload, origem: 'ficha do cliente' }),
    onSuccess: (_, variables) => {
      toast.success(
        variables.concedido
          ? `Consentimento concedido para ${variables.canal.toLowerCase()}.`
          : `Consentimento revogado para ${variables.canal.toLowerCase()}.`,
      );
      queryClient.invalidateQueries({ queryKey: ['cliente-360', clienteId] });
      // O campo antigo do cliente é espelhado no backend; a lista mostra-o.
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['cliente', clienteId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao registar consentimento.');
    },
  });
}

export function useAdicionarIdentidade(clienteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { tipo: TipoIdentidade; valor: string; principal?: boolean }) =>
      adicionarIdentidade(clienteId, { ...payload, origem: 'ficha do cliente' }),
    onSuccess: () => {
      toast.success('Identidade ligada ao cliente.');
      queryClient.invalidateQueries({ queryKey: ['cliente-360', clienteId] });
    },
    onError: (error: any) => {
      // Identidade já pertencente a outro cliente devolve 409 com a explicação
      // e o candidato a fusão criado — a mensagem do servidor diz o que fazer.
      toast.error(error.response?.data?.message || 'Erro ao ligar identidade.');
    },
  });
}

export function useRemoverIdentidade(clienteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removerIdentidade,
    onSuccess: () => {
      toast.success('Identidade desligada.');
      queryClient.invalidateQueries({ queryKey: ['cliente-360', clienteId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao desligar identidade.');
    },
  });
}

export function useRegistarClienteNoBalcao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registarClienteNoBalcao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['clientes-search'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao registar cliente.');
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recalcularSegmentos,
    onSuccess: (r) => {
      toast.success(
        `${r.clientes} cliente(s) reclassificado(s): ${r.entradas} entrada(s), ${r.saidas} saída(s).`,
      );
      queryClient.invalidateQueries({ queryKey: ['crm-segmentos'] });
      queryClient.invalidateQueries({ queryKey: ['crm-segmento-membros'] });
      // A ficha de cada cliente mostra os segmentos a que pertence.
      queryClient.invalidateQueries({ queryKey: ['cliente-360'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao recalcular segmentos.');
    },
  });
}

export function useAudiencias() {
  return useQuery({ queryKey: ['crm-audiencias'], queryFn: listarAudiencias });
}

export function useCriarAudiencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: criarAudiencia,
    onSuccess: (a) => {
      toast.success(`Audiência "${a.nome}" fixada com ${a.total} cliente(s).`);
      queryClient.invalidateQueries({ queryKey: ['crm-audiencias'] });
    },
    onError: (error: any) => {
      // Segmento vazio devolve 400 com a explicação.
      toast.error(error.response?.data?.message || 'Erro ao fixar audiência.');
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: criarCampanha,
    onSuccess: () => {
      toast.success('Campanha criada. Reveja antes de enviar.');
      queryClient.invalidateQueries({ queryKey: ['crm-campanhas'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar campanha.');
    },
  });
}

export function useEnviarCampanha() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: enviarCampanha,
    onSuccess: (r) => {
      // O número que interessa é o que saiu, não o de destinatários: a diferença
      // entre os dois é o que explica o resultado.
      toast.success(
        `${r.enviados} mensagem(ns) enviada(s) de ${r.destinatarios} destinatário(s).`,
      );
      queryClient.invalidateQueries({ queryKey: ['crm-campanhas'] });
      queryClient.invalidateQueries({ queryKey: ['crm-campanha'] });
      queryClient.invalidateQueries({ queryKey: ['crm-campanha-envios'] });
      queryClient.invalidateQueries({ queryKey: ['crm-campanha-resultado'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao enviar campanha.');
    },
  });
}

export function useCancelarCampanha() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelarCampanha,
    onSuccess: () => {
      toast.success('Campanha cancelada.');
      queryClient.invalidateQueries({ queryKey: ['crm-campanhas'] });
      queryClient.invalidateQueries({ queryKey: ['crm-campanha'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao cancelar campanha.');
    },
  });
}

// ──── MAYRA ───────────────────────────────────────────────────────────────────

export function useOportunidades() {
  return useQuery({ queryKey: ['crm-mayra-oportunidades'], queryFn: obterOportunidades });
}

export function useSugerirMensagens() {
  return useMutation({
    mutationFn: sugerirMensagens,
    onError: (error: any) => {
      // A MAYRA pode estar indisponível; o campo de texto continua a funcionar.
      toast.error(
        error.response?.data?.message || 'A MAYRA não conseguiu sugerir agora. Escreva a mensagem.',
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: actualizarConfiguracao,
    onSuccess: () => {
      toast.success('Definições guardadas. Aplicam-se no próximo cálculo.');
      queryClient.invalidateQueries({ queryKey: ['crm-configuracao'] });
      // A classificação e as recomendações passam a usar os valores novos.
      queryClient.invalidateQueries({ queryKey: ['crm-segmentos'] });
      queryClient.invalidateQueries({ queryKey: ['crm-mayra-oportunidades'] });
      queryClient.invalidateQueries({ queryKey: ['crm-mayra-atencao'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao guardar as definições.');
    },
  });
}

export function useVerificarEntregas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verificarEntregas,
    onSuccess: (r) => {
      if (r.verificadas === 0) {
        toast.success('Nada por confirmar — todas as mensagens já têm estado.');
      } else {
        toast.success(
          `${r.entregues} entregue(s), ${r.naoEntregues} não entregue(s), ` +
            `${r.aindaEmTransito} ainda a caminho.`,
        );
      }
      queryClient.invalidateQueries({ queryKey: ['crm-campanha-envios'] });
      queryClient.invalidateQueries({ queryKey: ['crm-campanha-resultado'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao verificar as entregas.');
    },
  });
}
