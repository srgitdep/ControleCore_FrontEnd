import { describe, expect, it } from 'vitest';
import {
  aplicarSugestao,
  cameraDoPasso,
  camposDoPasso,
  errosDoFormulario,
  errosDoServidor,
  normalizarTelemovelMz,
  passosCompletos,
  pedeContactoDeEmergencia,
  primeiroPassoPorFazer,
  ranhurasDoPasso,
  validarCampo,
} from './onboarding';
import type { PassoDoOnboarding, TipoDeDocumento } from '../types/onboarding';

const passo = (tipo: TipoDeDocumento, estado: PassoDoOnboarding['estado']): PassoDoOnboarding => ({
  tipo,
  estado,
  imagensEmFalta: [],
  faltaConfirmar: false,
  dados: null,
  imagens: [],
});

describe('ranhurasDoPasso', () => {
  it('o BI e a carta pedem as duas faces, ambas obrigatórias', () => {
    for (const tipo of ['BI', 'CARTA_CONDUCAO'] as const) {
      expect(ranhurasDoPasso(tipo)).toEqual([
        { lado: 'FRENTE', obrigatoria: true },
        { lado: 'VERSO', obrigatoria: true },
      ]);
    }
  });

  it('o documento do veículo pede uma face, e o verso só se o documento o tiver', () => {
    expect(ranhurasDoPasso('DOCUMENTO_VEICULO')).toEqual([
      { lado: 'UNICA', obrigatoria: true },
      { lado: 'VERSO', obrigatoria: false },
    ]);
  });

  it('as fotografias do veículo e do rosto pedem uma só', () => {
    expect(ranhurasDoPasso('FOTO_VEICULO')).toEqual([{ lado: 'UNICA', obrigatoria: true }]);
    expect(ranhurasDoPasso('FOTO_ROSTO')).toEqual([{ lado: 'UNICA', obrigatoria: true }]);
  });
});

describe('cameraDoPasso', () => {
  it('a da frente só para o rosto; a de trás para tudo o resto', () => {
    expect(cameraDoPasso('FOTO_ROSTO')).toBe('user');
    for (const t of ['BI', 'CARTA_CONDUCAO', 'DOCUMENTO_VEICULO', 'FOTO_VEICULO'] as const) {
      expect(cameraDoPasso(t)).toBe('environment');
    }
  });
});

describe('primeiroPassoPorFazer / passosCompletos', () => {
  const todos = [
    passo('BI', 'COMPLETO'),
    passo('CARTA_CONDUCAO', 'IMAGENS_ENVIADAS'),
    passo('DOCUMENTO_VEICULO', 'POR_FAZER'),
    passo('FOTO_VEICULO', 'POR_FAZER'),
    passo('FOTO_ROSTO', 'POR_FAZER'),
  ];

  it('abre no primeiro passo que não está completo (retoma onde ficou)', () => {
    expect(primeiroPassoPorFazer(todos)).toBe('CARTA_CONDUCAO');
  });

  it('com tudo completo não há passo por fazer', () => {
    expect(primeiroPassoPorFazer(todos.map((p) => ({ ...p, estado: 'COMPLETO' as const })))).toBeNull();
  });

  it('conta os completos', () => {
    expect(passosCompletos(todos)).toBe(1);
    expect(passosCompletos([])).toBe(0);
  });
});

describe('pedeContactoDeEmergencia', () => {
  it('só quando falta o nome ou o telemóvel de emergência', () => {
    expect(pedeContactoDeEmergencia(['contactoEmergenciaNome'])).toBe(true);
    expect(pedeContactoDeEmergencia(['contactoEmergenciaTelefone'])).toBe(true);
    expect(pedeContactoDeEmergencia(['email'])).toBe(false);
    expect(pedeContactoDeEmergencia([])).toBe(false);
  });
});

describe('camposDoPasso', () => {
  it('os documentos têm os seus campos; as fotografias nenhum', () => {
    expect(camposDoPasso('BI')).toEqual(['numero', 'nomeNoDocumento', 'dataNascimento', 'emitidoEm', 'validoAte', 'naturalidade', 'filiacao', 'nuit']);
    expect(camposDoPasso('CARTA_CONDUCAO')).toContain('categorias');
    expect(camposDoPasso('DOCUMENTO_VEICULO')).toContain('matricula');
    expect(camposDoPasso('FOTO_ROSTO')).toEqual([]);
    expect(camposDoPasso('FOTO_VEICULO')).toEqual([]);
  });
});

