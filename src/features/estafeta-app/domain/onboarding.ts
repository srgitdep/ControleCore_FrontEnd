import {
  CAMPOS_DE_DATA,
  CAMPOS_DO_DOCUMENTO,
  ehTipoComDados,
  type CampoDoDocumento,
  type CampoRecusado,
  type DadosDoDocumento,
  type LadoDaImagem,
  type MotivoDeRecusaDoCampo,
  type PassoDoOnboarding,
  type TipoDeDocumento,
} from '../types/onboarding';

/**
 * Regras puras do assistente de onboarding (plano §4.9): o que fotografar em cada passo, qual é o passo
 * seguinte, e a validação **de cortesia** dos campos. A validação a sério é a do servidor (`validarConfirmacao`),
 * que o ecrã só espelha para dizer o erro antes de enviar — nunca para decidir o que é válido.
 */

/**
 * As fotografias que cada passo pede, e se são obrigatórias. O BI e a carta pedem as duas faces; o documento do
 * veículo uma face (e o verso, se o documento o tiver); as fotografias do veículo e do rosto uma só.
 */
export function ranhurasDoPasso(tipo: TipoDeDocumento): Array<{ lado: LadoDaImagem; obrigatoria: boolean }> {
  switch (tipo) {
    case 'BI':
    case 'CARTA_CONDUCAO':
      return [
        { lado: 'FRENTE', obrigatoria: true },
        { lado: 'VERSO', obrigatoria: true },
      ];
    case 'DOCUMENTO_VEICULO':
      return [
        { lado: 'UNICA', obrigatoria: true },
        { lado: 'VERSO', obrigatoria: false },
      ];
    case 'FOTO_VEICULO':
    case 'FOTO_ROSTO':
      return [{ lado: 'UNICA', obrigatoria: true }];
  }
}

/** A câmara a usar: a de trás para documentos e para o veículo; a da frente para o rosto. */
export const cameraDoPasso = (tipo: TipoDeDocumento): 'environment' | 'user' =>
  tipo === 'FOTO_ROSTO' ? 'user' : 'environment';

/** O primeiro passo por completar, ou `null` se estão todos feitos. É para onde o assistente abre. */
export function primeiroPassoPorFazer(passos: readonly PassoDoOnboarding[]): TipoDeDocumento | null {
  return passos.find((p) => p.estado !== 'COMPLETO')?.tipo ?? null;
}

/** Quantos passos estão completos, para a barra de progresso. */
export const passosCompletos = (passos: readonly PassoDoOnboarding[]): number =>
  passos.filter((p) => p.estado === 'COMPLETO').length;

/** Os contactos que o assistente pede ele próprio (os outros já vieram do registo ou da criação pelo gestor). */
export const pedeContactoDeEmergencia = (contactosEmFalta: readonly string[]): boolean =>
  contactosEmFalta.some((c) => c.startsWith('contactoEmergencia'));

/** Os campos de um passo por esta ordem, ou nenhum nas fotografias. */
export const camposDoPasso = (tipo: TipoDeDocumento): readonly CampoDoDocumento[] =>
  ehTipoComDados(tipo) ? CAMPOS_DO_DOCUMENTO[tipo] : [];

const ehData = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));

/**
 * A validação de cortesia de um campo. Devolve o motivo (a chave do catálogo é `onboarding.erros.<motivo>`) ou `null`.
 * Só apanha o evidente — vazio, NUIT que não tem 9 dígitos, uma data que não é data —; o resto (datas no futuro,
 * validade antes da emissão, documento expirado) diz o servidor, que é quem decide.
 */
export function validarCampo(campo: CampoDoDocumento, valor: unknown): MotivoDeRecusaDoCampo | null {
  const texto = typeof valor === 'number' ? String(valor) : typeof valor === 'string' ? valor.trim() : '';
  if (texto === '') return 'obrigatorio';

  if (CAMPOS_DE_DATA.includes(campo)) return ehData(texto) ? null : 'data_invalida';
  if (campo === 'nuit') return /^\d{9}$/.test(texto.replace(/[\s.-]/g, '')) ? null : 'formato_invalido';
  if (campo === 'anoVeiculo') return /^\d{4}$/.test(texto) ? null : 'formato_invalido';
  return null;
}

/** Os campos que ainda não passam, para o ecrã os marcar de uma vez. Vazio = pode confirmar. */
export function errosDoFormulario(
  tipo: TipoDeDocumento,
  dados: DadosDoDocumento,
): Partial<Record<CampoDoDocumento, MotivoDeRecusaDoCampo>> {
  const erros: Partial<Record<CampoDoDocumento, MotivoDeRecusaDoCampo>> = {};
  for (const campo of camposDoPasso(tipo)) {
    const motivo = validarCampo(campo, dados[campo]);
    if (motivo) erros[campo] = motivo;
  }
  return erros;
}

/**
 * Junta a sugestão da leitura com o que já se tinha. **A sugestão só preenche o que está em branco**: um campo
 * que o estafeta já escreveu ou corrigiu nunca é pisado por uma leitura nova — ele sabe o que o documento diz, a
 * máquina só sugere.
 */
export function aplicarSugestao(actual: DadosDoDocumento, sugestao: DadosDoDocumento): DadosDoDocumento {
  const resultado: DadosDoDocumento = { ...actual };
  for (const [campo, valor] of Object.entries(sugestao) as Array<[CampoDoDocumento, string | number]>) {
    const existente = resultado[campo];
    if (existente === undefined || existente === null || String(existente).trim() === '') resultado[campo] = valor;
  }
  return resultado;
}

/**
 * Os erros que o servidor devolveu (`parametros.erros`) → campo → motivo, para marcar o campo certo. Ignora o que
 * não for um campo do documento (um erro que o ecrã não saberia onde pôr fica no aviso geral).
 */
export function errosDoServidor(
  tipo: TipoDeDocumento,
  erros: readonly CampoRecusado[] | undefined,
): Partial<Record<CampoDoDocumento, MotivoDeRecusaDoCampo>> {
  const validos = new Set<string>(camposDoPasso(tipo));
  const resultado: Partial<Record<CampoDoDocumento, MotivoDeRecusaDoCampo>> = {};
  for (const e of erros ?? []) {
    if (validos.has(e.campo) && !(e.campo in resultado)) resultado[e.campo as CampoDoDocumento] = e.motivo;
  }
  return resultado;
}

/**
 * Um telemóvel moçambicano em 9 dígitos, ou `null`. O mesmo critério do servidor (`normalizarTelefoneMz`): com ou sem
 * espaços e `+258`, e só os prefixos das três operadoras (82/83, 84/85, 86/87). É uma cortesia — o servidor decide.
 */
export function normalizarTelemovelMz(entrada: string): string | null {
  let digitos = entrada.replace(/[\s().-]/g, '');
  if (digitos.startsWith('+')) digitos = digitos.slice(1);
  if (digitos.startsWith('00')) digitos = digitos.slice(2);
  if (digitos.startsWith('258') && digitos.length === 12) digitos = digitos.slice(3);
  return /^8[2-7]\d{7}$/.test(digitos) ? digitos : null;
}
