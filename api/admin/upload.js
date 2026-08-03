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
    const { fileData, filename } = body;
    if (!fileData) return res.status(400).json({ error: 'No file provided. Send base64 data URL in fileData.' });

    const matches = fileData.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return res.status(400).json({ error: 'Invalid data URL format.' });

    const ext = matches[1].split('/')[1]?.split('+')[0] || 'bin';
    const buffer = Buffer.from(matches[2], 'base64');
    const safeName = String(filename || 'upload-' + Date.now()).replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const finalName = `${Date.now()}-${safeName}`;

    const { error } = await supabase.storage.from('uploads').upload(finalName, buffer, {
      contentType: matches[1],
      upsert: true
    });
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(finalName);
    res.json({ success: true, url: urlData.publicUrl });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload file.' });
  }
};