describe('validarCampo — a cortesia, não a decisão', () => {
  it.each([undefined, null, '', '   '])('um campo vazio (%p) é obrigatório', (v) => {
    expect(validarCampo('numero', v)).toBe('obrigatorio');
  });

  it('o NUIT tem 9 dígitos (aceita separadores)', () => {
    expect(validarCampo('nuit', '123456789')).toBeNull();
    expect(validarCampo('nuit', '123 456 789')).toBeNull();
    expect(validarCampo('nuit', '12345678')).toBe('formato_invalido');
    expect(validarCampo('nuit', '12345678A')).toBe('formato_invalido');
  });

  it('as datas são AAAA-MM-DD e existem', () => {
    expect(validarCampo('validoAte', '2030-05-10')).toBeNull();
    expect(validarCampo('validoAte', '10/05/2030')).toBe('data_invalida');
    expect(validarCampo('emitidoEm', '2030-13-40')).toBe('data_invalida');
  });

  it('o ano do veículo tem 4 dígitos (número ou texto)', () => {
    expect(validarCampo('anoVeiculo', 2021)).toBeNull();
    expect(validarCampo('anoVeiculo', '2021')).toBeNull();
    expect(validarCampo('anoVeiculo', '21')).toBe('formato_invalido');
  });

  it('um texto qualquer só tem de não estar vazio', () => {
    expect(validarCampo('naturalidade', 'Maputo')).toBeNull();
  });
});

describe('errosDoFormulario', () => {
  const BI_COMPLETO = {
    numero: '110100123456B',
    nomeNoDocumento: 'Ana',
    dataNascimento: '1995-03-14',
    emitidoEm: '2022-05-10',
    validoAte: '2032-05-10',
    naturalidade: 'Maputo',
    filiacao: 'Joaquim e Rosa',
    nuit: '123456789',
  };

  it('um BI completo não tem erros', () => {
    expect(errosDoFormulario('BI', BI_COMPLETO)).toEqual({});
  });

  it('🔴 todos os campos são obrigatórios: marca-os todos de uma vez, não um de cada vez', () => {
    expect(Object.keys(errosDoFormulario('BI', {})).sort()).toEqual([...camposDoPasso('BI')].sort());
  });

  it('o que está mal marca só esse campo', () => {
    expect(errosDoFormulario('BI', { ...BI_COMPLETO, nuit: '12' })).toEqual({ nuit: 'formato_invalido' });
  });

  it('as fotografias não têm campos: nunca há erros', () => {
    expect(errosDoFormulario('FOTO_ROSTO', {})).toEqual({});
  });
});

describe('aplicarSugestao', () => {
  it('preenche o que está em branco', () => {
    expect(aplicarSugestao({}, { numero: 'ABC', nuit: '123456789' })).toEqual({ numero: 'ABC', nuit: '123456789' });
  });

  it('🔴 nunca pisa o que o estafeta já escreveu ou corrigiu: a máquina sugere, ele sabe o que o documento diz', () => {
    expect(aplicarSugestao({ numero: 'CORRIGIDO' }, { numero: 'LIDO-ERRADO', nuit: '123456789' })).toEqual({
      numero: 'CORRIGIDO',
      nuit: '123456789',
    });
  });

  it('um campo só com espaços conta como em branco', () => {
    expect(aplicarSugestao({ numero: '   ' }, { numero: 'ABC' })).toEqual({ numero: 'ABC' });
  });

  it('não muda o objecto original', () => {
    const original = { numero: 'A' };
    aplicarSugestao(original, { nuit: '123456789' });
    expect(original).toEqual({ numero: 'A' });
  });
});

describe('errosDoServidor', () => {
  it('põe cada erro no campo certo', () => {
    expect(
      errosDoServidor('BI', [
        { campo: 'nuit', motivo: 'formato_invalido' },
        { campo: 'validoAte', motivo: 'expirado' },
      ]),
    ).toEqual({ nuit: 'formato_invalido', validoAte: 'expirado' });
  });

  it('ignora o que não é um campo deste documento e fica com o primeiro motivo de cada campo', () => {
    expect(
      errosDoServidor('BI', [
        { campo: 'matricula', motivo: 'obrigatorio' },
        { campo: 'validoAte', motivo: 'validade_antes_da_emissao' },
        { campo: 'validoAte', motivo: 'expirado' },
      ]),
    ).toEqual({ validoAte: 'validade_antes_da_emissao' });
  });

  it('sem erros devolve vazio', () => {
    expect(errosDoServidor('BI', undefined)).toEqual({});
  });
});

describe('normalizarTelemovelMz — o mesmo critério do servidor', () => {
  it.each([
    ['841234567', '841234567'],
    ['84 123 4567', '841234567'],
    ['+258 84 123 4567', '841234567'],
    ['00258841234567', '841234567'],
    ['(86) 123-4567', '861234567'],
  ])('aceita %s', (entrada, esperado) => {
    expect(normalizarTelemovelMz(entrada)).toBe(esperado);
  });

  it.each(['', '81 123 4567', '21 123 456', '8412345', '+27 82 123 4567', 'abc'])('recusa «%s»', (entrada) => {
    expect(normalizarTelemovelMz(entrada)).toBeNull();
  });
});
