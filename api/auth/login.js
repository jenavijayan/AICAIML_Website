const {
  SESSION_COOKIE,
  getFallbackUser,
  getSupabaseUser,
  createSupabaseSession,
  seedDevUser,
  parseJsonBody
} = require('../_lib/authFallback');

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

    let user = await getSupabaseUser(email, password);
    if (!user) {
      user = getFallbackUser(email, password);
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const { token, expiresAt } = await createSupabaseSession(user.id);
    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Expires=${expiresAt}; SameSite=Lax`);
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Unable to process login request.' });
  }
};
