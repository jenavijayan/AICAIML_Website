import {
  SESSION_COOKIE,
  getSupabaseUser,
  getFallbackUser,
  createSupabaseSession,
  parseJsonBody,
  verifyGoogleToken,
  getOrCreateGoogleUser
} from '../../authFallback.js';

function setSessionCookie(res, token, expiresAt) {
  const expires = new Date(expiresAt).toUTCString();
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Expires=${expires}; SameSite=Lax`);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const body = await parseJsonBody(req);
    const { idToken } = body;

    if (!idToken) {
      return res.status(400).json({ error: 'Google ID token is required.' });
    }

    const googleUser = await verifyGoogleToken(idToken);
    if (!googleUser) {
      return res.status(401).json({ error: 'Google sign-in failed. Please try again.' });
    }

    const user = await getOrCreateGoogleUser(googleUser);
    if (!user) {
      return res.status(403).json({
        error: 'No approved AICAIML membership found for this Google account. Please submit a membership application and wait for approval.'
      });
    }

    const { token, expiresAt } = await createSupabaseSession(user.id);
    setSessionCookie(res, token, expiresAt);
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Google login error:', error);
    return res.status(500).json({ error: 'Unable to process Google login request.' });
  }
};
