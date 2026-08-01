const { supabase, SUPABASE_ENABLED } = require('../_lib/supabaseClient');

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

module.exports = async function handler(req, res) {
  if (!SUPABASE_ENABLED) {
    return res.status(500).json({ error: 'Supabase is not configured on this deployment.' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const body = await parseJsonBody(req);
    const { title, summary, category, readTime } = body;
    if (!title || !summary) {
      return res.status(400).json({ error: 'Title and summary are required' });
    }
    const article = {
      id: 'news-' + Date.now(),
      title,
      summary,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      category: category || 'Announcement',
      read_time: readTime || '3 min read',
      created_at: new Date().toISOString()
    };
    const { error } = await supabase.from('news').insert(article);
    if (error) throw error;
    res.json({ success: true, article });
  } catch (err) {
    console.error('News add error:', err);
    res.status(500).json({ error: err.message || 'Failed to add news.' });
  }
};
