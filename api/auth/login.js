const { SESSION_COOKIE, getFallbackUser, createSignedSessionToken, parseJsonBody } = require('../_lib/authFallback');

module.exports = async function handler(req, res) {
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

    const user = getFallbackUser(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = createSignedSessionToken(user);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Expires=${expiresAt.toUTCString()}; SameSite=Lax`);
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to process login request.' });
  }
};
