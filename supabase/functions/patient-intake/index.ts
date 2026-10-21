import { CONSENT_VERSION, validatePatient } from '../_shared/validation.js';
import { issueChallenge, readJsonLimited, verifyChallenge } from '../_shared/security.js';
import { decodePhoto } from '../_shared/image.js';
import { challengeSecret, cors, HttpError, json, requestIdentity, serviceClient } from '../_shared/runtime.ts';

Deno.serve(async (req) => {
  let headers: Record<string, string> = {};
  try {
    headers = cors(req);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (req.method !== 'POST') throw new HttpError(405, 'Método não permitido.');
    const body = await readJsonLimited(req);
    const admin = serviceClient();
    const identity = await requestIdentity(req);
    if (body.action === 'challenge') {
      const { data: budget, error } = await admin.rpc('intake_budget', { p_identity: identity, p_stage: 'challenge' });
      if (error) throw new HttpError(503, 'Serviço temporariamente indisponível.');
      if (budget !== 'allowed') throw new HttpError(429, 'Muitas tentativas. Aguarde antes de tentar novamente.');
      return json(await issueChallenge(challengeSecret(), identity), 200, headers);
    }
    if (body.action !== 'submit') throw new HttpError(400, 'Operação inválida.');
    if (typeof body.website !== 'string' || body.website.trim()) throw new HttpError(400, 'Não foi possível verificar o envio.');
    const { data: patient, errors } = validatePatient(body.patient);
    if (Object.keys(errors).length) throw new HttpError(422, 'Revise os campos do cadastro antes de enviar.');
    const photo = body.photo ? decodePhoto(body.photo) : null;
    const challenge = await verifyChallenge(challengeSecret(), body.token, identity, body.proof);
    const { data: budget, error: budgetError } = await admin.rpc('intake_budget', { p_identity: identity, p_stage: 'submit', p_nonce: challenge.nonce });
    if (budgetError) throw new HttpError(503, 'Serviço temporariamente indisponível.');
    if (budget === 'completed') return json({ ok: true }, 200, headers);
    if (budget === 'pending') throw new HttpError(409, 'O envio anterior está sendo processado. Aguarde antes de tentar novamente.');
    if (budget !== 'allowed') throw new HttpError(429, 'Limite de envios atingido. Aguarde antes de tentar novamente.');
    let path: string | null = null;
    if (photo) {
      path = crypto.randomUUID() + '.jpg';
      const { error: queueError } = await admin.rpc('queue_photo_cleanup', { p_path: path, p_reason: 'pending_intake', p_delay_seconds: 3600 });
      if (queueError) throw new HttpError(503, 'Não foi possível preparar o envio da foto.');
      const { error: uploadError } = await admin.storage.from('fotos-lesoes').upload(path, photo, { contentType: 'image/jpeg', upsert: false, cacheControl: '60' });
      if (uploadError) throw new HttpError(503, 'Não foi possível enviar a foto. Tente novamente.');
    }
    const { error: insertError } = await admin.from('pacientes').insert({
      ...patient, foto_path: path, foto_url: null,
      consent_version: CONSENT_VERSION, consent_accepted_at: new Date().toISOString(),
      intake_request_id: challenge.nonce,
    });
    if (insertError) {
      if (path) {
        const { error: removalError } = await admin.storage.from('fotos-lesoes').remove([path]);
        if (removalError) await admin.rpc('queue_photo_cleanup', { p_path: path, p_reason: 'failed_intake', p_delay_seconds: 0 });
      }
      throw new HttpError(503, 'Não foi possível concluir o cadastro. Confira sua conexão antes de tentar novamente.');
    }
    return json({ ok: true }, 201, headers);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 400;
    const message = error instanceof HttpError ? error.message : 'O envio é inválido ou expirou. Revise os dados e tente novamente.';
    // Do not log submitted health data, images, tokens or raw errors.
    return json({ ok: false, message }, status, headers);
  }
});
