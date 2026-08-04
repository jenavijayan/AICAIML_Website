import adminHandler from '../../../../server-lib/api-routes/admin/[[...path]].js';

function resolveId(req) {
  const raw = req.query?.id;
  if (Array.isArray(raw)) return raw[0] || '';
  if (typeof raw === 'string') return raw;

  try {
    const pathname = new URL(req.url || '/', 'http://localhost').pathname;
    const segments = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
    const idx = segments.indexOf('applications');
    return idx >= 0 && segments[idx + 1] ? segments[idx + 1] : '';
  } catch {
    return '';
  }
}

export default async function handler(req, res) {
  req.query = req.query || {};
  req.query.path = ['applications', resolveId(req), 'approve'];
  return adminHandler(req, res);
}
