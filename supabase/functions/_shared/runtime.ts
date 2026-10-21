import { createClient } from 'npm:@supabase/supabase-js@2.112.2';
import { fingerprint } from './security.js';

const url = Deno.env.get('SUPABASE_URL')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const origins = new Set([
  'https://tecido-no-app-inky.vercel.app',
  ...(Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map((value) => value.trim()).filter(Boolean),
]);
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function cors(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');
  if (origin) {
    let loopback = false;
    try { const u = new URL(origin); loopback = u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname); } catch { /* Reject. */ }
    if (!origins.has(origin) && !loopback) throw new HttpError(403, 'Origem não autorizada.');
  }
  return {
    ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
  };
}
export function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' } });
}
export function serviceClient() {
  if (!url || !anonKey || !serviceKey) throw new HttpError(503, 'Serviço temporariamente indisponível.');
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
export function userClient(req: Request) {
  return createClient(url, anonKey, { global: { headers: { Authorization: req.headers.get('authorization') || '' } }, auth: { persistSession: false, autoRefreshToken: false } });
}
export async function requestIdentity(req: Request) {
  // Rightmost forwarded entry is closest to the trusted ingress. Never persist
  // raw addresses. Shared fallback and independent global budget bound abuse
  // even when the ingress doesn't provide a client address.
  const source = req.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim().slice(0, 200) || 'shared-ingress';
  return fingerprint(serviceKey, source);
}
export function challengeSecret() { return serviceKey; }
export async function cleanupPhotos(admin: ReturnType<typeof serviceClient>, patientId: string | null = null) {
  const { data: items, error } = await admin.rpc('get_photo_cleanup', { p_patient_id: patientId, p_limit: 20 });
  if (error) throw new HttpError(503, 'Não foi possível consultar a fila de limpeza.');
  let pending = 0;
  let cleaned = 0;
  for (const item of items || []) {
    const { error: removalError } = await admin.storage.from('fotos-lesoes').remove([item.object_path]);
    const { error: finishError } = await admin.rpc('finish_photo_cleanup', { p_id: item.id, p_success: !removalError });
    if (removalError || finishError) pending++;
    else cleaned++;
  }
  return { cleaned, pending };
}
