import https from 'https';
import { supabase, SUPABASE_ENABLED } from '../../supabaseClient.js';
import {
  SESSION_COOKIE,
  parseJsonBody,
  createSupabaseSession,
  toPublicUser
} from '../../authFallback.js';

function nowIso() {
  return new Date().toISOString();
}

function authLog(level, event, details) {
  const payload = {
    timestamp: nowIso(),
    endpoint: '/api/auth/member/google',
    event,
    ...details
  };
  if (level === 'error') {
    console.error('[auth.member.google]', JSON.stringify(payload));
    return;
  }
  console.log('[auth.member.google]', JSON.stringify(payload));
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

function normalizeIdentifier(value) {
  return String(value || '').trim().toLowerCase();
}

function createSignedSessionForUser(userRow) {
  return createSupabaseSession(userRow.id);
}

async function verifyGoogleIdToken(idToken) {
  const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '').trim();

  if (!idToken) {
    throw new Error('Google ID token is required.');
  }

  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google Client ID is not configured on the server.');
  }

  try {
    const tokenInfoUrl = `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
    const tokenInfo = await new Promise((resolve, reject) => {
      https.get(tokenInfoUrl, { headers: { Accept: 'application/json' } }, (response) => {
        let data = '';
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => {
          try {
            if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
              resolve(JSON.parse(data));
            } else {
              reject(new Error(`Google token verification failed (${response.statusCode})`));
            }
          } catch (err) {
            reject(new Error(`Google token verification failed: ${err.message}`));
          }
        });
      }).on('error', reject);
    });

    if (tokenInfo.aud !== GOOGLE_CLIENT_ID) {
      throw new Error('Google ID token was not issued for this application.');
    }

    if (tokenInfo.exp && Number(tokenInfo.exp) < Math.floor(Date.now() / 1000)) {
      throw new Error('Google ID token has expired.');
    }

    return {
      email: String((tokenInfo.email || '')).toLowerCase().trim(),
      name: tokenInfo.name || tokenInfo.email || '',
      picture: tokenInfo.picture || null,
      sub: tokenInfo.sub || null
    };
  } catch (err) {
    authLog('error', 'google_token_verify_failed', {
      error: err instanceof Error ? err.message : String(err),
      hasClientId: Boolean(GOOGLE_CLIENT_ID)
    });
    throw err;
  }
}

async function lookupMemberByEmail(email) {
  const normalizedEmail = normalizeIdentifier(email);

  const { data: userRow, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    authLog('error', 'user_lookup_failed', {
      emailHint: sanitizeIdentifier(normalizedEmail),
      error: error.message
    });
    throw new Error(`Database query failed: ${error.message}`);
  }

  return userRow;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (!SUPABASE_ENABLED || !supabase) {
    return res.status(500).json({ error: 'Supabase is not configured on this deployment.' });
  }

  const startedAt = Date.now();

  try {
    const body = await parseJsonBody(req);
    const { idToken } = body;

    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ error: 'Google ID token is required.' });
    }

    let googleUser;
    try {
      googleUser = await verifyGoogleIdToken(idToken);
    } catch (verifyError) {
      return res.status(401).json({
        error: verifyError instanceof Error ? verifyError.message : 'Google authentication failed.'
      });
    }

    const emailHint = sanitizeIdentifier(googleUser.email);
    authLog('info', 'token_verified', { emailHint, hasName: Boolean(googleUser.name) });

    const userRow = await lookupMemberByEmail(googleUser.email);

    if (!userRow) {
      authLog('info', 'email_not_found', { emailHint });

      const { data: application, error: appError } = await supabase
        .from('applications')
        .select('status, member_id, form_data')
        .eq('email', googleUser.email)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!appError && application) {
        const status = String(application.status || '').toLowerCase();
        if (status === 'pending') {
          return res.status(403).json({
            error: 'Your application is still pending review. You can sign in after approval.',
            status: 'pending',
            notApproved: true
          });
        }
        if (status === 'rejected') {
          return res.status(403).json({
            error: 'Your previous application was rejected. Please submit a new application to continue.',
            status: 'rejected',
            notApproved: true
          });
        }
      }

      return res.status(403).json({
        error: 'We couldn\'t find an approved membership for this Google account.',
        notApproved: true
      });
    }

    if (String(userRow.role || '').toLowerCase() !== 'member') {
      return res.status(403).json({
        error: 'This account is not a member account.',
        notApproved: true
      });
    }

    const membershipStatus = String(userRow.membership_status || '').toLowerCase();
    if (membershipStatus && membershipStatus !== 'active') {
      authLog('info', 'membership_not_active', {
        emailHint,
        memberId: userRow.membership_no || null,
        status: membershipStatus
      });
      return res.status(403).json({
        error: 'We couldn\'t find an approved membership for this Google account.',
        status: membershipStatus,
        notApproved: true
      });
    }

    const { token, expiresAt } = await createSignedSessionForUser(userRow);
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Expires=${expiresAt}; SameSite=Lax${secure}`);

    authLog('info', 'login_success', {
      emailHint,
      memberId: userRow.membership_no || null,
      userId: userRow.id || null,
      durationMs: Date.now() - startedAt
    });

    const publicUser = toPublicUser({
      ...userRow,
      name: userRow.name || googleUser.name
    });

    return res.status(200).json({
      success: true,
      user: publicUser
    });
  } catch (error) {
    authLog('error', 'unhandled_exception', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      durationMs: Date.now() - startedAt
    });
    return res.status(500).json({ error: 'Unable to process member login.' });
  }
}
