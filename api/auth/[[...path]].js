import loginHandler from '../../server-lib/api-routes/auth/login.js';
import logoutHandler from '../../server-lib/api-routes/auth/logout.js';
import meHandler from '../../server-lib/api-routes/auth/me.js';
import memberLoginHandler from '../../server-lib/api-routes/auth/member-login.js';
import memberDashboardHandler from '../../server-lib/api-routes/auth/member-dashboard.js';
import memberGoogleHandler from '../../server-lib/api-routes/auth/member-google.js';
import memberSetPasswordHandler from '../../server-lib/api-routes/auth/member-set-password.js';

export default async function handler(req, res) {
  const path = req.query && req.query.path;
  const segments = Array.isArray(path) ? path : (path ? [path] : []);

  if (segments.length === 0 || segments[0] === 'login') {
    if (req.method === 'POST') return loginHandler(req, res);
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (segments[0] === 'logout') {
    return logoutHandler(req, res);
  }

  if (segments[0] === 'me') {
    return meHandler(req, res);
  }

  if (segments[0] === 'member') {
    if (segments[1] === 'login') {
      if (req.method === 'POST') return memberLoginHandler(req, res);
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed.' });
    }
    if (segments[1] === 'dashboard') {
      if (req.method === 'GET') return memberDashboardHandler(req, res);
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'Method not allowed.' });
    }
    if (segments[1] === 'google') {
      return memberGoogleHandler(req, res);
    }
    if (segments[1] === 'set-password') {
      return memberSetPasswordHandler(req, res);
    }
  }

  return res.status(404).json({ error: 'Not found.' });
}
