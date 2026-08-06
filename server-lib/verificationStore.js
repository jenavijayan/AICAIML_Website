const verificationStore = new Map();

export function setVerificationCode(email, code, ttlMs = 10 * 60 * 1000) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) return;
  verificationStore.set(cleanEmail, {
    code: String(code || '').trim(),
    expiresAt: Date.now() + ttlMs
  });
}

export function consumeVerificationCode(email, code) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanCode = String(code || '').trim();
  if (!cleanEmail || !cleanCode) {
    return { ok: false, error: 'Email and code are required.' };
  }

  const record = verificationStore.get(cleanEmail);
  if (!record) {
    return { ok: false, error: 'No verification request found. Please request a new code.' };
  }

  if (Date.now() > Number(record.expiresAt || 0)) {
    verificationStore.delete(cleanEmail);
    return { ok: false, error: 'Verification code expired. Please request a new code.' };
  }

  if (record.code !== cleanCode) {
    return { ok: false, error: 'Invalid verification code.' };
  }

  verificationStore.delete(cleanEmail);
  return { ok: true };
}
