/**
 * O contrato do onboarding, das ofertas e do registo do estafeta (plano §4.9) — igual ao do backend
 * (`onboarding-estafeta.use-cases.ts`, `ofertas-entrega.use-cases.ts`, `registo-estafeta.use-cases.ts`).
 */

export const TIPOS_DE_DOCUMENTO = [
  'BI',
  'CARTA_CONDUCAO',
  'DOCUMENTO_VEICULO',
  'FOTO_VEICULO',
  'FOTO_ROSTO',
] as const;
export type TipoDeDocumento = (typeof TIPOS_DE_DOCUMENTO)[number];

export type LadoDaImagem = 'FRENTE' | 'VERSO' | 'UNICA';

export type EstadoDoPasso = 'POR_FAZER' | 'IMAGENS_ENVIADAS' | 'COMPLETO';

/** Os documentos de que se lêem e confirmam dados; as duas fotografias só precisam da imagem. */
export const TIPOS_COM_DADOS = ['BI', 'CARTA_CONDUCAO', 'DOCUMENTO_VEICULO'] as const;
export type TipoComDados = (typeof TIPOS_COM_DADOS)[number];

export const ehTipoComDados = (tipo: TipoDeDocumento): tipo is TipoComDados =>
  (TIPOS_COM_DADOS as readonly string[]).includes(tipo);

/**
 * Os campos de cada documento, pela ordem em que aparecem no formulário. **Todos obrigatórios** (decisão do
 * utilizador): o servidor recusa a confirmação com um em falta, e o ecrã espelha-o para o dizer antes de enviar.
 */
export const CAMPOS_DO_DOCUMENTO: Record<TipoComDados, readonly CampoDoDocumento[]> = {
  BI: ['numero', 'nomeNoDocumento', 'dataNascimento', 'emitidoEm', 'validoAte', 'naturalidade', 'filiacao', 'nuit'],
  CARTA_CONDUCAO: ['numero', 'nomeNoDocumento', 'categorias', 'emitidoEm', 'validoAte'],
  DOCUMENTO_VEICULO: ['matricula', 'marca', 'modelo', 'cor', 'anoVeiculo', 'proprietario'],
};

export type CampoDoDocumento =
  | 'numero'
  | 'nomeNoDocumento'
  | 'dataNascimento'
  | 'emitidoEm'
  | 'validoAte'
  | 'naturalidade'
  | 'filiacao'
  | 'nuit'
  | 'categorias'
  | 'matricula'
  | 'marca'
  | 'modelo'
  | 'cor'
  | 'anoVeiculo'
  | 'proprietario';

/** Os campos que se escrevem como data (`AAAA-MM-DD`): o ecrã usa um selector de data. */
export const CAMPOS_DE_DATA: readonly CampoDoDocumento[] = ['dataNascimento', 'emitidoEm', 'validoAte'];

export type DadosDoDocumento = Partial<Record<CampoDoDocumento, string | number>>;

export interface ImagemDoPasso {
  id: string;
  lado: LadoDaImagem;
  /** Um URL de 5 minutos: para o próprio estafeta ver o que enviou. Nunca se guarda. */
  url: string;
}

export interface PassoDoOnboarding {
  tipo: TipoDeDocumento;
  estado: EstadoDoPasso;
  imagensEmFalta: LadoDaImagem[];
  faltaConfirmar: boolean;
  /** O que o estafeta já confirmou, para o ecrã o voltar a mostrar e deixar editar. */
  dados: DadosDoDocumento | null;
  imagens: ImagemDoPasso[];
}

export interface EstadoDoOnboarding {
  completo: boolean;
  /** `null` = ainda em onboarding. */
  onboardingCompletoEm: string | null;
  frota: 'PROPRIA' | 'PLATAFORMA';
  contactosEmFalta: string[];
  passos: PassoDoOnboarding[];
}

export type MotivoDeRecusaDoCampo =
  | 'obrigatorio'
  | 'formato_invalido'
  | 'data_invalida'
  | 'data_no_futuro'
  | 'validade_antes_da_emissao'
  | 'expirado';

export interface CampoRecusado {
  campo: string;
  motivo: MotivoDeRecusaDoCampo;
}

/** O que a leitura por IA devolve: uma **sugestão** — nunca um facto até o estafeta a confirmar. */
export interface LeituraDeDocumento {
  dados: DadosDoDocumento;
  recusados: CampoRecusado[];
  /** Nenhum campo se aproveitou: a fotografia pode estar torta, escura ou cortada. */
  semResultado: boolean;
  /** O serviço de leitura não respondeu: o ecrã diz «escreva à mão», não «tire outra fotografia». */
  indisponivel: boolean;
}

export interface ContactoDeEmergencia {
  nome: string;
  telefone: string;
}

export interface DadosDoRegisto {
  /** O convite da frota própria de uma empresa. Sem ele, o registo é na frota da plataforma. */
  convite?: string;
  nome: string;
  telefone: string;
  email: string;
  senha: string;
  contactoEmergencia: ContactoDeEmergencia;
  idioma?: 'pt' | 'en';
}

export interface RespostaDoRegisto {
  /** O código `E####` que o estafeta usa para entrar: vem também por e-mail, mas o e-mail pode não chegar. */
  codigo: string;
  emailEnviado: boolean;
  frota: 'PROPRIA' | 'PLATAFORMA';
  utilizador: { estafetaId: string; nome: string; codigo: string; idioma: string | null };
}

/** O que um estafeta vê de uma oferta **antes de aceitar**: a loja, a distância e a taxa — nada do cliente. */
export interface OfertaDeEntrega {
  id: string;
  entregaId: string;
  lojaNome: string;
  distanciaMetros: number;
  /** O que o estafeta recebe por esta entrega. */
  taxa: number;
  expiraEm: string;
}

export type MotivoDaOfertaEncerrada = 'ACEITE' | 'RECUSADA' | 'EXPIRADA' | 'ATRIBUIDA_A_OUTRO' | 'ENTREGA_CANCELADA';

/** A posição com que se fica online. */
export interface PosicaoParaOnline {
  latitude: number;
  longitude: number;
  precisao?: number;
}
