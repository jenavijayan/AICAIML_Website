import verifyRequestHandler from '../server-lib/api-routes/verification/request.js';
import verifyConfirmHandler from '../server-lib/api-routes/verification/confirm.js';
import enquiryHandler from '../server-lib/api-routes/enquiry/submit.js';

export default async function handler(req, res) {
  const url = req.url || '';

  if (url === '/api/verification/request' || url === '/api/verification/request/') {
    if (req.method === 'POST') return verifyRequestHandler(req, res);
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (url === '/api/verification/confirm' || url === '/api/verification/confirm/') {
    if (req.method === 'POST') return verifyConfirmHandler(req, res);
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (url === '/api/enquiry/submit' || url === '/api/enquiry/submit/') {
    if (req.method === 'POST') return enquiryHandler(req, res);
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  return res.status(404).json({ error: 'Not found.' });
}
