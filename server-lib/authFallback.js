import crypto from 'crypto';
import { supabase, SUPABASE_ENABLED } from './supabaseClient.js';

const FALLBACK_AUTH_EMAIL = (process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || 'vendhanftpwatch@gmail.com').trim().toLowerCase();
const FALLBACK_AUTH_PASSWORD = (process.env.ADMIN_PASSWORD || 'vendhan123').trim();
const EXEMPT_ADMIN_EMAIL = 'vendhanftpwatch@gmail.com';
const FALLBACK_AUTH_SECRET = process.env.AUTH_SESSION_SECRET || 'aicaiml-dev-session-secret';
const SESSION_COOKIE = 'aicaiml_session';
const FALLBACK_USER_ID = 'user-dev-001';
const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();

function getFallbackUser(email, password, id) {
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

function toPublicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    membershipPlan: row.membership_plan,
    membershipStatus: row.membership_status,
    permissions: Array.isArray(row.permissions) ? row.permissions : (() => { try { return JSON.parse(row.permissions || '[]'); } catch { return []; } })(),
    photoUrl: row.photo_url || undefined,
    membershipNo: row.membership_no || undefined
  };
}

async function seedDevUser() {
  if (!SUPABASE_ENABLED || !supabase) return null;
  const { data: byId } = await supabase.from('users').select('*').eq('id', FALLBACK_USER_ID);
  const existingById = Array.isArray(byId) && byId.length > 0 ? byId[0] : null;
  if (existingById) return toPublicUser(existingById);
  const { data: byEmail } = await supabase.from('users').select('*').eq('email', FALLBACK_AUTH_EMAIL);
  if (byEmail && byEmail.length > 0) return toPublicUser(byEmail[0]);
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
  const { data, error } = await supabase.from('users').select('*').eq('email', email.toLowerCase().trim()).single();
  if (error || !data) return null;
  if (!verifyPassword(password, data.password_hash, data.password_salt)) return null;
  return toPublicUser(data);
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

async function verifyGoogleToken(idToken) {
  if (!GOOGLE_CLIENT_ID) {
    console.warn('GOOGLE_CLIENT_ID is not set — Google login is disabled.');
    return null;
  }
  try {
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.email_verified) return null;
    return {
      email: payload.email,
      name: payload.name || '',
      picture: payload.picture || '',
      googleId: payload.sub
    };
  } catch (err) {
    console.error('Google token verification failed:', err.message);
    return null;
  }
}

async function getOrCreateGoogleUser(info) {
  if (!SUPABASE_ENABLED || !supabase) return null;
  const normalizedEmail = info.email.toLowerCase().trim();

  // 1. Check by google_id
  const { data: byGoogleId } = await supabase.from('users').select('*').eq('google_id', info.googleId).maybeSingle();
  if (byGoogleId) return toPublicUser(byGoogleId);

  // 2. Check by email
  const { data: byEmail } = await supabase.from('users').select('*').eq('email', normalizedEmail).maybeSingle();
  if (byEmail) {
    if (!byEmail.google_id) {
      await supabase.from('users').update({ google_id: info.googleId, photo_url: byEmail.photo_url || info.picture }).eq('email', normalizedEmail);
    }
    return toPublicUser(byEmail);
  }

  // 3. Check for approved application
  const { data: approvedApp } = await supabase
    .from('applications')
    .select('*')
    .eq('email', normalizedEmail)
    .eq('status', 'Approved')
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!approvedApp) return null;

  // 4. Create member user from approved application
  const userId = 'mem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
  const formData = approvedApp.form_data || {};
  const memberName =
    formData.studentName ||
    formData.applicantName ||
    formData.authorizedRepresentativeName ||
    formData.institutionName ||
    formData.universityName ||
    info.name;

  const { data, error } = await supabase.from('users').insert({
    id: userId,
    name: memberName,
    email: normalizedEmail,
    email_verified: true,
    password_hash: null,
    password_salt: null,
    google_id: info.googleId,
    role: 'member',
    membership_plan: approvedApp.category || null,
    membership_no: approvedApp.membership_no || null,
    membership_status: 'active',
    permissions: ['access_premium_courses', 'access_course_videos', 'access_downloadable_resources', 'access_quizzes', 'access_certificates', 'access_members_only_pages'],
    photo_url: info.picture,
    must_reset_password: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }).select('*').single();
  if (error) {
    console.error('Failed to create Google member user:', error);
    return null;
  }
   return toPublicUser(data);
}

async function resetTestAccount(email) {
   if (!SUPABASE_ENABLED || !supabase) return { success: false, error: 'Supabase is not configured.' };
   const normalizedEmail = String(email || '').trim().toLowerCase();
   if (!normalizedEmail) return { success: false, error: 'Email is required.' };

   try {
     const { data: userRows } = await supabase.from('users').select('id').eq('email', normalizedEmail);
     if (userRows && userRows.length > 0) {
       const userIds = userRows.map((u) => u.id);
       await supabase.from('sessions').delete().in('user_id', userIds);
       await supabase.from('certificates').delete().in('user_id', userIds);
       await supabase.from('enrollments').delete().in('user_id', userIds);
     }
     await supabase.from('users').delete().eq('email', normalizedEmail);
     await supabase.from('applications').delete().eq('email', normalizedEmail);
     await supabase.from('enquiries').delete().eq('email', normalizedEmail);
     await supabase.from('event_registrations').delete().eq('email', normalizedEmail);
     await supabase.from('memberships').delete().eq('email', normalizedEmail);
     return { success: true };
   } catch (err) {
     console.error('resetTestAccount error:', err);
     return { success: false, error: err.message || 'Failed to reset test account.' };
   }
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
   SUPABASE_ENABLED,
   GOOGLE_CLIENT_ID,
   verifyGoogleToken,
   getOrCreateGoogleUser,
   resetTestAccount
 };

