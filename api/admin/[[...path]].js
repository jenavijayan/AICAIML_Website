import adminHandler from '../../server-lib/api-routes/admin/[[...path]].js';

function resolveAdminPath(req) {
	const queryPath = req.query?.path;

	if (Array.isArray(queryPath) && queryPath.length > 0) {
		return queryPath;
	}

	if (typeof queryPath === 'string' && queryPath.trim() !== '') {
		return queryPath.split('/').filter(Boolean);
	}

	let pathname = '';
	try {
		pathname = new URL(req.url || '/', 'http://localhost').pathname;
	} catch {
		pathname = (req.url || '/').split('?')[0];
	}

	const segments = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
	const adminIndex = segments.indexOf('admin');
	if (adminIndex === -1) return [];
	return segments.slice(adminIndex + 1);
}

export default async function handler(req, res) {
	req.query = req.query || {};
	req.query.path = resolveAdminPath(req);
	return adminHandler(req, res);
}
