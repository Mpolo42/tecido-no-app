import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import MfaChallenge from '../components/MfaChallenge';

export default function ResetPassword() {
  const [phase, setPhase] = useState('loading');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    async function checkSession() {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !data.session) { if (active) setPhase('invalid'); return; }
        const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (assuranceError) throw assuranceError;
        if (active) setPhase(assurance.nextLevel === 'aal2' && assurance.currentLevel !== 'aal2' ? 'mfa' : 'ready');
      } catch { if (active) setPhase('invalid'); }
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // Keep async auth calls outside the synchronous auth-state callback.
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'MFA_CHALLENGE_VERIFIED') setAttempt((value) => value + 1);
      if (event === 'SIGNED_OUT') setPhase('invalid');
    });
    checkSession();
    return () => { active = false; subscription.unsubscribe(); };
  }, [attempt]);

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setError('');
    if (password.length < 12 || password.length > 128) { setError('Use uma senha com 12 a 128 caracteres, incluindo maiúscula, minúscula, número e símbolo.'); return; }
    if (password !== confirmation) { setError('As senhas não coincidem. Confira os dois campos.'); return; }
    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setPassword(''); setConfirmation('');
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
      if (signOutError) { setPhase('done'); return; }
      navigate('/login', { replace: true, state: { notice: 'Senha atualizada. Entre novamente com a nova senha.' } });
    } catch (updateError) {
      setError(updateError?.code === 'same_password' ? 'Escolha uma senha diferente da senha atual.' : updateError?.code === 'weak_password' ? 'Use pelo menos 12 caracteres, com maiúscula, minúscula, número e símbolo, em uma senha exclusiva.' : 'Não foi possível atualizar a senha. O link pode ter expirado; solicite outro ou tente novamente.');
    } finally { setBusy(false); }
  };

  if (phase === 'mfa') return <MfaChallenge onVerified={() => { setPhase('loading'); setAttempt((value) => value + 1); }} />;
  return <main className="max-w-lg mx-auto my-12 p-6 sm:p-8 bg-white rounded-3xl border border-slate-200">
    <h1 className="text-2xl font-bold mb-5">Redefinir senha</h1>
    {phase === 'loading' ? <p role="status">Verificando link de recuperação…</p> : phase === 'invalid' ? <><p role="alert">Este link não está disponível ou expirou. Solicite um novo link de recuperação na página de acesso.</p><Link to="/login" className="block mt-5 underline text-indigo-700">Ir para a página de acesso</Link></> : phase === 'done' ? <p role="status">Sua senha foi atualizada. Para sua segurança, saia da conta e entre novamente com a nova senha.</p> : <>
      <p className="mb-5 text-slate-600">Escolha uma senha exclusiva com 12 a 128 caracteres, incluindo maiúscula, minúscula, número e símbolo.</p>
      {error && <p role="alert" className="mb-4 p-3 bg-rose-50 text-rose-800 rounded-xl">{error}</p>}
      <form onSubmit={submit} aria-busy={busy} className="space-y-5">
        <div><label htmlFor="new-password" className="block font-semibold mb-2">Nova senha</label><input id="new-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={password} disabled={busy} onChange={(event) => setPassword(event.target.value)} className="w-full px-4 py-3 border-2 rounded-xl" /></div>
        <div><label htmlFor="confirm-password" className="block font-semibold mb-2">Confirme a nova senha</label><input id="confirm-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={confirmation} disabled={busy} onChange={(event) => setConfirmation(event.target.value)} className="w-full px-4 py-3 border-2 rounded-xl" /></div>
        <button type="submit" disabled={busy} className="w-full bg-indigo-600 text-white font-bold rounded-xl px-4 py-3 disabled:opacity-60">{busy ? 'Salvando…' : 'Salvar nova senha'}</button>
      </form>
    </>}
  </main>;
}
