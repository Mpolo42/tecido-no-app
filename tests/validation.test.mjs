import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_PHOTO_BYTES,
  formatPhone,
  normalizePhone,
  validatePatient,
  validatePhoto,
} from '../supabase/functions/_shared/validation.js';

const patient = (overrides = {}) => ({
  nome: 'Pessoa de Teste',
  nomeSocial: '',
  whatsapp: '(85) 99999-1234',
  sexo: 'F',
  idade: '62',
  tipoDiabetes: 'Tipo 2',
  comorbidades: [],
  grauLesao: 'Grau 1',
  tempoLesao: '4 semanas',
  localizacaoQuadrante: 'Pé esquerdo',
  termoConsentimento: true,
  ...overrides,
});

test('normalizes Brazilian phone numbers with country code without losing national digits', () => {
  assert.equal(normalizePhone('+55 (85) 99999-1234'), '85999991234');
  assert.equal(normalizePhone('+55 (85) 3333-1234'), '8533331234');
  assert.equal(normalizePhone('(55) 99999-1234'), '55999991234');
  assert.equal(normalizePhone('8599999123456'), '8599999123456');
  assert.equal(formatPhone('+55 (85) 99999-1234'), '(85) 99999-1234');
  assert.equal(formatPhone('8533331234'), '(85) 3333-1234');
  assert.equal(normalizePhone(formatPhone('55999991234')), '55999991234');
});

test('normalizes whitespace and filters fields controlled by the server', () => {
  const { data, errors } = validatePatient(patient({
    nome: '  Pessoa   de Teste  ',
    nomeSocial: '  Nome   Social ',
    whatsapp: '+55 (85) 99999-1234',
    id: '1',
    is_admin: true,
    owner_id: 'another-user',
    foto_url: 'https://invalid.example/photo',
    consent_version: 'fabricated',
    created_at: '2000-01-01',
    website: '',
    ['__proto__']: { is_admin: true },
  }));
  assert.deepEqual(errors, {});
  assert.equal(data.nome, 'Pessoa de Teste');
  assert.equal(data.nome_social, 'Nome Social');
  assert.equal(data.whatsapp, '85999991234');
  assert.equal(data.idade, 62);
  for (const key of ['id', 'is_admin', 'owner_id', 'foto_url', 'consent_version', 'created_at', 'website', '__proto__']) {
    assert.equal(Object.hasOwn(data, key), false, key);
  }
});

test('requires all mandatory fields and returns field names used by the registration form', () => {
  const { errors } = validatePatient();
  for (const field of ['nome', 'whatsapp', 'sexo', 'idade', 'tipoDiabetes', 'grauLesao', 'tempoLesao', 'localizacaoQuadrante', 'termoConsentimento']) {
    assert.ok(errors[field], field);
  }
});

for (const [field, maximum] of [['nome', 150], ['nomeSocial', 150], ['tempoLesao', 100], ['localizacaoQuadrante', 150]]) {
  test(`enforces minimum and maximum text length for ${field}`, () => {
    assert.equal(validatePatient(patient({ [field]: 'a'.repeat(maximum) })).errors[field], undefined);
    assert.ok(validatePatient(patient({ [field]: 'a'.repeat(maximum + 1) })).errors[field]);
    assert.ok(validatePatient(patient({ [field]: 'a' })).errors[field]);
    assert.ok(validatePatient(patient({ [field]: 'a\u0000b' })).errors[field]);
  });
}

test('allows an absent social name without making optional information mandatory', () => {
  for (const nomeSocial of ['', '   ', undefined]) {
    const { data, errors } = validatePatient(patient({ nomeSocial }));
    assert.deepEqual(errors, {});
    assert.equal(data.nome_social, null);
  }
});

test('rejects non-string text values, including optional social names', () => {
  for (const field of ['nome', 'nomeSocial', 'tempoLesao', 'localizacaoQuadrante']) {
    for (const value of [123, true, ['Valid text'], { text: 'Valid text' }]) {
      assert.ok(validatePatient(patient({ [field]: value })).errors[field], field);
    }
  }
  for (const input of [null, [], false, 'patient']) {
    assert.ok(validatePatient(input).errors.nome);
  }
});

