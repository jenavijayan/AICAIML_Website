import adminHandler from '../server-lib/api-routes/admin/[[...path]].js';
import loginHandler from '../server-lib/api-routes/auth/login.js';
import memberLoginHandler from '../server-lib/api-routes/auth/member-login.js';
import logoutHandler from '../server-lib/api-routes/auth/logout.js';
import meHandler from '../server-lib/api-routes/auth/me.js';
import verifyRequestHandler from '../server-lib/api-routes/verification/request.js';
import verifyConfirmHandler from '../server-lib/api-routes/verification/confirm.js';
import enquiryHandler from '../server-lib/api-routes/enquiry/submit.js';

export default async function handler(req, res) {
  const url = req.url || '';
  
  if (url.startsWith('/api/admin')) return adminHandler(req, res);
  if (url === '/api/auth/login') return loginHandler(req, res);
  if (url === '/api/auth/member/login') return memberLoginHandler(req, res);
  if (url === '/api/auth/me') return meHandler(req, res);
  if (url === '/api/auth/logout') return logoutHandler(req, res);
  if (url === '/api/verification/request') return verifyRequestHandler(req, res);
  if (url === '/api/verification/confirm') return verifyConfirmHandler(req, res);
  if (url === '/api/enquiry/submit') return enquiryHandler(req, res);

  return adminHandler(req, res);
}
