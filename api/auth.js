import loginHandler from '../server-lib/api-routes/auth/login.js';
import memberLoginHandler from '../server-lib/api-routes/auth/member-login.js';
import meHandler from '../server-lib/api-routes/auth/me.js';
import logoutHandler from '../server-lib/api-routes/auth/logout.js';

export default async function handler(req, res) {
  const url = req.url || '';

  if (url === '/api/auth/login' || url === '/api/auth') {
    if (req.method === 'POST') return loginHandler(req, res);
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (url === '/api/auth/member/login') {
    if (req.method === 'POST') return memberLoginHandler(req, res);
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (url === '/api/auth/me') {
    return meHandler(req, res);
  }

  if (url === '/api/auth/logout') {
    return logoutHandler(req, res);
  }

  return res.status(404).json({ error: 'Not found.' });
}
