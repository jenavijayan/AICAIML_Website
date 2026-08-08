import { supabase, SUPABASE_ENABLED } from './supabaseClient.js';

const inMemoryStore = new Map();
const inMemoryVerified = new Set();

const TTL_MS = 10 * 60 * 1000;

function cleanEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function ensureRow(email) {
  if (!SUPABASE_ENABLED || !supabase) return null;
  const clean = cleanEmail(email);
  const { data, error } = await supabase
    .from('verification_codes')
    .select('*')
    .eq('email', clean)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('verification_codes query error:', error);
  }
  return data || null;
}

async function upsertRow(email, code, ttlMs = TTL_MS) {
  if (!SUPABASE_ENABLED || !supabase) return;
  const clean = cleanEmail(email);
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  const { error } = await supabase
    .from('verification_codes')
    .upsert(
      { email: clean, code: String(code).trim(), expires_at: expiresAt, verified: false },
      { onConflict: 'email' }
    );

  if (error) {
    console.error('verification_codes upsert error:', error);
  }
}

export function setVerificationCode(email, code, ttlMs = TTL_MS) {
  const clean = cleanEmail(email);
  if (!clean) return;
  inMemoryStore.set(clean, {
    code: String(code || '').trim(),
    expiresAt: Date.now() + ttlMs
  });
  upsertRow(clean, code, ttlMs);
}

export async function consumeVerificationCode(email, code) {
  const clean = cleanEmail(email);
  const cleanCode = String(code || '').trim();
  if (!clean || !cleanCode) {
    return { ok: false, error: 'Email and code are required.' };
  }

  const row = await ensureRow(clean);
  if (row && row.verified) {
    return { ok: false, error: 'Email is already verified.' };
  }

  if (row) {
    const expiresAt = Number(row.expires_at || 0);
    if (expiresAt && Date.now() > expiresAt) {
      await supabase.from('verification_codes').delete().eq('email', clean);
      inMemoryStore.delete(clean);
      return { ok: false, error: 'Verification code expired. Please request a new one.' };
    }
    if (row.code !== cleanCode) {
      return { ok: false, error: 'Invalid verification code.' };
    }
    await supabase.from('verification_codes').update({ verified: true }).eq('email', clean);
    inMemoryStore.delete(clean);
    return { ok: true };
  }

  const record = inMemoryStore.get(clean);
  if (!record) {
    return { ok: false, error: 'No verification request found. Please request a code first.' };
  }
  if (Date.now() > Number(record.expiresAt || 0)) {
    inMemoryStore.delete(clean);
    return { ok: false, error: 'Verification code expired. Please request a new one.' };
  }
  if (record.code !== cleanCode) {
    return { ok: false, error: 'Invalid verification code.' };
  }
  inMemoryStore.delete(clean);
  return { ok: true };
}

export async function isEmailVerified(email) {
  const clean = cleanEmail(email);
  if (!clean) return false;
  if (inMemoryVerified.has(clean)) return true;

  if (SUPABASE_ENABLED && supabase) {
    const row = await ensureRow(clean);
    if (row && row.verified) {
      inMemoryVerified.add(clean);
      return true;
    }
  }
  return false;
}

export async function markEmailVerified(email) {
  const clean = cleanEmail(email);
  if (!clean) return;
  inMemoryVerified.add(clean);
  if (SUPABASE_ENABLED && supabase) {
    await supabase
      .from('verification_codes')
      .update({ verified: true })
      .eq('email', clean);
  }
}
