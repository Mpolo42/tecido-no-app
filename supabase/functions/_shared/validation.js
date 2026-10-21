export const CONSENT_VERSION = '2026-10-19';
export const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
export const SEX_OPTIONS = ['M', 'F', 'Outro'];
export const DIABETES_OPTIONS = ['Tipo 1', 'Tipo 2'];
export const LESION_OPTIONS = ['Grau 1', 'Grau 2', 'Grau 3', 'Grau 4', 'Grau 5'];
export const COMORBIDITY_OPTIONS = ['Hipertensão', 'Sobrepeso', 'Nefropatia', 'Dislipidemia'];
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function normalizePhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length > 11 && digits.startsWith('55') ? digits.slice(2) : digits;
}

export function formatPhone(value) {
  const digits = normalizePhone(value).slice(0, 11);
  if (digits.length < 3) return digits;
  const tail = digits.slice(2);
  const split = tail.length > 8 ? 5 : 4;
  return '(' + digits.slice(0, 2) + ') ' + tail.slice(0, split) +
    (tail.length > split ? '-' + tail.slice(split) : '');
}

export function validatePhoto(file) {
  if (!file) return '';
  if (!PHOTO_TYPES.includes(file.type)) return 'Use uma imagem JPG, PNG ou WebP.';
  if (!Number.isFinite(file.size) || file.size <= 0) return 'O arquivo está vazio ou é inválido.';
  if (file.size > MAX_PHOTO_BYTES) return 'A foto deve ter no máximo 3 MB.';
  return '';
}

const aliases = {
  nome_social: 'nomeSocial', tipo_diabetes: 'tipoDiabetes', grau_lesao: 'grauLesao',
  tempo_lesao: 'tempoLesao', localizacao_quadrante: 'localizacaoQuadrante',
  termo_consentimento: 'termoConsentimento',
};

export function validatePatient(input = {}, { requireConsent = true, fieldStyle = 'camel' } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) input = {};
  const errors = {};
  const read = (name) => input[name] ?? input[aliases[name]];
  const error = (name, message) => { errors[fieldStyle === 'snake' ? name : (aliases[name] || name)] = message; };
  const text = (name, min, max, optional = false) => {
    const raw = read(name);
    const value = typeof raw === 'string' ? raw.trim().replace(/\s+/g, ' ') : '';
    // Reject control characters supplied by API clients as well as the browser.
    // eslint-disable-next-line no-control-regex
    if ((raw != null && typeof raw !== 'string') || ((!optional || value) && (value.length < min || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)))) {
      error(name, 'Informe entre ' + min + ' e ' + max + ' caracteres.');
    }
    return value || null;
  };
  const data = {
    nome: text('nome', 2, 150),
    nome_social: text('nome_social', 2, 150, true),
    whatsapp: normalizePhone(read('whatsapp')),
    sexo: read('sexo'),
    idade: Number(read('idade')),
    tipo_diabetes: read('tipo_diabetes'),
    grau_lesao: read('grau_lesao'),
    tempo_lesao: text('tempo_lesao', 2, 100),
    localizacao_quadrante: text('localizacao_quadrante', 2, 150),
  };
  if (!/^[1-9][0-9]{9,10}$/.test(data.whatsapp)) error('whatsapp', 'Informe DDD e telefone com 10 ou 11 dígitos.');
  if (!SEX_OPTIONS.includes(data.sexo)) error('sexo', 'Selecione uma opção.');
  const rawAge = read('idade');
  if (!['string', 'number'].includes(typeof rawAge) || !/^[0-9]{1,3}$/.test(String(rawAge).trim()) || !Number.isInteger(data.idade) || data.idade < 1 || data.idade > 120) error('idade', 'Informe uma idade inteira entre 1 e 120 anos.');
  if (!DIABETES_OPTIONS.includes(data.tipo_diabetes)) error('tipo_diabetes', 'Selecione o tipo de diabetes.');
  if (!LESION_OPTIONS.includes(data.grau_lesao)) error('grau_lesao', 'Selecione um grau da lista.');
  if ('comorbidades' in input || requireConsent) {
    const values = input.comorbidades ?? [];
    if (!Array.isArray(values) || values.length > COMORBIDITY_OPTIONS.length || values.some((x) => !COMORBIDITY_OPTIONS.includes(x))) {
      error('comorbidades', 'Selecione as opções apresentadas.');
    } else data.comorbidades = [...new Set(values)];
  }
  if (requireConsent) {
    data.termo_consentimento = read('termo_consentimento') === true;
    if (!data.termo_consentimento) error('termo_consentimento', 'Leia e aceite o consentimento para continuar.');
  }
  return { data, value: data, errors };
}
