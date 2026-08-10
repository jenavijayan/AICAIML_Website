import {
  SESSION_COOKIE,
  FALLBACK_USER_ID,
  getFallbackUser,
  getSupabaseUser,
  createSupabaseSession,
  createSignedSessionToken,
  seedDevUser,
  parseJsonBody,
  hashPassword
} from '../../server-lib/authFallback.js';
import { supabase, SUPABASE_ENABLED } from '../../server-lib/supabaseClient.js';

const FALLBACK_AUTH_EMAIL = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const FALLBACK_AUTH_PASSWORD = String(process.env.ADMIN_PASSWORD || '').trim();

function canAttemptBootstrapAdminRepair(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '').trim();
  if (!normalizedEmail || !normalizedPassword) return false;
  return normalizedEmail === String(FALLBACK_AUTH_EMAIL || '').trim().toLowerCase() && normalizedPassword === String(FALLBACK_AUTH_PASSWORD || '').trim();
}

function isMissingColumnError(error, columnName) {
  if (!error) return false;
  return String(error.message || '').toLowerCase().includes(String(columnName || '').toLowerCase());
}

function buildBootstrapAdminUser() {
  return {
    id: FALLBACK_USER_ID || 'user-dev-001',
    name: 'Admin User',
    email: String(FALLBACK_AUTH_EMAIL || '').trim().toLowerCase(),
    role: 'admin',
    membershipPlan: 'Premium',
    membershipStatus: 'active',
    permissions: [
      'access_premium_courses',
      'access_course_videos',
      'access_downloadable_resources',
      'access_quizzes',
      'access_certificates',
      'access_members_only_pages'
    ]
  };
}

async function repairBootstrapAdminPassword(email, password) {
  if (!SUPABASE_ENABLED || !supabase) return false;

  const normalizedEmail = String(email || '').trim().toLowerCase();
  let query = await supabase
    .from('users')
    .select('id, role')
    .eq('email', normalizedEmail)
    .order('created_at', { ascending: false })
    .limit(20);

  if (query.error && isMissingColumnError(query.error, 'created_at')) {
    query = await supabase
      .from('users')
      .select('id, role')
      .eq('email', normalizedEmail)
      .limit(20);
  }

  const rows = query.data;
  const error = query.error;
  if (error || !Array.isArray(rows) || rows.length === 0) return false;

  const adminIds = rows
    .filter((row) => String(row.role || '').toLowerCase() === 'admin' && row.id)
    .map((row) => row.id);
  if (adminIds.length === 0) return false;

  const { hash, salt } = hashPassword(password);
  const update = await supabase.from('users').update({
    password_hash: hash,
    password_salt: salt,
    updated_at: new Date().toISOString()
  }).in('id', adminIds);

  return !update.error;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const body = await parseJsonBody(req);
    const { email, password } = body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    let user = await getSupabaseUser(email, password);
    if (!user) {
      // If the deployment has Supabase enabled but the default admin row was
      // never seeded, try a one-time seed and retry before failing auth.
      await seedDevUser();
      user = await getSupabaseUser(email, password);
    }
    if (!user && canAttemptBootstrapAdminRepair(email, password)) {
      const repaired = await repairBootstrapAdminPassword(email, password);
      if (repaired) {
        user = await getSupabaseUser(email, password);
      }
    }
    if (!user) {
      user = getFallbackUser(email, password);
    }
    if (!user && canAttemptBootstrapAdminRepair(email, password)) {
      // Break-glass path for deployments where database auth state is inconsistent.
      // This is restricted to the configured bootstrap admin credentials only.
      user = buildBootstrapAdminUser();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
      const token = createSignedSessionToken(user);
      const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Expires=${expiresAt}; SameSite=Lax${secure}`);
      return res.status(200).json({ success: true, user, warning: 'Signed fallback session issued due auth store inconsistency.' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const { token, expiresAt } = await createSupabaseSession(user.id);
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Expires=${expiresAt}; SameSite=Lax${secure}`);
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Unable to process login request.' });
  }
};
