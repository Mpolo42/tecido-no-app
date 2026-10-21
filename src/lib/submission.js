// Retain the request identity in memory until confirmation. No patient fields,
// photos or credentials are written to browser storage.
export function createSubmissionManager({ invoke, preparePhoto, solve, uuid = () => crypto.randomUUID(), now = () => performance.now(), wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) }) {
  let pending = null;
  return {
    async submit(patient, photo, website = '', onProgress) {
      const signature = JSON.stringify({ patient, website });
      if (pending?.token) {
        const receipt = await invoke({ action: 'status', token: pending.token, proof: pending.proof });
        if (receipt.state === 'completed') {
          const same = pending.signature === signature && pending.photo === photo;
          pending = null;
          if (same) return { ok: true, alreadyReceived: true };
          throw new Error('O envio anterior foi confirmado. Os dados atuais ainda não foram enviados; revise-os e clique novamente para iniciar outro cadastro.');
        }
        if (receipt.state === 'pending') throw new Error('O envio anterior ainda está sendo processado. Aguarde e tente confirmar novamente.');
      }
      if (pending && (pending.signature !== signature || pending.photo !== photo)) {
        throw new Error('Existe um envio sem confirmação. Mantenha os dados anteriores e tente confirmar novamente antes de iniciar outro cadastro.');
      }
      if (!pending) {
        onProgress?.('Preparando envio…');
        const prepared = await preparePhoto(photo);
        pending = { id: uuid(), signature, photo, prepared, token: null, proof: null };
      }
      // Reissued challenges keep the SAME request ID, even if the previous
      // request is delayed or its response was lost. SQL enforces uniqueness.
      const challenge = await invoke({ action: 'challenge', requestId: pending.id });
      const started = now();
      onProgress?.('Verificando envio seguro…');
      pending.proof = await solve(challenge, onProgress);
      pending.token = challenge.token;
      await wait(Math.max(0, 1050 - (now() - started)));
      onProgress?.('Enviando cadastro…');
      const result = await invoke({ action: 'submit', patient, photo: pending.prepared, website, token: pending.token, proof: pending.proof });
      pending = null;
      return result;
    },
  };
}
