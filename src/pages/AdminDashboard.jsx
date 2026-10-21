import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, FileImage, LogOut, Search, Trash2, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { validatePatient, formatPhone, SEX_OPTIONS, DIABETES_OPTIONS, LESION_OPTIONS, COMORBIDITY_OPTIONS } from '../lib/validation';

const PAGE_SIZE = 20;
const COLUMNS = 'id,nome,nome_social,whatsapp,sexo,idade,tipo_diabetes,comorbidades,grau_lesao,tempo_lesao,localizacao_quadrante,foto_path,foto_url,created_at,consent_version,consent_accepted_at';
const inputClass = 'w-full px-3 py-3 rounded-xl border-2 border-slate-300 focus:outline-indigo-600 bg-white';

function NativeDialog({ title, children, onCancel, busy }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    dialog.showModal();
    return () => { dialog.close(); if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus(); };
  }, []);
  return <dialog ref={ref} aria-labelledby="admin-dialog-title" aria-busy={busy} onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }} className="w-[calc(100%-2rem)] max-w-2xl max-h-[90dvh] m-auto p-0 rounded-2xl border border-slate-300 shadow-2xl backdrop:bg-slate-900/60">
    <div className="p-5 sm:p-7">
      <div className="flex items-start justify-between gap-3 mb-5"><h2 id="admin-dialog-title" className="text-xl font-bold text-slate-900">{title}</h2><button type="button" autoFocus disabled={busy} aria-label="Fechar diálogo" onClick={onCancel} className="p-2 rounded-xl hover:bg-slate-100 disabled:opacity-50"><X aria-hidden="true" /></button></div>
      {children}
    </div>
  </dialog>;
}

function EditField({ name, label, value, onChange, error, options, ...props }) {
  const id = `edit-${name}`;
  return <div><label htmlFor={id} className="block font-semibold mb-2">{label}</label>{options ? <select id={id} name={name} value={value ?? ''} onChange={onChange} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={inputClass} {...props}><option value="">Selecione</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input id={id} name={name} value={value ?? ''} onChange={onChange} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={inputClass} {...props} />}{error && <p id={`${id}-error`} className="text-rose-700 mt-2 text-sm">{error}</p>}</div>;
}

function photoPath(patient) {
  let path = patient.foto_path;
  if (!path && patient.foto_url) {
    try {
      const expected = new URL(import.meta.env.VITE_SUPABASE_URL);
      const legacy = new URL(patient.foto_url);
      const prefix = '/storage/v1/object/public/fotos-lesoes/';
      if (legacy.origin !== expected.origin || legacy.protocol !== 'https:' || !legacy.pathname.startsWith(prefix)) return null;
      path = decodeURIComponent(legacy.pathname.slice(prefix.length));
    } catch { return null; }
  }
  if (typeof path !== 'string' || path.length > 500 || !/^[a-zA-Z0-9_./-]+$/.test(path) || path.split('/').some((part) => !part || part === '.' || part === '..')) return null;
  return path;
}

async function adminAction(action, payload = {}) {
  const { data, error } = await supabase.functions.invoke('patient-admin', { body: { action, ...payload } });
  if (error || data?.ok !== true) {
    const status = error?.context?.status || error?.status;
    throw new Error(status === 401 || status === 403 ? 'Sua autorização expirou. Saia e entre novamente antes de tentar.' : 'Não foi possível confirmar a operação. Atualize a lista antes de tentar novamente.');
  }
  return data;
}

