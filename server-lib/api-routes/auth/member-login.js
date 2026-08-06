import { supabase, SUPABASE_ENABLED } from '../../supabaseClient.js';
import {
  SESSION_COOKIE,
  parseJsonBody,
  createSupabaseSession,
  toPublicUser,
  verifyPassword
} from '../../authFallback.js';

function normalizeIdentifier(value) {
  return String(value || '').trim();
}

function nowIso() {
  return new Date().toISOString();
}

function sanitizeIdentifier(identifier) {
  const raw = String(identifier || '').trim().toLowerCase();
  if (!raw) return null;
  if (!raw.includes('@')) return null;
  const [local, domain] = raw.split('@');
  if (!local || !domain) return null;
  const maskedLocal = local.length <= 2 ? `${local[0] || '*'}*` : `${local.slice(0, 2)}***`;
  return `${maskedLocal}@${domain}`;
}

function authLog(level, event, details) {
  const payload = {
    timestamp: nowIso(),
    endpoint: '/api/auth/member/login',
    event,
    ...details
  };
  if (level === 'error') {
    console.error('[auth.member.login]', JSON.stringify(payload));
    return;
  }
  console.log('[auth.member.login]', JSON.stringify(payload));
}

function statusMessageForApplication(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'pending') {
    return 'Your application is still pending review. You can sign in after approval.';
  }
  if (normalized === 'rejected') {
    return 'Your previous application was rejected. Please submit a new application to continue.';
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (!SUPABASE_ENABLED || !supabase) {
    return res.status(500).json({ error: 'Supabase is not configured on this deployment.' });
  }

  try {
    const startedAt = Date.now();
    const body = await parseJsonBody(req);
    const identifier = normalizeIdentifier(body.identifier || body.email || body.memberId);
    const password = String(body.password || '');
    const emailHint = sanitizeIdentifier(identifier);

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password are required.' });
    }

    const isEmail = identifier.includes('@');
    let userRow = null;

    if (isEmail) {
      const query = await supabase.from('users').select('*').eq('email', identifier.toLowerCase()).maybeSingle();
      if (query.error) {
        authLog('error', 'user_query_failed', {
          stage: 'users_by_email',
          emailHint,
          durationMs: Date.now() - startedAt,
          error: query.error.message
        });
        return res.status(500).json({ error: query.error.message });
      }
      userRow = query.data;
    } else {
      const query = await supabase.from('users').select('*').eq('membership_no', identifier.toUpperCase()).maybeSingle();
      if (query.error) {
        authLog('error', 'user_query_failed', {
          stage: 'users_by_membership_no',
          durationMs: Date.now() - startedAt,
          error: query.error.message
        });
        return res.status(500).json({ error: query.error.message });
      }
      userRow = query.data;
    }

    if (!userRow) {
      if (isEmail) {
        const applicationQuery = await supabase
          .from('applications')
          .select('status')
          .eq('email', identifier.toLowerCase())
          .order('submitted_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!applicationQuery.error && applicationQuery.data) {
          const message = statusMessageForApplication(applicationQuery.data.status);
          if (message) {
            return res.status(403).json({
              error: message,
              status: String(applicationQuery.data.status || '').toLowerCase()
            });
          }
        }
      }

      return res.status(401).json({ error: 'Invalid member credentials.' });
    }

    if (String(userRow.role || '').toLowerCase() !== 'member') {
      return res.status(403).json({ error: 'This account is not a member account.' });
    }

    const membershipStatus = String(userRow.membership_status || '').toLowerCase();
    if (membershipStatus && membershipStatus !== 'active') {
      return res.status(403).json({
        error: 'Your membership is not active yet. Please contact support if you believe this is an error.',
        status: membershipStatus
      });
    }

    // Enforce setup gate before password verification to avoid crashes on
    // records that are intentionally pending password setup.
    if (userRow.must_reset_password) {
      return res.status(403).json({
        error: 'Password setup is required before first sign-in. Please use the link sent to your email.',
        code: 'PASSWORD_SETUP_REQUIRED'
      });
    }

    const passwordHash = userRow.password_hash;
    const passwordSalt = userRow.password_salt;
    if (typeof passwordHash !== 'string' || typeof passwordSalt !== 'string' || !passwordHash || !passwordSalt) {
      authLog('error', 'invalid_auth_record', {
        emailHint,
        memberId: userRow.membership_no || null,
        userId: userRow.id || null,
        reason: 'missing_password_hash_or_salt',
        durationMs: Date.now() - startedAt
      });
      return res.status(403).json({
        error: 'This member account is not fully configured for password login yet. Please use Set Password or contact support.',
        code: 'ACCOUNT_SETUP_REQUIRED'
      });
    }

    let passwordValid = false;
    try {
      passwordValid = verifyPassword(password, passwordHash, passwordSalt);
    } catch (verifyError) {
      authLog('error', 'password_verify_exception', {
        emailHint,
        memberId: userRow.membership_no || null,
        userId: userRow.id || null,
        durationMs: Date.now() - startedAt,
        error: verifyError instanceof Error ? verifyError.message : String(verifyError),
        stack: verifyError instanceof Error ? verifyError.stack : undefined
      });
      return res.status(403).json({
        error: 'This member account is not fully configured for password login yet. Please use Set Password or contact support.',
        code: 'ACCOUNT_SETUP_REQUIRED'
      });
    }

    if (!passwordValid) {
      authLog('info', 'invalid_password', {
        emailHint,
        memberId: userRow.membership_no || null,
        userId: userRow.id || null,
        durationMs: Date.now() - startedAt
      });
      return res.status(401).json({ error: 'Invalid member credentials.' });
    }

    const { token, expiresAt } = await createSupabaseSession(userRow.id);
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Expires=${expiresAt}; SameSite=Lax${secure}`);
    authLog('info', 'login_success', {
      emailHint,
      memberId: userRow.membership_no || null,
      userId: userRow.id || null,
      durationMs: Date.now() - startedAt
    });
    return res.status(200).json({ success: true, user: toPublicUser(userRow) });
  } catch (error) {
    authLog('error', 'unhandled_exception', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return res.status(500).json({ error: 'Unable to process member login.' });
  }
}
