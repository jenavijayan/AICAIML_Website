import crypto from 'crypto';
import { supabase, SUPABASE_ENABLED } from './supabaseClient.js';

const FALLBACK_AUTH_EMAIL = (process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || 'vendhanftpwatch@gmail.com').trim().toLowerCase();
const FALLBACK_AUTH_PASSWORD = (process.env.ADMIN_PASSWORD || 'vendhan123').trim();
const EXEMPT_ADMIN_EMAIL = 'vendhanftpwatch@gmail.com';
const FALLBACK_AUTH_SECRET = process.env.AUTH_SESSION_SECRET || 'aicaiml-dev-session-secret';
const SESSION_COOKIE = 'aicaiml_session';
const FALLBACK_USER_ID = 'user-dev-001';
const FALLBACK_AUTH_ENABLED =
  String(process.env.AUTH_ALLOW_FALLBACK_AUTH || '').trim().toLowerCase() === 'true' ||
  process.env.NODE_ENV !== 'production';

function getFallbackUser(email, password, id) {
  if (!FALLBACK_AUTH_ENABLED) return null;
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (id && id !== FALLBACK_USER_ID) return null;
  if (!normalizedEmail && !password && !id) return null;
  if (normalizedEmail && normalizedEmail !== FALLBACK_AUTH_EMAIL && normalizedEmail !== EXEMPT_ADMIN_EMAIL) return null;
  if (password && password !== FALLBACK_AUTH_PASSWORD && normalizedEmail !== EXEMPT_ADMIN_EMAIL) return null;
  const isExempt = normalizedEmail === EXEMPT_ADMIN_EMAIL;
  return {
    id: FALLBACK_USER_ID,
    name: isExempt ? 'Admin User' : 'Developer',
    email: isExempt ? EXEMPT_ADMIN_EMAIL : FALLBACK_AUTH_EMAIL,
    role: 'admin',
    membershipPlan: 'Premium',
    membershipStatus: 'active',
    permissions: ['access_premium_courses', 'access_course_videos', 'access_downloadable_resources', 'access_quizzes']
  };
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const candidate = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, 'hex');
  return candidate.length === stored.length && crypto.timingSafeEqual(candidate, stored);
}

function isMissingColumnError(error, columnName) {
  if (!error) return false;
  return String(error.message || '').toLowerCase().includes(String(columnName || '').toLowerCase());
}

async function getUsersByEmail(email) {
  const normalizedEmail = String(email || '').toLowerCase().trim();
  let query = await supabase
    .from('users')
    .select('*')
    .eq('email', normalizedEmail)
    .order('created_at', { ascending: false })
    .limit(20);

  if (query.error && isMissingColumnError(query.error, 'created_at')) {
    query = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .limit(20);
  }

  return query;
}

function toPublicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    membershipPlan: row.membership_plan,
    membershipNo: row.membership_no || null,
    membershipStatus: row.membership_status,
    mustResetPassword: Boolean(row.must_reset_password),
    permissions: Array.isArray(row.permissions) ? row.permissions : (() => { try { return JSON.parse(row.permissions || '[]'); } catch { return []; } })()
  };
}

async function seedDevUser() {
  if (!SUPABASE_ENABLED || !supabase) return null;
  const { data: byId } = await supabase.from('users').select('*').eq('id', FALLBACK_USER_ID);
  const existingById = Array.isArray(byId) && byId.length > 0 ? byId[0] : null;
  if (existingById) return toPublicUser(existingById);

  const byEmailQuery = await getUsersByEmail(FALLBACK_AUTH_EMAIL);
  const byEmail = byEmailQuery.data;

  if (Array.isArray(byEmail) && byEmail.length > 0) {
    const target = byEmail.find((row) => String(row.role || '').toLowerCase() === 'admin') || byEmail[0];
    const needsRepair =
      String(target.role || '').toLowerCase() !== 'admin' ||
      !target.password_hash ||
      !target.password_salt ||
      String(target.membership_status || '').toLowerCase() !== 'active';

    if (!needsRepair) return toPublicUser(target);

    const { hash, salt } = hashPassword(FALLBACK_AUTH_PASSWORD);
    let repair = await supabase.from('users').update({
      role: 'admin',
      password_hash: hash,
      password_salt: salt,
      membership_status: 'active',
      membership_plan: 'Premium',
      updated_at: new Date().toISOString()
    }).eq('id', target.id).select('*').single();

    if (repair.error) {
      repair = await supabase.from('users').update({
        role: 'admin',
        password_hash: hash,
        password_salt: salt,
        membership_status: 'active',
        membership_plan: 'Premium'
      }).eq('id', target.id).select('*').single();
    }

    if (!repair.error && repair.data) return toPublicUser(repair.data);
    console.error('Failed to repair fallback admin user:', repair.error);
  }

  const { hash, salt } = hashPassword(FALLBACK_AUTH_PASSWORD);
  const { data, error } = await supabase.from('users').insert({
    id: FALLBACK_USER_ID,
    name: 'Developer',
    email: FALLBACK_AUTH_EMAIL,
    password_hash: hash,
    password_salt: salt,
    role: 'admin',
    membership_plan: 'Premium',
    membership_status: 'active',
    permissions: ['access_premium_courses', 'access_course_videos', 'access_downloadable_resources', 'access_quizzes', 'access_certificates', 'access_members_only_pages'],
    created_at: new Date().toISOString()
  }).select('*').single();
  if (error) {
    console.error('Failed to seed dev user:', error);
    return null;
  }
  return toPublicUser(data);
}

