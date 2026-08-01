const {
  SESSION_COOKIE,
  parseCookies,
  getSupabaseSessionUser,
  verifySignedSessionToken
} = require('../_lib/authFallback');

module.exports = async function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[SESSION_COOKIE];

  let user = await getSupabaseSessionUser(token);
  if (!user) {
    user = verifySignedSessionToken(token);
  }
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  return res.status(200).json({ user });
};
