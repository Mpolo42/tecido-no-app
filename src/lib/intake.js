import { supabase } from '../supabaseClient';
import { validatePhoto } from './validation';
import { hasProof } from '../../supabase/functions/_shared/security';
import { createSubmissionManager } from './submission';

async function invoke(body) {
  const { data, error } = await supabase.functions.invoke('patient-intake', { body });
  if (error) {
    let message = 'Não foi possível enviar o cadastro. Confira sua conexão e tente novamente.';
    try { message = (await error.context?.json())?.message || message; } catch { /* Keep safe fallback. */ }
    throw new Error(message);
  }
  if (!data?.ok && body.action !== 'challenge') throw new Error(data?.message || 'Não foi possível concluir o cadastro.');
  return data;
}
async function solve(challenge, onProgress) {
  const encoder = new TextEncoder();
  const started = performance.now();
  for (let proof = 0; proof <= 10_000_000; proof++) {
    if (performance.now() - started > 240_000) throw new Error('A verificação demorou demais. Tente novamente.');
    const digest = await crypto.subtle.digest('SHA-256', encoder.encode(challenge.nonce + ':' + proof));
    if (hasProof(new Uint8Array(digest), challenge.difficulty)) return proof;
    if (proof % 500 === 0) { onProgress?.('Verificando envio seguro…'); await new Promise((resolve) => setTimeout(resolve, 0)); }
  }
  throw new Error('Não foi possível verificar o envio. Tente novamente.');
}
async function encodePhoto(file) {
  if (!file) return null;
  const problem = validatePhoto(file);
  if (problem) throw new Error(problem);
  const image = await createImageBitmap(file);
  try {
    if (image.width * image.height > 40_000_000) throw new Error('A imagem tem resolução muito alta. Envie uma foto menor.');
    const scale = Math.min(1, 2048 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob || blob.size > 3 * 1024 * 1024) throw new Error('Não foi possível preparar a foto. Tente uma imagem menor.');
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let raw = '';
    for (let start = 0; start < bytes.length; start += 8192) raw += String.fromCharCode(...bytes.subarray(start, start + 8192));
    return { type: 'image/jpeg', base64: btoa(raw) };
  } finally { image.close(); }
}
const manager = createSubmissionManager({ invoke, preparePhoto: encodePhoto, solve });
export const submitPatient = manager.submit;
