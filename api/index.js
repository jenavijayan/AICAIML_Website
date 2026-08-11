import loginHandler from '../server-lib/api-routes/auth/login.js';
import memberLoginHandler from '../server-lib/api-routes/auth/member-login.js';
import logoutHandler from '../server-lib/api-routes/auth/logout.js';
import meHandler from '../server-lib/api-routes/auth/me.js';
import memberDashboardHandler from '../server-lib/api-routes/auth/member-dashboard.js';
import verifyRequestHandler from '../server-lib/api-routes/verification/request.js';
import verifyConfirmHandler from '../server-lib/api-routes/verification/confirm.js';
import enquiryHandler from '../server-lib/api-routes/enquiry/submit.js';
import membershipHandler from '../server-lib/api-routes/membership/submit.js';
import adminHandler from '../server-lib/api-routes/admin/[[...path]].js';
import newsHandler from '../server-lib/api-routes/news.js';
import eventsHandler from '../server-lib/api-routes/events.js';
import partnersHandler from '../server-lib/api-routes/partners.js';
import testimonialsHandler from '../server-lib/api-routes/testimonials.js';
import projectsHandler from '../server-lib/api-routes/projects.js';
import coursesHandler from '../server-lib/api-routes/courses.js';

export default async function handler(req, res) {
  const url = req.url.split('?')[0].replace(/\/$/, '');
  
  try {
    // 1. Auth Logic
    if (url === '/api/auth/login') return loginHandler(req, res);
    if (url === '/api/auth/member/login') return memberLoginHandler(req, res);
    if (url === '/api/auth/me') return meHandler(req, res);
    if (url === '/api/auth/logout') return logoutHandler(req, res);
    if (url === '/api/auth/member/dashboard') return memberDashboardHandler(req, res);
    
    // 2. Verification Logic
    if (url === '/api/verification/request') return verifyRequestHandler(req, res);
    if (url === '/api/verification/confirm') return verifyConfirmHandler(req, res);
    
    // 3. Form Submissions (CRITICAL FIX FOR INVALID PATH)
    if (url === '/api/enquiry/submit') {
      req.query.path = ['submit'];
      return enquiryHandler(req, res);
    }
    if (url === '/api/membership/submit') {
      req.query.path = ['submit'];
      return membershipHandler(req, res);
    }
    
    // 4. CMS Content
    if (url === '/api/news') return newsHandler(req, res);
    if (url === '/api/events') return eventsHandler(req, res);
    if (url === '/api/partners') return partnersHandler(req, res);
    if (url === '/api/testimonials') return testimonialsHandler(req, res);
    if (url === '/api/projects') return projectsHandler(req, res);
    if (url === '/api/courses') return coursesHandler(req, res);

    // 5. Admin Panel (CRITICAL FIX FOR INVALID PATH)
    if (url.startsWith('/api/admin')) {
      // If URL is /api/admin/applications, segments becomes ['applications']
      const segments = url.split('/').filter(val => val && val !== 'api' && val !== 'admin');
      req.query.path = segments;
      return adminHandler(req, res);
    }

    return res.status(404).json({ error: 'Route not found', path: url });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}
