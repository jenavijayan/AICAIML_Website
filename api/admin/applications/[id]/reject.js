import adminHandler from '../../../../server-lib/api-routes/admin/[[...path]].js';

function setAdminQuery(req) {
  req.query = req.query || {};
  const id = req.query.id || (req.url ? req.url.split('/').pop().split('?')[0] : '');
  req.query.path = ['applications', id, 'reject'];
}

export default async function handler(req, res) {
  try {
    setAdminQuery(req);
    return await adminHandler(req, res);
  } catch (err) {
    console.error('Admin reject route error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error.' });
  }
}
