import adminHandler from '../../server-lib/api-routes/admin/[[...path]].js';

export default async function handler(req, res) {
  try {
    return await adminHandler(req, res);
  } catch (err) {
    console.error('Admin serverless function error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error.' });
  }
}