export default function AdminDashboard({ session }) {
  const [request, setRequest] = useState({ page: 1, term: '', revision: 0 });
  const [view, setView] = useState(null);
  const [search, setSearch] = useState('');
  const [searchError, setSearchError] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [discard, setDiscard] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [cleanupBusy, setCleanupBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(null);
  const [photoLink, setPhotoLink] = useState(null);
  const editForm = useRef(null);
  const navigate = useNavigate();
  const key = `${request.page}:${request.term}:${request.revision}`;
  const loading = view?.key !== key;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function loadPatients() {
      try {
        let query = supabase.from('pacientes').select(COLUMNS, { count: 'exact' }).order('created_at', { ascending: false }).order('id', { ascending: false });
        if (request.term) {
          // Search terms are allowlisted before entering PostgREST's filter grammar.
          const filters = [`nome.ilike.%${request.term}%`, `grau_lesao.ilike.%${request.term}%`];
          if (/^[\d\s+-]+$/.test(request.term)) filters.push(`whatsapp.ilike.%${request.term.replace(/\D/g, '')}%`);
          query = query.or(filters.join(','));
        }
        const { data, count, error: loadError } = await query.range((request.page - 1) * PAGE_SIZE, request.page * PAGE_SIZE - 1).abortSignal(controller.signal);
        if (loadError) throw loadError;
        if (!active) return;
        const pages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));
        if (request.page > pages) { setRequest((previous) => ({ ...previous, page: pages })); return; }
        setView({ key, patients: data || [], count: count || 0 });
      } catch (loadError) {
        if (!active || controller.signal.aborted) return;
        setView({ key, patients: [], count: 0, error: loadError?.code === '42501' || loadError?.status === 401 ? 'Sua autorização expirou. Saia e entre novamente.' : 'Não foi possível carregar os pacientes. Verifique a conexão e tente novamente.' });
      }
    }
    loadPatients();
    return () => { active = false; controller.abort(); };
  }, [request.page, request.term, request.revision, key]);

  useEffect(() => {
    if (!photoLink) return;
    const timeout = window.setTimeout(() => setPhotoLink(null), 55_000);
    return () => window.clearTimeout(timeout);
  }, [photoLink]);

  const refresh = () => setRequest((previous) => ({ ...previous, revision: previous.revision + 1 }));
  const searchPatients = (event) => {
    event.preventDefault();
    const term = search.normalize('NFKC').trim().replace(/\s+/g, ' ');
    if (term.length > 80 || !/^[\p{L}\p{N}\s+-]*$/u.test(term) || (term && !/[\p{L}\p{N}]/u.test(term))) { setSearchError('Use até 80 letras ou números. Espaços, hífen e sinal de mais também são aceitos.'); return; }
    setSearchError(''); setSearch(term);
    setRequest((previous) => ({ page: 1, term, revision: previous.revision + 1 }));
  };

  const logout = async () => {
    setError(''); setBusy(true);
    try {
      const { error: logoutError } = await supabase.auth.signOut({ scope: 'local' });
      if (logoutError) throw logoutError;
      navigate('/login', { replace: true });
    } catch { setError('Não foi possível sair. Verifique a conexão e tente novamente.'); }
    finally { setBusy(false); }
  };

  const openEdit = (patient) => {
    setEditing(patient); setDraft({ nome: patient.nome || '', nome_social: patient.nome_social || '', whatsapp: patient.whatsapp || '', sexo: patient.sexo || '', idade: patient.idade ?? '', tipo_diabetes: patient.tipo_diabetes || '', comorbidades: patient.comorbidades || [], grau_lesao: patient.grau_lesao || '', tempo_lesao: patient.tempo_lesao || '', localizacao_quadrante: patient.localizacao_quadrante || '' });
    setFieldErrors({}); setError(''); setNotice(''); setDiscard(false);
  };
  const closeEdit = () => { if (!busy) { setEditing(null); setDiscard(false); setError(''); } };
  const requestCloseEdit = () => {
    if (busy) return;
    const changed = Object.keys(draft).some((field) => JSON.stringify(draft[field] ?? '') !== JSON.stringify(editing[field] ?? (field === 'comorbidades' ? [] : '')));
    if (changed) setDiscard(true); else closeEdit();
  };
  const changeField = (event) => setDraft((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  const saveEdit = async (event) => {
    event.preventDefault();
    if (busy) return;
    const { data, errors } = validatePatient(draft, { requireConsent: false, fieldStyle: 'snake' });
    setFieldErrors(errors); setError('');
    if (Object.keys(errors).length) { window.requestAnimationFrame(() => editForm.current?.querySelector('[aria-invalid="true"]')?.focus()); return; }
    setBusy(true);
    try {
      await adminAction('update', { id: editing.id, patient: data });
      setEditing(null); setNotice('Cadastro atualizado com sucesso.'); refresh();
    } catch (saveError) { setError(saveError.message); }
    finally { setBusy(false); }
  };

  const deletePatient = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const result = await adminAction('delete', { id: deleting.id });
      setDeleting(null);
      setNotice(result.warning ? 'Cadastro excluído. A remoção de um arquivo ficou pendente; use “Concluir limpeza de arquivos” para tentar novamente.' : 'Cadastro e arquivo associado excluídos com sucesso.');
      refresh();
    } catch (deleteError) { setError(deleteError.message); }
    finally { setBusy(false); }
  };

  const cleanup = async () => {
    if (cleanupBusy) return;
    setCleanupBusy(true); setError(''); setNotice('');
    try {
      const result = await adminAction('cleanup');
      setNotice(result.warning ? 'Ainda há arquivos pendentes. Tente concluir a limpeza novamente mais tarde.' : 'Limpeza de arquivos solicitada. As pendências elegíveis foram processadas.');
    } catch (cleanupError) { setError(cleanupError.message); }
    finally { setCleanupBusy(false); }
  };

  const openPhoto = async (patient) => {
    const path = photoPath(patient);
    if (!path || photoBusy) { if (!path) setError('O caminho da foto não é válido. Solicite a revisão desse cadastro.'); return; }
    const popup = window.open('about:blank', '_blank');
    if (popup) popup.opener = null;
    setPhotoBusy(patient.id); setError(''); setPhotoLink(null);
    try {
      const [{ data: assurance, error: assuranceError }, { data: allowed, error: accessError }] = await Promise.all([supabase.auth.mfa.getAuthenticatorAssuranceLevel(), supabase.rpc('admin_access')]);
      if (assuranceError || accessError || allowed !== true || assurance?.currentLevel !== 'aal2') throw new Error('auth');
      const { data, error: signedError } = await supabase.storage.from('fotos-lesoes').createSignedUrl(path, 60);
      if (signedError || !data?.signedUrl) throw signedError || new Error('url');
      const signed = new URL(data.signedUrl);
      const expected = new URL(import.meta.env.VITE_SUPABASE_URL);
      if (signed.origin !== expected.origin || signed.protocol !== 'https:') throw new Error('url');
      if (popup && !popup.closed) popup.location.replace(signed.href);
      else setPhotoLink({ url: signed.href });
    } catch { if (popup && !popup.closed) popup.close(); setError('Não foi possível abrir a foto. Confira sua conexão e autorização; tente novamente.'); }
    finally { setPhotoBusy(null); }
  };

  const patients = loading ? [] : view?.patients || [];
  const pages = Math.max(1, Math.ceil((view?.count || 0) / PAGE_SIZE));

  return <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-slate-800">
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7 bg-white p-5 rounded-2xl border border-slate-200">
      <div><h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Painel da equipe</h1><p className="text-sm text-slate-600 mt-2">Sessão protegida: {session?.user?.email}</p></div>
      <button type="button" disabled={busy} onClick={logout} className="flex items-center gap-2 min-h-11 px-4 py-3 border rounded-xl text-rose-700 bg-rose-50 disabled:opacity-60"><LogOut aria-hidden="true" className="w-5 h-5" />Sair da conta</button>
    </header>
    {notice && <p role="status" className="mb-5 p-4 bg-emerald-50 text-emerald-800 rounded-xl">{notice}</p>}
    {error && !editing && !deleting && <p role="alert" className="mb-5 p-4 bg-rose-50 text-rose-800 rounded-xl">{error}</p>}
    {photoLink && <p role="status" className="mb-5 p-4 bg-indigo-50 rounded-xl">Seu navegador bloqueou a nova janela. <a href={photoLink.url} target="_blank" rel="noopener noreferrer" className="font-bold underline">Abrir foto com acesso temporário</a>. O link expira em menos de um minuto.</p>}
    <form onSubmit={searchPatients} className="mb-6 flex flex-col sm:flex-row sm:items-end gap-3">
      <div className="flex-1"><label htmlFor="patient-search" className="block font-semibold mb-2">Buscar por nome, grau da lesão ou telefone</label><input id="patient-search" type="search" maxLength={80} value={search} onChange={(event) => setSearch(event.target.value)} aria-invalid={Boolean(searchError)} aria-describedby={searchError ? 'search-error' : undefined} className={inputClass} />{searchError && <p id="search-error" role="alert" className="mt-2 text-rose-700">{searchError}</p>}</div>
      <button type="submit" className="flex justify-center gap-2 rounded-xl px-5 py-3 bg-indigo-600 text-white font-bold min-h-12"><Search aria-hidden="true" className="w-5 h-5" />Buscar</button>
      {request.term && <button type="button" onClick={() => { setSearch(''); setSearchError(''); setRequest((previous) => ({ page: 1, term: '', revision: previous.revision + 1 })); }} className="px-4 py-3 min-h-12 rounded-xl border border-slate-300">Limpar busca</button>}
    </form>
    {loading ? <p role="status" className="p-12 text-center">Carregando pacientes…</p> : view?.error ? <div role="alert" className="bg-rose-50 text-rose-800 p-6 rounded-xl"><p>{view.error}</p><button type="button" onClick={refresh} className="mt-4 min-h-11 underline font-semibold">Tentar novamente</button></div> : patients.length === 0 ? <p className="p-12 text-center border rounded-2xl bg-white">{request.term ? 'Nenhum paciente corresponde à busca.' : 'Nenhum paciente cadastrado.'}</p> : <>
      <p role="status" className="mb-3 text-slate-600">{view.count} {view.count === 1 ? 'cadastro encontrado' : 'cadastros encontrados'} · Página {request.page} de {pages}</p>
      <div role="region" aria-label="Pacientes cadastrados; role horizontalmente em telas pequenas" tabIndex={0} className="overflow-x-auto border border-slate-200 rounded-2xl bg-white focus:outline-indigo-600">
        <table className="w-full text-left min-w-[960px]"><caption className="sr-only">Pacientes, informações clínicas e ações da equipe</caption><thead className="bg-slate-100"><tr>{['Paciente', 'Contato', 'Idade / sexo', 'Diabetes', 'Lesão', 'Localização', 'Ações'].map((label) => <th key={label} scope="col" className="p-4 text-sm">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-200">{patients.map((patient) => <tr key={patient.id} className="align-top hover:bg-slate-50">
            <th scope="row" className="p-4 font-semibold"><span className="block">{patient.nome}</span>{patient.nome_social && <span className="block text-sm font-normal text-indigo-700">Nome social: {patient.nome_social}</span>}</th>
            <td className="p-4">{patient.whatsapp && /^\d{10,11}$/.test(patient.whatsapp) ? <a href={`https://wa.me/55${patient.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-emerald-800 underline">{formatPhone(patient.whatsapp)}</a> : patient.whatsapp || 'Não informado'}</td>
            <td className="p-4">{patient.idade} anos / {patient.sexo}</td><td className="p-4">{patient.tipo_diabetes}</td><td className="p-4"><span className="font-semibold">{patient.grau_lesao}</span><span className="block text-sm text-slate-600">{patient.tempo_lesao}</span></td><td className="p-4">{patient.localizacao_quadrante}</td>
            <td className="p-3"><div className="flex gap-1 flex-wrap">
              {(patient.foto_path || patient.foto_url) && <button type="button" onClick={() => openPhoto(patient)} disabled={photoBusy !== null} aria-label={`Ver foto de ${patient.nome}`} className="min-w-11 min-h-11 p-3 text-indigo-700 rounded-xl hover:bg-indigo-50 disabled:opacity-50"><FileImage aria-hidden="true" className="w-5 h-5" /></button>}
              <button type="button" onClick={() => openEdit(patient)} aria-label={`Editar cadastro de ${patient.nome}`} className="min-w-11 min-h-11 p-3 text-indigo-700 rounded-xl hover:bg-indigo-50"><Edit aria-hidden="true" className="w-5 h-5" /></button>
              <button type="button" onClick={() => { setDeleting(patient); setError(''); setNotice(''); }} aria-label={`Excluir cadastro de ${patient.nome}`} className="min-w-11 min-h-11 p-3 text-rose-700 rounded-xl hover:bg-rose-50"><Trash2 aria-hidden="true" className="w-5 h-5" /></button>
            </div></td>
          </tr>)}</tbody>
        </table>
      </div>
      <nav aria-label="Páginas de pacientes" className="mt-5 flex justify-between items-center gap-3"><button type="button" disabled={request.page === 1} onClick={() => setRequest((previous) => ({ ...previous, page: previous.page - 1 }))} className="min-h-11 border rounded-xl px-4 py-3 disabled:opacity-40">Anterior</button><span>Página {request.page} de {pages}</span><button type="button" disabled={request.page >= pages} onClick={() => setRequest((previous) => ({ ...previous, page: previous.page + 1 }))} className="min-h-11 border rounded-xl px-4 py-3 disabled:opacity-40">Próxima</button></nav>
    </>}
    <div className="mt-8 pt-5 border-t border-slate-200 flex flex-wrap gap-4"><button type="button" onClick={refresh} disabled={loading} className="min-h-11 underline text-indigo-700 disabled:opacity-50">Atualizar lista</button><button type="button" disabled={cleanupBusy} onClick={cleanup} className="min-h-11 underline text-slate-600 disabled:opacity-50">{cleanupBusy ? 'Concluindo limpeza…' : 'Concluir limpeza de arquivos'}</button></div>

    {editing && <NativeDialog title={discard ? 'Descartar alterações?' : 'Editar paciente'} onCancel={discard ? () => setDiscard(false) : requestCloseEdit} busy={busy}>
      {discard ? <><p className="mb-5">As alterações ainda não foram salvas.</p><div className="flex flex-wrap justify-end gap-3"><button type="button" onClick={() => setDiscard(false)} className="px-4 py-3 border rounded-xl">Continuar editando</button><button type="button" onClick={closeEdit} className="px-4 py-3 bg-rose-700 text-white rounded-xl">Descartar alterações</button></div></> : <>
        <p className="text-sm text-slate-600 mb-5">Corrija os campos destacados antes de salvar. A alteração será registrada na auditoria.</p>
        {error && <p role="alert" className="mb-5 p-3 bg-rose-50 text-rose-800 rounded-xl">{error}</p>}
        {Object.keys(fieldErrors).length > 0 && <p role="alert" className="mb-4 text-rose-700">Revise os campos indicados abaixo.</p>}
        <form ref={editForm} onSubmit={saveEdit} noValidate aria-busy={busy}>
          <fieldset disabled={busy} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <EditField name="nome" label="Nome completo *" value={draft.nome} onChange={changeField} error={fieldErrors.nome} required maxLength={150} autoComplete="name" />
            <EditField name="nome_social" label="Nome social" value={draft.nome_social} onChange={changeField} error={fieldErrors.nome_social} maxLength={150} />
            <EditField name="whatsapp" label="WhatsApp / telefone *" type="tel" value={draft.whatsapp} onChange={changeField} error={fieldErrors.whatsapp} required maxLength={25} autoComplete="tel" />
            <EditField name="idade" label="Idade *" type="number" min={1} max={120} value={draft.idade} onChange={changeField} error={fieldErrors.idade} required />
            <EditField name="sexo" label="Sexo *" options={SEX_OPTIONS} value={draft.sexo} onChange={changeField} error={fieldErrors.sexo} required />
            <EditField name="tipo_diabetes" label="Tipo de diabetes *" options={DIABETES_OPTIONS} value={draft.tipo_diabetes} onChange={changeField} error={fieldErrors.tipo_diabetes} required />
            <EditField name="grau_lesao" label="Grau da lesão *" options={LESION_OPTIONS} value={draft.grau_lesao} onChange={changeField} error={fieldErrors.grau_lesao} required />
            <EditField name="tempo_lesao" label="Tempo da lesão *" value={draft.tempo_lesao} onChange={changeField} error={fieldErrors.tempo_lesao} maxLength={100} required />
            <div className="sm:col-span-2"><EditField name="localizacao_quadrante" label="Localização no pé *" value={draft.localizacao_quadrante} onChange={changeField} error={fieldErrors.localizacao_quadrante} maxLength={150} required /></div>
            <fieldset className="sm:col-span-2"><legend className="font-semibold mb-2">Comorbidades</legend><div className="grid sm:grid-cols-2 gap-2">{COMORBIDITY_OPTIONS.map((option) => <label key={option} className="flex items-center gap-3 min-h-11"><input type="checkbox" value={option} checked={(draft.comorbidades || []).includes(option)} onChange={(event) => setDraft((previous) => ({ ...previous, comorbidades: event.target.checked ? [...previous.comorbidades, option] : previous.comorbidades.filter((value) => value !== option) }))} className="w-5 h-5" />{option}</label>)}</div>{fieldErrors.comorbidades && <p className="text-rose-700 mt-2">{fieldErrors.comorbidades}</p>}</fieldset>
          </fieldset>
          <p className="mt-5 text-sm text-slate-500">{editing.consent_accepted_at ? `Aceite registrado em ${new Date(editing.consent_accepted_at).toLocaleString('pt-BR')}${editing.consent_version ? ` · versão ${editing.consent_version}` : ''}.` : 'Cadastro anterior ao registro versionado do consentimento; nenhum aceite será inventado nesta edição.'}</p>
          <div className="mt-6 pt-5 border-t flex justify-end flex-wrap gap-3"><button type="button" disabled={busy} onClick={requestCloseEdit} className="px-4 py-3 rounded-xl border">Cancelar</button><button type="submit" disabled={busy} className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-60">{busy ? 'Salvando…' : 'Salvar alterações'}</button></div>
        </form>
      </>}
    </NativeDialog>}
    {deleting && <NativeDialog title="Excluir cadastro?" onCancel={() => { if (!busy) { setDeleting(null); setError(''); } }} busy={busy}><p>Confirma a exclusão do cadastro de <strong>{deleting.nome}</strong> e da foto associada? Esta ação não pode ser desfeita.</p>{error && <p role="alert" className="mt-4 text-rose-700">{error}</p>}<div className="mt-6 flex justify-end flex-wrap gap-3"><button type="button" disabled={busy} onClick={() => { setDeleting(null); setError(''); }} className="px-4 py-3 border rounded-xl">Cancelar</button><button type="button" disabled={busy} onClick={deletePatient} className="px-4 py-3 rounded-xl bg-rose-700 text-white font-bold disabled:opacity-60">{busy ? 'Excluindo…' : 'Excluir cadastro e foto'}</button></div></NativeDialog>}
  </main>;
}
