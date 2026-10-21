import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import {
  COMORBIDITY_OPTIONS,
  CONSENT_VERSION,
  DIABETES_OPTIONS,
  LESION_OPTIONS,
  SEX_OPTIONS,
  formatPhone,
  validatePatient,
  validatePhoto,
} from '../lib/validation';

const controlClass = 'w-full px-3.5 py-3 text-base rounded-xl border border-slate-300 focus:border-indigo-600 bg-white disabled:bg-slate-100';

function Field({ name, label, error, help, children }) {
  return (
    <div>
      <label htmlFor={`cadastro-${name}`} className="block text-sm font-bold text-slate-800 mb-1.5">{label}</label>
      {children}
      {help && <p id={`cadastro-${name}-help`} className="mt-1.5 text-sm leading-relaxed text-slate-600">{help}</p>}
      {error && <p id={`cadastro-${name}-error`} className="mt-1.5 text-sm font-semibold text-rose-700">{error}</p>}
    </div>
  );
}

function PhotoPreview({ file }) {
  const image = useRef(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    image.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <img ref={image} alt="Prévia da foto que será anexada ao cadastro" className="w-full max-h-56 object-contain rounded-xl bg-slate-100" />;
}

export default function FormCadastro({
  formData = {},
  handleChange,
  handleComorbidadeChange,
  handleSubmit,
  foto = null,
  setFoto,
  loading = false,
  mensagem = { tipo: '', texto: '' },
}) {
  const [errors, setErrors] = useState({});
  const [photoError, setPhotoError] = useState('');
  const fileInput = useRef(null);
  const comorbidades = Array.isArray(formData.comorbidades) ? formData.comorbidades : [];

  useEffect(() => {
    if (!foto && fileInput.current) fileInput.current.value = '';
  }, [foto]);

  const fieldProps = (name, help = false) => ({
    id: `cadastro-${name}`,
    name,
    value: formData[name] || '',
    onChange: (event) => {
      handleChange(event);
      setErrors((previous) => ({ ...previous, [name]: '' }));
    },
    onBlur: () => {
      const result = validatePatient(formData);
      setErrors((previous) => ({ ...previous, [name]: result.errors[name] || '' }));
    },
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': [help ? `cadastro-${name}-help` : '', errors[name] ? `cadastro-${name}-error` : ''].filter(Boolean).join(' ') || undefined,
    className: controlClass,
  });

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    const error = validatePhoto(file);
    setPhotoError(error);
    if (error) {
      setFoto(null);
      event.target.value = '';
    } else {
      setFoto(file);
    }
  };

  const removePhoto = () => {
    setFoto(null);
    setPhotoError('');
    if (fileInput.current) fileInput.current.value = '';
  };

  const submit = (event) => {
    event.preventDefault();
    if (loading) return;
    const result = validatePatient(formData);
    const fileError = photoError || validatePhoto(foto);
    setErrors(result.errors);
    setPhotoError(fileError);
    const firstError = Object.keys(result.errors)[0];
    if (firstError) {
      document.getElementById(`cadastro-${firstError}`)?.focus();
      return;
    }
    if (fileError) {
      fileInput.current?.focus();
      return;
    }
    handleSubmit(event);
  };

  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <section id="cadastro" aria-labelledby="titulo-cadastro" className="py-4 bg-slate-50">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-8 shadow-xl">
          <div className="mb-6 border-b border-slate-100 pb-5 flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-100 flex shrink-0 items-center justify-center text-indigo-600">
              <UserPlus aria-hidden="true" className="w-6 h-6" />
            </div>
            <div>
              <h1 id="titulo-cadastro" className="text-2xl sm:text-3xl font-extrabold text-slate-900">Cadastro de paciente</h1>
              <p className="mt-2 text-base leading-relaxed text-slate-600">Preencha os dados para acompanhamento pela equipe. Os campos com * são obrigatórios. A foto é opcional.</p>
            </div>
          </div>

          <div aria-live="polite" aria-atomic="true">
            {mensagem?.texto && (
              <div role={mensagem.tipo === 'erro' ? 'alert' : 'status'} className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-base font-medium border ${mensagem.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : mensagem.tipo === 'erro' ? 'bg-rose-50 text-rose-900 border-rose-300' : 'bg-indigo-50 text-indigo-900 border-indigo-300'}`}>
                {mensagem.tipo === 'sucesso' ? <CheckCircle2 aria-hidden="true" className="w-5 h-5 shrink-0 mt-0.5" /> : mensagem.tipo === 'erro' ? <AlertCircle aria-hidden="true" className="w-5 h-5 shrink-0 mt-0.5" /> : <Info aria-hidden="true" className="w-5 h-5 shrink-0 mt-0.5" />}
                <p>{mensagem.texto}</p>
              </div>
            )}
          </div>
          {hasErrors && <p role="alert" className="mb-6 text-base font-semibold text-rose-800">Revise os campos indicados abaixo antes de enviar o cadastro.</p>}

          <form onSubmit={submit} noValidate aria-busy={loading}>
            <div aria-hidden="true" className="absolute -left-[10000px] w-px h-px overflow-hidden">
              <label htmlFor="cadastro-website">Website</label>
              <input id="cadastro-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={formData.website || ''} onChange={handleChange} />
            </div>
            <fieldset disabled={loading} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start disabled:opacity-80">
              <legend className="sr-only">Informações para cadastro e acompanhamento</legend>
              <fieldset className="min-w-0 space-y-5 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200">
                <legend className="px-1 text-base font-extrabold text-indigo-700">Dados do paciente</legend>
                <Field name="nome" label="Nome completo *" error={errors.nome}>
                  <input {...fieldProps('nome')} type="text" autoComplete="name" required maxLength={150} />
                </Field>
                <Field name="nomeSocial" label="Nome social (opcional)" error={errors.nomeSocial}>
                  <input {...fieldProps('nomeSocial')} type="text" autoComplete="nickname" maxLength={150} />
                </Field>
                <Field name="whatsapp" label="WhatsApp / telefone *" error={errors.whatsapp} help="Informe o DDD e o número do Brasil. Ex.: (85) 99999-9999.">
                  <input {...fieldProps('whatsapp', true)} value={formatPhone(formData.whatsapp || '')} type="tel" autoComplete="tel-national" inputMode="tel" required placeholder="(85) 99999-9999" maxLength={20} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field name="sexo" label="Sexo *" error={errors.sexo}>
                    <select {...fieldProps('sexo')} required>
                      <option value="">Selecione</option>
                      {SEX_OPTIONS.map((option) => <option key={option} value={option}>{option === 'M' ? 'Masculino' : option === 'F' ? 'Feminino' : option}</option>)}
                    </select>
                  </Field>
                  <Field name="idade" label="Idade (anos) *" error={errors.idade}>
                    <input {...fieldProps('idade')} type="number" inputMode="numeric" min="1" max="120" step="1" required />
                  </Field>
                </div>
                <Field name="tipoDiabetes" label="Tipo de diabetes *" error={errors.tipoDiabetes}>
                  <select {...fieldProps('tipoDiabetes')} required>
                    <option value="">Selecione</option>
                    {DIABETES_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </Field>
              </fieldset>

              <fieldset className="min-w-0 space-y-5 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200">
                <legend className="px-1 text-base font-extrabold text-indigo-700">Informações da lesão</legend>
                <Field name="grauLesao" label="Grau da ferida (Wagner) *" error={errors.grauLesao} help="Informe a classificação indicada pela equipe que acompanha o paciente.">
                  <select {...fieldProps('grauLesao', true)} required>
                    <option value="">Selecione o grau</option>
                    {LESION_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </Field>
                <Field name="tempoLesao" label="Tempo da lesão *" error={errors.tempoLesao}>
                  <input {...fieldProps('tempoLesao')} type="text" maxLength={100} required placeholder="Ex.: 4 semanas, 2 meses" />
                </Field>
                <Field name="localizacaoQuadrante" label="Localização no pé *" error={errors.localizacaoQuadrante}>
                  <input {...fieldProps('localizacaoQuadrante')} type="text" maxLength={150} required placeholder="Ex.: sola do pé esquerdo" />
                </Field>
                <fieldset id="cadastro-comorbidades" tabIndex={-1} aria-describedby={errors.comorbidades ? 'cadastro-comorbidades-error' : undefined}>
                  <legend className="mb-2 text-sm font-bold text-slate-800">Comorbidades associadas (opcional)</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                    {COMORBIDITY_OPTIONS.map((item, index) => (
                      <label key={item} htmlFor={`cadastro-comorbidade-${index}`} className="flex items-center gap-3 min-h-11 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-indigo-400 text-sm font-medium text-slate-800">
                        <input id={`cadastro-comorbidade-${index}`} name="comorbidades" type="checkbox" value={item} checked={comorbidades.includes(item)} onChange={handleComorbidadeChange} className="w-5 h-5 rounded accent-indigo-600 shrink-0" />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                  {errors.comorbidades && <p id="cadastro-comorbidades-error" role="alert" className="mt-2 text-sm text-rose-700">{errors.comorbidades}</p>}
                </fieldset>
              </fieldset>

              <div className="min-w-0 space-y-5 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200">
                <h2 className="text-base font-extrabold text-indigo-700">Foto e consentimento</h2>
                <Field name="foto" label="Foto da ferida (opcional)" error={photoError} help="Aceitamos JPG, PNG ou WebP de até 3 MB. Evite incluir rosto, documentos ou outras pessoas na imagem.">
                  <input ref={fileInput} id="cadastro-foto" name="foto" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} aria-invalid={Boolean(photoError)} aria-describedby={`cadastro-foto-help${photoError ? ' cadastro-foto-error' : ''}`} className="w-full min-h-11 text-sm text-slate-700 file:mr-2 file:py-3 file:px-3 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-indigo-100 file:text-indigo-900 hover:file:bg-indigo-200 cursor-pointer" />
                </Field>
                {foto && (
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
                    <PhotoPreview file={foto} />
                    <p className="text-sm text-slate-700 break-all">{foto.name} · {(foto.size / (1024 * 1024)).toFixed(2)} MB</p>
                    <button type="button" onClick={removePhoto} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-rose-700 hover:text-rose-900 rounded-lg"><X aria-hidden="true" className="w-4 h-4" />Remover foto</button>
                  </div>
                )}
                {photoError && <button type="button" onClick={removePhoto} className="min-h-11 text-sm font-semibold text-indigo-700 underline rounded-lg">Continuar sem foto</button>}
                <div>
                  <div className="flex items-start gap-3">
                    <input id="cadastro-termoConsentimento" name="termoConsentimento" type="checkbox" required checked={Boolean(formData.termoConsentimento)} onChange={(event) => { handleChange(event); setErrors((previous) => ({ ...previous, termoConsentimento: '' })); }} aria-invalid={Boolean(errors.termoConsentimento)} aria-describedby={`cadastro-termo-help${errors.termoConsentimento ? ' cadastro-termoConsentimento-error' : ''}`} className="w-5 h-5 mt-1 rounded accent-indigo-600 shrink-0 cursor-pointer" />
                    <label htmlFor="cadastro-termoConsentimento" className="text-sm font-medium text-slate-800 leading-relaxed cursor-pointer">Autorizo o uso dos dados informados e da foto, se anexada, para acompanhamento pela equipe do Tecido-NO. *</label>
                  </div>
                  <p id="cadastro-termo-help" className="mt-3 text-sm leading-relaxed text-slate-600">Leia as <Link to="/privacidade" target="_blank" rel="noopener noreferrer" className="text-indigo-700 font-semibold underline underline-offset-2">informações de privacidade e consentimento (abre em nova aba)</Link>. Versão {CONSENT_VERSION}.</p>
                  {errors.termoConsentimento && <p id="cadastro-termoConsentimento-error" className="mt-2 text-sm font-semibold text-rose-700">{errors.termoConsentimento}</p>}
                </div>
                <button type="submit" disabled={loading} className="w-full min-h-12 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold text-base py-3 px-3 rounded-xl shadow-md transition">
                  {loading ? 'Enviando cadastro…' : 'Finalizar cadastro'}
                </button>
                <p className="text-sm leading-relaxed text-slate-600">A confirmação aparecerá nesta página após o envio. Em caso de erro, seus dados preenchidos serão mantidos para tentar novamente.</p>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
    </section>
  );
}
