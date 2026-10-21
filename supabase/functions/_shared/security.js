const encoder = new TextEncoder();
const decoder = new TextDecoder();
export const DIFFICULTY = 14;
export const MAX_REQUEST_BYTES = 5 * 1024 * 1024;
export function requestSource(headers) {
  // Supabase's Cloudflare ingress supplies the client address. Forwarded
  // proxy hops can rotate between calls and must never bind a signed receipt.
  // A shared fallback fails closed when this trusted header is unavailable.
  return headers.get('cf-connecting-ip')?.trim().slice(0, 200) || 'shared-ingress';
}
export function base64url(bytes) {
  let raw = '';
  for (const x of bytes) raw += String.fromCharCode(x);
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function unbase64url(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid encoding');
  const raw = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (x) => x.charCodeAt(0));
}
async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', encoder.encode('tecido-no:intake:v1:' + secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export async function fingerprint(secret, source) {
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(source))), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
export async function issueChallenge(secret, identity, now = Date.now(), requestId = crypto.randomUUID()) {
  if (typeof requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) throw new Error('Identificador de envio inválido.');
  const payload = { nonce: requestId, identity, difficulty: DIFFICULTY, issued: now, expires: now + 5 * 60_000 };
  const encoded = base64url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(encoded));
  return { token: encoded + '.' + base64url(new Uint8Array(signature)), nonce: payload.nonce, difficulty: payload.difficulty, expires: payload.expires };
}
export function hasProof(bytes, difficulty) {
  const whole = Math.floor(difficulty / 8);
  for (let i = 0; i < whole; i++) if (bytes[i] !== 0) return false;
  return !((difficulty % 8) && (bytes[whole] >>> (8 - difficulty % 8)));
}
export async function verifyChallenge(secret, token, identity, proof, now = Date.now(), expiryGrace = 0) {
  if (typeof token !== 'string' || token.length > 2000 || !Number.isSafeInteger(proof) || proof < 0 || proof > 10_000_000) throw new Error('Verificação inválida.');
  const parts = token.split('.');
  if (parts.length !== 2 || !await crypto.subtle.verify('HMAC', await hmacKey(secret), unbase64url(parts[1]), encoder.encode(parts[0]))) throw new Error('Verificação inválida.');
  const payload = JSON.parse(decoder.decode(unbase64url(parts[0])));
  if ((identity !== null && payload.identity !== identity) || !/^[a-f0-9]{64}$/.test(payload.identity) || payload.difficulty !== DIFFICULTY || !Number.isFinite(payload.expires) || payload.expires + expiryGrace < now || payload.issued > now || now - payload.issued < 1000 || payload.expires - payload.issued !== 300_000) throw new Error('Verificação expirada. Tente novamente.');
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(payload.nonce + ':' + proof));
  if (!hasProof(new Uint8Array(digest), payload.difficulty)) throw new Error('Verificação inválida.');
  return payload;
}
export async function readJsonLimited(req, limit = MAX_REQUEST_BYTES) {
  if (!req.body || !req.headers.get('content-type')?.startsWith('application/json')) throw new Error('Envie dados JSON.');
  if (Number(req.headers.get('content-length')) > limit) throw new Error('Arquivo muito grande.');
  const reader = req.body.getReader();
  let size = 0;
  const chunks = [];
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.length;
    if (size > limit) { await reader.cancel(); throw new Error('Arquivo muito grande.'); }
    chunks.push(part.value);
  }
  const all = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.length; }
  const data = JSON.parse(decoder.decode(all));
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Dados inválidos.');
  return data;
}
export function validPatientId(value) {
  if (!['string', 'number'].includes(typeof value) || (typeof value === 'number' && !Number.isSafeInteger(value))) return false;
  const str = String(value ?? '');
  return /^[1-9][0-9]{0,18}$/.test(str) && BigInt(str) <= 9223372036854775807n;
}
