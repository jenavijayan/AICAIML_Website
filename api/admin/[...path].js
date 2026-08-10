import healthHandler from '../../server-lib/api-routes/health.js';
import authLoginHandler from '../auth/login.js';
import authLogoutHandler from '../../server-lib/api-routes/auth/logout.js';
import authMeHandler from '../../server-lib/api-routes/auth/me.js';
import memberLoginHandler from '../../server-lib/api-routes/auth/member-login.js';
import memberSetPasswordHandler from '../../server-lib/api-routes/auth/member-set-password.js';
import memberDashboardHandler from '../../server-lib/api-routes/auth/member-dashboard.js';
import memberGoogleHandler from '../../server-lib/api-routes/auth/member-google.js';
import verifyHandler from '../../server-lib/api-routes/verify.js';
import testimonialsHandler from '../../server-lib/api-routes/testimonials.js';
import verificationRequestHandler from '../../server-lib/api-routes/verification/request.js';
import verificationConfirmHandler from '../../server-lib/api-routes/verification/confirm.js';
import newsAddHandler from '../../server-lib/api-routes/news/add.js';
import newsHandler from '../../server-lib/api-routes/news.js';
import coursesHandler from '../../server-lib/api-routes/courses.js';
import projectsHandler from '../../server-lib/api-routes/projects.js';
import enquirySubmitHandler from '../../server-lib/api-routes/enquiry/submit.js';
import membershipVerifyEmailHandler from '../../server-lib/api-routes/membership/verify-email.js';
import membershipSubmitHandler from '../../server-lib/api-routes/membership/submit.js';
import membershipCheckoutHandler from '../../server-lib/api-routes/membership/checkout.js';
import eventsRegisterHandler from '../../server-lib/api-routes/events/register.js';
import partnersHandler from '../../server-lib/api-routes/partners.js';
import eventsHandler from '../../server-lib/api-routes/events.js';
import certificatesIssueHandler from '../../server-lib/api-routes/certificates/issue.js';
import adminUploadHandler from '../../server-lib/api-routes/admin/upload.js';
import adminHandler from '../../server-lib/api-routes/admin/[[...path]].js';
import { parseJsonBody, resetTestAccount } from '../../server-lib/authFallback.js';

function resolvePath(req) {
	const segments = req.query && req.query.path;
	if (Array.isArray(segments) && segments.length > 0) {
		return '/' + segments.join('/');
	}
	if (typeof segments === 'string' && segments.trim() !== '') {
		return '/' + segments.split('/').filter(Boolean).join('/');
	}

	let path = req.url || '';
	if (path.includes('?')) path = path.split('?')[0];
	path = path.replace(/\/+$/, '');

	if (path.startsWith('http://') || path.startsWith('https://')) {
		try {
			path = new URL(path).pathname;
		} catch {
			// ignore
		}
	}

	return path;
}

