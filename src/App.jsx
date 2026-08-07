import React, { useState } from 'react';
import { supabase } from './supabaseClient';

// Componentes Globais de Layout
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Componente Módulo de Rotas
import AppRoutes from './routes/AppRoutes';

export default function App() {
  const [formData, setFormData] = useState({
    nome: '',
    nomeSocial: '',
    sexo: '',
    idade: '',
    tipoDiabetes: '',
    comorbidades: [],
    grauLesao: '',
    tempoLesao: '',
    localizacaoQuadrante: '',
    termoConsentimento: false
  });

  const [foto, setFoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox' && name === 'termoConsentimento') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleComorbidadeChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      if (checked) {
        return { ...prev, comorbidades: [...prev.comorbidades, value] };
      } else {
        return { ...prev, comorbidades: prev.comorbidades.filter(c => c !== value) };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      let fotoUrl = null;

      if (foto) {
        const fileExt = foto.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('fotos-lesoes')
          .upload(fileName, foto);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('fotos-lesoes')
          .getPublicUrl(fileName);

        fotoUrl = publicUrlData.publicUrl;
      }

      const { error: dbError } = await supabase.from('pacientes').insert([
        {
          nome: formData.nome,
          nome_social: formData.nomeSocial || null,
          sexo: formData.sexo,
          idade: parseInt(formData.idade),
          tipo_diabetes: formData.tipoDiabetes,
          comorbidades: formData.comorbidades,
          grau_lesao: formData.grauLesao,
          tempo_lesao: formData.tempoLesao,
          localizacao_quadrante: formData.localizacaoQuadrante,
          foto_url: fotoUrl,
          termo_consentimento: formData.termoConsentimento
        }
      ]);

      if (dbError) throw dbError;

      setMensagem({ tipo: 'sucesso', texto: 'Cadastro do paciente realizado com sucesso!' });

      setFormData({
        nome: '',
        nomeSocial: '',
        sexo: '',
        idade: '',
        tipoDiabetes: '',
        comorbidades: [],
        grauLesao: '',
        tempoLesao: '',
        localizacaoQuadrante: '',
        termoConsentimento: false
      });
      setFoto(null);

    } catch (error) {
      setMensagem({ tipo: 'erro', texto: 'Erro ao cadastrar: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 w-full min-h-screen">
      <div
        style={{ zoom: '80%' }}
        className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased w-full"
      >
        <Navbar />

        {/* Módulo das Rotas Componetizado */}
        <AppRoutes 
          formData={formData}
          handleChange={handleChange}
          handleComorbidadeChange={handleComorbidadeChange}
          handleSubmit={handleSubmit}
          setFoto={setFoto}
          loading={loading}
          mensagem={mensagem}
        />

        <Footer />
      </div>
    </div>
  );
}