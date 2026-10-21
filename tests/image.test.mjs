import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sanitizeJpeg, decodePhoto } from '../supabase/functions/_shared/image.js';
import { MAX_PHOTO_BYTES } from '../supabase/functions/_shared/validation.js';

// Public repository illustration. No patient data or network requests are used.
const original = new Uint8Array(readFileSync(new URL('../src/assets/img/foto1.jpg', import.meta.url)));
const clean = sanitizeJpeg(original);
const encoder = new TextEncoder();

function join(...parts) {
  const bytes = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
  let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.length; }
  return bytes;
}

function segment(marker, payload) {
  const length = payload.length + 2;
  return join(Uint8Array.from([255, marker, length >> 8, length & 255]), payload);
}

function headerSegments(bytes) {
  const result = [];
  let position = 2;
  while (position < bytes.length) {
    const start = position;
    assert.equal(bytes[position++], 255);
    while (bytes[position] === 255) position++;
    const marker = bytes[position++];
    const lengthPosition = position;
    const length = (bytes[position] << 8) | bytes[position + 1];
    result.push({ marker, start, lengthPosition, end: position + length });
    if (marker === 218 || marker === 217) break;
    position += length;
  }
  return result;
}

const frame = headerSegments(original).find(({ marker }) => [192, 193, 194].includes(marker));
const scan = headerSegments(original).find(({ marker }) => marker === 218);
const base64 = (bytes) => Buffer.from(bytes).toString('base64');

function withDimensions(width, height) {
  const bytes = original.slice();
  bytes[frame.lengthPosition + 3] = height >> 8;
  bytes[frame.lengthPosition + 4] = height & 255;
  bytes[frame.lengthPosition + 5] = width >> 8;
  bytes[frame.lengthPosition + 6] = width & 255;
  return bytes;
}

test('sanitizes the real public JPEG while preserving its frame and scan and is idempotent', () => {
  assert.ok(clean.length > 0 && clean.length < original.length);
  assert.deepEqual([...clean.slice(0, 2)], [255, 216]);
  assert.deepEqual([...clean.slice(-2)], [255, 217]);
  const headers = headerSegments(clean);
  assert.ok(headers.some(({ marker }) => [192, 193, 194].includes(marker)));
  assert.ok(headers.some(({ marker }) => marker === 218));
  assert.equal(headers.some(({ marker }) => marker >= 224 && marker <= 239), false);
  assert.deepEqual(sanitizeJpeg(clean), clean);
  assert.deepEqual(decodePhoto({ type: 'image/jpeg', base64: base64(original) }), clean);
});

test('strips every APP metadata marker, synthetic EXIF/GPS metadata and JPEG comments', () => {
  const metadata = [];
  for (let marker = 224; marker <= 239; marker++) {
    metadata.push(segment(marker, encoder.encode(marker === 225 ? 'Exif\u0000\u0000SYNTHETIC-GPS-METADATA' : 'SYNTHETIC-APP-' + marker)));
  }
  metadata.push(segment(254, encoder.encode('SYNTHETIC-COMMENT-DO-NOT-RETAIN')));
  const decorated = join(original.slice(0, 2), ...metadata, original.slice(2));
  assert.deepEqual(sanitizeJpeg(decorated), clean);
  assert.deepEqual(decodePhoto({ type: 'image/jpeg', base64: base64(decorated) }), clean);
});

test('strips metadata after a scan and removes any payload appended after EOI', () => {
  const appended = encoder.encode('<script>SYNTHETIC-APPENDED-PAYLOAD</script>');
  assert.deepEqual(sanitizeJpeg(join(original, appended)), clean);
  const afterScan = join(original.slice(0, -2), segment(254, encoder.encode('SYNTHETIC-POST-SCAN-COMMENT')), original.slice(-2), appended);
  assert.deepEqual(sanitizeJpeg(afterScan), clean);
});

test('rejects missing JPEG magic, truncated streams and corrupted segment lengths', () => {
  for (const bytes of [new Uint8Array(), original.slice(0, 10), original.slice(0, -1), original.slice(0, -2), original.slice(0, scan.end + 10)]) {
    assert.throws(() => sanitizeJpeg(bytes));
  }
  const badMagic = original.slice();
  badMagic[1] = 217;
  assert.throws(() => sanitizeJpeg(badMagic));
  const badLength = original.slice();
  badLength[frame.lengthPosition] = 255;
  badLength[frame.lengthPosition + 1] = 255;
  assert.throws(() => sanitizeJpeg(badLength));
  const shortFrame = original.slice();
  shortFrame[frame.lengthPosition] = 0;
  shortFrame[frame.lengthPosition + 1] = 2;
  assert.throws(() => sanitizeJpeg(shortFrame));
  assert.throws(() => sanitizeJpeg([...original]));
});

test('rejects unsupported markers, duplicate frames, a scan without a frame and a frame without a scan', () => {
  const unsupported = original.slice();
  unsupported[frame.start + 1] = 195;
  assert.throws(() => sanitizeJpeg(unsupported));
  const duplicate = join(original.slice(0, frame.end), original.slice(frame.start, frame.end), original.slice(frame.end));
  assert.throws(() => sanitizeJpeg(duplicate));
  const missingFrame = join(original.slice(0, frame.start), original.slice(frame.end));
  assert.throws(() => sanitizeJpeg(missingFrame));
  const missingScan = join(original.slice(0, scan.start), Uint8Array.from([255, 217]));
  assert.throws(() => sanitizeJpeg(missingScan));
});

test('rejects zero dimensions, either dimension above 4096 and decompression sizes above eight million pixels', () => {
  for (const [width, height] of [[0, 100], [100, 0], [4097, 1], [1, 4097], [3000, 3000]]) {
    assert.throws(() => sanitizeJpeg(withDimensions(width, height)), /resolução/);
  }
});

test('enforces the decoded byte boundary and never retains trailing data at the limit', () => {
  const atLimit = new Uint8Array(MAX_PHOTO_BYTES);
  atLimit.set(original);
  assert.deepEqual(sanitizeJpeg(atLimit), clean);
  const tooLarge = new Uint8Array(MAX_PHOTO_BYTES + 1);
  tooLarge.set(original);
  assert.throws(() => sanitizeJpeg(tooLarge), /3 MB/);
});

test('rejects MIME mismatches, other binary formats and malformed photo object types', () => {
  for (const photo of [null, [], {}, { type: 'image/png', base64: base64(original) }, { type: 'IMAGE/JPEG', base64: base64(original) }, { type: 'image/jpeg', base64: [] }]) {
    assert.throws(() => decodePhoto(photo));
  }
  const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
  assert.throws(() => decodePhoto({ type: 'image/jpeg', base64: base64(png) }));
});

test('rejects malformed, prefixed and oversized base64 before accepting photo bytes', () => {
  for (const value of ['', 'A', 'A===', '===', 'A=AA', 'base64!invalid', 'data:image/jpeg;base64,' + base64(original), base64(original) + '\n']) {
    assert.throws(() => decodePhoto({ type: 'image/jpeg', base64: value }));
  }
  const maximumEncodedLength = Math.ceil(MAX_PHOTO_BYTES / 3) * 4;
  assert.throws(() => decodePhoto({ type: 'image/jpeg', base64: 'A'.repeat(maximumEncodedLength + 4) }));
});
