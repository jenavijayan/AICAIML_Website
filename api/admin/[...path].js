import handler from '../../server-lib/api-routes/admin/[[...path]].js';

export default async function(req, res) {
  if (!req.query.path) {
    const urlParts = req.url.split('?')[0].split('/').filter(Boolean);
    req.query.path = urlParts.slice(2);
  }
  return handler(req, res);
}
