import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { supabase } from '../supabaseClient';

function authMessage(error) {
  if (error?.status === 429 || /rate_limit|too_many/i.test(error?.code || '')) return 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.';
  if (error?.code === 'invalid_credentials') return 'E-mail ou senha incorretos.';
  if (error?.code === 'email_not_confirmed') return 'Confirme seu e-mail antes de entrar.';
  return 'Não foi possível acessar o serviço. Verifique a conexão e tente novamente.';
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recovering, setRecovering] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (recovering) {
        const { error: requestError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/redefinir-senha` });
        if (requestError) throw requestError;
        setNotice('Se houver uma conta para esse e-mail, você receberá um link de recuperação. Confira também o spam.');
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (loginError) throw loginError;
        setPassword('');
        navigate('/admin', { replace: true });
      }
    } catch (requestError) {
      setError(authMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-[75vh] flex items-center justify-center bg-slate-50 px-4 py-12">
      <section aria-labelledby="login-title" className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-xl">
        <Lock aria-hidden="true" className="w-10 h-10 mx-auto mb-4 text-indigo-600" />
        <h1 id="login-title" className="text-2xl font-extrabold text-center text-slate-900">{recovering ? 'Recuperar acesso' : 'Acesso da equipe'}</h1>
        <p className="text-slate-600 mt-2 mb-6">{recovering ? 'Informe o e-mail da sua conta para receber as instruções.' : 'Entre com sua conta autorizada. A confirmação em duas etapas será solicitada a seguir.'}</p>
        {error && <p role="alert" className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-800">{error}</p>}
        {(notice || location.state?.notice) && <p role="status" className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-800">{notice || location.state.notice}</p>}
        <form onSubmit={handleSubmit} aria-busy={busy} className="space-y-5">
          <div><label htmlFor="login-email" className="block font-semibold mb-2">E-mail</label><input id="login-email" type="email" autoComplete="username" inputMode="email" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} className="w-full border-2 border-slate-300 rounded-xl px-4 py-3 focus:outline-indigo-600" /></div>
          {!recovering && <div><label htmlFor="login-password" className="block font-semibold mb-2">Senha</label><input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} className="w-full border-2 border-slate-300 rounded-xl px-4 py-3 focus:outline-indigo-600" /></div>}
          <button disabled={busy} type="submit" className="w-full rounded-xl bg-indigo-600 text-white font-bold px-4 py-3 hover:bg-indigo-700 disabled:opacity-60">{busy ? 'Aguarde…' : recovering ? 'Enviar link de recuperação' : 'Entrar'}</button>
        </form>
        <button type="button" disabled={busy} onClick={() => { setRecovering(!recovering); setPassword(''); setError(''); setNotice(''); }} className="mt-5 min-h-11 text-indigo-700 font-semibold underline">{recovering ? 'Voltar para o login' : 'Esqueci minha senha'}</button>
        <p className="mt-4"><Link to="/" className="text-slate-600 underline">Voltar ao início</Link></p>
      </section>
    </main>
  );
}
