import requestHandler from '../../server-lib/api-routes/verification/request.js';
import confirmHandler from '../../server-lib/api-routes/verification/confirm.js';

export default async function handler(req, res) {
  const path = req.query && req.query.path;
  const segments = Array.isArray(path) ? path : (path ? [path] : []);

  if (segments[0] === 'request' || segments.length === 0) {
    if (req.method === 'POST') return requestHandler(req, res);
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (segments[0] === 'confirm') {
    if (req.method === 'POST') return confirmHandler(req, res);
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  return res.status(404).json({ error: 'Not found.' });
}
