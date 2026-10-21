import { validatePatient } from '../_shared/validation.js';
import { readJsonLimited, validPatientId } from '../_shared/security.js';
import { cleanupPhotos, cors, HttpError, json, serviceClient, userClient } from '../_shared/runtime.ts';

Deno.serve(async (req) => {
  let headers: Record<string, string> = {};
  try {
    headers = cors(req);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (req.method !== 'POST') throw new HttpError(405, 'Método não permitido.');
    const token = req.headers.get('authorization')?.replace(/^Bearer /i, '');
    if (!token) throw new HttpError(401, 'Autenticação necessária.');
    const user = userClient(req);
    const { data: identity, error: authError } = await user.auth.getUser(token);
    if (authError || !identity.user) throw new HttpError(401, 'Sua sessão expirou.');
    const { data: claims, error: claimsError } = await user.auth.getClaims(token);
    if (claimsError || claims?.claims?.aal !== 'aal2') throw new HttpError(403, 'Confirme o segundo fator.');
    const { data: allowed, error: roleError } = await user.rpc('admin_access');
    if (roleError || allowed !== true) throw new HttpError(403, 'Acesso não autorizado.');
    const body = await readJsonLimited(req, 16 * 1024);
    if (body.action === 'cleanup') {
      const result = await cleanupPhotos(serviceClient());
      return json({ ok: true, ...result, warning: result.pending ? 'Alguns arquivos continuarão na fila protegida para nova tentativa.' : null }, 200, headers);
    }
    if (!validPatientId(body.id)) throw new HttpError(400, 'Cadastro inválido.');
    if (body.action === 'update') {
      const { data: patient, errors } = validatePatient(body.patient, { requireConsent: false, fieldStyle: 'snake' });
      if (Object.keys(errors).length) throw new HttpError(422, 'Revise os campos do cadastro.');
      const { count, error } = await user.from('pacientes').update(patient, { count: 'exact' }).eq('id', String(body.id));
      if (error) throw new HttpError(422, 'Não foi possível atualizar o cadastro. Revise os dados.');
      if (count !== 1) throw new HttpError(404, 'Cadastro não encontrado.');
      return json({ ok: true }, 200, headers);
    }
    if (body.action === 'delete') {
      const { count, error } = await user.from('pacientes').delete({ count: 'exact' }).eq('id', String(body.id));
      if (error) throw new HttpError(503, 'Não foi possível excluir o cadastro.');
      if (count !== 1) throw new HttpError(404, 'Cadastro não encontrado.');
      try {
        const result = await cleanupPhotos(serviceClient(), String(body.id));
        return json({ ok: true, warning: result.pending ? 'Cadastro excluído. A foto permanece protegida e aguardará nova tentativa de limpeza.' : null }, 200, headers);
      } catch {
        return json({ ok: true, warning: 'Cadastro excluído. A limpeza da foto ficou registrada na fila protegida para nova tentativa.' }, 200, headers);
      }
    }
    throw new HttpError(400, 'Operação inválida.');
  } catch (error) {
    return json({ ok: false, message: error instanceof HttpError ? error.message : 'Não foi possível confirmar a operação.' }, error instanceof HttpError ? error.status : 503, headers);
  }
});
