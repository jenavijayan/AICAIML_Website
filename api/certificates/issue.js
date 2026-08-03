import { supabase, SUPABASE_ENABLED } from '../_lib/supabaseClient.js';

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
    const { code, courseId, courseTitle } = body;
    if (!code || !courseId || !courseTitle) {
      return res.status(400).json({ error: 'Certificate code, course ID and title are required.' });
    }

    const { data: existing } = await supabase.from('certificates').select('*').eq('code', code).maybeSingle();
    if (existing) {
      return res.json({ success: true, message: 'Certificate already exists.' });
    }

    const { error } = await supabase.from('certificates').insert({
      code,
      user_id: 'anonymous',
      user_name: 'Anonymous User',
      course_id: courseId,
      course_title: courseTitle,
      issued_at: new Date().toISOString()
    });
    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error('Certificate issue error:', err);
    res.status(500).json({ error: err.message || 'Failed to issue certificate.' });
  }
};
