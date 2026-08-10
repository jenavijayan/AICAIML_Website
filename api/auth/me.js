import { getSupabaseSessionUser, verifySignedSessionToken, parseCookies, SESSION_COOKIE, toPublicUser } from '../../server-lib/authFallback.js';

export default async function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[SESSION_COOKIE];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  let user = await getSupabaseSessionUser(token);
  if (!user) user = verifySignedSessionToken(token);
  if (!user) return res.status(401).json({ error: 'Invalid session' });

  return res.status(200).json({ user: toPublicUser(user) });
}
