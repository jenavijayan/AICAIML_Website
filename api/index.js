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

function getPath(req) {
  let path = req.url || '';
  if (path.includes('?')) path = path.split('?')[0];
  return path.replace(/\/+$/, '');
}

export default async function handler(req, res) {
  const method = req.method || 'GET';
  const path = getPath(req);

  if (method === 'GET' && (path === '/api/health' || path === '/health')) {
    return healthHandler(req, res);
  }

  if (method === 'POST' && (path === '/api/auth/login' || path === '/auth/login')) {
    return authLoginHandler(req, res);
  }
  if (method === 'POST' && (path === '/api/auth/logout' || path === '/auth/logout')) {
    return authLogoutHandler(req, res);
  }
  if (method === 'GET' && (path === '/api/auth/me' || path === '/auth/me')) {
    return authMeHandler(req, res);
  }

  if (method === 'GET' && (path === '/api/courses' || path === '/courses')) {
    return coursesHandler(req, res);
  }
  if (method === 'GET' && (path === '/api/projects' || path === '/projects')) {
    return projectsHandler(req, res);
  }
  if (method === 'GET' && (path === '/api/events' || path === '/events')) {
    return eventsHandler(req, res);
  }
  if (method === 'POST' && (path === '/api/events/register' || path === '/events/register')) {
    return eventsRegisterHandler(req, res);
  }
  if (method === 'GET' && (path === '/api/partners' || path === '/partners')) {
    return partnersHandler(req, res);
  }
  if (method === 'GET' && (path === '/api/testimonials' || path === '/testimonials')) {
    return testimonialsHandler(req, res);
  }
  if (method === 'GET' && (path === '/api/news' || path === '/news')) {
    return newsHandler(req, res);
  }
  if (method === 'POST' && (path === '/api/news/add' || path === '/news/add')) {
    return newsAddHandler(req, res);
  }
  if (method === 'POST' && (path === '/api/enquiry/submit' || path === '/enquiry/submit')) {
    return enquirySubmitHandler(req, res);
  }
  if (method === 'POST' && (path === '/api/membership/submit' || path === '/membership/submit')) {
    return membershipSubmitHandler(req, res);
  }
  if (method === 'POST' && (path === '/api/membership/checkout' || path === '/membership/checkout')) {
    return membershipCheckoutHandler(req, res);
  }
  if (method === 'POST' && (path === '/api/membership/verify-email' || path === '/membership/verify-email')) {
    return membershipVerifyEmailHandler(req, res);
  }
  if (method === 'POST' && (path === '/api/verification/request' || path === '/verification/request')) {
    return verificationRequestHandler(req, res);
  }
  if (method === 'POST' && (path === '/api/verification/confirm' || path === '/verification/confirm')) {
    return verificationConfirmHandler(req, res);
  }
  if (method === 'POST' && (path === '/api/certificates/issue' || path === '/certificates/issue')) {
    return certificatesIssueHandler(req, res);
  }
  if (method === 'GET' && (path === '/api/verify' || path === '/verify')) {
    return verifyHandler(req, res);
  }

  if (method === 'POST' && (path === '/api/admin/upload' || path === '/admin/upload')) {
    return adminUploadHandler(req, res);
  }

  if (path === '/api/admin' || path === '/admin' || path.startsWith('/api/admin/') || path.startsWith('/admin/')) {
    const adminPath = path.replace(/^\/(?:api\/)?admin\/?/, '').split('/').filter(Boolean);
    if (adminPath.length === 0 && method === 'GET') {
      req.query = { path: ['overview'] };
      return adminHandler(req, res);
    }
    req.query = { path: adminPath };
    return adminHandler(req, res);
  }

  if ((path === '/api/auth/change-password' || path === '/auth/change-password') && method === 'GET') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  return res.status(404).json({ error: 'Not found.' });
}
