import { api } from '@/shared/config';

/**
 * A verificação documental dos fornecedores — o lado da plataforma.
 *
 * ## Usa a instância `api` partilhada, ao contrário do portal
 *
 * E é correcto: quem verifica é um `User` do lado comprador, com sessão do ControlCore. O
 * interceptor que renova o token e redirecciona para `/login` é exactamente o comportamento
 * desejado aqui — é o portal do fornecedor que precisava de instância própria, porque lá o
 * principal é outro.
 */

export interface DocumentoParaVerificar {
  id: string;
  tipo: string;
  descricao?: string | null;
  numero?: string | null;
  entidadeEmissora?: string | null;
  ficheiroUrl?: string | null;
  emitidoEm?: string | null;
  validoAte?: string | null;
  estado: 'PENDENTE' | 'VALIDO' | 'EXPIRADO' | 'RECUSADO';
  verificadoEm?: string | null;
  motivoDecisao?: string | null;
  createdAt: string;
}

export interface Conformidade {
  conforme: boolean;
  grau: number;
  faltas: { tipo: string; bloqueante: boolean; mensagem: string }[];
  resumo: string;
}

export interface OrganizacaoNaFila {
  organizacaoId: string;
  razaoSocial: string;
  nomeComercial: string | null;
  nuit: string | null;
  sede: string | null;
  criadaEm: string;
  documentosPendentes: number;
  documentosValidos: number;
  temContaBancariaActiva: boolean;
  artigosPublicados: number;
  /** Verdadeiro quando nenhuma empresa lhe compra ainda — o caso do auto-registo. */
  semRelacoes: boolean;
  submissaoMaisAntiga: string | null;
}

const BASE = '/b2b/qualificacao';

export const qualificacaoApi = {
  /** A fila de verificação, da submissão mais antiga para a mais recente. */
  pendentes: async () => {
    const { data } = await api.get<OrganizacaoNaFila[]>(`${BASE}/pendentes`);
    return data;
  },

  estado: async (organizacaoId: string) => {
    const { data } = await api.get<{
      organizacaoId: string;
      conformidade: Conformidade;
      documentos: DocumentoParaVerificar[];
    }>(`${BASE}/${organizacaoId}`);
    return data;
  },

  verificar: async (
    organizacaoId: string,
    documentoId: string,
    payload: { decisao: 'VALIDO' | 'RECUSADO'; motivo?: string },
  ) => {
    const { data } = await api.patch<{
      documento: DocumentoParaVerificar;
      conformidade: Conformidade;
    }>(`${BASE}/${organizacaoId}/documentos/${documentoId}`, payload);
    return data;
  },
};

export const ETIQUETA_DOCUMENTO: Record<string, string> = {
  ALVARA: 'Alvará',
  CERTIDAO_QUITACAO_FISCAL: 'Certidão de quitação fiscal',
  INSCRICAO_INSS: 'Inscrição no INSS',
  LICENCA_SANITARIA: 'Licença sanitária',
  SEGURO_RESPONSABILIDADE: 'Seguro de responsabilidade',
  CERTIFICADO_QUALIDADE: 'Certificado de qualidade',
  OUTRO: 'Outro documento',
};

/** Os que impedem a compra quando faltam. Ver `qualificacao-fornecedor.ts` no backend. */
export const DOCUMENTOS_BLOQUEANTES = ['ALVARA', 'CERTIDAO_QUITACAO_FISCAL'];