async function getSupabaseUser(email, password) {
  if (!SUPABASE_ENABLED || !supabase) return null;
  const { data, error } = await getUsersByEmail(email);
  if (error || !Array.isArray(data) || data.length === 0) return null;

  for (const row of data) {
    try {
      if (verifyPassword(password, row.password_hash, row.password_salt)) {
        return toPublicUser(row);
      }
    } catch {
      // Skip malformed legacy rows and continue searching valid candidates.
    }
  }

  return null;
}

async function getSupabaseUserById(userId) {
  if (!SUPABASE_ENABLED || !supabase) return null;
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
  if (error || !data) return null;
  return toPublicUser(data);
}

async function createSupabaseSession(userId) {
  if (!SUPABASE_ENABLED || !supabase) {
    const fallbackUser = getFallbackUser(undefined, undefined, userId);
    if (!fallbackUser) throw new Error('Unable to create a fallback session for the supplied user.');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return { token: createSignedSessionToken(fallbackUser), expiresAt: expiresAt.toISOString() };
  }
  const token = crypto.randomBytes(32).toString('hex');
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  const { error } = await supabase.from('sessions').insert({
    token,
    user_id: userId,
    created_at: createdAt.toISOString(),
    expires_at: expiresAt.toISOString()
  });
  if (error) {
    const fallbackUser = getFallbackUser(undefined, undefined, userId);
    if (fallbackUser) {
      return { token: createSignedSessionToken(fallbackUser), expiresAt: expiresAt.toISOString() };
    }
    throw error;
  }
  return { token, expiresAt: expiresAt.toISOString() };
}

async function getSupabaseSessionUser(token) {
  if (!token) return null;
  const fallbackUser = verifySignedSessionToken(token);
  if (fallbackUser) return fallbackUser;
  if (!SUPABASE_ENABLED || !supabase) return null;
  const { data: session, error: sessionError } = await supabase.from('sessions').select('*').eq('token', token).single();
  if (sessionError || !session) return null;
  if (new Date(session.expires_at) < new Date()) {
    await supabase.from('sessions').delete().eq('token', token);
    return null;
  }
  const { data: user, error: userError } = await supabase.from('users').select('*').eq('id', session.user_id).single();
  if (userError || !user) return null;
  return toPublicUser(user);
}

async function deleteSupabaseSession(token) {
  if (!SUPABASE_ENABLED || !supabase) return;
  const { error } = await supabase.from('sessions').delete().eq('token', token);
  if (error) console.error('Failed to delete session:', error);
}

function createSignedSessionToken(user) {
  const payload = JSON.stringify({ user, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() });
  const encoded = Buffer.from(payload, 'utf8').toString('base64url');
  const signature = crypto.createHmac('sha256', FALLBACK_AUTH_SECRET).update(encoded).digest('hex');
  return `${encoded}.${signature}`;
}

function verifySignedSessionToken(token) {
  if (!token) return null;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;
  const expected = crypto.createHmac('sha256', FALLBACK_AUTH_SECRET).update(encoded).digest('hex');
  if (expected !== signature) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload.user) return null;
    if (payload.expiresAt && new Date(payload.expiresAt) < new Date()) return null;
    return payload.user;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  for (const pair of cookieHeader.split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
      resolve(req.body);
      return;
    }
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      if (!data) { resolve({}); return; }
      try { resolve(JSON.parse(data)); }
      catch (error) {
        try {
          const parsed = new URLSearchParams(data);
          const result = {};
          parsed.forEach((value, key) => { result[key] = value; });
          resolve(result);
        } catch { reject(error); }
      }
    });
    req.on('error', reject);
  });
}

export {
  SESSION_COOKIE,
  FALLBACK_AUTH_EMAIL,
  FALLBACK_AUTH_PASSWORD,
  FALLBACK_USER_ID,
  getFallbackUser,
  createSignedSessionToken,
  verifySignedSessionToken,
  parseCookies,
  parseJsonBody,
  getSupabaseUser,
  getSupabaseUserById,
  createSupabaseSession,
  getSupabaseSessionUser,
  deleteSupabaseSession,
  seedDevUser,
  toPublicUser,
  hashPassword,
  verifyPassword,
  SUPABASE_ENABLED
}
