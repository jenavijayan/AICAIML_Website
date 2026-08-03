import { supabase, SUPABASE_ENABLED } from '../../supabaseClient.js';

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
      resolve(req.body);
      return;
    }
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      if (!data) { resolve({}); return; }
      try { resolve(JSON.parse(data)); }
      catch {
        try {
          const parsed = new URLSearchParams(data);
          const result = {};
          parsed.forEach((value, key) => { result[key] = value; });
          resolve(result);
        } catch { reject(new Error('Invalid JSON body')); }
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (!SUPABASE_ENABLED) {
    return res.status(500).json({ error: 'Supabase is not configured on this deployment.' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const body = await parseJsonBody(req);
    const { applicationId, code } = body;
    if (!applicationId || !code) {
      return res.status(400).json({ error: 'Application ID and verification code are required.' });
    }

    const { data: application, error: fetchError } = await supabase.from('applications').select('*').eq('id', applicationId).maybeSingle();
    if (fetchError || !application) {
      return res.status(404).json({ error: 'Application not found.' });
    }
    if (application.verification_code !== code) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }
    if (application.email_verified === 'true') {
      return res.status(400).json({ error: 'Email is already verified.' });
    }

    const { error: updateError } = await supabase.from('applications').update({ email_verified: 'true' }).eq('id', applicationId);
    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    res.json({ success: true, message: 'Email verified successfully.' });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ error: err.message || 'Failed to verify email.' });
  }
};
