import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DIFFICULTY,
  MAX_REQUEST_BYTES,
  base64url,
  unbase64url,
  fingerprint,
  hasProof,
  issueChallenge,
  verifyChallenge,
  readJsonLimited,
  validPatientId,
} from '../supabase/functions/_shared/security.js';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const secret = 'synthetic-test-secret-not-a-production-credential';
const identity = 'synthetic-fingerprint';
const issued = 1_700_000_000_000;
let fixturePromise;

const protocolProof = (digest) => digest[0] === 0 && (digest[1] & 0xfc) === 0;

async function proofFixture() {
  fixturePromise ??= (async () => {
    const challenge = await issueChallenge(secret, identity, issued);
    assert.equal(challenge.difficulty, 14);
    let proof = 0;
    let invalidProof;
    for (; proof <= 1_000_000; proof++) {
      const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(challenge.nonce + ':' + proof)));
      if (protocolProof(digest)) break;
      invalidProof ??= proof;
    }
    assert.ok(proof <= 1_000_000, 'difficulty 14 proof must be solvable within the test budget');
    if (invalidProof === undefined) {
      invalidProof = proof + 1;
      while (protocolProof(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(challenge.nonce + ':' + invalidProof))))) invalidProof++;
    }
    return { challenge, proof, invalidProof };
  })();
  return fixturePromise;
}

function requestFromChunks(chunks, { contentType = 'application/json', contentLength, onCancel } = {}) {
  let index = 0;
  const stream = new ReadableStream({
    pull(controller) {
      if (index < chunks.length) controller.enqueue(chunks[index++]);
      else controller.close();
    },
    cancel() { onCancel?.(); },
  });
  const headers = {};
  if (contentType) headers['Content-Type'] = contentType;
  if (contentLength !== undefined) headers['Content-Length'] = String(contentLength);
  return new Request('https://intake.example.test/', { method: 'POST', body: stream, duplex: 'half', headers });
}

const jsonRequest = (body, options) => requestFromChunks([encoder.encode(body)], options);

test('base64url round trips binary bytes and rejects malformed encodings', () => {
  const bytes = Uint8Array.from([0, 1, 127, 128, 254, 255]);
  const encoded = base64url(bytes);
  assert.match(encoded, /^[A-Za-z0-9_-]+$/);
  assert.deepEqual(unbase64url(encoded), bytes);
  for (const invalid of ['', 'a+b', 'a/b', 'a=', 'a b', null]) assert.throws(() => unbase64url(invalid));
});

test('fingerprints are deterministic, keyed and bound to the source', async () => {
  const source = '203.0.113.11|Synthetic Test Agent';
  const original = await fingerprint(secret, source);
  assert.equal(original, await fingerprint(secret, source));
  assert.notEqual(original, await fingerprint(secret + '-different', source));
  assert.notEqual(original, await fingerprint(secret, '203.0.113.12|Synthetic Test Agent'));
  assert.match(original, /^[a-f0-9]{64}$/);
  assert.equal(original.includes('203.0.113.11'), false);
});

test('issues unique signed nonces with a fixed five-minute lifetime', async () => {
  const first = await issueChallenge(secret, identity, issued);
  const second = await issueChallenge(secret, identity, issued);
  assert.notEqual(first.nonce, second.nonce);
  assert.notEqual(first.token, second.token);
  assert.equal(first.expires, issued + 300_000);
  assert.equal(first.difficulty, DIFFICULTY);
  const payload = JSON.parse(decoder.decode(unbase64url(first.token.split('.')[0])));
  assert.equal(payload.nonce, first.nonce);
  assert.equal(payload.identity, identity);
  assert.equal(payload.issued, issued);
});

test('proof checks enforce the exact leading-zero bit boundary', () => {
  assert.equal(hasProof(Uint8Array.from([0, 3, 255]), 14), true);
  assert.equal(hasProof(Uint8Array.from([0, 4, 0]), 14), false);
  assert.equal(hasProof(Uint8Array.from([1, 0, 0]), 14), false);
  assert.equal(hasProof(Uint8Array.from([0, 0, 255]), 16), true);
  assert.equal(hasProof(Uint8Array.from([0, 1, 0]), 16), false);
});

test('accepts a valid solved challenge only after the minimum elapsed time', async () => {
  const { challenge, proof } = await proofFixture();
  const payload = await verifyChallenge(secret, challenge.token, identity, proof, issued + 1500);
  assert.equal(payload.nonce, challenge.nonce);
  assert.equal(payload.identity, identity);
  assert.equal((await verifyChallenge(secret, challenge.token, identity, proof, issued + 1000)).nonce, challenge.nonce);
  for (const now of [issued - 1, issued, issued + 999]) {
    await assert.rejects(verifyChallenge(secret, challenge.token, identity, proof, now), /expirada/);
  }
});

