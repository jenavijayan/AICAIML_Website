import { SESSION_COOKIE, getFallbackUser, getSupabaseUser, createSupabaseSession, seedDevUser, parseJsonBody } from '../../authFallback.js';

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
    if (!user) {
      user = getFallbackUser(email, password);
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
