import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AppRoutes from './routes/AppRoutes';
import { formatPhone, validatePatient, validatePhoto } from './lib/validation';
import { submitPatient } from './lib/intake';

const emptyForm = () => ({
  nome: '', nomeSocial: '', whatsapp: '', sexo: '', idade: '', tipoDiabetes: '',
  comorbidades: [], grauLesao: '', tempoLesao: '', localizacaoQuadrante: '',
  termoConsentimento: false, website: '',
});

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [formData, setFormData] = useState(emptyForm);
  const [foto, setFoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
  const location = useLocation();

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (active) { setSession(error ? null : data.session); setAuthLoading(false); }
    }).catch(() => { if (active) setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (location.hash) {
      let id;
      try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
      document.getElementById(id)?.scrollIntoView();
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.getElementById('conteudo')?.focus({ preventScroll: true });
    }
  }, [location.pathname, location.hash]);

  const handleChange = ({ target: { name, value, type, checked } }) => {
    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : name === 'whatsapp' ? formatPhone(value) : value,
    }));
  };
  const handleComorbidadeChange = ({ target: { value, checked } }) => {
    setFormData((previous) => ({
      ...previous,
      comorbidades: checked ? [...new Set([...previous.comorbidades, value])] : previous.comorbidades.filter((item) => item !== value),
    }));
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    const { data, errors } = validatePatient(formData);
    const photoError = validatePhoto(foto);
    if (Object.keys(errors).length || photoError) {
      setMensagem({ tipo: 'erro', texto: photoError || 'Revise os campos destacados antes de enviar.' });
      return;
    }
    setLoading(true);
    try {
      await submitPatient(data, foto, formData.website, (texto) => setMensagem({ tipo: 'info', texto }));
      setFormData(emptyForm());
      setFoto(null);
      setMensagem({ tipo: 'sucesso', texto: 'Cadastro recebido com segurança. A equipe responsável dará continuidade ao acompanhamento.' });
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: error.message || 'Não foi possível concluir o cadastro. Tente novamente.' });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      <Navbar session={session} />
      <main id="conteudo" tabIndex={-1} className="focus:outline-none">
        {!isSupabaseConfigured ? <div className="max-w-lg mx-auto p-8 my-10 bg-white rounded-2xl"><h1 className="text-2xl font-bold">Serviço temporariamente indisponível</h1><p className="mt-4">Tente novamente mais tarde.</p></div> :
          <AppRoutes session={session} authLoading={authLoading} formData={formData} foto={foto}
            handleChange={handleChange} handleComorbidadeChange={handleComorbidadeChange}
            handleSubmit={handleSubmit} setFoto={setFoto} loading={loading} mensagem={mensagem} />}
      </main>
      <Footer />
    </div>
  );
}