test('rejects incomplete, overlong and zero-prefixed phone numbers', () => {
  for (const whatsapp of ['1', '859999999', '8599999123456', '05999991234', '']) {
    assert.ok(validatePatient(patient({ whatsapp })).errors.whatsapp, whatsapp);
  }
});

test('accepts integer age boundaries and rejects invalid values and JSON types', () => {
  for (const idade of [1, '1', 120, '120']) {
    assert.equal(validatePatient(patient({ idade })).errors.idade, undefined);
  }
  for (const idade of [0, 121, -1, 1.5, '', 'not-a-number', '1e2', '0x12', '18.0', Infinity, NaN, true, [18], {}]) {
    assert.ok(validatePatient(patient({ idade })).errors.idade, `invalid age: ${JSON.stringify(idade)}`);
  }
});

test('rejects values outside the displayed enums and invalid comorbidity structures', () => {
  for (const [field, value] of [['sexo', 'invalid'], ['tipoDiabetes', 'Tipo 3'], ['grauLesao', 'Grau 9']]) {
    assert.ok(validatePatient(patient({ [field]: value })).errors[field]);
  }
  for (const comorbidades of ['Hipertensão', {}, ['unknown'], ['Hipertensão', 'Sobrepeso', 'Nefropatia', 'Dislipidemia', 'Hipertensão']]) {
    assert.ok(validatePatient(patient({ comorbidades })).errors.comorbidades);
  }
  const { data, errors } = validatePatient(patient({ comorbidades: ['Hipertensão', 'Hipertensão', 'Sobrepeso'] }));
  assert.deepEqual(errors, {});
  assert.deepEqual(data.comorbidades, ['Hipertensão', 'Sobrepeso']);
});

test('requires explicit boolean consent and never accepts truthy substitutes', () => {
  for (const termoConsentimento of [false, 'true', 'false', 1, 0, null, undefined, {}, []]) {
    assert.ok(validatePatient(patient({ termoConsentimento })).errors.termoConsentimento);
  }
  assert.equal(validatePatient(patient()).data.termo_consentimento, true);
});

test('validates updates in snake case without rewriting consent or omitted comorbidities', () => {
  const update = {
    nome: 'Pessoa de Teste', nome_social: '', whatsapp: '85999991234', sexo: 'F', idade: 62,
    tipo_diabetes: 'Tipo 2', grau_lesao: 'Grau 1', tempo_lesao: '4 semanas', localizacao_quadrante: 'Pé esquerdo',
    termo_consentimento: false, consent_version: 'untrusted',
  };
  const options = { requireConsent: false, fieldStyle: 'snake' };
  const { data, errors } = validatePatient(update, options);
  assert.deepEqual(errors, {});
  assert.equal(Object.hasOwn(data, 'termo_consentimento'), false);
  assert.equal(Object.hasOwn(data, 'comorbidades'), false);
  assert.equal(Object.hasOwn(data, 'consent_version'), false);
  const invalid = validatePatient({ ...update, grau_lesao: 'invalid', tempo_lesao: '' }, options);
  assert.ok(invalid.errors.grau_lesao);
  assert.ok(invalid.errors.tempo_lesao);
  assert.equal(Object.hasOwn(invalid.errors, 'grauLesao'), false);
});

test('photo validation accepts only optional JPEG, PNG and WebP files within the byte limit', () => {
  assert.equal(validatePhoto(null), '');
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
    assert.equal(validatePhoto({ type, size: MAX_PHOTO_BYTES }), '');
    assert.ok(validatePhoto({ type, size: MAX_PHOTO_BYTES + 1 }));
    for (const size of [0, -1, NaN, Infinity]) assert.ok(validatePhoto({ type, size }));
  }
  for (const type of ['image/svg+xml', 'image/gif', 'application/pdf', '', 'IMAGE/JPEG']) {
    assert.ok(validatePhoto({ type, size: 100, name: 'photo.jpg' }));
  }
});
