import loginHandler from '../server-lib/api-routes/auth/login.js';
import memberLoginHandler from '../server-lib/api-routes/auth/member-login.js';
import logoutHandler from '../server-lib/api-routes/auth/logout.js';
import meHandler from '../server-lib/api-routes/auth/me.js';
import adminHandler from '../server-lib/api-routes/admin/[[...path]].js';
import enquiryHandler from '../server-lib/api-routes/enquiry/submit.js';
import verifyRequestHandler from '../server-lib/api-routes/verification/request.js';
import verifyConfirmHandler from '../server-lib/api-routes/verification/confirm.js';

export default async function handler(req, res) {
  try {
    const url = req.url.split('?')[0];
    
    // Check if ENV is loaded
    if (!process.env.SUPABASE_URL) {
       console.error('CRITICAL: SUPABASE_URL is missing in production');
    }

    if (url === '/api/auth/login') return loginHandler(req, res);
    if (url === '/api/auth/member/login') return memberLoginHandler(req, res);
    if (url === '/api/auth/me') return meHandler(req, res);
    if (url === '/api/auth/logout') return logoutHandler(req, res);
    if (url === '/api/enquiry/submit') return enquiryHandler(req, res);
    if (url === '/api/verification/request') return verifyRequestHandler(req, res);
    if (url === '/api/verification/confirm') return verifyConfirmHandler(req, res);

    if (url.startsWith('/api/admin')) {
       const segments = url.replace('/api/admin/', '').split('/').filter(Boolean);
       req.query.path = segments;
       return adminHandler(req, res);
    }

    return adminHandler(req, res); // Catch-all for data tables
  } catch (err) {
    console.error('Master Controller Crash:', err);
    return res.status(500).json({ error: 'Server Crash', message: err.message });
  }
}
