import test from 'node:test';
import assert from 'node:assert/strict';
import { createSubmissionManager } from '../src/lib/submission.js';

const person = (overrides = {}) => ({ nome: 'Pessoa de Teste', idade: 62, termo_consentimento: true, ...overrides });
const photo = () => ({ name: 'synthetic-test-image.jpg' });

function harness({ onSubmit, onStatus, onChallenge, prepareFailure, solveDuration = 0, initialTime = 1234 } = {}) {
  const calls = [];
  const ids = [];
  const tokenIds = new Map();
  const waits = [];
  let monotonicTime = initialTime;
  let prepares = 0;
  let solves = 0;
  let submits = 0;
  let challenges = 0;
  const prepared = { type: 'image/jpeg', base64: 'synthetic-prepared-image' };
  const manager = createSubmissionManager({
    uuid: () => {
      const digit = String(ids.length + 1);
      const id = digit.repeat(8) + '-' + digit.repeat(4) + '-4' + digit.repeat(3) + '-8' + digit.repeat(3) + '-' + digit.repeat(12);
      ids.push(id);
      return id;
    },
    now: () => monotonicTime,
    wait: async (milliseconds) => { waits.push(milliseconds); monotonicTime += milliseconds; },
    preparePhoto: async (file) => {
      prepares++;
      if (prepareFailure) await prepareFailure(file, prepares);
      return file ? prepared : null;
    },
    solve: async () => { solves++; monotonicTime += solveDuration; return 123; },
    invoke: async (body) => {
      calls.push(body);
      if (body.action === 'challenge') {
        challenges++;
        if (onChallenge) await onChallenge(body, challenges);
        const token = 'synthetic-token-' + challenges;
        tokenIds.set(token, body.requestId);
        // An absolute expiry in the past deliberately must not drive client waiting.
        return { token, nonce: body.requestId, difficulty: 14, expires: 1 };
      }
      if (body.action === 'status') return onStatus ? onStatus(body, tokenIds.get(body.token)) : { ok: true, state: 'unknown' };
      if (body.action === 'submit') {
        submits++;
        return onSubmit ? onSubmit(body, tokenIds.get(body.token), submits) : { ok: true };
      }
      throw new Error('Unexpected action');
    },
  });
  return { manager, calls, ids, tokenIds, waits, prepared, get prepares() { return prepares; }, get solves() { return solves; }, get submits() { return submits; } };
}

const ofAction = (fixture, action) => fixture.calls.filter((call) => call.action === action);

test('a confirmed success clears the pending submission so the next patient gets a fresh request ID', async () => {
  const fixture = harness();
  assert.deepEqual(await fixture.manager.submit(person(), null), { ok: true });
  assert.deepEqual(await fixture.manager.submit(person({ nome: 'Outra Pessoa de Teste' }), null), { ok: true });
  assert.equal(fixture.ids.length, 2);
  assert.notEqual(fixture.ids[0], fixture.ids[1]);
  assert.equal(ofAction(fixture, 'status').length, 0);
  assert.equal(ofAction(fixture, 'submit').length, 2);
});

test('a lost success response is reconciled as completed without another challenge, preparation or insert', async () => {
  const completed = new Set();
  const fixture = harness({
    onSubmit: async (_body, id) => { completed.add(id); throw new Error('Synthetic lost response'); },
    onStatus: async (_body, id) => ({ ok: true, state: completed.has(id) ? 'completed' : 'unknown' }),
  });
  const samePhoto = photo();
  await assert.rejects(fixture.manager.submit(person(), samePhoto), /lost response/);
  assert.deepEqual(await fixture.manager.submit(person(), samePhoto), { ok: true, alreadyReceived: true });
  assert.equal(completed.size, 1);
  assert.equal(fixture.prepares, 1);
  assert.equal(fixture.solves, 1);
  assert.equal(ofAction(fixture, 'challenge').length, 1);
  assert.equal(ofAction(fixture, 'submit').length, 1);
  assert.equal(ofAction(fixture, 'status').length, 1);
});

test('a pending receipt preserves the request ID and blocks additional challenge or submit calls', async () => {
  const fixture = harness({
    onSubmit: async () => { throw new Error('Synthetic timeout'); },
    onStatus: async () => ({ ok: true, state: 'pending' }),
  });
  await assert.rejects(fixture.manager.submit(person(), null), /timeout/);
  await assert.rejects(fixture.manager.submit(person(), null), /ainda está sendo processado/);
  await assert.rejects(fixture.manager.submit(person(), null), /ainda está sendo processado/);
  assert.equal(fixture.ids.length, 1);
  assert.equal(ofAction(fixture, 'challenge').length, 1);
  assert.equal(ofAction(fixture, 'submit').length, 1);
  assert.equal(ofAction(fixture, 'status').length, 2);
});