test('rejects expiration, a different fingerprint and a different signing secret', async () => {
  const { challenge, proof } = await proofFixture();
  await assert.rejects(verifyChallenge(secret, challenge.token, identity, proof, challenge.expires + 1), /expirada/);
  await assert.rejects(verifyChallenge(secret, challenge.token, 'other-fingerprint', proof, issued + 1500), /expirada/);
  await assert.rejects(verifyChallenge(secret + '-wrong', challenge.token, identity, proof, issued + 1500), /inválida/);
});

test('rejects modified signed payloads, including an altered nonce', async () => {
  const { challenge, proof } = await proofFixture();
  const [encoded, signature] = challenge.token.split('.');
  const original = JSON.parse(decoder.decode(unbase64url(encoded)));
  for (const change of [{ nonce: 'attacker-selected-nonce' }, { identity: 'other' }, { expires: original.expires + 300_000 }, { difficulty: 0 }]) {
    const tampered = base64url(encoder.encode(JSON.stringify({ ...original, ...change }))) + '.' + signature;
    await assert.rejects(verifyChallenge(secret, tampered, identity, proof, issued + 1500), /inválida/);
  }
  const tamperedSignature = (signature[0] === 'A' ? 'B' : 'A') + signature.slice(1);
  await assert.rejects(verifyChallenge(secret, encoded + '.' + tamperedSignature, identity, proof, issued + 1500), /inválida/);
});

test('rejects an incorrect proof and malformed or excessive proof values', async () => {
  const { challenge, proof, invalidProof } = await proofFixture();
  await assert.rejects(verifyChallenge(secret, challenge.token, identity, invalidProof, issued + 1500), /inválida/);
  for (const badProof of [-1, 1.5, '1', null, NaN, Infinity, 10_000_001]) {
    await assert.rejects(verifyChallenge(secret, challenge.token, identity, badProof, issued + 1500), /inválida/);
  }
  for (const token of ['', 'not-a-token', 'a.b.c', '.signature', 'payload.!', 'a'.repeat(2001), null]) {
    await assert.rejects(verifyChallenge(secret, token, identity, proof, issued + 1500));
  }
});

test('reads JSON objects across chunk boundaries and measures actual UTF-8 bytes', async () => {
  const text = '{"nome":"Pessoa de Teste á"}';
  const bytes = encoder.encode(text);
  const request = requestFromChunks([bytes.slice(0, 10), bytes.slice(10, 25), bytes.slice(25)], { contentType: 'application/json; charset=utf-8' });
  assert.deepEqual(await readJsonLimited(request, bytes.length), { nome: 'Pessoa de Teste á' });
  await assert.rejects(readJsonLimited(jsonRequest(text), bytes.length - 1), /muito grande/);
});

test('rejects oversized streams even without a truthful Content-Length and cancels further reading', async () => {
  for (const contentLength of [undefined, 1]) {
    let cancelled = false;
    const request = requestFromChunks([
      encoder.encode('{"nome":"'), encoder.encode('a'.repeat(64)), encoder.encode('b'.repeat(64)), encoder.encode('"}'),
    ], { contentLength, onCancel: () => { cancelled = true; } });
    await assert.rejects(readJsonLimited(request, 32), /muito grande/);
    assert.equal(cancelled, true);
  }
  await assert.rejects(readJsonLimited(jsonRequest('{}', { contentLength: MAX_REQUEST_BYTES + 1 })), /muito grande/);
});

test('rejects non-JSON, malformed JSON and JSON values that are not objects', async () => {
  for (const contentType of [null, 'text/plain', 'application/octet-stream']) {
    await assert.rejects(readJsonLimited(jsonRequest('{}', { contentType })), /JSON/);
  }
  for (const value of ['null', '[]', 'true', '42', '"text"']) {
    await assert.rejects(readJsonLimited(jsonRequest(value)), /inválidos/);
  }
  await assert.rejects(readJsonLimited(jsonRequest('{invalid json')));
  await assert.rejects(readJsonLimited(new Request('https://intake.example.test/')), /JSON/);
});

test('enforces the default request limit while streaming without Content-Length', async () => {
  const chunk = new Uint8Array(512 * 1024);
  const chunks = Array.from({ length: Math.floor(MAX_REQUEST_BYTES / chunk.length) + 1 }, () => chunk);
  await assert.rejects(readJsonLimited(requestFromChunks(chunks)), /muito grande/);
});

test('allows only positive int64 identifiers, rejecting SQL/query injection and unsafe JSON numbers', () => {
  for (const id of ['1', 42, '9007199254740993', '9223372036854775807']) assert.equal(validPatientId(id), true, String(id));
  for (const id of ['0', '-1', '01', '+1', '1.0', '1e3', ' 1', '1 ', '', '1 OR 1=1', '1;DROP TABLE pacientes', '1,2', '1&admin=true', '9223372036854775808', Number.MAX_SAFE_INTEGER + 1, null, undefined, true, {}, []]) {
    assert.equal(validPatientId(id), false, `invalid id: ${JSON.stringify(id)}`);
  }
});
