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
    const body = await parseJsonBody(req);
    const identifier = normalizeIdentifier(body.identifier || body.email || body.memberId);
    const password = String(body.password || '');

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password are required.' });
    }

    const isEmail = identifier.includes('@');
    let userRow = null;

    if (isEmail) {
      const query = await supabase.from('users').select('*').eq('email', identifier.toLowerCase()).maybeSingle();
      if (query.error) {
        return res.status(500).json({ error: query.error.message });
      }
      userRow = query.data;
    } else {
      const query = await supabase.from('users').select('*').eq('membership_no', identifier.toUpperCase()).maybeSingle();
      if (query.error) {
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

    if (!verifyPassword(password, userRow.password_hash, userRow.password_salt)) {
      return res.status(401).json({ error: 'Invalid member credentials.' });
    }

    if (userRow.must_reset_password) {
      return res.status(403).json({
        error: 'Password setup is required before first sign-in. Please use the link sent to your email.',
        code: 'PASSWORD_SETUP_REQUIRED'
      });
    }

    const { token, expiresAt } = await createSupabaseSession(userRow.id);
    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Expires=${expiresAt}; SameSite=Lax`);
    return res.status(200).json({ success: true, user: toPublicUser(userRow) });
  } catch (error) {
    console.error('Member login error:', error);
    return res.status(500).json({ error: 'Unable to process member login.' });
  }
}
