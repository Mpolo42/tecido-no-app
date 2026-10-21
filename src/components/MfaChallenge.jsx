import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function MfaChallenge({ onVerified, onSignOut }) {
  const [factors, setFactors] = useState(null);
  const [factorId, setFactorId] = useState('');
  const [enrollment, setEnrollment] = useState(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const enrollmentLock = useRef(false);

  useEffect(() => {
    let active = true;
    async function loadFactors() {
      try {
        const { data, error: loadError } = await supabase.auth.mfa.listFactors();
        if (loadError) throw loadError;
        const verified = (data?.totp || []).filter((factor) => factor.status === 'verified');
        if (active) { setFactors(verified); setFactorId(verified[0]?.id || ''); setError(''); }
      } catch {
        if (active) setError('Não foi possível carregar a confirmação em duas etapas. Tente novamente.');
      }
    }
    loadFactors();
    return () => { active = false; };
  }, [retry]);

  const startEnrollment = async () => {
    if (enrollmentLock.current) return;
    enrollmentLock.current = true;
    setBusy(true); setError(''); setEnrollment(null); setCode('');
    try {
      // Remove only this user's unfinished TOTP enrollments on an explicit restart.
      const { data, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;
      const pending = (data?.all || []).filter((factor) => factor.factor_type === 'totp' && factor.status === 'unverified');
      for (const factor of pending) {
        const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
        if (removeError) throw removeError;
      }
      const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Tecido-NO' });
      if (enrollError) throw enrollError;
      setEnrollment(enrolled); setFactorId(enrolled.id);
    } catch {
      setError('Não foi possível configurar o autenticador. Verifique sua conexão e tente novamente.');
    } finally {
      enrollmentLock.current = false; setBusy(false);
    }
  };

  const verify = async (event) => {
    event.preventDefault();
    if (busy || !factorId || !/^\d{6}$/.test(code)) return;
    setBusy(true); setError('');
    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
      if (verifyError) throw verifyError;
      const { data, error: levelError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (levelError || data?.currentLevel !== 'aal2') throw levelError || new Error('assurance');
      const { error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      setCode(''); setEnrollment(null); onVerified();
    } catch (verifyError) {
      setCode('');
      setError(verifyError?.status === 429 ? 'Muitas tentativas. Aguarde alguns minutos.' : 'Não foi possível confirmar o código. Use o código atual do aplicativo e confira o horário do celular.');
    } finally { setBusy(false); }
  };

  return (
    <main className="max-w-lg mx-auto my-10 p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white">
      <h1 className="text-2xl font-bold">Confirmação em duas etapas</h1>
      <p className="mt-3 mb-6 text-slate-600">Para proteger os dados dos pacientes, confirme o acesso com um aplicativo autenticador.</p>
      {error && <p role="alert" className="p-3 mb-4 rounded-xl bg-rose-50 text-rose-800">{error}</p>}
      {factors === null ? <><p role="status">Carregando autenticadores…</p>{error && <button type="button" onClick={() => setRetry((value) => value + 1)} className="my-4 underline text-indigo-700">Tentar novamente</button>}</> : <>
        {factors.length === 0 && !enrollment && <div><p className="mb-4">Abra um aplicativo como Google Authenticator, Microsoft Authenticator ou 1Password. Em seguida, configure sua conta abaixo. Guarde o acesso ao autenticador para os próximos logins.</p><button type="button" disabled={busy} onClick={startEnrollment} className="bg-indigo-600 text-white rounded-xl px-4 py-3 disabled:opacity-60">{busy ? 'Preparando…' : 'Configurar autenticador'}</button></div>}
        {enrollment && <div className="mb-5 space-y-3"><p>Adicione uma conta no autenticador e escaneie este QR code. Não compartilhe a chave.</p><img src={enrollment.totp.qr_code} alt="QR code para configurar seu autenticador Tecido-NO" className="w-52 h-52 mx-auto" /><details><summary className="cursor-pointer text-indigo-700 underline">Não consigo escanear o QR code</summary><p className="mt-2">Digite esta chave no autenticador:</p><code className="block break-all p-3 bg-slate-100 rounded-lg select-all">{enrollment.totp.secret}</code></details></div>}
        {(factors.length > 0 || enrollment) && <form onSubmit={verify} aria-busy={busy} className="space-y-4">
          {factors.length > 1 && <div><label htmlFor="mfa-factor" className="block font-semibold mb-2">Autenticador</label><select id="mfa-factor" value={factorId} disabled={busy} onChange={(event) => setFactorId(event.target.value)} className="border-2 rounded-xl px-3 py-3 w-full">{factors.map((factor, index) => <option key={factor.id} value={factor.id}>{factor.friendly_name || `Autenticador ${index + 1}`}</option>)}</select></div>}
          <div><label htmlFor="mfa-code" className="block font-semibold mb-2">Código de seis dígitos</label><input id="mfa-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} minLength={6} required value={code} disabled={busy} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} aria-describedby="mfa-help" className="w-full border-2 border-slate-300 rounded-xl px-4 py-3 text-xl tracking-widest" /><p id="mfa-help" className="mt-2 text-slate-600">Informe o código atual mostrado no aplicativo autenticador.</p></div>
          <button type="submit" disabled={busy || code.length !== 6} className="bg-indigo-600 text-white rounded-xl px-4 py-3 w-full disabled:opacity-60">{busy ? 'Confirmando…' : 'Confirmar acesso'}</button>
        </form>}
        {enrollment && <button type="button" disabled={busy} onClick={startEnrollment} className="mt-4 min-h-11 underline text-indigo-700">Gerar nova configuração</button>}
      </>}
      {onSignOut && <button type="button" disabled={busy} onClick={onSignOut} className="mt-6 min-h-11 underline text-slate-600">Sair da conta</button>}
    </main>
  );
}