export default async function handler(req, res) {
	const method = req.method || 'GET';
	const path = resolvePath(req);

	if (method === 'GET' && (path === '/health' || path === '/api/health')) {
		return healthHandler(req, res);
	}

	if (method === 'POST' && (path === '/auth/login' || path === '/api/auth/login')) {
		return authLoginHandler(req, res);
	}
	if (method === 'POST' && (path === '/auth/logout' || path === '/api/auth/logout')) {
		return authLogoutHandler(req, res);
	}
	if (method === 'GET' && (path === '/auth/me' || path === '/api/auth/me')) {
		return authMeHandler(req, res);
	}
	if (method === 'POST' && (path === '/auth/member/login' || path === '/api/auth/member/login')) {
		return memberLoginHandler(req, res);
	}
	if (method === 'POST' && (path === '/auth/member/google' || path === '/api/auth/member/google')) {
		return memberGoogleHandler(req, res);
	}
	if (method === 'POST' && (path === '/auth/member/set-password' || path === '/api/auth/member/set-password')) {
		return memberSetPasswordHandler(req, res);
	}
	if (method === 'GET' && (path === '/auth/member/dashboard' || path === '/api/auth/member/dashboard')) {
		return memberDashboardHandler(req, res);
	}

	if (method === 'GET' && (path === '/courses' || path === '/api/courses')) {
		return coursesHandler(req, res);
	}
	if (method === 'GET' && (path === '/projects' || path === '/api/projects')) {
		return projectsHandler(req, res);
	}
	if (method === 'GET' && (path === '/events' || path === '/api/events')) {
		return eventsHandler(req, res);
	}
	if (method === 'POST' && (path === '/events/register' || path === '/api/events/register')) {
		return eventsRegisterHandler(req, res);
	}
	if (method === 'GET' && (path === '/partners' || path === '/api/partners')) {
		return partnersHandler(req, res);
	}
	if (method === 'GET' && (path === '/testimonials' || path === '/api/testimonials')) {
		return testimonialsHandler(req, res);
	}
	if (method === 'GET' && (path === '/news' || path === '/api/news')) {
		return newsHandler(req, res);
	}
	if (method === 'POST' && (path === '/news/add' || path === '/api/news/add')) {
		return newsAddHandler(req, res);
	}
	if (method === 'POST' && (path === '/enquiry/submit' || path === '/api/enquiry/submit')) {
		return enquirySubmitHandler(req, res);
	}
	if (method === 'POST' && (path === '/membership/submit' || path === '/api/membership/submit')) {
		return membershipSubmitHandler(req, res);
	}
	if (method === 'POST' && (path === '/membership/checkout' || path === '/api/membership/checkout')) {
		return membershipCheckoutHandler(req, res);
	}
	if (method === 'POST' && (path === '/membership/verify-email' || path === '/api/membership/verify-email')) {
		return membershipVerifyEmailHandler(req, res);
	}
	if (method === 'POST' && (path === '/verification/request' || path === '/api/verification/request')) {
		return verificationRequestHandler(req, res);
	}
	if (method === 'POST' && (path === '/verification/confirm' || path === '/api/verification/confirm')) {
		return verificationConfirmHandler(req, res);
	}
	if (method === 'POST' && (path === '/certificates/issue' || path === '/api/certificates/issue')) {
		return certificatesIssueHandler(req, res);
	}
	if (method === 'GET' && (path === '/verify' || path === '/api/verify')) {
		return verifyHandler(req, res);
	}

	if (method === 'POST' && (path === '/admin/upload' || path === '/api/admin/upload')) {
		return adminUploadHandler(req, res);
	}

	if (path === '/admin' || path === '/api/admin' || path.startsWith('/admin/') || path.startsWith('/api/admin/')) {
		const adminPath = path.replace(/^\/(?:api\/)?admin\/?/, '').split('/').filter(Boolean);
		if (adminPath.length === 0 && method === 'GET') {
			req.query = req.query || {};
			req.query.path = ['overview'];
			return adminHandler(req, res);
		}
		req.query = req.query || {};
		req.query.path = adminPath;
		return adminHandler(req, res);
	}

   if ((path === '/auth/change-password' || path === '/api/auth/change-password') && method === 'GET') {
     return res.status(405).json({ error: 'Method not allowed.' });
   }

   // Dev-only: reset a test account
   if (method === 'POST' && (path === '/dev/reset-account' || path === '/api/dev/reset-account')) {
     if (process.env.NODE_ENV !== 'development') {
       return res.status(404).json({ error: 'Not found.' });
     }
     const body = await parseJsonBody(req);
     const { email } = body;
     if (!email) {
       return res.status(400).json({ error: 'Email is required.' });
     }
     const cleanEmail = String(email).trim().toLowerCase();
     const result = await resetTestAccount(cleanEmail);
     if (process.env.NODE_ENV === 'development') {
       console.log(`[DEV RESET] Cleared test account for ${cleanEmail}: success=${result.success}`);
     }
     return res.status(200).json(result);
   }

   return res.status(404).json({ error: 'Not found.' });
}
