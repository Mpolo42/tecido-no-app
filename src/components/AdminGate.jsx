import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import MfaChallenge from './MfaChallenge';

export default function AdminGate({ session, children }) {
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [exitError, setExitError] = useState('');
  const token = session?.access_token;

  useEffect(() => {
    if (!token) return;
    let active = true;
    async function checkAccess() {
      try {
        const { data: allowed, error } = await supabase.rpc('admin_access');
        if (error) throw error;
        if (allowed !== true) {
          if (active) setResult({ token, phase: 'denied' });
          return;
        }
        const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (assuranceError) throw assuranceError;
        if (active) setResult({ token, phase: assurance?.currentLevel === 'aal2' ? 'ready' : 'mfa' });
      } catch {
        if (active) setResult({ token, phase: 'error' });
      }
    }
    checkAccess();
    return () => { active = false; };
  }, [token, attempt]);

  const signOut = async () => {
    setExitError('');
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
    } catch {
      setExitError('Não foi possível sair. Verifique sua conexão e tente novamente.');
    }
  };

  if (!session) return <Navigate to="/login" replace />;
  if (!result || result.token !== token) return <p role="status" className="text-center p-12">Verificando acesso…</p>;
  if (result.phase === 'ready') return children;
  if (result.phase === 'mfa') return <><MfaChallenge onVerified={() => { setResult(null); setAttempt((value) => value + 1); }} onSignOut={signOut} />{exitError && <p role="alert" className="text-center text-rose-700">{exitError}</p>}</>;
  return (
    <main className="max-w-lg mx-auto p-8 my-10 bg-white rounded-2xl border border-slate-200">
      <h1 className="text-2xl font-bold">{result.phase === 'denied' ? 'Acesso não autorizado' : 'Não foi possível verificar o acesso'}</h1>
      <p className="my-4">{result.phase === 'denied' ? 'Sua conta não está autorizada a consultar pacientes. Solicite acesso ao responsável pela aplicação.' : 'Os dados permanecem protegidos. Verifique sua conexão e tente novamente.'}</p>
      {exitError && <p role="alert" className="text-rose-700">{exitError}</p>}
      {result.phase === 'error' && <button onClick={() => { setResult(null); setAttempt((value) => value + 1); }} className="rounded-xl px-4 py-3 bg-indigo-600 text-white mr-3">Tentar novamente</button>}
      <button onClick={signOut} className="rounded-xl px-4 py-3 border border-slate-300">Sair da conta</button>
    </main>
  );
}
