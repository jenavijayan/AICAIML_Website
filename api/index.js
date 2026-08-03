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
  const pathname = url.pathname;

  if (req.method === 'GET' && pathname === '/api/health') {
    return healthHandler(req, res);
  }

  if (req.method === 'POST' && pathname === '/api/auth/login') {
    return authLoginHandler(req, res);
  }
  if (req.method === 'POST' && pathname === '/api/auth/logout') {
    return authLogoutHandler(req, res);
  }
  if (req.method === 'GET' && pathname === '/api/auth/me') {
    return authMeHandler(req, res);
  }

  if (req.method === 'GET' && pathname === '/api/courses') {
    return coursesHandler(req, res);
  }
  if (req.method === 'GET' && pathname === '/api/projects') {
    return projectsHandler(req, res);
  }
  if (req.method === 'GET' && pathname === '/api/events') {
    return eventsHandler(req, res);
  }
  if (req.method === 'POST' && pathname === '/api/events/register') {
    return eventsRegisterHandler(req, res);
  }
  if (req.method === 'GET' && pathname === '/api/partners') {
    return partnersHandler(req, res);
  }
  if (req.method === 'GET' && pathname === '/api/testimonials') {
    return testimonialsHandler(req, res);
  }
  if (req.method === 'GET' && pathname === '/api/news') {
    return newsHandler(req, res);
  }
  if (req.method === 'POST' && pathname === '/api/news/add') {
    return newsAddHandler(req, res);
  }
  if (req.method === 'POST' && pathname === '/api/enquiry/submit') {
    return enquirySubmitHandler(req, res);
  }
  if (req.method === 'POST' && pathname === '/api/membership/submit') {
    return membershipSubmitHandler(req, res);
  }
  if (req.method === 'POST' && pathname === '/api/membership/checkout') {
    return membershipCheckoutHandler(req, res);
  }
  if (req.method === 'POST' && pathname === '/api/membership/verify-email') {
    return membershipVerifyEmailHandler(req, res);
  }
  if (req.method === 'POST' && pathname === '/api/verification/request') {
    return verificationRequestHandler(req, res);
  }
  if (req.method === 'POST' && pathname === '/api/verification/confirm') {
    return verificationConfirmHandler(req, res);
  }
  if (req.method === 'POST' && pathname === '/api/certificates/issue') {
    return certificatesIssueHandler(req, res);
  }
  if (req.method === 'GET' && pathname === '/api/verify') {
    return verifyHandler(req, res);
  }

  if (req.method === 'POST' && pathname === '/api/admin/upload') {
    return adminUploadHandler(req, res);
  }

  if (pathname.startsWith('/api/admin/')) {
    const adminPath = pathname.replace('/api/admin/', '');
    const segments = adminPath.split('/').filter(Boolean);
    if (segments.length === 0 && req.method === 'GET') {
      req.query = { path: ['overview'] };
      return adminHandler(req, res);
    }
    req.query = { path: segments };
    return adminHandler(req, res);
  }

  if (req.method === 'GET' && pathname === '/api/auth/change-password') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  return res.status(404).json({ error: 'Not found.' });
}
