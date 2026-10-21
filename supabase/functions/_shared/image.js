import { MAX_PHOTO_BYTES } from './validation.js';

// Only JPEG reaches the server: the browser decodes PNG/WebP/JPEG and re-encodes
// to JPEG. Validate structure/dimensions and strip all APP/COM metadata again here,
// so direct API calls cannot retain EXIF, GPS, thumbnails, or appended payloads.
export function sanitizeJpeg(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 12 || bytes.length > MAX_PHOTO_BYTES || bytes[0] !== 255 || bytes[1] !== 216) throw new Error('A foto deve ser uma imagem JPG válida de até 3 MB.');
  const parts = [bytes.slice(0, 2)];
  let pos = 2;
  let frame = false;
  let scan = false;
  let entropy = false;
  while (pos < bytes.length) {
    if (entropy) {
      const start = pos;
      while (pos < bytes.length) {
        if (bytes[pos] !== 255) { pos++; continue; }
        const next = bytes[pos + 1];
        if (next === 0 || (next >= 208 && next <= 215)) { pos += 2; continue; }
        break;
      }
      parts.push(bytes.slice(start, pos));
      entropy = false;
    }
    const start = pos;
    if (bytes[pos++] !== 255) throw new Error('Estrutura da foto inválida.');
    while (bytes[pos] === 255) pos++;
    const marker = bytes[pos++];
    if (marker === 217) {
      if (!frame || !scan) throw new Error('Foto incompleta.');
      parts.push(new Uint8Array([255, 217]));
      const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
      let offset = 0;
      for (const part of parts) { result.set(part, offset); offset += part.length; }
      return result;
    }
    if (![192, 193, 194, 196, 219, 221, 218, 254].includes(marker) && !(marker >= 224 && marker <= 239)) throw new Error('Formato JPG não suportado.');
    if (pos + 2 > bytes.length) throw new Error('Foto incompleta.');
    const length = (bytes[pos] << 8) | bytes[pos + 1];
    if (length < 2 || pos + length > bytes.length) throw new Error('Foto incompleta.');
    if ([192, 193, 194].includes(marker)) {
      if (frame || length < 11) throw new Error('Estrutura da foto inválida.');
      const height = (bytes[pos + 3] << 8) | bytes[pos + 4];
      const width = (bytes[pos + 5] << 8) | bytes[pos + 6];
      if (!width || !height || width > 4096 || height > 4096 || width * height > 8_000_000) throw new Error('A resolução da foto é muito alta.');
      frame = true;
    }
    if (marker === 218) {
      if (!frame) throw new Error('Estrutura da foto inválida.');
      scan = true;
      entropy = true;
    }
    if (!(marker >= 224 && marker <= 239) && marker !== 254) parts.push(bytes.slice(start, pos + length));
    pos += length;
  }
  throw new Error('Foto incompleta.');
}
export function decodePhoto(photo) {
  if (!photo || typeof photo !== 'object' || photo.type !== 'image/jpeg' || typeof photo.base64 !== 'string' || photo.base64.length > Math.ceil(MAX_PHOTO_BYTES / 3) * 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(photo.base64)) throw new Error('Foto inválida.');
  let raw;
  try { raw = atob(photo.base64); } catch { throw new Error('Foto inválida.'); }
  return sanitizeJpeg(Uint8Array.from(raw, (value) => value.charCodeAt(0)));
}