test('an unknown receipt retries with the same ID even when the previous request commits late', async () => {
  const completed = new Set();
  let commitDelayedRequest;
  const fixture = harness({
    onStatus: async () => ({ ok: true, state: 'unknown' }),
    onSubmit: async (_body, id, attempt) => {
      if (attempt === 1) {
        commitDelayedRequest = () => completed.add(id);
        throw new Error('Synthetic timeout before delayed commit');
      }
      commitDelayedRequest();
      if (!completed.has(id)) completed.add(id);
      return { ok: true };
    },
  });
  const samePhoto = photo();
  await assert.rejects(fixture.manager.submit(person(), samePhoto), /timeout/);
  assert.deepEqual(await fixture.manager.submit(person(), samePhoto), { ok: true });
  const challenges = ofAction(fixture, 'challenge');
  assert.equal(challenges.length, 2);
  assert.equal(challenges[0].requestId, challenges[1].requestId);
  assert.equal(completed.size, 1);
  assert.equal(fixture.ids.length, 1);
  assert.equal(fixture.prepares, 1);
  for (const submission of ofAction(fixture, 'submit')) assert.equal(submission.photo, fixture.prepared);
});

test('a failed receipt lookup never replaces an uncertain request ID', async () => {
  let receipts = 0;
  const fixture = harness({
    onSubmit: async (_body, _id, attempt) => {
      if (attempt === 1) throw new Error('Synthetic lost response');
      return { ok: true };
    },
    onStatus: async () => {
      if (++receipts === 1) throw new Error('Synthetic receipt network failure');
      return { ok: true, state: 'unknown' };
    },
  });
  await assert.rejects(fixture.manager.submit(person(), null), /lost response/);
  await assert.rejects(fixture.manager.submit(person(), null), /receipt network failure/);
  assert.equal(ofAction(fixture, 'challenge').length, 1);
  await fixture.manager.submit(person(), null);
  const challenges = ofAction(fixture, 'challenge');
  assert.equal(challenges[0].requestId, challenges[1].requestId);
  assert.equal(fixture.ids.length, 1);
});

test('changed patient data, website or photo cannot silently replace an unconfirmed submission', async () => {
  const fixture = harness({ onSubmit: async () => { throw new Error('Synthetic lost response'); } });
  const samePhoto = photo();
  await assert.rejects(fixture.manager.submit(person(), samePhoto), /lost response/);
  for (const [patient, file, website] of [
    [person({ nome: 'Changed name' }), samePhoto, ''],
    [person(), photo(), ''],
    [person(), samePhoto, 'changed-website'],
  ]) {
    await assert.rejects(fixture.manager.submit(patient, file, website), /envio sem confirmação/);
  }
  assert.equal(fixture.ids.length, 1);
  assert.equal(fixture.prepares, 1);
  assert.equal(ofAction(fixture, 'challenge').length, 1);
  assert.equal(ofAction(fixture, 'submit').length, 1);
});

test('if the old receipt completed after input changed, the changed data needs a new explicit submit', async () => {
  const fixture = harness({
    onSubmit: async (_body, _id, attempt) => {
      if (attempt === 1) throw new Error('Synthetic lost response');
      return { ok: true };
    },
    onStatus: async () => ({ ok: true, state: 'completed' }),
  });
  const nextPerson = person({ nome: 'Next Person' });
  await assert.rejects(fixture.manager.submit(person(), null), /lost response/);
  await assert.rejects(fixture.manager.submit(nextPerson, null), /dados atuais ainda não foram enviados/);
  assert.equal(ofAction(fixture, 'submit').length, 1);
  assert.equal(fixture.ids.length, 1);
  await fixture.manager.submit(nextPerson, null);
  assert.equal(ofAction(fixture, 'submit').length, 2);
  assert.equal(fixture.ids.length, 2);
  assert.notEqual(fixture.ids[0], fixture.ids[1]);
});

test('challenge failures retain the request ID and reuse the already prepared photo', async () => {
  const fixture = harness({ onChallenge: async (_body, attempt) => { if (attempt === 1) throw new Error('Synthetic challenge failure'); } });
  const samePhoto = photo();
  await assert.rejects(fixture.manager.submit(person(), samePhoto), /challenge failure/);
  await fixture.manager.submit(person(), samePhoto);
  const challenges = ofAction(fixture, 'challenge');
  assert.equal(challenges[0].requestId, challenges[1].requestId);
  assert.equal(fixture.prepares, 1);
  assert.equal(ofAction(fixture, 'status').length, 0);
  assert.equal(ofAction(fixture, 'submit').length, 1);
});

test('a preparation failure creates no request identity and permits correcting the photo', async () => {
  const fixture = harness({ prepareFailure: async (_file, attempt) => { if (attempt === 1) throw new Error('Synthetic invalid image'); } });
  await assert.rejects(fixture.manager.submit(person(), photo()), /invalid image/);
  assert.equal(fixture.ids.length, 0);
  assert.equal(fixture.calls.length, 0);
  await fixture.manager.submit(person(), photo());
  assert.equal(fixture.ids.length, 1);
  assert.equal(fixture.prepares, 2);
});

test('waits at least 1050 ms after challenge receipt using only the monotonic clock', async (context) => {
  context.mock.method(Date, 'now', () => { throw new Error('Absolute wall clock must not control submission timing'); });
  for (const [solveDuration, expectedWait] of [[0, 1050], [100, 950], [1049, 1], [1500, 0]]) {
    const fixture = harness({ solveDuration, initialTime: 9_999_999 });
    await fixture.manager.submit(person(), null);
    assert.deepEqual(fixture.waits, [expectedWait]);
    assert.ok(solveDuration + fixture.waits[0] >= 1050);
  }
});
