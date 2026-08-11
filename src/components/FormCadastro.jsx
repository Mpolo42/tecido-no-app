import React from 'react';
import { UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';

export default function FormCadastro({
  formData = {},
  handleChange,
  handleComorbidadeChange,
  handleSubmit,
  setFoto,
  loading = false,
  mensagem = { tipo: '', texto: '' }
}) {
  const comorbidadesList = Array.isArray(formData?.comorbidades) ? formData.comorbidades : [];

  return (
    <section id="cadastro" className="py-4 bg-slate-50 min-h-[calc(100vh-5rem)] flex items-center justify-center">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xl">

          {/* CABEÇALHO COMPACTO */}
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Cadastro de Paciente</h2>
                <p className="text-xs text-slate-500">Insira as informações clínicas e da lesão em um único painel</p>
              </div>
            </div>

            {/* MENSAGEM DE ALERTA/SUCESSO INLINE */}
            {mensagem?.texto && (
              <div className={`px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold ${mensagem.tipo === 'sucesso' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}>
                {mensagem.tipo === 'sucesso' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{mensagem.texto}</span>
              </div>
            )}
          </div>

          {/* FORMULÁRIO EM LAYOUT HORIZONTAL (3 COLUNAS) */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

            {/* COLUNA 1: DADOS PESSOAIS */}
            {/* COLUNA 1: DADOS DO PACIENTE */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
              <h3 className="text-xs font-black uppercase text-indigo-600 tracking-wider">1. Dados do Paciente</h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  name="nome"
                  required
                  value={formData?.nome || ''}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-indigo-600 focus:outline-none bg-white"
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp / Telefone *</label>
                <input
                  type="tel"
                  name="whatsapp"
                  required
                  value={formData?.whatsapp || ''}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-indigo-600 focus:outline-none bg-white"
                  placeholder="(85) 99999-9999"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sexo *</label>
                  <select
                    name="sexo"
                    required
                    value={formData?.sexo || ''}
                    onChange={handleChange}
                    className="w-full px-2 py-2 text-xs rounded-xl border border-slate-300 focus:border-indigo-600 focus:outline-none bg-white"
                  >
                    <option value="">Selecione</option>
                    <option value="M">Masc</option>
                    <option value="F">Fem</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Idade *</label>
                  <input
                    type="number"
                    name="idade"
                    min="1"
                    required
                    value={formData?.idade || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-indigo-600 focus:outline-none bg-white"
                    placeholder="Ex: 62"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Diabetes *</label>
                  <select
                    name="tipoDiabetes"
                    required
                    value={formData?.tipoDiabetes || ''}
                    onChange={handleChange}
                    className="w-full px-2 py-2 text-xs rounded-xl border border-slate-300 focus:border-indigo-600 focus:outline-none bg-white"
                  >
                    <option value="">Selecione</option>
                    <option value="Tipo 1">Tipo 1</option>
                    <option value="Tipo 2">Tipo 2</option>
                  </select>
                </div>
              </div>
            </div>

            {/* COLUNA 2: CLINICO & LESÃO */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
              <h3 className="text-xs font-black uppercase text-indigo-600 tracking-wider">2. Avaliação da Lesão</h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Grau da Ferida (Wagner) *</label>
                <select
                  name="grauLesao"
                  required
                  value={formData?.grauLesao || ''}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-indigo-600 focus:outline-none bg-white"
                >
                  <option value="">Selecione o grau...</option>
                  <option value="Grau 1">Grau 1 - Superficial</option>
                  <option value="Grau 2">Grau 2 - Profunda</option>
                  <option value="Grau 3">Grau 3 - Abscesso / Osteomielite</option>
                  <option value="Grau 4">Grau 4 - Gangrena Parcial</option>
                  <option value="Grau 5">Grau 5 - Gangrena Total</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tempo da Lesão *</label>
                <input
                  type="text"
                  name="tempoLesao"
                  placeholder="Ex: 4 semanas, 2 meses"
                  required
                  value={formData?.tempoLesao || ''}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-indigo-600 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Localização no pé *</label>
                <input
                  type="text"
                  name="localizacaoQuadrante"
                  placeholder="Ex: Sola do pé esquerdo (Quadrante 7)"
                  required
                  value={formData?.localizacaoQuadrante || ''}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-indigo-600 focus:outline-none bg-white"
                />
              </div>
            </div>

            {/* COLUNA 3: COMORBIDADES, FOTO E FINALIZAÇÃO */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
              <h3 className="text-xs font-black uppercase text-indigo-600 tracking-wider">3. Comorbidades & Anexo</h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Comorbidades Associadas</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Hipertensão', 'Sobrepeso', 'Nefropatia', 'Dislipidemia'].map((item) => (
                    <label key={item} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-indigo-400 transition text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        value={item}
                        checked={comorbidadesList.includes(item)}
                        onChange={handleComorbidadeChange}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Foto da Ferida (opcional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFoto && setFoto(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-100 file:text-indigo-900 hover:file:bg-indigo-200 cursor-pointer"
                />
              </div>

              <div className="pt-1">
                <div className="flex items-start gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="termo"
                    name="termoConsentimento"
                    required
                    checked={formData?.termoConsentimento || false}
                    onChange={handleChange}
                    className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 flex-shrink-0 cursor-pointer"
                  />
                  <label htmlFor="termo" className="text-[11px] font-medium text-slate-600 leading-tight cursor-pointer">
                    Aceito os termos de consentimento para acompanhamento no Tecido-NO.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold text-sm py-3 rounded-xl shadow-md transition flex justify-center items-center gap-2 cursor-pointer"
                >
                  {loading ? 'Cadastrando...' : 'Finalizar Cadastro'}
                </button>
              </div>

            </div>

          </form>
        </div>
      </div>
    </section>
  );
}