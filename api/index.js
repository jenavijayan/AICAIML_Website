import healthHandler from '../server-lib/api-routes/health.js';
import authLoginHandler from '../server-lib/api-routes/auth/login.js';
import authLogoutHandler from '../server-lib/api-routes/auth/logout.js';
import authMeHandler from '../server-lib/api-routes/auth/me.js';
import verifyHandler from '../server-lib/api-routes/verify.js';
import testimonialsHandler from '../server-lib/api-routes/testimonials.js';
import verificationRequestHandler from '../server-lib/api-routes/verification/request.js';
import verificationConfirmHandler from '../server-lib/api-routes/verification/confirm.js';
import newsAddHandler from '../server-lib/api-routes/news/add.js';
import newsHandler from '../server-lib/api-routes/news.js';
import coursesHandler from '../server-lib/api-routes/courses.js';
import projectsHandler from '../server-lib/api-routes/projects.js';
import enquirySubmitHandler from '../server-lib/api-routes/enquiry/submit.js';
import membershipVerifyEmailHandler from '../server-lib/api-routes/membership/verify-email.js';
import membershipSubmitHandler from '../server-lib/api-routes/membership/submit.js';
import membershipCheckoutHandler from '../server-lib/api-routes/membership/checkout.js';
import eventsRegisterHandler from '../server-lib/api-routes/events/register.js';
import partnersHandler from '../server-lib/api-routes/partners.js';
import eventsHandler from '../server-lib/api-routes/events.js';
import certificatesIssueHandler from '../server-lib/api-routes/certificates/issue.js';
import adminUploadHandler from '../server-lib/api-routes/admin/upload.js';
import adminHandler from '../server-lib/api-routes/admin/[[...path]].js';

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = url.pathname;

  if (pathname.startsWith('/api')) {
    pathname = pathname.slice(4);
    if (!pathname.startsWith('/')) pathname = '/' + pathname;
  }

  if (pathname === '/api/health' || pathname === '/health') {
    return healthHandler(req, res);
  }

  if ((pathname === '/api/auth/login' || pathname === '/auth/login') && req.method === 'POST') {
    return authLoginHandler(req, res);
  }
  if ((pathname === '/api/auth/logout' || pathname === '/auth/logout') && req.method === 'POST') {
    return authLogoutHandler(req, res);
  }
  if ((pathname === '/api/auth/me' || pathname === '/auth/me') && req.method === 'GET') {
    return authMeHandler(req, res);
  }

  if ((pathname === '/api/courses' || pathname === '/courses') && req.method === 'GET') {
    return coursesHandler(req, res);
  }
  if ((pathname === '/api/projects' || pathname === '/projects') && req.method === 'GET') {
    return projectsHandler(req, res);
  }
  if ((pathname === '/api/events' || pathname === '/events') && req.method === 'GET') {
    return eventsHandler(req, res);
  }
  if ((pathname === '/api/events/register' || pathname === '/events/register') && req.method === 'POST') {
    return eventsRegisterHandler(req, res);
  }
  if ((pathname === '/api/partners' || pathname === '/partners') && req.method === 'GET') {
    return partnersHandler(req, res);
  }
  if ((pathname === '/api/testimonials' || pathname === '/testimonials') && req.method === 'GET') {
    return testimonialsHandler(req, res);
  }
  if ((pathname === '/api/news' || pathname === '/news') && req.method === 'GET') {
    return newsHandler(req, res);
  }
  if ((pathname === '/api/news/add' || pathname === '/news/add') && req.method === 'POST') {
    return newsAddHandler(req, res);
  }
  if ((pathname === '/api/enquiry/submit' || pathname === '/enquiry/submit') && req.method === 'POST') {
    return enquirySubmitHandler(req, res);
  }
  if ((pathname === '/api/membership/submit' || pathname === '/membership/submit') && req.method === 'POST') {
    return membershipSubmitHandler(req, res);
  }
  if ((pathname === '/api/membership/checkout' || pathname === '/membership/checkout') && req.method === 'POST') {
    return membershipCheckoutHandler(req, res);
  }
  if ((pathname === '/api/membership/verify-email' || pathname === '/membership/verify-email') && req.method === 'POST') {
    return membershipVerifyEmailHandler(req, res);
  }
  if ((pathname === '/api/verification/request' || pathname === '/verification/request') && req.method === 'POST') {
    return verificationRequestHandler(req, res);
  }
  if ((pathname === '/api/verification/confirm' || pathname === '/verification/confirm') && req.method === 'POST') {
    return verificationConfirmHandler(req, res);
  }
  if ((pathname === '/api/certificates/issue' || pathname === '/certificates/issue') && req.method === 'POST') {
    return certificatesIssueHandler(req, res);
  }
  if ((pathname === '/api/verify' || pathname === '/verify') && req.method === 'GET') {
    return verifyHandler(req, res);
  }

  if ((pathname === '/api/admin/upload' || pathname === '/admin/upload') && req.method === 'POST') {
    return adminUploadHandler(req, res);
  }

  if (pathname.startsWith('/api/admin/') || pathname.startsWith('/admin/')) {
    const adminPath = pathname.replace(/^\/(?:api\/)?admin\//, '').split('/').filter(Boolean);
    if (adminPath.length === 0 && req.method === 'GET') {
      req.query = { path: ['overview'] };
      return adminHandler(req, res);
    }
    req.query = { path: adminPath };
    return adminHandler(req, res);
  }

  if ((pathname === '/api/auth/change-password' || pathname === '/auth/change-password') && req.method === 'GET') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  return res.status(404).json({ error: 'Not found.' });
}
